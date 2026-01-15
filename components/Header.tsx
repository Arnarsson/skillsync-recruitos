"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Search, LogOut, Menu, X, Briefcase, Users, UserCheck, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: session, status } = useSession();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">S</span>
            </div>
            <span className="font-semibold text-lg hidden sm:block">SkillSync</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {/* Recruiting Funnel Nav */}
            <div className="flex items-center gap-1 border-r border-border pr-6">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/intake" className="gap-2">
                  <Briefcase className="w-4 h-4" />
                  <span className="hidden lg:inline">Intake</span>
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/pipeline" className="gap-2">
                  <Users className="w-4 h-4" />
                  <span className="hidden lg:inline">Pipeline</span>
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/search" className="gap-2">
                  <Search className="w-4 h-4" />
                  <span className="hidden lg:inline">Search</span>
                </Link>
              </Button>
            </div>

            {status === "loading" ? (
              <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
            ) : session?.user ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={session.user.image || ""} alt={session.user.name || ""} />
                        <AvatarFallback>{session.user.name?.charAt(0) || "U"}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{session.user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">Get Started</Link>
                </Button>
              </>
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
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-2">
              {/* Recruiting Funnel Links */}
              <div className="pb-2 mb-2 border-b border-border">
                <p className="text-xs text-muted-foreground px-4 mb-2">Recruiting Pipeline</p>
                <Button variant="ghost" asChild className="justify-start w-full">
                  <Link href="/intake" className="gap-2">
                    <Briefcase className="w-4 h-4" />
                    Intake
                  </Link>
                </Button>
                <Button variant="ghost" asChild className="justify-start w-full">
                  <Link href="/pipeline" className="gap-2">
                    <Users className="w-4 h-4" />
                    Pipeline
                  </Link>
                </Button>
                <Button variant="ghost" asChild className="justify-start w-full">
                  <Link href="/search" className="gap-2">
                    <Search className="w-4 h-4" />
                    Search
                  </Link>
                </Button>
              </div>

              {session?.user ? (
                <>
                  <div className="flex items-center gap-3 px-4 py-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={session.user.image || ""} alt={session.user.name || ""} />
                      <AvatarFallback>{session.user.name?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{session.user.name}</p>
                      <p className="text-xs text-muted-foreground">{session.user.email}</p>
                    </div>
                  </div>
                  <Button variant="ghost" onClick={() => signOut()} className="justify-start gap-2">
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" asChild className="justify-start">
                    <Link href="/login">Sign In</Link>
                  </Button>
                  <Button asChild className="justify-start">
                    <Link href="/signup">Get Started</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
