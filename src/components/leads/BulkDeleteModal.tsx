import React from 'react';
import { Lead } from '../../types';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface BulkDeleteModalProps {
  selectedLeads: Lead[];
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: () => void;
}

export const BulkDeleteModal: React.FC<BulkDeleteModalProps> = ({
  selectedLeads,
  isOpen,
  onClose,
  onConfirmDelete,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-rose-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 text-white flex items-center justify-center font-bold">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight text-white">
                Supprimer {selectedLeads.length} prospect{selectedLeads.length > 1 ? 's' : ''}
              </h3>
              <p className="text-xs text-rose-100">
                Action de suppression définitive
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-xl bg-white/10 hover:bg-white/20 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs text-slate-700">
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-900">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold">Attention : Cette action est irréversible.</p>
              <p className="text-rose-700">
                Les coordonnées, interactions, rappels et données de scan associées à ces <strong>{selectedLeads.length} contact(s)</strong> seront définitivement effacés.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Aperçu des contacts ciblés :
            </label>
            <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-slate-50/50 p-2">
              {selectedLeads.map((lead) => (
                <div key={lead.id} className="py-1.5 px-2 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                      {lead.firstName[0]}{lead.lastName[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 truncate">
                        {lead.firstName} {lead.lastName}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {lead.company || lead.email}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">
                    {lead.source}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 rounded-xl text-slate-600 hover:text-slate-800 text-xs font-semibold transition cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirmDelete();
              onClose();
            }}
            className="py-2.5 px-5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Confirmer la suppression</span>
          </button>
        </div>
      </div>
    </div>
  );
};
