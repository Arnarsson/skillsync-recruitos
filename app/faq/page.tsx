import type { Metadata } from "next";
import FAQClient from "./FAQClient";

export const metadata: Metadata = {
  title: "Frequently Asked Questions — RecruitOS Technical Recruiting Platform",
  description: "Common questions about RecruitOS: GitHub-based technical recruiting, pricing, features, and how to evaluate engineering candidates based on real code contributions.",
  keywords: [
    "technical recruiting FAQ",
    "GitHub recruiting questions",
    "engineering hiring",
    "technical recruiting software",
    "developer recruiting",
    "code-based hiring",
  ],
};

export default function FAQPage() {
  return <FAQClient />;
}
