export type Block =
  | { type: "h2"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "myth"; text: string }
  | { type: "reality"; text: string }
  | { type: "html"; html: string };

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  tags: string[];
  content: Block[];
  image?: string;
}

// Public articles are managed through MongoDB from the admin panel.
// These static posts are shown too (a MongoDB post with the same slug wins).
export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "how-to-read-satta-king-chart",
    title: "How to Read a Satta King Chart: A Complete Beginner's Guide",
    excerpt:
      "A step-by-step guide to reading a Satta King chart correctly -- what each column means, how months are organised, and the common mistakes beginners make.",
    date: "2026-07-10",
    readTime: "6 min read",
    tags: ["Satta King", "Chart Guide", "How To"],
    content: [
      { type: "h2", text: "Introduction" },
      {
        type: "p",
        text: "A Satta King chart can look confusing the first time you open one -- rows of dates, days, and numbers with no explanation. This guide breaks down exactly what each part of a chart means and how to navigate it correctly, so you can find any past result without guesswork.",
      },

      { type: "h2", text: "What Information Does a Satta King Chart Contain?" },
      {
        type: "p",
        text: "Most Satta King charts, including the ones on Satta Online Result, are organised as a monthly table. Each row generally represents a single date and shows three things:",
      },
      {
        type: "ul",
        items: [
          "Date -- the day of the month the result belongs to.",
          "Day -- the day of the week (Monday, Tuesday, and so on).",
          "Result -- the number that was published for that date, or \"XX\" if no result is on record for that day.",
        ],
      },

      { type: "h2", text: "Step-by-Step: Reading a Monthly Chart" },
      {
        type: "ul",
        items: [
          "Start by identifying the game name at the top of the chart -- charts are game-specific, so the same date will show a different result on a different game's chart.",
          "Check the month and year shown above the table before reading any row -- this avoids the common mistake of misreading an old month as the current one.",
          "Use the left and right arrows to move between months; the current month is usually shown by default and cannot be navigated past.",
          "Read each row left to right: date, then day, then result.",
          "Treat \"XX\" as \"no record available\" rather than as a result of zero.",
        ],
      },

      { type: "h2", text: "Common Chart Terms Explained" },
      {
        type: "ul",
        items: [
          "Chart -- a historical, month-wise table of previously published results for one game.",
          "Result Time -- the approximate time a game's result is usually published; this can vary slightly day to day.",
          "Record -- any single published result, once it has appeared on the chart.",
          "Game / Market -- the name given to a specific result category, such as Gali or Faridabad.",
        ],
      },

      { type: "h2", text: "Why Charts Are Organised by Month" },
      {
        type: "p",
        text: "Breaking a chart into months keeps each page focused and easy to scan, rather than showing years of history in one long list. It also makes it simple to compare a specific date across different months if you're looking something up for reference.",
      },

      { type: "h2", text: "Myth vs Reality" },
      {
        type: "myth",
        text: "A longer chart history means the results are more predictable.",
      },
      {
        type: "reality",
        text: "No. Chart length only affects how much history is available to look back on -- it has no effect on what a future result will be.",
      },
      {
        type: "myth",
        text: "Every website's chart for the same game will show identical numbers.",
      },
      {
        type: "reality",
        text: "Update timing and formatting can differ between websites, so always confirm a specific date's result against more than one source if it matters to you.",
      },

      { type: "h2", text: "Frequently Asked Questions" },
      {
        type: "p",
        text: "Q. Why does my chart show \"XX\" for some dates?\n\n\"XX\" means no result was recorded for that game on that date -- it is not the same as a result of zero.",
      },
      {
        type: "p",
        text: "Q. Can I jump to a specific old month directly?\n\nMost charts are navigated one month at a time using the arrow controls, rather than jumping directly to a distant month.",
      },
      {
        type: "p",
        text: "Q. Is the most recent entry always today's result?\n\nThe current month's chart updates once each day's result has been published, so the latest row reflects the latest available result, not necessarily \"right now\".",
      },
      {
        type: "p",
        text: "Q. Do charts work the same way for every game?\n\nYes -- the date, day, and result format is consistent across games on Satta Online Result, even though each game has its own separate chart.",
      },

      { type: "h2", text: "Conclusion" },
      {
        type: "p",
        text: "Reading a Satta King chart correctly comes down to three habits: check the game name, confirm the month, and treat every row as a historical record rather than a forecast. Once that's clear, navigating any chart on Satta Online Result -- or anywhere else -- becomes straightforward.",
      },
    ],
  },
  {
    slug: "gali-desawar-faridabad-ghaziabad-result-guide",
    title: "Gali, Desawar, Faridabad और Ghaziabad Result कैसे देखें",
    excerpt:
      "Gali, Desawar, Faridabad और Ghaziabad -- इन चार लोकप्रिय Satta King मार्केट्स के रिजल्ट और चार्ट को सही तरीके से देखने और समझने की पूरी जानकारी।",
    date: "2026-07-22",
    readTime: "5 min read",
    tags: ["Satta King", "Gali", "Desawar", "Result Guide"],
    content: [
      { type: "h2", text: "परिचय" },
      {
        type: "p",
        text: "Gali, Desawar, Faridabad और Ghaziabad -- ये चार नाम Satta King से जुड़ी सबसे ज्यादा खोजी जाने वाली मार्केट्स में शामिल हैं। इस लेख में हम बताएंगे कि इन मार्केट्स के रिजल्ट और हिस्टोरिकल चार्ट को Satta Online Result पर कैसे व्यवस्थित तरीके से देखा जा सकता है।",
      },

      { type: "h2", text: "Gali Market" },
      {
        type: "p",
        text: "Gali का रिजल्ट आमतौर पर रात के समय (लगभग 11:25 PM के आसपास) प्रकाशित होता है। इसका हिस्टोरिकल चार्ट होमपेज से \"Chart\" लिंक पर जाकर महीने-वार देखा जा सकता है।",
      },

      { type: "h2", text: "Desawar Market" },
      {
        type: "p",
        text: "Desawar का रिजल्ट सुबह के समय (लगभग 05:00 AM के आसपास) प्रकाशित होता है, जो इसे बाकी मार्केट्स से अलग बनाता है। पुराने रिकॉर्ड देखने के लिए चार्ट पेज पर महीना बदलकर पीछे जाया जा सकता है।",
      },

      { type: "h2", text: "Faridabad Market" },
      {
        type: "p",
        text: "Faridabad का रिजल्ट शाम को (लगभग 06:00 PM के आसपास) आता है। इसका चार्ट भी अन्य मार्केट्स की तरह ही डेट, दिन और रिजल्ट कॉलम में व्यवस्थित रहता है।",
      },

      { type: "h2", text: "Ghaziabad Market" },
      {
        type: "p",
        text: "Ghaziabad का रिजल्ट रात के शुरुआती समय (लगभग 09:25 PM के आसपास) प्रकाशित होता है। किसी भी पुरानी तारीख का रिकॉर्ड देखने के लिए चार्ट पर सही महीना चुनना जरूरी है।",
      },
      {
        type: "p",
        text: "ध्यान दें: ऊपर दिए गए समय सामान्य संदर्भ के लिए हैं और इनमें दिन-प्रतिदिन थोड़ा बदलाव संभव है। सटीक समय के लिए हमेशा होमपेज पर मौजूद Live Results सेक्शन देखें।",
      },

      { type: "h2", text: "चार्ट में परिणाम कैसे खोजें" },
      {
        type: "ul",
        items: [
          "होमपेज पर जिस गेम का रिजल्ट देखना है, उसके नाम पर क्लिक करें।",
          "\"Chart\" लिंक से उस गेम के मंथली चार्ट पेज पर जाएं।",
          "ऊपर बने ऐरो बटन से सही महीना और साल चुनें।",
          "डेट के सामने दिए गए रिजल्ट कॉलम में परिणाम देखें।",
          "अगर किसी डेट के सामने \"XX\" लिखा है, तो उस दिन का रिकॉर्ड उपलब्ध नहीं है।",
        ],
      },

      { type: "h2", text: "Myth vs Reality" },
      {
        type: "myth",
        text: "चारों मार्केट्स (Gali, Desawar, Faridabad, Ghaziabad) का रिजल्ट एक ही समय पर आता है।",
      },
      {
        type: "reality",
        text: "नहीं, हर मार्केट का अपना अलग समय होता है, इसलिए सही समय जानने के लिए होमपेज का Live Results सेक्शन देखना चाहिए।",
      },
      {
        type: "myth",
        text: "एक मार्केट के पुराने रिकॉर्ड से दूसरी मार्केट का परिणाम पता लगाया जा सकता है।",
      },
      {
        type: "reality",
        text: "नहीं, हर मार्केट का चार्ट स्वतंत्र होता है और एक का इतिहास दूसरे के परिणाम को प्रभावित नहीं करता।",
      },

      { type: "h2", text: "Frequently Asked Questions" },
      {
        type: "p",
        text: "Q. Gali और Desawar में क्या अंतर है?\n\nये दोनों अलग-अलग मार्केट हैं जिनका रिजल्ट अलग-अलग समय पर प्रकाशित होता है और दोनों का चार्ट अलग-अलग रखा जाता है।",
      },
      {
        type: "p",
        text: "Q. क्या इन मार्केट्स का रिजल्ट रोज़ अपडेट होता है?\n\nहां, हर दिन का रिजल्ट प्रकाशित होने के बाद उसे संबंधित गेम के चार्ट में जोड़ दिया जाता है।",
      },
      {
        type: "p",
        text: "Q. पुराने महीनों का रिकॉर्ड कैसे देखें?\n\nचार्ट पेज पर ऊपर बने लेफ्ट ऐरो से पीछे के महीनों में जाया जा सकता है।",
      },
      {
        type: "p",
        text: "Q. क्या चार्ट के आधार पर भविष्य के परिणाम का अंदाजा लगाया जा सकता है?\n\nनहीं, चार्ट केवल पहले प्रकाशित हो चुके रिकॉर्ड दिखाता है और यह भविष्य के परिणाम की गारंटी या अनुमान नहीं देता।",
      },

      { type: "h2", text: "निष्कर्ष" },
      {
        type: "p",
        text: "Gali, Desawar, Faridabad और Ghaziabad जैसी लोकप्रिय मार्केट्स के रिजल्ट और चार्ट को समझना आसान है, बस सही गेम चुनना, सही महीना देखना और यह याद रखना जरूरी है कि चार्ट सिर्फ ऐतिहासिक रिकॉर्ड है। Satta Online Result पर इन सभी मार्केट्स के डेली रिजल्ट और मंथली चार्ट एक ही जगह उपलब्ध हैं।",
      },
    ],
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}

export function formatBlogDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
