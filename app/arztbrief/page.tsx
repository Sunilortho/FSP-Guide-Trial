'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, CheckCircle, AlertCircle, Loader2, ArrowRight, History, Trash2 } from 'lucide-react';

type Mistake = {
  category: string;
  description: string;
  originalText: string;
  correctedText: string;
};

type MistakeHistory = {
  [description: string]: {
    category: string;
    count: number;
    examples: { original: string; corrected: string }[];
  };
};

export default function ArztbriefKorrekturPage() {
  const [inputText, setInputText] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [mistakeHistory, setMistakeHistory] = useState<MistakeHistory>({});

  useEffect(() => {
    const savedHistory = localStorage.getItem('fsp_mistake_history');
    if (savedHistory) {
      try {
        setMistakeHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse mistake history', e);
      }
    }
  }, []);

  const handleEvaluate = async () => {
    if (!inputText.trim()) return;

    setIsEvaluating(true);
    setFeedback(null);

    try {
      const response = await fetch('/api/evaluate-arztbrief', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputText }),
      });

      if (!response.ok) {
        throw new Error('Evaluation failed');
      }

      const data = await response.json();
      setFeedback(data);

      if (data.mistakes && data.mistakes.length > 0) {
        setMistakeHistory(prev => {
          const newHistory = { ...prev };
          data.mistakes.forEach((mistake: Mistake) => {
            const key = mistake.description;
            if (!newHistory[key]) {
              newHistory[key] = {
                category: mistake.category,
                count: 0,
                examples: []
              };
            }
            newHistory[key].count += 1;
            // Keep up to 3 examples
            if (newHistory[key].examples.length < 3) {
               newHistory[key].examples.push({
                 original: mistake.originalText,
                 corrected: mistake.correctedText
               });
            }
          });
          localStorage.setItem('fsp_mistake_history', JSON.stringify(newHistory));
          return newHistory;
        });
      }

    } catch (error) {
      console.error('Error evaluating text:', error);
      setFeedback({
        isCorrect: false,
        correctedText: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.',
        explanation: 'Die Verbindung zum Server konnte nicht hergestellt werden.',
        pronunciationHints: [],
        mistakes: []
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  const clearHistory = () => {
    setMistakeHistory({});
    localStorage.removeItem('fsp_mistake_history');
  };

  const sortedMistakes = Object.entries(mistakeHistory).sort((a, b) => b[1].count - a[1].count);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 flex items-center gap-4">
          <div className="p-3 bg-[#F5A623] rounded-2xl shadow-sm">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-[#111827] tracking-tight">Arztbrief Korrektur</h1>
            <p className="text-[#6B7280] mt-1 font-medium">Lassen Sie Ihre medizinischen Texte auf Grammatik und Stil prüfen.</p>
          </div>
        </header>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 grid md:grid-cols-2 gap-8">
            {/* Input Section */}
            <div className="flex flex-col gap-6">
              <div className="bg-white border border-[#E5E7EB] rounded-[32px] p-6 flex-grow flex flex-col shadow-sm">
                <label htmlFor="arztbrief-input" className="block text-sm font-bold text-[#4B5563] mb-4 uppercase tracking-widest">
                  Ihr Text
                </label>
                <textarea
                  id="arztbrief-input"
                  className="w-full flex-grow min-h-[400px] bg-transparent text-[#111827] placeholder-[#9CA3AF] resize-none focus:outline-none focus:ring-0 p-2 font-medium leading-relaxed"
                  placeholder="Fügen Sie hier Ihren Arztbrief oder medizinischen Text ein..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
              </div>
              
              <button
                onClick={handleEvaluate}
                disabled={isEvaluating || !inputText.trim()}
                className="w-full py-5 bg-[#111827] hover:bg-black disabled:bg-[#F3F4F6] disabled:text-[#D1D5DB] text-white rounded-2xl font-bold transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-3 text-lg"
              >
                {isEvaluating ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin text-[#F5A623]" />
                    Wird geprüft...
                  </>
                ) : (
                  <>
                    Text prüfen
                    <ArrowRight className="w-6 h-6" />
                  </>
                )}
              </button>
            </div>

            {/* Feedback Section */}
            <div className="flex flex-col gap-6">
              <div className="bg-white border border-[#E5E7EB] rounded-[32px] p-8 flex-grow shadow-sm">
                <h2 className="text-xl font-bold text-[#111827] mb-6 flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-[#10B981]" />
                  Korrektur & Feedback
                </h2>

                {!feedback && !isEvaluating && (
                  <div className="flex flex-col items-center justify-center h-full text-center text-[#9CA3AF] space-y-6 py-16">
                    <div className="w-20 h-20 rounded-[24px] bg-[#F9FAFB] flex items-center justify-center">
                      <FileText className="w-10 h-10 opacity-30" />
                    </div>
                    <p className="font-medium max-w-[200px]">Geben Sie links einen Text ein und klicken Sie auf &quot;Text prüfen&quot;.</p>
                  </div>
                )}

                {isEvaluating && (
                  <div className="flex flex-col items-center justify-center h-full text-center text-[#F5A623] space-y-6 py-16">
                    <Loader2 className="w-12 h-12 animate-spin opacity-50" />
                    <p className="animate-pulse font-bold">Analysiere medizinische Terminologie und Grammatik...</p>
                  </div>
                )}

                {feedback && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                  >
                    {/* Status Banner */}
                    <div className={`p-6 rounded-[24px] border ${feedback.isCorrect ? 'bg-[#ECFDF5] border-[#10B981]/20 text-[#065F46]' : 'bg-[#FFFBEB] border-[#F59E0B]/20 text-[#92400E]'} flex items-start gap-4 shadow-sm`}>
                      {feedback.isCorrect ? (
                        <CheckCircle className="w-6 h-6 mt-0.5 shrink-0 text-[#10B981]" />
                      ) : (
                        <AlertCircle className="w-6 h-6 mt-0.5 shrink-0 text-[#F59E0B]" />
                      )}
                      <div>
                        <p className="font-bold text-lg">{feedback.isCorrect ? 'Der Text ist korrekt.' : 'Es wurden Fehler gefunden.'}</p>
                        <p className="text-sm font-medium opacity-80 mt-1 leading-relaxed">{feedback.explanation}</p>
                      </div>
                    </div>

                    {/* Corrected Text */}
                    {!feedback.isCorrect && feedback.correctedText && (
                      <div className="space-y-3">
                        <h3 className="text-[10px] font-black text-[#6B7280] uppercase tracking-[0.2em]">Korrigierter Text</h3>
                        <div className="p-6 bg-[#F9FAFB] border border-[#E5E7EB] rounded-[24px] text-[#111827] whitespace-pre-wrap font-medium leading-relaxed">
                          {feedback.correctedText}
                        </div>
                      </div>
                    )}

                    {/* Pronunciation Hints (if any) */}
                    {feedback.pronunciationHints && feedback.pronunciationHints.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-[10px] font-black text-[#6B7280] uppercase tracking-[0.2em]">Hinweise zur Aussprache</h3>
                        <ul className="space-y-3">
                          {feedback.pronunciationHints.map((hint: string, index: number) => (
                            <li key={index} className="flex items-start gap-3 text-sm bg-[#F3F4F6] p-4 rounded-2xl font-medium text-[#4B5563]">
                              <span className="text-[#F5A623] font-black mt-0.5">•</span>
                              <span>{hint}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          {/* History Section */}
          <div className="flex flex-col gap-6">
            <div className="bg-white border border-[#E5E7EB] rounded-[32px] p-8 flex-grow flex flex-col shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-[#111827] flex items-center gap-3">
                  <History className="w-6 h-6 text-[#8B5CF6]" />
                  Fehlerhistorie
                </h2>
                {sortedMistakes.length > 0 && (
                  <button 
                    onClick={clearHistory}
                    className="p-2.5 text-[#9CA3AF] hover:text-[#EF4444] hover:bg-[#FEF2F2] rounded-xl transition-all"
                    title="Historie löschen"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>

              {sortedMistakes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-[#9CA3AF] space-y-6 py-16">
                  <div className="w-20 h-20 rounded-[24px] bg-[#F9FAFB] flex items-center justify-center">
                    <History className="w-10 h-10 opacity-30" />
                  </div>
                  <p className="font-medium max-w-[200px]">Noch keine Fehler aufgezeichnet.</p>
                </div>
              ) : (
                <div className="space-y-6 overflow-y-auto pr-2 max-h-[700px] custom-scrollbar">
                  {sortedMistakes.map(([description, data], index) => (
                    <div key={index} className="bg-[#F9FAFB] rounded-[24px] p-6 border border-[#E5E7EB] shadow-sm hover:border-[#8B5CF6]/30 transition-all">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <h3 className="font-bold text-[#111827] leading-tight">{description}</h3>
                        <span className="bg-[#8B5CF6] text-white text-[10px] font-black px-2.5 py-1 rounded-full shrink-0 uppercase tracking-wider">
                          {data.count}x
                        </span>
                      </div>
                      <div className="text-[10px] text-[#6B7280] mb-4 font-black uppercase tracking-widest">{data.category}</div>
                      
                      {data.examples.length > 0 && (
                        <div className="space-y-3 mt-4 pt-4 border-t border-[#E5E7EB]">
                          <p className="text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest">Beispiele:</p>
                          {data.examples.map((ex, i) => (
                            <div key={i} className="text-sm bg-white p-4 rounded-2xl border border-[#E5E7EB] font-medium">
                              <div className="text-[#EF4444] line-through opacity-60 mb-1">{ex.original}</div>
                              <div className="text-[#10B981]">{ex.corrected}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
