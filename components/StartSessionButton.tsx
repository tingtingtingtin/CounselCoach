interface StartSessionButtonProps {
  onClick: () => void;
}

export function StartSessionButton({ onClick }: StartSessionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-full py-xxs rounded-circle bg-primary-yellow text-forest-dark font-semibold text-base cursor-pointer hover:opacity-90 transition-opacity"
    >
      Start Session
    </button>
  );
}
