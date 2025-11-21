import React, { useState, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { BoardSidebar } from './components/BoardSidebar';
import { ResourceCard } from './components/ResourceCard';
import { AIInsightsModal } from './components/AIInsightsModal';
import { ShareModal } from './components/ShareModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { Modal } from './components/Modal';
import { Board, Resource, FilterState, ResourceType, ResourceStatus, UserProfile, DifficultyLevel, ResourceLength, UserAccount } from './types';
import { analyzeUrlMetadata } from './services/geminiService';
import { 
  Search, Plus, Menu, BrainCircuit, LogOut, Lock, Tag, X,
  Filter, Signal, Hourglass, Eye, EyeOff, Mail, UserPlus, Check
} from './components/Icons';

// --- Styles to support 3D card flip & Scrollbar ---
const styles = `
  .perspective { perspective: 1000px; }
  .preserve-3d { transform-style: preserve-3d; }
  .backface-hidden { backface-visibility: hidden; }
  .rotate-y-180 { transform: rotateY(180deg); }
  
  .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: #0f172a; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
  
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }
  .animate-shake { animation: shake 0.3s ease-in-out; }
`;

const App: React.FC = () => {
  // --- User Session State ---
  const [user, setUser] = useState<UserProfile | null>(null);
  
  // --- Auth Form State ---
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authData, setAuthData] = useState({ name: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  
  // --- App State ---
  const [boards, setBoards] = useState<Board[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Modal States
  const [selectedResourceForAI, setSelectedResourceForAI] = useState<Resource | null>(null);
  const [isAddResourceOpen, setIsAddResourceOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [boardToShare, setBoardToShare] = useState<Board | null>(null);

  // Delete Confirmation State
  const [resourceToDelete, setResourceToDelete] = useState<string | null>(null);
  const [boardToDelete, setBoardToDelete] = useState<string | null>(null);

  // Add Resource Form State
  const [resourceStep, setResourceStep] = useState<'url' | 'details'>('url');
  const [draftResource, setDraftResource] = useState<Partial<Resource>>({});
  const [isProcessingUrl, setIsProcessingUrl] = useState(false);
  const [tagInput, setTagInput] = useState('');

  // Filter State
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    type: 'All',
    status: 'All',
    difficulty: 'All',
    length: 'All',
    tags: []
  });

  // --- Initialization ---
  useEffect(() => {
    const savedSession = localStorage.getItem('mindflow_session');
    if (savedSession) {
      setUser(JSON.parse(savedSession));
    }
  }, []);

  // --- Auth Handlers ---
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    
    if (!authData.email || !authData.password) {
      setAuthError('Please fill in all fields');
      return;
    }
    if (authMode === 'signup' && !authData.name) {
      setAuthError('Please enter your name');
      return;
    }

    setIsAuthLoading(true);

    // Simulate network delay
    setTimeout(() => {
      const usersDbStr = localStorage.getItem('mindflow_users_db');
      const usersDb: UserAccount[] = usersDbStr ? JSON.parse(usersDbStr) : [];
      
      if (authMode === 'signup') {
        // Check if user exists
        if (usersDb.find(u => u.email === authData.email)) {
          setAuthError('Account already exists with this email.');
          setIsAuthLoading(false);
          return;
        }
        
        const newUser: UserAccount = {
          id: uuidv4(),
          name: authData.name,
          email: authData.email,
          passwordHash: btoa(authData.password), // Simple encoding for demo. Use bcrypt in real app.
          createdAt: new Date().toISOString()
        };
        
        localStorage.setItem('mindflow_users_db', JSON.stringify([...usersDb, newUser]));
        
        const userProfile: UserProfile = { id: newUser.id, name: newUser.name, email: newUser.email };
        loginUser(userProfile);
        
      } else {
        // Sign In
        const foundUser = usersDb.find(u => u.email === authData.email);
        if (foundUser && foundUser.passwordHash === btoa(authData.password)) {
          const userProfile: UserProfile = { id: foundUser.id, name: foundUser.name, email: foundUser.email };
          loginUser(userProfile);
        } else {
          setAuthError('Invalid email or password.');
        }
      }
      setIsAuthLoading(false);
    }, 800);
  };

  const loginUser = (userProfile: UserProfile) => {
    setUser(userProfile);
    localStorage.setItem('mindflow_session', JSON.stringify(userProfile));
    // Reset form
    setAuthData({ name: '', email: '', password: '' });
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('mindflow_session');
    setBoards([]);
    setResources([]);
    setActiveBoardId(null);
  };

  // --- Data Persistence ---
  useEffect(() => {
    if (!user) return;

    const savedBoards = localStorage.getItem(`mindflow_boards_${user.email}`); 
    const legacyBoards = localStorage.getItem('mindflow_boards'); 

    if (savedBoards) {
      setBoards(JSON.parse(savedBoards));
    } else if (legacyBoards) {
      // Migration path for old data if active email matches
      const allLegacy = JSON.parse(legacyBoards);
      const migrated = allLegacy.map((b: any) => ({
        ...b,
        ownerId: b.ownerId || user.email, // Claim ownership if none
        sharedWith: b.sharedWith || [],
        publicAccess: b.publicAccess || 'none'
      }));
      setBoards(migrated);
    } else {
      setBoards([]);
    }
    
    // Note: In a real app, resources would be fetched by board ID from backend
    // Here we load all and filter in memory or load user specific if we separated keys
    const savedResources = localStorage.getItem(`mindflow_resources_${user.email}`); 
    if (savedResources) {
      setResources(JSON.parse(savedResources));
    } else {
      // Try legacy
      const legacyRes = localStorage.getItem('mindflow_resources');
      if (legacyRes) setResources(JSON.parse(legacyRes));
      else setResources([]);
    }

  }, [user]);

  useEffect(() => {
    if (!user) return;
    localStorage.setItem(`mindflow_boards_${user.email}`, JSON.stringify(boards));
    localStorage.setItem(`mindflow_resources_${user.email}`, JSON.stringify(resources));
  }, [boards, resources, user]);

  // Default selection
  useEffect(() => {
    if (boards.length > 0 && !activeBoardId) {
      setActiveBoardId(boards[0].id);
    }
  }, [boards, activeBoardId]);


  // --- Derived State (Permissions) ---
  const activeBoard = useMemo(() => boards.find(b => b.id === activeBoardId), [boards, activeBoardId]);
  
  const canEdit = useMemo(() => {
    if (!activeBoard || !user) return false;
    if (activeBoard.ownerId === user.email) return true;
    
    const shareInfo = activeBoard.sharedWith.find(u => u.email === user.email);
    if (shareInfo?.accessLevel === 'editor') return true;
    
    if (activeBoard.publicAccess === 'editor') return true;
    
    return false;
  }, [activeBoard, user]);


  // --- Actions ---
  const handleAddBoard = (title: string, description: string) => {
    if (!user) return;
    const newBoard: Board = {
      id: uuidv4(),
      title,
      description,
      createdAt: new Date().toISOString(),
      ownerId: user.email,
      sharedWith: [],
      publicAccess: 'none'
    };
    setBoards(prev => [...prev, newBoard]);
    setActiveBoardId(newBoard.id);
  };

  const requestDeleteBoard = (id: string) => {
    setBoardToDelete(id);
  };

  const confirmDeleteBoard = () => {
    if (!boardToDelete) return;
    
    setBoards(prev => {
      const newBoards = prev.filter(b => b.id !== boardToDelete);
      // If we deleted the active board, switch to another one
      if (activeBoardId === boardToDelete) {
        setActiveBoardId(newBoards.length > 0 ? newBoards[0].id : null);
      }
      return newBoards;
    });
    
    // Also delete resources for this board
    setResources(prev => prev.filter(r => r.boardId !== boardToDelete));
    setBoardToDelete(null);
  };

  const requestDeleteResource = (id: string) => {
    setResourceToDelete(id);
  };

  const confirmDeleteResource = () => {
    if (resourceToDelete) {
      setResources(prev => prev.filter(r => r.id !== resourceToDelete));
      setResourceToDelete(null);
    }
  };

  // --- Add Resource Workflow ---
  const openAddResourceModal = () => {
    setResourceStep('url');
    setDraftResource({});
    setTagInput('');
    setIsAddResourceOpen(true);
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = draftResource.url;
    if (!url) return;

    setIsProcessingUrl(true);
    const metadata = await analyzeUrlMetadata(url);
    setIsProcessingUrl(false);

    setDraftResource({
      ...draftResource,
      ...metadata,
      url: url // Ensure URL is kept
    });
    setResourceStep('details');
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const currentTags = draftResource.tags || [];
      if (!currentTags.includes(tagInput.trim())) {
        setDraftResource({ ...draftResource, tags: [...currentTags, tagInput.trim()] });
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = draftResource.tags || [];
    setDraftResource({ ...draftResource, tags: currentTags.filter(t => t !== tagToRemove) });
  };

  const handleSaveResource = () => {
    if (!activeBoardId || !draftResource.title) return;

    const newResource: Resource = {
      id: uuidv4(),
      boardId: activeBoardId,
      url: draftResource.url || '',
      title: draftResource.title,
      description: draftResource.description || '',
      type: (draftResource.type as ResourceType) || 'Other',
      difficulty: (draftResource.difficulty as DifficultyLevel) || 'Intermediate',
      length: (draftResource.length as ResourceLength) || 'Medium (10-30m)',
      status: 'To Do',
      tags: draftResource.tags || [],
      createdAt: new Date().toISOString()
    };

    setResources(prev => [newResource, ...prev]);
    setIsAddResourceOpen(false);
  };

  const handleUpdateResourceStatus = (id: string, status: ResourceStatus) => {
    if (!canEdit) return;
    setResources(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const handleUpdateAnalysis = (id: string, analysis: any) => {
    setResources(prev => prev.map(r => r.id === id ? { ...r, aiAnalysis: analysis } : r));
  };

  const filteredResources = resources.filter(r => {
    if (r.boardId !== activeBoardId) return false;
    
    const matchesSearch = r.title.toLowerCase().includes(filters.search.toLowerCase()) || 
                          r.description.toLowerCase().includes(filters.search.toLowerCase()) ||
                          r.tags.some(t => t.toLowerCase().includes(filters.search.toLowerCase()));
    
    const matchesType = filters.type === 'All' || r.type === filters.type;
    const matchesStatus = filters.status === 'All' || r.status === filters.status;
    const matchesDifficulty = filters.difficulty === 'All' || r.difficulty === filters.difficulty;
    const matchesLength = filters.length === 'All' || r.length === filters.length;

    return matchesSearch && matchesType && matchesStatus && matchesDifficulty && matchesLength;
  });

  // --- Render Login / Signup ---
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
        <style>{styles}</style>
        
        {/* Decorative Background */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-indigo-900/20 rounded-full blur-[120px]" />
          <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-violet-900/10 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-md w-full bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl relative z-10">
          <div className="flex flex-col items-center gap-3 mb-8">
             <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 transform rotate-3 hover:rotate-6 transition-transform duration-500">
               <BrainCircuit className="text-white" size={32} />
             </div>
             <div className="text-center">
               <h1 className="text-3xl font-bold text-white tracking-tight">MindFlow</h1>
               <p className="text-slate-400 text-sm mt-1">Your AI-Powered Learning Companion</p>
             </div>
          </div>
          
          <div className="flex items-center justify-center gap-4 mb-6 bg-slate-950/50 p-1 rounded-xl">
            <button 
              onClick={() => { setAuthMode('signin'); setAuthError(''); }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${authMode === 'signin' ? 'bg-slate-800 text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Sign In
            </button>
            <button 
              onClick={() => { setAuthMode('signup'); setAuthError(''); }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${authMode === 'signup' ? 'bg-slate-800 text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-5">
            {authMode === 'signup' && (
              <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
                <div className="relative">
                  <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="text"
                    value={authData.name}
                    onChange={(e) => setAuthData({...authData, name: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/50 border border-slate-800 text-slate-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all placeholder-slate-600"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="email" 
                  value={authData.email} 
                  onChange={(e) => setAuthData({...authData, email: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/50 border border-slate-800 text-slate-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all placeholder-slate-600"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type={showPassword ? "text" : "password"}
                  value={authData.password} 
                  onChange={(e) => setAuthData({...authData, password: e.target.value})}
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-950/50 border border-slate-800 text-slate-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all placeholder-slate-600"
                  placeholder="••••••••"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {authError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-start gap-2 animate-shake">
                <LogOut size={16} className="text-rose-500 mt-0.5" />
                <p className="text-sm text-rose-400">{authError}</p>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isAuthLoading}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-900/20 hover:shadow-indigo-900/40 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {isAuthLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {authMode === 'signin' ? 'Signing In...' : 'Creating Account...'}
                </>
              ) : (
                <>
                  {authMode === 'signin' ? 'Sign In' : 'Create Account'} 
                  <Check size={18} />
                </>
              )}
            </button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-slate-800 text-center">
             <p className="text-slate-500 text-xs">
               {authMode === 'signin' ? "Secure, AI-Enhanced Study Management" : "Join thousands of students learning smarter"}
             </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans selection:bg-indigo-500/30">
      <style>{styles}</style>
      
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 flex-shrink-0 relative z-20`}>
         <BoardSidebar 
           currentUserEmail={user.email}
           boards={boards} 
           activeBoardId={activeBoardId} 
           onSelectBoard={setActiveBoardId} 
           onAddBoard={handleAddBoard}
           onShareBoard={(id) => {
             const b = boards.find(b => b.id === id);
             if (b) { setBoardToShare(b); setIsShareModalOpen(true); }
           }}
           onDeleteBoard={requestDeleteBoard}
           className="h-full w-64"
         />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950 relative">
        {/* Header */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-950/50 backdrop-blur-md z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-400 hover:text-slate-200 p-1">
              <Menu size={20} />
            </button>
            <h2 className="font-bold text-xl text-slate-100 truncate max-w-[200px] md:max-w-md">
              {activeBoard?.title || 'Select a Board'}
            </h2>
            {activeBoard && !canEdit && (
              <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 bg-slate-800 rounded-md text-slate-400 border border-slate-700">
                <Lock size={12} /> View Only
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text" 
                placeholder="Search resources..." 
                value={filters.search}
                onChange={(e) => setFilters(prev => ({...prev, search: e.target.value}))}
                className="bg-slate-900 border border-slate-800 pl-10 pr-4 py-2 rounded-full text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none w-64 text-slate-200 placeholder-slate-600"
              />
            </div>
            
            <div className="h-6 w-px bg-slate-800 mx-2"></div>

            <button onClick={handleLogout} className="text-slate-500 hover:text-rose-400 transition-colors p-2" title="Sign Out">
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* Filter Bar */}
        {activeBoard && (
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/30 flex flex-wrap items-center gap-3 overflow-x-auto">
            <div className="flex items-center gap-2 text-slate-500 text-sm font-medium mr-2">
              <Filter size={16} /> Filters:
            </div>
            
            <select 
              value={filters.type}
              onChange={(e) => setFilters(prev => ({...prev, type: e.target.value as any}))}
              className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 outline-none"
            >
              <option value="All">All Types</option>
              <option value="Video">Video</option>
              <option value="Reading">Reading</option>
              <option value="Practice">Practice</option>
            </select>

            <select 
              value={filters.status}
              onChange={(e) => setFilters(prev => ({...prev, status: e.target.value as any}))}
              className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 outline-none"
            >
              <option value="All">All Status</option>
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>

            <select 
              value={filters.difficulty}
              onChange={(e) => setFilters(prev => ({...prev, difficulty: e.target.value as any}))}
              className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 outline-none"
            >
              <option value="All">All Difficulties</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>

            <select 
              value={filters.length}
              onChange={(e) => setFilters(prev => ({...prev, length: e.target.value as any}))}
              className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 outline-none"
            >
              <option value="All">All Lengths</option>
              <option value="Short (<10m)">Short</option>
              <option value="Medium (10-30m)">Medium</option>
              <option value="Long (>30m)">Long</option>
            </select>

            {activeBoard && canEdit && (
               <button 
                onClick={openAddResourceModal}
                className="ml-auto bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-indigo-900/20"
              >
                <Plus size={16} /> Add Resource
              </button>
            )}
          </div>
        )}

        {/* Resource Grid */}
        <main className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-950">
          {!activeBoard ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500">
              <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center mb-4 border border-slate-800">
                 <BrainCircuit size={48} className="text-slate-700" />
              </div>
              <p className="text-lg font-medium">Select or create a board to start studying</p>
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500">
              <p className="mb-4">No resources found matching your filters.</p>
              {canEdit && filters.type === 'All' && filters.search === '' && (
                 <button 
                  onClick={openAddResourceModal}
                  className="text-indigo-400 hover:text-indigo-300 hover:underline"
                 >
                   Add your first resource
                 </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
              {filteredResources.map(resource => (
                <ResourceCard 
                  key={resource.id} 
                  resource={resource} 
                  onDelete={requestDeleteResource}
                  onStatusChange={handleUpdateResourceStatus}
                  onUpdateAnalysis={handleUpdateAnalysis}
                  onOpenAnalysis={(r) => { setSelectedResourceForAI(r); setIsAIModalOpen(true); }}
                  readOnly={!canEdit}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* --- Modals --- */}
      
      {/* 1. Add Resource Modal */}
      <Modal isOpen={isAddResourceOpen} onClose={() => setIsAddResourceOpen(false)} title={resourceStep === 'url' ? "Add New Resource" : "Edit Resource Details"} maxWidth="max-w-2xl">
        {resourceStep === 'url' ? (
          <form onSubmit={handleUrlSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Resource URL</label>
              <div className="flex gap-2">
                <input 
                  autoFocus
                  type="url" 
                  required
                  placeholder="https://youtube.com/..." 
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={draftResource.url || ''}
                  onChange={(e) => setDraftResource({...draftResource, url: e.target.value})}
                />
              </div>
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                <BrainCircuit size={12} /> AI will auto-detect title, tags, difficulty and type.
              </p>
            </div>
            <div className="flex justify-end pt-2">
               <button 
                type="submit" 
                disabled={!draftResource.url || isProcessingUrl}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessingUrl ? 'Analyzing...' : 'Next'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-5">
             {/* Form Fields for Manual Editing */}
             <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Title</label>
                  <input 
                    type="text"
                    value={draftResource.title || ''}
                    onChange={(e) => setDraftResource({...draftResource, title: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                
                <div>
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Description</label>
                   <textarea 
                     rows={2}
                     value={draftResource.description || ''}
                     onChange={(e) => setDraftResource({...draftResource, description: e.target.value})}
                     className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                   />
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div>
                       <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Type</label>
                       <select 
                         value={draftResource.type}
                         onChange={(e) => setDraftResource({...draftResource, type: e.target.value as ResourceType})}
                         className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 outline-none focus:ring-1 focus:ring-indigo-500"
                       >
                         <option value="Video">Video</option>
                         <option value="Reading">Reading</option>
                         <option value="Practice">Practice</option>
                         <option value="Other">Other</option>
                       </select>
                    </div>
                    <div>
                       <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Difficulty</label>
                       <div className="relative">
                         <Signal size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
                         <select 
                           value={draftResource.difficulty}
                           onChange={(e) => setDraftResource({...draftResource, difficulty: e.target.value as DifficultyLevel})}
                           className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-slate-200 outline-none focus:ring-1 focus:ring-indigo-500"
                         >
                           <option value="Beginner">Beginner</option>
                           <option value="Intermediate">Intermediate</option>
                           <option value="Advanced">Advanced</option>
                         </select>
                       </div>
                    </div>
                    <div>
                       <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Length</label>
                       <div className="relative">
                          <Hourglass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
                          <select 
                            value={draftResource.length}
                            onChange={(e) => setDraftResource({...draftResource, length: e.target.value as ResourceLength})}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-slate-200 outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="Short (<10m)">Short</option>
                            <option value="Medium (10-30m)">Medium</option>
                            <option value="Long (>30m)">Long</option>
                          </select>
                       </div>
                    </div>
                </div>

                <div>
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Tags</label>
                   <div className="bg-slate-800 border border-slate-700 rounded-lg p-2 flex flex-wrap gap-2">
                      {draftResource.tags?.map(tag => (
                        <span key={tag} className="bg-slate-700 text-slate-200 text-xs px-2 py-1 rounded flex items-center gap-1">
                          {tag} <button onClick={() => removeTag(tag)} className="hover:text-rose-400"><X size={12}/></button>
                        </span>
                      ))}
                      <input 
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleAddTag}
                        placeholder="Add tag..."
                        className="bg-transparent outline-none text-sm text-slate-200 placeholder-slate-500 min-w-[80px] flex-1"
                      />
                   </div>
                </div>
             </div>

             <div className="flex justify-between pt-4 border-t border-slate-800 mt-4">
               <button 
                 onClick={() => setResourceStep('url')}
                 className="text-slate-400 hover:text-slate-200 text-sm font-medium px-4 py-2"
               >
                 Back
               </button>
               <button 
                 onClick={handleSaveResource}
                 className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-all shadow-lg shadow-indigo-900/20"
               >
                 Save Resource
               </button>
             </div>
          </div>
        )}
      </Modal>

      {/* 2. AI Insights Modal */}
      <AIInsightsModal 
        resource={selectedResourceForAI} 
        isOpen={isAIModalOpen} 
        onClose={() => setIsAIModalOpen(false)} 
      />

      {/* 3. Share Board Modal */}
      {boardToShare && (
        <ShareModal 
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          board={boardToShare}
          onUpdateBoard={(updated) => {
            setBoards(boards.map(b => b.id === updated.id ? updated : b));
            setBoardToShare(updated);
          }}
          currentUserEmail={user.email}
        />
      )}

      {/* 4. Confirmation Modals */}
      <ConfirmationModal 
        isOpen={!!boardToDelete}
        onClose={() => setBoardToDelete(null)}
        onConfirm={confirmDeleteBoard}
        title="Delete Board?"
        message="This will permanently delete the board and all its resources. This action cannot be undone."
        isDangerous={true}
        confirmText="Delete Board"
      />
      
       <ConfirmationModal 
        isOpen={!!resourceToDelete}
        onClose={() => setResourceToDelete(null)}
        onConfirm={confirmDeleteResource}
        title="Delete Resource?"
        message="Are you sure you want to remove this resource from your board?"
        isDangerous={true}
        confirmText="Remove"
      />

    </div>
  );
};

export default App;