import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Hash, MessageSquare, Search, Sparkles, Zap, Shield } from "lucide-react";

export default function Home() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isAuthenticated && !loading) {
      setLocation("/app");
    }
  }, [isAuthenticated, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Hash className="w-4.5 h-4.5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold tracking-tight">Slack</span>
          </div>
          <Button onClick={() => window.location.href = getLoginUrl()} size="sm" className="rounded-full px-5">
            Sign In
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered Team Communication
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
            Your Digital HQ for
            <span className="text-primary"> Team Work</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
            A channel-based messaging platform that replaces internal email. Centralize conversations, files, and tools in one searchable workspace.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button onClick={() => window.location.href = getLoginUrl()} size="lg" className="rounded-full px-8 h-12 text-base">
              Get Started Free
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: Hash, title: "Channels", desc: "Organize conversations by topic, project, or team. Public and private channels keep everyone in the loop." },
            { icon: MessageSquare, title: "Direct Messages", desc: "Private 1:1 and group conversations for quick discussions that don't need a channel." },
            { icon: Search, title: "Universal Search", desc: "Find any message, file, or person instantly. Your entire workspace is searchable with Cmd+K." },
            { icon: Zap, title: "Real-Time", desc: "Messages appear instantly. No refreshing needed. Stay connected with your team in real-time." },
            { icon: Sparkles, title: "AI Assistant", desc: "Summarize conversations, get smart reply suggestions, and surface insights powered by AI." },
            { icon: Shield, title: "Secure", desc: "Enterprise-grade security with encrypted data, role-based access, and private channels." },
          ].map((f, i) => (
            <div key={i} className="group p-6 rounded-xl bg-card/50 border border-border/50 hover:border-primary/20 hover:bg-card transition-all duration-300">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-base font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border/50">
        <div className="max-w-6xl mx-auto text-center text-sm text-muted-foreground">
          Built with modern web technologies. Inspired by the best team communication tools.
        </div>
      </footer>
    </div>
  );
}
