"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
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
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>(
    defaultPersona.id,
  );
  const [selectedScenarioId, setSelectedScenarioId] =
    useState<string>(defaultScenarioId);
  const [mode, setMode] = useState<"chat" | "call">("chat");
  const [inputMode, setInputMode] = useState<"text" | "voice">("text");
  const [volumeOn, setVolumeOn] = useState(true);

  // Hide skeleton after brief delay (visual polish on initial load)
  useEffect(() => {
    const timer = setTimeout(() => setShowSkeleton(false), 150);
    return () => clearTimeout(timer);
  }, []);

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

      {showSkeleton ? (
        // Skeleton loader
        <section className="flex flex-col gap-md pb-lg my-20 px-4 items-start bg-background rounded-2xl md:max-w-7xl mx-auto">
          <h2 className="pt-md pl-xs text-xl text-forest-medium">
            Who will you be speaking to today?
          </h2>
          <div className="grid grid-cols-5 gap-lg w-full">
            {/* Left skeleton */}
            <div className="col-span-2 px-4 flex flex-col gap-md">
              <div className="border border-smoke-gray rounded-t-sm overflow-hidden">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="w-full flex items-center gap-xs px-sm py-xs border-l-4 border-l-transparent"
                  >
                    <div className="w-8 h-8 rounded-circle bg-smoke-gray animate-pulse shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-smoke-gray rounded animate-pulse w-3/4" />
                      <div className="h-3 bg-smoke-gray rounded animate-pulse w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-smoke-gray rounded-sm p-sm space-y-3 animate-pulse">
                <div className="h-6 bg-white/50 rounded w-2/3" />
                <div className="h-4 bg-white/50 rounded" />
                <div className="h-4 bg-white/50 rounded w-5/6" />
              </div>
            </div>
            {/* Right skeleton */}
            <div className="col-span-3 flex flex-col gap-sm px-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="p-sm border border-smoke-gray rounded-sm bg-white animate-pulse"
                >
                  <div className="h-5 bg-smoke-gray rounded w-1/3 mb-2" />
                  <div className="h-4 bg-smoke-gray rounded" />
                </div>
              ))}
              <div className="px-sm py-xxs rounded-circle bg-smoke-gray h-10 w-full animate-pulse mt-md" />
            </div>
          </div>
        </section>
      ) : (
        // Interactive content
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
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
        </motion.section>
      )}
    </main>
  );
}
