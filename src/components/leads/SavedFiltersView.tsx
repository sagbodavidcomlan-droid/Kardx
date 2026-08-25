import React, { useState } from 'react';
import { 
  Bookmark, 
  Plus, 
  Trash2, 
  ArrowRight, 
  Sparkles, 
  Filter, 
  Calendar, 
  Tag as TagIcon, 
  Zap, 
  Database, 
  User, 
  Star, 
  Clock, 
  CheckCircle2,
  Copy,
  RotateCcw,
  Search
} from 'lucide-react';
import { SavedLeadFilter, LeadFilterState } from '../../types/savedFilters';
import { Lead } from '../../types';
import { applyFilterStateToLeads, getDatePresetLabel } from '../../utils/savedFiltersStorage';

interface SavedFiltersViewProps {
  savedFilters: SavedLeadFilter[];
  allLeads: Lead[];
  currentFilterState: LeadFilterState;
  onApplyFilter: (savedFilter: SavedLeadFilter) => void;
  onDeleteFilter: (filterId: string) => void;
  onOpenSaveModal: () => void;
  onResetDefaults: () => void;
}

export const SavedFiltersView: React.FC<SavedFiltersViewProps> = ({
  savedFilters,
  allLeads,
  currentFilterState,
  onApplyFilter,
  onDeleteFilter,
  onOpenSaveModal,
  onResetDefaults,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredList = savedFilters.filter((sf) =>
    sf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sf.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getColorClasses = (color: SavedLeadFilter['color']) => {
    switch (color) {
      case 'amber':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          text: 'text-amber-700',
          badge: 'bg-amber-100 text-amber-800',
        };
      case 'indigo':
        return {
          bg: 'bg-indigo-50',
          border: 'border-indigo-200',
          text: 'text-indigo-700',
          badge: 'bg-indigo-100 text-indigo-800',
        };
      case 'emerald':
        return {
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
          text: 'text-emerald-700',
          badge: 'bg-emerald-100 text-emerald-800',
        };
      case 'rose':
        return {
          bg: 'bg-rose-50',
          border: 'border-rose-200',
          text: 'text-rose-700',
          badge: 'bg-rose-100 text-rose-800',
        };
      case 'sky':
        return {
          bg: 'bg-sky-50',
          border: 'border-sky-200',
          text: 'text-sky-700',
          badge: 'bg-sky-100 text-sky-800',
        };
      case 'purple':
        return {
          bg: 'bg-purple-50',
          border: 'border-purple-200',
          text: 'text-purple-700',
          badge: 'bg-purple-100 text-purple-800',
        };
      default:
        return {
          bg: 'bg-slate-50',
          border: 'border-slate-200',
          text: 'text-slate-700',
          badge: 'bg-slate-100 text-slate-800',
        };
    }
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Top Banner & Actions */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600">
              <Bookmark className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">
              Vues & Filtres Sauvegardés
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {savedFilters.length} Vues Disponibles
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Accédez instantanément à vos segments de prospects stratégiques (NFC récents, VIP, rappels urgents, opportunités non assignées ou en attente CRM).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenSaveModal}
            className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-900/15 transition cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Enregistrer la vue actuelle</span>
          </button>

          <button
            onClick={onResetDefaults}
            title="Restaurer les pré-réglages d'usine"
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search in filters */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="Rechercher parmi vos filtres sauvegardés..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Grid of Saved Filter Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredList.map((sf) => {
          const colorStyles = getColorClasses(sf.color);
          const matchingLeads = applyFilterStateToLeads(allLeads, sf.filterState);
          const count = matchingLeads.length;
          const fs = sf.filterState;

          return (
            <div
              key={sf.id}
              className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between gap-5 group"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{sf.icon}</span>
                    <div>
                      <h4 className="font-bold text-sm text-slate-800 group-hover:text-indigo-600 transition">
                        {sf.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                        {sf.description}
                      </p>
                    </div>
                  </div>

                  {!sf.isDefault && (
                    <button
                      onClick={() => onDeleteFilter(sf.id)}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      title="Supprimer ce filtre"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Criteria Tags */}
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {fs.dateRangePreset !== 'all' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                      <Calendar className="w-2.5 h-2.5" />
                      {getDatePresetLabel(fs.dateRangePreset)}
                    </span>
                  )}

                  {fs.sources.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-100">
                      <Zap className="w-2.5 h-2.5" />
                      {fs.sources.join(', ')}
                    </span>
                  )}

                  {fs.selectedTags.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-100">
                      <TagIcon className="w-2.5 h-2.5" />
                      {fs.selectedTags.join(', ')}
                    </span>
                  )}

                  {fs.statuses.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-100">
                      Statuts: {fs.statuses.join(', ')}
                    </span>
                  )}

                  {fs.onlyFavorites && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-100 text-amber-900">
                      <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                      Favoris
                    </span>
                  )}

                  {fs.hasReminder && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-100">
                      <Clock className="w-2.5 h-2.5" />
                      Rappels
                    </span>
                  )}

                  {fs.crmSyncFilter !== 'all' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-100">
                      <Database className="w-2.5 h-2.5" />
                      CRM: {fs.crmSyncFilter}
                    </span>
                  )}

                  {fs.selectedAssignee === 'unassigned' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700">
                      <User className="w-2.5 h-2.5" />
                      Non assigné
                    </span>
                  )}
                </div>
              </div>

              {/* Card Footer: Live Matching Count & Apply Button */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${colorStyles.badge}`}>
                    {count} prospect{count > 1 ? 's' : ''}
                  </span>
                  <span className="text-[11px] text-slate-400">actuel(s)</span>
                </div>

                <button
                  onClick={() => onApplyFilter(sf)}
                  className="py-2 px-3.5 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <span>Appliquer</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
