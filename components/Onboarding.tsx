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

const steps: Step[] = [
  {
    id: 0,
    title: "Welcome to SkillSync",
    subtitle: "AI-Powered Recruiting",
    description:
      "Find elite engineers by analyzing their actual work on GitHub. No more resume screening - see what developers really build.",
    icon: <Sparkles className="w-12 h-12" />,
    features: [
      "Search by capabilities, not keywords",
      "AI-powered candidate scoring",
      "Deep psychometric analysis",
      "Personalized outreach generation",
    ],
    color: "text-primary",
    gradient: "from-primary/20 to-purple-500/20",
  },
  {
    id: 1,
    title: "Step 1: Job Intake",
    subtitle: "Define Your Ideal Candidate",
    description:
      "Start by providing context about the role. Paste a job URL or description, and our AI extracts key requirements automatically.",
    icon: <Briefcase className="w-12 h-12" />,
    features: [
      "Paste job URL or description",
      "AI extracts required skills",
      "Add LinkedIn context for culture fit",
      "Calibrate search parameters",
    ],
    color: "text-blue-500",
    gradient: "from-blue-500/20 to-cyan-500/20",
  },
  {
    id: 2,
    title: "Step 2: Talent Pipeline",
    subtitle: "Source & Score Candidates",
    description:
      "Search GitHub to find developers matching your requirements. Each candidate is scored based on their repositories and contributions.",
    icon: <Users className="w-12 h-12" />,
    features: [
      "Natural language search",
      "Real-time GitHub analysis",
      "Alignment score (0-100)",
      "Filter and compare candidates",
    ],
    color: "text-green-500",
    gradient: "from-green-500/20 to-emerald-500/20",
  },
  {
    id: 3,
    title: "Step 3: Deep Profile",
    subtitle: "Evidence-Based Analysis",
    description:
      "Dive deep into a candidate's work history, coding patterns, and psychometric profile based on their GitHub activity.",
    icon: <Brain className="w-12 h-12" />,
    features: [
      "Psychometric profiling",
      "Work style indicators",
      "Green & red flags",
      "Interview question suggestions",
    ],
    color: "text-purple-500",
    gradient: "from-purple-500/20 to-pink-500/20",
  },
  {
    id: 4,
    title: "Step 4: Outreach",
    subtitle: "Personalized Messaging",
    description:
      "Generate personalized outreach messages tailored to each candidate's archetype and communication preferences.",
    icon: <MessageSquare className="w-12 h-12" />,
    features: [
      "AI-generated messages",
      "Archetype-specific tone",
      "Personalized hooks",
      "Multi-channel templates",
    ],
    color: "text-orange-500",
    gradient: "from-orange-500/20 to-yellow-500/20",
  },
  {
    id: 5,
    title: "You're All Set!",
    subtitle: "Start Recruiting",
    description:
      "You're ready to find your next great hire. Start by setting up your first job intake, or explore the platform.",
    icon: <CheckCircle className="w-12 h-12" />,
    features: [
      "No credit card required",
      "GitHub sign-in for full features",
      "Free search tier available",
      "Premium analysis on demand",
    ],
    color: "text-green-500",
    gradient: "from-green-500/20 to-primary/20",
  },
];

const featureIcons: Record<string, React.ReactNode> = {
  "Paste job URL or description": <Target className="w-4 h-4" />,
  "AI extracts required skills": <Sparkles className="w-4 h-4" />,
  "Add LinkedIn context for culture fit": <Users className="w-4 h-4" />,
  "Calibrate search parameters": <BarChart3 className="w-4 h-4" />,
  "Natural language search": <Search className="w-4 h-4" />,
  "Real-time GitHub analysis": <GitBranch className="w-4 h-4" />,
  "Alignment score (0-100)": <Target className="w-4 h-4" />,
  "Filter and compare candidates": <Users className="w-4 h-4" />,
  "Psychometric profiling": <Brain className="w-4 h-4" />,
  "Work style indicators": <BarChart3 className="w-4 h-4" />,
  "Green & red flags": <CheckCircle className="w-4 h-4" />,
  "Interview question suggestions": <MessageSquare className="w-4 h-4" />,
  "AI-generated messages": <Sparkles className="w-4 h-4" />,
  "Archetype-specific tone": <Brain className="w-4 h-4" />,
  "Personalized hooks": <Zap className="w-4 h-4" />,
  "Multi-channel templates": <Send className="w-4 h-4" />,
};

export default function Onboarding({ onComplete, onSkip }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);

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
                      key={feature}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm"
                    >
                      <span className={step.color}>
                        {featureIcons[feature] || (
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
              Back
            </Button>

            <div className="text-sm text-muted-foreground">
              {currentStep + 1} of {steps.length}
            </div>

            <Button onClick={handleNext} className="gap-2">
              {currentStep === steps.length - 1 ? (
                <>
                  Get Started
                  <Sparkles className="w-4 h-4" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Keyboard hints */}
        <div className="px-8 pb-4 text-center">
          <p className="text-xs text-muted-foreground">
            Press <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs">Enter</kbd> to continue
            or <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs">Esc</kbd> to skip
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
