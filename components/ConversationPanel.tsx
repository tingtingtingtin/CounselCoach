import type { Turn } from "@/lib/types";
import type { MutableRefObject } from "react";

interface ConversationPanelProps {
  history: Turn[];
  loading: boolean;
  audioPlaying: boolean;
  firstName: string;
  bottomRef: MutableRefObject<HTMLDivElement | null>;
}

export function ConversationPanel({
  history,
  loading,
  audioPlaying,
  firstName,
  bottomRef,
}: ConversationPanelProps) {
  return (
    <div className="border border-smoke-gray rounded-sm p-sm min-h-80 max-h-[60vh] flex-1 overflow-y-auto mb-xs flex flex-col gap-xxs ">
      {history.length === 0 && !loading && (
        <p className="text-forest-light text-sm italic m-auto text-center">
          Starting session…
        </p>
      )}

      {history.map((turn, i) => (
        <div
          key={i}
          className={`flex ${
            turn.role === "trainee" ? "justify-end" : "justify-start"
          }`}
        >
          <div
            className={`max-w-3/4 px-xs py-xxs text-base leading-relaxed text-forest-dark rounded-sm ${
              turn.role === "trainee" ? "bg-primary-yellow" : "bg-smoke-gray"
            }`}
          >
            {turn.content}
          </div>
        </div>
      ))}

      {loading && (
        <p className="text-forest-light text-sm italic">
          {firstName} is thinking…
        </p>
      )}

      {audioPlaying && !loading && (
        <p className="text-forest-light text-sm italic">
          {firstName} is speaking…
        </p>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
