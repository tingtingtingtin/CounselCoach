import type { Scenario } from "@/lib/types";
import type { Persona } from "@/lib/personas";

interface ScenarioSelectorProps {
  scenarios: Scenario[];
  selectedPersona: Persona;
  selectedScenarioId: string;
  onSelectScenario: (id: string) => void;
}

export function ScenarioSelector({
  scenarios,
  selectedPersona,
  selectedScenarioId,
  onSelectScenario,
}: ScenarioSelectorProps) {
  return (
    <div>
      <p className="text-small-text font-semibold text-forest-light uppercase tracking-widest mb-sm">
        Choose a Scenario
      </p>
      <div className="flex flex-col gap-xxs">
        {scenarios.map((scenario) => {
          const isRecommended =
            selectedPersona.recommendedScenario === scenario.id;
          const isSelected = selectedScenarioId === scenario.id;
          return (
            <button
              key={scenario.id}
              onClick={() => onSelectScenario(scenario.id)}
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
    </div>
  );
}
