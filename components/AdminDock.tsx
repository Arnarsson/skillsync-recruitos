"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useRef, useCallback, useEffect } from "react";
import { FileText, Search, Users, Power, Home, Settings, GripVertical } from "lucide-react";
import { Dock, DockCard, DockCardInner, DockDivider } from "@/components/ui/dock";
import { useAdmin } from "@/lib/adminContext";
import { cn } from "@/lib/utils";

const DOCK_POSITION_KEY = "recruitos_dock_position";

function useDraggable(initialPosition?: { x: number; y: number }) {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef({ x: 0, y: 0 });
  const didDragRef = useRef(false);

  // Load saved position on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DOCK_POSITION_KEY);
      if (saved) {
        setPosition(JSON.parse(saved));
      } else if (initialPosition) {
        setPosition(initialPosition);
      }
    } catch {
      // ignore
    }
  }, [initialPosition]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = dragRef.current.getBoundingClientRect();
    offsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    didDragRef.current = false;
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging || !dragRef.current) return;

      const x = e.clientX - offsetRef.current.x;
      const y = e.clientY - offsetRef.current.y;

      // Clamp to viewport
      const rect = dragRef.current.getBoundingClientRect();
      const clampedX = Math.max(0, Math.min(window.innerWidth - rect.width, x));
      const clampedY = Math.max(0, Math.min(window.innerHeight - rect.height, y));

      didDragRef.current = true;
      setPosition({ x: clampedX, y: clampedY });
    },
    [isDragging]
  );

  const onPointerUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    // Persist position
    if (position) {
      try {
        localStorage.setItem(DOCK_POSITION_KEY, JSON.stringify(position));
      } catch {
        // ignore
      }
    }
    // Suppress clicks that fire right after drag ends
    if (didDragRef.current) {
      requestAnimationFrame(() => {
        didDragRef.current = false;
      });
    }
  }, [isDragging, position]);

  // Capture clicks on the container and suppress them if a drag just ended
  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (didDragRef.current) {
      e.stopPropagation();
      e.preventDefault();
    }
  }, []);

  return { position, isDragging, dragRef, onPointerDown, onPointerMove, onPointerUp, onClickCapture };
}

export default function AdminDock() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAdmin, toggleAdmin } = useAdmin();
  const { position, isDragging, dragRef, onPointerDown, onPointerMove, onPointerUp, onClickCapture } =
    useDraggable();

  // Only show in development or when ?admin query param is present
  const isDev = process.env.NODE_ENV === "development";
  const hasAdminParam = searchParams.has("admin");
  const showAdminUI = isDev || hasAdminParam;

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
  // Hidden in production unless ?admin query param is present
  if (!isAdmin) {
    if (!showAdminUI) return null;

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

  // Positioning: use saved/dragged position or default to bottom-center
  const style: React.CSSProperties = position
    ? { left: position.x, top: position.y, transform: "none" }
    : { left: "50%", bottom: "12px", transform: "translateX(-50%)" };

  // Mac-style draggable dock when admin mode is on
  return (
    <div
      ref={dragRef}
      className={cn("fixed z-50", isDragging && "select-none")}
      style={style}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onClickCapture={onClickCapture}
    >
      <Dock className="bg-card/95 backdrop-blur-md border border-border shadow-2xl scale-90 sm:scale-100 origin-bottom">
        {/* Drag handle */}
        <DockCard id="drag-handle">
          <DockCardInner
            onPointerDown={onPointerDown}
            className={cn(
              "cursor-grab active:cursor-grabbing bg-muted/50 hover:bg-muted text-muted-foreground transition-colors",
              isDragging && "cursor-grabbing"
            )}
          >
            <GripVertical className="w-4 h-4 sm:w-5 sm:h-5" />
          </DockCardInner>
        </DockCard>

        <DockDivider />

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
