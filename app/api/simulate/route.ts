import { NextResponse } from 'next/server';
import { GoogleGenAI, Modality } from '@google/genai';

export async function POST(req: Request) {
  try {
    let apiKey = process.env.MY_CUSTOM_GEMINI_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    if (apiKey) {
      apiKey = apiKey.trim().replace(/^["']|["']$/g, '').split('--')[0].trim();
    }

    if (!apiKey) {
      throw new Error('NEXT_PUBLIC_GEMINI_API_KEY is not set. Please ensure the API key is configured.');
    }
    
    const ai = new GoogleGenAI({ apiKey });
    
    const { messages, settings } = await req.json();

    const systemInstruction = `You are a patient in a German Fachsprachprüfung (FSP) medical exam simulation.
Your name is ${settings.patientName || 'Herr/Frau Müller'}.
Your case is: ${settings.caseName || 'General medical issue'}.
Complaint: ${settings.complaint || 'None specified'}.
Medical History: ${settings.history || 'None specified'}.
Difficulty: ${settings.difficulty || 'Medium'}.
Speaking Style: ${settings.speakingStyle || 'Normal'}.
Accent/Dialect: ${settings.accent || 'Standard (Hochdeutsch)'}.

Instructions:
- You must speak ONLY in German.
- You are the PATIENT, not the doctor. Respond to the doctor's questions naturally.
- Keep your answers concise, realistic, and conversational (1-3 sentences maximum).
- You MUST start every response with an emotion tag in brackets that reflects your current emotional state based on your complaint and the doctor's response. For example: [Ängstlich], [Schmerzgeplagt], [Erleichtert], [Wütend], [Neutral], [Besorgt].
- After the emotion tag, write your spoken response.
- When the doctor first greets you, respond with: "${settings.greeting || 'Guten Tag.'}"
- If the speaking style is "Verbose", add more details and filler words.
- If the speaking style is "Hesitant", use pauses like "Ähm..." or "Tja...".
- If the speaking style is "Direct", be very brief and to the point.
- If the Accent/Dialect is "Bayerisch", use Bavarian dialect words (e.g., "Grüß Gott", "Servus", "I", "net", "bisserl", "wehtun") and phonetic spelling where appropriate.
- If the Accent/Dialect is "Hamburgerisch", use Northern German/Hamburg dialect words (e.g., "Moin", "schnacken", "büschen", "ne") and phonetic spelling where appropriate.
${settings.useColloquialisms ? '- If "Use Colloquialisms" is enabled, use common German medical idioms (e.g., "Mir brummt der Schädel", "Ich habe Kreislauf", "Mir ist flau", "Ich habe Rücken", "Es zieht wie Hechtsuppe") instead of formal terms.' : '- Use clear, standard medical German without colloquialisms.'}
- Do NOT break character. Do NOT offer medical advice. Do NOT act as an AI.`;

    const formattedContents = messages.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.role === 'model' && msg.emotion ? `[${msg.emotion}] ${msg.content}` : msg.content }],
    }));

    const chatResponseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: formattedContents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let currentSentence = '';
        let sentenceIndex = 0;
        let emotionParsed = false;
        let emotionBuffer = '';
        let currentEmotion = 'Neutral';
        const ttsPromises: Promise<void>[] = [];

        const generateAudio = async (textToSpeak: string, index: number, emotion: string) => {
          try {
            let promptText = `Read the following text with a ${emotion} tone: ${textToSpeak}`;
            if (settings.accent === 'Bayerisch') {
              promptText = `Read the following text with a strong Bavarian (Bayerisch) accent and a ${emotion} tone: ${textToSpeak}`;
            } else if (settings.accent === 'Hamburgerisch') {
              promptText = `Read the following text with a strong Northern German Hamburg (Hamburgerisch) accent and a ${emotion} tone: ${textToSpeak}`;
            }

            const ttsResponse = await ai.models.generateContent({
              model: 'gemini-2.5-flash-preview-tts',
              contents: [{ parts: [{ text: promptText }] }],
              config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: settings.gender === 'female' ? 'Kore' : 'Puck' },
                  },
                },
              },
            });

            const audioBase64 = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (audioBase64) {
              controller.enqueue(encoder.encode(JSON.stringify({ audio: audioBase64, audioIndex: index }) + '\n'));
            } else {
              controller.enqueue(encoder.encode(JSON.stringify({ audio: '', audioIndex: index }) + '\n'));
            }
          } catch (err) {
            console.error('TTS Error for sentence:', err);
            // Enqueue an empty audio chunk so the frontend doesn't get stuck waiting for this index
            controller.enqueue(encoder.encode(JSON.stringify({ audio: '', audioIndex: index }) + '\n'));
          }
        };

        try {
          for await (const chunk of chatResponseStream) {
            let text = chunk.text;
            if (text) {
              if (!emotionParsed) {
                emotionBuffer += text;
                const match = emotionBuffer.match(/^\[(.*?)\]\s*/);
                if (match) {
                  currentEmotion = match[1].trim();
                  controller.enqueue(encoder.encode(JSON.stringify({ emotion: currentEmotion }) + '\n'));
                  const remainingText = emotionBuffer.slice(match[0].length);
                  emotionParsed = true;
                  emotionBuffer = '';
                  if (remainingText) {
                    controller.enqueue(encoder.encode(JSON.stringify({ text: remainingText }) + '\n'));
                    currentSentence += remainingText;
                  }
                } else if (!emotionBuffer.startsWith('[') || emotionBuffer.length > 50) {
                  emotionParsed = true;
                  const remainingText = emotionBuffer;
                  emotionBuffer = '';
                  controller.enqueue(encoder.encode(JSON.stringify({ text: remainingText }) + '\n'));
                  currentSentence += remainingText;
                } else {
                  // Wait for more chunks to complete the emotion tag
                  continue;
                }
              } else {
                controller.enqueue(encoder.encode(JSON.stringify({ text }) + '\n'));
                currentSentence += text;
              }

              let buffer = currentSentence;
              while (true) {
                // Split by sentence endings to ensure natural intonation
                const match = buffer.match(/([.!?]+[\s\n]+)/);
                if (match) {
                  const splitIndex = match.index! + match[0].length;
                  const sentenceToSpeak = buffer.slice(0, splitIndex).trim();
                  buffer = buffer.slice(splitIndex);
                  if (sentenceToSpeak) {
                    ttsPromises.push(generateAudio(sentenceToSpeak, sentenceIndex++, currentEmotion));
                  }
                } else {
                  break;
                }
              }
              currentSentence = buffer;
            }
          }

          if (!emotionParsed && emotionBuffer.trim()) {
             controller.enqueue(encoder.encode(JSON.stringify({ text: emotionBuffer }) + '\n'));
             currentSentence += emotionBuffer;
          }

          if (currentSentence.trim()) {
            ttsPromises.push(generateAudio(currentSentence.trim(), sentenceIndex++, currentEmotion));
          }

          await Promise.all(ttsPromises);
        } catch (err: any) {
          console.error('Stream Error:', err);
          controller.enqueue(encoder.encode(JSON.stringify({ error: err.message }) + '\n'));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Simulation API Error:', error);
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}
