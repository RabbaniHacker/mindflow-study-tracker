import React, { useState } from 'react';
import { Modal } from './Modal';
import { AIAnalysis, Resource } from '../types';
import { BrainCircuit, ChevronRight, FileText, RefreshCw } from './Icons';

interface AIInsightsModalProps {
  resource: Resource | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AIInsightsModal: React.FC<AIInsightsModalProps> = ({ resource, isOpen, onClose }) => {
  const [flippedCard, setFlippedCard] = useState<number | null>(null);

  if (!resource || !resource.aiAnalysis) return null;

  const { summary, keyPoints, flashcards } = resource.aiAnalysis;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI Study Companion" maxWidth="max-w-3xl">
      <div className="space-y-8">
        {/* Header Info */}
        <div>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Analyzing</h4>
          <h2 className="text-2xl font-bold text-slate-100">{resource.title}</h2>
        </div>

        {/* Summary Section */}
        <div className="bg-indigo-900/20 rounded-xl p-6 border border-indigo-500/20">
          <div className="flex items-center gap-2 mb-3">
            <BrainCircuit className="text-indigo-400" size={20} />
            <h3 className="font-bold text-indigo-200">Summary</h3>
          </div>
          <p className="text-indigo-100/80 leading-relaxed text-sm md:text-base">{summary}</p>
        </div>

        {/* Key Points */}
        <div>
           <div className="flex items-center gap-2 mb-4">
            <FileText className="text-slate-400" size={20} />
            <h3 className="font-bold text-slate-200">Key Takeaways</h3>
          </div>
          <ul className="grid gap-3 md:grid-cols-2">
            {keyPoints.map((point, i) => (
              <li key={i} className="bg-slate-800 p-4 rounded-lg border border-slate-700 shadow-sm flex items-start gap-3 hover:border-slate-600 transition-colors">
                <span className="flex-shrink-0 w-6 h-6 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 border border-indigo-500/20">
                  {i + 1}
                </span>
                <span className="text-slate-300 text-sm">{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Flashcards */}
        <div>
           <div className="flex items-center gap-2 mb-4">
            <RefreshCw className="text-slate-400" size={20} />
            <h3 className="font-bold text-slate-200">Revision Flashcards</h3>
          </div>
          
          <div className="grid gap-4 md:grid-cols-3">
            {flashcards.map((card, i) => (
              <div 
                key={i}
                className="h-64 perspective group cursor-pointer"
                onClick={() => setFlippedCard(flippedCard === i ? null : i)}
              >
                 <div className={`relative w-full h-full transition-all duration-500 transform preserve-3d ${flippedCard === i ? 'rotate-y-180' : ''}`}>
                    {/* Front */}
                    <div className="absolute inset-0 backface-hidden bg-slate-800 border border-slate-700 rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md hover:border-indigo-500/50 transition-all">
                       <span className="text-xs font-bold text-indigo-400 uppercase mb-3 tracking-widest">Question</span>
                       <p className="text-slate-200 font-medium">{card.front}</p>
                       <div className="mt-auto pt-4 text-slate-500 text-xs flex items-center gap-1">
                          Tap to reveal <ChevronRight size={12} />
                       </div>
                    </div>

                    {/* Back */}
                    <div className="absolute inset-0 backface-hidden rotate-y-180 bg-indigo-900 rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-xl border border-indigo-800">
                       <span className="text-xs font-bold text-emerald-400 uppercase mb-3 tracking-widest">Answer</span>
                       <p className="text-indigo-100 font-medium">{card.back}</p>
                    </div>
                 </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};