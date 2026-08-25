import React, { useState } from 'react';
import { Lead } from '../../types';
import { Tag, Plus, X, Check, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

interface BulkTagModalProps {
  selectedLeads: Lead[];
  allAvailableTags: { tag: string; count: number }[];
  isOpen: boolean;
  onClose: () => void;
  onApplyTags: (tagsToAdd: string[], mode: 'append' | 'replace' | 'remove') => void;
}

export const BulkTagModal: React.FC<BulkTagModalProps> = ({
  selectedLeads,
  allAvailableTags,
  isOpen,
  onClose,
  onApplyTags,
}) => {
  const [tagInput, setTagInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [mode, setMode] = useState<'append' | 'replace' | 'remove'>('append');

  if (!isOpen) return null;

  const handleAddTag = (tagToAdd: string) => {
    const clean = tagToAdd.trim().toLowerCase().replace(/^#/, '');
    if (!clean) return;
    if (!selectedTags.includes(clean)) {
      setSelectedTags([...selectedTags, clean]);
    }
    setTagInput('');
  };

  const handleRemoveSelectedTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag(tagInput);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tagInput.trim()) {
      handleAddTag(tagInput);
    }
    if (selectedTags.length === 0 && !tagInput.trim()) return;

    const tagsToSubmit = tagInput.trim() && !selectedTags.includes(tagInput.trim().toLowerCase())
      ? [...selectedTags, tagInput.trim().toLowerCase().replace(/^#/, '')]
      : selectedTags;

    onApplyTags(tagsToSubmit, mode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 text-purple-400 flex items-center justify-center font-bold">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                Gestion des Tags en Masse
              </h3>
              <p className="text-xs text-slate-400">
                Application sur <strong className="text-purple-300">{selectedLeads.length} prospect(s)</strong> sélectionné(s)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/80 hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          
          {/* Operation Mode Tabs */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Action à réaliser
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMode('append')}
                className={`py-2 px-3 rounded-xl font-bold text-xs border transition cursor-pointer flex flex-col items-center gap-1 ${
                  mode === 'append'
                    ? 'bg-purple-50 border-purple-400 text-purple-700 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>➕ Ajouter</span>
                <span className="text-[10px] font-normal text-slate-400">Conserve les tags existants</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('replace')}
                className={`py-2 px-3 rounded-xl font-bold text-xs border transition cursor-pointer flex flex-col items-center gap-1 ${
                  mode === 'replace'
                    ? 'bg-indigo-50 border-indigo-400 text-indigo-700 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>🔄 Remplacer</span>
                <span className="text-[10px] font-normal text-slate-400">Écrase les anciens tags</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('remove')}
                className={`py-2 px-3 rounded-xl font-bold text-xs border transition cursor-pointer flex flex-col items-center gap-1 ${
                  mode === 'remove'
                    ? 'bg-rose-50 border-rose-400 text-rose-700 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>➖ Retirer</span>
                <span className="text-[10px] font-normal text-slate-400">Supprime ce(s) tag(s)</span>
              </button>
            </div>
          </div>

          {/* Tag Input Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>{mode === 'remove' ? 'Tags à retirer :' : 'Tags à assigner :'}</span>
              <span className="text-[11px] font-normal text-slate-400">Appuyez sur Entrée ou virgule</span>
            </label>
            
            <div className="min-h-12 p-2 rounded-2xl border border-slate-300 bg-white focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-purple-500 flex flex-wrap items-center gap-1.5">
              {selectedTags.map((tag) => (
                <span
                  key={tag}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold ${
                    mode === 'remove'
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : 'bg-purple-100 text-purple-800 border border-purple-200'
                  }`}
                >
                  <Tag className="w-3 h-3" />
                  <span>#{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSelectedTag(tag)}
                    className="hover:opacity-75 cursor-pointer ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={selectedTags.length === 0 ? "Ex: vip, salon-2026, chaud..." : "Ajouter un autre tag..."}
                className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-xs font-semibold text-slate-800 p-1"
              />
            </div>
          </div>

          {/* Quick Existing Tags Selection */}
          {allAvailableTags.length > 0 && (
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-500" />
                Tags existants dans votre organisation :
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                {allAvailableTags.map(({ tag, count }) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          handleRemoveSelectedTag(tag);
                        } else {
                          handleAddTag(tag);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 border ${
                        isSelected
                          ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Tag className="w-3 h-3" />
                      <span>#{tag}</span>
                      <span className={`text-[10px] ${isSelected ? 'text-purple-200' : 'text-slate-400'}`}>
                        ({count})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Selected Leads Sample */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">
              Prospects ciblés : <strong className="text-slate-900">{selectedLeads.length}</strong>
            </span>
            <span className="text-[11px] text-slate-500 truncate max-w-[200px]">
              {selectedLeads.slice(0, 3).map(l => `${l.firstName} ${l.lastName}`).join(', ')}
              {selectedLeads.length > 3 ? ` + ${selectedLeads.length - 3} autres` : ''}
            </span>
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl text-slate-600 hover:text-slate-800 text-xs font-semibold transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={selectedTags.length === 0 && !tagInput.trim()}
              className="py-2.5 px-5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center gap-2 shadow-xs transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {mode === 'append'
                  ? `Ajouter aux ${selectedLeads.length} prospects`
                  : mode === 'replace'
                  ? `Remplacer sur ${selectedLeads.length} prospects`
                  : `Retirer de ${selectedLeads.length} prospects`}
              </span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
