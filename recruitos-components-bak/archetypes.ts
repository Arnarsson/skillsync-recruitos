/**
 * Archetype utility functions for candidate profiling
 * Maps archetype names to icons and metadata
 */

export interface ArchetypeInfo {
  icon: string;
  emoji: string;
  shortName: string;
  color: string; // Tailwind color class
}

/**
 * Get archetype icon/emoji from archetype string
 * Handles both full archetype names and partial matches
 */
export function getArchetypeIcon(archetype?: string): string {
  if (!archetype) return '🎯';

  const lower = archetype.toLowerCase();

  if (lower.includes('scaler')) return '🚀';
  if (lower.includes('fixer')) return '🔧';
  if (lower.includes('expert')) return '📚';
  if (lower.includes('catalyst')) return '🤝';
  if (lower.includes('perfectionist') || lower.includes('operator')) return '⚙️';
  if (lower.includes('architect')) return '🏛️';
  if (lower.includes('revenue') || lower.includes('driver')) return '💰';
  if (lower.includes('champion') || lower.includes('user')) return '❤️';
  if (lower.includes('executor')) return '⚡';
  if (lower.includes('scientist') || lower.includes('data')) return '📊';
  if (lower.includes('generalist') || lower.includes('swiss')) return '🛠️';
  if (lower.includes('navigator') || lower.includes('enterprise')) return '🏢';

  return '🎯'; // Default
}

/**
 * Get full archetype information including color scheme
 */
export function getArchetypeInfo(archetype?: string): ArchetypeInfo {
  if (!archetype) {
    return {
      icon: '🎯',
      emoji: '🎯',
      shortName: 'Unknown',
      color: 'gray'
    };
  }

  const lower = archetype.toLowerCase();

  if (lower.includes('scaler')) {
    return {
      icon: '🚀',
      emoji: '🚀',
      shortName: 'Strategic Scaler',
      color: 'emerald'
    };
  }

  if (lower.includes('fixer')) {
    return {
      icon: '🔧',
      emoji: '🔧',
      shortName: 'Hands-On Fixer',
      color: 'blue'
    };
  }

  if (lower.includes('expert')) {
    return {
      icon: '📚',
      emoji: '📚',
      shortName: 'Domain Expert',
      color: 'purple'
    };
  }

  if (lower.includes('catalyst')) {
    return {
      icon: '🤝',
      emoji: '🤝',
      shortName: 'People Catalyst',
      color: 'pink'
    };
  }

  if (lower.includes('perfectionist') || lower.includes('operator')) {
    return {
      icon: '⚙️',
      emoji: '⚙️',
      shortName: 'Operator Perfectionist',
      color: 'slate'
    };
  }

  if (lower.includes('architect')) {
    return {
      icon: '🏛️',
      emoji: '🏛️',
      shortName: 'Visionary Architect',
      color: 'indigo'
    };
  }

  if (lower.includes('revenue') || lower.includes('driver')) {
    return {
      icon: '💰',
      emoji: '💰',
      shortName: 'Revenue Driver',
      color: 'amber'
    };
  }

  if (lower.includes('champion') || lower.includes('user')) {
    return {
      icon: '❤️',
      emoji: '❤️',
      shortName: 'User Champion',
      color: 'rose'
    };
  }

  if (lower.includes('executor')) {
    return {
      icon: '⚡',
      emoji: '⚡',
      shortName: 'Rapid Executor',
      color: 'yellow'
    };
  }

  if (lower.includes('scientist') || lower.includes('data')) {
    return {
      icon: '📊',
      emoji: '📊',
      shortName: 'Data Scientist',
      color: 'cyan'
    };
  }

  if (lower.includes('generalist') || lower.includes('swiss')) {
    return {
      icon: '🛠️',
      emoji: '🛠️',
      shortName: 'Generalist',
      color: 'teal'
    };
  }

  if (lower.includes('navigator') || lower.includes('enterprise')) {
    return {
      icon: '🏢',
      emoji: '🏢',
      shortName: 'Enterprise Navigator',
      color: 'gray'
    };
  }

  return {
    icon: '🎯',
    emoji: '🎯',
    shortName: 'Professional',
    color: 'gray'
  };
}

/**
 * Format salary band for display
 */
export function formatSalaryBand(band?: { min: number; max: number; currency: string }): string {
  if (!band) return 'Unknown';

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    return `${(num / 1000).toFixed(0)}k`;
  };

  const currency = band.currency === 'USD' ? '$' : band.currency === 'EUR' ? '€' : band.currency;

  return `${currency}${formatNumber(band.min)}-${formatNumber(band.max)}`;
}

/**
 * Calculate promotion frequency from average tenure
 */
export function calculatePromotionFrequency(averageTenure?: string): string {
  if (!averageTenure) return '?';

  // Extract number from string like "2.5 years"
  const match = averageTenure.match(/(\d+\.?\d*)/);
  if (!match) return '?';

  return match[1];
}

/**
 * Get risk level color class for Tailwind
 */
export function getRiskLevelColor(riskLevel?: string): string {
  if (!riskLevel) return 'text-gray-600';

  const lower = riskLevel.toLowerCase();

  if (lower === 'low') return 'text-green-600';
  if (lower === 'moderate') return 'text-amber-600';
  if (lower === 'high') return 'text-red-600';

  return 'text-gray-600';
}

/**
 * Get match level label and color based on alignment score
 */
export function getMatchLevel(score: number): { label: string; color: string; bgColor: string } {
  if (score >= 75) {
    return {
      label: 'STRONG MATCH',
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-100'
    };
  }

  if (score >= 50) {
    return {
      label: 'POTENTIAL',
      color: 'text-amber-700',
      bgColor: 'bg-amber-100'
    };
  }

  return {
    label: 'WEAK FIT',
    color: 'text-red-700',
    bgColor: 'bg-red-100'
  };
}
