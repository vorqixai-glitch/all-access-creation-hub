import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StarRating } from "@/components/marketplace/StarRating";
import { KINDS, CATEGORIES, type Kind, type MarketplaceItem } from "@/lib/marketplace";
import { Sparkles, Plus, Search } from "lucide-react";

export const Route = createFileRoute("/marketplace")({
  head: () => ({
    meta: [
      { title: "Marketplace — Nexus" },
      { name: "description", content: "Discover templates, plugins, and agents built by the Nexus community." },
      { property: "og:title", content: "Marketplace — Nexus" },
      { property: "og:description", content: "Discover templates, plugins, and agents built by the Nexus community." },
    ],
  }),
  component: MarketplacePage,
});

function MarketplacePage() {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [kind, setKind] = useState<Kind | "all">("all");
  const [category, setCategory] = useState<string>("all");
  const [q, setQ] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      let query = (supabase as any)
        .from("marketplace_items_with_stats")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(100);
      if (kind !== "all") query = query.eq("kind", kind);
      if (category !== "all") query = query.eq("category", category);
      const { data, error } = await query;
      if (!cancelled) {
        if (error) console.error(error);
        setItems((data ?? []) as MarketplaceItem[]);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [kind, category]);

  const filtered = q.trim()
    ? items.filter((i) => {
        const s = q.toLowerCase();
        return i.title.toLowerCase().includes(s) || i.description.toLowerCase().includes(s) || i.tags.some((t) => t.toLowerCase().includes(s));
      })
    : items;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/70 border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-semibold tracking-tight">Nexus</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link to="/marketplace/new"><Button size="sm" variant="outline"><Plus className="w-4 h-4 mr-1" />Publish</Button></Link>
            <Link to="/chat"><Button size="sm">Open app</Button></Link>
          </nav>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 pt-12 pb-6">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">Marketplace</h1>
        <p className="mt-3 text-muted-foreground max-w-2xl">Templates, plugins, and agents built by the community. Fork them, remix them, publish your own.</p>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name, description, tag…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 h-11" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Chip active={kind === "all"} onClick={() => setKind("all")}>All types</Chip>
          {KINDS.map((k) => (
            <Chip key={k} active={kind === k} onClick={() => setKind(k)}>{k}s</Chip>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Chip active={category === "all"} onClick={() => setCategory("all")} muted>Any category</Chip>
          {CATEGORIES.map((c) => (
            <Chip key={c} active={category === c} onClick={() => setCategory(c)} muted>{c}</Chip>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24">
        {loading ? (
          <div className="text-center py-16 text-muted-foreground">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border rounded-2xl">
            <p className="text-muted-foreground mb-4">Nothing here yet.</p>
            <Link to="/marketplace/new"><Button><Plus className="w-4 h-4 mr-1" />Be the first to publish</Button></Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Chip({ active, onClick, muted, children }: { active: boolean; onClick: () => void; muted?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : muted
            ? "bg-transparent text-muted-foreground border-border hover:border-primary/40"
            : "bg-card text-foreground border-border hover:border-primary/40"
      }`}
    >
      {children}
    </button>
  );
}

function ItemCard({ item }: { item: MarketplaceItem }) {
  return (
    <Link to="/marketplace/$slug" params={{ slug: item.slug }} className="block bg-card border border-border rounded-2xl p-5 hover:border-primary/40 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary capitalize">{item.kind}</span>
        <span className="text-xs text-muted-foreground capitalize">{item.category}</span>
      </div>
      <h3 className="font-semibold text-lg mb-1.5 line-clamp-1">{item.title}</h3>
      <p className="text-sm text-muted-foreground line-clamp-2 mb-4 min-h-[2.5rem]">{item.description || "No description."}</p>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <StarRating value={Number(item.avg_rating) || 0} readOnly size={14} />
          <span>{Number(item.avg_rating || 0).toFixed(1)} ({item.rating_count ?? 0})</span>
        </div>
        {item.tags.length > 0 && <span className="truncate max-w-[50%]">#{item.tags.slice(0, 2).join(" #")}</span>}
      </div>
    </Link>
  );
}
