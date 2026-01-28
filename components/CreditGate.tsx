"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CREDITS_TO_EUR, PRICING } from "@/types";
import { Coins, AlertTriangle, X, ArrowRight, Zap } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useAdmin } from "@/lib/adminContext";

interface CreditGateProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  stage: "deep-dive" | "outreach";
  candidateCount: number;
  currentBalance: number;
}

export default function CreditGate({
  isOpen,
  onClose,
  onConfirm,
  stage,
  candidateCount,
  currentBalance,
}: CreditGateProps) {
  const { t } = useLanguage();
  const { isDemoMode } = useAdmin();

  const STAGE_CONFIG = {
    "deep-dive": {
      title: t("credits.deepProfileAnalysis"),
      description: t("credits.deepProfileDesc"),
      creditsPerCandidate: PRICING.DEEP_PROFILE,
      icon: Zap,
    },
    outreach: {
      title: t("credits.personalizedOutreach"),
      description: t("credits.outreachDesc"),
      creditsPerCandidate: PRICING.OUTREACH,
      icon: ArrowRight,
    },
  };

  const config = STAGE_CONFIG[stage];
  const totalCost = candidateCount * config.creditsPerCandidate;
  const eurCost = (totalCost * CREDITS_TO_EUR).toFixed(2);
  const hasInsufficientBalance = currentBalance < totalCost;
  const remainingBalance = currentBalance - totalCost;
  const StageIcon = config.icon;

  // Don't show credit gate in demo mode
  if (isDemoMode) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-background rounded-lg p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <StageIcon className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-lg font-bold">{config.title}</h2>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground mb-6">
              {config.description}
            </p>

            {/* Cost Breakdown */}
            <div className="bg-muted/50 rounded-lg p-4 mb-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t("credits.candidates")}</span>
                <span className="font-medium">{candidateCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t("credits.creditsPerCandidate")}</span>
                <span className="font-medium">{config.creditsPerCandidate}</span>
              </div>
              <div className="border-t border-border pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{t("credits.totalCost")}</span>
                  <div className="text-right">
                    <div className="flex items-center gap-1.5 font-bold text-lg">
                      <Coins className="w-4 h-4 text-amber-500" />
                      {totalCost.toLocaleString()}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      ~{eurCost} EUR
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Balance Display */}
            <div className="flex items-center justify-between p-3 border rounded-lg mb-4">
              <span className="text-sm text-muted-foreground">{t("credits.yourBalance")}</span>
              <Badge
                variant={hasInsufficientBalance ? "destructive" : "secondary"}
                className="font-mono"
              >
                <Coins className="w-3 h-3 mr-1" />
                {currentBalance.toLocaleString()}
              </Badge>
            </div>

            {/* Insufficient Balance Warning */}
            {hasInsufficientBalance && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg mb-4"
              >
                <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">
                    {t("credits.insufficientCredits")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("credits.needMoreCredits").replace('{amount}', (totalCost - currentBalance).toLocaleString())}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Remaining Balance Preview */}
            {!hasInsufficientBalance && (
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                <span>{t("credits.balanceAfter")}</span>
                <span className="font-medium text-foreground">
                  {remainingBalance.toLocaleString()} credits
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                {t("common.cancel")}
              </Button>
              <Button
                className="flex-1"
                onClick={onConfirm}
                disabled={hasInsufficientBalance}
              >
                <Coins className="w-4 h-4 mr-2" />
                {t("credits.confirm")} ({totalCost} CR)
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
