import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Providers from "@/components/Providers";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SkillSync - Find Elite Engineers on GitHub",
  description: "The first hiring platform that sources engineers by what they've actually built. Find elite (but overlooked!) engineers and scientists shaping your domain.",
  keywords: ["hiring", "engineers", "GitHub", "recruiting", "talent", "developers"],
  openGraph: {
    title: "SkillSync - Find Elite Engineers on GitHub",
    description: "The first hiring platform that sources engineers by what they've actually built.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} antialiased bg-[#141517] text-white min-h-screen`}>
        <Providers>
          <Header />
          <main>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
