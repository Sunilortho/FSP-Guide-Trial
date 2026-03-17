import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

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

    const systemInstruction = `You are a German language tutor for medical professionals preparing for the Fachsprachprüfung (FSP).
Analyze the user's medical report (Arztbrief).
Identify any grammatical errors, awkward phrasing, or incorrect medical terminology.
Provide a corrected version of the text, an explanation of the errors, and any specific hints for medical terminology.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text }] }],
      config: {
        systemInstruction,
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isCorrect: {
              type: Type.BOOLEAN,
              description: "True if the text is perfectly correct and professional, false otherwise."
            },
            correctedText: {
              type: Type.STRING,
              description: "The fully corrected version of the text. Empty if isCorrect is true."
            },
            explanation: {
              type: Type.STRING,
              description: "A brief explanation of the errors found and why they were corrected."
            },
            pronunciationHints: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING
              },
              description: "A list of specific hints regarding medical terminology, phrasing, or common pitfalls."
            },
            mistakes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: {
                    type: Type.STRING,
                    description: "The category of the mistake, e.g., 'Grammatik', 'Terminologie', 'Aussprache', 'Stil'."
                  },
                  description: {
                    type: Type.STRING,
                    description: "A short description of the rule or mistake, e.g., 'Falscher Artikel', 'Falscher Kasus', 'Umgangssprache'."
                  },
                  originalText: {
                    type: Type.STRING,
                    description: "The incorrect text from the user."
                  },
                  correctedText: {
                    type: Type.STRING,
                    description: "The corrected text."
                  }
                },
                required: ["category", "description", "originalText", "correctedText"]
              },
              description: "A list of specific mistakes found in the text."
            }
          },
          required: ["isCorrect", "correctedText", "explanation", "pronunciationHints", "mistakes"]
        }
      },
    });

    const result = JSON.parse(response.text || '{"isCorrect": true, "correctedText": "", "explanation": "", "pronunciationHints": [], "mistakes": []}');

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Arztbrief Evaluation API Error:', error);
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}
