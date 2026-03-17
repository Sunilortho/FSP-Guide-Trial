import { NextResponse } from 'next/server';
import { GoogleGenAI, Modality } from '@google/genai';

export async function GET(req: Request) {
  try {
    let apiKey = process.env.MY_CUSTOM_GEMINI_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (apiKey) apiKey = apiKey.trim().replace(/^["']|["']$/g, '').split('--')[0].trim();
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: [{ role: 'user', parts: [{ text: 'Hallo, wie geht es Ihnen?' }] }],
      config: {
        systemInstruction: 'You are a patient named Herr Schmidt. Respond in German.',
        responseModalities: [Modality.TEXT, Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Puck' },
          },
        },
      },
    });

    const audioBase64 = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
    const textPart = response.candidates?.[0]?.content?.parts?.find(p => p.text)?.text;

    return NextResponse.json({
      text: textPart || response.text || 'NO TEXT',
      hasAudio: !!audioBase64,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
