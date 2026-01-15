"use client";

import { useState, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (query.trim()) {
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      }
    }
  };

  const handleSearch = () => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
        <div className="relative bg-[#1a1b1e] border border-white/10 rounded-2xl overflow-hidden focus-within:border-white/20 transition-colors">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search by capabilities... (e.g., 'React experts who contributed to state management libraries')"
            className="w-full bg-transparent px-6 py-4 text-white placeholder-gray-500 resize-none focus:outline-none min-h-[100px]"
            rows={3}
          />
          <div className="flex items-center justify-between px-6 py-3 border-t border-white/5">
            <span className="text-xs text-gray-500">
              enter to search, shift + enter for new line
            </span>
            <button
              onClick={handleSearch}
              disabled={!query.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-white text-[#141517] rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Search className="w-4 h-4" />
              Search
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
