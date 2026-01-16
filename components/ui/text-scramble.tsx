"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

interface TextScrambleProps {
  text: string;
  className?: string;
  speed?: number;
  scrambleSpeed?: number;
  characterSet?: string;
  onComplete?: () => void;
}

const DEFAULT_CHARACTER_SET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";

export function TextScramble({
  text,
  className,
  speed = 50,
  scrambleSpeed = 30,
  characterSet = DEFAULT_CHARACTER_SET,
  onComplete,
}: TextScrambleProps) {
  const [displayText, setDisplayText] = useState(text);
  const [isScrambling, setIsScrambling] = useState(false);
  const frameRef = useRef<number | null>(null);
  const prevTextRef = useRef(text);

  const scramble = useCallback(
    (targetText: string) => {
      setIsScrambling(true);
      const length = targetText.length;
      let iteration = 0;

      const animate = () => {
        const result = targetText
          .split("")
          .map((char, index) => {
            if (char === " ") return " ";
            if (index < iteration) {
              return targetText[index];
            }
            return characterSet[Math.floor(Math.random() * characterSet.length)];
          })
          .join("");

        setDisplayText(result);

        if (iteration >= length) {
          setIsScrambling(false);
          onComplete?.();
          return;
        }

        iteration += 1 / 3;
        frameRef.current = window.setTimeout(animate, scrambleSpeed);
      };

      animate();
    },
    [characterSet, scrambleSpeed, onComplete]
  );

  useEffect(() => {
    if (prevTextRef.current !== text) {
      prevTextRef.current = text;
      scramble(text);
    }
  }, [text, scramble]);

  useEffect(() => {
    return () => {
      if (frameRef.current) {
        clearTimeout(frameRef.current);
      }
    };
  }, []);

  return (
    <span className={cn("font-mono", className)}>
      {displayText}
    </span>
  );
}

interface LoadingScrambleProps {
  phases: string[];
  interval?: number;
  className?: string;
}

export function LoadingScramble({
  phases,
  interval = 2000,
  className,
}: LoadingScrambleProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % phases.length);
    }, interval);

    return () => clearInterval(timer);
  }, [phases.length, interval]);

  return (
    <TextScramble
      text={phases[currentIndex]}
      className={className}
      scrambleSpeed={25}
    />
  );
}
