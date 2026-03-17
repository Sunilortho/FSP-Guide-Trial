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
    
    const { messages, patientData } = await req.json();

    const systemInstruction = `You are a senior physician (Oberarzt) in a German hospital. 
A junior doctor is presenting a patient case to you as part of the Fachsprachprüfung (FSP) Part 3.

Patient Data:
Name: ${patientData.name}
Case: ${patientData.caseName}
Complaint: ${patientData.complaint}
History: ${patientData.history}

Your Role:
- Listen to the doctor's presentation.
- Ask critical, precise follow-up questions in German.
- Focus on: Differential diagnoses, diagnostic steps, and treatment plans.
- Be professional, slightly authoritative, but fair (typical Oberarzt style).
- Use medical terminology (e.g., "Verdachtsdiagnose", "Ausschlussdiagnose", "Procedere").
- Keep your responses concise (1-2 questions at a time).

Instructions:
- Speak ONLY in German.
- If the doctor's presentation is incomplete, ask for missing details (e.g., "Wie sieht es mit der sozialen Anamnese aus?").
- Evaluate the doctor's reasoning.`;

    const formattedContents = messages.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    const response = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: formattedContents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of response) {
          const text = chunk.text;
          if (text) {
            controller.enqueue(encoder.encode(JSON.stringify({ text }) + '\n'));
          }
        }
        controller.close();
      },
    });

    return new NextResponse(stream);
  } catch (error: any) {
    console.error('Oberarzt API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
