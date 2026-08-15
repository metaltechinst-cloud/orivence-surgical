// src/app/layout.tsx

import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SmoothScroll from "@/components/SmoothScroll";
import { RFQProvider } from "@/context/RFQContext";
import { db } from "@/lib/db";
import Script from "next/script";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

export async function generateMetadata(): Promise<Metadata> {
  let title = "ORIVENCE SURGICAL | German Surgical Precision Implements";
  let description = "Manufacturer of ISO 13485 surgical tools, medical tweezers, micro-scissors, and aesthetic implements forged in Tuttlingen, Germany.";
  let keywords = "Orivence Surgical, Medical grade tweezers, Surgical scissors, ISO 13485 instruments, German surgical steel, Tuttlingen implements";
  let faviconUrl = "/favicon.ico";
  let appleIconUrl = "/apple-touch-icon.png";
  let ogImageUrl = "https://wonrbugnncrvabfxdckn.supabase.co/storage/v1/object/public/orivence-media/branding/og-image.png";
  let twitterCardUrl = "https://wonrbugnncrvabfxdckn.supabase.co/storage/v1/object/public/orivence-media/branding/twitter-card.png";
  let canonicalUrl = "https://orivencesurgical.com";
  let searchConsoleMeta = "";
  let bingMeta = "";

  try {
    const dbSeo = await db.websiteSetting.findUnique({ where: { key: "seo_meta" } });
    if (dbSeo) {
      const seo = JSON.parse(dbSeo.value);
      title = seo.defaultTitle || seo.metaTitle || title;
      description = seo.defaultDescription || seo.metaDescription || description;
      keywords = seo.keywords || seo.metaKeywords || keywords;
      canonicalUrl = seo.canonicalUrl || canonicalUrl;
      searchConsoleMeta = seo.googleSearchConsoleVerification || "";
      bingMeta = seo.bingWebmasterVerification || "";
    }

    const dbBranding = await db.websiteSetting.findUnique({ where: { key: "branding" } });
    if (dbBranding) {
      const branding = JSON.parse(dbBranding.value);
      faviconUrl = branding.faviconUrl || faviconUrl;
      appleIconUrl = branding.appleTouchIconUrl || branding.faviconUrl || appleIconUrl;
      ogImageUrl = branding.ogImageUrl || ogImageUrl;
      twitterCardUrl = branding.twitterCardUrl || ogImageUrl;
    }
  } catch (e) {
    console.error("Layout dynamic metadata load error:", e);
  }

  const metadataResult: Metadata = {
    title,
    description,
    keywords,
    manifest: "/manifest.webmanifest",
    metadataBase: new URL(canonicalUrl),
    alternates: {
      canonical: canonicalUrl,
    },
    icons: {
      icon: faviconUrl,
      apple: appleIconUrl,
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: "ORIVENCE SURGICAL",
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "ORIVENCE SURGICAL",
      locale: "en_US",
      type: "website",
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [twitterCardUrl],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    },
  };

  if (searchConsoleMeta || bingMeta) {
    metadataResult.verification = {
      google: searchConsoleMeta || undefined,
      yandex: undefined,
      other: bingMeta ? { "msvalidate.01": bingMeta } : undefined,
    };
  }

  return metadataResult;
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let googleAnalyticsId = "";
  let googleTagManagerId = "";
  let metaPixelId = "";
  let microsoftClarityId = "";
  let googleConsoleVerification = "";
  let bingWebmasterVerification = "";
  let businessInfo = {
    companyName: "ORIVENCE SURGICAL GMBH",
    brandName: "ORIVENCE",
    tagline: "German Surgical Precision Implements",
    phone: "+49 (7461) 9876-0",
    email: "inquiry@orivence.de",
    address: "MedTech Park 4B, 78532 Tuttlingen, Germany"
  };

  try {
    const dbAnalytics = await db.websiteSetting.findUnique({ where: { key: "analytics" } });
    if (dbAnalytics) {
      const analytics = JSON.parse(dbAnalytics.value);
      googleAnalyticsId = analytics.gaMeasurementId || analytics.googleAnalyticsId || "";
      googleTagManagerId = analytics.gtmContainerId || "";
      metaPixelId = analytics.metaPixelId || "";
      microsoftClarityId = analytics.clarityProjectId || "";
      googleConsoleVerification = analytics.googleConsoleVerification || analytics.googleSiteVerification || "";
      bingWebmasterVerification = analytics.bingWebmasterVerification || analytics.bingSiteVerification || "";
    }

    const dbBusiness = await db.websiteSetting.findUnique({ where: { key: "business_info" } });
    if (dbBusiness) {
      const bInfo = JSON.parse(dbBusiness.value);
      businessInfo = { ...businessInfo, ...bInfo };
    }
  } catch (e) {
    console.error("Layout Analytics/Business fetch error:", e);
  }

  // Schema.org MedicalBusiness / Organization JSON-LD Structured Data
  const jsonLdSchema = {
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
    "name": businessInfo.companyName,
    "alternateName": businessInfo.brandName,
    "description": businessInfo.tagline,
    "url": "https://orivencesurgical.com",
    "logo": "https://wonrbugnncrvabfxdckn.supabase.co/storage/v1/object/public/orivence-media/branding/logo.png",
    "telephone": businessInfo.phone,
    "email": businessInfo.email,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": businessInfo.address,
      "addressLocality": "Tuttlingen",
      "postalCode": "78532",
      "addressCountry": "DE"
    },
    "priceRange": "$$$$",
    "knowsAbout": ["Surgical Instruments", "AISI 316L Stainless Steel", "Micro-scissors", "ISO 13485 Manufacturing"]
  };

  return (
    <html lang="en" className={`scroll-smooth ${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        {/* Search Console & Bing Webmaster Verification */}
        {googleConsoleVerification && (
          <meta name="google-site-verification" content={googleConsoleVerification} />
        )}
        {bingWebmasterVerification && (
          <meta name="msvalidate.01" content={bingWebmasterVerification} />
        )}

        {/* Schema.org Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
        />

        {/* Google Tag Manager Container */}
        {googleTagManagerId && (
          <Script id="gtm-script" strategy="afterInteractive">
            {`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${googleTagManagerId}');
            `}
          </Script>
        )}

        {/* Meta Pixel Code */}
        {metaPixelId && (
          <Script id="meta-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${metaPixelId}');
              fbq('track', 'PageView');
            `}
          </Script>
        )}

        {/* Microsoft Clarity */}
        {microsoftClarityId && (
          <Script id="ms-clarity" strategy="afterInteractive">
            {`
              (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${microsoftClarityId}");
            `}
          </Script>
        )}
      </head>
      <body className="antialiased min-h-screen flex flex-col bg-white text-[#253237] font-sans">
        {/* Google Analytics gtag */}
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
