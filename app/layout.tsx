import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AdminDock from "@/components/AdminDock";
import Providers from "@/components/Providers";
import { Toaster } from "sonner";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RecruitOS — Hire by what they've built, not what they claim",
  description: "Stop guessing. Start hiring engineers based on real GitHub contributions, code quality, and technical depth. AI-powered candidate intelligence for modern recruiting.",
  keywords: ["hiring", "engineers", "GitHub", "recruiting", "talent", "developers", "AI recruiting", "technical hiring", "GitHub recruiting", "code-based hiring", "technical recruiting software"],
  openGraph: {
    title: "RecruitOS — Hire by what they've built, not what they claim",
    description: "Stop guessing. Start hiring engineers based on real GitHub contributions, code quality, and technical depth.",
    type: "website",
    url: "https://recruitos.dev",
    siteName: "RecruitOS",
  },
  twitter: {
    card: "summary_large_image",
    title: "RecruitOS — Hire by what they've built, not what they claim",
    description: "AI-powered candidate intelligence for modern recruiting.",
  },
};

// Organization and WebSite schema for the entire site
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "RecruitOS",
  description: "GitHub-based technical recruiting platform that evaluates engineering candidates by their real code contributions",
  url: "https://recruitos.dev",
  logo: "https://recruitos.dev/logo.png",
  foundingDate: "2024",
  sameAs: [
    // Add social media links when available
  ],
  contactPoint: {
    "@type": "ContactPoint",
    email: "hello@recruitos.dev",
    contactType: "Customer Service",
  },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "RecruitOS",
  url: "https://recruitos.dev",
  description: "Technical recruiting platform for finding and evaluating engineering talent through GitHub contributions",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://recruitos.dev/search?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        {/* WebSite Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className={`${inter.variable} antialiased bg-[#141517] text-white min-h-screen`}>
        <Providers>
          <Header />
          <main>{children}</main>
          <Footer />
          <AdminDock />
          <Toaster position="bottom-right" theme="dark" richColors />
        </Providers>
      </body>
    </html>
  );
}
