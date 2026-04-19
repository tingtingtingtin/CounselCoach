interface PatientAvatarProps {
  avatarInitials: string;
  patientName: string;
  age: number;
  scenarioLabel: string;
  audioPlaying: boolean;
  loading: boolean;
}

export function PatientAvatar({
  avatarInitials,
  patientName,
  age,
  scenarioLabel,
  audioPlaying,
  loading,
}: PatientAvatarProps) {
  return (
    <div className="mb-sm flex items-center gap-xs">
      <div className="relative shrink-0">
        {audioPlaying && (
          <div className="absolute inset-0 rounded-circle border-2 border-forest-dark animate-pulse" />
        )}
        <div
          className={`w-10 h-10 rounded-circle bg-smoke-gray flex items-center justify-center text-forest-medium font-semibold text-sm transition-opacity duration-300 ${
            loading ? "opacity-40" : "opacity-100"
          }`}
        >
          {avatarInitials}
        </div>
      </div>
      <div>
        <p className="text-base font-medium text-forest-dark leading-tight">
          {patientName}
        </p>
        <p className="text-sm text-forest-medium">
          {age} · {scenarioLabel}
        </p>
      </div>
    </div>
  );
}
