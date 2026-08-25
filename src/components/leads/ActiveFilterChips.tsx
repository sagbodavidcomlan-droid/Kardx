import React from 'react';
import { 
  X, 
  RotateCcw, 
  Bookmark, 
  Calendar, 
  Tag as TagIcon, 
  User, 
  Star, 
  Clock, 
  Zap, 
  Sparkles,
  QrCode,
  Layers,
  Database,
  Building,
  MapPin
} from 'lucide-react';
import { LeadFilterState, DateRangePreset } from '../../types/savedFilters';
import { getDatePresetLabel } from '../../utils/savedFiltersStorage';
import { User as UserType } from '../../types';

interface ActiveFilterChipsProps {
  filterState: LeadFilterState;
  users: UserType[];
  onUpdateFilter: (updater: (prev: LeadFilterState) => LeadFilterState) => void;
  onResetAll: () => void;
  onOpenSaveModal: () => void;
  totalFilteredCount: number;
  totalLeadsCount: number;
}

export const ActiveFilterChips: React.FC<ActiveFilterChipsProps> = ({
  filterState,
  users,
  onUpdateFilter,
  onResetAll,
  onOpenSaveModal,
  totalFilteredCount,
  totalLeadsCount,
}) => {
  const getSourceLabel = (src: string) => {
    switch (src) {
      case 'nfc': return 'NFC Tap';
      case 'qr': return 'QR Code';
      case 'card_scanner': return 'Scanner IA';
      case 'email_signature': return 'Signature Email';
      case 'direct_url': return 'Lien Direct';
      case 'manual': return 'Manuel';
      case 'salon': return 'Salon';
      case 'phone': return 'Téléphone';
      case 'recommendation': return 'Recommandation';
      case 'linkedin': return 'LinkedIn';
      default: return src;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new': return 'Nouveau';
      case 'contacted': return 'Contacté';
      case 'qualified': return 'Qualifié';
      case 'proposal': return 'Proposition';
      case 'won': return 'Gagné';
      case 'lost': return 'Perdu';
      default: return status;
    }
  };

  const hasAnyFilter = 
    Boolean(filterState.searchQuery.trim()) ||
    filterState.dateRangePreset !== 'all' ||
    filterState.sources.length > 0 ||
    filterState.statuses.length > 0 ||
    filterState.selectedAssignee !== 'all' ||
    filterState.selectedRoutingFilter !== 'all' ||
    filterState.selectedTags.length > 0 ||
    filterState.onlyFavorites ||
    filterState.hasReminder ||
    filterState.crmSyncFilter !== 'all' ||
    Boolean(filterState.companyQuery?.trim()) ||
    Boolean(filterState.cityQuery?.trim());

  if (!hasAnyFilter) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 pt-1 pb-2">
      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mr-1">
        <span>Filtres actifs :</span>
        <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[11px] font-bold">
          {totalFilteredCount} / {totalLeadsCount} prospects
        </span>
      </div>

      {/* Search Query Chip */}
      {filterState.searchQuery.trim() && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 text-xs font-medium border border-slate-200">
          <span className="text-slate-400">Recherche :</span>
          <span className="font-bold">"{filterState.searchQuery}"</span>
          <button
            onClick={() => onUpdateFilter((prev) => ({ ...prev, searchQuery: '' }))}
            className="p-0.5 hover:bg-slate-200 rounded-full text-slate-500 hover:text-slate-800 transition cursor-pointer ml-1"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      )}

      {/* Date Range Chip */}
      {filterState.dateRangePreset !== 'all' && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-800 text-xs font-medium border border-indigo-200">
          <Calendar className="w-3 h-3 text-indigo-600" />
          <span>
            {filterState.dateRangePreset === 'custom'
              ? `Du ${filterState.customDateStart || '...'} au ${filterState.customDateEnd || '...'}`
              : getDatePresetLabel(filterState.dateRangePreset)}
          </span>
          <button
            onClick={() =>
              onUpdateFilter((prev) => ({
                ...prev,
                dateRangePreset: 'all',
                customDateStart: '',
                customDateEnd: '',
              }))
            }
            className="p-0.5 hover:bg-indigo-200 rounded-full text-indigo-600 hover:text-indigo-900 transition cursor-pointer ml-1"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      )}

      {/* Source Chips */}
      {filterState.sources.map((src) => (
        <span
          key={src}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-900 text-xs font-medium border border-amber-200"
        >
          <Zap className="w-3 h-3 text-amber-600" />
          <span>Source: {getSourceLabel(src)}</span>
          <button
            onClick={() =>
              onUpdateFilter((prev) => ({
                ...prev,
                sources: prev.sources.filter((s) => s !== src),
              }))
            }
            className="p-0.5 hover:bg-amber-200 rounded-full text-amber-700 hover:text-amber-950 transition cursor-pointer ml-1"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}

      {/* Status Chips */}
      {filterState.statuses.map((st) => (
        <span
          key={st}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-900 text-xs font-medium border border-emerald-200"
        >
          <span>Statut: {getStatusLabel(st)}</span>
          <button
            onClick={() =>
              onUpdateFilter((prev) => ({
                ...prev,
                statuses: prev.statuses.filter((s) => s !== st),
              }))
            }
            className="p-0.5 hover:bg-emerald-200 rounded-full text-emerald-700 hover:text-emerald-950 transition cursor-pointer ml-1"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}

      {/* Assignee Chip */}
      {filterState.selectedAssignee !== 'all' && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-sky-50 text-sky-900 text-xs font-medium border border-sky-200">
          <User className="w-3 h-3 text-sky-600" />
          <span>
            {filterState.selectedAssignee === 'unassigned'
              ? 'Non assigné'
              : `Assigné: ${users.find((u) => u.id === filterState.selectedAssignee)?.name.split(' ')[0] || filterState.selectedAssignee}`}
          </span>
          <button
            onClick={() => onUpdateFilter((prev) => ({ ...prev, selectedAssignee: 'all' }))}
            className="p-0.5 hover:bg-sky-200 rounded-full text-sky-700 hover:text-sky-950 transition cursor-pointer ml-1"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      )}

      {/* Tag Chips */}
      {filterState.selectedTags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-50 text-purple-900 text-xs font-medium border border-purple-200"
        >
          <TagIcon className="w-3 h-3 text-purple-600" />
          <span>Tag: {tag}</span>
          <button
            onClick={() =>
              onUpdateFilter((prev) => ({
                ...prev,
                selectedTags: prev.selectedTags.filter((t) => t !== tag),
              }))
            }
            className="p-0.5 hover:bg-purple-200 rounded-full text-purple-700 hover:text-purple-950 transition cursor-pointer ml-1"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}

      {/* Favorites Only */}
      {filterState.onlyFavorites && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 text-xs font-medium border border-amber-300">
          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
          <span>Favoris uniquement</span>
          <button
            onClick={() => onUpdateFilter((prev) => ({ ...prev, onlyFavorites: false }))}
            className="p-0.5 hover:bg-amber-200 rounded-full text-amber-800 transition cursor-pointer ml-1"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      )}

      {/* Has Reminder */}
      {filterState.hasReminder && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-50 text-rose-900 text-xs font-medium border border-rose-200">
          <Clock className="w-3 h-3 text-rose-600" />
          <span>{filterState.reminderOverdueOnly ? 'Rappels en retard' : 'Rappels actifs'}</span>
          <button
            onClick={() =>
              onUpdateFilter((prev) => ({
                ...prev,
                hasReminder: false,
                reminderOverdueOnly: false,
              }))
            }
            className="p-0.5 hover:bg-rose-200 rounded-full text-rose-700 transition cursor-pointer ml-1"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      )}

      {/* CRM Sync Filter */}
      {filterState.crmSyncFilter !== 'all' && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-900 text-xs font-medium border border-emerald-200">
          <Database className="w-3 h-3 text-emerald-600" />
          <span>{filterState.crmSyncFilter === 'synced' ? 'Synchronisé CRM' : 'Non synchronisé CRM'}</span>
          <button
            onClick={() => onUpdateFilter((prev) => ({ ...prev, crmSyncFilter: 'all' }))}
            className="p-0.5 hover:bg-emerald-200 rounded-full text-emerald-700 transition cursor-pointer ml-1"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      )}

      {/* Company Query */}
      {filterState.companyQuery && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 text-xs font-medium border border-slate-200">
          <Building className="w-3 h-3 text-slate-500" />
          <span>Entreprise: "{filterState.companyQuery}"</span>
          <button
            onClick={() => onUpdateFilter((prev) => ({ ...prev, companyQuery: '' }))}
            className="p-0.5 hover:bg-slate-200 rounded-full text-slate-600 transition cursor-pointer ml-1"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      )}

      {/* City Query */}
      {filterState.cityQuery && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 text-xs font-medium border border-slate-200">
          <MapPin className="w-3 h-3 text-slate-500" />
          <span>Ville: "{filterState.cityQuery}"</span>
          <button
            onClick={() => onUpdateFilter((prev) => ({ ...prev, cityQuery: '' }))}
            className="p-0.5 hover:bg-slate-200 rounded-full text-slate-600 transition cursor-pointer ml-1"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-1.5 ml-auto">
        <button
          onClick={onOpenSaveModal}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition cursor-pointer whitespace-nowrap"
        >
          <Bookmark className="w-3 h-3" />
          <span>Sauvegarder ce filtre</span>
        </button>

        <button
          onClick={onResetAll}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white hover:bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200 transition cursor-pointer whitespace-nowrap"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Réinitialiser</span>
        </button>
      </div>
    </div>
  );
};
