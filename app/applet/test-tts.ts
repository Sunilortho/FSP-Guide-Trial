import { GoogleGenAI, Modality } from '@google/genai';

async function test() {
  const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-preview-tts',
    contents: [{ role: 'user', parts: [{ text: 'Hallo, wie geht es Ihnen?' }] }],
    config: {
      systemInstruction: 'You are a patient named Herr Schmidt. Respond in German.',
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Puck' },
        },
      },
    },
  });
  console.log(response.candidates?.[0]?.content?.parts?.[0]?.inlineData ? 'SUCCESS' : 'NO AUDIO');
}
test().catch(console.error);
