import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
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
  keywords: ["hiring", "engineers", "GitHub", "recruiting", "talent", "developers", "AI recruiting", "technical hiring"],
  openGraph: {
    title: "RecruitOS — Hire by what they've built, not what they claim",
    description: "Stop guessing. Start hiring engineers based on real GitHub contributions, code quality, and technical depth.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RecruitOS — Hire by what they've built, not what they claim",
    description: "AI-powered candidate intelligence for modern recruiting.",
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
        <Script
          src="https://sourcetrace.vercel.app/t.js"
          data-key="st_a9ecf75601de46ab8c97a017f6d57960"
          strategy="afterInteractive"
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
