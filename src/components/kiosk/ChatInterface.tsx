import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, Square, Loader2, Volume2, VolumeX, Languages, Trash2 } from "lucide-react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatInterfaceProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  isListening: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
  isSpeaking: boolean;
  onStopSpeaking: () => void;
  voiceSupported: boolean;
}

const TRANSLATE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/translate-malayalam`;

const ChatInterface = ({
  messages,
  isLoading,
  onSendMessage,
  isListening,
  onStartListening,
  onStopListening,
  isSpeaking,
  onStopSpeaking,
  voiceSupported,
}: ChatInterfaceProps) => {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [translatedMap, setTranslatedMap] = useState<Record<string, string>>({});
  const [translatingId, setTranslatingId] = useState<string | null>(null);
  const [showTranslation, setShowTranslation] = useState<Record<string, boolean>>({});

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput("");
  };

  const handleTranslate = async (msgId: string, text: string) => {
    // Toggle if already translated
    if (translatedMap[msgId]) {
      setShowTranslation(prev => ({ ...prev, [msgId]: !prev[msgId] }));
      return;
    }

    setTranslatingId(msgId);
    try {
      const resp = await fetch(TRANSLATE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ text }),
      });
      const data = await resp.json();
      if (data.translated) {
        setTranslatedMap(prev => ({ ...prev, [msgId]: data.translated }));
        setShowTranslation(prev => ({ ...prev, [msgId]: true }));
      }
    } catch {
      // silently fail
    }
    setTranslatingId(null);
  };

  return (
    <div className="glass-card flex flex-col h-[400px] md:h-[450px]">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground text-sm font-display">
              Ask me anything about the campus...
            </p>
          </div>
        )}
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-secondary text-secondary-foreground rounded-bl-md"
                }`}
              >
                {showTranslation[msg.id] && translatedMap[msg.id]
                  ? translatedMap[msg.id]
                  : msg.content}
              </div>

              {/* Translate button for assistant messages */}
              {msg.role === "assistant" && msg.id !== "welcome" && !msg.id.startsWith("error-") && (
                <button
                  onClick={() => handleTranslate(msg.id, msg.content)}
                  disabled={translatingId === msg.id}
                  className="flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md text-[10px] font-display text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
                >
                  {translatingId === msg.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Languages className="w-3 h-3" />
                  )}
                  {showTranslation[msg.id] ? "English" : "മലയാളം"}
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Thinking...</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Listening indicator */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 overflow-hidden"
          >
            <div className="flex items-center gap-3 py-2 px-3 rounded-lg bg-accent/10 border border-accent/20">
              <div className="flex gap-0.5 items-end">
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1 bg-accent rounded-full"
                    animate={{ height: [3, 12 + Math.random() * 6, 3] }}
                    transition={{ duration: 0.3 + Math.random() * 0.2, repeat: Infinity, delay: i * 0.06 }}
                  />
                ))}
              </div>
              <span className="text-xs text-accent font-display flex-1">Listening... speak now</span>
              <button onClick={onStopListening} className="px-3 py-1 rounded-md bg-accent text-accent-foreground text-xs font-display font-semibold">
                Stop & Send
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Speaking indicator */}
      <AnimatePresence>
        {isSpeaking && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 overflow-hidden"
          >
            <button onClick={onStopSpeaking} className="flex items-center gap-2 py-2 px-3 rounded-lg bg-primary/10 border border-primary/20 w-full text-left">
              <Volume2 className="w-4 h-4 text-primary" />
              <span className="text-xs text-primary font-display flex-1">Speaking...</span>
              <span className="text-xs text-muted-foreground font-display flex items-center gap-1">
                <VolumeX className="w-3 h-3" /> Stop
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="p-3 border-t border-border/50">
        <div className="flex items-center gap-2">
          {voiceSupported && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={isListening ? onStopListening : onStartListening}
              className={`p-3 rounded-xl transition-all relative ${
                isListening
                  ? "bg-accent text-accent-foreground shadow-[0_0_15px_hsl(270_80%_65%/0.4)]"
                  : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              {isListening ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              {isListening && (
                <motion.div
                  className="absolute inset-0 rounded-xl border-2 border-accent"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
            </motion.button>
          )}
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={isListening ? "Listening... tap ■ when done" : "Type your question..."}
            disabled={isListening}
            className="flex-1 bg-muted/50 border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all font-body disabled:opacity-50"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={!input.trim() || isLoading || isListening}
            className="p-3 rounded-xl bg-primary text-primary-foreground disabled:opacity-40 transition-opacity"
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
