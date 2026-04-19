interface ModeSelectorProps {
  selectedMode: "chat" | "call";
  onSelectMode: (mode: "chat" | "call") => void;
}

const MODES: { id: "chat" | "call"; label: string; description: string }[] = [
  {
    id: "chat",
    label: "Chat",
    description: "Conversation with text transcript and response suggestions",
  },
  {
    id: "call",
    label: "Call",
    description: "Voice only. No transcript. Closer to a real session.",
  },
];

export function ModeSelector({
  selectedMode,
  onSelectMode,
}: ModeSelectorProps) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-forest-light mb-xs">
        Practice Mode
      </p>
      <div className="flex gap-xs">
        {MODES.map((mode) => (
          <button
            key={mode.id}
            type="button"
            onClick={() => onSelectMode(mode.id)}
            className={`flex-1 p-xs rounded-sm border text-left cursor-pointer transition-colors bg-transparent ${
              selectedMode === mode.id
                ? "border-forest-dark"
                : "border-forest-light hover:border-forest-dark"
            }`}
          >
            <p className="text-sm font-semibold text-forest-dark">
              {mode.label}
            </p>
            <p className="text-xs text-forest-medium mt-xxxs leading-relaxed">
              {mode.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
