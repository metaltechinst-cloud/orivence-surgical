// src/app/layout.tsx

import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SmoothScroll from "@/components/SmoothScroll";
import { RFQProvider } from "@/context/RFQContext";
import { db } from "@/lib/db";
import Script from "next/script";

export async function generateMetadata(): Promise<Metadata> {
  let title = "ORIVENCE | Premium SaaS Product Catalog & Inquiry Platform";
  let description = "World-class luxury industrial catalog of surgical-grade implements. Engineered with Tuttlingen precision for dermatologists, estheticians, and lash/brow clinics.";
  let keywords = "Orivence, Medical grade tweezers, Lancet extractor, Cuticle nippers, German steel implements";
  let faviconUrl = "/favicon.ico";

  try {
    const dbSeo = await db.websiteSetting.findUnique({ where: { key: "seo_settings" } });
    if (dbSeo) {
      const seo = JSON.parse(dbSeo.value);
      title = seo.metaTitle || title;
      description = seo.metaDescription || description;
      keywords = seo.metaKeywords || keywords;
    }
    const dbBranding = await db.websiteSetting.findUnique({ where: { key: "branding" } });
    if (dbBranding) {
      const branding = JSON.parse(dbBranding.value);
      faviconUrl = branding.faviconUrl || faviconUrl;
    }
  } catch (e) {
    console.error("Layout dynamic metadata load error:", e);
  }

  return {
    title,
    description,
    keywords,
    icons: {
      icon: faviconUrl,
    },
    openGraph: {
      title,
      description,
      url: "https://orivence.com",
      siteName: "Orivence",
      locale: "en_US",
      type: "website",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let googleAnalyticsId = "";
  try {
    const dbSeo = await db.websiteSetting.findUnique({ where: { key: "seo_settings" } });
    if (dbSeo) {
      const seo = JSON.parse(dbSeo.value);
      googleAnalyticsId = seo.googleAnalyticsId || "";
    }
  } catch (e) {
    console.error("Layout GA ID fetch error:", e);
  }

  return (
    <html lang="en" className="scroll-smooth">
      <body className="antialiased min-h-screen flex flex-col bg-white text-[#253237] font-sans">
        {googleAnalyticsId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${googleAnalyticsId}');
              `}
            </Script>
          </>
        )}
        <RFQProvider>
          <SmoothScroll />
          <Header />
          <main className="flex-grow flex flex-col pt-[72px]">
            {children}
          </main>
          <Footer />
        </RFQProvider>
      </body>
    </html>
  );
}
