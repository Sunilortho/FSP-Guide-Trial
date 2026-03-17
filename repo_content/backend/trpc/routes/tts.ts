import * as z from "zod";

import { createTRPCRouter, publicProcedure } from "../create-context";

// Female: Bella (multilingual premade, English-trained) as primary with German-optimized settings.
// NOTE: To use the actual Germany-German "Sarah" voice, run:
//   curl https://api.elevenlabs.io/v1/voices -H "xi-api-key: $KEY" | jq '.voices[] | select(.name=="Sarah") | .voice_id'
// Then replace Bella's ID below with Sarah's ID.
const ELEVENLABS_VOICES = {
  female: [
    { id: 'jsCqWAovK2zikigpJZZa', name: 'Freya', lang: 'multilingual' },
    { id: 'jBpfuIE2acCO8z3wKNLl', name: 'Gigi', lang: 'multilingual' },
    { id: 'XrExE9yKIg1WjnnlVkGX', name: 'Matilda', lang: 'multilingual' },
  ],
  male: [
    { id: 'N2lVS1w4EtoT3dr4eOWO', name: 'Callum', lang: 'multilingual' },
    { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie', lang: 'multilingual' },
    { id: 'D38z5RcWu1voky8WS1ja', name: 'Fin', lang: 'multilingual' },
  ],
};

// Tuned for clear, natural German speech with eleven_multilingual_v2
const VOICE_SETTINGS = {
  female: { stability: 0.50, similarity_boost: 0.75, style: 0.15, use_speaker_boost: true },
  male:   { stability: 0.55, similarity_boost: 0.75, style: 0.12, use_speaker_boost: true },
};

const TTS_TIMEOUT_MS = 12_000;
const OUTPUT_FORMAT = 'mp3_44100_192';

export const ttsRouter = createTRPCRouter({
  speakElevenLabs: publicProcedure
    .input(
      z.object({
        text: z.string().min(1).max(5000),
        gender: z.enum(["female", "male"]),
        voiceIndex: z.number().min(0).max(2).optional().default(0),
      })
    )
    .mutation(async ({ input }: { input: { text: string; gender: 'female' | 'male'; voiceIndex: number } }) => {
      const t0 = Date.now();
      const apiKey = process.env.ELEVENLABS_API_KEY || '';
      if (!apiKey) {
        console.error('[TTS] ELEVENLABS_API_KEY not set');
        throw new Error('elevenlabs_api_key_not_configured');
      }

      const voices = ELEVENLABS_VOICES[input.gender];
      const voice = voices[input.voiceIndex % voices.length];
      const settings = VOICE_SETTINGS[input.gender];

      console.log(`[TTS] START | ${input.gender} | ${voice.name}(${voice.lang}) | chars=${input.text.length}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.error(`[TTS] TIMEOUT after ${TTS_TIMEOUT_MS}ms`);
      }, TTS_TIMEOUT_MS);

      try {
        const response = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${voice.id}?output_format=${OUTPUT_FORMAT}`,
          {
            method: 'POST',
            headers: {
              'Accept': 'audio/mpeg',
              'Content-Type': 'application/json',
              'xi-api-key': apiKey,
            },
            body: JSON.stringify({
              text: input.text,
              model_id: 'eleven_multilingual_v2',
              voice_settings: settings,
            }),
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);
        const ttfb = Date.now() - t0;

        if (!response.ok) {
          const body = await response.text().catch(() => '');
          const reason = response.status === 401 ? 'api_key_invalid' :
                         response.status === 403 ? 'forbidden_or_quota' :
                         response.status === 429 ? 'rate_limited' :
                         `http_${response.status}`;
          console.error(`[TTS] FAIL | ${reason} | status=${response.status} | body=${body.slice(0, 200)}`);
          throw new Error(`elevenlabs_${reason}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const base64Audio = Buffer.from(arrayBuffer).toString("base64");
        const total = Date.now() - t0;

        console.log(`[TTS] DONE | ${voice.name} | ${OUTPUT_FORMAT} | bytes=${base64Audio.length} | ttfb=${ttfb}ms | total=${total}ms`);

        return {
          audio: base64Audio,
          mimeType: "audio/mpeg",
          voice: voice.name,
        };
      } catch (error) {
        clearTimeout(timeoutId);
        if ((error as Error).name === 'AbortError') {
          console.error('[TTS] FAIL | timeout');
          throw new Error('elevenlabs_timeout');
        }
        if (error instanceof Error && error.message.startsWith('elevenlabs_')) throw error;
        console.error("[TTS] FAIL | unexpected:", error);
        throw new Error("elevenlabs_unknown_error");
      }
    }),
});
