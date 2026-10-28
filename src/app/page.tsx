import type { Metadata } from "next";
import Link from "next/link";
import HomeClient from "./HomeClient";
import { getHomeData } from "@/lib/home-data";
import { getPublicBlogPosts } from "@/lib/blog-mongodb";
import { formatBlogDate } from "@/lib/blog-data";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { getHomepageSeo, fillSeoPlaceholders } from "@/lib/homepage-seo";
import {
  DEFAULT_CONTENT_HTML,
  DEFAULT_FAQS,
  DEFAULT_META_DESCRIPTION,
  DEFAULT_META_TITLE,
} from "@/lib/homepage-seo-defaults";

// Results must be read afresh when a visitor reloads the homepage.
// Live updates after the initial render are handled by HomeClient.
export const dynamic = "force-dynamic";
export const revalidate = 0;

function getIndiaDate(): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

function getIndiaYear(): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", year: "numeric" }).format(new Date());
}

// Homepage SEO from the admin panel, with blanks filled by the defaults
// and {date} / {year} placeholders replaced.
async function getResolvedSeo() {
  const seo = await getHomepageSeo();
  const date = getIndiaDate();
  const year = getIndiaYear();
  const fill = (text: string) => fillSeoPlaceholders(text, date, year);

  const title = fill(seo.metaTitle || DEFAULT_META_TITLE);
  const description = fill(seo.metaDescription || DEFAULT_META_DESCRIPTION);
  return {
    date,
    title,
    description,
    keywords: seo.keywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean),
    ogTitle: fill(seo.ogTitle) || title,
    ogDescription: fill(seo.ogDescription) || description,
    ogImage: seo.ogImage,
    robotsIndex: seo.robotsIndex,
    contentHtml: fill(seo.contentHtml || DEFAULT_CONTENT_HTML),
    faqs: (seo.faqs.length ? seo.faqs : DEFAULT_FAQS).map((f) => ({
      question: fill(f.question),
      answer: fill(f.answer),
    })),
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getResolvedSeo();

  return {
    // Absolute prevents the root title template from appending the site name.
    title: { absolute: seo.title },
    description: seo.description,
    ...(seo.keywords.length ? { keywords: seo.keywords } : {}),
    robots: { index: seo.robotsIndex, follow: true },
    alternates: { canonical: SITE_URL },
    openGraph: {
      type: "website",
      locale: "en_IN",
      url: SITE_URL,
      siteName: SITE_NAME,
      title: seo.ogTitle,
      description: seo.ogDescription,
      ...(seo.ogImage ? { images: [{ url: seo.ogImage }] } : {}),
    },
    twitter: {
      card: seo.ogImage ? "summary_large_image" : "summary",
      title: seo.ogTitle,
      description: seo.ogDescription,
      ...(seo.ogImage ? { images: [seo.ogImage] } : {}),
    },
  };
}

export default async function HomePage() {
  const [initialData, posts, seo] = await Promise.all([
    getHomeData(),
    getPublicBlogPosts(),
    getResolvedSeo(),
  ]);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        inLanguage: "en-IN",
      },
      {
        "@type": "FAQPage",
        mainEntity: seo.faqs.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      },
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/#webpage`,
        url: SITE_URL,
        name: seo.title,
        description: seo.description,
        isPartOf: { "@id": `${SITE_URL}/#website` },
      },
    ],
  };

  return (
    <>
      <HomeClient initialData={initialData} seoHtml={seo.contentHtml} seoFaqs={seo.faqs} />
      {posts.length > 0 && (
        <section className="border-t-4 border-black bg-[#fffdf0] px-4 py-10 md:py-14" aria-labelledby="latest-blogs-title">
          <div className="mx-auto max-w-7xl">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-600">Latest articles</p>
                <h2 id="latest-blogs-title" className="mt-1 text-2xl font-black text-slate-950 md:text-3xl">From the Blog</h2>
              </div>
              <Link href="/blog" className="rounded-xl bg-black px-4 py-2.5 text-sm font-black text-yellow-100 transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-yellow-300">View all</Link>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {posts.slice(0, 3).map((post) => (
                <Link key={post.slug} href={`/blog/${post.slug}`} className="group overflow-hidden rounded-2xl border-2 border-yellow-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-yellow-400 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-yellow-300">
                  {post.image ? (
                    <img src={post.image} alt={post.title} className="aspect-[16/9] w-full object-cover" />
                  ) : (
                    <div className="grid aspect-[16/9] place-items-center bg-yellow-100 text-4xl font-black text-yellow-600" aria-hidden="true">A7</div>
                  )}
                  <div className="p-5">
                    <p className="text-xs font-bold text-amber-700">{formatBlogDate(post.date)}</p>
                    <h3 className="mt-2 line-clamp-2 text-lg font-black leading-snug text-slate-950 transition group-hover:text-amber-700">{post.title}</h3>
                    {post.excerpt && <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{post.excerpt}</p>}
                    <span className="mt-4 inline-block text-sm font-black text-amber-700">Read article →</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </>
  );
}
