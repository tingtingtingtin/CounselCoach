import { motion } from "motion/react";
import type { Persona } from "@/lib/personas";
import type { Scenario } from "@/lib/types";

interface PreSessionScreenProps {
  persona: Persona;
  scenario: Scenario;
  onBegin: () => void;
}

export function PreSessionScreen({
  persona,
  scenario,
  onBegin,
}: PreSessionScreenProps) {
  return (
    <div className="max-w-3xl mx-auto px-xs py-md flex flex-col my-24 font-sans items-center justify-center gap-xs text-center min-h-150">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-20 h-20 rounded-circle bg-linear-to-br from-smoke-gray to-white flex items-center justify-center text-forest-dark font-semibold text-2xl shadow-sm"
      >
        {persona.avatarInitials}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="text-2xl font-semibold text-forest-dark">
          {persona.patientName}
        </p>
        <p className="text-sm text-forest-medium mt-xxxs">
          {persona.age} · {scenario.label}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="mt-lg max-w-64"
      >
        <p className="text-small-text font-semibold text-forest-light uppercase tracking-widest mb-xs">
          Presenting Concern
        </p>
        <blockquote className="pl-xs border-l-4 border-forest-light rounded-xs bg-white/50 py-sm px-xs">
          <p className="text-sm text-forest-medium italic leading-relaxed">
            {persona.presentingConcern}
          </p>
        </blockquote>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onBegin}
        className="mt-lg px-sm py-xxs rounded-circle bg-primary-yellow text-forest-dark font-semibold text-base cursor-pointer hover:opacity-90 transition-opacity border-none shadow-sm"
      >
        Begin Session
      </motion.button>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="text-xs text-forest-light mt-lg"
      >
        Take a moment to review the patient details before starting.
      </motion.p>
    </div>
  );
}
