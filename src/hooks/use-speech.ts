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

  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!window.speechSynthesis) {
        resolve();
        return;
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1.05;
      utterance.volume = 1;

      const voices = window.speechSynthesis.getVoices();
      const preferred =
        voices.find((v) => v.name.includes("Google") && v.name.includes("Female")) ||
        voices.find((v) => v.lang.startsWith("en") && v.name.toLowerCase().includes("female")) ||
        voices.find((v) => v.lang.startsWith("en") && v.name.toLowerCase().includes("samantha")) ||
        voices.find((v) => v.lang.startsWith("en"));
      if (preferred) {
        utterance.voice = preferred;
        console.log("[Speech] Using voice:", preferred.name);
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        resolve();
      };
      utterance.onerror = (e) => {
        console.log("[Speech] TTS error:", e);
        setIsSpeaking(false);
        resolve();
      };

      window.speechSynthesis.speak(utterance);
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
