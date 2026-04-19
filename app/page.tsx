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
import { OptionsRow } from "@/components/OptionsRow";

const defaultPersona = personas[0];
const defaultScenarioId = defaultPersona.recommendedScenario ?? scenarios[0].id;

export default function HomePage() {
  const router = useRouter();
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>(
    defaultPersona.id,
  );
  const [selectedScenarioId, setSelectedScenarioId] =
    useState<string>(defaultScenarioId);
  const [mode, setMode] = useState<"chat" | "call">("chat");
  const [inputMode, setInputMode] = useState<"text" | "voice">("text");
  const [volumeOn, setVolumeOn] = useState(true);

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
    const params = new URLSearchParams({
      scenarioId: selectedScenarioId,
      personaId: selectedPersonaId,
      mode,
      inputMode: mode === "call" ? "voice" : inputMode,
      volume: volumeOn ? "on" : "off",
    });
    router.push(`/session?${params.toString()}`);
  }

  return (
    <main className="w-full mx-auto font-sans bg-forest-medium">
      <HeroSection />

      <section
        id="patient-selector"
        className="flex flex-col gap-md pb-lg my-20 px-4 items-start bg-background rounded-2xl md:max-w-7xl mx-auto"
      >
        <h2 className="pt-md pl-xs text-xl text-forest-medium">
          Who will you be speaking to today?
        </h2>
        <div className="grid grid-cols-5 gap-lg">
          {/* Left — persona list + profile card */}
          <div className="col-span-2 px-4 flex flex-col">
            <PersonaList
              personas={personas}
              selectedPersonaId={selectedPersonaId}
              onSelectPersona={handleSelectPersona}
            />
            <PersonaProfileCard persona={selectedPersona} />
          </div>
          {/* Right — scenario selector + options row + CTA */}
          <div className="col-span-3 flex flex-col gap-sm px-2">
            <ScenarioSelector
              scenarios={scenarios}
              selectedPersona={selectedPersona}
              selectedScenarioId={selectedScenarioId}
              onSelectScenario={setSelectedScenarioId}
            />
            <OptionsRow
              mode={mode}
              onModeChange={setMode}
              inputMode={inputMode}
              onInputModeChange={setInputMode}
              volumeOn={volumeOn}
              onVolumeChange={setVolumeOn}
            />
            <StartSessionButton onClick={handleStart} />
          </div>
        </div>
      </section>
    </main>
  );
}
