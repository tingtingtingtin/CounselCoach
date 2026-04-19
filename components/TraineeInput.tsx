"use client";

import { useEffect, useRef } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { Mic, Keyboard } from "lucide-react";

const SILENCE_DELAY_MS = 1500;

interface TraineeInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onAutoSubmit: (text: string) => void;
  loading: boolean;
  audioPlaying: boolean;
  inputMode: "text" | "voice";
  onInputModeChange: (mode: "text" | "voice") => void;
}

export function TraineeInput({
  input,
  onInputChange,
  onSubmit,
  onAutoSubmit,
  loading,
  audioPlaying,
  inputMode,
  onInputModeChange,
}: TraineeInputProps) {
  const {
    transcript,
    listening,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
    resetTranscript,
  } = useSpeechRecognition();

  const disabled = loading || audioPlaying;
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingTranscriptRef = useRef<string>("");

  // Auto-switch to text mode if microphone becomes unavailable
  useEffect(() => {
    if (inputMode === "voice" && !isMicrophoneAvailable) {
      onInputModeChange("text");
    }
  }, [isMicrophoneAvailable, inputMode, onInputModeChange]);

  // Start continuous listening when in voice mode and not blocked
  useEffect(() => {
    if (!browserSupportsSpeechRecognition || !isMicrophoneAvailable) return;

    if (inputMode === "voice" && !audioPlaying && !loading && !listening) {
      resetTranscript();
      pendingTranscriptRef.current = "";
      SpeechRecognition.startListening({ language: "en-US", continuous: true });
    }

    if (inputMode === "text" && listening) {
      SpeechRecognition.stopListening();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    }
  }, [
    inputMode,
    audioPlaying,
    loading,
    listening,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
    resetTranscript,
  ]);

  // Sync transcript to input and reset silence timer on each new word
  useEffect(() => {
    if (inputMode !== "voice" || !listening) return;
    if (!transcript) return;

    onInputChange(transcript);
    pendingTranscriptRef.current = transcript;

    // Reset the silence timer on every transcript update
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

    silenceTimerRef.current = setTimeout(() => {
      SpeechRecognition.stopListening();
      const text = pendingTranscriptRef.current.trim();
      if (text) {
        onAutoSubmit(text);
        resetTranscript();
        pendingTranscriptRef.current = "";
      }
    }, SILENCE_DELAY_MS);

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, [
    transcript,
    inputMode,
    listening,
    onInputChange,
    onAutoSubmit,
    resetTranscript,
  ]);

  return (
    <form onSubmit={onSubmit} className="flex gap-xxs items-center">
      <input
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        disabled={disabled || inputMode === "voice"}
        placeholder={
          loading
            ? "Wait for patient…"
            : audioPlaying
              ? "Listening…"
              : inputMode === "voice"
                ? listening
                  ? "Listening… speak now"
                  : "Voice mode… waiting…"
                : "Your response…"
        }
        className={`flex-1 px-sm py-xxs rounded-circle border border-forest-light text-base text-forest-dark outline-none font-sans transition-colors ${
          disabled || inputMode === "voice"
            ? "bg-smoke-gray opacity-60"
            : "bg-white"
        }`}
      />

      {browserSupportsSpeechRecognition && isMicrophoneAvailable && (
        <button
          type="button"
          onClick={() =>
            onInputModeChange(inputMode === "text" ? "voice" : "text")
          }
          title={
            inputMode === "voice"
              ? "Switch to text input"
              : "Switch to voice input"
          }
          className={`flex items-center justify-center w-10 h-10 rounded-circle border transition-colors ${
            inputMode === "voice"
              ? "bg-forest-dark border-forest-dark text-white"
              : "bg-white border-forest-light text-forest-medium hover:border-forest-dark"
          } ${listening ? "animate-pulse" : ""}`}
        >
          {inputMode === "voice" ? <Keyboard /> : <Mic />}
        </button>
      )}

      <button
        type="submit"
        disabled={disabled || !input.trim() || inputMode === "voice"}
        className={`px-sm py-xxs rounded-circle bg-primary-yellow border-none text-forest-dark font-semibold text-base font-sans whitespace-nowrap transition-opacity ${
          disabled || !input.trim() || inputMode === "voice"
            ? "opacity-45 cursor-not-allowed"
            : "cursor-pointer"
        }`}
      >
        Send
      </button>
    </form>
  );
}
