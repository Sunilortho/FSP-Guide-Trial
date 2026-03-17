import { NextResponse } from 'next/server';
import { GoogleGenAI, Modality } from '@google/genai';

export async function GET(req: Request) {
  try {
    let apiKey = process.env.MY_CUSTOM_GEMINI_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (apiKey) apiKey = apiKey.trim().replace(/^["']|["']$/g, '').split('--')[0].trim();
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash-preview-tts',
      contents: [{ role: 'user', parts: [{ text: 'Hallo, wie geht es Ihnen? Mir geht es sehr gut heute.' }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Puck' },
          },
        },
      },
    });

    let chunks = 0;
    for await (const chunk of response) {
      chunks++;
    }

    return NextResponse.json({
      success: true,
      chunks,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
