import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ArrowLeft, Search, Settings2, Globe, Image, Link as LinkIcon, Terminal, Mail,
  Calendar, FileText, MessageCircle, Github, CheckSquare, Puzzle, Check,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/skills")({
  head: () => ({ meta: [{ title: "Skills & Plugins — Nexus" }] }),
  component: SkillsLibrary,
});

type ConfigField = { key: string; label: string; type: "text" | "password" | "textarea"; required?: boolean };
type Skill = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  icon: string | null;
  provider: string | null;
  is_official: boolean;
  config_schema: ConfigField[];
};
type UserSkill = { id: string; skill_id: string; enabled: boolean; config: Record<string, string> };

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Globe, Image, Link: LinkIcon, Terminal, Mail, Calendar, FileText,
  MessageCircle, Github, CheckSquare,
};

function SkillsLibrary() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [configuring, setConfiguring] = useState<Skill | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const [{ data: cat }, { data: mine }] = await Promise.all([
      supabase.from("skills_catalog").select("*").order("name"),
      supabase.from("user_skills").select("id,skill_id,enabled,config"),
    ]);
    setSkills((cat ?? []) as unknown as Skill[]);
    setUserSkills((mine ?? []) as unknown as UserSkill[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(skills.map((s) => s.category))).sort()],
    [skills],
  );

  const filtered = skills.filter((s) => {
    if (category !== "All" && s.category !== category) return false;
    if (q && !`${s.name} ${s.description} ${s.provider ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const mineBySkill = new Map(userSkills.map((u) => [u.skill_id, u]));

  async function toggle(skill: Skill, next: boolean) {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const existing = mineBySkill.get(skill.id);
    // Require config first time enabling if fields exist
    if (next && !existing && skill.config_schema.some((f) => f.required)) {
      setConfiguring(skill);
      return;
    }
    if (existing) {
      const { error } = await supabase.from("user_skills").update({ enabled: next }).eq("id", existing.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("user_skills").insert({
        user_id: u.user.id, skill_id: skill.id, enabled: next, config: {},
      });
      if (error) return toast.error(error.message);
    }
    toast.success(next ? `${skill.name} enabled` : `${skill.name} disabled`);
    load();
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/chat"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1.5" />Back</Button></Link>
            <div className="flex items-center gap-2">
              <Puzzle className="w-5 h-5 text-primary" />
              <h1 className="font-semibold">Skills & Plugins</h1>
            </div>
          </div>
          <Link to="/settings"><Button variant="ghost" size="sm">Settings</Button></Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold tracking-tight mb-1">Extend your AI with tools</h2>
          <p className="text-sm text-muted-foreground">Enable skills to give any model new capabilities. Configuration is stored per user.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search skills…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-3 py-1.5 text-xs rounded-full border transition ${
                  category === c
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:border-primary/40"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-muted-foreground text-sm">Loading skills…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">No skills match your filters.</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((skill) => {
              const state = mineBySkill.get(skill.id);
              const Icon = ICONS[skill.icon ?? ""] ?? Puzzle;
              const enabled = !!state?.enabled;
              return (
                <div key={skill.id} className="bg-card border border-border rounded-2xl p-5 flex flex-col hover:border-primary/40 transition">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/40 text-primary flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <Switch checked={enabled} onCheckedChange={(v) => toggle(skill, v)} />
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{skill.name}</h3>
                    {enabled && <Check className="w-3.5 h-3.5 text-primary" />}
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    {skill.provider} · {skill.category}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1">{skill.description}</p>
                  {skill.config_schema.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-4 justify-start px-0 h-8 text-xs"
                      onClick={() => setConfiguring(skill)}
                    >
                      <Settings2 className="w-3.5 h-3.5 mr-1.5" />
                      Configure
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      <ConfigureDialog
        skill={configuring}
        existing={configuring ? mineBySkill.get(configuring.id) : undefined}
        onClose={() => setConfiguring(null)}
        onSaved={() => { setConfiguring(null); load(); }}
      />
    </div>
  );
}

function ConfigureDialog({
  skill, existing, onClose, onSaved,
}: {
  skill: Skill | null;
  existing: UserSkill | undefined;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValues(existing?.config ?? {});
  }, [existing, skill?.id]);

  if (!skill) return null;

  async function save() {
    if (!skill) return;
    for (const f of skill.config_schema) {
      if (f.required && !values[f.key]?.trim()) {
        toast.error(`${f.label} is required`);
        return;
      }
    }
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setSaving(false); return; }
    if (existing) {
      const { error } = await supabase.from("user_skills")
        .update({ config: values, enabled: true })
        .eq("id", existing.id);
      if (error) { toast.error(error.message); setSaving(false); return; }
    } else {
      const { error } = await supabase.from("user_skills").insert({
        user_id: u.user.id, skill_id: skill.id, enabled: true, config: values,
      });
      if (error) { toast.error(error.message); setSaving(false); return; }
    }
    setSaving(false);
    toast.success(`${skill.name} configured`);
    onSaved();
  }

  return (
    <Dialog open={!!skill} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configure {skill.name}</DialogTitle>
          <DialogDescription>Credentials are stored securely and scoped to your account.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {skill.config_schema.length === 0 ? (
            <p className="text-sm text-muted-foreground">This skill has no configuration.</p>
          ) : skill.config_schema.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <Label>{f.label}{f.required && <span className="text-destructive"> *</span>}</Label>
              {f.type === "textarea" ? (
                <Textarea
                  value={values[f.key] ?? ""}
                  onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                />
              ) : (
                <Input
                  type={f.type === "password" ? "password" : "text"}
                  value={values[f.key] ?? ""}
                  onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                />
              )}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save & enable"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
