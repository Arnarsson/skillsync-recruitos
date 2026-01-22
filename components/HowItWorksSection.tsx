"use client";

import { FileText, ListChecks, Users, Microscope, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";

const STEPS = [
  {
    id: 1,
    icon: FileText,
    titleKey: "home.howItWorks.steps.pasteJd.title",
    descKey: "home.howItWorks.steps.pasteJd.desc",
    screenshotLabel: "Step 1: Job Intake",
  },
  {
    id: 2,
    icon: ListChecks,
    titleKey: "home.howItWorks.steps.skillsReview.title",
    descKey: "home.howItWorks.steps.skillsReview.desc",
    screenshotLabel: "Step 2: Skills Review",
  },
  {
    id: 3,
    icon: Users,
    titleKey: "home.howItWorks.steps.candidates.title",
    descKey: "home.howItWorks.steps.candidates.desc",
    screenshotLabel: "Step 3: Candidates",
  },
  {
    id: 4,
    icon: Microscope,
    titleKey: "home.howItWorks.steps.shortlist.title",
    descKey: "home.howItWorks.steps.shortlist.desc",
    screenshotLabel: "Step 4: Shortlist",
  },
  {
    id: 5,
    icon: Mail,
    titleKey: "home.howItWorks.steps.outreach.title",
    descKey: "home.howItWorks.steps.outreach.desc",
    screenshotLabel: "Step 5: Outreach Pack",
  },
] as const;

export function HowItWorksSection() {
  const { t } = useLanguage();

  return (
    <section className="py-16 sm:py-20 px-4 border-t border-border">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-light mb-4 text-center lowercase">
          {t("home.howItWorks.title")}
        </h2>
        <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
          {t("home.howItWorks.subtitle")}
        </p>

        {/* Steps Grid */}
        <div className="space-y-6 sm:space-y-0 sm:grid sm:grid-cols-5 sm:gap-4">
          {STEPS.map((step, index) => {
            const StepIcon = step.icon;
            return (
              <div key={step.id} className="flex flex-col items-center text-center">
                {/* Step Circle with Icon */}
                <div className="relative mb-4">
                  <div
                    className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center",
                      "bg-primary/10 text-primary border border-primary/20"
                    )}
                  >
                    <StepIcon className="w-6 h-6" />
                  </div>
                  {/* Step Number Badge */}
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                    {step.id}
                  </div>
                  {/* Connector Line (not on last) */}
                  {index < STEPS.length - 1 && (
                    <div className="hidden sm:block absolute top-1/2 left-full w-full h-px bg-border -translate-y-1/2" />
                  )}
                </div>

                {/* Title & Description */}
                <h3 className="font-medium text-sm mb-1 lowercase">
                  {t(step.titleKey)}
                </h3>
                <p className="text-xs text-muted-foreground lowercase leading-relaxed">
                  {t(step.descKey)}
                </p>
              </div>
            );
          })}
        </div>

        {/* Screenshot Placeholders - Show key milestones: Intake, Candidates, Outreach */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[STEPS[0], STEPS[2], STEPS[4]].map((step) => (
            <div
              key={step.id}
              className="aspect-video rounded-lg border border-border bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center"
            >
              <div className="text-center">
                <step.icon className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                <span className="text-xs text-muted-foreground/70">
                  {step.screenshotLabel}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HowItWorksSection;
