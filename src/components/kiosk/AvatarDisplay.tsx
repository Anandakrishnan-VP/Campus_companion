import { motion, AnimatePresence } from "framer-motion";
import avatarImg from "@/assets/avatar.png";

interface AvatarDisplayProps {
  isSpeaking?: boolean;
  isListening?: boolean;
  isThinking?: boolean;
  status?: string;
}

const AvatarDisplay = ({
  isSpeaking = false,
  isListening = false,
  isThinking = false,
  status = "Ready to help",
}: AvatarDisplayProps) => {
  const activeState = isSpeaking ? "speaking" : isListening ? "listening" : isThinking ? "thinking" : "idle";

  return (
    <div className="flex flex-col items-center gap-4">
      <motion.div
        className="relative w-48 h-48 md:w-56 md:h-56"
        animate={
          activeState === "speaking"
            ? { y: [0, -4, 0, -2, 0], scale: [1, 1.02, 1, 1.01, 1] }
            : activeState === "listening"
            ? { y: [0, -3, 0], scale: [1, 1.01, 1] }
            : activeState === "thinking"
            ? { y: [0, -6, 0], rotate: [0, 1, -1, 0] }
            : { y: [0, -8, 0] }
        }
        transition={{
          duration: activeState === "speaking" ? 0.8 : activeState === "listening" ? 1.2 : 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {/* Outer pulse rings */}
        <AnimatePresence>
          {isSpeaking && (
            <>
              <motion.div
                className="absolute -inset-4 rounded-full border-2 border-primary/40"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.1, 0.4] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
              <motion.div
                className="absolute -inset-8 rounded-full border border-primary/20"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.05, 0.3] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
              />
              <motion.div
                className="absolute -inset-12 rounded-full border border-primary/10"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: [1, 1.25, 1], opacity: [0.2, 0, 0.2] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
              />
            </>
          )}
          {isListening && (
            <>
              <motion.div
                className="absolute -inset-4 rounded-full border-2 border-accent/50"
                animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.2, 0.5] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <motion.div
                className="absolute -inset-8 rounded-full border border-accent/30"
                animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.1, 0.3] }}
                transition={{ duration: 1.3, repeat: Infinity, delay: 0.15 }}
              />
            </>
          )}
        </AnimatePresence>

        {/* Idle glow rings */}
        {!isSpeaking && !isListening && (
          <>
            <motion.div
              className="absolute -inset-3 rounded-full border border-primary/20"
              animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div
              className="absolute -inset-6 rounded-full border border-primary/10"
              animate={{ scale: [1, 1.03, 1], opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />
          </>
        )}

        {/* Avatar glow backdrop */}
        <div
          className={`absolute inset-0 rounded-full transition-all duration-500 ${
            isSpeaking
              ? "shadow-[0_0_80px_hsl(187_100%_50%/0.4),0_0_160px_hsl(187_100%_50%/0.15)]"
              : isListening
              ? "shadow-[0_0_60px_hsl(270_80%_65%/0.35),0_0_120px_hsl(270_80%_65%/0.1)]"
              : "avatar-glow"
          }`}
        />

        {/* Avatar image */}
        <div className={`relative w-full h-full rounded-full overflow-hidden border-2 transition-colors duration-500 ${
          isSpeaking ? "border-primary/50" : isListening ? "border-accent/50" : "border-primary/30"
        }`}>
          <img
            src={avatarImg}
            alt="AI Assistant Avatar"
            className="w-full h-full object-cover"
          />

          {/* Speaking scan line */}
          {isSpeaking && (
            <motion.div
              className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent"
              animate={{ top: ["-2%", "102%"] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
            />
          )}

          {/* Listening pulse overlay */}
          {isListening && (
            <motion.div
              className="absolute inset-0 bg-accent/10"
              animate={{ opacity: [0, 0.15, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}

          {/* Thinking shimmer */}
          {isThinking && (
            <motion.div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(90deg, transparent 0%, hsl(187 100% 50% / 0.1) 50%, transparent 100%)",
              }}
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
          )}
        </div>

        {/* Speaking mouth indicator */}
        <AnimatePresence>
          {isSpeaking && (
            <motion.div
              className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-0.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-primary rounded-full"
                  animate={{ height: [4, 12 + Math.random() * 8, 4] }}
                  transition={{
                    duration: 0.3 + Math.random() * 0.3,
                    repeat: Infinity,
                    delay: i * 0.08,
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Listening mic indicator */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-0.5"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-accent rounded-full"
                  animate={{ height: [3, 8 + Math.random() * 10, 3] }}
                  transition={{
                    duration: 0.2 + Math.random() * 0.3,
                    repeat: Infinity,
                    delay: i * 0.05,
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Status indicator */}
      <motion.div
        className="flex items-center gap-2"
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <motion.div
          className={`w-2 h-2 rounded-full transition-colors duration-300 ${
            isSpeaking ? "bg-primary" : isListening ? "bg-accent" : isThinking ? "bg-primary" : "bg-primary/60"
          }`}
          animate={
            isSpeaking
              ? { scale: [1, 1.4, 1] }
              : isListening
              ? { scale: [1, 1.3, 1] }
              : { opacity: [0.5, 1, 0.5] }
          }
          transition={{ duration: isSpeaking ? 0.4 : 1.5, repeat: Infinity }}
        />
        <span className="text-sm text-muted-foreground font-display tracking-wide uppercase">
          {status}
        </span>
      </motion.div>
    </div>
  );
};

export default AvatarDisplay;
