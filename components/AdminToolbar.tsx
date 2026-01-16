"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { FileText, Search, Users, Send } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminToolbar() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const isAdmin = searchParams.get("admin") !== null;

  if (!isAdmin) return null;

  const navItems = [
    { id: "intake", label: "Intake", icon: FileText, href: "/intake?admin" },
    { id: "search", label: "Search", icon: Search, href: "/search?admin" },
    { id: "pipeline", label: "Pipeline", icon: Users, href: "/pipeline?admin" },
  ];

  const isActive = (href: string) => {
    const path = href.split("?")[0];
    return pathname === path;
  };

  return (
    <div className="fixed top-20 right-4 z-50">
      <div className="flex flex-col gap-1 p-1.5 rounded-xl bg-card/95 backdrop-blur-sm border border-border shadow-lg">
        <div className="px-2 py-1 text-[10px] font-medium text-primary uppercase tracking-wider">
          Admin
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
      </div>
    </div>
  );
}
