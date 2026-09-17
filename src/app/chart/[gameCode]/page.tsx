import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { getGameDisplayName, getGameAbout, getGameFaq } from "@/lib/game-content";
import { ChartClient } from "./ChartClient";

// Custom games use a separate API from the scraped/Firestore-backed games.
const CUSTOM_GAME_KEYS = ["kohlapur", "manipur", "up-bazar", "palwal-city", "mathura-city"];

const MONTH_NAMES = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

interface InitialChartData {
  rows: { date: string; day: string; result: string }[];
  month: string;
  year: string;
}

// Server-side fetch of the current month's chart data, reusing the same
// API routes the client-side month navigation already calls. This is what
// lets search engines see real result data in the first HTML response
// instead of an empty shell that only fills in after JS runs.
async function getInitialChartData(gameCode: string): Promise<InitialChartData> {
  const now = new Date();
  const month = MONTH_NAMES[now.getMonth()];
  const year = String(now.getFullYear());
  const isCustomGame = CUSTOM_GAME_KEYS.includes(gameCode);

  try {
    const url = isCustomGame
      ? `${SITE_URL}/api/custom-games/chart?game=${gameCode}&month=${now.getMonth() + 1}&year=${year}`
      : `${SITE_URL}/api/game-chart?slug=${gameCode}&month=${month}&year=${year}`;

    const res = await fetch(url, { next: { revalidate: 300 } });
    const data = await res.json();
    if (data.success) {
      return {
        rows: (data.results || []) as InitialChartData["rows"],
        month: data.month || month.charAt(0).toUpperCase() + month.slice(1),
        year: data.year || year,
      };
    }
  } catch {
    // Fall through to an empty state; the client component will retry once
    // it mounts, same as the old fully-client-rendered page did.
  }

  return { rows: [], month: month.charAt(0).toUpperCase() + month.slice(1), year };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ gameCode: string }>;
}): Promise<Metadata> {
  const { gameCode } = await params;
  const name = getGameDisplayName(gameCode);
  const title = `${name} Satta King Chart – Result Record & History`;
  const description = `${name} Satta King chart: month-wise historical result record for ${name}. Browse past ${name} results by month on ${SITE_NAME}.`;
  const url = `${SITE_URL}/chart/${gameCode}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
    },
  };
}

export default async function GameChartPage({
  params,
}: {
  params: Promise<{ gameCode: string }>;
}) {
  const { gameCode } = await params;
  const name = getGameDisplayName(gameCode);
  const initial = await getInitialChartData(gameCode);
  const about = getGameAbout(gameCode, name);
  const faq = getGameFaq(gameCode, name);
  const url = `${SITE_URL}/chart/${gameCode}`;

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: `${name} Chart`, item: url },
    ],
  };

  return (
    <div className="bg-white min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="max-w-4xl mx-auto px-3 md:px-4 py-6 md:py-10">
        {/* Breadcrumb */}
        <nav className="text-xs text-gray-500 mb-4">
          <Link href="/" className="hover:text-amber-600">
            Home
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-gray-700">{name} Chart</span>
        </nav>

        <ChartClient
          gameCode={gameCode}
          gameName={name}
          initialRows={initial.rows}
          initialMonth={initial.month}
          initialYear={initial.year}
        />

        {/* About */}
        <section className="mt-10 border-t border-gray-100 pt-8">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-2">
            About the {name} Chart
          </h2>
          <p className="text-sm md:text-base text-gray-600 leading-relaxed">{about}</p>
        </section>

        {/* FAQ */}
        <section className="mt-8">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-3">
            {name} Chart – FAQs
          </h2>
          <div className="space-y-4">
            {faq.map((item) => (
              <div key={item.q}>
                <p className="font-semibold text-gray-800 text-sm md:text-base">{item.q}</p>
                <p className="text-sm text-gray-600 mt-1 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
