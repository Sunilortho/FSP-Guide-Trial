import { GoogleGenAI, Modality } from '@google/genai';
import fs from 'fs';
import path from 'path';

async function test() {
  const envPath = path.join(process.cwd(), '.env');
  let apiKey = '';
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/NEXT_PUBLIC_GEMINI_API_KEY=(.*)/);
    if (match) apiKey = match[1].trim().replace(/^["']|["']$/g, '').split('--')[0].trim();
  }
  
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
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
  console.log('Text:', response.text);
  console.log('Audio:', response.candidates?.[0]?.content?.parts?.[0]?.inlineData ? 'SUCCESS' : 'NO AUDIO');
}
test().catch(console.error);
