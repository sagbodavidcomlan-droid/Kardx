import React, { useState } from 'react';
import { 
  X, 
  Bookmark, 
  Sparkles, 
  Check, 
  Calendar, 
  Tag as TagIcon, 
  Zap, 
  Database, 
  User 
} from 'lucide-react';
import { LeadFilterState, SavedLeadFilter } from '../../types/savedFilters';
import { getDatePresetLabel } from '../../utils/savedFiltersStorage';

interface SavedFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFilterState: LeadFilterState;
  onSaveFilter: (newFilter: Omit<SavedLeadFilter, 'id' | 'createdAt'>) => void;
}

export const SavedFiltersModal: React.FC<SavedFiltersModalProps> = ({
  isOpen,
  onClose,
  currentFilterState,
  onSaveFilter,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('🌟');
  const [selectedColor, setSelectedColor] = useState<SavedLeadFilter['color']>('indigo');

  if (!isOpen) return null;

  const iconOptions = ['🌟', '⚡', '🎯', '⏰', '📸', '🤝', '💼', '🚀', '🔥', '🏢', '🏷️', '💎'];
  const colorOptions: { id: SavedLeadFilter['color']; label: string; bg: string }[] = [
    { id: 'indigo', label: 'Indigo', bg: 'bg-indigo-600' },
    { id: 'emerald', label: 'Émeraude', bg: 'bg-emerald-600' },
    { id: 'amber', label: 'Ambre', bg: 'bg-amber-500' },
    { id: 'rose', label: 'Rose', bg: 'bg-rose-500' },
    { id: 'sky', label: 'Ciel', bg: 'bg-sky-500' },
    { id: 'purple', label: 'Violet', bg: 'bg-purple-600' },
    { id: 'slate', label: 'Ardoise', bg: 'bg-slate-700' },
  ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSaveFilter({
      name: `${selectedIcon} ${name.trim()}`,
      description: description.trim() || 'Filtre personnalisé sauvegardé',
      icon: selectedIcon,
      color: selectedColor,
      filterState: currentFilterState,
    });

    setName('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800">Enregistrer la Vue Filtrée</h3>
              <p className="text-xs text-slate-500">Sauvegardez cette configuration pour y accéder en 1 clic</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-6 flex flex-col gap-4">
          
          {/* Filter Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Nom du filtre sauvegardé *
            </label>
            <input
              type="text"
              required
              placeholder="ex: Prospects VIP Décideurs Salon 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Description (optionnelle)
            </label>
            <input
              type="text"
              placeholder="ex: Prospects qualifiés récoltés lors du salon tech"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Icon Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Icône représentative
            </label>
            <div className="flex flex-wrap gap-2">
              {iconOptions.map((emoji) => (
                <button
                  type="button"
                  key={emoji}
                  onClick={() => setSelectedIcon(emoji)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-base transition cursor-pointer border ${
                    selectedIcon === emoji
                      ? 'bg-indigo-50 border-indigo-400 scale-105 shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Color Badge */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Couleur d'accentuation
            </label>
            <div className="flex items-center gap-2">
              {colorOptions.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setSelectedColor(c.id)}
                  className={`w-7 h-7 rounded-full ${c.bg} flex items-center justify-center text-white transition cursor-pointer ${
                    selectedColor === c.id ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'opacity-80 hover:opacity-100'
                  }`}
                  title={c.label}
                >
                  {selectedColor === c.id && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Summary Box */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col gap-1.5 mt-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Critères inclus dans cette sauvegarde :
            </span>
            <div className="text-xs text-slate-700 flex flex-wrap gap-1.5 mt-0.5">
              {currentFilterState.searchQuery && (
                <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-mono text-[11px]">
                  Texte: "{currentFilterState.searchQuery}"
                </span>
              )}
              {currentFilterState.dateRangePreset !== 'all' && (
                <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-mono text-[11px]">
                  Date: {getDatePresetLabel(currentFilterState.dateRangePreset)}
                </span>
              )}
              {currentFilterState.sources.length > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-mono text-[11px]">
                  Sources: {currentFilterState.sources.join(', ')}
                </span>
              )}
              {currentFilterState.selectedTags.length > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-mono text-[11px]">
                  Tags: {currentFilterState.selectedTags.join(', ')}
                </span>
              )}
              {currentFilterState.statuses.length > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-mono text-[11px]">
                  Statuts: {currentFilterState.statuses.join(', ')}
                </span>
              )}
              {currentFilterState.onlyFavorites && (
                <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-mono text-[11px]">
                  Favoris
                </span>
              )}
              {currentFilterState.hasReminder && (
                <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-mono text-[11px]">
                  Avec Rappel
                </span>
              )}
              {currentFilterState.crmSyncFilter !== 'all' && (
                <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-mono text-[11px]">
                  CRM: {currentFilterState.crmSyncFilter}
                </span>
              )}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-indigo-900/15 transition cursor-pointer flex items-center gap-1.5"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Enregistrer le filtre</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
