'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, User, Activity, Play, Square, Loader2, ArrowLeft, MessageSquare, ClipboardList, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { PATIENT_SCENARIOS } from '../constants/patientScenarios';

type Message = {
  id: string;
  role: 'user' | 'model';
  content: string;
};

export default function OberarztPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showSetup, setShowSetup] = useState(true);
  
  const [selectedScenarioId, setSelectedScenarioId] = useState(PATIENT_SCENARIOS[0].id);
  const selectedScenario = PATIENT_SCENARIOS.find(s => s.id === selectedScenarioId)!;

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const transcriptRef = useRef('');

  useEffect(() => {
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
        };

        recognitionRef.current.onend = () => {
          setIsRecording(false);
          if (transcriptRef.current.trim()) {
            handleSend(transcriptRef.current);
            transcriptRef.current = '';
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          setIsRecording(false);
        };
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleRecording = () => {
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
    if (!text.trim() || isProcessing) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setTranscript('');
    setIsProcessing(true);

    try {
      const res = await fetch('/api/oberarzt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          patientData: {
            name: selectedScenario.name,
            caseName: selectedScenario.category,
            complaint: selectedScenario.complaint,
            history: selectedScenario.history,
          },
        }),
      });

      if (!res.ok) throw new Error('Fehler bei der Anfrage');

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      const modelMessageId = (Date.now() + 1).toString();
      let fullText = '';

      setMessages(prev => [...prev, { id: modelMessageId, role: 'model', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);
            if (data.text) {
              fullText += data.text;
              setMessages(prev => prev.map(msg => 
                msg.id === modelMessageId ? { ...msg, content: fullText } : msg
              ));
            }
          } catch (e) {
            console.error('Error parsing chunk', e);
          }
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const startSimulation = () => {
    setShowSetup(false);
    setMessages([{
      id: 'init',
      role: 'model',
      content: `Guten Tag, Kollege. Sie wollten mir einen Patienten aus der ${selectedScenario.category} vorstellen? Ich höre zu.`
    }]);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E7EB] px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-[#F3F4F6] rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-[#6B7280]" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="bg-[#F5A623] p-2 rounded-xl shadow-sm">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-[#111827]">Oberarzt-Gespräch</h1>
              <p className="text-[10px] font-black text-[#F5A623] uppercase tracking-wider -mt-0.5">FSP Teil 3: Vorstellung</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow flex flex-col max-w-4xl mx-auto w-full p-4 md:p-6 overflow-hidden">
        {showSetup ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-[#E5E7EB] rounded-[32px] p-10 shadow-sm mt-4"
          >
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-4 text-[#111827]">
              <ClipboardList className="w-8 h-8 text-[#F5A623]" />
              Simulation vorbereiten
            </h2>
            
            <div className="space-y-8">
              <div>
                <label className="block text-sm font-bold text-[#4B5563] mb-3 uppercase tracking-widest">
                  Patientenfall auswählen
                </label>
                <select 
                  value={selectedScenarioId}
                  onChange={(e) => setSelectedScenarioId(e.target.value)}
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl px-5 py-4 text-[#111827] font-medium focus:outline-none focus:ring-2 focus:ring-[#F5A623]/30 transition-all"
                >
                  {PATIENT_SCENARIOS.map(s => (
                    <option key={s.id} value={s.id}>{s.name} - {s.category}</option>
                  ))}
                </select>
              </div>

              <div className="bg-[#F9FAFB] rounded-[24px] p-8 border border-[#E5E7EB]">
                <h3 className="font-bold text-[#111827] mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-[#10B981]" />
                  Fall-Details:
                </h3>
                <div className="space-y-3 text-[#4B5563] leading-relaxed">
                  <p><span className="text-[#111827] font-bold">Beschwerde:</span> {selectedScenario.complaint}</p>
                  <p><span className="text-[#111827] font-bold">Anamnese:</span> {selectedScenario.history}</p>
                </div>
              </div>

              <button 
                onClick={startSimulation}
                className="w-full py-5 bg-[#111827] hover:bg-black text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-3 text-lg"
              >
                <Play className="w-6 h-6 fill-current" />
                Vorstellung beginnen
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="flex-grow flex flex-col min-h-0">
            {/* Chat Area */}
            <div className="flex-grow overflow-y-auto space-y-8 pr-2 custom-scrollbar pb-32">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] rounded-[24px] px-6 py-5 shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-[#111827] text-white rounded-tr-none' 
                        : 'bg-white border border-[#E5E7EB] text-[#1A1A1A] rounded-tl-none'
                    }`}>
                      <div className="flex items-center gap-2 mb-2 opacity-60">
                        {msg.role === 'user' ? (
                          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Sie (Assistenzarzt)</span>
                        ) : (
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#F5A623]">Oberarzt</span>
                        )}
                      </div>
                      <p className="leading-relaxed whitespace-pre-wrap font-medium">{msg.content}</p>
                    </div>
                  </motion.div>
                ))}
                
                {isProcessing && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-white border border-[#E5E7EB] rounded-[20px] rounded-tl-none px-6 py-4 shadow-sm flex items-center gap-3 text-[#6B7280] font-bold">
                      <Loader2 className="w-4 h-4 animate-spin text-[#F5A623]" />
                      Oberarzt antwortet...
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#F8F9FA] via-[#F8F9FA] to-transparent">
              <div className="max-w-4xl mx-auto relative">
                <AnimatePresence>
                  {isRecording && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute -top-20 left-0 right-0 flex justify-center"
                    >
                      <div className="bg-[#EF4444] text-white px-6 py-2.5 rounded-full text-sm font-black animate-pulse flex items-center gap-3 shadow-2xl">
                        <div className="w-2.5 h-2.5 bg-white rounded-full" />
                        Spracherkennung aktiv...
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <div className="flex items-end gap-4 bg-white border border-[#E5E7EB] rounded-[32px] p-3 shadow-2xl">
                  <div className="flex-grow relative">
                    <textarea
                      value={transcript || transcriptRef.current}
                      onChange={(e) => setTranscript(e.target.value)}
                      placeholder="Sprechen Sie oder tippen Sie Ihre Vorstellung..."
                      className="w-full bg-transparent border-none focus:ring-0 text-[#111827] placeholder-[#9CA3AF] py-4 px-5 resize-none max-h-40 min-h-[60px] custom-scrollbar font-medium"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend(transcript);
                        }
                      }}
                    />
                  </div>
                  
                  <div className="flex items-center gap-3 pb-2 pr-2">
                    <button
                      onClick={toggleRecording}
                      className={`p-4 rounded-2xl transition-all duration-300 ${
                        isRecording 
                          ? 'bg-[#EF4444] text-white shadow-xl scale-110' 
                          : 'bg-[#F3F4F6] text-[#6B7280] hover:text-[#111827] hover:bg-[#E5E7EB]'
                      }`}
                    >
                      {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                    </button>
                    
                    <button
                      onClick={() => handleSend(transcript)}
                      disabled={!transcript.trim() || isProcessing}
                      className={`p-4 rounded-2xl transition-all duration-300 ${
                        !transcript.trim() || isProcessing
                          ? 'bg-[#F3F4F6] text-[#D1D5DB] cursor-not-allowed'
                          : 'bg-[#F5A623] text-white shadow-xl hover:scale-110 hover:shadow-2xl'
                      }`}
                    >
                      <Play className="w-6 h-6 fill-current" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {error && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 bg-[#EF4444] text-white px-8 py-4 rounded-2xl shadow-2xl z-50 flex items-center gap-4 font-bold">
          <Activity className="w-6 h-6" />
          {error}
          <button onClick={() => setError(null)} className="ml-6 hover:opacity-70 transition-opacity">Verstanden</button>
        </div>
      )}
    </div>
  );
}
