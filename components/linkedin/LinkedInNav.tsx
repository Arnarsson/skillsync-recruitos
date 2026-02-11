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
import { useLanguage } from "@/lib/i18n";

const navItems = [
  {
    href: "/linkedin-captures",
    labelKey: "linkedin.nav.captures",
    icon: Users,
    descriptionKey: "linkedin.nav.capturesDesc",
  },
  {
    href: "/linkedin-pipeline",
    labelKey: "linkedin.nav.pipeline",
    icon: Kanban,
    descriptionKey: "linkedin.nav.pipelineDesc",
  },
  {
    href: "/network-map",
    labelKey: "linkedin.nav.network",
    icon: Network,
    descriptionKey: "linkedin.nav.networkDesc",
  },
];

export function LinkedInNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-1 mb-6">
      <div className="flex items-center gap-1">
        <div className="flex items-center gap-2 px-3 py-2 text-slate-400">
          <Linkedin className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-slate-300">{t("linkedin.nav.tools")}</span>
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
                "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900",
                isActive
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <item.icon className="w-4 h-4" />
              {t(item.labelKey)}
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
  const { t } = useLanguage();
  const content = {
    captures: {
      icon: Users,
      title: t("linkedin.empty.captures.title"),
      description: t("linkedin.empty.captures.description"),
      action: {
        label: t("linkedin.empty.captures.action"),
        href: "#",
        icon: Chrome,
      },
      tips: [
        t("linkedin.empty.captures.tip1"),
        t("linkedin.empty.captures.tip2"),
        t("linkedin.empty.captures.tip3"),
      ],
    },
    pipeline: {
      icon: Kanban,
      title: t("linkedin.empty.pipeline.title"),
      description: t("linkedin.empty.pipeline.description"),
      action: {
        label: t("linkedin.empty.pipeline.action"),
        href: "/linkedin-captures",
        icon: ArrowRight,
      },
      tips: [
        t("linkedin.empty.pipeline.tip1"),
        t("linkedin.empty.pipeline.tip2"),
        t("linkedin.empty.pipeline.tip3"),
      ],
    },
    network: {
      icon: Network,
      title: t("linkedin.empty.network.title"),
      description: t("linkedin.empty.network.description"),
      action: {
        label: t("linkedin.empty.network.action"),
        href: "/linkedin-captures",
        icon: ArrowRight,
      },
      tips: [
        t("linkedin.empty.network.tip1"),
        t("linkedin.empty.network.tip2"),
        t("linkedin.empty.network.tip3"),
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
        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors mb-8 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900"
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
