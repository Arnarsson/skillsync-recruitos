"use client";

import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CreditCard, Coins } from "lucide-react";

interface InsufficientCreditsModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Modal shown when a user tries to analyze a candidate with 0 credits.
 */
export default function InsufficientCreditsModal({
  open,
  onClose,
}: InsufficientCreditsModalProps) {
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <DialogTitle className="text-center">
            Ikke nok kreditter
          </DialogTitle>
          <DialogDescription className="text-center">
            Du har brugt alle dine kreditter. Køb flere for at fortsætte med
            kandidatanalyser.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Coins className="w-5 h-5 text-primary shrink-0" />
            <div className="text-sm">
              <p className="font-medium">Starter — 10 kreditter</p>
              <p className="text-muted-foreground">500 kr</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <Coins className="w-5 h-5 text-primary shrink-0" />
            <div className="text-sm">
              <p className="font-medium">Pro — 50 kreditter</p>
              <p className="text-muted-foreground">2.000 kr (mest populær)</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Annuller
          </Button>
          <Button
            onClick={() => {
              onClose();
              router.push("/pricing");
            }}
            className="flex-1"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Køb Kreditter
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
