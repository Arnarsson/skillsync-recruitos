"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

interface AdminContextType {
  isAdmin: boolean;
  toggleAdmin: () => void;
  isDemoMode: boolean;
}

const AdminContext = createContext<AdminContextType>({
  isAdmin: false,
  toggleAdmin: () => {},
  isDemoMode: false,
});

export function AdminProvider({ children }: { children: ReactNode }) {
  // Check if demo mode is enabled via URL param or localStorage
  const [isDemoMode, setIsDemoMode] = useState(() => {
    if (typeof window === "undefined") return false;
    const urlParams = new URLSearchParams(window.location.search);
    const demoParam = urlParams.get("demo");
    const demoInStorage = localStorage.getItem("recruitos_demo_mode") === "true";
    return demoParam === "true" || demoInStorage;
  });

  // Lazy initialization: read from localStorage during initial render (SSR-safe)
  // Auto-enable admin mode if demo mode is active
  const [isAdmin, setIsAdmin] = useState(() => {
    if (typeof window === "undefined") return false;
    const urlParams = new URLSearchParams(window.location.search);
    const demoParam = urlParams.get("demo");
    const demoInStorage = localStorage.getItem("recruitos_demo_mode") === "true";
    const adminInStorage = localStorage.getItem("recruitos_admin_mode") === "true";
    return demoParam === "true" || demoInStorage || adminInStorage;
  });
  const [mounted, setMounted] = useState(false);

  // Hydration gate: mark as mounted after first client render
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional hydration gate pattern
    setMounted(true);

    // Check for demo mode in URL on mount
    const urlParams = new URLSearchParams(window.location.search);
    const demoParam = urlParams.get("demo");
    if (demoParam === "true") {
      localStorage.setItem("recruitos_demo_mode", "true");
      localStorage.setItem("recruitos_admin_mode", "true");
      setIsDemoMode(true);
      setIsAdmin(true);
      
      // Clean URL (remove demo param) without page reload
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("demo");
      window.history.replaceState({}, "", newUrl.toString());
    }
  }, []);

  // Keyboard shortcut: Ctrl + Shift + A (works on all platforms)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Use ctrlKey for Linux/Windows, metaKey for Mac
      const modifierPressed = e.ctrlKey || e.metaKey;
      if (modifierPressed && e.shiftKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        setIsAdmin((prev) => {
          const newValue = !prev;
          localStorage.setItem("recruitos_admin_mode", String(newValue));
          return newValue;
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const toggleAdmin = useCallback(() => {
    setIsAdmin((prev) => {
      const newValue = !prev;
      localStorage.setItem("recruitos_admin_mode", String(newValue));
      return newValue;
    });
  }, []);

  // Prevent hydration mismatch
  if (!mounted) {
    return <AdminContext.Provider value={{ isAdmin: false, toggleAdmin, isDemoMode: false }}>{children}</AdminContext.Provider>;
  }

  return (
    <AdminContext.Provider value={{ isAdmin, toggleAdmin, isDemoMode }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  return useContext(AdminContext);
}
