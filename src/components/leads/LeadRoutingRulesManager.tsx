import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LeadRoutingRule } from '../../types';
import { RuleEditorModal } from './RuleEditorModal';
import { RoutingSimulatorModal } from './RoutingSimulatorModal';
import { 
  Sparkles, 
  Plus, 
  MapPin, 
  Building, 
  Briefcase, 
  UserCheck, 
  Clock, 
  Tag, 
  ChevronUp, 
  ChevronDown, 
  Edit3, 
  Trash2, 
  Copy, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  Layers, 
  ArrowRight,
  Filter,
  Check,
  RefreshCw,
  Info
} from 'lucide-react';

export const LeadRoutingRulesManager: React.FC = () => {
  const { 
    routingRules, 
    users, 
    leads, 
    addRoutingRule, 
    updateRoutingRule, 
    deleteRoutingRule, 
    reorderRoutingRules, 
    toggleRoutingRuleActive,
    reRouteAllLeads,
    showToast 
  } = useApp();

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<LeadRoutingRule | null>(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [batchResult, setBatchResult] = useState<{ totalProcessed: number; totalRouted: number; details: Record<string, number> } | null>(null);

  // Statistics calculation
  const activeRulesCount = routingRules.filter((r) => r.active).length;
  const totalRoutedLeads = leads.filter((l) => l.routedByRuleId || (l.assignedUserId && l.assignedUserId !== 'usr_david')).length;
  const assignedLeadsCount = leads.filter((l) => l.assignedUserId).length;
  const assignmentRate = leads.length > 0 ? Math.round((assignedLeadsCount / leads.length) * 100) : 0;

  // Find top recipient user
  const recipientCounts: Record<string, number> = {};
  leads.forEach((l) => {
    if (l.assignedUserId) {
      recipientCounts[l.assignedUserId] = (recipientCounts[l.assignedUserId] || 0) + 1;
    }
  });

  let topUserId = '';
  let maxCount = 0;
  Object.entries(recipientCounts).forEach(([uid, count]) => {
    if (count > maxCount) {
      maxCount = count;
      topUserId = uid;
    }
  });
  const topUser = users.find((u) => u.id === topUserId);

  const handleCreateRule = () => {
    setEditingRule(null);
    setIsEditorOpen(true);
  };

  const handleEditRule = (rule: LeadRoutingRule) => {
    setEditingRule(rule);
    setIsEditorOpen(true);
  };

  const handleDuplicateRule = (rule: LeadRoutingRule) => {
    addRoutingRule({
      organizationId: rule.organizationId,
      name: `${rule.name} (Copie)`,
      description: rule.description,
      priority: routingRules.length + 1,
      active: true,
      geographicKeywords: [...rule.geographicKeywords],
      industryKeywords: [...rule.industryKeywords],
      jobTitleKeywords: rule.jobTitleKeywords ? [...rule.jobTitleKeywords] : [],
      targetUserId: rule.targetUserId,
      matchMode: rule.matchMode,
      autoTags: rule.autoTags ? [...rule.autoTags] : [],
      statusOnAssign: rule.statusOnAssign,
      autoReminderHours: rule.autoReminderHours,
      sendAlertNotification: rule.sendAlertNotification,
    });
  };

  const handleSaveRule = (ruleData: Omit<LeadRoutingRule, 'id' | 'createdAt' | 'updatedAt' | 'matchesCount'>) => {
    if (editingRule) {
      updateRoutingRule(editingRule.id, ruleData);
    } else {
      addRoutingRule(ruleData);
    }
    setIsEditorOpen(false);
    setEditingRule(null);
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      reorderRoutingRules(index, index - 1);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < routingRules.length - 1) {
      reorderRoutingRules(index, index + 1);
    }
  };

  const handleRunBatchRouting = (onlyUnassigned: boolean) => {
    setIsBatchRunning(true);
    setTimeout(() => {
      const res = reRouteAllLeads(onlyUnassigned);
      setBatchResult(res);
      setIsBatchRunning(false);
    }, 600);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Top Banner & Introduction */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Intelligence Commerciale & Routage</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
                Moteur Actif
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Routage Automatique des Prospects
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Attribuez instantanément chaque nouveau contact scanné (NFC, QR Code ou Formulaire) au collaborateur le plus pertinent selon sa localisation géographique ou son secteur d'activité.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 relative z-10 shrink-0">
            <button
              onClick={() => setIsSimulatorOpen(true)}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Play className="w-4 h-4 text-indigo-400 fill-indigo-400" />
              <span>Simulateur & Test Sandbox</span>
            </button>
            <button
              onClick={handleCreateRule}
              className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvelle Règle</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Règles Actives
            </div>
            <div className="text-2xl font-black text-slate-900">
              {activeRulesCount} <span className="text-xs font-normal text-slate-400">/ {routingRules.length}</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Prospects Assignés
            </div>
            <div className="text-2xl font-black text-slate-900">
              {assignedLeadsCount} <span className="text-xs font-semibold text-emerald-600">({assignmentRate}%)</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Délai de Relance Moyen
            </div>
            <div className="text-2xl font-black text-slate-900">
              24h <span className="text-xs font-medium text-slate-400">auto-programmé</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Top Destinataire
            </div>
            <div className="text-base font-bold text-slate-900 truncate max-w-[150px]">
              {topUser ? topUser.name : 'Non défini'}
            </div>
            <div className="text-[11px] text-slate-500">
              {maxCount} contacts reçus
            </div>
          </div>
        </div>
      </div>

      {/* Batch Processing Notification Box */}
      <div className="p-5 rounded-2xl bg-slate-900 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shrink-0">
            <RefreshCw className={`w-5 h-5 ${isBatchRunning ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">
              Application rétroactive des règles de routage
            </h3>
            <p className="text-xs text-slate-400">
              Vous avez {leads.filter((l) => !l.assignedUserId).length} prospect(s) non assigné(s) dans votre CRM.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => handleRunBatchRouting(true)}
            disabled={isBatchRunning}
            className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Router les non-assignés</span>
          </button>
          <button
            onClick={() => handleRunBatchRouting(false)}
            disabled={isBatchRunning}
            className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-semibold text-xs transition cursor-pointer"
          >
            <span>Ré-évaluer toute la base</span>
          </button>
        </div>
      </div>

      {/* Batch result toast/banner if run */}
      {batchResult && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <b>{batchResult.totalRouted} prospect(s)</b> ont été assignés sur {batchResult.totalProcessed} analysés.
            </span>
          </div>
          <button
            onClick={() => setBatchResult(null)}
            className="text-emerald-700 font-bold hover:underline"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Rules Evaluation Order & Priority List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Ordre d'Évaluation des Règles ({routingRules.length})</span>
            </h2>
            <p className="text-xs text-slate-500">
              Les règles sont évaluées dans l'ordre de priorité (de #1 à #{routingRules.length}). Le premier match l'emporte.
            </p>
          </div>
          <button
            onClick={handleCreateRule}
            className="py-2 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ajouter une règle</span>
          </button>
        </div>

        {/* Rule Cards */}
        <div className="space-y-3">
          {routingRules.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300">
              <Sparkles className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800 text-sm">Aucune règle de routage active</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                Créez votre première règle pour automatiser l'assignation de vos prospects par secteur ou ville.
              </p>
              <button
                onClick={handleCreateRule}
                className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
              >
                Créer une première règle
              </button>
            </div>
          ) : (
            routingRules.map((rule, index) => {
              const targetUser = users.find((u) => u.id === rule.targetUserId);

              return (
                <div
                  key={rule.id}
                  className={`p-5 rounded-2xl bg-white border transition-all shadow-xs hover:shadow-md ${
                    rule.active 
                      ? 'border-slate-200/90' 
                      : 'border-slate-200/60 opacity-60 bg-slate-50/50'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    
                    {/* Left: Priority & Main Info */}
                    <div className="flex items-start gap-3.5">
                      
                      {/* Priority Controls */}
                      <div className="flex flex-col items-center justify-center shrink-0">
                        <button
                          disabled={index === 0}
                          onClick={() => handleMoveUp(index)}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-20 cursor-pointer"
                          title="Monter en priorité"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <span className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 font-extrabold text-xs flex items-center justify-center shadow-2xs">
                          #{rule.priority}
                        </span>
                        <button
                          disabled={index === routingRules.length - 1}
                          onClick={() => handleMoveDown(index)}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-20 cursor-pointer"
                          title="Descendre en priorité"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Rule details */}
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-sm text-slate-900">
                            {rule.name}
                          </h3>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            rule.active
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {rule.active ? 'Actif' : 'Inactif'}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            • {rule.matchesCount} prospect(s) routé(s)
                          </span>
                        </div>

                        {rule.description && (
                          <p className="text-xs text-slate-500">
                            {rule.description}
                          </p>
                        )}

                        {/* Keyword Criteria Chips */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                          {/* Geo Keywords */}
                          {rule.geographicKeywords.length > 0 && (
                            <div className="flex items-center gap-1 bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded-md text-[11px] font-semibold text-rose-700">
                              <MapPin className="w-3 h-3 text-rose-500" />
                              <span>Géo ({rule.geographicKeywords.length}):</span>
                              <span className="font-normal text-rose-800">
                                {rule.geographicKeywords.slice(0, 4).join(', ')}
                                {rule.geographicKeywords.length > 4 && ` +${rule.geographicKeywords.length - 4}`}
                              </span>
                            </div>
                          )}

                          {/* Industry Keywords */}
                          {rule.industryKeywords.length > 0 && (
                            <div className="flex items-center gap-1 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-md text-[11px] font-semibold text-indigo-700">
                              <Building className="w-3 h-3 text-indigo-500" />
                              <span>Secteur ({rule.industryKeywords.length}):</span>
                              <span className="font-normal text-indigo-800">
                                {rule.industryKeywords.slice(0, 4).join(', ')}
                                {rule.industryKeywords.length > 4 && ` +${rule.industryKeywords.length - 4}`}
                              </span>
                            </div>
                          )}

                          {/* Job Title Keywords */}
                          {rule.jobTitleKeywords && rule.jobTitleKeywords.length > 0 && (
                            <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md text-[11px] font-semibold text-emerald-700">
                              <Briefcase className="w-3 h-3 text-emerald-600" />
                              <span>Fonction :</span>
                              <span className="font-normal text-emerald-800">
                                {rule.jobTitleKeywords.slice(0, 3).join(', ')}
                              </span>
                            </div>
                          )}

                          {/* Auto tags */}
                          {rule.autoTags && rule.autoTags.length > 0 && (
                            <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md text-[11px] font-medium text-slate-600">
                              <Tag className="w-3 h-3 text-slate-400" />
                              <span>Tags: {rule.autoTags.join(', ')}</span>
                            </div>
                          )}

                          {/* Auto reminder */}
                          {rule.autoReminderHours && (
                            <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md text-[11px] font-medium text-amber-800">
                              <Clock className="w-3 h-3 text-amber-500" />
                              <span>Rappel {rule.autoReminderHours}h</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Assignee & Action Buttons */}
                    <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      
                      {/* Assignee Card */}
                      {targetUser ? (
                        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/90 shadow-2xs">
                          <img
                            src={targetUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                            alt={targetUser.name}
                            className="w-7 h-7 rounded-full object-cover border border-indigo-400"
                          />
                          <div className="text-left">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block leading-tight">
                              Assigné à
                            </span>
                            <span className="text-xs font-bold text-slate-800 block leading-tight">
                              {targetUser.name}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-rose-600 font-semibold">
                          Utilisateur introuvable
                        </div>
                      )}

                      {/* Active Toggle Switch */}
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rule.active}
                          onChange={() => toggleRoutingRuleActive(rule.id)}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDuplicateRule(rule)}
                          className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                          title="Dupliquer la règle"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditRule(rule)}
                          className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                          title="Modifier la règle"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Supprimer la règle "${rule.name}" ?`)) {
                              deleteRoutingRule(rule.id);
                            }
                          }}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Supprimer la règle"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Info & Best Practices Footer Card */}
      <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/90 space-y-3">
        <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-slate-700">
          <Info className="w-4 h-4 text-indigo-600" />
          <span>Comment fonctionne le routage automatique intelligent ?</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600 leading-relaxed">
          <div className="p-3.5 bg-white rounded-2xl border border-slate-200/70 space-y-1">
            <span className="font-bold text-slate-900 block">1. Détection Multi-Canale</span>
            <p>
              Dès qu'une carte NFC est posée sur un smartphone ou qu'un QR code est scanné lors d'un salon, le formulaire extrait le nom de l'entreprise, le poste et la ville.
            </p>
          </div>
          <div className="p-3.5 bg-white rounded-2xl border border-slate-200/70 space-y-1">
            <span className="font-bold text-slate-900 block">2. Évaluation Prioritaire</span>
            <p>
              Le moteur compare les mots-clés normalisés sans accent. La première règle correspondante attribue immédiatement la propriété du contact au commercial expert.
            </p>
          </div>
          <div className="p-3.5 bg-white rounded-2xl border border-slate-200/70 space-y-1">
            <span className="font-bold text-slate-900 block">3. Relance & Notifications</span>
            <p>
              Le commercial assigné reçoit une notification in-app immédiate, des tags CRM ciblés et un rappel automatique de prise de contact planifié sous 24h.
            </p>
          </div>
        </div>
      </div>

      {/* Rule Editor Modal */}
      {isEditorOpen && (
        <RuleEditorModal
          rule={editingRule}
          isOpen={isEditorOpen}
          onClose={() => {
            setIsEditorOpen(false);
            setEditingRule(null);
          }}
          onSave={handleSaveRule}
        />
      )}

      {/* Simulator / Sandbox Modal */}
      {isSimulatorOpen && (
        <RoutingSimulatorModal
          isOpen={isSimulatorOpen}
          onClose={() => setIsSimulatorOpen(false)}
        />
      )}
    </div>
  );
};
