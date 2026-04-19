import { createSpeechServicesPonyfill } from "web-speech-cognitive-services";
import SpeechRecognition from "react-speech-recognition";

export const setupSpeechPolyfill = () => {
  if (typeof window === "undefined") return;
  const supportsNative = !!(
    window.SpeechRecognition || window.webkitSpeechRecognition
  );

  if (!supportsNative) {
    // e.g Firefox
    try {
      const { SpeechRecognition: AzureSpeechRecognition } =
        createSpeechServicesPonyfill({
          credentials: {
            region: process.env.NEXT_PUBLIC_AZURE_REGION || "",
            subscriptionKey: process.env.NEXT_PUBLIC_AZURE_KEY || "",
          },
        });

      SpeechRecognition.applyPolyfill(AzureSpeechRecognition);
      console.log("Speech polyfill applied for this browser.");
    } catch (error) {
      console.error("Failed to initialize speech polyfill:", error);
    }
  }
};
