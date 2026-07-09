import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "@/components/marketplace/StarRating";
import type { MarketplaceItem } from "@/lib/marketplace";
import { Sparkles, ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/marketplace/$slug")({
  component: ItemDetail,
});

type Rating = { id: string; user_id: string; rating: number; review: string | null; created_at: string };

function ItemDetail() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<MarketplaceItem | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [myRating, setMyRating] = useState(0);
  const [myReview, setMyReview] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data: it } = await (supabase as any)
      .from("marketplace_items_with_stats")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (!it) { setLoading(false); return; }
    setItem(it as MarketplaceItem);
    const { data: rs } = await (supabase as any)
      .from("marketplace_ratings")
      .select("*")
      .eq("item_id", it.id)
      .order("created_at", { ascending: false });
    setRatings((rs ?? []) as Rating[]);
    const { data: auth } = await supabase.auth.getUser();
    setUserId(auth.user?.id ?? null);
    if (auth.user) {
      const mine = (rs ?? []).find((r: Rating) => r.user_id === auth.user!.id);
      if (mine) { setMyRating(mine.rating); setMyReview(mine.review ?? ""); }
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [slug]);

  const submitRating = async () => {
    if (!userId) { navigate({ to: "/auth" }); return; }
    if (myRating < 1) { toast.error("Pick a star rating"); return; }
    setSubmitting(true);
    const { error } = await (supabase as any)
      .from("marketplace_ratings")
      .upsert({ item_id: item!.id, user_id: userId, rating: myRating, review: myReview || null }, { onConflict: "item_id,user_id" });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Thanks for rating!");
    load();
  };

  const deleteItem = async () => {
    if (!confirm("Delete this listing?")) return;
    const { error } = await (supabase as any).from("marketplace_items").delete().eq("id", item!.id);
    if (error) { toast.error(error.message); return; }
    navigate({ to: "/marketplace" });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  if (!item) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <p className="text-muted-foreground">Item not found.</p>
      <Link to="/marketplace"><Button variant="outline">Back to marketplace</Button></Link>
    </div>
  );

  const isOwner = userId === item.author_id;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/70 border-b border-border">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-semibold tracking-tight">Nexus</span>
          </Link>
          <Link to="/marketplace"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Marketplace</Button></Link>
        </div>
      </header>

      <article className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary capitalize">{item.kind}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">{item.category}</span>
          {!item.published && <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-500">Draft</span>}
        </div>
        <h1 className="text-4xl font-semibold tracking-tight mb-3">{item.title}</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <StarRating value={Number(item.avg_rating) || 0} readOnly />
          <span>{Number(item.avg_rating || 0).toFixed(1)} · {item.rating_count ?? 0} rating{item.rating_count === 1 ? "" : "s"}</span>
        </div>
        <p className="text-lg text-muted-foreground whitespace-pre-wrap mb-6">{item.description}</p>
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {item.tags.map((t) => <span key={t} className="text-xs px-2 py-1 rounded-full bg-accent/40 text-foreground">#{t}</span>)}
          </div>
        )}

        {isOwner && (
          <div className="mb-8">
            <Button variant="outline" size="sm" onClick={deleteItem}><Trash2 className="w-4 h-4 mr-1" />Delete listing</Button>
          </div>
        )}

        <section className="border-t border-border pt-8">
          <h2 className="text-xl font-semibold mb-4">Ratings & reviews</h2>

          <div className="bg-card border border-border rounded-2xl p-5 mb-6">
            <p className="text-sm font-medium mb-3">{userId ? "Your rating" : "Sign in to rate"}</p>
            <StarRating value={myRating} onChange={setMyRating} size={24} readOnly={!userId} />
            {userId && (
              <>
                <Textarea placeholder="Optional review…" value={myReview} onChange={(e) => setMyReview(e.target.value)} className="mt-3" rows={3} />
                <Button onClick={submitRating} disabled={submitting} className="mt-3" size="sm">{submitting ? "Saving…" : "Submit"}</Button>
              </>
            )}
            {!userId && <div className="mt-3"><Link to="/auth"><Button size="sm">Sign in</Button></Link></div>}
          </div>

          <div className="space-y-3">
            {ratings.length === 0 && <p className="text-sm text-muted-foreground">No reviews yet.</p>}
            {ratings.map((r) => (
              <div key={r.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <StarRating value={r.rating} readOnly size={14} />
                  <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                {r.review && <p className="text-sm text-foreground">{r.review}</p>}
              </div>
            ))}
          </div>
        </section>
      </article>
    </div>
  );
}
