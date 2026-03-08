import { motion, AnimatePresence } from "framer-motion";
import avatarImg from "@/assets/avatar-female.png";

interface Avatar3DProps {
  isSpeaking?: boolean;
  isListening?: boolean;
  isThinking?: boolean;
  status?: string;
  onTap?: () => void;
}

const Avatar3D = ({ isSpeaking = false, isListening = false, isThinking = false, status = "Ready to help", onTap }: Avatar3DProps) => {
  const glowClass = isSpeaking
    ? "shadow-[0_0_60px_hsl(var(--primary)/0.5),0_0_120px_hsl(var(--primary)/0.2)]"
    : isListening
    ? "shadow-[0_0_60px_hsl(var(--accent)/0.5),0_0_120px_hsl(var(--accent)/0.2)]"
    : isThinking
    ? "shadow-[0_0_40px_hsl(var(--primary)/0.3)]"
    : "shadow-[0_0_30px_hsl(var(--primary)/0.15)]";

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="relative w-48 h-48 md:w-56 md:h-56 cursor-pointer select-none"
        onClick={onTap}
        title={isListening ? "Tap to stop listening" : "Tap to start listening"}
      >
        {/* Animated outer ring */}
        <motion.div
          className={`absolute inset-0 rounded-full transition-all duration-500 ${glowClass}`}
          animate={
            isSpeaking
              ? { scale: [1, 1.04, 1], opacity: [0.8, 1, 0.8] }
              : isListening
              ? { scale: [1, 1.06, 1], opacity: [0.7, 1, 0.7] }
              : isThinking
              ? { rotate: [0, 360] }
              : {}
          }
          transition={
            isSpeaking
              ? { duration: 0.6, repeat: Infinity }
              : isListening
              ? { duration: 1.2, repeat: Infinity }
              : isThinking
              ? { duration: 4, repeat: Infinity, ease: "linear" }
              : {}
          }
        >
          <div className={`absolute inset-0 rounded-full border-2 transition-colors duration-500 ${
            isSpeaking ? "border-primary" : isListening ? "border-accent" : isThinking ? "border-primary/50 border-dashed" : "border-primary/20"
          }`} />
        </motion.div>

        {/* Pulsing rings for listening */}
        <AnimatePresence>
          {isListening && (
            <>
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={`ring-${i}`}
                  className="absolute inset-0 rounded-full border border-accent/30"
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={{ scale: [1, 1.4 + i * 0.15], opacity: [0.4, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.6, ease: "easeOut" }}
                />
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Avatar image container */}
        <motion.div
          className="absolute inset-2 rounded-full overflow-hidden bg-gradient-to-b from-primary/10 to-background/50"
          animate={
            isSpeaking
              ? { scale: [1, 1.02, 1] }
              : isListening
              ? { scale: [1, 1.03, 0.98, 1] }
              : isThinking
              ? { y: [0, -3, 0] }
              : { y: [0, -2, 0] }
          }
          transition={
            isSpeaking
              ? { duration: 0.5, repeat: Infinity }
              : isListening
              ? { duration: 1.5, repeat: Infinity }
              : { duration: 3, repeat: Infinity, ease: "easeInOut" }
          }
        >
          <img
            src={avatarImg}
            alt="AI Assistant"
            className="w-full h-full object-cover object-top scale-110"
            draggable={false}
          />

          {/* Speaking overlay effect */}
          <AnimatePresence>
            {isSpeaking && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.3, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
            )}
          </AnimatePresence>

          {/* Listening overlay */}
          <AnimatePresence>
            {isListening && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-t from-accent/15 to-transparent"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.1, 0.3, 0.1] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
          </AnimatePresence>

          {/* Thinking shimmer */}
          <AnimatePresence>
            {isThinking && (
              <motion.div
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Tap hint */}
        {!isSpeaking && !isListening && !isThinking && (
          <div className="absolute inset-0 rounded-full flex items-end justify-center pb-3 pointer-events-none">
            <motion.span
              className="text-[9px] text-muted-foreground/70 font-display bg-background/60 px-2.5 py-0.5 rounded-full backdrop-blur-sm"
              animate={{ opacity: [0.4, 0.9, 0.4] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              Tap to speak
            </motion.span>
          </div>
        )}

        {/* Speaking sound bars */}
        <AnimatePresence>
          {isSpeaking && (
            <motion.div
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-[3px]"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
            >
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className="w-1 rounded-full bg-primary"
                  animate={{ height: [4, 14 + Math.random() * 8, 4] }}
                  transition={{ duration: 0.3 + Math.random() * 0.3, repeat: Infinity, delay: i * 0.08 }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Listening wave bars */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex gap-[2px]"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <motion.div
                  key={i}
                  className="w-[3px] rounded-full bg-accent"
                  animate={{ height: [3, 10 + Math.random() * 10, 3] }}
                  transition={{ duration: 0.2 + Math.random() * 0.3, repeat: Infinity, delay: i * 0.05 }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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
        <span className="text-sm text-muted-foreground font-display tracking-wide uppercase">{status}</span>
      </motion.div>
    </div>
  );
};

export default Avatar3D;
