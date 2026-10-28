import { cache } from "react";
import { DEFAULT_SITE_ID, getKhaiwalDatabase } from "./khaiwal-mongodb";

// Homepage SEO settings, editable from the admin panel (/add-game-value → Homepage SEO tab).
// Stored in the Khaiwal MongoDB (collection "homepage_seo"), one document per siteId.

export type SeoFaq = { question: string; answer: string };

export type HomepageSeo = {
  metaTitle: string;
  metaDescription: string;
  keywords: string; // comma separated
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  robotsIndex: boolean;
  contentHtml: string; // rendered at the bottom of the homepage
  faqs: SeoFaq[]; // used for FAQPage JSON-LD (and shown under the content)
  updatedAt?: string;
};

export const EMPTY_HOMEPAGE_SEO: HomepageSeo = {
  metaTitle: "",
  metaDescription: "",
  keywords: "",
  ogTitle: "",
  ogDescription: "",
  ogImage: "",
  robotsIndex: true,
  contentHtml: "",
  faqs: [],
};

const collectionName = "homepage_seo";

const str = (v: unknown, max = 100000) => String(v ?? "").trim().slice(0, max);

// Basic clean-up of admin HTML: removes <script> tags, inline event handlers
// (onclick=...) and javascript: links. All other HTML is kept as written.
export function cleanHtml(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, "")
    .replace(/<script\b[^>]*\/?>/gi, "")
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href|src)\s*=\s*(["']?)\s*javascript:[^"'\s>]*\2/gi, '$1="#"');
}

export function normalizeHomepageSeo(input: Partial<HomepageSeo> | null | undefined): HomepageSeo {
  const d = input || {};
  const faqs = Array.isArray(d.faqs) ? d.faqs : [];
  return {
    metaTitle: str(d.metaTitle, 300),
    metaDescription: str(d.metaDescription, 1000),
    keywords: str(d.keywords, 2000),
    ogTitle: str(d.ogTitle, 300),
    ogDescription: str(d.ogDescription, 1000),
    ogImage: str(d.ogImage, 1000),
    robotsIndex: d.robotsIndex !== false,
    contentHtml: cleanHtml(str(d.contentHtml, 300000)),
    faqs: faqs
      .map((f) => ({ question: str(f?.question, 500), answer: str(f?.answer, 5000) }))
      .filter((f) => f.question && f.answer)
      .slice(0, 50),
    updatedAt: d.updatedAt ? String(d.updatedAt) : undefined,
  };
}

// cache() dedupes the read between generateMetadata() and the page render.
export const getHomepageSeo = cache(async (siteId: string = DEFAULT_SITE_ID): Promise<HomepageSeo> => {
  try {
    const doc = await (await getKhaiwalDatabase())
      .collection(collectionName)
      .findOne({ siteId }, { projection: { _id: 0, siteId: 0 } });
    return normalizeHomepageSeo(doc as Partial<HomepageSeo> | null);
  } catch (error) {
    console.error("[homepage-seo] read failed:", (error as Error).message);
    return { ...EMPTY_HOMEPAGE_SEO };
  }
});

export async function saveHomepageSeo(input: Partial<HomepageSeo>, siteId: string = DEFAULT_SITE_ID): Promise<HomepageSeo> {
  const cleaned = normalizeHomepageSeo(input);
  const updatedAt = new Date().toISOString();
  await (await getKhaiwalDatabase()).collection(collectionName).updateOne(
    { siteId },
    { $set: { ...cleaned, updatedAt, siteId } },
    { upsert: true },
  );
  return { ...cleaned, updatedAt };
}

// Replaces {date} and {year} placeholders, e.g. "Satta Result {date}".
export function fillSeoPlaceholders(text: string, date: string, year: string): string {
  return text.replace(/\{date\}/gi, date).replace(/\{year\}/gi, year);
}
