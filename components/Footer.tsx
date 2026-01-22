"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n";

export default function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Logo */}
          <div>
            <Link href="/" className="font-medium tracking-tight lowercase">
              {t("header.logo")}
            </Link>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm text-muted-foreground mb-4 lowercase">
              {t("footer.resources")}
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/about"
                  className="text-sm text-foreground hover:text-primary transition-colors lowercase"
                >
                  {t("footer.about")}
                </Link>
              </li>
              <li>
                <Link
                  href="/contributors"
                  className="text-sm text-foreground hover:text-primary transition-colors lowercase"
                >
                  {t("footer.contributors")}
                </Link>
              </li>
              <li>
                <Link
                  href="#pricing"
                  className="text-sm text-foreground hover:text-primary transition-colors lowercase"
                >
                  {t("footer.pricing")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm text-muted-foreground mb-4 lowercase">
              {t("footer.company")}
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-foreground hover:text-primary transition-colors lowercase"
                >
                  {t("footer.contact")}
                </Link>
              </li>
              <li>
                <a
                  href="mailto:letsgo@recruitos.xyz?subject=Contact%20Request"
                  className="text-sm text-foreground hover:text-primary transition-colors lowercase"
                >
                  letsgo@recruitos.xyz
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm text-muted-foreground mb-4 lowercase">
              {t("footer.legal")}
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-foreground hover:text-primary transition-colors lowercase"
                >
                  {t("footer.privacy")}
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-foreground hover:text-primary transition-colors lowercase"
                >
                  {t("footer.terms")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-between pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground lowercase">
            {t("footer.copyright").replace("{year}", year.toString())}
          </p>
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            $
          </Link>
        </div>
      </div>
    </footer>
  );
}
