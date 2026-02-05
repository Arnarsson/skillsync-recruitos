"use client";

import { useState, useEffect } from "react";
import {
  ExperienceLevel,
  CompanySize,
  EducationType,
  AdvancedFiltersState,
  DEFAULT_ADVANCED_FILTERS,
  getExperienceLevelLabel,
  getCompanySizeLabel,
  getEducationTypeLabel,
} from "@/lib/advancedFilters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  X,
  Filter,
  RotateCcw,
} from "lucide-react";

interface AdvancedFiltersProps {
  onFiltersChange: (filters: Partial<AdvancedFiltersState>) => void;
  initialFilters?: Partial<AdvancedFiltersState>;
}

const EXPERIENCE_LEVELS: ExperienceLevel[] = ["junior", "mid", "senior", "staff"];
const COMPANY_SIZES: CompanySize[] = ["startup", "small", "medium", "large", "enterprise"];
const EDUCATION_TYPES: EducationType[] = ["degree", "bootcamp", "self-taught"];

export function AdvancedFilters({
  onFiltersChange,
  initialFilters = {},
}: AdvancedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<Partial<AdvancedFiltersState>>({
    ...DEFAULT_ADVANCED_FILTERS,
    ...initialFilters,
  });

  const [minFollowers, setMinFollowers] = useState<number>(
    filters.minFollowers || 0
  );
  const [maxFollowers, setMaxFollowers] = useState<number>(
    filters.maxFollowers || 10000
  );

  const handleExperienceLevelChange = (level: ExperienceLevel) => {
    const newLevels = filters.experienceLevels || [];
    const updated = newLevels.includes(level)
      ? newLevels.filter((l) => l !== level)
      : [...newLevels, level];

    const newFilters = { ...filters, experienceLevels: updated };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleCompanySizeChange = (size: CompanySize) => {
    const newSizes = filters.companySizes || [];
    const updated = newSizes.includes(size)
      ? newSizes.filter((s) => s !== size)
      : [...newSizes, size];

    const newFilters = { ...filters, companySizes: updated };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleEducationTypeChange = (type: EducationType) => {
    const newTypes = filters.educationTypes || [];
    const updated = newTypes.includes(type)
      ? newTypes.filter((t) => t !== type)
      : [...newTypes, type];

    const newFilters = { ...filters, educationTypes: updated };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleFollowersChange = (type: "min" | "max", value: number) => {
    if (type === "min") {
      setMinFollowers(value);
      const newFilters = { ...filters, minFollowers: value };
      setFilters(newFilters);
      onFiltersChange(newFilters);
    } else {
      setMaxFollowers(value);
      const newFilters = { ...filters, maxFollowers: value };
      setFilters(newFilters);
      onFiltersChange(newFilters);
    }
  };

  const handleReset = () => {
    const newFilters = { ...DEFAULT_ADVANCED_FILTERS };
    setFilters(newFilters);
    setMinFollowers(0);
    setMaxFollowers(10000);
    onFiltersChange(newFilters);
  };

  const hasActiveFilters =
    (filters.experienceLevels?.length || 0) > 0 ||
    (filters.companySizes?.length || 0) > 0 ||
    (filters.educationTypes?.length || 0) > 0 ||
    (filters.minFollowers || 0) > 0 ||
    (filters.maxFollowers || 0) < 10000;

  return (
    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-blue-400" />
            <CardTitle className="text-white">Advanced Filters</CardTitle>
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                Active
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-slate-300 hover:text-white"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-slate-300 hover:text-white"
            >
              {isExpanded ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="space-y-6 pt-0">
              {/* Experience Level Filter */}
              <div className="space-y-3">
                <Label className="text-slate-200 font-semibold">
                  Experience Level
                </Label>
                <div className="space-y-2">
                  {EXPERIENCE_LEVELS.map((level) => (
                    <div key={level} className="flex items-center space-x-2">
                      <Checkbox
                        id={`exp-${level}`}
                        checked={
                          filters.experienceLevels?.includes(level) || false
                        }
                        onCheckedChange={() =>
                          handleExperienceLevelChange(level)
                        }
                        className="border-slate-400"
                      />
                      <label
                        htmlFor={`exp-${level}`}
                        className="text-sm text-slate-300 cursor-pointer"
                      >
                        {getExperienceLevelLabel(level)}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Company Size Filter */}
              <div className="space-y-3">
                <Label className="text-slate-200 font-semibold">
                  Company Size
                </Label>
                <div className="space-y-2">
                  {COMPANY_SIZES.map((size) => (
                    <div key={size} className="flex items-center space-x-2">
                      <Checkbox
                        id={`size-${size}`}
                        checked={filters.companySizes?.includes(size) || false}
                        onCheckedChange={() => handleCompanySizeChange(size)}
                        className="border-slate-400"
                      />
                      <label
                        htmlFor={`size-${size}`}
                        className="text-sm text-slate-300 cursor-pointer"
                      >
                        {getCompanySizeLabel(size)}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Education Type Filter */}
              <div className="space-y-3">
                <Label className="text-slate-200 font-semibold">
                  Education Type
                </Label>
                <div className="space-y-2">
                  {EDUCATION_TYPES.map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edu-${type}`}
                        checked={
                          filters.educationTypes?.includes(type) || false
                        }
                        onCheckedChange={() =>
                          handleEducationTypeChange(type)
                        }
                        className="border-slate-400"
                      />
                      <label
                        htmlFor={`edu-${type}`}
                        className="text-sm text-slate-300 cursor-pointer"
                      >
                        {getEducationTypeLabel(type)}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Followers Range Filter */}
              <div className="space-y-3">
                <Label className="text-slate-200 font-semibold">
                  Followers Range
                </Label>
                <div className="space-y-2">
                  <div>
                    <div className="text-xs text-slate-400 mb-1">
                      Min: {minFollowers}
                    </div>
                    <Slider
                      value={[minFollowers]}
                      onValueChange={(value) =>
                        handleFollowersChange("min", value[0])
                      }
                      max={10000}
                      step={10}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-1">
                      Max: {maxFollowers}
                    </div>
                    <Slider
                      value={[maxFollowers]}
                      onValueChange={(value) =>
                        handleFollowersChange("max", value[0])
                      }
                      max={10000}
                      step={10}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
