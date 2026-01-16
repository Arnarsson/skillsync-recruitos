"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Briefcase,
  Users,
  Brain,
  MessageSquare,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  X,
  CheckCircle,
  Search,
  Target,
  Zap,
  GitBranch,
  BarChart3,
  Send,
} from "lucide-react";
import { useLanguage, useTranslatedArray } from "@/lib/i18n";

interface OnboardingProps {
  onComplete: () => void;
  onSkip: () => void;
}

interface Step {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  color: string;
  gradient: string;
}

// Feature icons mapped by index for each step
const featureIconsByStep = [
  // welcome
  [<Sparkles key="0-0" className="w-4 h-4" />, <Target key="0-1" className="w-4 h-4" />, <Brain key="0-2" className="w-4 h-4" />, <MessageSquare key="0-3" className="w-4 h-4" />],
  // jobIntake
  [<Target key="1-0" className="w-4 h-4" />, <Sparkles key="1-1" className="w-4 h-4" />, <Users key="1-2" className="w-4 h-4" />, <BarChart3 key="1-3" className="w-4 h-4" />],
  // talentPipeline
  [<Search key="2-0" className="w-4 h-4" />, <GitBranch key="2-1" className="w-4 h-4" />, <Target key="2-2" className="w-4 h-4" />, <Users key="2-3" className="w-4 h-4" />],
  // deepProfile
  [<Brain key="3-0" className="w-4 h-4" />, <BarChart3 key="3-1" className="w-4 h-4" />, <CheckCircle key="3-2" className="w-4 h-4" />, <MessageSquare key="3-3" className="w-4 h-4" />],
  // outreach
  [<Sparkles key="4-0" className="w-4 h-4" />, <Brain key="4-1" className="w-4 h-4" />, <Zap key="4-2" className="w-4 h-4" />, <Send key="4-3" className="w-4 h-4" />],
  // complete
  [<CheckCircle key="5-0" className="w-4 h-4" />, <GitBranch key="5-1" className="w-4 h-4" />, <Search key="5-2" className="w-4 h-4" />, <Sparkles key="5-3" className="w-4 h-4" />],
];

export default function Onboarding({ onComplete, onSkip }: OnboardingProps) {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);

  // Get features for each step from translations
  const welcomeFeatures = useTranslatedArray("onboarding.steps.welcome.features");
  const jobIntakeFeatures = useTranslatedArray("onboarding.steps.jobIntake.features");
  const talentPipelineFeatures = useTranslatedArray("onboarding.steps.talentPipeline.features");
  const deepProfileFeatures = useTranslatedArray("onboarding.steps.deepProfile.features");
  const outreachFeatures = useTranslatedArray("onboarding.steps.outreach.features");
  const completeFeatures = useTranslatedArray("onboarding.steps.complete.features");

  // Build steps with translations
  const steps: Step[] = [
    {
      id: 0,
      title: t("onboarding.steps.welcome.title"),
      subtitle: t("onboarding.steps.welcome.subtitle"),
      description: t("onboarding.steps.welcome.description"),
      icon: <Sparkles className="w-12 h-12" />,
      features: welcomeFeatures,
      color: "text-primary",
      gradient: "from-primary/20 to-purple-500/20",
    },
    {
      id: 1,
      title: t("onboarding.steps.jobIntake.title"),
      subtitle: t("onboarding.steps.jobIntake.subtitle"),
      description: t("onboarding.steps.jobIntake.description"),
      icon: <Briefcase className="w-12 h-12" />,
      features: jobIntakeFeatures,
      color: "text-blue-500",
      gradient: "from-blue-500/20 to-cyan-500/20",
    },
    {
      id: 2,
      title: t("onboarding.steps.talentPipeline.title"),
      subtitle: t("onboarding.steps.talentPipeline.subtitle"),
      description: t("onboarding.steps.talentPipeline.description"),
      icon: <Users className="w-12 h-12" />,
      features: talentPipelineFeatures,
      color: "text-green-500",
      gradient: "from-green-500/20 to-emerald-500/20",
    },
    {
      id: 3,
      title: t("onboarding.steps.deepProfile.title"),
      subtitle: t("onboarding.steps.deepProfile.subtitle"),
      description: t("onboarding.steps.deepProfile.description"),
      icon: <Brain className="w-12 h-12" />,
      features: deepProfileFeatures,
      color: "text-purple-500",
      gradient: "from-purple-500/20 to-pink-500/20",
    },
    {
      id: 4,
      title: t("onboarding.steps.outreach.title"),
      subtitle: t("onboarding.steps.outreach.subtitle"),
      description: t("onboarding.steps.outreach.description"),
      icon: <MessageSquare className="w-12 h-12" />,
      features: outreachFeatures,
      color: "text-orange-500",
      gradient: "from-orange-500/20 to-yellow-500/20",
    },
    {
      id: 5,
      title: t("onboarding.steps.complete.title"),
      subtitle: t("onboarding.steps.complete.subtitle"),
      description: t("onboarding.steps.complete.description"),
      icon: <CheckCircle className="w-12 h-12" />,
      features: completeFeatures,
      color: "text-green-500",
      gradient: "from-green-500/20 to-primary/20",
    },
  ];

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setDirection(1);
      setCurrentStep((prev) => prev + 1);
    } else {
      onComplete();
    }
  }, [currentStep, onComplete]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "Escape") {
        onSkip();
      }
    },
    [handleNext, handlePrev, onSkip]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

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
        className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-muted">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Skip button */}
        <button
          onClick={onSkip}
          className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="p-8 pt-12">
          {/* Step indicators */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {steps.map((s, i) => (
              <button
                key={s.id}
                onClick={() => {
                  setDirection(i > currentStep ? 1 : -1);
                  setCurrentStep(i);
                }}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  i === currentStep
                    ? "bg-primary w-8"
                    : i < currentStep
                    ? "bg-primary/50"
                    : "bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>

          {/* Animated content */}
          <div className="relative min-h-[400px]">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={currentStep}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                }}
                className="absolute inset-0"
              >
                {/* Icon */}
                <div className="flex justify-center mb-6">
                  <div
                    className={`p-6 rounded-2xl bg-gradient-to-br ${step.gradient} ${step.color}`}
                  >
                    {step.icon}
                  </div>
                </div>

                {/* Title */}
                <div className="text-center mb-6">
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    {step.subtitle}
                  </p>
                  <h2 className="text-3xl font-bold mb-4">{step.title}</h2>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    {step.description}
                  </p>
                </div>

                {/* Features */}
                <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                  {step.features.map((feature, i) => (
                    <motion.div
                      key={`${currentStep}-${i}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm"
                    >
                      <span className={step.color}>
                        {featureIconsByStep[currentStep]?.[i] || (
                          <CheckCircle className="w-4 h-4" />
                        )}
                      </span>
                      <span>{feature}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <Button
              variant="ghost"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("common.back")}
            </Button>

            <div className="text-sm text-muted-foreground">
              {currentStep + 1} of {steps.length}
            </div>

            <Button onClick={handleNext} className="gap-2">
              {currentStep === steps.length - 1 ? (
                <>
                  {t("onboarding.getStarted")}
                  <Sparkles className="w-4 h-4" />
                </>
              ) : (
                <>
                  {t("common.next")}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Keyboard hints */}
        <div className="px-8 pb-4 text-center">
          <p className="text-xs text-muted-foreground">
            {t("lang") === "da" ? "Tryk" : "Press"}{" "}
            <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs">{t("onboarding.enterKey")}</kbd>{" "}
            {t("lang") === "da" ? "for at fortsætte eller" : "to continue or"}{" "}
            <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs">{t("onboarding.escKey")}</kbd>{" "}
            {t("lang") === "da" ? "for at springe over" : "to skip"}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
