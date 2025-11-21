import React, { useEffect } from 'react';
import { X } from './Icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 transition-opacity">
      <div className={`bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full ${maxWidth} transform transition-all flex flex-col max-h-[90vh]`}>
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h3 className="text-xl font-semibold text-slate-100">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-full hover:bg-slate-800">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar text-slate-300">
          {children}
        </div>
      </div>
    </div>
  );
};