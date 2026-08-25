import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { GoogleWorkspaceCenter } from './GoogleWorkspaceCenter';
import { CrmConfigModal } from './CrmConfigModal';
import { CrmPayloadInspectorModal } from './CrmPayloadInspectorModal';
import { Integration, CrmSyncLog } from '../../types';
import { 
  Zap, 
  Key, 
  Webhook, 
  Check, 
  Plus, 
  Trash2, 
  Copy, 
  ExternalLink, 
  RefreshCw, 
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Filter,
  Play,
  Settings2,
  Code2,
  Database,
  Layers,
  Search
} from 'lucide-react';

export const IntegrationsHub: React.FC = () => {
  const { 
    integrations, 
    toggleIntegration, 
    updateIntegrationConfig, 
    syncAllUnsyncedLeads,
    syncLeadToCrm,
    testCrmConnection,
    crmSyncLogs,
    clearCrmSyncLogs,
    webhooks, 
    addWebhook, 
    deleteWebhook, 
    testWebhook, 
    showToast,
    leads
  } = useApp();

  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [apiKey, setApiKey] = useState('kx_live_9f82a71b4c5e3d29a0081c7e6d4');
  const [copiedKey, setCopiedKey] = useState(false);
  const [isBulkSyncing, setIsBulkSyncing] = useState(false);

  // Modals state
  const [selectedIntegrationForConfig, setSelectedIntegrationForConfig] = useState<Integration | null>(null);
  const [inspectedLog, setInspectedLog] = useState<CrmSyncLog | null>(null);

  // Filter logs state
  const [logProviderFilter, setLogProviderFilter] = useState<string>('all');
  const [logStatusFilter, setLogStatusFilter] = useState<string>('all');
  const [logSearch, setLogSearch] = useState<string>('');

  const handleAddWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWebhookUrl.trim()) return;

    addWebhook({
      url: newWebhookUrl.trim(),
      events: ['lead.created', 'card.scanned'],
      active: true,
    });

    setNewWebhookUrl('');
  };

  const handleCopyKey = async () => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(apiKey);
      setCopiedKey(true);
      showToast('Clé API copiée dans le presse-papier !');
      setTimeout(() => setCopiedKey(false), 2500);
    }
  };

  const handleBulkSync = async () => {
    setIsBulkSyncing(true);
    try {
      await syncAllUnsyncedLeads();
    } finally {
      setIsBulkSyncing(false);
    }
  };

  const getProviderVisual = (provider: string) => {
    switch (provider) {
      case 'hubspot':
        return { logo: '🟠', name: 'HubSpot CRM', color: 'text-amber-600 bg-amber-50 border-amber-200' };
      case 'salesforce':
        return { logo: '☁️', name: 'Salesforce', color: 'text-sky-600 bg-sky-50 border-sky-200' };
      case 'pipedrive':
        return { logo: '🟢', name: 'Pipedrive', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
      case 'zoho':
        return { logo: '🔴', name: 'Zoho CRM', color: 'text-rose-600 bg-rose-50 border-rose-200' };
      case 'google_contacts':
        return { logo: '🔵', name: 'Google Contacts', color: 'text-blue-600 bg-blue-50 border-blue-200' };
      case 'zapier':
        return { logo: '⚡', name: 'Zapier', color: 'text-orange-600 bg-orange-50 border-orange-200' };
      default:
        return { logo: '🔌', name: provider, color: 'text-slate-600 bg-slate-50 border-slate-200' };
    }
  };

  // Metrics calculations
  const connectedCrms = integrations.filter((i) => i.status === 'connected');
  const totalSyncedLeads = integrations.reduce((acc, i) => acc + (i.syncedLeadsCount || 0), 0);
  const autoPushActive = connectedCrms.some((i) => i.config.autoSyncNewLeads ?? true);

  // Filtered CRM logs
  const filteredLogs = useMemo(() => {
    return crmSyncLogs.filter((log) => {
      if (logProviderFilter !== 'all' && log.provider !== logProviderFilter) return false;
      if (logStatusFilter === 'success' && (log.statusCode < 200 || log.statusCode >= 300)) return false;
      if (logStatusFilter === 'error' && log.statusCode >= 200 && log.statusCode < 300) return false;
      if (logSearch.trim()) {
        const q = logSearch.toLowerCase();
        const matchName = log.leadName?.toLowerCase().includes(q);
        const matchEmail = log.leadEmail?.toLowerCase().includes(q);
        const matchId = log.externalId?.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchId) return false;
      }
      return true;
    });
  }, [crmSyncLogs, logProviderFilter, logStatusFilter, logSearch]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-slate-800 flex flex-col gap-8">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
              Intégrations CRM & Automatisation de Flux
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Auto-Sync Actif
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Poussez automatiquement chaque prospect capturé via carte NFC, QR Code ou scanner IA vers HubSpot, Salesforce, Pipedrive et Google Workspace.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleBulkSync}
            disabled={isBulkSyncing || connectedCrms.length === 0}
            className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-indigo-900/15 transition cursor-pointer"
          >
            {isBulkSyncing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Synchronisation en masse...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                <span>Pousser tous les prospects ({leads.length})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* METRICS OVERVIEW BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs flex items-center gap-3">
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Connecteurs Actifs</p>
            <p className="text-lg font-extrabold text-slate-800 mt-0.5">
              {connectedCrms.length} <span className="text-xs font-normal text-slate-400">/ {integrations.length}</span>
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Prospects Synchronisés</p>
            <p className="text-lg font-extrabold text-slate-800 mt-0.5">
              {totalSyncedLeads} <span className="text-xs font-normal text-emerald-600">poussés</span>
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Auto-Push Temps Réel</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-sm font-bold text-slate-800">
                {autoPushActive ? 'Instantané' : 'Désactivé'}
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs flex items-center gap-3">
          <div className="p-3 rounded-xl bg-sky-50 text-sky-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Disponibilité API</p>
            <p className="text-lg font-extrabold text-slate-800 mt-0.5">
              99.9% <span className="text-xs font-normal text-slate-400">REST v3</span>
            </p>
          </div>
        </div>
      </div>

      {/* GOOGLE WORKSPACE SUITE INTEGRATION */}
      <GoogleWorkspaceCenter />

      {/* 1. NATIVE CRM & ERP CONNECTORS */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Connecteurs CRM & Pipelines Commerciaux
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Synchronisation bidirectionnelle automatique, injection de contacts et création de Deals commerciaux.
            </p>
          </div>

          <span className="text-xs text-slate-400">
            {connectedCrms.length} connecté(s) sur {integrations.length} plateformes
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {integrations.map((int) => {
            const visual = getProviderVisual(int.provider);
            const isConnected = int.status === 'connected';
            const isAutoPush = isConnected && (int.config.autoSyncNewLeads ?? true);
            const hasDeals = isConnected && int.config.createDealOnSync;

            return (
              <div 
                key={int.id} 
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                  isConnected 
                    ? 'bg-white border-slate-200 shadow-sm hover:border-indigo-200' 
                    : 'bg-slate-50/70 border-slate-200/80 opacity-90'
                }`}
              >
                <div>
                  {/* Top card header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{visual.logo}</span>
                      <div>
                        <h4 className="font-bold text-sm text-slate-800">{int.name}</h4>
                        <span className={`text-[11px] font-bold ${isConnected ? 'text-emerald-700' : 'text-slate-400'}`}>
                          {isConnected ? '● Connecté & Opérationnel' : '○ Non configuré'}
                        </span>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                      <input
                        type="checkbox"
                        checked={isConnected}
                        onChange={(e) => toggleIntegration(int.id, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  {/* Badges / Capabilities */}
                  <div className="flex flex-wrap gap-1.5 mt-3.5">
                    {isAutoPush && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                        <Zap className="w-2.5 h-2.5" />
                        Auto-Push Instantané
                      </span>
                    )}

                    {hasDeals && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        Auto-Deal {int.config.dealAmount ? `${int.config.dealAmount} €` : ''}
                      </span>
                    )}

                    <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600">
                      {int.syncedLeadsCount || 0} leads synchronisés
                    </span>
                  </div>

                  {/* Sync status info */}
                  {isConnected && int.lastSyncAt && (
                    <p className="text-[11px] text-slate-400 mt-2.5 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      Dernier push : {new Date(int.lastSyncAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setSelectedIntegrationForConfig(int)}
                    className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    <span>Configurer & Mapper</span>
                  </button>

                  {['hubspot', 'salesforce', 'pipedrive', 'zoho'].includes(int.provider) && (
                    <button
                      onClick={() => testCrmConnection(int.provider as any)}
                      title="Tester l'appel REST API"
                      className="py-2 px-2.5 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. REAL-TIME CRM ACTIVITY & TRANSACTION LOGS */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-indigo-600" />
                Journal des Transactions & Logs de Synchronisation API
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
                {crmSyncLogs.length} événements
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Historique en temps réel des requêtes REST (Payloads JSON envoyés, codes HTTP de retour et latence).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={clearCrmSyncLogs}
              className="py-1.5 px-3 rounded-xl text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer flex items-center gap-1 border border-slate-200"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Effacer les logs</span>
            </button>
          </div>
        </div>

        {/* LOG FILTERS BAR */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par prospect, email ou ID externe..."
              value={logSearch}
              onChange={(e) => setLogSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white"
            />
          </div>

          <select
            value={logProviderFilter}
            onChange={(e) => setLogProviderFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700"
          >
            <option value="all">Tous les CRM</option>
            <option value="hubspot">HubSpot CRM</option>
            <option value="salesforce">Salesforce</option>
            <option value="pipedrive">Pipedrive</option>
            <option value="zoho">Zoho CRM</option>
          </select>

          <select
            value={logStatusFilter}
            onChange={(e) => setLogStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700"
          >
            <option value="all">Tous les statuts HTTP</option>
            <option value="success">Succès (201 / 200 OK)</option>
            <option value="error">Erreurs (4xx / 5xx)</option>
          </select>
        </div>

        {/* LOGS TABLE */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
          <div className="grid grid-cols-12 gap-2 bg-slate-50 px-4 py-2.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <div className="col-span-3">Prospect & Contact</div>
            <div className="col-span-3">CRM Cible</div>
            <div className="col-span-2">Code HTTP</div>
            <div className="col-span-2">ID Externe / Ref</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Aucun log correspondant aux filtres sélectionnés.
            </div>
          ) : (
            filteredLogs.slice(0, 15).map((log) => {
              const visual = getProviderVisual(log.provider);
              const isSuccess = log.statusCode >= 200 && log.statusCode < 300;

              return (
                <div key={log.id} className="grid grid-cols-12 gap-2 px-4 py-3 items-center text-xs hover:bg-slate-50/50 transition">
                  {/* Lead details */}
                  <div className="col-span-3 min-w-0">
                    <p className="font-bold text-slate-800 truncate">{log.leadName}</p>
                    <p className="text-[11px] text-slate-400 truncate">{log.leadEmail}</p>
                  </div>

                  {/* Target CRM */}
                  <div className="col-span-3 flex items-center gap-2">
                    <span className="text-base">{visual.logo}</span>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-700 truncate">{visual.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString('fr-FR')} • {log.durationMs}ms
                      </p>
                    </div>
                  </div>

                  {/* HTTP Status */}
                  <div className="col-span-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border ${
                      isSuccess 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {isSuccess ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                      HTTP {log.statusCode}
                    </span>
                  </div>

                  {/* Remote CRM ID */}
                  <div className="col-span-2 font-mono text-[11px] text-slate-600 truncate">
                    {log.externalId ? (
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-700 font-bold">
                        {log.externalId}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => setInspectedLog(log)}
                      className="py-1 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition cursor-pointer flex items-center gap-1"
                    >
                      <Code2 className="w-3 h-3" />
                      <span>Inspecter</span>
                    </button>

                    <button
                      onClick={() => syncLeadToCrm(log.leadId, log.provider as any)}
                      title="Re-synchroniser ce prospect"
                      className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 3. WEBHOOKS & API REST AUTHENTICATION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Webhooks (7 Cols) */}
        <div className="lg:col-span-7 p-6 sm:p-8 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                <Webhook className="w-4 h-4 text-indigo-600" />
                Webhooks Temps Réel
              </h3>
              <p className="text-xs text-slate-500">Recevez un payload JSON à chaque nouveau prospect capturé</p>
            </div>
          </div>

          {/* Add webhook form */}
          <form onSubmit={handleAddWebhook} className="flex gap-2">
            <input
              type="url"
              required
              placeholder="https://votre-serveur.com/api/kardx-hook"
              value={newWebhookUrl}
              onChange={(e) => setNewWebhookUrl(e.target.value)}
              className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white"
            />
            <button
              type="submit"
              className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-md shadow-indigo-900/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter</span>
            </button>
          </form>

          {/* Webhooks list */}
          <div className="flex flex-col divide-y divide-slate-100 mt-2">
            {webhooks.map((wh) => (
              <div key={wh.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate font-mono">{wh.url}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
                      lead.created
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Dernier ping : Succès (200 OK)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => testWebhook(wh.id)}
                    className="py-1 px-2.5 rounded-lg text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition cursor-pointer"
                    title="Envoyer un payload test"
                  >
                    Tester
                  </button>
                  <button
                    onClick={() => deleteWebhook(wh.id)}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    title="Supprimer le webhook"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* API REST Tokens (5 Cols) */}
        <div className="lg:col-span-5 p-6 sm:p-8 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col gap-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-500" />
              Clé d'Authentification API REST
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Accès programmatique sécurisé à vos ressources</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-2">
            <span className="text-[11px] font-semibold text-slate-500">Clé d'API Production</span>
            <div className="flex items-center gap-2">
              <input
                type="password"
                readOnly
                value={apiKey}
                className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-800"
              />
              <button
                onClick={handleCopyKey}
                className="p-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-xs transition cursor-pointer"
                title="Copier la clé"
              >
                {copiedKey ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
            <p className="font-bold text-slate-800 mb-1">En-tête HTTP Requis :</p>
            <code className="text-indigo-600 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">Authorization: Bearer kx_live_...</code>
          </div>
        </div>

      </div>

      {/* CRM CONFIGURATION MODAL */}
      {selectedIntegrationForConfig && (
        <CrmConfigModal
          integration={selectedIntegrationForConfig}
          isOpen={true}
          onClose={() => setSelectedIntegrationForConfig(null)}
          onSave={updateIntegrationConfig}
          onToggleStatus={toggleIntegration}
          onTestConnection={testCrmConnection}
        />
      )}

      {/* PAYLOAD INSPECTOR MODAL */}
      {inspectedLog && (
        <CrmPayloadInspectorModal
          log={inspectedLog}
          onClose={() => setInspectedLog(null)}
          onResync={syncLeadToCrm}
        />
      )}

    </div>
  );
};
