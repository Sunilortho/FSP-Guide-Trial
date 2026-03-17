import { NextResponse } from 'next/server';
import { GoogleGenAI, Modality } from '@google/genai';

export async function POST(req: Request) {
  try {
    let apiKey = process.env.MY_CUSTOM_GEMINI_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    if (apiKey) {
      apiKey = apiKey.trim().replace(/^["']|["']$/g, '').split('--')[0].trim();
    }

    if (!apiKey) {
      throw new Error('API Key is not set.');
    }
    
    const ai = new GoogleGenAI({ apiKey });
    const { text, gender, accent } = await req.json();

    let promptText = `Read the following text exactly as written: ${text}`;
    if (accent === 'Bayerisch') {
      promptText = `Read the following text with a strong Bavarian (Bayerisch) accent: ${text}`;
    } else if (accent === 'Hamburgerisch') {
      promptText = `Read the following text with a strong Northern German Hamburg (Hamburgerisch) accent: ${text}`;
    }

    const ttsResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: [{ parts: [{ text: promptText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            // 'Puck' is a male voice, 'Kore' is a female voice
            prebuiltVoiceConfig: { voiceName: gender === 'female' ? 'Kore' : 'Puck' },
          },
        },
      },
    });

    const audioBase64 = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    return NextResponse.json({
      audioBase64: audioBase64 || null,
    });
  } catch (error: any) {
    console.error('TTS API Error:', error);
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}
