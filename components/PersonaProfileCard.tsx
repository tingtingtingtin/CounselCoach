import type { Persona } from "@/lib/personas";

interface PersonaProfileCardProps {
  persona: Persona;
}

export function PersonaProfileCard({ persona }: PersonaProfileCardProps) {
  return (
    <div className="bg-smoke-gray p-sm rounded-b-sm">
      <p className="text-small-text font-semibold text-forest-light uppercase tracking-widest mb-xxs">
        Patient
      </p>
      <p className="text-base font-semibold text-forest-dark">
        {persona.patientName}, {persona.age}
      </p>
      <p className="text-sm text-forest-medium mt-xxs leading-relaxed">
        {persona.background}
      </p>
      <blockquote className="mt-xs pl-xs border-l-4 border-forest-light">
        <p className="text-sm text-forest-medium italic leading-relaxed">
          {persona.presentingConcern}
        </p>
      </blockquote>
    </div>
  );
}
