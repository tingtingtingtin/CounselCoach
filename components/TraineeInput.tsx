interface TraineeInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  audioPlaying: boolean;
}

export function TraineeInput({
  input,
  onInputChange,
  onSubmit,
  loading,
  audioPlaying,
}: TraineeInputProps) {
  const disabled = loading || audioPlaying;

  return (
    <form onSubmit={onSubmit} className="flex gap-xxs items-center">
      <input
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        disabled={disabled}
        placeholder={
          loading
            ? "Wait for patient…"
            : audioPlaying
              ? "Listening…"
              : "Your response…"
        }
        className={`flex-1 px-sm py-xxs rounded-circle border border-forest-light text-base text-forest-dark outline-none font-sans transition-colors ${
          disabled ? "bg-smoke-gray opacity-60" : "bg-white"
        }`}
      />
      <button
        type="submit"
        disabled={disabled || !input.trim()}
        className={`px-sm py-xxs rounded-circle bg-primary-yellow border-none text-forest-dark font-semibold text-base font-sans whitespace-nowrap transition-opacity ${
          disabled || !input.trim()
            ? "opacity-45 cursor-not-allowed"
            : "cursor-pointer"
        }`}
      >
        Send
      </button>
    </form>
  );
}
