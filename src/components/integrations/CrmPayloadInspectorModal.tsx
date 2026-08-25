import React, { useState } from 'react';
import { CrmSyncLog } from '../../types';
import { 
  X, 
  Check, 
  Copy, 
  ExternalLink, 
  Clock, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Code2, 
  Layers,
  ArrowRight
} from 'lucide-react';

interface CrmPayloadInspectorModalProps {
  log: CrmSyncLog | null;
  onClose: () => void;
  onResync?: (leadId: string, provider: any) => void;
}

export const CrmPayloadInspectorModal: React.FC<CrmPayloadInspectorModalProps> = ({
  log,
  onClose,
  onResync,
}) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'payload' | 'response' | 'headers'>('payload');

  if (!log) return null;

  const handleCopy = (text: string, section: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedSection(section);
      setTimeout(() => setCopiedSection(null), 2000);
    }
  };

  const getProviderBadge = (provider: string) => {
    switch (provider) {
      case 'hubspot':
        return { name: 'HubSpot CRM API v3', logo: '🟠', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'salesforce':
        return { name: 'Salesforce Sales Cloud REST', logo: '☁️', color: 'bg-sky-50 text-sky-700 border-sky-200' };
      case 'pipedrive':
        return { name: 'Pipedrive API v1', logo: '🟢', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'zoho':
        return { name: 'Zoho CRM API v2', logo: '🔴', color: 'bg-rose-50 text-rose-700 border-rose-200' };
      default:
        return { name: provider, logo: '⚡', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    }
  };

  const providerInfo = getProviderBadge(log.provider);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* HEADER */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{providerInfo.logo}</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-800">
                  Inspecteur de Transaction API CRM
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${providerInfo.color}`}>
                  {providerInfo.name}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Prospect : <strong className="text-slate-700">{log.leadName}</strong> ({log.leadEmail})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STATUS BAR */}
        <div className="px-6 py-3 bg-slate-900 text-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold font-mono text-[11px] ${
              log.statusCode >= 200 && log.statusCode < 300
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}>
              {log.statusCode >= 200 && log.statusCode < 300 ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5" />
              )}
              HTTP {log.statusCode} {log.statusCode === 201 ? 'Created' : log.statusCode === 200 ? 'OK' : 'Error'}
            </span>

            <span className="text-slate-400 font-mono text-[11px] flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {log.durationMs} ms
            </span>

            {log.externalId && (
              <span className="text-slate-300 font-mono text-[11px] bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                Remote ID: <span className="text-amber-400 font-bold">{log.externalId}</span>
              </span>
            )}
          </div>

          <span className="text-slate-400 text-[11px]">
            {new Date(log.timestamp).toLocaleString('fr-FR')}
          </span>
        </div>

        {/* ENDPOINT URL BANNER */}
        <div className="px-6 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 truncate">
            <span className="px-1.5 py-0.5 rounded bg-indigo-600 text-white font-bold text-[10px]">
              {log.requestPayload?.method || 'POST'}
            </span>
            <span className="text-slate-700 truncate">{log.requestPayload?.endpoint || 'https://api.crm.com/v1/sync'}</span>
          </div>
          <button
            onClick={() => handleCopy(log.requestPayload?.endpoint || '', 'endpoint')}
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition ml-2 shrink-0 cursor-pointer"
            title="Copier l'endpoint"
          >
            {copiedSection === 'endpoint' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex border-b border-slate-100 px-6 bg-white gap-2 pt-2">
          <button
            onClick={() => setActiveTab('payload')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'payload'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            Payload JSON Envoyé
          </button>

          <button
            onClick={() => setActiveTab('response')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'response'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Réponse Serveur CRM
          </button>

          <button
            onClick={() => setActiveTab('headers')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'headers'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            En-têtes HTTP (Headers)
          </button>
        </div>

        {/* TAB CONTENT */}
        <div className="p-6 overflow-y-auto max-h-[450px] bg-slate-950 font-mono text-xs text-slate-200">
          {activeTab === 'payload' && (
            <div className="relative">
              <button
                onClick={() => handleCopy(JSON.stringify(log.requestPayload?.body || log.requestPayload, null, 2), 'body')}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-[11px] flex items-center gap-1 cursor-pointer border border-slate-700"
              >
                {copiedSection === 'body' ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Copié</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copier JSON</span>
                  </>
                )}
              </button>
              <pre className="whitespace-pre-wrap overflow-x-auto leading-relaxed text-emerald-400">
                {JSON.stringify(log.requestPayload?.body || log.requestPayload, null, 2)}
              </pre>

              {log.requestPayload?.dealCreation && (
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-2">
                    ⚡ Création d'opportunité associée (Deal) :
                  </span>
                  <pre className="text-amber-300">
                    {JSON.stringify(log.requestPayload.dealCreation, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {activeTab === 'response' && (
            <div className="relative">
              <button
                onClick={() => handleCopy(JSON.stringify(log.responseBody, null, 2), 'resp')}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-[11px] flex items-center gap-1 cursor-pointer border border-slate-700"
              >
                {copiedSection === 'resp' ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Copié</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copier</span>
                  </>
                )}
              </button>
              <pre className="whitespace-pre-wrap overflow-x-auto leading-relaxed text-sky-300">
                {JSON.stringify(log.responseBody || { status: 'OK', externalId: log.externalId }, null, 2)}
              </pre>
            </div>
          )}

          {activeTab === 'headers' && (
            <div className="relative">
              <pre className="whitespace-pre-wrap overflow-x-auto leading-relaxed text-slate-300">
                {JSON.stringify(log.requestPayload?.headers || {
                  'Authorization': 'Bearer pat-eu1-*** [MASQUÉ]',
                  'Content-Type': 'application/json',
                  'X-KardX-Engine': 'v2.4-Enterprise',
                }, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Log ID : <code className="font-mono text-[11px]">{log.id}</code>
          </span>

          <div className="flex items-center gap-2">
            {onResync && (
              <button
                onClick={() => {
                  onResync(log.leadId, log.provider);
                  onClose();
                }}
                className="py-2 px-4 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition cursor-pointer flex items-center gap-1.5"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                Re-pousser ce prospect
              </button>
            )}

            <button
              onClick={onClose}
              className="py-2 px-4 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
