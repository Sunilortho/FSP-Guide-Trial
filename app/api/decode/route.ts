import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    let apiKey = process.env.MY_CUSTOM_GEMINI_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    if (apiKey) {
      apiKey = apiKey.trim().replace(/^["']|["']$/g, '').split('--')[0].trim();
    }

    if (!apiKey) {
      throw new Error('NEXT_PUBLIC_GEMINI_API_KEY is not set.');
    }
    
    const ai = new GoogleGenAI({ apiKey });
    
    const { text } = await req.json();

    const systemInstruction = `You are a medical German language expert. 
Your task is to identify and explain any German colloquialisms, idioms, or regional dialect expressions in the provided text.

Instructions:
- If the text contains colloquialisms (e.g., "Mir brummt der Schädel", "Ich habe Kreislauf", "Mir ist flau"), explain them in plain medical German.
- Provide the formal medical equivalent (e.g., "Kopfschmerzen", "Schwindel", "Übelkeit").
- Keep the explanation brief and helpful for a foreign doctor.
- Respond in German.
- If there are no colloquialisms, just say "Keine umgangssprachlichen Ausdrücke gefunden."`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ parts: [{ text }] }],
      config: {
        systemInstruction,
        temperature: 0.3,
      },
    });

    return NextResponse.json({ explanation: response.text });
  } catch (error: any) {
    console.error('Decode API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
