import { useState, useCallback, useRef, useEffect, Suspense, lazy } from "react";
import ncercLogo from "@/assets/ncerc-logo.jpg";
import { motion } from "framer-motion";
import { Settings, MessageSquareWarning } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import NotificationPanel from "@/components/kiosk/NotificationPanel";
const Avatar3D = lazy(() => import("@/components/kiosk/Avatar3D"));
import ChatInterface, { type ChatMessage, type ChatInterfaceHandle } from "@/components/kiosk/ChatInterface";
import QuickActions from "@/components/kiosk/QuickActions";
import EmergencyButton from "@/components/kiosk/EmergencyButton";
import { useSpeech } from "@/hooks/use-speech";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/campus-chat`;

async function streamChat({
  messages,
  onDelta,
  onDone,
  onError





}: {messages: {role: string;content: string;}[];onDelta: (text: string) => void;onDone: () => void;onError: (msg: string) => void;}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
    },
    body: JSON.stringify({ messages })
  });

  if (!resp.ok || !resp.body) {
    const errorData = await resp.json().catch(() => ({}));
    onError(errorData.error || "Failed to get response");
    return;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let streamDone = false;

  while (!streamDone) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") {streamDone = true;break;}
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch {
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }
  onDone();
}

const Index = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
  {
    id: "welcome",
    role: "assistant",
    content: "Hello! I'm Yukti, your NCERC AI Assistant. I can help you find faculty, navigate the campus, check events, and more. How can I help you today?"
  }]
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const conversationRef = useRef<{role: string;content: string;}[]>([]);

  const chatRef = useRef<ChatInterfaceHandle>(null);

  const speech = useSpeech();

  const handleClearChat = useCallback(() => {
    speech.stopSpeaking();
    conversationRef.current = [];
    setMessages([{
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm Yukti, your NCERC AI Assistant. I can help you find faculty, navigate the campus, check events, and more. How can I help you today?"
    }]);
  }, [speech]);

  const handleSendMessage = useCallback(
    async (text: string) => {
      speech.stopSpeaking();

      const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", content: text };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      setIsThinking(true);

      conversationRef.current.push({ role: "user", content: text });

      let assistantText = "";

      const upsertAssistant = (chunk: string) => {
        assistantText += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && last.id.startsWith("stream-")) {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantText } : m);
          }
          return [...prev, { id: "stream-" + Date.now(), role: "assistant", content: assistantText }];
        });
      };

      try {
        await streamChat({
          messages: conversationRef.current,
          onDelta: (chunk) => {
            if (isThinking) setIsThinking(false);
            upsertAssistant(chunk);
          },
          onDone: async () => {
            setIsLoading(false);
            setIsThinking(false);
            conversationRef.current.push({ role: "assistant", content: assistantText });
            if (assistantText) {
              await speech.speak(assistantText);
            }
          },
          onError: (msg) => {
            setIsLoading(false);
            setIsThinking(false);
            setMessages((prev) => [
            ...prev,
            { id: "error-" + Date.now(), role: "assistant", content: `Sorry, I encountered an issue: ${msg}. Please try again.` }]
            );
          }
        });
      } catch {
        setIsLoading(false);
        setIsThinking(false);
        setMessages((prev) => [
        ...prev,
        { id: "error-" + Date.now(), role: "assistant", content: "Sorry, something went wrong. Please try again." }]
        );
      }
    },
    [speech, isThinking]
  );

  const handleStartListening = useCallback(() => {
    speech.stopSpeaking();
    speech.startListening((text) => {
      handleSendMessage(text);
    });
  }, [speech, handleSendMessage]);

  const handleStopListening = useCallback(() => {
    speech.stopListening();
  }, [speech]);

  const handleAvatarTap = useCallback(() => {
    if (speech.isListening) {
      speech.stopListening();
    } else {
      speech.stopSpeaking();
      speech.startListening((text) => {
        handleSendMessage(text);
      });
    }
  }, [speech, handleSendMessage]);

  const getStatus = () => {
    if (speech.isSpeaking) return "Speaking...";
    if (speech.isListening) return "Listening... Tap avatar to stop";
    if (isThinking) return "Processing...";
    return "Tap avatar or type to ask";
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[120px]" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <img src={ncercLogo} alt="NCERC Logo" className="w-10 h-10 rounded-full object-cover" />
          <div>
            <h1 className="text-xl font-display font-bold text-foreground tracking-tight">
              NCERC <span className="text-primary glow-text">AI</span>
            </h1>
            <p className="text-xs text-white">Department of CSE(AI & ML)</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <NotificationPanel />
          <Link
            to="/issues"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent/15 text-accent-foreground hover:bg-accent/25 transition-all border border-accent/20 font-display text-sm font-medium"
            title="Student Voice">
            
            <MessageSquareWarning className="w-4 h-4 text-accent" />
            <span className="hidden sm:inline">Student Voice</span>
          </Link>
          <Link
            to="/login"
            className="p-2 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
            
            <Settings className="w-5 h-5" />
          </Link>
        </div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-4 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="flex flex-col items-center gap-6 pt-4">
            <Suspense fallback={
            <div className="w-52 h-52 md:w-64 md:h-64 rounded-full bg-muted/20 flex items-center justify-center">
                <span className="text-muted-foreground text-sm font-display">Loading avatar...</span>
              </div>
            }>
              <Avatar3D
                isSpeaking={speech.isSpeaking}
                isListening={speech.isListening}
                isThinking={isThinking}
                status={getStatus()}
                onTap={handleAvatarTap} />
              
            </Suspense>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="w-full">
              
              <p className="text-xs mb-2 font-display uppercase tracking-wider text-center text-white">
                Quick Actions
              </p>
              <QuickActions onAction={handleSendMessage} onFillInput={(q) => chatRef.current?.setInput(q)} />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}>
            
            <ChatInterface
              ref={chatRef}
              messages={messages}
              isLoading={isLoading}
              onSendMessage={handleSendMessage}
              onClearChat={handleClearChat}
              isListening={speech.isListening}
              onStartListening={handleStartListening}
              onStopListening={handleStopListening}
              isSpeaking={speech.isSpeaking}
              onStopSpeaking={speech.stopSpeaking}
              voiceSupported={speech.supported} />
            
          </motion.div>
        </div>
      </main>

      <EmergencyButton />

      <footer className="relative z-10 text-center px-6 py-4 pb-6">
        <p className="text-[10px] font-display leading-relaxed max-w-lg mx-auto text-white">
          AI-generated responses may sometimes be inaccurate or incomplete. Please verify important information through official university sources.
        </p>
      </footer>
    </div>);

};

export default Index;