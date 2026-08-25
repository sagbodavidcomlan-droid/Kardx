import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Settings, 
  ShieldCheck, 
  Bell, 
  Building, 
  User, 
  Key, 
  Smartphone, 
  Save, 
  Check, 
  Globe, 
  Download,
  Trash2,
  Lock,
  Sparkles
} from 'lucide-react';
import { TwoFactorSettings } from '../security/TwoFactorSettings';

export const SettingsPage: React.FC = () => {
  const { currentUser, currentOrg, showToast } = useApp();

  const [activeSection, setActiveSection] = useState<'security' | 'organization' | 'notifications'>('security');
  const [orgName, setOrgName] = useState(currentOrg.name);
  const [customDomain, setCustomDomain] = useState('card.bestexperts-group.com');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [whatsappAlerts, setWhatsappAlerts] = useState(false);

  const handleSaveOrg = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Paramètres de l\'organisation et domaine CNAME enregistrés !');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-slate-800 flex flex-col gap-8">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            Paramètres & Sécurité des Accès
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Gérez l'authentification à double facteur (2FA), vos domaines de cartes connectées et alertes de prospection.
          </p>
        </div>

        {/* Quick Nav Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200/80 text-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveSection('security')}
            className={`py-2 px-3.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeSection === 'security'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Sécurité & 2FA</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('organization')}
            className={`py-2 px-3.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeSection === 'organization'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Organisation</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('notifications')}
            className={`py-2 px-3.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeSection === 'notifications'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Notifications</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: SÉCURITÉ & 2FA COMPONENT */}
      {activeSection === 'security' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-150">
          <TwoFactorSettings />
        </div>
      )}

      {/* SECTION 2: ORGANISATION & DOMAINE WHITE-LABEL */}
      {activeSection === 'organization' && (
        <form onSubmit={handleSaveOrg} className="flex flex-col gap-6 animate-in fade-in duration-150">
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col gap-4">
            <h3 className="font-bold text-base text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-600" />
              Identité de l'Organisation & Domaine White-Label
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Raison Sociale</label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Domaine Personnalisé CNAME (White-Label)</label>
                <input
                  type="text"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  placeholder="card.mon-entreprise.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
              <span>Statut SSL / HTTPS du domaine personnalisé</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-600" /> Actif & Sécurisé
              </span>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-900/20 flex items-center gap-2 transition active:scale-95 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer l'organisation</span>
            </button>
          </div>
        </form>
      )}

      {/* SECTION 3: NOTIFICATIONS COMMERCIALES */}
      {activeSection === 'notifications' && (
        <form onSubmit={(e) => { e.preventDefault(); showToast('Préférences de notifications enregistrées !'); }} className="flex flex-col gap-6 animate-in fade-in duration-150">
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col gap-4">
            <h3 className="font-bold text-base text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-500" />
              Alertes Instantanées de Capture Commerciale
            </h3>

            <div className="flex flex-col gap-3">
              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/60 transition">
                <span className="text-xs font-semibold text-slate-700">Recevoir un email à chaque formulaire complété</span>
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="rounded text-indigo-600 w-4 h-4 accent-indigo-600"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/60 transition">
                <span className="text-xs font-semibold text-slate-700">Alerte WhatsApp instantanée sur mobile</span>
                <input
                  type="checkbox"
                  checked={whatsappAlerts}
                  onChange={(e) => setWhatsappAlerts(e.target.checked)}
                  className="rounded text-indigo-600 w-4 h-4 accent-indigo-600"
                />
              </label>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-900/20 flex items-center gap-2 transition active:scale-95 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer les préférences</span>
            </button>
          </div>
        </form>
      )}

    </div>
  );
};
