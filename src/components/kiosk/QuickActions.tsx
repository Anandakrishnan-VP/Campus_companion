import { motion } from "framer-motion";
import { Users, MapPin, Calendar, AlertTriangle, Info, GraduationCap } from "lucide-react";

interface QuickActionsProps {
  onAction: (query: string) => void;
  onFillInput?: (query: string) => void;
}

const actions = [
{ icon: Users, label: "Find Faculty", query: "Help me find a faculty member", color: "primary" },
{ icon: MapPin, label: "Navigate", query: "Help me find a location in the building", color: "primary" },
{ icon: Calendar, label: "Events", query: "What events are happening today?", color: "primary" },
{ icon: GraduationCap, label: "Departments", query: "What departments are in this building?", color: "primary" },
{ icon: Info, label: "About", query: "Tell me about this college", color: "primary" }];


const QuickActions = ({ onAction, onFillInput }: QuickActionsProps) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
      {actions.map((action, i) =>
      <motion.button
        key={action.label}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.08 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onFillInput ? onFillInput(action.query) : onAction(action.query)}
        className="glass-card-hover flex flex-col items-center gap-2 p-4 cursor-pointer group">
        
          <action.icon className="w-6 h-6 text-primary transition-all group-hover:drop-shadow-[0_0_8px_hsl(var(--primary)/0.6)]" />
          <span className="text-xs font-display font-medium text-white">
            {action.label}
          </span>
        </motion.button>
      )}
    </div>);

};

export default QuickActions;