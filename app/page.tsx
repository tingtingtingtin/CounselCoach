import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-screen font-sans bg-white">
      <div className="flex flex-col items-center gap-sm text-center px-xs">
        <h1 className="text-4xl font-normal text-forest-dark tracking-tight">
          Practice before the session that matters.
        </h1>
        <p className="text-xl font-normal text-forest-medium">
          Roleplay with an AI patient. Get real-time response suggestions.
          Review your approach after every session.
        </p>
        <Link
          href="/session"
          className="mt-sm px-sm py-xxs rounded-circle bg-primary-yellow text-forest-dark font-semibold text-base no-underline hover:opacity-90 transition-opacity"
        >
          Start Session
        </Link>
      </div>
    </div>
  );
}
