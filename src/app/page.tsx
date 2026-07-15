import type { Metadata } from "next";
import HomeClient from "./HomeClient";
import { getHomeData } from "@/lib/home-data";
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
  const initialData = await getHomeData();
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </>
  );
}
