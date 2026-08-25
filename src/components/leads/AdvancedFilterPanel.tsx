import React, { useState } from 'react';
import { 
  Calendar, 
  Tag as TagIcon, 
  Zap, 
  User, 
  Star, 
  Clock, 
  Database, 
  RotateCcw, 
  Bookmark, 
  X, 
  Sparkles,
  ChevronDown,
  Building,
  MapPin,
  Check,
  Filter,
  Plus
} from 'lucide-react';
import { LeadFilterState, DateRangePreset } from '../../types/savedFilters';
import { getDatePresetLabel } from '../../utils/savedFiltersStorage';
import { User as UserType, LeadStatus } from '../../types';

interface AdvancedFilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  filterState: LeadFilterState;
  onUpdateFilter: (updater: (prev: LeadFilterState) => LeadFilterState) => void;
  onResetAll: () => void;
  onOpenSaveModal: () => void;
  allAvailableTags: { tag: string; count: number }[];
  users: UserType[];
  matchingCount: number;
}

export const AdvancedFilterPanel: React.FC<AdvancedFilterPanelProps> = ({
  isOpen,
  onClose,
  filterState,
  onUpdateFilter,
  onResetAll,
  onOpenSaveModal,
  allAvailableTags,
  users,
  matchingCount,
}) => {
  const [customTagInput, setCustomTagInput] = useState('');

  if (!isOpen) return null;

  const datePresets: DateRangePreset[] = [
    'all',
    'today',
    'yesterday',
    'last7days',
    'last30days',
    'thisMonth',
    'lastMonth',
    'custom',
  ];

  const sourceOptions = [
    { id: 'nfc', label: 'NFC Tap Physique', icon: '⚡', color: 'indigo' },
    { id: 'qr', label: 'Scan QR Code', icon: '📱', color: 'blue' },
    { id: 'card_scanner', label: 'Scanner IA (Carte Papier)', icon: '📸', color: 'purple' },
    { id: 'email_signature', label: 'Signature Email', icon: '✉️', color: 'amber' },
    { id: 'direct_url', label: 'Lien Direct Web', icon: '🌐', color: 'emerald' },
    { id: 'manual', label: 'Création Manuelle', icon: '✍️', color: 'slate' },
    { id: 'salon', label: 'Salon & Événement', icon: '🎪', color: 'rose' },
    { id: 'phone', label: 'Appel / Téléphone', icon: '📞', color: 'teal' },
    { id: 'recommendation', label: 'Recommandation', icon: '🤝', color: 'orange' },
    { id: 'linkedin', label: 'LinkedIn & Social', icon: '💼', color: 'sky' },
  ];

  const statusOptions: { id: LeadStatus; label: string; dotColor: string }[] = [
    { id: 'new', label: 'Nouveau', dotColor: 'bg-blue-500' },
    { id: 'contacted', label: 'Contacté', dotColor: 'bg-amber-500' },
    { id: 'qualified', label: 'Qualifié', dotColor: 'bg-indigo-500' },
    { id: 'proposal', label: 'Proposition', dotColor: 'bg-purple-500' },
    { id: 'won', label: 'Gagné / Signé', dotColor: 'bg-emerald-500' },
    { id: 'lost', label: 'Perdu / Sans suite', dotColor: 'bg-rose-500' },
  ];

  const toggleSource = (srcId: string) => {
    onUpdateFilter((prev) => {
      const exists = prev.sources.includes(srcId);
      return {
        ...prev,
        sources: exists ? prev.sources.filter((s) => s !== srcId) : [...prev.sources, srcId],
      };
    });
  };

  const toggleStatus = (statusId: LeadStatus) => {
    onUpdateFilter((prev) => {
      const exists = prev.statuses.includes(statusId);
      return {
        ...prev,
        statuses: exists ? prev.statuses.filter((s) => s !== statusId) : [...prev.statuses, statusId],
      };
    });
  };

  const toggleTag = (tagName: string) => {
    onUpdateFilter((prev) => {
      const exists = prev.selectedTags.includes(tagName);
      return {
        ...prev,
        selectedTags: exists ? prev.selectedTags.filter((t) => t !== tagName) : [...prev.selectedTags, tagName],
      };
    });
  };

  const handleAddCustomTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTagInput.trim()) return;
    const cleanTag = customTagInput.trim();
    if (!filterState.selectedTags.includes(cleanTag)) {
      onUpdateFilter((prev) => ({
        ...prev,
        selectedTags: [...prev.selectedTags, cleanTag],
      }));
    }
    setCustomTagInput('');
  };

  return (
    <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl border border-slate-800 flex flex-col gap-6 animate-in fade-in slide-in-from-top-4 duration-200">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">Filtres Avancés & Multi-Critères</h3>
            <p className="text-xs text-slate-400">Affinez précisément votre portefeuille de prospects</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-bold text-xs">
            {matchingCount} prospect(s) correspondant(s)
          </span>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Fermer le panneau"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* SECTION 1: DATE RANGE */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span>Période de capture</span>
          </span>

          <div className="grid grid-cols-2 gap-1.5">
            {datePresets.map((preset) => {
              const isSelected = filterState.dateRangePreset === preset;
              return (
                <button
                  key={preset}
                  onClick={() =>
                    onUpdateFilter((prev) => ({
                      ...prev,
                      dateRangePreset: preset,
                    }))
                  }
                  className={`py-1.5 px-2.5 rounded-xl text-xs font-medium text-left transition cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-bold shadow-xs'
                      : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <span className="truncate">{getDatePresetLabel(preset)}</span>
                  {isSelected && <Check className="w-3 h-3 shrink-0 ml-1" />}
                </button>
              );
            })}
          </div>

          {/* Custom date range inputs */}
          {filterState.dateRangePreset === 'custom' && (
            <div className="p-3 rounded-2xl bg-slate-800/70 border border-slate-700/80 flex flex-col gap-2.5 mt-1">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-slate-400 font-medium">Date de début :</label>
                <input
                  type="date"
                  value={filterState.customDateStart || ''}
                  onChange={(e) =>
                    onUpdateFilter((prev) => ({
                      ...prev,
                      customDateStart: e.target.value,
                    }))
                  }
                  className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:border-indigo-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-slate-400 font-medium">Date de fin :</label>
                <input
                  type="date"
                  value={filterState.customDateEnd || ''}
                  onChange={(e) =>
                    onUpdateFilter((prev) => ({
                      ...prev,
                      customDateEnd: e.target.value,
                    }))
                  }
                  className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:border-indigo-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* SECTION 2: SOURCES D'ACQUISITION */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Sources de contact ({filterState.sources.length || 'Toutes'})</span>
            </span>
            {filterState.sources.length > 0 && (
              <button
                onClick={() => onUpdateFilter((prev) => ({ ...prev, sources: [] }))}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
              >
                Toutes
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-[160px] overflow-y-auto pr-1">
            {sourceOptions.map((src) => {
              const isSelected = filterState.sources.includes(src.id);
              return (
                <button
                  key={src.id}
                  onClick={() => toggleSource(src.id)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                      : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <span>{src.icon}</span>
                  <span>{src.label}</span>
                  {isSelected && <Check className="w-3 h-3 shrink-0 ml-0.5" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION 3: ÉTIQUETTES / TAGS */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <TagIcon className="w-3.5 h-3.5 text-purple-400" />
              <span>Étiquettes / Tags ({filterState.selectedTags.length || 'Tous'})</span>
            </span>

            {/* Mode OU / ET */}
            <div className="flex items-center rounded-lg bg-slate-800 p-0.5 border border-slate-700">
              <button
                onClick={() => onUpdateFilter((prev) => ({ ...prev, tagMatchMode: 'any' }))}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                  filterState.tagMatchMode === 'any' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Correspond à au moins un tag sélectionné"
              >
                OU
              </button>
              <button
                onClick={() => onUpdateFilter((prev) => ({ ...prev, tagMatchMode: 'all' }))}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                  filterState.tagMatchMode === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Doit contenir tous les tags sélectionnés"
              >
                ET
              </button>
            </div>
          </div>

          {/* Quick add custom tag */}
          <form onSubmit={handleAddCustomTag} className="flex gap-1.5">
            <input
              type="text"
              placeholder="Chercher ou filtrer un tag..."
              value={customTagInput}
              onChange={(e) => setCustomTagInput(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:border-indigo-500"
            />
            {customTagInput.trim() && (
              <button
                type="submit"
                className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Available tags pills */}
          <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto pr-1">
            {allAvailableTags.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Aucun tag enregistré sur vos prospects</p>
            ) : (
              allAvailableTags.map(({ tag, count }) => {
                const isSelected = filterState.selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-purple-600 text-white font-bold shadow-xs'
                        : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <span>#{tag}</span>
                    <span className={`text-[10px] px-1 rounded-full ${isSelected ? 'bg-purple-800 text-purple-200' : 'bg-slate-700 text-slate-400'}`}>
                      {count}
                    </span>
                    {isSelected && <Check className="w-3 h-3 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* SECTION 4: STATUTS COMMERCIAUX */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>Statut commercial ({filterState.statuses.length || 'Tous'})</span>
            </span>
            {filterState.statuses.length > 0 && (
              <button
                onClick={() => onUpdateFilter((prev) => ({ ...prev, statuses: [] }))}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
              >
                Tous
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {statusOptions.map((st) => {
              const isSelected = filterState.statuses.includes(st.id);
              return (
                <button
                  key={st.id}
                  onClick={() => toggleStatus(st.id)}
                  className={`py-1.5 px-2.5 rounded-xl text-xs font-medium text-left transition cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-emerald-600 text-white font-bold shadow-xs'
                      : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className={`w-2 h-2 rounded-full ${st.dotColor}`}></span>
                    <span className="truncate">{st.label}</span>
                  </div>
                  {isSelected && <Check className="w-3 h-3 shrink-0 ml-1" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION 5: COLLABORATEUR & ROUTAGE */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-sky-400" />
            <span>Collaborateur Assigné</span>
          </span>

          <select
            value={filterState.selectedAssignee}
            onChange={(e) => onUpdateFilter((prev) => ({ ...prev, selectedAssignee: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-medium text-white focus:border-indigo-500"
          >
            <option value="all">Tous les collaborateurs</option>
            <option value="unassigned">Non assigné (Libre)</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role})
              </option>
            ))}
          </select>

          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 mt-1">
            <span>Type de routage</span>
          </span>

          <select
            value={filterState.selectedRoutingFilter}
            onChange={(e) =>
              onUpdateFilter((prev) => ({
                ...prev,
                selectedRoutingFilter: e.target.value as any,
              }))
            }
            className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-medium text-white focus:border-indigo-500"
          >
            <option value="all">Tous les modes de routage</option>
            <option value="routed">Routé automatiquement par règles</option>
            <option value="manual">Assigné manuellement</option>
            <option value="unassigned">Non assigné</option>
          </select>
        </div>

        {/* SECTION 6: CRITÈRES SPÉCIAUX (FAVORIS, RAPPELS, CRM) */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-rose-400" />
            <span>Options Spéciales & Suivi</span>
          </span>

          <div className="flex flex-col gap-2">
            {/* Favorites Toggle */}
            <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:bg-slate-800 transition cursor-pointer">
              <div className="flex items-center gap-2">
                <Star className={`w-4 h-4 ${filterState.onlyFavorites ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
                <span className="text-xs text-slate-200">Favoris uniquement</span>
              </div>
              <input
                type="checkbox"
                checked={filterState.onlyFavorites}
                onChange={(e) => onUpdateFilter((prev) => ({ ...prev, onlyFavorites: e.target.checked }))}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
            </label>

            {/* Reminders Toggle */}
            <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:bg-slate-800 transition cursor-pointer">
              <div className="flex items-center gap-2">
                <Clock className={`w-4 h-4 ${filterState.hasReminder ? 'text-rose-400' : 'text-slate-400'}`} />
                <span className="text-xs text-slate-200">Avec rappel actif</span>
              </div>
              <input
                type="checkbox"
                checked={filterState.hasReminder}
                onChange={(e) => onUpdateFilter((prev) => ({ ...prev, hasReminder: e.target.checked }))}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
            </label>

            {/* CRM Sync Select */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/80 border border-slate-700/80">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-slate-200">Sync CRM :</span>
              </div>
              <select
                value={filterState.crmSyncFilter}
                onChange={(e) => onUpdateFilter((prev) => ({ ...prev, crmSyncFilter: e.target.value as any }))}
                className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-medium"
              >
                <option value="all">Tous</option>
                <option value="synced">Déjà synchronisés</option>
                <option value="unsynced">Non synchronisés</option>
              </select>
            </div>
          </div>
        </div>

      </div>

      {/* Footer controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-800">
        <button
          onClick={onResetAll}
          className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs transition cursor-pointer flex items-center gap-2"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Réinitialiser tous les critères</span>
        </button>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenSaveModal}
            className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-2"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Sauvegarder ce filtre</span>
          </button>

          <button
            onClick={onClose}
            className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
          >
            Appliquer & Fermer
          </button>
        </div>
      </div>

    </div>
  );
};
