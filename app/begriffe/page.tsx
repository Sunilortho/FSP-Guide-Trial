'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Volume2, BookOpen, ChevronRight, X } from 'lucide-react';
import { MEDICAL_TERMS, TERM_CATEGORIES, TermCategory, MedicalTerm } from '@/lib/medicalTerms';

export default function BegriffePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TermCategory | 'Alle'>('Alle');
  const [playingTermId, setPlayingTermId] = useState<string | null>(null);

  const filteredTerms = useMemo(() => {
    return MEDICAL_TERMS.filter((term) => {
      const matchesSearch = 
        term.german.toLowerCase().includes(searchQuery.toLowerCase()) ||
        term.english.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'Alle' || term.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const playAudio = (term: MedicalTerm) => {
    if (playingTermId === term.id) return;
    
    setPlayingTermId(term.id);
    const utterance = new SpeechSynthesisUtterance(term.german);
    utterance.lang = 'de-DE';
    utterance.onend = () => setPlayingTermId(null);
    utterance.onerror = () => setPlayingTermId(null);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-[#E5E7EB] p-6 shadow-sm">
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-[#F5A623] rounded-xl shadow-sm">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-[#111827]">Medizinische Begriffe</h1>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-[#9CA3AF]" />
            </div>
            <input
              type="text"
              className="block w-full pl-12 pr-12 py-4 border border-[#E5E7EB] rounded-2xl leading-5 bg-[#F9FAFB] text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#F5A623]/30 sm:text-sm transition-all font-medium"
              placeholder="Suchen nach Begriffen (Deutsch oder Englisch)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#9CA3AF] hover:text-[#111827]"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Categories */}
          <div className="flex overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 gap-3 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory('Alle')}
              className={`whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
                selectedCategory === 'Alle'
                  ? 'bg-[#111827] text-white shadow-md'
                  : 'bg-white border border-[#E5E7EB] text-[#4B5563] hover:bg-[#F3F4F6]'
              }`}
            >
              Alle
            </button>
            {TERM_CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
                  selectedCategory === category
                    ? 'bg-[#111827] text-white shadow-md'
                    : 'bg-white border border-[#E5E7EB] text-[#4B5563] hover:bg-[#F3F4F6]'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-6 py-10">
        <div className="mb-6 flex justify-between items-center">
          <p className="text-sm font-bold text-[#6B7280] uppercase tracking-widest">
            {filteredTerms.length} {filteredTerms.length === 1 ? 'Begriff' : 'Begriffe'} gefunden
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filteredTerms.map((term) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                key={term.id}
                className="bg-white border border-[#E5E7EB] rounded-[24px] p-6 hover:shadow-xl hover:border-[#F5A623]/30 transition-all group flex flex-col shadow-sm"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#F3F4F6] text-[#4B5563]">
                    {term.category}
                  </span>
                  <button
                    onClick={() => playAudio(term)}
                    className={`p-2.5 rounded-xl transition-all ${
                      playingTermId === term.id
                        ? 'bg-[#F5A623] text-white shadow-lg'
                        : 'bg-[#F9FAFB] text-[#9CA3AF] hover:text-[#F5A623] hover:bg-[#F3F4F6]'
                    }`}
                    aria-label="Aussprache anhören"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
                
                <h3 className="text-xl font-bold text-[#111827] mb-2 group-hover:text-[#F5A623] transition-colors">
                  {term.german}
                </h3>
                <p className="text-sm font-medium text-[#6B7280] mb-6 flex-grow">
                  {term.english}
                </p>
                
                {term.example && (
                  <div className="mt-auto pt-4 border-t border-[#F3F4F6]">
                    <p className="text-xs text-[#9CA3AF] italic leading-relaxed">
                      &quot;{term.example}&quot;
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredTerms.length === 0 && (
          <div className="text-center py-24">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-[24px] bg-white border border-[#E5E7EB] mb-6 shadow-sm">
              <Search className="w-10 h-10 text-[#D1D5DB]" />
            </div>
            <h3 className="text-2xl font-bold text-[#111827] mb-3">Keine Begriffe gefunden</h3>
            <p className="text-[#6B7280] font-medium">
              Versuchen Sie es mit einem anderen Suchbegriff oder einer anderen Kategorie.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
