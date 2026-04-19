import { motion } from "motion/react";
import type { Persona } from "@/lib/personas";

interface PersonaProfileCardProps {
  persona: Persona;
}

export function PersonaProfileCard({ persona }: PersonaProfileCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="bg-smoke-gray p-sm rounded-b-sm flex flex-col"
    >
      <p className="text-small-text font-semibold text-forest-light uppercase tracking-widest mb-xxs h-4">
        Patient
      </p>
      <p className="text-base font-semibold text-forest-dark h-6">
        {persona.patientName}, {persona.age}
      </p>
      <p className="text-sm text-forest-medium mt-xxs leading-relaxed line-clamp-2 min-h-9">
        {persona.background}
      </p>
      <blockquote className="mt-xs pl-xs border-l-4 border-forest-light">
        <p className="text-sm text-forest-medium italic leading-relaxed line-clamp-2">
          {persona.presentingConcern}
        </p>
      </blockquote>
    </motion.div>
  );
}
