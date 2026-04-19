interface PatientAvatarProps {
  avatarInitials: string;
  patientName: string;
  age: number;
  scenarioLabel: string;
  audioPlaying: boolean;
  loading: boolean;
  callMode?: boolean;
}

export function PatientAvatar({
  avatarInitials,
  patientName,
  age,
  scenarioLabel,
  audioPlaying,
  loading,
  callMode = false,
}: PatientAvatarProps) {
  if (callMode) {
    return (
      <div className="flex flex-col items-center gap-md">
        <div className="relative flex items-center justify-center">
          {audioPlaying && (
            <div className="absolute -inset-5 rounded-circle border-2 border-white/30 animate-pulse" />
          )}
          <div
            className={`w-36 h-36 rounded-circle bg-white/10 flex items-center justify-center text-white font-semibold text-4xl transition-opacity duration-300 ${
              loading ? "opacity-40" : "opacity-100"
            }`}
          >
            {avatarInitials}
          </div>
        </div>
        <div className="text-center">
          <p className="text-2xl font-medium text-white leading-tight">
            {patientName}
          </p>
          <p className="text-base text-white/60 mt-xxxs">
            {age} · {scenarioLabel}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-sm flex items-center gap-xs">
      <div className="relative shrink-0">
        {audioPlaying && (
          <div className="absolute inset-0 rounded-circle border-4 border-forest-dark animate-pulse" />
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
