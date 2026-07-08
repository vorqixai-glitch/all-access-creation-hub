import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  component: Settings,
});

function Settings() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [plan, setPlan] = useState("free");
  const [usage, setUsage] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      setEmail(u.user.email ?? "");
      const { data: p } = await supabase.from("profiles").select("display_name,plan").eq("id", u.user.id).maybeSingle();
      setDisplayName(p?.display_name ?? "");
      setPlan(p?.plan ?? "free");
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from("usage_events")
        .select("id", { count: "exact", head: true })
        .gte("created_at", since);
      setUsage(count ?? 0);
    })();
  }, []);

  async function save() {
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("profiles").update({ display_name: displayName }).eq("id", u.user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Saved");
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border h-14 flex items-center px-4">
        <Link to="/chat"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1.5" /> Back to chat</Button></Link>
      </header>
      <div className="max-w-2xl mx-auto p-6 space-y-8">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your Nexus account.</p>
        </div>

        <section className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">Profile</h2>
          <div>
            <Label>Email</Label>
            <Input value={email} disabled />
          </div>
          <div>
            <Label htmlFor="dn">Display name</Label>
            <Input id="dn" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </section>

        <section className="bg-card border border-border rounded-xl p-6 space-y-3">
          <h2 className="font-semibold">Usage</h2>
          <p className="text-sm text-muted-foreground">Current plan: <span className="text-foreground font-medium capitalize">{plan}</span></p>
          <div className="flex items-center justify-between">
            <span className="text-sm">Messages today</span>
            <span className="text-sm font-medium">{usage} / 30</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${Math.min(100, (usage / 30) * 100)}%` }} />
          </div>
        </section>

        <section className="bg-card border border-border rounded-xl p-6 space-y-3">
          <h2 className="font-semibold">Account</h2>
          <Button variant="outline" onClick={signOut}>Sign out</Button>
        </section>
      </div>
    </div>
  );
}
