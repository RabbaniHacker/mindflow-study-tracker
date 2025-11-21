import React, { useState } from 'react';
import { Modal } from './Modal';
import { Board, AccessLevel, SharedUser } from '../types';
import { 
  Globe, Lock, Copy, UserPlus, LinkIcon, 
  Check, Trash2, Shield, Mail, Users
} from './Icons';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  board: Board;
  onUpdateBoard: (updatedBoard: Board) => void;
  currentUserEmail: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({ 
  isOpen, 
  onClose, 
  board, 
  onUpdateBoard,
  currentUserEmail
}) => {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<AccessLevel>('viewer');
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    const link = `${window.location.origin}/board/${board.id}`; // Simulated link
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || inviteEmail === currentUserEmail) return;
    
    // Check if already shared
    if (board.sharedWith.some(u => u.email === inviteEmail)) {
      alert("User already has access");
      return;
    }

    const updatedBoard = {
      ...board,
      sharedWith: [...board.sharedWith, { email: inviteEmail, accessLevel: inviteRole }]
    };
    onUpdateBoard(updatedBoard);
    setInviteEmail('');
  };

  const handleRemoveUser = (emailToRemove: string) => {
    const updatedBoard = {
      ...board,
      sharedWith: board.sharedWith.filter(u => u.email !== emailToRemove)
    };
    onUpdateBoard(updatedBoard);
  };

  const handleUpdatePublicAccess = (access: AccessLevel | 'none') => {
    onUpdateBoard({ ...board, publicAccess: access });
  };

  const handleUpdateUserRole = (email: string, newRole: AccessLevel) => {
    const updatedBoard = {
      ...board,
      sharedWith: board.sharedWith.map(u => 
        u.email === email ? { ...u, accessLevel: newRole } : u
      )
    };
    onUpdateBoard(updatedBoard);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Share "${board.title}"`} maxWidth="max-w-xl">
      <div className="space-y-6 text-slate-300">
        
        {/* Invite Section */}
        <div className="space-y-3">
          <form onSubmit={handleInvite} className="flex gap-2">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="email"
                placeholder="Add people by email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm text-slate-200 placeholder-slate-500"
              />
            </div>
            <select 
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as AccessLevel)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
            </select>
            <button 
              type="submit"
              disabled={!inviteEmail}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Invite
            </button>
          </form>
        </div>

        {/* People with Access List */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">People with access</h4>
          <div className="space-y-3 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
            
            {/* Owner (You) */}
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs font-bold border border-indigo-500/30">
                  You
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">{currentUserEmail} (You)</p>
                  <p className="text-xs text-slate-500">Owner</p>
                </div>
              </div>
            </div>

            {/* Shared Users */}
            {board.sharedWith.map((user) => (
              <div key={user.email} className="flex items-center justify-between group p-2 rounded-lg hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 text-xs font-bold uppercase border border-slate-700">
                    {user.email.slice(0,2)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">{user.email}</p>
                    <p className="text-xs text-slate-500">{user.accessLevel === 'editor' ? 'Editor' : 'Viewer'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select 
                    value={user.accessLevel}
                    onChange={(e) => handleUpdateUserRole(user.email, e.target.value as AccessLevel)}
                    className="text-xs bg-transparent border-none text-slate-400 focus:ring-0 cursor-pointer hover:text-indigo-400"
                  >
                    <option value="viewer" className="bg-slate-900">Viewer</option>
                    <option value="editor" className="bg-slate-900">Editor</option>
                  </select>
                  <button 
                    onClick={() => handleRemoveUser(user.email)}
                    className="text-slate-500 hover:text-rose-400 p-1 opacity-0 group-hover:opacity-100 transition-all"
                    title="Remove access"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* General Access Section */}
        <div className="pt-4 border-t border-slate-800">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">General Access</h4>
          <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg border border-slate-800">
             <div className="flex items-center gap-3">
               <div className={`p-2 rounded-full ${board.publicAccess === 'none' ? 'bg-slate-700 text-slate-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                 {board.publicAccess === 'none' ? <Lock size={18} /> : <Globe size={18} />}
               </div>
               <div>
                 <select 
                    value={board.publicAccess}
                    onChange={(e) => handleUpdatePublicAccess(e.target.value as any)}
                    className="bg-transparent font-medium text-sm text-slate-200 focus:ring-0 border-none p-0 cursor-pointer"
                 >
                   <option value="none" className="bg-slate-900">Restricted</option>
                   <option value="viewer" className="bg-slate-900">Anyone with the link can view</option>
                   <option value="editor" className="bg-slate-900">Anyone with the link can edit</option>
                 </select>
                 <p className="text-xs text-slate-500">
                   {board.publicAccess === 'none' 
                     ? 'Only people with access can open with the link' 
                     : 'Anyone on the internet with the link can access'}
                 </p>
               </div>
             </div>
          </div>
        </div>

        {/* Link Copy Section */}
        <div className="flex justify-between items-center pt-2">
          <button 
            onClick={handleCopyLink}
            className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors border border-indigo-500/30"
          >
            {copied ? <Check size={16} /> : <LinkIcon size={16} />}
            {copied ? 'Link Copied' : 'Copy Link'}
          </button>
          <button onClick={onClose} className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-900/20">
            Done
          </button>
        </div>

      </div>
    </Modal>
  );
};