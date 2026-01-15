"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
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
    title: "Velkommen til RecruitOS",
    subtitle: "AI-Drevet Rekruttering",
    description:
      "Find elite ingeniører ved at analysere deres faktiske arbejde på GitHub. Ingen flere CV-screeninger - se hvad udviklere virkelig bygger.",
    icon: <Sparkles className="w-12 h-12" />,
    features: [
      "Søg efter kompetencer, ikke nøgleord",
      "AI-drevet kandidatscoring",
      "Dyb psykometrisk analyse",
      "Personaliseret kontaktgenerering",
    ],
    color: "text-primary",
    gradient: "from-primary/20 to-purple-500/20",
  },
  {
    id: 1,
    title: "Trin 1: Jobindtag",
    subtitle: "Definer Din Ideelle Kandidat",
    description:
      "Start med at give kontekst om rollen. Indsæt en job-URL eller beskrivelse, og vores AI ekstraherer nøglekrav automatisk.",
    icon: <Briefcase className="w-12 h-12" />,
    features: [
      "Indsæt job-URL eller beskrivelse",
      "AI ekstraherer påkrævede færdigheder",
      "Tilføj LinkedIn kontekst for kulturmatch",
      "Kalibrer søgeparametre",
    ],
    color: "text-blue-500",
    gradient: "from-blue-500/20 to-cyan-500/20",
  },
  {
    id: 2,
    title: "Trin 2: Talent Pipeline",
    subtitle: "Find & Scor Kandidater",
    description:
      "Søg på GitHub for at finde udviklere der matcher dine krav. Hver kandidat scores baseret på deres repositories og bidrag.",
    icon: <Users className="w-12 h-12" />,
    features: [
      "Naturligt sprog søgning",
      "Real-time GitHub analyse",
      "Matchscore (0-100)",
      "Filtrer og sammenlign kandidater",
    ],
    color: "text-green-500",
    gradient: "from-green-500/20 to-emerald-500/20",
  },
  {
    id: 3,
    title: "Trin 3: Dybdeprofil",
    subtitle: "Evidensbaseret Analyse",
    description:
      "Dyk ned i en kandidats arbejdshistorik, kodemønstre og psykometriske profil baseret på deres GitHub aktivitet.",
    icon: <Brain className="w-12 h-12" />,
    features: [
      "Psykometrisk profilering",
      "Arbejdsstil indikatorer",
      "Grønne & røde flag",
      "Forslag til interviewspørgsmål",
    ],
    color: "text-purple-500",
    gradient: "from-purple-500/20 to-pink-500/20",
  },
  {
    id: 4,
    title: "Trin 4: Kontakt",
    subtitle: "Personaliserede Beskeder",
    description:
      "Generer personaliserede kontaktbeskeder tilpasset hver kandidats arketype og kommunikationspræferencer.",
    icon: <MessageSquare className="w-12 h-12" />,
    features: [
      "AI-genererede beskeder",
      "Arketype-specifik tone",
      "Personaliserede hooks",
      "Multi-kanal skabeloner",
    ],
    color: "text-orange-500",
    gradient: "from-orange-500/20 to-yellow-500/20",
  },
  {
    id: 5,
    title: "Du Er Klar!",
    subtitle: "Begynd Rekruttering",
    description:
      "Du er klar til at finde din næste fantastiske ansættelse. Start med at opsætte dit første jobindtag, eller udforsk platformen.",
    icon: <CheckCircle className="w-12 h-12" />,
    features: [
      "Intet kreditkort krævet",
      "GitHub login for alle funktioner",
      "Gratis søgning tilgængelig",
      "Premium analyse on demand",
    ],
    color: "text-green-500",
    gradient: "from-green-500/20 to-primary/20",
  },
];

const featureIcons: Record<string, React.ReactNode> = {
  "Indsæt job-URL eller beskrivelse": <Target className="w-4 h-4" />,
  "AI ekstraherer påkrævede færdigheder": <Sparkles className="w-4 h-4" />,
  "Tilføj LinkedIn kontekst for kulturmatch": <Users className="w-4 h-4" />,
  "Kalibrer søgeparametre": <BarChart3 className="w-4 h-4" />,
  "Naturligt sprog søgning": <Search className="w-4 h-4" />,
  "Real-time GitHub analyse": <GitBranch className="w-4 h-4" />,
  "Matchscore (0-100)": <Target className="w-4 h-4" />,
  "Filtrer og sammenlign kandidater": <Users className="w-4 h-4" />,
  "Psykometrisk profilering": <Brain className="w-4 h-4" />,
  "Arbejdsstil indikatorer": <BarChart3 className="w-4 h-4" />,
  "Grønne & røde flag": <CheckCircle className="w-4 h-4" />,
  "Forslag til interviewspørgsmål": <MessageSquare className="w-4 h-4" />,
  "AI-genererede beskeder": <Sparkles className="w-4 h-4" />,
  "Arketype-specifik tone": <Brain className="w-4 h-4" />,
  "Personaliserede hooks": <Zap className="w-4 h-4" />,
  "Multi-kanal skabeloner": <Send className="w-4 h-4" />,
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
              Tilbage
            </Button>

            <div className="text-sm text-muted-foreground">
              {currentStep + 1} af {steps.length}
            </div>

            <Button onClick={handleNext} className="gap-2">
              {currentStep === steps.length - 1 ? (
                <>
                  Kom I Gang
                  <Sparkles className="w-4 h-4" />
                </>
              ) : (
                <>
                  Næste
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Keyboard hints */}
        <div className="px-8 pb-4 text-center">
          <p className="text-xs text-muted-foreground">
            Tryk <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs">Enter</kbd> for at fortsætte
            eller <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs">Esc</kbd> for at springe over
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
