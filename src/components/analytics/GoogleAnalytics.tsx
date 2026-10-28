"use client";

import Script from "next/script";
import { useEffect } from "react";

// Google Analytics 4 + WhatsApp click tracking.
// Set NEXT_PUBLIC_GA_ID (e.g. G-XXXXXXXXXX) in .env.local / the server env.
//
// Every click on a WhatsApp link (wa.me / whatsapp.com) anywhere on the site is
// sent to GA as the event "whatsapp_click" with:
//   button_location – from the link's data-wa-location attribute (e.g. "floating_button")
//   page_path       – the page the click happened on
//   link_url        – the WhatsApp URL
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function GoogleAnalytics() {
  useEffect(() => {
    if (!GA_ID) return;

    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link || !/(wa\.me|whatsapp\.com)/i.test(link.href)) return;
      window.gtag?.("event", "whatsapp_click", {
        button_location: link.dataset.waLocation || "unknown",
        page_path: window.location.pathname,
        link_url: link.href,
        transport_type: "beacon",
      });
    };

    // Capture phase so the event fires before the link opens WhatsApp.
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  if (!GA_ID) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
      </Script>
    </>
  );
}
