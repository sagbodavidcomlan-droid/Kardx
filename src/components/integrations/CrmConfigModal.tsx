import React, { useState } from 'react';
import { Integration, CrmIntegrationConfig, CrmFieldMapping, CrmSyncLog } from '../../types';
import { 
  X, 
  Check, 
  Key, 
  Zap, 
  Layers, 
  Code2, 
  Play, 
  Sparkles, 
  ShieldCheck, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Plus, 
  Trash2,
  ExternalLink,
  HelpCircle
} from 'lucide-react';

interface CrmConfigModalProps {
  integration: Integration;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<CrmIntegrationConfig>) => void;
  onToggleStatus: (id: string, enable: boolean) => void;
  onTestConnection: (provider: any) => Promise<{ success: boolean; log: CrmSyncLog }>;
}

export const CrmConfigModal: React.FC<CrmConfigModalProps> = ({
  integration,
  isOpen,
  onClose,
  onSave,
  onToggleStatus,
  onTestConnection,
}) => {
  const [activeTab, setActiveTab] = useState<'auth' | 'automation' | 'mapping' | 'sandbox'>('automation');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; log?: CrmSyncLog } | null>(null);

  // Local form state
  const [apiKey, setApiKey] = useState(integration.config.apiKey || integration.config.accessToken || '');
  const [portalId, setPortalId] = useState(integration.config.portalId || '39821450');
  const [instanceUrl, setInstanceUrl] = useState(integration.config.instanceUrl || 'https://kardx-enterprise.my.salesforce.com');
  const [companyDomain, setCompanyDomain] = useState(integration.config.companyDomain || 'bestexperts');
  const [environment, setEnvironment] = useState<'production' | 'sandbox'>(integration.config.environment || 'production');
  
  // Automation settings
  const [autoSyncNewLeads, setAutoSyncNewLeads] = useState(integration.config.autoSyncNewLeads ?? true);
  const [syncTags, setSyncTags] = useState(integration.config.syncTags ?? true);
  const [createDealOnSync, setCreateDealOnSync] = useState(integration.config.createDealOnSync ?? false);
  const [dealPipeline, setDealPipeline] = useState(integration.config.dealPipeline || 'sales_pipeline_nfc');
  const [dealStage, setDealStage] = useState(integration.config.dealStage || 'appointmentscheduled');
  const [dealAmount, setDealAmount] = useState(integration.config.dealAmount || 3500);
  const [leadSourceValue, setLeadSourceValue] = useState(integration.config.leadSourceValue || `KardX NFC (${integration.name})`);
  const [deduplicationStrategy, setDeduplicationStrategy] = useState<'email' | 'phone' | 'email_or_phone' | 'always_create'>(
    integration.config.deduplicationStrategy || 'email'
  );

  // Field mappings
  const [fieldMappings, setFieldMappings] = useState<CrmFieldMapping[]>(
    integration.config.fieldMappings || [
      { kardxField: 'firstName', crmField: 'firstname', crmFieldLabel: 'Prénom', isRequired: true },
      { kardxField: 'lastName', crmField: 'lastname', crmFieldLabel: 'Nom', isRequired: true },
      { kardxField: 'email', crmField: 'email', crmFieldLabel: 'Email Professionnel', isRequired: true },
      { kardxField: 'company', crmField: 'company', crmFieldLabel: 'Entreprise' },
      { kardxField: 'jobTitle', crmField: 'jobtitle', crmFieldLabel: 'Poste / Fonction' },
      { kardxField: 'phone', crmField: 'phone', crmFieldLabel: 'Numéro Téléphone' },
      { kardxField: 'notes', crmField: 'notes', crmFieldLabel: 'Notes & Transcription IA' },
    ]
  );

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(integration.id, {
      apiKey,
      accessToken: apiKey,
      portalId,
      instanceUrl,
      companyDomain,
      environment,
      autoSyncNewLeads,
      syncTags,
      createDealOnSync,
      dealPipeline,
      dealStage,
      dealAmount: Number(dealAmount),
      leadSourceValue,
      deduplicationStrategy,
      fieldMappings,
    });
    onClose();
  };

  const handleRunTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await onTestConnection(integration.provider);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false });
    } finally {
      setIsTesting(false);
    }
  };

  const handleAddMapping = () => {
    setFieldMappings([
      ...fieldMappings,
      {
        kardxField: 'customField',
        crmField: 'custom_prop_' + Date.now().toString(36),
        crmFieldLabel: 'Propriété Personnalisée',
        isRequired: false,
      },
    ]);
  };

  const handleRemoveMapping = (index: number) => {
    setFieldMappings(fieldMappings.filter((_, i) => i !== index));
  };

  const handleUpdateMapping = (index: number, key: keyof CrmFieldMapping, value: any) => {
    const updated = [...fieldMappings];
    updated[index] = { ...updated[index], [key]: value };
    setFieldMappings(updated);
  };

  const getProviderMeta = () => {
    switch (integration.provider) {
      case 'hubspot':
        return {
          logo: '🟠',
          name: 'HubSpot CRM',
          apiDoc: 'https://developers.hubspot.com/docs/api/crm/contacts',
          authHelp: 'Obtenez votre Private App Token (pat-...) dans HubSpot > Paramètres > Intégrations > Applications privées.',
        };
      case 'salesforce':
        return {
          logo: '☁️',
          name: 'Salesforce Sales Cloud',
          apiDoc: 'https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/',
          authHelp: 'Indiquez votre URL d\'instance Salesforce et le token OAuth d\'application connectée.',
        };
      case 'pipedrive':
        return {
          logo: '🟢',
          name: 'Pipedrive',
          apiDoc: 'https://developers.pipedrive.com/docs/api/v1',
          authHelp: 'Récupérez votre clé API Personnelle dans Pipedrive > Préférences personnelles > API.',
        };
      case 'zoho':
        return {
          logo: '🔴',
          name: 'Zoho CRM',
          apiDoc: 'https://www.zoho.com/crm/developer/docs/api/v2/',
          authHelp: 'Générez un Self-Client OAuth Token depuis la console développeur Zoho.',
        };
      default:
        return {
          logo: '⚡',
          name: integration.name,
          apiDoc: '#',
          authHelp: 'Configurez les paramètres de liaison API.',
        };
    }
  };

  const meta = getProviderMeta();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* HEADER */}
        <div className="px-6 sm:px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{meta.logo}</span>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg font-bold text-slate-800">
                  Configuration & Auto-Sync {meta.name}
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  integration.status === 'connected'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}>
                  {integration.status === 'connected' ? '● Connecté & Actif' : '○ Déconnecté'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Règles de synchronisation automatisée, mapping des champs et liaison API REST
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onToggleStatus(integration.id, integration.status !== 'connected')}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer border ${
                integration.status === 'connected'
                  ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                  : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-500'
              }`}
            >
              {integration.status === 'connected' ? 'Déconnecter' : 'Activer le connecteur'}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex border-b border-slate-100 px-6 sm:px-8 bg-white gap-2 pt-2">
          <button
            onClick={() => setActiveTab('automation')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'automation'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Zap className="w-4 h-4" />
            Règles d'Auto-Push & Deals
          </button>

          <button
            onClick={() => setActiveTab('mapping')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'mapping'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            Mapping des Champs ({fieldMappings.length})
          </button>

          <button
            onClick={() => setActiveTab('auth')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'auth'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Key className="w-4 h-4" />
            Identifiants & API Token
          </button>

          <button
            onClick={() => setActiveTab('sandbox')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'sandbox'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Code2 className="w-4 h-4" />
            Test Sandbox en Direct
          </button>
        </div>

        {/* BODY CONTENT */}
        <div className="p-6 sm:p-8 overflow-y-auto max-h-[60vh] space-y-6">
          
          {/* TAB 1: AUTOMATION & DEALS */}
          {activeTab === 'automation' && (
            <div className="space-y-6">
              
              {/* PRIMARY AUTO-PUSH TOGGLE */}
              <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-indigo-600 text-white shrink-0 mt-0.5">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">
                      Auto-Push Instantané à chaque Capture de Lead
                    </h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Dès qu'un prospect scanne votre carte NFC, votre QR Code ou que vous numérisez une carte de visite avec l'IA, le contact est instantanément injecté dans <strong>{meta.name}</strong> sans intervention manuelle.
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={autoSyncNewLeads}
                    onChange={(e) => setAutoSyncNewLeads(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* DEAL CREATION OPTION */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Création Automatique d'Opportunité Commerciale (Deal / Lead Pipeline)
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Génère une opportunité dans votre pipeline commercial en même temps que le contact
                    </p>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={createDealOnSync}
                      onChange={(e) => setCreateDealOnSync(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {createDealOnSync && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Montant par Défaut (€)</label>
                      <input
                        type="number"
                        value={dealAmount}
                        onChange={(e) => setDealAmount(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Pipeline Cible</label>
                      <input
                        type="text"
                        value={dealPipeline}
                        onChange={(e) => setDealPipeline(e.target.value)}
                        placeholder="sales_pipeline_nfc"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Étape Initiale (Stage)</label>
                      <input
                        type="text"
                        value={dealStage}
                        onChange={(e) => setDealStage(e.target.value)}
                        placeholder="appointmentscheduled"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* DEDUPLICATION & METADATA SETTINGS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Stratégie de Déduplication
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Évite les doublons lors des échanges multiples avec un même contact.
                  </p>
                  <select
                    value={deduplicationStrategy}
                    onChange={(e) => setDeduplicationStrategy(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800"
                  >
                    <option value="email">Dédupliquer par Email (Recommandé)</option>
                    <option value="phone">Dédupliquer par Numéro de Téléphone</option>
                    <option value="email_or_phone">Dédupliquer par Email OU Téléphone</option>
                    <option value="always_create">Toujours créer un nouveau contact</option>
                  </select>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Source du Prospect (Lead Source)
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Valeur injectée dans le champ LeadSource de votre CRM.
                  </p>
                  <input
                    type="text"
                    value={leadSourceValue}
                    onChange={(e) => setLeadSourceValue(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800"
                  />
                </div>

              </div>

              {/* TAGS & AI QUALIFICATION TOGGLE */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">
                    Synchroniser les Tags & Notes de Qualification IA
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Injecte automatiquement les tags de salon, le résumé de rendez-vous et les données enrichies.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={syncTags}
                    onChange={(e) => setSyncTags(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

            </div>
          )}

          {/* TAB 2: FIELD MAPPINGS */}
          {activeTab === 'mapping' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Correspondance des Champs KardX ➔ {meta.name}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Configurez comment chaque donnée de la carte connectée est mappée vers les propriétés de votre CRM.
                  </p>
                </div>

                <button
                  onClick={handleAddMapping}
                  className="py-1.5 px-3 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Ajouter un champ
                </button>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                <div className="grid grid-cols-12 gap-2 bg-slate-50 px-4 py-2.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <div className="col-span-4">Champ KardX</div>
                  <div className="col-span-4">Propriété {meta.name}</div>
                  <div className="col-span-3">Libellé / Requis</div>
                  <div className="col-span-1 text-center">Action</div>
                </div>

                {fieldMappings.map((mapping, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 px-4 py-2.5 items-center text-xs">
                    <div className="col-span-4">
                      <select
                        value={mapping.kardxField}
                        onChange={(e) => handleUpdateMapping(idx, 'kardxField', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800"
                      >
                        <option value="firstName">Prénom (firstName)</option>
                        <option value="lastName">Nom (lastName)</option>
                        <option value="email">Email (email)</option>
                        <option value="phone">Téléphone (phone)</option>
                        <option value="company">Entreprise (company)</option>
                        <option value="jobTitle">Poste / Fonction (jobTitle)</option>
                        <option value="notes">Notes & Contexte (notes)</option>
                        <option value="city">Ville (city)</option>
                        <option value="country">Pays (country)</option>
                        <option value="source">Source de Capture (source)</option>
                        <option value="customField">Champ Personnalisé</option>
                      </select>
                    </div>

                    <div className="col-span-4">
                      <input
                        type="text"
                        value={mapping.crmField}
                        onChange={(e) => handleUpdateMapping(idx, 'crmField', e.target.value)}
                        placeholder="nom_de_propriete_crm"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 font-mono text-xs text-indigo-700"
                      />
                    </div>

                    <div className="col-span-3 flex items-center gap-2">
                      <input
                        type="text"
                        value={mapping.crmFieldLabel}
                        onChange={(e) => handleUpdateMapping(idx, 'crmFieldLabel', e.target.value)}
                        placeholder="Label"
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700"
                      />
                      {mapping.isRequired && (
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                          Requis
                        </span>
                      )}
                    </div>

                    <div className="col-span-1 text-center">
                      {!mapping.isRequired && (
                        <button
                          onClick={() => handleRemoveMapping(idx)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: AUTH & TOKENS */}
          {activeTab === 'auth' && (
            <div className="space-y-5">
              
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800 leading-relaxed">
                  <p className="font-bold">Authentification Sécurisée Chiffrée (AES-256)</p>
                  <p className="mt-0.5 text-amber-700">{meta.authHelp}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Environnement d'Exécution
                  </label>
                  <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setEnvironment('production')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                        environment === 'production'
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Production Live
                    </button>
                    <button
                      type="button"
                      onClick={() => setEnvironment('sandbox')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                        environment === 'sandbox'
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Sandbox Test
                    </button>
                  </div>
                </div>

                {integration.provider === 'hubspot' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Hub ID / Portal ID
                    </label>
                    <input
                      type="text"
                      value={portalId}
                      onChange={(e) => setPortalId(e.target.value)}
                      placeholder="39821450"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800"
                    />
                  </div>
                )}

                {integration.provider === 'salesforce' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Instance URL Salesforce
                    </label>
                    <input
                      type="url"
                      value={instanceUrl}
                      onChange={(e) => setInstanceUrl(e.target.value)}
                      placeholder="https://company.my.salesforce.com"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Clé d'API Privée / Jeton d'Accès OAuth (Token)
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={integration.provider === 'hubspot' ? 'pat-eu1-...' : 'Token secret'}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 focus:bg-white"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Permissions requises : <code className="font-mono text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded">crm.objects.contacts.write</code>, <code className="font-mono text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded">crm.objects.deals.write</code>
                </p>
              </div>

            </div>
          )}

          {/* TAB 4: SANDBOX & LIVE TEST */}
          {activeTab === 'sandbox' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Playground API REST & Simulateur de Synchronisation
                  </h4>
                  <p className="text-xs text-slate-500">
                    Vérifiez la validité de vos identifiants en simulant l'envoi d'un prospect synthétique.
                  </p>
                </div>

                <button
                  onClick={handleRunTest}
                  disabled={isTesting}
                  className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-indigo-900/10"
                >
                  {isTesting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Envoi en cours...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>Exécuter un Push Test</span>
                    </>
                  )}
                </button>
              </div>

              {testResult && (
                <div className={`p-4 rounded-2xl border transition ${
                  testResult.success 
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800' 
                    : 'bg-rose-50/80 border-rose-200 text-rose-800'
                }`}>
                  <div className="flex items-center gap-2">
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <h5 className="text-xs font-bold">
                      {testResult.success ? 'Succès de Connexion API (HTTP 201 Created)' : 'Échec du test de synchronisation'}
                    </h5>
                  </div>
                  {testResult.log && (
                    <div className="mt-2 text-xs font-mono bg-slate-900 text-slate-200 p-3 rounded-xl overflow-x-auto max-h-48">
                      <p className="text-amber-400"># Résultat renvoyé par {meta.name} :</p>
                      <pre className="text-emerald-300 mt-1">{JSON.stringify(testResult.log.responseBody, null, 2)}</pre>
                    </div>
                  )}
                </div>
              )}

              {/* Code preview */}
              <div className="rounded-2xl bg-slate-950 p-4 font-mono text-xs text-slate-200">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px] text-slate-400 mb-3">
                  <span>Exemple de Requête HTTP POST envoyée automatiquement :</span>
                  <span className="text-indigo-400">POST /crm/v3/objects/contacts</span>
                </div>
                <pre className="text-slate-300 overflow-x-auto">
{`POST ${integration.provider === 'salesforce' ? (instanceUrl + '/services/data/v58.0/sobjects/Lead') : 'https://api.hubapi.com/crm/v3/objects/contacts'}
Authorization: Bearer ${apiKey ? (apiKey.substring(0, 10) + '••••••••') : 'pat-na1-••••••••'}
Content-Type: application/json
X-KardX-Engine: v2.4-NFC-AutoPush

{
  "properties": {
    "firstname": "Alexandre",
    "lastname": "Dupont",
    "email": "a.dupont@entreprise.fr",
    "company": "Energia Group",
    "phone": "+33612345678",
    "kardx_source": "nfc_smart_card",
    "lead_source": "${leadSourceValue}"
  }
}`}
                </pre>
              </div>

            </div>
          )}

        </div>

        {/* FOOTER ACTIONS */}
        <div className="px-6 sm:px-8 py-4 border-t border-slate-100 bg-white flex items-center justify-between">
          <a
            href={meta.apiDoc}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Documentation API Officielle {meta.name}
          </a>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="py-2 px-4 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Annuler
            </button>

            <button
              onClick={handleSave}
              className="py-2 px-5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-900/15 transition cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Enregistrer la configuration
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
