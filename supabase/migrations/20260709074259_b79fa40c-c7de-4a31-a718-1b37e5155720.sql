
CREATE TYPE public.marketplace_kind AS ENUM ('template', 'plugin', 'agent');

CREATE TABLE public.marketplace_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  kind public.marketplace_kind NOT NULL,
  category text NOT NULL DEFAULT 'general',
  tags text[] NOT NULL DEFAULT '{}',
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  published boolean NOT NULL DEFAULT true,
  install_count integer NOT NULL DEFAULT 0,
  view_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX marketplace_items_kind_idx ON public.marketplace_items(kind);
CREATE INDEX marketplace_items_category_idx ON public.marketplace_items(category);
CREATE INDEX marketplace_items_author_idx ON public.marketplace_items(author_id);

GRANT SELECT ON public.marketplace_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketplace_items TO authenticated;
GRANT ALL ON public.marketplace_items TO service_role;

ALTER TABLE public.marketplace_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public can view published items"
  ON public.marketplace_items FOR SELECT
  USING (published = true OR auth.uid() = author_id);
CREATE POLICY "authors insert own items"
  ON public.marketplace_items FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id);
CREATE POLICY "authors update own items"
  ON public.marketplace_items FOR UPDATE TO authenticated
  USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);
CREATE POLICY "authors delete own items"
  ON public.marketplace_items FOR DELETE TO authenticated
  USING (auth.uid() = author_id);

CREATE TRIGGER marketplace_items_set_updated_at
  BEFORE UPDATE ON public.marketplace_items
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();


CREATE TABLE public.marketplace_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.marketplace_items(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(item_id, user_id)
);
CREATE INDEX marketplace_ratings_item_idx ON public.marketplace_ratings(item_id);

GRANT SELECT ON public.marketplace_ratings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketplace_ratings TO authenticated;
GRANT ALL ON public.marketplace_ratings TO service_role;

ALTER TABLE public.marketplace_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone views ratings"
  ON public.marketplace_ratings FOR SELECT USING (true);
CREATE POLICY "users insert own rating"
  ON public.marketplace_ratings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own rating"
  ON public.marketplace_ratings FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users delete own rating"
  ON public.marketplace_ratings FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER marketplace_ratings_set_updated_at
  BEFORE UPDATE ON public.marketplace_ratings
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();


CREATE OR REPLACE VIEW public.marketplace_items_with_stats
WITH (security_invoker = true) AS
SELECT
  i.*,
  COALESCE(AVG(r.rating)::numeric(3,2), 0) AS avg_rating,
  COUNT(r.id)::int AS rating_count
FROM public.marketplace_items i
LEFT JOIN public.marketplace_ratings r ON r.item_id = i.id
GROUP BY i.id;

GRANT SELECT ON public.marketplace_items_with_stats TO anon, authenticated;
