import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AdminDock from "@/components/AdminDock";
import GlobalBreadcrumbs from "@/components/GlobalBreadcrumbs";
import { CalibrationWidget } from "@/components/calibration/CalibrationWidget";
import Providers from "@/components/Providers";
import { Toaster } from "sonner";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "RecruitOS — AI-Powered Recruitment for Denmark",
    template: "%s | RecruitOS",
  },
  description:
    "AI-drevet rekrutteringsplatform til det danske marked. Find og vurder software engineers med Google Gemini AI baseret på GitHub-bidrag, kodekvalitet og teknisk dybde.",
  keywords: [
    "recruitment",
    "AI",
    "Denmark",
    "hiring",
    "software engineers",
    "GitHub",
    "technical hiring",
    "rekruttering",
    "Danmark",
  ],
  authors: [{ name: "RecruitOS" }],
  openGraph: {
    type: "website",
    locale: "da_DK",
    url: "https://recruitos.dk",
    title: "RecruitOS — AI-Powered Recruitment",
    description:
      "AI-drevet rekrutteringsplatform til det danske marked. Find og vurder software engineers med Google Gemini AI.",
    siteName: "RecruitOS",
  },
  twitter: {
    card: "summary_large_image",
    title: "RecruitOS — AI-Powered Recruitment",
    description:
      "AI-drevet rekrutteringsplatform til det danske marked. Find og vurder software engineers med Google Gemini AI.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="da" className="dark">
      <head>
        {process.env.NODE_ENV === "production" && (
          <Script
            src="https://sourcetrace.vercel.app/t.js"
            data-key="st_a9ecf75601de46ab8c97a017f6d57960"
            strategy="afterInteractive"
          />
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "RecruitOS",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              description:
                "AI-drevet rekrutteringsplatform til det danske marked. Find og vurder software engineers med Google Gemini AI.",
              url: "https://recruitos.dk",
              creator: {
                "@type": "Organization",
                name: "RecruitOS",
                url: "https://recruitos.dk",
              },
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "DKK",
              },
            }),
          }}
        />
      </head>
      <body className={`${inter.variable} antialiased bg-[#141517] text-white min-h-screen`}>
        <Providers>
          <Header />
          <main>
            <GlobalBreadcrumbs />
            {children}
          </main>
          <Footer />
          <AdminDock />
          <CalibrationWidget />
          <Toaster position="bottom-left" theme="dark" richColors />
        </Providers>
      </body>
    </html>
  );
}
