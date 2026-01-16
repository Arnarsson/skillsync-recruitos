"use client";

import { useRouter, usePathname } from "next/navigation";
import { FileText, Search, Users, Power, Keyboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdmin } from "@/lib/adminContext";

export default function AdminToolbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAdmin, toggleAdmin } = useAdmin();

  const navItems = [
    { id: "intake", label: "Intake", icon: FileText, href: "/intake" },
    { id: "search", label: "Search", icon: Search, href: "/search" },
    { id: "pipeline", label: "Pipeline", icon: Users, href: "/pipeline" },
  ];

  const isActive = (href: string) => {
    return pathname === href;
  };

  // Always show the toggle button in the corner
  if (!isAdmin) {
    return (
      <button
        onClick={toggleAdmin}
        className="fixed bottom-4 right-4 z-50 p-2 rounded-lg bg-card/80 backdrop-blur-sm border border-border shadow-lg text-muted-foreground hover:text-foreground hover:bg-card transition-colors group"
        title="Toggle Admin Mode (Ctrl+Shift+A)"
      >
        <Power className="w-4 h-4" />
        <span className="absolute bottom-full right-0 mb-2 px-2 py-1 text-xs bg-card border border-border rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Admin Mode (Ctrl+Shift+A)
        </span>
      </button>
    );
  }

  return (
    <div className="fixed top-20 right-4 z-50">
      <div className="flex flex-col gap-1 p-1.5 rounded-xl bg-card/95 backdrop-blur-sm border border-border shadow-lg">
        <div className="flex items-center justify-between px-2 py-1">
          <span className="text-[10px] font-medium text-primary uppercase tracking-wider">
            Admin
          </span>
          <button
            onClick={toggleAdmin}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Toggle Admin Mode (Ctrl+Shift+A)"
          >
            <Power className="w-3 h-3" />
          </button>
        </div>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => router.push(item.href)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
              isActive(item.href)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <item.icon className="w-4 h-4" />
            <span>{item.label}</span>
          </button>
        ))}
        <div className="px-2 py-1 mt-1 border-t border-border">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Keyboard className="w-3 h-3" />
            <span>Ctrl+Shift+A to toggle</span>
          </div>
        </div>
      </div>
    </div>
  );
}
