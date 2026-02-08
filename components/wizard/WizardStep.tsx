"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";

export function WizardStep({
  step,
  title,
  children,
}: {
  step: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <motion.div
      key={step}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="space-y-6"
    >
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Step {step}</div>
        <h2 className="text-2xl sm:text-3xl font-bold mt-1">{title}</h2>
      </div>
      {children}
    </motion.div>
  );
}
