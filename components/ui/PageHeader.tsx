"use client";

import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ icon: Icon, title, subtitle, badge, actions }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-4">
      <div className="flex items-center gap-3">
        <div className="icon-container">
          <Icon />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="heading-lg">{title}</h1>
            {badge}
          </div>
          {subtitle && (
            <p className="body-sm mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
