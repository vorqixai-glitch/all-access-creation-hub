export const KINDS = ["template", "plugin", "agent"] as const;
export type Kind = (typeof KINDS)[number];

export const CATEGORIES = [
  "general",
  "productivity",
  "writing",
  "coding",
  "research",
  "marketing",
  "data",
  "design",
  "education",
  "fun",
] as const;

export type MarketplaceItem = {
  id: string;
  author_id: string;
  title: string;
  slug: string;
  description: string;
  kind: Kind;
  category: string;
  tags: string[];
  content: Record<string, unknown>;
  published: boolean;
  install_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
  avg_rating?: number;
  rating_count?: number;
};

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
