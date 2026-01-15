import React, { useCallback } from 'react';
import { Candidate, FunnelStage, PRICING, CREDITS_TO_EUR } from '../types';
import { ToastType } from './ToastNotification';
import { ProfileHero } from './profile/ProfileHero';
import { InsightsOverview } from './profile/InsightsOverview';
import { RecommendationBanner } from './profile/RecommendationBanner';
import { AlignmentRadar } from './profile/AlignmentRadar';
import { IntelligenceTabs } from './profile/IntelligenceTabs';
import { OutreachSection } from './profile/OutreachSection';
import { handleShareProfile, handleDownloadProfilePDF } from '../utils/profileUtils';

interface Props {
    candidate: Candidate | null;
    credits: number;
    onSpendCredits: (amount: number, description?: string) => void;
    onClose: () => void;
    onOpenOutreach: (c: Candidate) => void;
    addToast: (type: ToastType, message: string) => void;
}

import { motion } from 'framer-motion';

const DeepProfile: React.FC<Props> = ({ candidate, credits, onSpendCredits, onClose, onOpenOutreach, addToast }) => {
    const isOutreachUnlocked = candidate?.unlockedSteps.includes(FunnelStage.OUTREACH) || false;

    const handleUnlockOutreach = useCallback(() => {
        if (!candidate) return;
        if (credits < PRICING.OUTREACH) {
            addToast('error', "Insufficient credits.");
            return;
        }
        onSpendCredits(PRICING.OUTREACH, `Unlocked Outreach Protocol: ${candidate.name}`);
        addToast('success', "Outreach Protocol Unlocked");
        onOpenOutreach(candidate);
    }, [credits, candidate, onSpendCredits, addToast, onOpenOutreach]);

    const handleRefresh = useCallback(() => {
        if (!candidate) return;
        if (credits < PRICING.REFRESH) {
            addToast('error', "Insufficient credits.");
            return;
        }
        if (window.confirm(`Refresh data for 1 Credit (~€${(PRICING.REFRESH * CREDITS_TO_EUR).toFixed(2)})?`)) {
            onSpendCredits(PRICING.REFRESH, `Manual Profile Refresh: ${candidate.name}`);
            addToast('success', "Profile refreshed");
        }
    }, [credits, candidate, onSpendCredits, addToast]);

    const onShare = useCallback(() => {
        if (candidate) handleShareProfile(candidate, addToast);
    }, [candidate, addToast]);

    const onDownloadPDF = useCallback(() => {
        if (candidate) handleDownloadProfilePDF(candidate, addToast);
    }, [candidate, addToast]);

    if (!candidate) return null;

    return (
        <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 left-0 md:left-auto md:w-[650px] bg-[#0E1525]/95 backdrop-blur-2xl border-l border-white/10 shadow-2xl z-50 flex flex-col font-sans"
        >
            <ProfileHero
                candidate={candidate}
                onClose={onClose}
                onRefresh={handleRefresh}
                onShare={onShare}
                onDownloadPDF={onDownloadPDF}
            />

            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-10 custom-scrollbar bg-transparent">
                <InsightsOverview candidate={candidate} />
                <RecommendationBanner candidate={candidate} />
                <AlignmentRadar candidate={candidate} />
                <IntelligenceTabs candidate={candidate} addToast={addToast} />
                <OutreachSection
                    candidate={candidate}
                    isOutreachUnlocked={isOutreachUnlocked}
                    onUnlock={handleUnlockOutreach}
                    onOpenOutreach={onOpenOutreach}
                />
            </div>
        </motion.div>
    );
};

export default DeepProfile;
