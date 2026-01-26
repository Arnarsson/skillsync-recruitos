"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  Users,
  Brain,
  MessageSquare,
  ArrowRight,
  Sparkles,
  X,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface OnboardingProps {
  onComplete: () => void;
  onSkip: () => void;
}

export default function Onboarding({ onComplete, onSkip }: OnboardingProps) {
  const { t } = useLanguage();

  // Dismiss modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onSkip();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onSkip]);

  const steps = [
    {
      icon: <Briefcase className="w-5 h-5" />,
      title: t("onboarding.steps.jobIntake.title"),
      description: t("onboarding.quickSteps.job"),
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: t("onboarding.steps.talentPipeline.title"),
      description: t("onboarding.quickSteps.pipeline"),
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      icon: <Brain className="w-5 h-5" />,
      title: t("onboarding.steps.deepProfile.title"),
      description: t("onboarding.quickSteps.profile"),
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      icon: <MessageSquare className="w-5 h-5" />,
      title: t("onboarding.steps.outreach.title"),
      description: t("onboarding.quickSteps.outreach"),
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Skip button */}
        <button
          onClick={onSkip}
          className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 text-primary mb-4">
              <Sparkles className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold mb-2">{t("onboarding.welcome.title")}</h2>
            <p className="text-muted-foreground">
              {t("onboarding.welcome.subtitle")}
            </p>
          </div>

          {/* Quick steps overview */}
          <div className="space-y-3 mb-8">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-4 p-3 rounded-xl bg-muted/50"
              >
                <div className={`p-2 rounded-lg ${step.bg} ${step.color}`}>
                  {step.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-medium">
                      {i + 1}.
                    </span>
                    <span className="font-medium text-sm">{step.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <div className="space-y-3">
            <Button onClick={onComplete} className="w-full gap-2" size="lg">
              {t("onboarding.getStarted")}
              <ArrowRight className="w-4 h-4" />
            </Button>
            <button
              onClick={onSkip}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("onboarding.skipTour")}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
