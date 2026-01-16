"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

interface AdminContextType {
  isAdmin: boolean;
  toggleAdmin: () => void;
}

const AdminContext = createContext<AdminContextType>({
  isAdmin: false,
  toggleAdmin: () => {},
});

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("recruitos_admin_mode");
    if (stored === "true") {
      setIsAdmin(true);
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
    return <AdminContext.Provider value={{ isAdmin: false, toggleAdmin }}>{children}</AdminContext.Provider>;
  }

  return (
    <AdminContext.Provider value={{ isAdmin, toggleAdmin }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  return useContext(AdminContext);
}
