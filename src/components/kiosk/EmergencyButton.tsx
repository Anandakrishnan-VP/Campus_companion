import { motion } from "framer-motion";
import { AlertTriangle, Phone, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface EmergencyContact {
  id: string;
  label: string;
  value: string;
  type: string;
  sort_order: number;
}

const EmergencyButton = () => {
  const [showEmergency, setShowEmergency] = useState(false);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await (supabase.from("emergency_contacts") as any).select("*").order("sort_order", { ascending: true });
      if (data) setContacts(data);
    };
    fetch();
  }, [showEmergency]);

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
              {contacts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center">No emergency contacts configured.</p>
              ) : (
                contacts.map((contact) => (
                  <div key={contact.id} className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <p className="text-sm text-muted-foreground">{contact.label}</p>
                    {contact.type === "phone" ? (
                      <p className="text-lg font-bold text-foreground">📞 {contact.value}</p>
                    ) : (
                      <p className="text-foreground text-sm">{contact.value}</p>
                    )}
                  </div>
                ))
              )}
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
