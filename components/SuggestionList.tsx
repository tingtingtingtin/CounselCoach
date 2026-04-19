"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { motion } from "motion/react";

interface SuggestionListProps {
  suggestions: string[];
  loading: boolean;
  audioPlaying: boolean;
  onSelectSuggestion: (s: string) => void;
}

const SKELETON_COUNT = 3;

export function SuggestionList({
  suggestions,
  loading,
  audioPlaying,
  onSelectSuggestion,
}: SuggestionListProps) {
  const [visible, setVisible] = useState(true);
  const disabled = loading || audioPlaying;
  const showSkeletons = disabled && visible;
  const hasSuggestions = suggestions.length > 0;

  return (
    <div>
      <div className="flex items-center justify-left gap-xs mb-xxs">
        <p className="text-xs font-semibold tracking-widest uppercase text-forest-light">
          Suggested responses
        </p>
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={
            visible ? "Hide suggested responses" : "Show suggested responses"
          }
          className="hover:cursor-pointer flex items-center justify-center w-8 h-8 rounded-circle text-forest-medium hover:border-forest-dark hover:text-forest-dark transition-colors"
        >
          {visible ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
      </div>

      <motion.div
        initial={false}
        animate={visible ? "open" : "closed"}
        variants={{
          open: { height: "auto", opacity: 1, marginTop: 0 },
          closed: { height: 0, opacity: 0, marginTop: 0 },
        }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden"
      >
        <div className="flex flex-col gap-xxs">
          {showSkeletons
            ? Array.from({ length: SKELETON_COUNT }).map((_, index) => (
                <div
                  key={index}
                  className="h-9 rounded-circle border border-forest-light bg-smoke-gray/50 animate-pulse"
                />
              ))
            : hasSuggestions
              ? suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => onSelectSuggestion(s)}
                    className="px-xs py-xxs rounded-circle border border-forest-light text-forest-medium text-sm text-left cursor-pointer hover:bg-smoke-gray transition-colors"
                  >
                    {s}
                  </button>
                ))
              : !disabled && (
                  <p className="text-sm text-forest-light italic">
                    No suggestions yet.
                  </p>
                )}
        </div>
      </motion.div>
    </div>
  );
}
