"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { scenarios } from "@/lib/scenarios";
import { personas } from "@/lib/personas";

const defaultPersona = personas[0];
const defaultScenarioId = defaultPersona.recommendedScenario ?? scenarios[0].id;

export default function HomePage() {
  const router = useRouter();
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>(defaultPersona.id);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(defaultScenarioId);

  const selectedPersona = personas.find((p) => p.id === selectedPersonaId) ?? personas[0];

  function handleSelectPersona(personaId: string) {
    const persona = personas.find((p) => p.id === personaId)!;
    setSelectedPersonaId(personaId);
    if (persona.recommendedScenario) {
      setSelectedScenarioId(persona.recommendedScenario);
    }
  }

  function handleStart() {
    router.push(
      `/session?scenarioId=${selectedScenarioId}&personaId=${selectedPersonaId}`
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-sm py-xl font-sans">
      {/* Hero copy */}
      <div className="text-center">
        <h1 className="text-hero-heading font-normal text-forest-dark leading-tight">
          Practice before the session that matters.
        </h1>
        <p className="text-subheading font-normal text-forest-medium mt-xxs">
          Roleplay with an AI patient. Get real-time response suggestions.
          Review your approach after every session.
        </p>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-5 gap-lg mt-lg items-start">

        {/* Left — scrollable persona list */}
        <div className="col-span-2 border border-smoke-gray rounded-sm overflow-hidden overflow-y-auto max-h-[65vh]">
          {personas.map((persona) => (
            <button
              key={persona.id}
              onClick={() => handleSelectPersona(persona.id)}
              className={`w-full flex items-center gap-xs px-sm py-xs text-left transition-colors border-l-4 ${
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
            </button>
          ))}
        </div>

        {/* Right — profile card + scenario selector + CTA */}
        <div className="col-span-3 flex flex-col gap-sm">

          {/* Patient Profile Card */}
          <div className="bg-smoke-gray rounded-sm p-sm">
            <p className="text-small-text font-semibold text-forest-light uppercase tracking-widest mb-xxs">
              Patient
            </p>
            <p className="text-base font-semibold text-forest-dark">
              {selectedPersona.patientName}, {selectedPersona.age}
            </p>
            <p className="text-sm text-forest-medium mt-xxs leading-relaxed">
              {selectedPersona.background}
            </p>
            <blockquote className="mt-xs pl-xs border-l-4 border-forest-light">
              <p className="text-sm text-forest-medium italic leading-relaxed">
                {selectedPersona.presentingConcern}
              </p>
            </blockquote>
          </div>

          {/* Scenario Selector */}
          <div className="flex flex-col gap-xxs">
            {scenarios.map((scenario) => {
              const isRecommended =
                selectedPersona.recommendedScenario === scenario.id;
              const isSelected = selectedScenarioId === scenario.id;
              return (
                <button
                  key={scenario.id}
                  onClick={() => setSelectedScenarioId(scenario.id)}
                  className={`p-sm rounded-sm border text-left cursor-pointer transition-colors ${
                    isSelected
                      ? "border-forest-dark bg-white"
                      : "border-smoke-gray bg-white hover:border-forest-medium"
                  }`}
                >
                  <div className="flex items-start justify-between gap-xxs">
                    <p className="text-base font-semibold text-forest-dark">
                      {scenario.label}
                    </p>
                    {isRecommended && (
                      <span className="text-small-text font-semibold text-forest-dark bg-primary-yellow rounded-xs px-xxs shrink-0">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-forest-medium/70 mt-xxs leading-relaxed">
                    {scenario.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Start Session — full width */}
          <button
            onClick={handleStart}
            className="w-full py-xxs rounded-circle bg-primary-yellow text-forest-dark font-semibold text-base cursor-pointer hover:opacity-90 transition-opacity"
          >
            Start Session
          </button>
        </div>
      </div>
    </main>
  );
}
