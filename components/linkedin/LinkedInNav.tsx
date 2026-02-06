"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Linkedin, 
  Users, 
  Kanban, 
  Network, 
  Download,
  Chrome,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/linkedin-captures",
    label: "Captures",
    icon: Users,
    description: "View captured profiles",
  },
  {
    href: "/linkedin-pipeline",
    label: "Pipeline",
    icon: Kanban,
    description: "Manage candidates",
  },
  {
    href: "/network-map",
    label: "Network",
    icon: Network,
    description: "Relationship mapping",
  },
];

export function LinkedInNav() {
  const pathname = usePathname();

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-1 mb-6">
      <div className="flex items-center gap-1">
        <div className="flex items-center gap-2 px-3 py-2 text-slate-400">
          <Linkedin className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-slate-300">LinkedIn Tools</span>
        </div>
        <div className="w-px h-6 bg-slate-800 mx-2" />
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function LinkedInEmptyState({ 
  type 
}: { 
  type: "captures" | "pipeline" | "network" 
}) {
  const content = {
    captures: {
      icon: Users,
      title: "No profiles captured yet",
      description: "Install the Chrome extension and browse LinkedIn profiles. They'll appear here automatically.",
      action: {
        label: "Get Chrome Extension",
        href: "#",
        icon: Chrome,
      },
      tips: [
        "Visit any LinkedIn profile",
        "Click 'Add to RecruitOS' button",
        "Profile appears here instantly",
      ],
    },
    pipeline: {
      icon: Kanban,
      title: "Your pipeline is empty",
      description: "Capture profiles first, then drag them through your recruiting pipeline.",
      action: {
        label: "Capture Profiles",
        href: "/linkedin-captures",
        icon: ArrowRight,
      },
      tips: [
        "Capture candidates from LinkedIn",
        "Drag between stages",
        "Track your hiring process",
      ],
    },
    network: {
      icon: Network,
      title: "No network data yet",
      description: "Capture LinkedIn profiles to build your network map. The more profiles you capture, the richer your intelligence becomes.",
      action: {
        label: "Start Capturing",
        href: "/linkedin-captures",
        icon: ArrowRight,
      },
      tips: [
        "See company penetration",
        "Find colleague connections",
        "Map relationship paths",
      ],
    },
  };

  const c = content[type];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-8">
      <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-6">
        <c.icon className="w-8 h-8 text-slate-500" />
      </div>
      
      <h3 className="text-xl font-semibold text-white mb-2">{c.title}</h3>
      <p className="text-slate-400 text-center max-w-md mb-8">{c.description}</p>
      
      <Link
        href={c.action.href}
        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors mb-8"
      >
        <c.action.icon className="w-4 h-4" />
        {c.action.label}
      </Link>
      
      <div className="flex items-center gap-8 text-sm">
        {c.tips.map((tip, i) => (
          <div key={i} className="flex items-center gap-2 text-slate-500">
            <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs text-slate-400">
              {i + 1}
            </div>
            {tip}
          </div>
        ))}
      </div>
    </div>
  );
}
