/* ============================================================
   Site settings — editable homepage content stored in D1.
   Currently: the homepage hero. Stored as JSON under key "hero".
   ============================================================ */
import { eq } from "drizzle-orm";
import { siteSettings } from "./db/schema";
import type { getDb } from "./db";

type Db = Awaited<ReturnType<typeof getDb>>;

export type HeroStat = { value: string; label: string };
export type HeroConfig = {
  layout: "A" | "B" | "C";
  eyebrow: string;
  title: string;
  titleAccent: string; // emphasized tail (rendered teal/italic on layout B)
  subtitle: string;
  ctaText: string;
  ctaLink: string; // "category" | "cat:<slug>" | "deals"
  imageUrl: string;
  stats: HeroStat[]; // shown on layout A
};

// Default mirrors the original Hero B copy so the storefront is unchanged
// until an admin edits it. Also mirrored on the client for first paint.
export const HERO_DEFAULT: HeroConfig = {
  layout: "B",
  eyebrow: "New arrivals weekly",
  title: "Everything you need,",
  titleAccent: "without the worry.",
  subtitle:
    "Phones, fashion, shoes, appliances & home essentials. Every order is checked, packed with care, and delivered to your door across Bangladesh.",
  ctaText: "Start shopping",
  ctaLink: "category",
  imageUrl: "",
  stats: [
    { value: "50k+", label: "happy customers" },
    { value: "4.8★", label: "avg. rating" },
    { value: "64", label: "districts served" },
  ],
};

const str = (v: unknown, max: number, fallback = ""): string =>
  typeof v === "string" ? v.slice(0, max) : fallback;

/** Coerce arbitrary input into a safe HeroConfig (clamped lengths, valid enum). */
export function normalizeHero(input: unknown): HeroConfig {
  const o = (input ?? {}) as Record<string, unknown>;
  const layout = o.layout === "A" || o.layout === "C" ? o.layout : "B";
  const statsIn = Array.isArray(o.stats) ? o.stats : HERO_DEFAULT.stats;
  const stats: HeroStat[] = statsIn.slice(0, 3).map((s) => {
    const so = (s ?? {}) as Record<string, unknown>;
    return { value: str(so.value, 16), label: str(so.label, 40) };
  });
  return {
    layout,
    eyebrow: str(o.eyebrow, 80),
    title: str(o.title, 160, HERO_DEFAULT.title),
    titleAccent: str(o.titleAccent, 120),
    subtitle: str(o.subtitle, 400),
    ctaText: str(o.ctaText, 40),
    ctaLink: str(o.ctaLink, 60, "category") || "category",
    imageUrl: str(o.imageUrl, 600),
    stats: stats.length ? stats : HERO_DEFAULT.stats,
  };
}

export async function getHero(db: Db): Promise<HeroConfig> {
  const row = await db.select().from(siteSettings).where(eq(siteSettings.key, "hero")).get();
  if (!row) return HERO_DEFAULT;
  try {
    return normalizeHero(JSON.parse(row.value));
  } catch {
    return HERO_DEFAULT;
  }
}

export async function setHero(db: Db, config: HeroConfig): Promise<void> {
  const value = JSON.stringify(config);
  await db
    .insert(siteSettings)
    .values({ key: "hero", value })
    .onConflictDoUpdate({
      target: siteSettings.key,
      set: { value, updatedAt: new Date() },
    });
}
