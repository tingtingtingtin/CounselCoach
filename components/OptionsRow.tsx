import {
  MessageCircle,
  Phone,
  Mic,
  Keyboard,
  Volume2,
  VolumeX,
} from "lucide-react";

interface OptionsRowProps {
  mode: "chat" | "call";
  onModeChange: (mode: "chat" | "call") => void;
  inputMode: "text" | "voice";
  onInputModeChange: (mode: "text" | "voice") => void;
  volumeOn: boolean;
  onVolumeChange: (on: boolean) => void;
}

export function OptionsRow({
  mode,
  onModeChange,
  inputMode,
  onInputModeChange,
  volumeOn,
  onVolumeChange,
}: OptionsRowProps) {
  return (
    <div className="flex items-end gap-xxs">
      {/* Practice Mode — pill toggles */}
      <div className="flex flex-col gap-xxxs">
        <p className="text-xs font-semibold uppercase tracking-widest text-forest-light">
          Practice Mode
        </p>
        <div className="flex rounded-circle border border-forest-light overflow-hidden">
          {(["chat", "call"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onModeChange(m)}
              className={`px-sm py-xxxs text-sm font-medium cursor-pointer border-none transition-colors inline-flex items-center gap-xxxs ${
                mode === m
                  ? "bg-forest-dark text-white"
                  : "bg-transparent text-forest-medium hover:bg-smoke-gray"
              }`}
            >
              {m === "chat" ? <MessageCircle size={14} /> : <Phone size={14} />}
              {m === "chat" ? "Chat" : "Call"}
            </button>
          ))}
        </div>
      </div>

      {/* Session Options — icon toggles, chat mode only */}
      {mode === "chat" && (
        <div className="flex items-center gap-xxxs">
          <button
            type="button"
            onClick={() =>
              onInputModeChange(inputMode === "text" ? "voice" : "text")
            }
            title={
              inputMode === "text"
                ? "Switch to voice input"
                : "Switch to text input"
            }
            className="p-xxs rounded-sm border border-forest-light/40 text-forest-medium hover:text-forest-dark hover:border-forest-light transition-colors cursor-pointer bg-transparent"
          >
            {inputMode === "voice" ? <Mic size={14} /> : <Keyboard size={14} />}
          </button>
          <button
            type="button"
            onClick={() => onVolumeChange(!volumeOn)}
            title={volumeOn ? "Mute patient audio" : "Unmute patient audio"}
            className="p-xxs rounded-sm border border-forest-light/40 text-forest-medium hover:text-forest-dark hover:border-forest-light transition-colors cursor-pointer bg-transparent"
          >
            {volumeOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>
      )}
    </div>
  );
}
