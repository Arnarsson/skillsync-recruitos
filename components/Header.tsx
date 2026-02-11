"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Menu, X, Shield, Settings, Users, Kanban, Network, ChevronDown, Search } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useAdmin } from "@/lib/adminContext";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: session, status } = useSession();
  const { t, lang, setLang } = useLanguage();
  const { isAdmin, isDemoMode } = useAdmin();
  const pathname = usePathname();

  const isLinkedInActive = pathname?.startsWith('/linkedin') || pathname?.startsWith('/network-map');
  const isLinkedInCapturesActive = pathname?.startsWith('/linkedin-captures');
  const isLinkedInPipelineActive = pathname?.startsWith('/linkedin-pipeline');
  const isLinkedInNetworkActive = pathname?.startsWith('/network-map');
  const isSearchActive = pathname === '/search';
  const isPipelineActive = pathname === '/pipeline';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link href="/" className="font-medium tracking-tight lowercase">
              {t("header.logo")}
            </Link>
            {isDemoMode && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge className="bg-primary/20 text-primary border-primary/30">
                      {t("header.demoLabel")}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t("header.demoBadgeTooltip")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {isAdmin && !isDemoMode && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
                      <Shield className="w-3 h-3 mr-1" /> {t("header.adminLabel")}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t("header.adminBadgeTooltip")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6 text-sm">
            {/* Language Toggle */}
            <div className="flex items-center gap-1 text-xs">
              <button
                onClick={() => setLang("en")}
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  lang === "en"
                    ? "text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                EN
              </button>
              <span className="text-muted-foreground">|</span>
              <button
                onClick={() => setLang("da")}
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  lang === "da"
                    ? "text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                DA
              </button>
            </div>

            <a
              href="mailto:letsgo@recruitos.xyz?subject=Demo%20Request"
              className="text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
            >
              {t("common.bookDemo")}
            </a>
            <span className="text-muted-foreground">/</span>

            {isDemoMode ? (
              <>
                <Link
                  href="/intake"
                  className="text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
                >
                  {t("common.intake")}
                </Link>
                <span className="text-muted-foreground">/</span>
                <Link
                  href="/pipeline"
                  className="text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
                >
                  {t("common.pipeline")}
                </Link>
                <span className="text-muted-foreground">/</span>
                <DropdownMenu>
                  <DropdownMenuTrigger className={`flex items-center gap-1 ${isLinkedInActive ? 'text-primary' : 'text-muted-foreground'} hover:text-foreground transition-colors uppercase tracking-wider text-sm outline-none`}>
                    {t("header.linkedin")}
                    <ChevronDown className="w-3 h-3" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48">
                    <DropdownMenuItem asChild>
                      <Link
                        href="/linkedin-captures"
                        className={`flex items-center gap-2 cursor-pointer ${isLinkedInCapturesActive ? "text-primary" : ""}`}
                        aria-current={isLinkedInCapturesActive ? "page" : undefined}
                      >
                        <Users className="w-4 h-4" /> {t("header.captures")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/linkedin-pipeline"
                        className={`flex items-center gap-2 cursor-pointer ${isLinkedInPipelineActive ? "text-primary" : ""}`}
                        aria-current={isLinkedInPipelineActive ? "page" : undefined}
                      >
                        <Kanban className="w-4 h-4" /> {t("header.pipeline")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/network-map"
                        className={`flex items-center gap-2 cursor-pointer ${isLinkedInNetworkActive ? "text-primary" : ""}`}
                        aria-current={isLinkedInNetworkActive ? "page" : undefined}
                      >
                        <Network className="w-4 h-4" /> {t("header.network")}
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <span className="text-muted-foreground">/</span>
                <button
                  onClick={() => {
                    localStorage.removeItem("recruitos_demo_mode");
                    localStorage.removeItem("recruitos_admin_mode");
                    window.location.href = "/";
                  }}
                  className="text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
                >
                  {t("header.exitDemo")}
                </button>
              </>
            ) : status === "loading" ? (
              <span className="text-muted-foreground">...</span>
            ) : session?.user ? (
              <>
                <Link
                  href="/pipeline"
                  className={`${isPipelineActive ? 'text-primary' : 'text-muted-foreground'} hover:text-foreground transition-colors uppercase tracking-wider`}
                  aria-current={isPipelineActive ? "page" : undefined}
                >
                  {t("common.pipeline")}
                </Link>
                <span className="text-muted-foreground">/</span>
                <Link
                  href="/search"
                  className={`${isSearchActive ? 'text-primary' : 'text-muted-foreground'} hover:text-foreground transition-colors uppercase tracking-wider flex items-center gap-1`}
                  aria-current={isSearchActive ? "page" : undefined}
                >
                  <Search className="w-4 h-4" />
                  {t("common.search")}
                </Link>
                <span className="text-muted-foreground">/</span>
                <DropdownMenu>
                  <DropdownMenuTrigger className={`flex items-center gap-1 ${isLinkedInActive ? 'text-primary' : 'text-muted-foreground'} hover:text-foreground transition-colors uppercase tracking-wider text-sm outline-none`}>
                    {t("header.linkedin")}
                    <ChevronDown className="w-3 h-3" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48">
                    <DropdownMenuItem asChild>
                      <Link
                        href="/linkedin-captures"
                        className={`flex items-center gap-2 cursor-pointer ${isLinkedInCapturesActive ? "text-primary" : ""}`}
                        aria-current={isLinkedInCapturesActive ? "page" : undefined}
                      >
                        <Users className="w-4 h-4" /> {t("header.captures")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/linkedin-pipeline"
                        className={`flex items-center gap-2 cursor-pointer ${isLinkedInPipelineActive ? "text-primary" : ""}`}
                        aria-current={isLinkedInPipelineActive ? "page" : undefined}
                      >
                        <Kanban className="w-4 h-4" /> {t("header.pipeline")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/network-map"
                        className={`flex items-center gap-2 cursor-pointer ${isLinkedInNetworkActive ? "text-primary" : ""}`}
                        aria-current={isLinkedInNetworkActive ? "page" : undefined}
                      >
                        <Network className="w-4 h-4" /> {t("header.network")}
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <span className="text-muted-foreground">/</span>
                <Link
                  href="/settings"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title={t("header.settings")}
                >
                  <Settings className="w-4 h-4" />
                </Link>
                <span className="text-muted-foreground">/</span>
                <button
                  onClick={() => signOut()}
                  className="text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
                >
                  {t("common.signOut")}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/linkedin-captures"
                  className={`${isLinkedInActive ? 'text-primary' : 'text-muted-foreground'} hover:text-foreground transition-colors uppercase tracking-wider`}
                  aria-current={isLinkedInActive ? "page" : undefined}
                >
                  {t("header.linkedin")}
                </Link>
                <span className="text-muted-foreground">/</span>
                <Link
                  href="/login"
                  className="text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
                >
                  {t("common.signIn")}
                </Link>
                <span className="text-muted-foreground">/</span>
                <Link
                  href="/signup"
                  className="text-foreground hover:text-primary transition-colors uppercase tracking-wider font-medium"
                >
                  {t("common.getStarted")}
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
              {/* Mobile Language Toggle */}
              <div className="flex items-center gap-2 text-xs pb-2 border-b border-border">
                <span className="text-muted-foreground">{t("header.language")}:</span>
                <button
                  onClick={() => setLang("en")}
                  className={`px-2 py-1 rounded transition-colors ${
                    lang === "en"
                      ? "bg-primary/20 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => setLang("da")}
                  className={`px-2 py-1 rounded transition-colors ${
                    lang === "da"
                      ? "bg-primary/20 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  DA
                </button>
              </div>

              <a
                href="mailto:letsgo@recruitos.xyz?subject=Demo%20Request"
                className="text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
                onClick={() => setIsMenuOpen(false)}
              >
                {t("common.bookDemo")}
              </a>

              {isDemoMode ? (
                <>
                  <Link
                    href="/intake"
                    className="text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t("common.intake")}
                  </Link>
                  <Link
                    href="/pipeline"
                    className="text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t("common.pipeline")}
                  </Link>
                  <div className="border-t border-border pt-2 mt-1">
                    <span className={`text-xs uppercase tracking-wider ${isLinkedInActive ? 'text-primary' : 'text-muted-foreground'} mb-2 block`}>
                      {t("header.linkedinTools")}
                    </span>
                    <div className="flex flex-col gap-2 pl-2">
                      <Link
                        href="/linkedin-captures"
                        className={`${isLinkedInCapturesActive ? 'text-primary' : 'text-muted-foreground'} hover:text-foreground transition-colors flex items-center gap-2`}
                        aria-current={isLinkedInCapturesActive ? "page" : undefined}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Users className="w-4 h-4" /> {t("header.captures")}
                      </Link>
                      <Link
                        href="/linkedin-pipeline"
                        className={`${isLinkedInPipelineActive ? 'text-primary' : 'text-muted-foreground'} hover:text-foreground transition-colors flex items-center gap-2`}
                        aria-current={isLinkedInPipelineActive ? "page" : undefined}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Kanban className="w-4 h-4" /> {t("header.pipeline")}
                      </Link>
                      <Link
                        href="/network-map"
                        className={`${isLinkedInNetworkActive ? 'text-primary' : 'text-muted-foreground'} hover:text-foreground transition-colors flex items-center gap-2`}
                        aria-current={isLinkedInNetworkActive ? "page" : undefined}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Network className="w-4 h-4" /> {t("header.network")}
                      </Link>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      localStorage.removeItem("recruitos_demo_mode");
                      localStorage.removeItem("recruitos_admin_mode");
                      window.location.href = "/";
                      setIsMenuOpen(false);
                    }}
                    className="text-left text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
                  >
                    {t("header.exitDemo")}
                  </button>
                </>
              ) : session?.user ? (
                <>
                  <Link
                    href="/pipeline"
                    className={`${isPipelineActive ? 'text-primary' : 'text-muted-foreground'} hover:text-foreground transition-colors uppercase tracking-wider`}
                    aria-current={isPipelineActive ? "page" : undefined}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t("common.pipeline")}
                  </Link>
                  <Link
                    href="/search"
                    className={`${isSearchActive ? 'text-primary' : 'text-muted-foreground'} hover:text-foreground transition-colors uppercase tracking-wider flex items-center gap-2`}
                    aria-current={isSearchActive ? "page" : undefined}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Search className="w-4 h-4" />
                    {t("common.search")}
                  </Link>
                  {/* LinkedIn Tools Section */}
                  <div className="border-t border-border pt-2 mt-1">
                    <span className={`text-xs uppercase tracking-wider ${isLinkedInActive ? 'text-primary' : 'text-muted-foreground'} mb-2 block`}>
                      {t("header.linkedinTools")}
                    </span>
                    <div className="flex flex-col gap-2 pl-2">
                      <Link
                        href="/linkedin-captures"
                        className={`${isLinkedInCapturesActive ? 'text-primary' : 'text-muted-foreground'} hover:text-foreground transition-colors flex items-center gap-2`}
                        aria-current={isLinkedInCapturesActive ? "page" : undefined}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Users className="w-4 h-4" /> {t("header.captures")}
                      </Link>
                      <Link
                        href="/linkedin-pipeline"
                        className={`${isLinkedInPipelineActive ? 'text-primary' : 'text-muted-foreground'} hover:text-foreground transition-colors flex items-center gap-2`}
                        aria-current={isLinkedInPipelineActive ? "page" : undefined}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Kanban className="w-4 h-4" /> {t("header.pipeline")}
                      </Link>
                      <Link
                        href="/network-map"
                        className={`${isLinkedInNetworkActive ? 'text-primary' : 'text-muted-foreground'} hover:text-foreground transition-colors flex items-center gap-2`}
                        aria-current={isLinkedInNetworkActive ? "page" : undefined}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Network className="w-4 h-4" /> {t("header.network")}
                      </Link>
                    </div>
                  </div>
                  <Link
                    href="/settings"
                    className="text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider flex items-center gap-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Settings className="w-4 h-4" />
                    {t("header.settings")}
                  </Link>
                  <button
                    onClick={() => {
                      signOut();
                      setIsMenuOpen(false);
                    }}
                    className="text-left text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
                  >
                    {t("common.signOut")}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/linkedin-captures"
                    className={`${isLinkedInActive ? 'text-primary' : 'text-muted-foreground'} hover:text-foreground transition-colors uppercase tracking-wider`}
                    aria-current={isLinkedInActive ? "page" : undefined}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t("header.linkedin")}
                  </Link>
                  <Link
                    href="/login"
                    className="text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t("common.signIn")}
                  </Link>
                  <Link
                    href="/signup"
                    className="text-foreground hover:text-primary transition-colors uppercase tracking-wider font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t("common.getStarted")}
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
