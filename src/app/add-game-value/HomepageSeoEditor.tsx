"use client";

import { useEffect, useRef, useState } from "react";
import type { HomepageSeo, SeoFaq } from "@/lib/homepage-seo";
import {
  DEFAULT_CONTENT_HTML,
  DEFAULT_FAQS,
  DEFAULT_HERO_HIGHLIGHT,
  DEFAULT_HERO_SUBTITLE,
  DEFAULT_HERO_TITLE,
  DEFAULT_META_DESCRIPTION,
  DEFAULT_META_TITLE,
} from "@/lib/homepage-seo-defaults";

const EMPTY: HomepageSeo = {
  metaTitle: "",
  metaDescription: "",
  keywords: "",
  ogTitle: "",
  ogDescription: "",
  ogImage: "",
  robotsIndex: true,
  heroTitle: "",
  heroHighlight: "",
  heroSubtitle: "",
  contentHtml: "",
  faqs: [],
};

// Quick-insert buttons for the HTML content box. [open, close]
const TAGS: { label: string; open: string; close: string }[] = [
  { label: "H2", open: "<h2>", close: "</h2>" },
  { label: "H3", open: "<h3>", close: "</h3>" },
  { label: "P", open: "<p>", close: "</p>" },
  { label: "B", open: "<strong>", close: "</strong>" },
  { label: "I", open: "<em>", close: "</em>" },
  { label: "Link", open: '<a href="https://">', close: "</a>" },
  { label: "List", open: "<ul>\n  <li>", close: "</li>\n  <li></li>\n</ul>" },
  { label: "Table", open: "<table>\n  <tr><th>Game</th><th>Time</th></tr>\n  <tr><td>", close: "</td><td></td></tr>\n</table>" },
];

function previewText(text: string) {
  const date = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());
  return text.replace(/\{date\}/gi, date).replace(/\{year\}/gi, String(new Date().getFullYear()));
}

function Counter({ value, max }: { value: string; max: number }) {
  const len = previewText(value).length;
  return (
    <span className={`text-xs font-semibold ${len > max ? "text-red-600" : "text-gray-500"}`}>
      {len}/{max}
    </span>
  );
}

export default function HomepageSeoEditor({ siteId, onUnauthorized }: { siteId: string; onUnauthorized: () => void }) {
  const [seo, setSeo] = useState<HomepageSeo>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/homepage-seo", { cache: "no-store" });
        if (res.status === 401) return onUnauthorized();
        const data = await res.json();
        if (data.success && data.seo) setSeo({ ...EMPTY, ...data.seo });
      } catch {
        setMessage("Could not load saved SEO settings.");
      } finally {
        setLoading(false);
      }
    })();
  }, [onUnauthorized]);

  const set = <K extends keyof HomepageSeo>(key: K, value: HomepageSeo[K]) =>
    setSeo((s) => ({ ...s, [key]: value }));

  const insertTag = (open: string, close: string) => {
    const el = contentRef.current;
    if (!el) return;
    const { selectionStart: a, selectionEnd: b, value } = el;
    const next = value.slice(0, a) + open + value.slice(a, b) + close + value.slice(b);
    set("contentHtml", next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(a + open.length, b + open.length);
    });
  };

  const setFaq = (i: number, field: keyof SeoFaq, value: string) =>
    set("faqs", seo.faqs.map((f, idx) => (idx === i ? { ...f, [field]: value } : f)));

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/homepage-seo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seo }),
      });
      if (res.status === 401) return onUnauthorized();
      const data = await res.json();
      if (data.success) {
        setSeo({ ...EMPTY, ...data.seo });
        setMessage("✅ Homepage SEO saved. Changes are live on the homepage now.");
      } else {
        setMessage("❌ Error: " + (data.error || "could not save"));
      }
    } catch {
      setMessage("❌ Network error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="mt-6 text-gray-500 py-10 text-center">Loading SEO settings…</p>;

  const shownTitle = previewText(seo.metaTitle || DEFAULT_META_TITLE);
  const shownDesc = previewText(seo.metaDescription || DEFAULT_META_DESCRIPTION);
  const input = "border p-2 w-full rounded-xl mt-1";

  return (
    <div className="mt-6 space-y-6">
      <div className="rounded-[28px] border-2 border-yellow-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-black uppercase tracking-[.18em] text-amber-600">SEO manager</p>
        <h2 className="mt-1 text-2xl font-black">Homepage SEO</h2>
        <p className="mt-2 text-sm text-slate-500">Meta tags, content and FAQs for the homepage of <strong>{siteId}</strong>.</p>
      </div>
      <p className="text-sm text-gray-600 bg-yellow-50 border border-yellow-200 rounded-xl p-3">
        Leave a field empty to use the default. You can write <code className="font-mono">{"{date}"}</code> or{" "}
        <code className="font-mono">{"{year}"}</code> anywhere and it is replaced with today&apos;s date / year
        (e.g. &quot;Satta Result {"{date}"}&quot;).
      </p>

      {/* ===== META ===== */}
      <section className="rounded-[28px] border-2 border-yellow-200 bg-white p-6 sm:p-8 shadow-sm space-y-4">
        <h2 className="font-black text-lg">🔎 Meta Tags</h2>

        <div>
          <div className="flex justify-between items-end">
            <label className="font-semibold">Meta Title</label>
            <Counter value={seo.metaTitle || DEFAULT_META_TITLE} max={60} />
          </div>
          <input
            value={seo.metaTitle}
            onChange={(e) => set("metaTitle", e.target.value)}
            placeholder={DEFAULT_META_TITLE}
            className={input}
          />
        </div>

        <div>
          <div className="flex justify-between items-end">
            <label className="font-semibold">Meta Description</label>
            <Counter value={seo.metaDescription || DEFAULT_META_DESCRIPTION} max={160} />
          </div>
          <textarea
            value={seo.metaDescription}
            onChange={(e) => set("metaDescription", e.target.value)}
            placeholder={DEFAULT_META_DESCRIPTION}
            rows={3}
            className={input}
          />
        </div>

        <div>
          <label className="font-semibold">Meta Keywords (comma separated)</label>
          <input
            value={seo.keywords}
            onChange={(e) => set("keywords", e.target.value)}
            placeholder="satta king, satta result, gali result, desawar result"
            className={input}
          />
        </div>

        <label className="flex items-center gap-2 font-semibold">
          <input
            type="checkbox"
            checked={seo.robotsIndex}
            onChange={(e) => set("robotsIndex", e.target.checked)}
            className="w-4 h-4"
          />
          Allow Google to index the homepage (keep this ON)
        </label>

        {/* Google preview */}
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs font-bold text-gray-500 mb-2">GOOGLE PREVIEW</p>
          <p className="text-xs text-gray-600">www.sattaonlineresult.com</p>
          <p className="text-[#1a0dab] text-lg leading-snug truncate">{shownTitle}</p>
          <p className="text-sm text-gray-700 line-clamp-2">{shownDesc}</p>
        </div>
      </section>

      {/* ===== HERO / H1 ===== */}
      <section className="rounded-[28px] border-2 border-yellow-200 bg-white p-6 sm:p-8 shadow-sm space-y-4">
        <h2 className="font-black text-lg">🏷️ Homepage Heading (H1)</h2>
        <p className="text-sm text-gray-500 -mt-2">
          The big heading at the top of the homepage. Empty = current default (shown in Hindi/English per the
          visitor&apos;s language). Custom text is shown the same in both languages.
        </p>
        <div>
          <label className="font-semibold">Main Heading (H1)</label>
          <input value={seo.heroTitle} onChange={(e) => set("heroTitle", e.target.value)} placeholder={DEFAULT_HERO_TITLE} className={input} />
        </div>
        <div>
          <label className="font-semibold">Highlighted text (black badge)</label>
          <input value={seo.heroHighlight} onChange={(e) => set("heroHighlight", e.target.value)} placeholder={DEFAULT_HERO_HIGHLIGHT} className={input} />
        </div>
        <div>
          <label className="font-semibold">Subheading</label>
          <textarea value={seo.heroSubtitle} onChange={(e) => set("heroSubtitle", e.target.value)} placeholder={DEFAULT_HERO_SUBTITLE} rows={2} className={input} />
        </div>
        {/* Preview */}
        <div className="rounded-xl border-2 border-black bg-gradient-to-br from-yellow-50 via-yellow-100 to-yellow-200 p-5 text-center">
          <p className="text-xs font-bold text-gray-500 mb-2 text-left">PREVIEW</p>
          <p className="text-2xl font-black tracking-tight">
            {previewText(seo.heroTitle || DEFAULT_HERO_TITLE)}{" "}
            <span className="inline-block rounded-lg bg-black px-2 text-yellow-100">{previewText(seo.heroHighlight || DEFAULT_HERO_HIGHLIGHT)}</span>
          </p>
          <p className="mt-2 text-sm font-medium text-neutral-800">{previewText(seo.heroSubtitle || DEFAULT_HERO_SUBTITLE)}</p>
        </div>
      </section>

      {/* ===== SOCIAL ===== */}
      <section className="rounded-[28px] border-2 border-yellow-200 bg-white p-6 sm:p-8 shadow-sm space-y-4">
        <h2 className="font-black text-lg">📣 Social Share (Open Graph)</h2>
        <p className="text-sm text-gray-500 -mt-2">Shown when the link is shared on WhatsApp / Facebook / Telegram. Empty = same as meta.</p>
        <div>
          <label className="font-semibold">OG Title</label>
          <input value={seo.ogTitle} onChange={(e) => set("ogTitle", e.target.value)} placeholder={shownTitle} className={input} />
        </div>
        <div>
          <label className="font-semibold">OG Description</label>
          <textarea
            value={seo.ogDescription}
            onChange={(e) => set("ogDescription", e.target.value)}
            placeholder={shownDesc}
            rows={2}
            className={input}
          />
        </div>
        <div>
          <label className="font-semibold">OG Image URL</label>
          <input
            value={seo.ogImage}
            onChange={(e) => set("ogImage", e.target.value)}
            placeholder="https://www.sattaonlineresult.com/og-image.jpg (1200×630)"
            className={input}
          />
        </div>
      </section>

      {/* ===== CONTENT ===== */}
      <section className="rounded-[28px] border-2 border-yellow-200 bg-white p-6 sm:p-8 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-black text-lg">📝 Homepage Content (HTML)</h2>
          <div className="flex gap-2">
            {!seo.contentHtml && (
              <button
                type="button"
                onClick={() => set("contentHtml", DEFAULT_CONTENT_HTML)}
                className="text-sm bg-white border rounded-lg px-3 py-1.5 font-semibold"
              >
                Load current content
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowPreview((v) => !v)}
              className="text-sm bg-black text-yellow-100 rounded-lg px-3 py-1.5 font-semibold"
            >
              {showPreview ? "✏️ Edit" : "👁 Preview"}
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-500">
          Shown at the bottom of the homepage. HTML allowed (h2, h3, p, strong, a, ul, table, img…). Script tags and
          onclick-type attributes are removed on save. Empty = current default content.
        </p>

        {showPreview ? (
          <div className="bg-white border rounded-xl p-5 min-h-[300px]">
            <div
              className="seo-html"
              dangerouslySetInnerHTML={{ __html: previewText(seo.contentHtml || DEFAULT_CONTENT_HTML) }}
            />
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-1.5">
              {TAGS.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => insertTag(t.open, t.close)}
                  className="text-xs font-mono bg-white border rounded-md px-2 py-1 hover:bg-yellow-100"
                >
                  {t.label}
                </button>
              ))}
            </div>
            <textarea
              ref={contentRef}
              value={seo.contentHtml}
              onChange={(e) => set("contentHtml", e.target.value)}
              placeholder={"<h2>Satta Online Result</h2>\n<p>Your content…</p>"}
              rows={20}
              spellCheck={false}
              className="border p-3 w-full rounded-xl font-mono text-sm leading-relaxed bg-white"
            />
          </>
        )}
      </section>

      {/* ===== FAQ ===== */}
      <section className="rounded-[28px] border-2 border-yellow-200 bg-white p-6 sm:p-8 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-black text-lg">❓ FAQs</h2>
          {seo.faqs.length === 0 && (
            <button
              type="button"
              onClick={() => set("faqs", DEFAULT_FAQS.map((f) => ({ ...f })))}
              className="text-sm bg-white border rounded-lg px-3 py-1.5 font-semibold"
            >
              Load current FAQs
            </button>
          )}
        </div>
        <p className="text-sm text-gray-500">
          Shown under the content and added as FAQ schema for Google. Plain text only. Empty = current default FAQs.
        </p>

        {seo.faqs.map((f, i) => (
          <div key={i} className="bg-white border rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500">FAQ {i + 1}</span>
              <button
                type="button"
                onClick={() => set("faqs", seo.faqs.filter((_, idx) => idx !== i))}
                className="text-xs text-red-600 font-semibold"
              >
                Remove
              </button>
            </div>
            <input
              value={f.question}
              onChange={(e) => setFaq(i, "question", e.target.value)}
              placeholder="Question"
              className="border p-2 w-full rounded-lg font-semibold"
            />
            <textarea
              value={f.answer}
              onChange={(e) => setFaq(i, "answer", e.target.value)}
              placeholder="Answer"
              rows={2}
              className="border p-2 w-full rounded-lg"
            />
          </div>
        ))}

        <button
          type="button"
          onClick={() => set("faqs", [...seo.faqs, { question: "", answer: "" }])}
          className="w-full border-2 border-dashed border-gray-300 rounded-xl py-2 font-semibold text-gray-600"
        >
          + Add FAQ
        </button>
      </section>

      {/* ===== SAVE ===== */}
      <div className="sticky bottom-0 rounded-t-2xl bg-[#fffdf0] pt-3 pb-3">
        {message && <p className="text-sm font-semibold mb-2">{message}</p>}
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex min-h-14 w-full items-center justify-center rounded-xl bg-black text-lg font-black text-yellow-100 hover:bg-slate-800 disabled:opacity-60"
        >
          {saving ? "Saving..." : "💾 Save Homepage SEO"}
        </button>
        {seo.updatedAt && (
          <p className="text-xs text-gray-500 mt-2 text-center">
            Last saved: {new Date(seo.updatedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
          </p>
        )}
      </div>
    </div>
  );
}
