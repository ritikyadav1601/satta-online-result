// Per-game display names, and templated About / FAQ content for the
// /chart/[gameCode] pages. There are 100+ possible gameCode values (fixed
// top games, custom games, and anything scraper-discovered), so the About
// and FAQ copy is generated from a small set of templates picked
// deterministically per slug -- each game gets one consistent variant
// (not randomised per request) rather than every chart page repeating the
// exact same paragraph, which reads as thin/duplicate content to search
// engines.

// Canonical display names for the games we know about (fixed top games +
// custom games + common alias spellings). Anything not listed falls back
// to a title-cased version of the slug.
const KNOWN_GAME_NAMES: Record<string, string> = {
  "sadar-bazar": "Sadar Bazar",
  "gwalior": "Gwalior",
  "delhi-bazar": "Delhi Bazar",
  "delhi-matka": "Delhi Matka",
  "shri-ganesh": "Shri Ganesh",
  "agra": "Agra",
  "faridabad": "Faridabad",
  "fridabad": "Faridabad",
  "frbd": "Faridabad",
  "alwar": "Alwar",
  "gaziabad": "Ghaziabad",
  "ghaziabad": "Ghaziabad",
  "gzbd": "Ghaziabad",
  "dwarka": "Dwarka",
  "gali": "Gali",
  "desawar": "Desawar",
  "disawar": "Desawar",
  "desawer": "Desawar",
  "dswr": "Desawar",
  "kohlapur": "Kohlapur",
  "manipur": "Manipur",
  "up-bazar": "UP Bazar",
  "palwal-city": "Palwal City",
  "mathura-city": "Mathura City",
};

export function getGameDisplayName(slug: string): string {
  const key = slug.toLowerCase().trim();
  if (KNOWN_GAME_NAMES[key]) return KNOWN_GAME_NAMES[key];
  return key
    .replace(/-/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// Small deterministic hash so the same game always gets the same content
// variant on every request/build, while different games spread across a
// handful of distinct templates.
function variantIndex(slug: string, variants: number): number {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) % 997;
  }
  return hash % variants;
}

const ABOUT_TEMPLATES: ((name: string, resultTime?: string) => string)[] = [
  (name, resultTime) =>
    `The ${name} Satta King chart on this page lists previously published ${name} results, organised month by month so you can look up an exact date's outcome without scrolling through one long list.${
      resultTime ? ` ${name} results are typically published around ${resultTime} IST.` : ""
    } Use the arrows above the chart to move between months; each row shows the date, the day of the week, and the recorded result for that day.`,
  (name, resultTime) =>
    `This chart is a historical record for ${name} -- a month-wise archive of results that have already been declared and published.${
      resultTime ? ` The ${name} board normally updates close to ${resultTime} IST.` : ""
    } It is meant for reference and record-keeping rather than as a way to predict a future result, since past outcomes have no bearing on future ones.`,
  (name, resultTime) =>
    `Below is the month-wise ${name} result record. Each entry reflects a result that was already published on that date${
      resultTime ? `, with the ${name} board usually settling around ${resultTime} IST` : ""
    }. Switch months using the navigation above to browse older or more recent records for ${name}.`,
];

const FAQ_TEMPLATES: ((name: string) => { q: string; a: string }[])[] = [
  (name) => [
    {
      q: `What does this ${name} chart show?`,
      a: `It shows the ${name} results that have already been published, organised by month and date, so you can look back at a specific day's outcome.`,
    },
    {
      q: `How often is the ${name} chart updated?`,
      a: `The current month's ${name} entry is added once that day's result has been published; you can switch months to see earlier records.`,
    },
    {
      q: `Can past ${name} results predict a future result?`,
      a: `No. These are historical records only -- past results do not determine or predict any future outcome.`,
    },
    {
      q: `Is this the official ${name} result?`,
      a: `This page republishes publicly available ${name} result information for reference. Always verify independently before relying on any published number.`,
    },
  ],
  (name) => [
    {
      q: `How do I read the ${name} chart?`,
      a: `Each row is one date: the date number, the day of the week, and the result recorded for ${name} on that day. Use the month arrows to move backward or forward.`,
    },
    {
      q: `Why does a date show "XX" instead of a number?`,
      a: `"XX" means no result has been recorded for ${name} on that date yet, or the record for that day is not available.`,
    },
    {
      q: `Are older ${name} months available?`,
      a: `Yes -- use the left arrow above the chart to go back through previous months of ${name} records.`,
    },
    {
      q: `Does this page guarantee the accuracy of ${name} results?`,
      a: `The chart reflects publicly published information. For anything important, cross-check with another independent source.`,
    },
  ],
  (name) => [
    {
      q: `What is this page for?`,
      a: `It's a month-wise historical chart for ${name} -- a record of results that have already been declared, kept for reference.`,
    },
    {
      q: `Can I see a specific month for ${name}?`,
      a: `Yes -- use the arrows above the chart to navigate to any earlier month; the current month loads by default.`,
    },
    {
      q: `Is playing based on this chart a good idea?`,
      a: `No historical chart can reliably predict a future result. Gambling carries financial risk and laws vary by location -- please review the responsible-play guidance on our blog.`,
    },
    {
      q: `Where can I check today's live result?`,
      a: `The homepage lists today's live and upcoming results across all games, including ${name}.`,
    },
  ],
];

export function getGameAbout(slug: string, name: string, resultTime?: string): string {
  const idx = variantIndex(slug, ABOUT_TEMPLATES.length);
  return ABOUT_TEMPLATES[idx](name, resultTime);
}

export function getGameFaq(slug: string, name: string): { q: string; a: string }[] {
  const idx = variantIndex(slug, FAQ_TEMPLATES.length);
  return FAQ_TEMPLATES[idx](name);
}
