import { use } from "react";
import { SessionContainer } from "./SessionContainer";

export default function SessionPage({
  searchParams,
}: {
  searchParams: Promise<{
    personaId?: string;
    scenarioId?: string;
    mode?: string;
    inputMode?: string;
    volume?: string;
  }>;
}) {
  const params = use(searchParams);
  const mode = params.mode === "call" ? "call" : "chat";
  const initialInputMode = params.inputMode === "voice" ? "voice" : "text";
  const volumeOn = params.volume !== "off";

  return (
    <SessionContainer
      personaId={params.personaId ?? ""}
      scenarioId={params.scenarioId ?? ""}
      mode={mode}
      initialInputMode={initialInputMode}
      volumeOn={volumeOn}
    />
  );
}
