import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LeadRoutingRule, User } from '../../types';
import { 
  GEOGRAPHIC_PRESETS, 
  INDUSTRY_PRESETS, 
  JOB_TITLE_PRESETS 
} from '../../utils/leadRouting';
import { 
  X, 
  MapPin, 
  Briefcase, 
  UserCheck, 
  Sparkles, 
  Plus, 
  Trash2, 
  Clock, 
  Tag, 
  ShieldCheck, 
  AlertCircle,
  HelpCircle,
  Building,
  Check
} from 'lucide-react';

interface RuleEditorModalProps {
  rule?: LeadRoutingRule | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (ruleData: Omit<LeadRoutingRule, 'id' | 'createdAt' | 'updatedAt' | 'matchesCount'>) => void;
}

export const RuleEditorModal: React.FC<RuleEditorModalProps> = ({
  rule,
  isOpen,
  onClose,
  onSave,
}) => {
  const { users } = useApp();

  const [name, setName] = useState(rule?.name || '');
  const [description, setDescription] = useState(rule?.description || '');
  const [targetUserId, setTargetUserId] = useState(rule?.targetUserId || users[0]?.id || '');
  const [matchMode, setMatchMode] = useState<'any' | 'all'>(rule?.matchMode || 'any');
  const [active, setActive] = useState(rule?.active !== undefined ? rule.active : true);
  const [autoReminderHours, setAutoReminderHours] = useState<number>(rule?.autoReminderHours || 24);
  const [sendAlertNotification, setSendAlertNotification] = useState(rule?.sendAlertNotification ?? true);

  // Geographic keywords
  const [geoKeywords, setGeoKeywords] = useState<string[]>(rule?.geographicKeywords || []);
  const [geoInput, setGeoInput] = useState('');

  // Industry keywords
  const [industryKeywords, setIndustryKeywords] = useState<string[]>(rule?.industryKeywords || []);
  const [industryInput, setIndustryInput] = useState('');

  // Job title keywords
  const [jobTitleKeywords, setJobTitleKeywords] = useState<string[]>(rule?.jobTitleKeywords || []);
  const [jobTitleInput, setJobTitleInput] = useState('');

  // Auto tags
  const [autoTags, setAutoTags] = useState<string[]>(rule?.autoTags || ['Routing-Auto']);
  const [tagInput, setTagInput] = useState('');

  if (!isOpen) return null;

  const handleAddGeoKeyword = (kw: string) => {
    const trimmed = kw.trim();
    if (trimmed && !geoKeywords.some((k) => k.toLowerCase() === trimmed.toLowerCase())) {
      setGeoKeywords([...geoKeywords, trimmed]);
      setGeoInput('');
    }
  };

  const handleRemoveGeoKeyword = (index: number) => {
    setGeoKeywords(geoKeywords.filter((_, i) => i !== index));
  };

  const handleAddIndustryKeyword = (kw: string) => {
    const trimmed = kw.trim();
    if (trimmed && !industryKeywords.some((k) => k.toLowerCase() === trimmed.toLowerCase())) {
      setIndustryKeywords([...industryKeywords, trimmed]);
      setIndustryInput('');
    }
  };

  const handleRemoveIndustryKeyword = (index: number) => {
    setIndustryKeywords(industryKeywords.filter((_, i) => i !== index));
  };

  const handleAddJobTitleKeyword = (kw: string) => {
    const trimmed = kw.trim();
    if (trimmed && !jobTitleKeywords.some((k) => k.toLowerCase() === trimmed.toLowerCase())) {
      setJobTitleKeywords([...jobTitleKeywords, trimmed]);
      setJobTitleInput('');
    }
  };

  const handleRemoveJobTitleKeyword = (index: number) => {
    setJobTitleKeywords(jobTitleKeywords.filter((_, i) => i !== index));
  };

  const handleAddTag = (t: string) => {
    const trimmed = t.trim();
    if (trimmed && !autoTags.some((k) => k.toLowerCase() === trimmed.toLowerCase())) {
      setAutoTags([...autoTags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (index: number) => {
    setAutoTags(autoTags.filter((_, i) => i !== index));
  };

  const handlePresetGeoAdd = (keywords: string[]) => {
    const newItems = keywords.filter(
      (kw) => !geoKeywords.some((k) => k.toLowerCase() === kw.toLowerCase())
    );
    setGeoKeywords([...geoKeywords, ...newItems]);
  };

  const handlePresetIndustryAdd = (keywords: string[]) => {
    const newItems = keywords.filter(
      (kw) => !industryKeywords.some((k) => k.toLowerCase() === kw.toLowerCase())
    );
    setIndustryKeywords([...industryKeywords, ...newItems]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (!targetUserId) return;
    if (geoKeywords.length === 0 && industryKeywords.length === 0 && jobTitleKeywords.length === 0) {
      alert('Veuillez ajouter au moins un mot-clé géographique, sectoriel ou de fonction.');
      return;
    }

    onSave({
      organizationId: rule?.organizationId || 'org_bestexperts',
      name: name.trim(),
      description: description.trim(),
      priority: rule?.priority || 1,
      active,
      geographicKeywords: geoKeywords,
      industryKeywords,
      jobTitleKeywords,
      targetUserId,
      matchMode,
      autoTags,
      statusOnAssign: 'new',
      autoReminderHours: autoReminderHours > 0 ? autoReminderHours : undefined,
      sendAlertNotification,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {rule ? 'Modifier la Règle de Routage' : 'Nouvelle Règle de Routage Automatique'}
              </h2>
              <p className="text-xs text-slate-400">
                Attribuez automatiquement les nouveaux prospects selon leur localisation et secteur.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Section 1: Informations Générales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nom de la règle <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Secteur Santé & Pharma ➔ Marie"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Description / Objectif commercial
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Attribue tous les prospects hospitaliers ou biotech d'Île-de-France."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              />
            </div>

            {/* Target Assignee */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Collaborateur Assigné <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition bg-white"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role === 'admin' ? 'Administrateur' : u.role === 'manager' ? 'Manager' : 'Membre'})
                  </option>
                ))}
              </select>
            </div>

            {/* Match Mode */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Logique de Correspondance
              </label>
              <select
                value={matchMode}
                onChange={(e) => setMatchMode(e.target.value as 'any' | 'all')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition bg-white"
              >
                <option value="any">Correspond à AU MOINS UN mot-clé (OU - Recommandé)</option>
                <option value="all">Correspond à TOUS les critères configurés (ET - Strict)</option>
              </select>
            </div>
          </div>

          <div className="h-px bg-slate-200" />

          {/* Section 2: Geographic Keywords */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <MapPin className="w-4 h-4 text-rose-500" />
                <span>Critères Géographiques (Villes, Régions, Pays)</span>
              </label>
              <span className="text-[11px] text-slate-500 font-medium">
                {geoKeywords.length} mot(s)-clé(s)
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Recherché dans la ville, le pays, le lieu de rencontre ou les notes du prospect.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={geoInput}
                onChange={(e) => setGeoInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddGeoKeyword(geoInput);
                  }
                }}
                placeholder="Ajouter une ville ou région (ex: Paris, Lyon, Abidjan...)"
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => handleAddGeoKeyword(geoInput)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter</span>
              </button>
            </div>

            {/* Active Geo Pills */}
            <div className="flex flex-wrap gap-2 min-h-[32px] p-2.5 bg-slate-50 rounded-2xl border border-slate-200/80">
              {geoKeywords.length === 0 ? (
                <span className="text-xs text-slate-400 italic">Aucun filtre géographique configuré.</span>
              ) : (
                geoKeywords.map((kw, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold"
                  >
                    <span>{kw}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveGeoKeyword(idx)}
                      className="hover:text-rose-900 transition"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Quick Geo Presets */}
            <div className="pt-1">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Suggestions rapides par zone :
              </div>
              <div className="flex flex-wrap gap-1.5">
                {GEOGRAPHIC_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handlePresetGeoAdd(preset.keywords)}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-700 transition flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3 text-slate-400" />
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-200" />

          {/* Section 3: Industry & Sector Keywords */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <Building className="w-4 h-4 text-indigo-500" />
                <span>Critères Sectoriels & Entreprises (Industries)</span>
              </label>
              <span className="text-[11px] text-slate-500 font-medium">
                {industryKeywords.length} mot(s)-clé(s)
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Recherché dans le nom de l'entreprise, les tags, les notes ou le secteur d'activité.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={industryInput}
                onChange={(e) => setIndustryInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddIndustryKeyword(industryInput);
                  }
                }}
                placeholder="Ajouter un secteur (ex: SaaS, Santé, Fintech, Transport...)"
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => handleAddIndustryKeyword(industryInput)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter</span>
              </button>
            </div>

            {/* Active Industry Pills */}
            <div className="flex flex-wrap gap-2 min-h-[32px] p-2.5 bg-slate-50 rounded-2xl border border-slate-200/80">
              {industryKeywords.length === 0 ? (
                <span className="text-xs text-slate-400 italic">Aucun filtre sectoriel configuré.</span>
              ) : (
                industryKeywords.map((kw, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold"
                  >
                    <span>{kw}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveIndustryKeyword(idx)}
                      className="hover:text-indigo-900 transition"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Quick Industry Presets */}
            <div className="pt-1">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Suggestions rapides par secteur :
              </div>
              <div className="flex flex-wrap gap-1.5">
                {INDUSTRY_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handlePresetIndustryAdd(preset.keywords)}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-700 transition flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3 text-slate-400" />
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-200" />

          {/* Section 4: Job Title Keywords */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <Briefcase className="w-4 h-4 text-emerald-600" />
                <span>Critères de Fonctions / Titres (Optionnel)</span>
              </label>
              <span className="text-[11px] text-slate-500 font-medium">
                {jobTitleKeywords.length} mot(s)-clé(s)
              </span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={jobTitleInput}
                onChange={(e) => setJobTitleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddJobTitleKeyword(jobTitleInput);
                  }
                }}
                placeholder="Ex: CEO, Directeur Achats, Head of Growth, Partner..."
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => handleAddJobTitleKeyword(jobTitleInput)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter</span>
              </button>
            </div>

            {/* Active Job Title Pills */}
            <div className="flex flex-wrap gap-2 min-h-[32px] p-2.5 bg-slate-50 rounded-2xl border border-slate-200/80">
              {jobTitleKeywords.length === 0 ? (
                <span className="text-xs text-slate-400 italic">Aucun filtre de fonction configuré (toutes fonctions acceptées).</span>
              ) : (
                jobTitleKeywords.map((kw, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold"
                  >
                    <span>{kw}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveJobTitleKeyword(idx)}
                      className="hover:text-emerald-900 transition"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          <div className="h-px bg-slate-200" />

          {/* Section 5: Automatisations complémentaires */}
          <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Actions Automatiques lors de l'attribution</span>
            </h3>

            {/* Auto Tags */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Tags ajoutés automatiquement à la fiche prospect
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag(tagInput);
                    }
                  }}
                  placeholder="Ex: Compte-Clé, Auto-Route, Prioritaire..."
                  className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => handleAddTag(tagInput)}
                  className="px-3 py-1.5 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-700 transition"
                >
                  Ajouter
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {autoTags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-300 text-slate-700 text-xs font-medium shadow-2xs"
                  >
                    <Tag className="w-3 h-3 text-slate-400" />
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(idx)}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Auto Reminder & Alerts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Délai de rappel de relance automatique</span>
                </label>
                <select
                  value={autoReminderHours}
                  onChange={(e) => setAutoReminderHours(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium bg-white"
                >
                  <option value={0}>Aucun rappel automatique</option>
                  <option value={12}>Relancer dans les 12 heures (Urgent)</option>
                  <option value={24}>Relancer sous 24 heures (Standard)</option>
                  <option value={48}>Relancer sous 48 heures</option>
                  <option value={72}>Relancer sous 3 jours ouvrés</option>
                </select>
              </div>

              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-slate-200 cursor-pointer hover:bg-slate-50 transition">
                  <input
                    type="checkbox"
                    checked={sendAlertNotification}
                    onChange={(e) => setSendAlertNotification(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-800 block">Notification d'assignation</span>
                    <span className="text-slate-500 text-[11px]">Alerter le collaborateur par notification instantanée</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Active Switch */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100">
            <div>
              <span className="text-xs font-bold text-indigo-950 block">Activer immédiatement cette règle</span>
              <span className="text-[11px] text-indigo-700">La règle sera évaluée pour tous les prochains prospects entrants.</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition cursor-pointer flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{rule ? 'Enregistrer les modifications' : 'Créer la règle de routage'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
