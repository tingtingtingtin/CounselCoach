import { motion } from "motion/react";
import type { Persona } from "@/lib/personas";

interface PersonaListProps {
  personas: Persona[];
  selectedPersonaId: string;
  onSelectPersona: (id: string) => void;
}

export function PersonaList({
  personas,
  selectedPersonaId,
  onSelectPersona,
}: PersonaListProps) {
  return (
    <>
      <p className="text-small-text font-semibold text-forest-light uppercase tracking-widest mb-sm">
        Choose a Patient
      </p>
      <div className="border border-smoke-gray rounded-t-sm overflow-hidden overflow-y-auto max-h-[35vh]">
        {personas.map((persona, index) => (
          <motion.button
            key={persona.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.3,
              delay: index * 0.05,
              ease: [0.22, 1, 0.36, 1],
            }}
            whileHover={{ x: 4 }}
            onClick={() => onSelectPersona(persona.id)}
            className={`w-full flex items-center gap-xs px-sm py-xs text-left transition-colors border-l-4 hover:cursor-pointer ${
              selectedPersonaId === persona.id
                ? "border-l-forest-dark bg-forest-dark/5"
                : "border-l-transparent hover:bg-smoke-gray"
            }`}
          >
            <div className="w-8 h-8 rounded-circle bg-smoke-gray flex items-center justify-center text-forest-medium font-semibold text-xs shrink-0">
              {persona.avatarInitials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-xxs">
                <p className="text-sm font-semibold text-forest-dark truncate">
                  {persona.patientName}, {persona.age}
                </p>
                {persona.premium && (
                  <span className="text-xs text-forest-light shrink-0">
                    Premium
                  </span>
                )}
              </div>
              <p className="text-xs text-forest-light truncate mt-0.5">
                {persona.affect}
              </p>
            </div>
          </motion.button>
        ))}
      </div>
    </>
  );
}
