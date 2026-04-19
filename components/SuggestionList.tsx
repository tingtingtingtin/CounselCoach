interface SuggestionListProps {
  suggestions: string[];
  loading: boolean;
  audioPlaying: boolean;
  onSelectSuggestion: (s: string) => void;
}

export function SuggestionList({
  suggestions,
  loading,
  audioPlaying,
  onSelectSuggestion,
}: SuggestionListProps) {
  if (suggestions.length === 0 || loading || audioPlaying) return null;

  return (
    <div className="mb-xs">
      <p className="text-xs font-semibold tracking-widest uppercase text-forest-light mb-xxs">
        Suggested responses
      </p>
      <div className="flex flex-col gap-xxs">
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => onSelectSuggestion(s)}
            className="px-xs py-xxs rounded-circle border border-forest-light text-forest-medium text-sm text-left cursor-pointer hover:bg-smoke-gray transition-colors"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
