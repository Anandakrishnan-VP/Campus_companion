import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Bot, Users, Bell, MapPin, BookOpen, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTenant } from "@/contexts/TenantContext";

const features = [
  { icon: Bot, title: "AI Campus Assistant", desc: "24/7 AI chatbot trained on your college data" },
  { icon: Users, title: "Faculty Directory", desc: "Real-time faculty availability and timetables" },
  { icon: Bell, title: "Smart Notifications", desc: "Push announcements to your campus kiosk" },
  { icon: MapPin, title: "Campus Navigation", desc: "Help students find locations and rooms" },
  { icon: BookOpen, title: "Knowledge Base", desc: "Import your website content automatically" },
  { icon: Shield, title: "Data Isolation", desc: "Each college gets its own secure environment" },
];

const Landing = () => {
  const { allTenants } = useTenant();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/40 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">
          Campus<span className="text-primary">AI</span> Kiosk
        </h1>
        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" size="sm">Log In</Button>
          </Link>
          <Link to="/register">
            <Button size="sm">Register Your College</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-bold tracking-tight leading-tight"
        >
          AI-Powered Campus Kiosk
          <br />
          <span className="text-primary">for Every College</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto"
        >
          Deploy an intelligent AI assistant for your campus in minutes. Faculty directory, event updates, campus navigation, and more — all branded for your institution.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 flex gap-4 justify-center"
        >
          <Link to="/register">
            <Button size="lg">Get Started Free</Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="outline">Log In</Button>
          </Link>
        </motion.div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              className="rounded-xl border border-border/60 bg-card p-6"
            >
              <f.icon className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold text-foreground">{f.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Trusted By */}
      {allTenants.length > 0 && (
        <section className="max-w-4xl mx-auto px-6 pb-20 text-center">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Trusted by</p>
          <div className="flex flex-wrap gap-4 justify-center">
            {allTenants.map((t) => (
              <div key={t.id} className="px-4 py-2 rounded-lg bg-secondary/50 text-sm font-medium text-foreground">
                {t.name}
              </div>
            ))}
          </div>
        </section>
      )}

      <footer className="border-t border-border/40 px-6 py-6 text-center text-xs text-muted-foreground">
        CampusAI Kiosk — AI-powered campus assistant platform
      </footer>
    </div>
  );
};

export default Landing;
