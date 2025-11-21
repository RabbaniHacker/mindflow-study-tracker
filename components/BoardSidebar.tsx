import React, { useState } from 'react';
import { Board } from '../types';
import { Layout, Plus, GraduationCap, Share2, Sparkles, Users, Globe, Trash2 } from './Icons';

interface BoardSidebarProps {
  boards: Board[];
  activeBoardId: string | null;
  onSelectBoard: (id: string) => void;
  onAddBoard: (title: string, description: string) => void;
  onShareBoard: (id: string) => void;
  onDeleteBoard: (id: string) => void;
  className?: string;
  currentUserEmail: string;
}

export const BoardSidebar: React.FC<BoardSidebarProps> = ({ 
  boards, 
  activeBoardId, 
  onSelectBoard, 
  onAddBoard,
  onShareBoard,
  onDeleteBoard,
  className,
  currentUserEmail
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddBoard(newTitle, "Custom Board");
    setNewTitle('');
    setIsAdding(false);
  };

  const isShared = (board: Board) => {
    return board.sharedWith.length > 0 || board.publicAccess !== 'none';
  };

  return (
    <div className={`bg-slate-900 border-r border-slate-800 flex flex-col h-full ${className}`}>
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
           <GraduationCap className="text-white" size={24} />
        </div>
        <div>
          <h1 className="font-bold text-slate-100 text-lg leading-none">MindFlow</h1>
          <span className="text-xs text-slate-400 font-medium">Study Tracker</span>
        </div>
      </div>

      <div className="p-4 flex-grow overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between mb-4 px-2">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Your Boards</h2>
          <button 
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            className="text-slate-500 hover:text-indigo-400 transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>

        {isAdding && (
          <form onSubmit={handleAddSubmit} className="mb-4 px-2 animate-in fade-in slide-in-from-top-2">
            <input
              autoFocus
              type="text"
              placeholder="Board name..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-lg border border-indigo-500/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-800 text-slate-100 placeholder-slate-500"
              onBlur={() => !newTitle && setIsAdding(false)}
            />
          </form>
        )}

        <ul className="space-y-1">
          {boards.map(board => {
            const isOwner = board.ownerId === currentUserEmail;
            
            return (
              <li key={board.id} className="group relative">
                <button
                  type="button"
                  onClick={() => onSelectBoard(board.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border border-transparent relative z-0
                    ${activeBoardId === board.id 
                      ? 'bg-slate-800 text-indigo-400 border-slate-700/50 shadow-sm' 
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                    }`}
                >
                  <div className="relative">
                    <Layout size={18} className={activeBoardId === board.id ? 'text-indigo-400' : 'text-slate-500'} />
                    {isShared(board) && (
                      <span className="absolute -bottom-1 -right-1 bg-slate-900 rounded-full ring-2 ring-slate-900">
                        {board.publicAccess !== 'none' 
                          ? <Globe size={10} className="text-emerald-400" />
                          : <Users size={10} className="text-indigo-400" />
                        }
                      </span>
                    )}
                  </div>
                  <span className="truncate text-left flex-1">{board.title}</span>
                </button>
                
                {/* Actions - Added z-10 to sit on top of the main button */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  {isOwner && (
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onShareBoard(board.id); }}
                      className="text-slate-400 hover:text-indigo-400 p-1.5 rounded-md hover:bg-slate-700 transition-all"
                      title="Share Board"
                    >
                      <Share2 size={14} />
                    </button>
                  )}
                   {isOwner && (
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onDeleteBoard(board.id); }}
                      className="text-slate-400 hover:text-rose-400 p-1.5 rounded-md hover:bg-slate-700 transition-all"
                      title="Delete Board"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        
        {boards.length === 0 && !isAdding && (
            <div className="text-center py-8 px-4">
                <p className="text-slate-500 text-sm">No boards yet. Create one to get started!</p>
                <button 
                  type="button"
                  onClick={() => setIsAdding(true)}
                  className="mt-2 text-indigo-400 text-sm font-medium hover:text-indigo-300 hover:underline"
                >
                    + Create Board
                </button>
            </div>
        )}
      </div>

      {/* User Profile Mini */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
         <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center text-xs font-bold uppercase shadow-lg">
              {currentUserEmail.substring(0, 2)}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-200 truncate">{currentUserEmail}</p>
              <p className="text-[10px] text-slate-500">Free Plan</p>
            </div>
         </div>
      </div>
    </div>
  );
};