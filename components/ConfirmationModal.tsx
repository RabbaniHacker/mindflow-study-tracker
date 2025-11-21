import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle } from './Icons';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDangerous = false
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDangerous ? 'bg-rose-500/20 text-rose-500' : 'bg-indigo-500/20 text-indigo-500'}`}>
          <AlertTriangle size={24} />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-slate-200">{title}</h3>
          <p className="text-slate-400 text-sm">{message}</p>
        </div>

        <div className="flex gap-3 w-full pt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors font-medium text-sm"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 px-4 py-2.5 rounded-xl text-white font-medium text-sm transition-colors shadow-lg ${
              isDangerous 
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-900/20' 
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-900/20'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};