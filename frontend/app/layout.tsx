import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import Script from "next/script";
import "./globals.css";
import Footer from "@/components/Footer";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "VisibilityRadar — AI Brand Visibility & GEO Intelligence",
    template: "%s | VisibilityRadar",
  },
  description: "Measure how visible your brand is across Claude, GPT-4o, Gemini, Perplexity, Grok and DeepSeek. Get your free AI visibility score and beat competitors in AI search.",
  keywords: ["AI visibility", "GEO optimization", "LLM SEO", "brand mentions AI", "AI search optimization", "generative engine optimization", "share of voice AI", "Claude brand visibility", "ChatGPT brand mentions"],
  authors: [{ name: "VisibilityRadar" }],
  creator: "VisibilityRadar",
  publisher: "VisibilityRadar",
  metadataBase: new URL("https://visibilityradar.ai"),
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://visibilityradar.ai",
    siteName: "VisibilityRadar",
    title: "VisibilityRadar — AI Brand Visibility & GEO Intelligence",
    description: "Measure how visible your brand is across Claude, GPT-4o, Gemini, Perplexity, Grok and DeepSeek. Free AI visibility score.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "VisibilityRadar — AI Brand Visibility" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "VisibilityRadar — AI Brand Visibility & GEO Intelligence",
    description: "Measure how visible your brand is across Claude, GPT-4o, Gemini and more. Free AI visibility score.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "VisibilityRadar",
  "url": "https://visibilityradar.ai",
  "description": "AI brand visibility intelligence platform. Measure how your brand appears across Claude, GPT-4o, Gemini, Perplexity, Grok and DeepSeek.",
  "applicationCategory": "BusinessApplication",
  "offers": {
    "@type": "AggregateOffer",
    "priceCurrency": "USD",
    "lowPrice": "0",
    "highPrice": "599",
    "offerCount": "3",
  },
  "publisher": { "@type": "Organization", "name": "VisibilityRadar", "url": "https://visibilityradar.ai" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
        <head>
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
          <Script
            src="https://www.googletagmanager.com/gtag/js?id=G-42NTZKDT76"
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-42NTZKDT76');
            `}
          </Script>
        </head>
        <body className="min-h-full flex flex-col">
          <div className="flex-1">{children}</div>
          <Footer />
        </body>
      </html>
    </ClerkProvider>
  );
}
