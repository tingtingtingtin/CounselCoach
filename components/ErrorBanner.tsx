interface ErrorBannerProps {
  error: string;
  onRetry: () => void;
}

export function ErrorBanner({ error, onRetry }: ErrorBannerProps) {
  if (!error) return null;

  return (
    <div className="flex items-center gap-xs px-xs py-xxs rounded-xs text-forest-dark text-sm bg-clay-red">
      <span className="flex-1">{error}</span>
      <button
        onClick={onRetry}
        className="font-semibold underline cursor-pointer"
      >
        Retry
      </button>
    </div>
  );
}
