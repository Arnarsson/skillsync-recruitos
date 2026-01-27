"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Menu, X } from "lucide-react";
import CreditBadge from "./CreditBadge";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: session, status } = useSession();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="font-medium tracking-tight lowercase">
            recruitos
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6 text-sm">
            <Link
              href="/guides/technical-recruiting"
              className="text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
            >
              GUIDE
            </Link>
            <span className="text-muted-foreground">/</span>
            <Link
              href="/compare"
              className="text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
            >
              SAMMENLIGN
            </Link>
            <span className="text-muted-foreground">/</span>
            <Link
              href="/faq"
              className="text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
            >
              FAQ
            </Link>
            <span className="text-muted-foreground">/</span>
            <Link
              href="https://cal.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
            >
              BOOK EN DEMO
            </Link>
            <span className="text-muted-foreground">/</span>

            {status === "loading" ? (
              <span className="text-muted-foreground">...</span>
            ) : session?.user ? (
              <>
                {/* Credit balance badge */}
                <CreditBadge />
                <span className="text-muted-foreground">/</span>
                <Link
                  href="/dashboard"
                  className="text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
                >
                  DASHBOARD
                </Link>
                <span className="text-muted-foreground">/</span>
                <Link
                  href="/pipeline"
                  className="text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
                >
                  PIPELINE
                </Link>
                <span className="text-muted-foreground">/</span>
                <button
                  onClick={() => signOut()}
                  className="text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
                >
                  LOG UD
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
                >
                  LOG IND
                </Link>
                <span className="text-muted-foreground">/</span>
                <Link
                  href="/signup"
                  className="text-foreground hover:text-primary transition-colors uppercase tracking-wider font-medium"
                >
                  KOM I GANG
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 -mr-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4 text-sm">
              <Link
                href="/guides/technical-recruiting"
                className="text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
                onClick={() => setIsMenuOpen(false)}
              >
                GUIDE
              </Link>
              <Link
                href="/compare"
                className="text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
                onClick={() => setIsMenuOpen(false)}
              >
                SAMMENLIGN
              </Link>
              <Link
                href="/faq"
                className="text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
                onClick={() => setIsMenuOpen(false)}
              >
                FAQ
              </Link>
              <Link
                href="https://cal.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
                onClick={() => setIsMenuOpen(false)}
              >
                BOOK EN DEMO
              </Link>

              {session?.user ? (
                <>
                  {/* Credit balance in mobile nav */}
                  <div className="flex items-center gap-2">
                    <CreditBadge />
                    <span className="text-muted-foreground text-xs">kreditter</span>
                  </div>
                  <Link
                    href="/dashboard"
                    className="text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    DASHBOARD
                  </Link>
                  <Link
                    href="/pipeline"
                    className="text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    PIPELINE
                  </Link>
                  <button
                    onClick={() => {
                      signOut();
                      setIsMenuOpen(false);
                    }}
                    className="text-left text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
                  >
                    LOG UD
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    LOG IND
                  </Link>
                  <Link
                    href="/signup"
                    className="text-foreground hover:text-primary transition-colors uppercase tracking-wider font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    KOM I GANG
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
