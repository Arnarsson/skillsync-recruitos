"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  LogOut,
  Menu,
  X,
  Briefcase,
  Users,
  Sparkles,
  ChevronRight,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { href: "/intake", label: "Intake", icon: Briefcase, step: 1 },
  { href: "/pipeline", label: "Pipeline", icon: Users, step: 2 },
  { href: "/search", label: "Search", icon: Search, step: null },
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: session, status } = useSession();
  const pathname = usePathname();

  const resetOnboarding = () => {
    localStorage.removeItem("skillsync_onboarding_completed");
    window.location.reload();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-lg shadow-primary/20">
              <span className="text-primary-foreground font-bold text-lg">S</span>
            </div>
            <div className="hidden sm:block">
              <span className="font-semibold text-lg">SkillSync</span>
              <Badge variant="outline" className="ml-2 text-[10px] px-1.5 py-0">
                Beta
              </Badge>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {/* Recruiting Funnel Nav */}
            <div className="flex items-center gap-1 border-r border-border pr-4 mr-4">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      size="sm"
                      className={`gap-2 relative ${
                        isActive
                          ? "bg-primary/10 text-primary hover:bg-primary/20"
                          : ""
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span className="hidden lg:inline">{item.label}</span>
                      {item.step && (
                        <span className="hidden lg:inline text-[10px] text-muted-foreground ml-1">
                          ({item.step})
                        </span>
                      )}
                      {isActive && (
                        <motion.div
                          layoutId="activeNav"
                          className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full"
                        />
                      )}
                    </Button>
                  </Link>
                );
              })}
            </div>

            {/* Help button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={resetOnboarding}
              className="gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden lg:inline">Tour</span>
            </Button>

            {status === "loading" ? (
              <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
            ) : session?.user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full ring-2 ring-border hover:ring-primary/50 transition-all"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={session.user.image || ""}
                        alt={session.user.name || ""}
                      />
                      <AvatarFallback>
                        {session.user.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{session.user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {session.user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut()}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button
                  size="sm"
                  asChild
                  className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                >
                  <Link href="/signup" className="gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Get Started
                  </Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden"
            >
              <div className="py-4 border-t border-border">
                <div className="flex flex-col gap-1">
                  {/* Recruiting Funnel Links */}
                  <div className="pb-3 mb-3 border-b border-border">
                    <p className="text-xs text-muted-foreground px-4 mb-3 font-medium">
                      Recruiting Pipeline
                    </p>
                    {navItems.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <Link key={item.href} href={item.href}>
                          <Button
                            variant={isActive ? "secondary" : "ghost"}
                            className={`justify-start w-full gap-3 ${
                              isActive ? "bg-primary/10 text-primary" : ""
                            }`}
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <item.icon className="w-4 h-4" />
                            {item.label}
                            {item.step && (
                              <Badge variant="outline" className="ml-auto text-xs">
                                Step {item.step}
                              </Badge>
                            )}
                            <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
                          </Button>
                        </Link>
                      );
                    })}
                  </div>

                  {session?.user ? (
                    <>
                      <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/50 mb-2">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={session.user.image || ""}
                            alt={session.user.name || ""}
                          />
                          <AvatarFallback>
                            {session.user.name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{session.user.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {session.user.email}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        onClick={() => signOut()}
                        className="justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </Button>
                    </>
                  ) : (
                    <div className="flex flex-col gap-2 px-2">
                      <Button variant="outline" asChild className="w-full">
                        <Link href="/login">Sign In</Link>
                      </Button>
                      <Button asChild className="w-full gap-1.5">
                        <Link href="/signup">
                          <Sparkles className="w-4 h-4" />
                          Get Started Free
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}
