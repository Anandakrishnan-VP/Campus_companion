import { motion } from "framer-motion";
import avatarImg from "@/assets/avatar.png";

interface AvatarDisplayProps {
  isSpeaking?: boolean;
  status?: string;
}

const AvatarDisplay = ({ isSpeaking = false, status = "Ready to help" }: AvatarDisplayProps) => {
  return (
    <div className="flex flex-col items-center gap-4">
      <motion.div
        className="relative w-48 h-48 md:w-56 md:h-56"
        animate={{ y: isSpeaking ? [0, -5, 0] : [0, -8, 0] }}
        transition={{ duration: isSpeaking ? 0.6 : 3, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Glow rings */}
        <div className="absolute inset-0 rounded-full avatar-glow" />
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

        {/* Avatar image */}
        <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-primary/30">
          <img
            src={avatarImg}
            alt="AI Assistant Avatar"
            className="w-full h-full object-cover"
          />
          {/* Scan line effect */}
          {isSpeaking && (
            <motion.div
              className="absolute left-0 right-0 h-0.5 bg-primary/40"
              animate={{ top: ["-2%", "102%"] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
          )}
        </div>
      </motion.div>

      {/* Status indicator */}
      <div className="flex items-center gap-2">
        <motion.div
          className="w-2 h-2 rounded-full bg-primary"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <span className="text-sm text-muted-foreground font-display tracking-wide uppercase">
          {status}
        </span>
      </div>
    </div>
  );
};

export default AvatarDisplay;
