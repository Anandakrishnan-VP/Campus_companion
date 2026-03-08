import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";

const EmergencyButton = () => {
  const [showEmergency, setShowEmergency] = useState(false);

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowEmergency(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-full bg-destructive/90 border border-destructive emergency-glow font-display font-semibold text-destructive-foreground text-sm uppercase tracking-wider"
      >
        <AlertTriangle className="w-5 h-5" />
        Emergency
      </motion.button>

      {showEmergency && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 backdrop-blur-xl"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="glass-card p-8 max-w-md w-full mx-4 text-center space-y-6 border-destructive/30"
          >
            <AlertTriangle className="w-16 h-16 text-destructive mx-auto" />
            <h2 className="text-2xl font-display font-bold text-destructive">Emergency Contacts</h2>

            <div className="space-y-4 text-left">
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-muted-foreground">Campus Security</p>
                <p className="text-lg font-bold text-foreground">📞 +91-XXX-XXX-1234</p>
              </div>
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-muted-foreground">Medical Emergency</p>
                <p className="text-lg font-bold text-foreground">📞 +91-XXX-XXX-5678</p>
              </div>
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-muted-foreground">Fire Emergency</p>
                <p className="text-lg font-bold text-foreground">📞 101</p>
              </div>
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-muted-foreground">Evacuation</p>
                <p className="text-foreground text-sm">Proceed to the nearest exit. Assembly point: Main Ground.</p>
              </div>
            </div>

            <button
              onClick={() => setShowEmergency(false)}
              className="w-full py-3 rounded-lg bg-secondary text-secondary-foreground font-display font-medium"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </>
  );
};

export default EmergencyButton;
