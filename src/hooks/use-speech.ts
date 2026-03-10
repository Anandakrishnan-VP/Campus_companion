import { useState, useCallback, useRef, useEffect } from "react";

interface UseSpeechReturn {
  isListening: boolean;
  startListening: (onResult: (text: string) => void) => void;
  stopListening: () => void;
  speak: (text: string) => Promise<void>;
  isSpeaking: boolean;
  stopSpeaking: () => void;
  supported: boolean;
}

const SpeechRecognitionAPI =
  typeof window !== "undefined"
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

export function useSpeech(): UseSpeechReturn {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);
  const onResultRef = useRef<((text: string) => void) | null>(null);
  const finalTranscriptRef = useRef("");
  const supported =
    typeof window !== "undefined" && !!SpeechRecognitionAPI && !!window.speechSynthesis;

  // Preload voices
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  const startListening = useCallback((onResult: (text: string) => void) => {
    if (!SpeechRecognitionAPI) return;

    // Stop any ongoing recognition
    recognitionRef.current?.abort();

    onResultRef.current = onResult;
    finalTranscriptRef.current = "";

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      console.log("[Speech] Recognition started");
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = 0; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += t;
        } else {
          interim += t;
        }
      }
      if (final) {
        finalTranscriptRef.current = final;
      }
      console.log("[Speech] Interim:", interim, "Final:", final);
    };

    recognition.onerror = (e: any) => {
      console.log("[Speech] Error:", e.error);
      if (e.error !== "aborted") {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      console.log("[Speech] Recognition ended");
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, []);

  const stopListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (recognition) {
      recognition.stop();
    }
    setIsListening(false);

    // Send the final transcript after a small delay to let last results arrive
    setTimeout(() => {
      const text = finalTranscriptRef.current.trim();
      if (text && onResultRef.current) {
        console.log("[Speech] Sending transcript:", text);
        onResultRef.current(text);
      }
      finalTranscriptRef.current = "";
      onResultRef.current = null;
    }, 300);
  }, []);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speak = useCallback((text: string): Promise<void> => {
    return new Promise(async (resolve) => {
      // Clean text for TTS (remove markdown, etc.)
      const cleanText = text
        .replace(/[*_~`#>\[\]()]/g, '')
        .replace(/\n{2,}/g, '. ')
        .replace(/\n/g, ' ')
        .trim();

      if (!cleanText) { resolve(); return; }

      setIsSpeaking(true);

      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({ text: cleanText }),
          }
        );

        if (!response.ok) {
          throw new Error(`TTS request failed: ${response.status}`);
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
          resolve();
        };
        audio.onerror = () => {
          console.error("[Speech] ElevenLabs audio playback error");
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
          resolve();
        };

        await audio.play();
      } catch (err) {
        console.error("[Speech] ElevenLabs TTS error:", err);
        // Fallback to browser TTS
        if (window.speechSynthesis) {
          const utterance = new SpeechSynthesisUtterance(cleanText);
          utterance.rate = 1;
          utterance.pitch = 1.05;
          const voices = window.speechSynthesis.getVoices();
          const preferred = voices.find((v) => v.lang.startsWith("en"));
          if (preferred) utterance.voice = preferred;
          utterance.onend = () => { setIsSpeaking(false); resolve(); };
          utterance.onerror = () => { setIsSpeaking(false); resolve(); };
          window.speechSynthesis.speak(utterance);
        } else {
          setIsSpeaking(false);
          resolve();
        }
      }
    });
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  return {
    isListening,
    startListening,
    stopListening,
    speak,
    isSpeaking,
    stopSpeaking,
    supported,
  };
}
