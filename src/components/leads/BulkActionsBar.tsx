import React, { useState } from 'react';
import { Lead, LeadStatus, User } from '../../types';
import { 
  CheckSquare, 
  Square, 
  MinusSquare, 
  Trash2, 
  Tag, 
  UserCheck, 
  Download, 
  X, 
  Layers, 
  CheckCircle2, 
  ChevronDown,
  Sparkles,
  RefreshCw,
  FolderPlus
} from 'lucide-react';

interface BulkActionsBarProps {
  selectedLeadIds: Set<string>;
  filteredLeads: Lead[];
  users: User[];
  canDeleteLeads: boolean;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onOpenTagModal: () => void;
  onOpenDeleteModal: () => void;
  onBatchStatusChange: (status: LeadStatus) => void;
  onBatchAssignUser: (userId: string) => void;
  onBatchExportCsv: () => void;
}

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedLeadIds,
  filteredLeads,
  users,
  canDeleteLeads,
  onSelectAll,
  onClearSelection,
  onOpenTagModal,
  onOpenDeleteModal,
  onBatchStatusChange,
  onBatchAssignUser,
  onBatchExportCsv,
}) => {
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);

  const selectedCount = selectedLeadIds.size;
  const isAllSelected = filteredLeads.length > 0 && selectedCount === filteredLeads.length;
  const isSomeSelected = selectedCount > 0 && selectedCount < filteredLeads.length;

  if (selectedCount === 0) return null;

  return (
    <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900 border border-slate-800 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-3.5 animate-in fade-in slide-in-from-top-2 duration-200">
      
      {/* Left: Selection Counter & Select All Controls */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={isAllSelected ? onClearSelection : onSelectAll}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer text-xs font-bold"
          title={isAllSelected ? "Tout désélectionner" : "Sélectionner tous les prospects filtrés"}
        >
          {isAllSelected ? (
            <CheckSquare className="w-4 h-4 text-purple-400" />
          ) : isSomeSelected ? (
            <MinusSquare className="w-4 h-4 text-purple-400" />
          ) : (
            <Square className="w-4 h-4 text-slate-400" />
          )}
          <span>
            {isAllSelected ? 'Tout désélectionner' : `Tout sélectionner (${filteredLeads.length})`}
          </span>
        </button>

        <div className="h-5 w-px bg-slate-700 hidden sm:block" />

        <div className="flex items-center gap-1.5">
          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-purple-500/20 text-purple-300 border border-purple-500/30">
            {selectedCount} sélectionné{selectedCount > 1 ? 's' : ''}
          </span>
          <span className="text-xs text-slate-400 hidden lg:inline">
            sur {filteredLeads.length} filtrés
          </span>
        </div>
      </div>

      {/* Right: Batch Actions Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        
        {/* 1. Tag Assignment */}
        <button
          type="button"
          onClick={onOpenTagModal}
          className="py-1.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Assigner Tags</span>
        </button>

        {/* 2. Status Update Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setIsStatusDropdownOpen(!isStatusDropdownOpen);
              setIsAssigneeDropdownOpen(false);
            }}
            className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
            <span>Statut</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isStatusDropdownOpen && (
            <div 
              className="absolute left-0 sm:right-0 sm:left-auto top-full mt-1.5 w-48 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-1.5 z-30 space-y-1 text-xs"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Changer le statut :
              </div>
              <button
                type="button"
                onClick={() => {
                  onBatchStatusChange('new');
                  setIsStatusDropdownOpen(false);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white font-medium transition cursor-pointer flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span>Nouveau Contact</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onBatchStatusChange('contacted');
                  setIsStatusDropdownOpen(false);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white font-medium transition cursor-pointer flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                <span>Contacté / Rappelé</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onBatchStatusChange('qualified');
                  setIsStatusDropdownOpen(false);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white font-medium transition cursor-pointer flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                <span>Prospect Qualifié</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onBatchStatusChange('proposal');
                  setIsStatusDropdownOpen(false);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white font-medium transition cursor-pointer flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Proposition / Devis</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onBatchStatusChange('won');
                  setIsStatusDropdownOpen(false);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white font-medium transition cursor-pointer flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Client Signé</span>
              </button>
            </div>
          )}
        </div>

        {/* 3. Assign User Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setIsAssigneeDropdownOpen(!isAssigneeDropdownOpen);
              setIsStatusDropdownOpen(false);
            }}
            className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5 text-sky-400" />
            <span>Assigner</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isAssigneeDropdownOpen && (
            <div 
              className="absolute left-0 sm:right-0 sm:left-auto top-full mt-1.5 w-52 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-1.5 z-30 space-y-1 text-xs max-h-56 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Assigner aux collaborateurs :
              </div>
              <button
                type="button"
                onClick={() => {
                  onBatchAssignUser('');
                  setIsAssigneeDropdownOpen(false);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-medium transition cursor-pointer"
              >
                — Désassigner (Libre)
              </button>
              {users.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    onBatchAssignUser(u.id);
                    setIsAssigneeDropdownOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white font-medium transition cursor-pointer flex items-center gap-2"
                >
                  <img
                    src={u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                    alt={u.name}
                    className="w-4 h-4 rounded-full object-cover"
                  />
                  <span className="truncate">{u.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 4. Export Selected CSV */}
        <button
          type="button"
          onClick={onBatchExportCsv}
          className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          title="Exporter uniquement les prospects sélectionnés"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Export</span>
        </button>

        {/* 5. Delete Selected */}
        {canDeleteLeads && (
          <button
            type="button"
            onClick={onOpenDeleteModal}
            className="py-1.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Supprimer les prospects sélectionnés"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Supprimer</span>
          </button>
        )}

        {/* 6. Deselect Close Icon */}
        <button
          type="button"
          onClick={onClearSelection}
          className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer ml-1"
          title="Annuler la sélection"
        >
          <X className="w-4 h-4" />
        </button>

      </div>

    </div>
  );
};
