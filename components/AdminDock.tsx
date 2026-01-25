"use client";

import { useRouter, usePathname } from "next/navigation";
import { FileText, Search, Users, Power, Home, Settings } from "lucide-react";
import { Dock, DockCard, DockCardInner, DockDivider } from "@/components/ui/dock";
import { useAdmin } from "@/lib/adminContext";
import { cn } from "@/lib/utils";

export default function AdminDock() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAdmin, toggleAdmin } = useAdmin();

  const navItems = [
    { id: "home", label: "Home", icon: Home, href: "/" },
    { id: "intake", label: "Intake", icon: FileText, href: "/intake" },
    { id: "search", label: "Search", icon: Search, href: "/search" },
    { id: "pipeline", label: "Pipeline", icon: Users, href: "/pipeline" },
    { id: "settings", label: "Settings", icon: Settings, href: "/settings" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  // Floating power button when admin mode is off
  if (!isAdmin) {
    return (
      <button
        onClick={toggleAdmin}
        className="fixed bottom-3 sm:bottom-4 right-3 sm:right-4 z-50 p-2.5 sm:p-3 rounded-full bg-card/80 backdrop-blur-sm border border-border shadow-lg text-muted-foreground hover:text-primary hover:border-primary/50 transition-all group"
        title="Toggle Admin Mode (Ctrl+Shift+A)"
      >
        <Power className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="absolute bottom-full right-0 mb-2 px-2 py-1 text-xs bg-card border border-border rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden sm:block">
          Admin Mode (Ctrl+Shift+A)
        </span>
      </button>
    );
  }

  // Mac-style dock when admin mode is on
  return (
    <div className="fixed bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-50">
      <Dock className="bg-card/95 backdrop-blur-md border border-border shadow-2xl scale-90 sm:scale-100 origin-bottom">
        {navItems.map((item) => (
          <DockCard key={item.id} id={item.id}>
            <DockCardInner
              onClick={() => router.push(item.href)}
              className={cn(
                "cursor-pointer transition-colors",
                isActive(item.href)
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="w-5 h-5 sm:w-6 sm:h-6" />
            </DockCardInner>
          </DockCard>
        ))}

        <DockDivider />

        <DockCard id="power">
          <DockCardInner
            onClick={toggleAdmin}
            className="cursor-pointer bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors"
          >
            <Power className="w-5 h-5 sm:w-6 sm:h-6" />
          </DockCardInner>
        </DockCard>
      </Dock>

      {/* Keyboard hint - hidden on mobile */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground whitespace-nowrap opacity-60 hidden sm:block">
        Ctrl+Shift+A to toggle
      </div>
    </div>
  );
}
