"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { scenarios } from "@/lib/scenarios";
import { personas } from "@/lib/personas";
import { HeroSection } from "@/components/HeroSection";
import { PersonaList } from "@/components/PersonaList";
import { PersonaProfileCard } from "@/components/PersonaProfileCard";
import { ScenarioSelector } from "@/components/ScenarioSelector";
import { StartSessionButton } from "@/components/StartSessionButton";

const defaultPersona = personas[0];
const defaultScenarioId = defaultPersona.recommendedScenario ?? scenarios[0].id;

export default function HomePage() {
  const router = useRouter();
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>(
    defaultPersona.id,
  );
  const [selectedScenarioId, setSelectedScenarioId] =
    useState<string>(defaultScenarioId);

  const selectedPersona =
    personas.find((p) => p.id === selectedPersonaId) ?? personas[0];

  function handleSelectPersona(personaId: string) {
    const persona = personas.find((p) => p.id === personaId)!;
    setSelectedPersonaId(personaId);
    if (persona.recommendedScenario) {
      setSelectedScenarioId(persona.recommendedScenario);
    }
  }

  function handleStart() {
    router.push(
      `/session?scenarioId=${selectedScenarioId}&personaId=${selectedPersonaId}`,
    );
  }

  return (
    <main className="w-full mx-auto font-sans bg-forest-medium">
      <HeroSection />

      <div
        id="patient-selector"
        className="grid grid-cols-5 gap-lg py-lg my-20 px-4 items-start bg-background rounded-2xl md:max-w-7xl mx-auto"
      >
        {/* Left — scrollable persona list */}
        <div className="col-span-2 px-4">
          <PersonaList
            personas={personas}
            selectedPersonaId={selectedPersonaId}
            onSelectPersona={handleSelectPersona}
          />
        </div>

        {/* Right — profile card + scenario selector + CTA */}
        <div className="col-span-3 flex flex-col gap-sm px-2">
          <PersonaProfileCard persona={selectedPersona} />
          <ScenarioSelector
            scenarios={scenarios}
            selectedPersona={selectedPersona}
            selectedScenarioId={selectedScenarioId}
            onSelectScenario={setSelectedScenarioId}
          />
          <StartSessionButton onClick={handleStart} />
        </div>
      </div>
    </main>
  );
}
