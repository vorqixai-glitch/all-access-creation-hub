import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { KINDS, CATEGORIES, slugify, type Kind } from "@/lib/marketplace";
import { Sparkles, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/marketplace/new")({
  ssr: false,
  component: NewListing,
});

function NewListing() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState<Kind>("template");
  const [category, setCategory] = useState<string>("general");
  const [tags, setTags] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) navigate({ to: "/auth" });
      else setUserId(data.user.id);
    });
  }, [navigate]);

  const submit = async () => {
    if (!userId) return;
    if (title.trim().length < 3) { toast.error("Title too short"); return; }
    setSubmitting(true);
    const baseSlug = slugify(title) || `item-${Date.now()}`;
    const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
    const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);
    let parsedContent: unknown = {};
    if (content.trim()) {
      try { parsedContent = JSON.parse(content); }
      catch { parsedContent = { body: content }; }
    }
    const { data, error } = await (supabase as any)
      .from("marketplace_items")
      .insert({
        author_id: userId,
        title: title.trim(),
        slug,
        description: description.trim(),
        kind,
        category,
        tags: tagList,
        content: parsedContent,
        published: true,
      })
      .select("slug")
      .single();
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Published!");
    navigate({ to: "/marketplace/$slug", params: { slug: data.slug } });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/70 border-b border-border">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-semibold tracking-tight">Nexus</span>
          </Link>
          <Link to="/marketplace"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Marketplace</Button></Link>
        </div>
      </header>

      <section className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight mb-2">Publish a listing</h1>
        <p className="text-muted-foreground mb-8">Share a template, plugin, or agent with the community.</p>

        <div className="space-y-5 bg-card border border-border rounded-2xl p-6">
          <Field label="Title">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Email triage agent" />
          </Field>

          <Field label="Type">
            <div className="flex gap-2">
              {KINDS.map((k) => (
                <button key={k} onClick={() => setKind(k)}
                  className={`px-3 py-1.5 rounded-full text-sm capitalize border transition-colors ${
                    kind === k ? "bg-primary text-primary-foreground border-primary" : "bg-transparent border-border hover:border-primary/40"
                  }`}>{k}</button>
              ))}
            </div>
          </Field>

          <Field label="Category">
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className="w-full h-10 px-3 rounded-md bg-background border border-input text-sm">
              {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
          </Field>

          <Field label="Description">
            <Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does it do? Who is it for?" />
          </Field>

          <Field label="Tags" hint="comma-separated">
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="email, gmail, automation" />
          </Field>

          <Field label="Content" hint="JSON or free text (system prompt, config, instructions)">
            <Textarea rows={6} value={content} onChange={(e) => setContent(e.target.value)} placeholder='{"system_prompt": "You are…"}' className="font-mono text-xs" />
          </Field>

          <div className="flex justify-end gap-2">
            <Link to="/marketplace"><Button variant="ghost">Cancel</Button></Link>
            <Button onClick={submit} disabled={submitting}>{submitting ? "Publishing…" : "Publish"}</Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-medium mb-1.5 flex items-center gap-2">
        {label}
        {hint && <span className="text-xs text-muted-foreground font-normal">— {hint}</span>}
      </label>
      {children}
    </div>
  );
}
