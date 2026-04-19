interface ErrorBannerProps {
  error: string;
  onRetry: () => void;
}

export function ErrorBanner({ error, onRetry }: ErrorBannerProps) {
  return (
    <div className="flex items-center gap-xs px-xs py-xxs rounded-xs bg-clay-red text-forest-dark text-sm mb-xxs">
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
