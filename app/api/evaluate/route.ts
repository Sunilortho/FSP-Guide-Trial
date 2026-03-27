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
    
    const { text, previousMessage } = await req.json();

    const systemInstruction = `You are a German language tutor for medical professionals preparing for the Fachsprachprüfung (FSP).
Analyze the user's input (which may be a speech-to-text transcript or typed text).
Identify any grammatical errors, awkward phrasing, or words that seem mispronounced (resulting in incorrect words in the transcript).
If the input is perfect or completely acceptable, return hasFeedback as false.
If there are errors or significant room for improvement, return hasFeedback as true, and provide a short, helpful correction or hint in German or English. Keep it brief and encouraging.
Additionally, if there is a specific pronunciation issue (e.g. a word was transcribed incorrectly because it sounds similar), provide a pronunciationHint.
If there is a specific grammar issue, provide a grammarCorrection.`;

    const promptText = previousMessage 
      ? `Patient said: "${previousMessage}"\n\nDoctor (User) replied: "${text}"`
      : `Doctor (User) said: "${text}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: promptText }] }],
      config: {
        systemInstruction,
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hasFeedback: {
              type: Type.BOOLEAN,
              description: "True if there is an error or improvement to suggest, false otherwise."
            },
            feedback: {
              type: Type.STRING,
              description: "The correction or hint. Empty if hasFeedback is false."
            },
            pronunciationHint: {
              type: Type.STRING,
              description: "Specific hint about pronunciation if a word seems mispronounced based on the transcript. Empty if none."
            },
            grammarCorrection: {
              type: Type.STRING,
              description: "Specific grammar correction if there is a grammatical error. Empty if none."
            }
          },
          required: ["hasFeedback", "feedback"]
        }
      },
    });

    const result = JSON.parse(response.text || '{"hasFeedback": false, "feedback": ""}');

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Evaluation API Error:', error);
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}
