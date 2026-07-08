import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Sparkles, MessageSquare, Wrench, Boxes, Zap, Shield, Users } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nexus — Every AI, One Platform" },
      { name: "description", content: "Chat with every leading AI model, connect your tools, build agents, and ship apps — all from one workspace." },
      { property: "og:title", content: "Nexus — Every AI, One Platform" },
      { property: "og:description", content: "Chat with every leading AI model, connect your tools, build agents, and ship apps — all from one workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/70 border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-semibold tracking-tight">Nexus</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link to="/auth"><Button variant="ghost" size="sm">Sign in</Button></Link>
            <Link to="/auth"><Button size="sm">Get started</Button></Link>
          </nav>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 pt-24 pb-32 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card/50 text-xs text-muted-foreground mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Phase 1 live · Chat with every major model
        </div>
        <h1 className="text-5xl md:text-7xl font-semibold tracking-tight leading-[1.05] mb-6">
          Every AI, every tool,<br />
          <span className="bg-gradient-to-r from-primary via-fuchsia-400 to-primary bg-clip-text text-transparent">
            one workspace.
          </span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          Nexus is the elite platform where you chat with GPT, Claude, Gemini and more — then extend them with skills, connectors, agents, and apps you build yourself.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link to="/auth"><Button size="lg" className="h-12 px-6 text-base">Start free →</Button></Link>
          <a href="#features"><Button size="lg" variant="outline" className="h-12 px-6 text-base">See what's inside</Button></a>
        </div>
        <p className="text-xs text-muted-foreground mt-6">Free tier · No credit card · 30 messages/day</p>
      </section>

      <section id="features" className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Feature icon={<MessageSquare />} title="Unified chat" body="Switch between Gemini, GPT-5, Claude and more mid-conversation. Bring your context, we handle the plumbing." live />
          <Feature icon={<Wrench />} title="Skills & connectors" body="Plug in Gmail, Notion, Slack, GitHub, Linear. Give any model access to your world." />
          <Feature icon={<Boxes />} title="Agent builder" body="Compose custom agents with tools, memory, and knowledge bases. Ship them privately or publish." />
          <Feature icon={<Zap />} title="Workflows" body="Visual node editor for scheduled and event-driven automations. Cron, webhooks, branching." />
          <Feature icon={<Users />} title="Teams & marketplace" body="Share agents, skills, and workflows. Discover what others have built." />
          <Feature icon={<Shield />} title="Your data, your rules" body="Per-user encryption, RLS, granular tool permissions. Enterprise-ready from day one." />
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        Built with Nexus · The everything AI platform
      </footer>
    </div>
  );
}

function Feature({ icon, title, body, live }: { icon: React.ReactNode; title: string; body: string; live?: boolean }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 hover:border-primary/40 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-lg bg-accent/40 text-primary flex items-center justify-center [&>svg]:w-5 [&>svg]:h-5">{icon}</div>
        {live ? <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">Live</span> : <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Soon</span>}
      </div>
      <h3 className="font-semibold mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}
