'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Settings, User, Activity, Play, Square, Loader2, ArrowLeft, Lightbulb, Volume2, PenTool, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { PATIENT_SCENARIOS } from '../constants/patientScenarios';
import AuthGuard from '../components/AuthGuard';
import { db, auth } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { updateXP } from '../../lib/xp';
import { CheckCircle, Trophy, Home } from 'lucide-react';

type Message = {
  id: string;
  role: 'user' | 'model';
  content: string;
  feedback?: string;
  pronunciationHint?: string;
  grammarCorrection?: string;
  isEvaluating?: boolean;
  emotion?: string;
  explanation?: string;
  isDecoding?: boolean;
};

export default function SimulatorPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
   const [error, setError] = useState<string | null>(null);
  const [isEnding, setIsEnding] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  
  const [realtimeFeedback, setRealtimeFeedback] = useState<{
    feedback?: string;
    pronunciationHint?: string;
    grammarCorrection?: string;
  } | null>(null);
  const [isEvaluatingRealtime, setIsEvaluatingRealtime] = useState(false);
  const evaluationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastEvaluatedTranscriptRef = useRef<string>('');

  const handleDecode = async (messageId: string, text: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, isDecoding: true } : msg
    ));
    
    try {
      const res = await fetch('/api/decode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, explanation: data.explanation, isDecoding: false } : msg
      ));
    } catch (err) {
      console.error('Decode failed:', err);
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, isDecoding: false } : msg
      ));
    }
  };

  // Settings
  const [showSettings, setShowSettings] = useState(true);
  const [settings, setSettings] = useState({
    scenarioId: PATIENT_SCENARIOS[0].id,
    caseName: `${PATIENT_SCENARIOS[0].complaint} (${PATIENT_SCENARIOS[0].history})`,
    patientName: PATIENT_SCENARIOS[0].name,
    gender: PATIENT_SCENARIOS[0].gender,
    greeting: PATIENT_SCENARIOS[0].greeting,
    complaint: PATIENT_SCENARIOS[0].complaint,
    history: PATIENT_SCENARIOS[0].history,
    difficulty: 'Mittel',
    speakingStyle: 'Normal',
    accent: 'Standard (Hochdeutsch)',
    useColloquialisms: true,
  });

  const handleScenarioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const scenario = PATIENT_SCENARIOS.find(s => s.id === e.target.value);
    if (scenario) {
      setSettings({
        ...settings,
        scenarioId: scenario.id,
        caseName: `${scenario.complaint} (${scenario.history})`,
        patientName: scenario.name,
        gender: scenario.gender,
        greeting: scenario.greeting,
        complaint: scenario.complaint,
        history: scenario.history,
      });
    }
  };

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const audioQueueRef = useRef<{index: number, audio: string}[]>([]);
  const nextAudioIndexRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);

  const transcriptRef = useRef('');

  const handleSendRef = useRef<(text: string) => void>(() => {});
  useEffect(() => {
    handleSendRef.current = handleSend;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, isProcessing, settings, realtimeFeedback]);

  const evaluateRealtimeRef = useRef<(text: string) => void>(() => {});
  useEffect(() => {
    evaluateRealtimeRef.current = async (text: string) => {
      if (text === lastEvaluatedTranscriptRef.current) return;
      
      setIsEvaluatingRealtime(true);
      lastEvaluatedTranscriptRef.current = text;
      
      try {
        const previousMessage = messages.length > 0 ? messages[messages.length - 1].content : '';
        const res = await fetch('/api/evaluate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, previousMessage }),
        });
        const data = await res.json();
        
        if (data.hasFeedback) {
          setRealtimeFeedback({
            feedback: data.feedback,
            pronunciationHint: data.pronunciationHint,
            grammarCorrection: data.grammarCorrection
          });
        } else {
          setRealtimeFeedback(null);
        }
      } catch (err) {
        console.error('Realtime evaluation failed:', err);
      } finally {
        setIsEvaluatingRealtime(false);
      }
    };
  }, [messages]);

  useEffect(() => {
    // Initialize Web Speech API
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'de-DE';

        recognitionRef.current.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            currentTranscript += event.results[i][0].transcript;
          }
          setTranscript(currentTranscript);
          transcriptRef.current = currentTranscript;

          if (evaluationTimeoutRef.current) {
            clearTimeout(evaluationTimeoutRef.current);
          }

          if (currentTranscript.trim().length > 10) {
            evaluationTimeoutRef.current = setTimeout(() => {
              evaluateRealtimeRef.current(currentTranscript);
            }, 1500);
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          if (event.error === 'no-speech') {
            setIsRecording(false);
            return;
          }
          console.error('Speech recognition error', event.error);
          setIsRecording(false);
          setError(`Mikrofon-Fehler: ${event.error}`);
        };

        recognitionRef.current.onend = () => {
          setIsRecording(false);
          if (transcriptRef.current.trim()) {
            handleSendRef.current(transcriptRef.current);
            transcriptRef.current = '';
          }
        };
      } else {
        setError('Spracherkennung wird von Ihrem Browser nicht unterstützt. Bitte verwenden Sie Chrome.');
      }
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initAudioContext = () => {
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  const toggleRecording = () => {
    initAudioContext();
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      setTranscript('');
      setError(null);
      try {
        recognitionRef.current?.start();
        setIsRecording(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSend = async (text: string) => {
    initAudioContext();
    if (!text.trim() || isProcessing) return;

    if (evaluationTimeoutRef.current) {
      clearTimeout(evaluationTimeoutRef.current);
    }

    const currentRealtimeFeedback = realtimeFeedback;
    const isTextSame = text === lastEvaluatedTranscriptRef.current;

    let finalFeedback = undefined;
    let finalPronunciationHint = undefined;
    let finalGrammarCorrection = undefined;
    let needsEvaluation = true;

    if (isTextSame && currentRealtimeFeedback) {
      finalFeedback = currentRealtimeFeedback.feedback;
      finalPronunciationHint = currentRealtimeFeedback.pronunciationHint;
      finalGrammarCorrection = currentRealtimeFeedback.grammarCorrection;
      needsEvaluation = false;
    } else if (isTextSame && !currentRealtimeFeedback && lastEvaluatedTranscriptRef.current !== '') {
      needsEvaluation = false;
    }

    const userMessageId = Date.now().toString();
    const userMessage: Message = { 
      id: userMessageId, 
      role: 'user', 
      content: text, 
      isEvaluating: needsEvaluation,
      feedback: finalFeedback,
      pronunciationHint: finalPronunciationHint,
      grammarCorrection: finalGrammarCorrection
    };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setTranscript('');
    setRealtimeFeedback(null);
    lastEvaluatedTranscriptRef.current = '';
    setIsProcessing(true);

    // Reset audio queue for new response
    audioQueueRef.current = [];
    nextAudioIndexRef.current = 0;
    isPlayingRef.current = false;
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
      audioSourceRef.current.disconnect();
      audioSourceRef.current = null;
    }

    if (needsEvaluation) {
      // Start evaluation in the background
      const previousMessage = messages.length > 0 ? messages[messages.length - 1].content : '';
      fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, previousMessage }),
      })
        .then(res => res.json())
        .then(data => {
          setMessages(prev => prev.map(msg => 
            msg.id === userMessageId 
              ? { 
                  ...msg, 
                  isEvaluating: false, 
                  feedback: data.hasFeedback ? data.feedback : undefined,
                  pronunciationHint: data.pronunciationHint,
                  grammarCorrection: data.grammarCorrection
                } 
              : msg
          ));
        })
        .catch(err => {
          console.error('Evaluation failed:', err);
          setMessages(prev => prev.map(msg => 
            msg.id === userMessageId ? { ...msg, isEvaluating: false } : msg
          ));
        });
    }

    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          settings,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || 'Fehler bei der Server-Anfrage');
      }

      if (!res.body) throw new Error('No response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      
      const modelMessageId = (Date.now() + 1).toString();
      let fullText = '';
      
      setMessages((prev) => [...prev, { id: modelMessageId, role: 'model', content: '' }]);
      setIsProcessing(false); // Stop processing so the user sees the text immediately

      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep the last incomplete line in the buffer
        
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);
            if (data.error) {
              throw new Error(data.error);
            }
            if (data.emotion) {
              setMessages((prev) => prev.map(msg => msg.id === modelMessageId ? { ...msg, emotion: data.emotion } : msg));
            }
            if (data.text) {
              fullText += data.text;
              setMessages((prev) => prev.map(msg => msg.id === modelMessageId ? { ...msg, content: fullText } : msg));
            }
            if (data.audio !== undefined && data.audioIndex !== undefined) {
              audioQueueRef.current.push({ index: data.audioIndex, audio: data.audio });
              audioQueueRef.current.sort((a, b) => a.index - b.index);
              playNextAudio();
            }
          } catch (e) {
            console.error('Error parsing stream chunk:', e);
          }
        }
      }

    } catch (err: any) {
      setError(err.message || 'Ein Fehler ist aufgetreten.');
      setIsProcessing(false);
    }
  };

  const playNextAudio = async () => {
    if (isPlayingRef.current) return;
    if (audioQueueRef.current.length === 0) return;
    if (audioQueueRef.current[0].index !== nextAudioIndexRef.current) return;

    isPlayingRef.current = true;
    const chunk = audioQueueRef.current.shift()!;
    nextAudioIndexRef.current++;

    try {
      if (!chunk.audio) {
        // Skip empty audio chunks (e.g., if TTS failed for a sentence)
        isPlayingRef.current = false;
        playNextAudio();
        return;
      }

      if (!audioContextRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioContextClass();
      }

      const audioContext = audioContextRef.current;
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      const binaryString = window.atob(chunk.audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }

      const audioBuffer = audioContext.createBuffer(1, float32Array.length, 24000);
      audioBuffer.getChannelData(0).set(float32Array);

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      
      source.onended = () => {
        isPlayingRef.current = false;
        playNextAudio();
      };

      source.start();
      audioSourceRef.current = source;
    } catch (e) {
      console.error("Audio play failed:", e);
      isPlayingRef.current = false;
      playNextAudio();
    }
  };

  const startSession = () => {
    initAudioContext();
    setShowSettings(false);
    setMessages([]);
    // Initial greeting from patient
    handleSend("Guten Tag, ich bin der behandelnde Arzt. Wie kann ich Ihnen helfen?");
  };

  const handleEndSession = async () => {
    if (messages.length < 2 || isEnding) return;
    setIsEnding(true);

    // Calculate a mock score based on message quality/length
    // In a real app, this would be evaluated by LLM
    const userMessages = messages.filter(m => m.role === 'user');
    const score = Math.min(Math.round(userMessages.length * 15 + Math.random() * 20), 98);
    setFinalScore(score);

    try {
      const user = auth.currentUser;
      if (user) {
        // 1. Save to practiceSessions
        await addDoc(collection(db, 'practiceSessions'), {
          userId: user.uid,
          scenarioId: settings.scenarioId,
          score: score,
          createdAt: new Date().toISOString(),
          timestamp: serverTimestamp(),
          messageCount: messages.length
        });

        // 2. Award XP (50 XP for completing a session)
        await updateXP(user.uid, 50);
      }
      setShowSummary(true);
    } catch (err) {
      console.error('Failed to end session:', err);
      setError('Verbindung zum Server unterbrochen.');
    } finally {
      setIsEnding(false);
    }
  };
  return (
    <AuthGuard>
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans text-[#1A1A1A]">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E7EB] px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 hover:bg-[#F3F4F6] rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-[#6B7280]" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="bg-[#00B4D8] p-1.5 rounded-lg shadow-sm">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold text-[#111827]">FSP Simulator</h1>
          </div>
        </div>
        {!showSettings && (
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 hover:bg-[#F3F4F6] rounded-xl transition-colors"
          >
            <Settings className="w-5 h-5 text-[#6B7280]" />
          </button>
        )}
        {!showSettings && messages.length > 2 && !showSummary && (
          <button 
            onClick={handleEndSession}
            disabled={isEnding}
            className="flex items-center gap-2 px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white rounded-xl text-sm font-bold shadow-sm transition-all disabled:opacity-50"
          >
            {isEnding ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Session Beenden
          </button>
        )}
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto p-4 flex flex-col relative">
        {error && (
          <div className="bg-[#FEF2F2] border border-[#FEE2E2] text-[#EF4444] px-4 py-3 rounded-2xl mb-4 text-sm font-medium">
            {error}
          </div>
        )}

        {showSettings ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[32px] border border-[#E5E7EB] p-8 shadow-sm mt-4"
          >
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3 text-[#111827]">
              <Settings className="w-6 h-6 text-[#00B4D8]" />
              Sitzung konfigurieren
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-[#4B5563] mb-2">Fall (Krankheitsbild)</label>
                <select 
                  value={settings.scenarioId}
                  onChange={handleScenarioChange}
                  className="w-full bg-[#F9FAFB] text-[#111827] border border-[#E5E7EB] rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#00B4D8] focus:border-[#00B4D8] outline-none transition-all font-medium"
                >
                  {Array.from(new Set(PATIENT_SCENARIOS.map(s => s.category))).map(category => (
                    <optgroup key={category} label={category}>
                      {PATIENT_SCENARIOS.filter(s => s.category === category).map(scenario => (
                        <option key={scenario.id} value={scenario.id}>
                          {scenario.name} - {scenario.complaint.substring(0, 40)}...
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[#4B5563] mb-2">Patientenname</label>
                  <input 
                    type="text"
                    value={settings.patientName}
                    readOnly
                    className="w-full bg-[#F3F4F6] text-[#9CA3AF] border border-[#E5E7EB] rounded-xl px-4 py-3 outline-none cursor-not-allowed font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#4B5563] mb-2">Geschlecht</label>
                  <select 
                    value={settings.gender}
                    disabled
                    className="w-full bg-[#F3F4F6] text-[#9CA3AF] border border-[#E5E7EB] rounded-xl px-4 py-3 outline-none cursor-not-allowed font-medium"
                  >
                    <option value="male">Männlich</option>
                    <option value="female">Weiblich</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[#4B5563] mb-2">Schwierigkeit</label>
                  <select 
                    value={settings.difficulty}
                    onChange={(e) => setSettings({...settings, difficulty: e.target.value})}
                    className="w-full bg-[#F9FAFB] text-[#111827] border border-[#E5E7EB] rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#00B4D8] focus:border-[#00B4D8] outline-none transition-all font-medium"
                  >
                    <option value="Leicht">Leicht (Kooperativ)</option>
                    <option value="Mittel">Mittel (Realistisch)</option>
                    <option value="Schwer">Schwer (Schmerzhaft/Verwirrt)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#4B5563] mb-2">Sprechstil</label>
                  <select 
                    value={settings.speakingStyle}
                    onChange={(e) => setSettings({...settings, speakingStyle: e.target.value})}
                    className="w-full bg-[#F9FAFB] text-[#111827] border border-[#E5E7EB] rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#00B4D8] focus:border-[#00B4D8] outline-none transition-all font-medium"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Ausführlich (Verbose)">Ausführlich (Redselig)</option>
                    <option value="Zögerlich (Hesitant)">Zögerlich (Pausen)</option>
                    <option value="Direkt (Direct)">Direkt (Kurz angebunden)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-[#4B5563] mb-2">Akzent / Dialekt</label>
                <select 
                  value={settings.accent}
                  onChange={(e) => setSettings({...settings, accent: e.target.value})}
                  className="w-full bg-[#F9FAFB] text-[#111827] border border-[#E5E7EB] rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#00B4D8] focus:border-[#00B4D8] outline-none transition-all font-medium"
                >
                  <option value="Standard (Hochdeutsch)">Standard (Hochdeutsch)</option>
                  <option value="Bayerisch">Bayerisch</option>
                  <option value="Hamburgerisch">Hamburgerisch</option>
                </select>
              </div>

              <div className="flex items-center justify-between bg-[#F9FAFB] p-4 rounded-2xl border border-[#E5E7EB]">
                <div className="flex items-center gap-4">
                  <div className="bg-[#00B4D8]/10 p-2.5 rounded-xl text-[#00B4D8]">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#111827]">Umgangssprache</p>
                    <p className="text-xs text-[#6B7280]">Patienten nutzen Redewendungen</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSettings({...settings, useColloquialisms: !settings.useColloquialisms})}
                  className={`w-14 h-7 rounded-full relative transition-all duration-300 ${settings.useColloquialisms ? 'bg-[#00B4D8]' : 'bg-[#D1D5DB]'}`}
                >
                  <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${settings.useColloquialisms ? 'left-8' : 'left-1'}`} />
                </button>
              </div>

              <button 
                onClick={startSession}
                className="w-full bg-[#111827] hover:bg-black text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all mt-6 flex items-center justify-center gap-3"
              >
                <Play className="w-5 h-5 fill-current" />
                Simulation Starten
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-col flex-1 h-full">
            {/* Chat History */}
            <div className="flex-1 overflow-y-auto pb-32 space-y-6 px-2">
              {messages.length === 0 && !isProcessing && (
                <div className="text-center text-[#9CA3AF] mt-16 font-medium">
                  Drücken Sie das Mikrofon, um das Gespräch zu beginnen.
                </div>
              )}
              
              <AnimatePresence>
                {messages.map((msg) => (
                  <motion.div 
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div className={`max-w-[85%] rounded-[24px] px-5 py-4 shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-[#111827] text-white rounded-tr-none' 
                        : 'bg-white border border-[#E5E7EB] text-[#1A1A1A] rounded-tl-none'
                    }`}>
                      {msg.role === 'model' && (
                        <div className="flex items-center gap-2 mb-2 text-xs font-bold text-[#6B7280] uppercase tracking-wider">
                          <User className="w-3 h-3" />
                          {settings.patientName}
                          {msg.emotion && (
                            <span className="ml-2 px-2.5 py-0.5 bg-[#F3F4F6] text-[#00B4D8] rounded-full text-[10px] font-black">
                              {msg.emotion}
                            </span>
                          )}
                        </div>
                      )}
                      <p className="leading-relaxed font-medium">{msg.content}</p>
                      {msg.role === 'model' && (
                        <button 
                          onClick={() => handleDecode(msg.id, msg.content)}
                          disabled={msg.isDecoding}
                          className="mt-3 text-[10px] font-black text-[#00B4D8] hover:text-[#0077B6] uppercase tracking-widest flex items-center gap-1.5 disabled:opacity-50 transition-colors"
                        >
                          {msg.isDecoding ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <MessageSquare className="w-3 h-3" />
                          )}
                          Umgangssprache klären
                        </button>
                      )}
                      {msg.explanation && (
                        <div className="mt-3 p-3 bg-[#F0F9FF] border border-[#BAE6FD] rounded-xl text-xs text-[#0369A1] font-medium italic">
                          {msg.explanation}
                        </div>
                      )}
                    </div>
                    {msg.role === 'user' && (msg.isEvaluating || msg.feedback || msg.pronunciationHint || msg.grammarCorrection) && (
                      <div className="mt-2 max-w-[85%] bg-[#FFFBEB] border border-[#FEF3C7] rounded-2xl p-4 text-sm text-[#92400E] shadow-sm flex flex-col gap-3">
                        {msg.isEvaluating ? (
                          <div className="flex items-center gap-3">
                            <Loader2 className="w-4 h-4 animate-spin text-[#D97706]" />
                            <span className="font-bold">Analysiere Sprache...</span>
                          </div>
                        ) : (
                          <>
                            {msg.feedback && (
                              <div className="flex items-start gap-3">
                                <Lightbulb className="w-5 h-5 text-[#D97706] mt-0.5 shrink-0" />
                                <div>
                                  <span className="font-bold block mb-0.5">Feedback:</span>
                                  <span className="leading-relaxed">{msg.feedback}</span>
                                </div>
                              </div>
                            )}
                            {msg.pronunciationHint && (
                              <div className="flex items-start gap-3">
                                <Volume2 className="w-5 h-5 text-[#D97706] mt-0.5 shrink-0" />
                                <div>
                                  <span className="font-bold block mb-0.5">Aussprache:</span>
                                  <span className="leading-relaxed">{msg.pronunciationHint}</span>
                                </div>
                              </div>
                            )}
                            {msg.grammarCorrection && (
                              <div className="flex items-start gap-3">
                                <PenTool className="w-5 h-5 text-[#D97706] mt-0.5 shrink-0" />
                                <div>
                                  <span className="font-bold block mb-0.5">Grammatik:</span>
                                  <span className="leading-relaxed font-mono text-xs bg-white/50 p-1 rounded">{msg.grammarCorrection}</span>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
                
                {isProcessing && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-white border border-[#E5E7EB] rounded-[20px] rounded-tl-none px-5 py-4 shadow-sm flex items-center gap-3 text-[#6B7280] font-medium">
                      <Loader2 className="w-4 h-4 animate-spin text-[#00B4D8]" />
                      Patient überlegt...
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Recording Controls */}
            <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#F8F9FA] via-[#F8F9FA] to-transparent pb-10 pt-16 px-4">
              <div className="max-w-3xl mx-auto flex flex-col items-center">
                
                {/* Realtime Feedback */}
                <AnimatePresence>
                  {(realtimeFeedback || isEvaluatingRealtime) && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="mb-6 max-w-md w-full bg-white/80 border border-[#FEF3C7] rounded-2xl p-4 text-sm text-[#92400E] shadow-xl flex flex-col gap-3 backdrop-blur-xl"
                    >
                      {isEvaluatingRealtime ? (
                        <div className="flex items-center gap-3 text-[#D97706] justify-center font-bold">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Live-Analyse...
                        </div>
                      ) : realtimeFeedback ? (
                        <>
                          {realtimeFeedback.feedback && (
                            <div className="flex items-start gap-3">
                              <Lightbulb className="w-5 h-5 text-[#D97706] mt-0.5 shrink-0" />
                              <div>
                                <span className="font-bold block mb-0.5 text-xs uppercase tracking-wider">Live Feedback:</span>
                                <span>{realtimeFeedback.feedback}</span>
                              </div>
                            </div>
                          )}
                          {realtimeFeedback.pronunciationHint && (
                            <div className="flex items-start gap-3">
                              <Volume2 className="w-5 h-5 text-[#D97706] mt-0.5 shrink-0" />
                              <div>
                                <span className="font-bold block mb-0.5 text-xs uppercase tracking-wider">Aussprache:</span>
                                <span>{realtimeFeedback.pronunciationHint}</span>
                              </div>
                            </div>
                          )}
                        </>
                      ) : null}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Live Transcript Preview */}
                <div className="h-10 mb-6 text-center">
                  {transcript && (
                    <p className="text-[#4B5563] font-medium bg-white px-6 py-2 rounded-full text-sm shadow-lg border border-[#E5E7EB] inline-block">
                      &quot;{transcript}&quot;
                    </p>
                  )}
                </div>

                <button
                  onClick={toggleRecording}
                  disabled={isProcessing}
                  className={`relative flex items-center justify-center w-24 h-24 rounded-full shadow-2xl transition-all duration-500 ${
                    isProcessing ? 'bg-[#E5E7EB] cursor-not-allowed' :
                    isRecording ? 'bg-[#EF4444] hover:bg-[#DC2626] scale-110' : 'bg-[#111827] hover:bg-black hover:scale-105'
                  }`}
                >
                  {isRecording && (
                    <span className="absolute inset-0 rounded-full border-4 border-[#EF4444] opacity-30 animate-ping"></span>
                  )}
                  {isRecording ? (
                    <Square className="w-8 h-8 text-white fill-current" />
                  ) : (
                    <Mic className="w-10 h-10 text-white" />
                  )}
                </button>
                <p className="text-[10px] font-black text-[#9CA3AF] mt-6 uppercase tracking-[0.2em]">
                  {isRecording ? 'Tippen zum Senden' : 'Tippen zum Sprechen'}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
    
    {/* Summary Modal */}
    <AnimatePresence>
      {showSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl text-center"
          >
            <div className="w-20 h-20 bg-[#F5A623] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-200">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            
            <h2 className="text-3xl font-black text-[#111827] mb-2">Simulation Beendet!</h2>
            <p className="text-[#6B7280] font-medium mb-8">Hervorragende Arbeit, Herr Kollege.</p>
            
            <div className="bg-[#F9FAFB] rounded-3xl p-6 mb-8 border border-[#F3F4F6]">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-bold text-[#6B7280] uppercase tracking-wider">Dein Score</span>
                <span className="text-2xl font-black text-[#10B981]">{finalScore}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-[#6B7280] uppercase tracking-wider">Erhaltene XP</span>
                <span className="text-2xl font-black text-[#00B4D8]">+50 XP</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Link 
                href="/"
                className="w-full bg-[#111827] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg"
              >
                <Home className="w-5 h-5" />
                Zum Dashboard
              </Link>
              <button 
                onClick={() => {
                  setShowSummary(false);
                  setShowSettings(true);
                }}
                className="w-full bg-white text-[#6B7280] border border-[#E5E7EB] font-bold py-4 rounded-2xl hover:bg-gray-50 transition-all font-bold"
              >
                Neuen Fall Starten
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </AuthGuard>
  );
}
