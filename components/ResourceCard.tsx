import React, { useState } from 'react';
import { Resource, ResourceStatus } from '../types';
import { 
  Video, FileText, BookOpen, ExternalLink, 
  Trash2, BrainCircuit, Tag, Lock, Signal, Hourglass
} from './Icons';
import { generateStudyInsights } from '../services/geminiService';

interface ResourceCardProps {
  resource: Resource;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: ResourceStatus) => void;
  onUpdateAnalysis: (id: string, analysis: any) => void;
  onOpenAnalysis: (resource: Resource) => void;
  readOnly?: boolean;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({ 
  resource, 
  onDelete, 
  onStatusChange,
  onUpdateAnalysis,
  onOpenAnalysis,
  readOnly = false
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const getIcon = () => {
    switch (resource.type) {
      case 'Video': return <Video className="text-rose-400" size={20} />;
      case 'Reading': return <BookOpen className="text-emerald-400" size={20} />;
      case 'Practice': return <FileText className="text-indigo-400" size={20} />;
      default: return <ExternalLink className="text-slate-400" size={20} />;
    }
  };

  const getStatusColor = () => {
    switch (resource.status) {
      case 'Completed': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'In Progress': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default: return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const getDifficultyColor = () => {
    switch (resource.difficulty) {
      case 'Beginner': return 'text-emerald-400';
      case 'Intermediate': return 'text-amber-400';
      case 'Advanced': return 'text-rose-400';
      default: return 'text-slate-400';
    }
  };

  const handleAnalyze = async () => {
    if (resource.aiAnalysis) {
      onOpenAnalysis(resource);
      return;
    }

    setIsAnalyzing(true);
    try {
      const analysis = await generateStudyInsights(resource.title, resource.url, resource.description);
      onUpdateAnalysis(resource.id, analysis);
      onOpenAnalysis({ ...resource, aiAnalysis: analysis });
    } catch (e) {
      alert("Failed to generate insights. Please check your API key.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="group bg-slate-900 rounded-xl border border-slate-800 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col overflow-hidden relative">
      {/* Status Line */}
      <div className={`h-1 w-full ${resource.status === 'Completed' ? 'bg-emerald-500' : resource.status === 'In Progress' ? 'bg-amber-500' : 'bg-slate-700'}`} />
      
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-slate-800 rounded-lg border border-slate-700 shadow-sm">{getIcon()}</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{resource.type}</span>
          </div>
          
          <div className="relative z-10">
             {readOnly ? (
               <span className={`text-xs font-medium px-2 py-1 rounded-full border ${getStatusColor()} cursor-default`}>
                 {resource.status}
               </span>
             ) : (
               <select 
                value={resource.status}
                onChange={(e) => onStatusChange(resource.id, e.target.value as ResourceStatus)}
                className={`text-xs font-medium px-2 py-1 rounded-full border appearance-none cursor-pointer outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-slate-900 focus:ring-indigo-500 bg-transparent ${getStatusColor()}`}
               >
                 <option value="To Do" className="bg-slate-900 text-slate-300">To Do</option>
                 <option value="In Progress" className="bg-slate-900 text-amber-400">In Progress</option>
                 <option value="Completed" className="bg-slate-900 text-emerald-400">Completed</option>
               </select>
             )}
          </div>
        </div>

        <h3 className="font-bold text-slate-100 mb-2 line-clamp-2 leading-tight group-hover:text-indigo-400 transition-colors">
          <a href={resource.url} target="_blank" rel="noreferrer" className="hover:underline decoration-indigo-500/50">
            {resource.title}
          </a>
        </h3>
        
        <p className="text-slate-400 text-sm mb-4 line-clamp-2">{resource.description}</p>

        {/* Metadata Row */}
        <div className="flex flex-wrap gap-3 mb-4 text-xs text-slate-500">
           <div className="flex items-center gap-1" title="Difficulty">
             <Signal size={12} className={getDifficultyColor()} />
             <span>{resource.difficulty || 'Intermediate'}</span>
           </div>
           <div className="flex items-center gap-1" title="Estimated Time">
             <Hourglass size={12} className="text-slate-400" />
             <span>{resource.length || 'Medium'}</span>
           </div>
        </div>

        {resource.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4 mt-auto">
            {resource.tags.slice(0, 4).map(tag => (
              <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                <Tag size={10} className="mr-1" /> {tag}
              </span>
            ))}
            {resource.tags.length > 4 && (
              <span className="text-xs text-slate-600 px-1">+{resource.tags.length - 4}</span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-slate-800 mt-auto">
          <button 
            type="button"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className={`flex items-center gap-1.5 text-sm font-medium transition-colors z-10 ${resource.aiAnalysis ? 'text-indigo-400 hover:text-indigo-300' : 'text-slate-400 hover:text-indigo-400'}`}
          >
            <BrainCircuit size={16} className={isAnalyzing ? 'animate-pulse text-indigo-500' : ''} />
            {isAnalyzing ? 'Thinking...' : resource.aiAnalysis ? 'View Insights' : 'AI Insights'}
          </button>
          
          <div className="flex items-center gap-1 z-10">
             <a href={resource.url} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-slate-300 transition-colors p-1.5 rounded-md hover:bg-slate-800">
               <ExternalLink size={16} />
             </a>
             {!readOnly && (
               <button 
                 type="button"
                 onClick={(e) => { 
                   e.stopPropagation(); 
                   e.preventDefault();
                   onDelete(resource.id); 
                 }} 
                 className="text-slate-500 hover:text-rose-400 transition-colors p-1.5 rounded-md hover:bg-slate-800"
                 title="Delete Resource"
                >
                 <Trash2 size={16} />
               </button>
             )}
             {readOnly && (
               <span title="Read Only" className="text-slate-600 p-1.5">
                 <Lock size={16} />
               </span>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};