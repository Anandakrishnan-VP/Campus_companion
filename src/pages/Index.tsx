import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Settings } from "lucide-react";
import { Link } from "react-router-dom";
import AvatarDisplay from "@/components/kiosk/AvatarDisplay";
import ChatInterface, { type ChatMessage } from "@/components/kiosk/ChatInterface";
import QuickActions from "@/components/kiosk/QuickActions";
import EmergencyButton from "@/components/kiosk/EmergencyButton";
import { useSpeech } from "@/hooks/use-speech";

const getMockResponse = (query: string): string => {
  const q = query.toLowerCase();
  if (q.includes("faculty") || q.includes("professor") || q.includes("swathy"))
    return "Professor Swathy is currently in Room 204, Block A. She has a class from 10:00 AM to 11:00 AM. Her next free slot is at 11:15 AM. Would you like me to show directions to her office?";
  if (q.includes("event") || q.includes("seminar"))
    return "Today's Events: AI Workshop at Seminar Hall, 2 to 4 PM. Coding Contest at CS Lab 1, 10 AM to 1 PM. Guest Lecture on Cybersecurity at the Auditorium, 3:30 PM.";
  if (q.includes("navigate") || q.includes("location") || q.includes("lab") || q.includes("room"))
    return "The AI Lab is located on the Second Floor in Block B, near the east staircase. Turn right from the elevator and it's the third door on your left.";
  if (q.includes("department"))
    return "This building houses the following departments: Computer Science and Engineering, Artificial Intelligence and Data Science, Information Technology, and Electronics and Communication.";
  if (q.includes("college") || q.includes("about"))
    return "Welcome to our University! We are a leading institution of higher education with state-of-the-art facilities, dedicated faculty, and a vibrant campus life. The campus spans 50 acres with 8 academic blocks.";
  return "I can help you with finding faculty, navigating the building, checking events, or answering general campus questions. What would you like to know?";
};

const Index = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm your Campus AI Assistant. I can help you find faculty, navigate the building, check events, and more. How can I help you today?",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  const speech = useSpeech();

  const handleSendMessage = useCallback(
    async (text: string) => {
      // Stop any ongoing speech first
      speech.stopSpeaking();

      const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", content: text };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      setIsThinking(true);

      // Simulate AI response
      setTimeout(async () => {
        const response = getMockResponse(text);
        const assistantMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: response,
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setIsLoading(false);
        setIsThinking(false);

        // Speak the response
        await speech.speak(response);
      }, 1200);
    },
    [speech]
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

  const getStatus = () => {
    if (speech.isSpeaking) return "Speaking...";
    if (speech.isListening) return "Listening... Tap stop when done";
    if (isThinking) return "Processing...";
    return "Tap mic or type to ask";
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-xl font-display font-bold text-foreground tracking-tight">
            Campus <span className="text-primary glow-text">AI</span> Kiosk
          </h1>
          <p className="text-xs text-muted-foreground">Department of Computer Science</p>
        </div>
        <Link
          to="/admin"
          className="p-2 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Settings className="w-5 h-5" />
        </Link>
      </header>

      {/* Main content */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left: Avatar + Quick Actions */}
          <div className="flex flex-col items-center gap-6 pt-4">
            <AvatarDisplay
              isSpeaking={speech.isSpeaking}
              isListening={speech.isListening}
              isThinking={isThinking}
              status={getStatus()}
            />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="w-full"
            >
              <p className="text-xs text-muted-foreground mb-2 font-display uppercase tracking-wider text-center">
                Quick Actions
              </p>
              <QuickActions onAction={handleSendMessage} />
            </motion.div>
          </div>

          {/* Right: Chat */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <ChatInterface
              messages={messages}
              isLoading={isLoading}
              onSendMessage={handleSendMessage}
              isListening={speech.isListening}
              onStartListening={handleStartListening}
              onStopListening={handleStopListening}
              isSpeaking={speech.isSpeaking}
              onStopSpeaking={speech.stopSpeaking}
              voiceSupported={speech.supported}
            />
          </motion.div>
        </div>
      </main>

      <EmergencyButton />
    </div>
  );
};

export default Index;
