"use client";

import { useState, useEffect } from "react";
import { Sun, Moon, Smartphone, Monitor, Tablet } from "lucide-react";
import { Button } from "./ui/button";

/**
 * Development Toolbar
 * 
 * Provides quick access to:
 * - Theme toggle (light/dark)
 * - Viewport presets (mobile/tablet/desktop)
 * - Console error counter
 * 
 * Only visible in development mode
 */
export function DevToolbar() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [viewportMode, setViewportMode] = useState<"mobile" | "tablet" | "desktop">("desktop");
  const [consoleErrors, setConsoleErrors] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV !== "development") {
      setIsVisible(false);
      return;
    }

    // Check initial theme
    const isDark = document.documentElement.classList.contains("dark");
    setIsDarkMode(isDark);

    // Monitor console errors
    const originalError = console.error;
    console.error = (...args) => {
      setConsoleErrors((prev) => prev + 1);
      originalError(...args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    const newTheme = !isDarkMode;
    
    if (newTheme) {
      html.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      html.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
    
    setIsDarkMode(newTheme);
  };

  const setViewport = (mode: "mobile" | "tablet" | "desktop") => {
    const app = document.getElementById("app-container");
    if (!app) return;

    switch (mode) {
      case "mobile":
        app.style.maxWidth = "375px";
        app.style.margin = "0 auto";
        break;
      case "tablet":
        app.style.maxWidth = "768px";
        app.style.margin = "0 auto";
        break;
      case "desktop":
        app.style.maxWidth = "100%";
        app.style.margin = "0";
        break;
    }
    
    setViewportMode(mode);
  };

  const clearErrorCount = () => {
    setConsoleErrors(0);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 rounded-lg shadow-lg p-3 space-y-2">
      <div className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
        🔧 Dev Toolbar
      </div>

      {/* Theme Toggle */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={isDarkMode ? "default" : "outline"}
          onClick={toggleTheme}
          className="flex-1"
        >
          {isDarkMode ? <Moon className="w-4 h-4 mr-1" /> : <Sun className="w-4 h-4 mr-1" />}
          {isDarkMode ? "Dark" : "Light"}
        </Button>
      </div>

      {/* Viewport Presets */}
      <div className="flex gap-1">
        <Button
          size="sm"
          variant={viewportMode === "mobile" ? "default" : "outline"}
          onClick={() => setViewport("mobile")}
          title="Mobile (375px)"
        >
          <Smartphone className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant={viewportMode === "tablet" ? "default" : "outline"}
          onClick={() => setViewport("tablet")}
          title="Tablet (768px)"
        >
          <Tablet className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant={viewportMode === "desktop" ? "default" : "outline"}
          onClick={() => setViewport("desktop")}
          title="Desktop (100%)"
        >
          <Monitor className="w-4 h-4" />
        </Button>
      </div>

      {/* Console Error Counter */}
      <div 
        className={`text-xs p-2 rounded ${
          consoleErrors > 0 
            ? "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200" 
            : "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
        }`}
        onClick={clearErrorCount}
        title="Click to reset counter"
      >
        {consoleErrors === 0 ? "✅ No console errors" : `⚠️ ${consoleErrors} console error${consoleErrors > 1 ? 's' : ''}`}
      </div>

      {/* Hide Button */}
      <button
        onClick={() => setIsVisible(false)}
        className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 w-full text-center"
      >
        Hide toolbar
      </button>
    </div>
  );
}
