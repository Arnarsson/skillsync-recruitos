"use client";

import Link from "next/link";
import { Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/lib/i18n";

export default function ContactPage() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              {t("contact.back")}
            </Button>
          </Link>
        </div>

        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle>{t("contact.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-zinc-300">
            <p>{t("contact.subtitle")}</p>
            <a
              href="mailto:nars@recruitos.dev"
              className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300"
            >
              <Mail className="w-4 h-4" />
              nars@recruitos.dev
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
