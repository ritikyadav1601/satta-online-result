import type { Metadata } from "next";
import Link from "next/link";
import HomeClient from "./HomeClient";
import { getHomeData } from "@/lib/home-data";
import { getPublicBlogPosts } from "@/lib/blog-mongodb";
import { formatBlogDate } from "@/lib/blog-data";
import { SITE_NAME, SITE_URL } from "@/lib/site";

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

export async function generateMetadata(): Promise<Metadata> {
  const date = getIndiaDate();
  const title = `Satta Online Result ${date} | Today's Satta King Result & Charts`;
  const description = `Check the Satta Online Result for ${date} with today's Satta King Result, Gali Result, Desawar Result, Faridabad Result, Ghaziabad Result, historical charts, and old records on SattaOnlineResult.com.`;

  return {
    // Absolute prevents the root title template from appending the site name.
    title: { absolute: title },
    description,
    alternates: { canonical: SITE_URL },
    openGraph: {
      type: "website",
      locale: "en_IN",
      url: SITE_URL,
      siteName: SITE_NAME,
      title,
      description,
    },
  };
}

export default async function HomePage() {
  const [initialData, posts] = await Promise.all([
    getHomeData(),
    getPublicBlogPosts(),
  ]);
  const date = getIndiaDate();
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
        mainEntity: [
          {
            "@type": "Question",
            name: "What is SattaOnlineResult.com?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "SattaOnlineResult.com is an informational website providing Satta King Results, charts, old records, and historical result information in an organized format.",
            },
          },
          {
            "@type": "Question",
            name: "How often are Satta King Results updated?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Result information is updated regularly whenever the latest publicly available updates become available.",
            },
          },
          {
            "@type": "Question",
            name: "Can I check old Satta charts on this website?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. Visitors can browse historical charts, previous records, and archived result information through dedicated chart sections.",
            },
          },
        ],
      },
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/#webpage`,
        url: SITE_URL,
        name: `Satta Online Result ${date}`,
        isPartOf: { "@id": `${SITE_URL}/#website` },
      },
    ],
  };

  return (
    <>
      <HomeClient initialData={initialData} />
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
