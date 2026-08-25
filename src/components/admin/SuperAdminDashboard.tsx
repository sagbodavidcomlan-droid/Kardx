import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Organization, UserRole, PlanType } from '../../types';
import { 
  ShieldAlert, 
  Building2, 
  Users, 
  CreditCard, 
  TrendingUp, 
  Search, 
  Plus, 
  CheckCircle, 
  Activity,
  Layers,
  ArrowUpRight,
  Shield,
  ShieldCheck,
  KeyRound,
  Lock,
  Unlock,
  EyeOff,
  Sliders,
  Check,
  X,
  History,
  RotateCcw,
  Sparkles,
  Zap,
  LayoutGrid,
  Settings,
  FolderTree,
  ExternalLink,
} from 'lucide-react';
import { PLATFORM_MODULES, RBAC_PRESETS, ROLE_DEFINITIONS } from '../../utils/permissions';
import { CreateOrgWizardModal } from './CreateOrgWizardModal';
import { OrganizationConfigModal } from './OrganizationConfigModal';

export const SuperAdminDashboard: React.FC = () => {
  const { 
    currentUser,
    organizations,
    departments,
    teams,
    users,
    createOrganization,
    switchOrganization,
    suspendOrganization,
    reactivateOrganization,
    roleModuleMapping,
    toggleRoleModule,
    applyRbacPreset,
    rbacAuditLogs,
    showToast 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'organizations' | 'rbac' | 'audit'>('organizations');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isWizardModalOpen, setIsWizardModalOpen] = useState(false);
  const [selectedConfigOrg, setSelectedConfigOrg] = useState<Organization | null>(null);

  const filteredOrgs = organizations.filter((org) =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (org.adminEmail && org.adminEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (org.adminName && org.adminName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalSeats = organizations.reduce((acc, t) => acc + t.seatsTotal, 0);
  const totalUsedSeats = organizations.reduce((acc, t) => acc + t.seatsUsed, 0);

  const rolesToMap: { role: UserRole; label: string; badgeColor: string }[] = [
    { role: 'admin', label: 'Admin Org', badgeColor: 'bg-rose-50 text-rose-700 border-rose-200' },
    { role: 'manager', label: 'Manager d\'équipe', badgeColor: 'bg-amber-50 text-amber-700 border-amber-200' },
    { role: 'collaborateur', label: 'Collaborateur', badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    { role: 'viewer', label: 'Lecture seule (Viewer)', badgeColor: 'bg-slate-100 text-slate-700 border-slate-200' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-slate-800 flex flex-col gap-8">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
              Console Super Administrateur Kardx
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
              Super Admin Mode
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Supervision multi-tenant des organisations, matrice de permissions RBAC et conformité stricte d'isolation des données.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsWizardModalOpen(true)}
            className="py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-purple-900/20 transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Créer une Organisation</span>
          </button>
        </div>
      </div>

      {/* STRICT DATA ISOLATION NOTICE BANNER */}
      <div className="p-4 rounded-2xl bg-indigo-950 border border-indigo-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-800/80 flex items-center justify-center text-indigo-200 shrink-0">
            <EyeOff className="w-5 h-5 text-indigo-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-100">Principe de Confidentialité & Isolation Stricte Kardx</span>
              <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Chiffrement & Sécurité Actifs
              </span>
            </div>
            <p className="text-[11px] text-indigo-300/90 mt-0.5">
              Le SuperAdmin et l'équipe Kardx ont un droit de gestion infrastructure (tenants, licences, rôles), mais <strong>n'ont jamais accès aux données métier</strong> (fiches de leads, cartes et profils confidentiels des entreprises clientes).
            </p>
          </div>
        </div>
      </div>

      {/* PLATFORM KPI METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-500">Organisations Clientes</span>
            <Building2 className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-slate-800">{organizations.length}</p>
          <span className="text-[11px] text-emerald-700 font-medium">100% opérationnelles</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-500">Licences / Sièges Actifs</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-slate-800">{totalUsedSeats} / {totalSeats}</p>
          <span className="text-[11px] text-purple-700 font-medium">Capacité totale supervisée</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-500">Modules RBAC Gérés</span>
            <Sliders className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-slate-800">{PLATFORM_MODULES.length} modules</p>
          <span className="text-[11px] text-indigo-700 font-medium">Matrice de contrôle d'accès</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-500">Audit Logs RBAC</span>
            <History className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-slate-800">{rbacAuditLogs.length} actions</p>
          <span className="text-[11px] text-emerald-700 font-medium">Traçabilité complète</span>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('organizations')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'organizations'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Organisations Clientes ({organizations.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('rbac')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'rbac'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Matrice de Contrôle RBAC (Rôles & Modules)</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Journal d'Audit RBAC ({rbacAuditLogs.length})</span>
          </button>
        </div>

        {activeTab === 'organizations' && (
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher organisation ou admin..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-500 shadow-xs"
            />
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ORGANIZATIONS MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'organizations' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Organisation</th>
                  <th className="py-3.5 px-4 font-bold">Plan & Facturation</th>
                  <th className="py-3.5 px-4 font-bold">Licences Utilisées</th>
                  <th className="py-3.5 px-4 font-bold">Responsable Principal</th>
                  <th className="py-3.5 px-4 font-bold">Statut</th>
                  <th className="py-3.5 px-4 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredOrgs.map((org) => {
                  const usagePercent = Math.round((org.seatsUsed / org.seatsTotal) * 100);
                  const isSuspended = org.status === 'suspended';

                  return (
                    <tr key={org.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center font-bold text-purple-700 text-sm">
                            {org.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{org.name}</p>
                            <p className="text-[11px] text-slate-400">ID: {org.id}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                          {org.plan}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                            <span>{org.seatsUsed} / {org.seatsTotal}</span>
                            <span className="text-[10px] text-slate-400">{usagePercent}%</span>
                          </div>
                          <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-600 rounded-full"
                              style={{ width: `${Math.min(usagePercent, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div>
                          <p className="font-semibold text-slate-800 text-xs">{org.adminName || 'Admin Dédié'}</p>
                          <p className="text-[11px] text-slate-400">{org.adminEmail || 'admin@societe.com'}</p>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          !isSuspended
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {!isSuspended ? 'Actif' : 'Suspendu'}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedConfigOrg(org)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                            title="Configurer départements, équipes, modules et membres"
                          >
                            <Settings className="w-3.5 h-3.5" />
                            <span>Configurer</span>
                          </button>

                          <button
                            onClick={() => {
                              if (isSuspended) {
                                reactivateOrganization(org.id);
                              } else {
                                suspendOrganization(org.id);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
                              !isSuspended
                                ? 'text-slate-600 hover:text-rose-600 border-slate-200 hover:border-rose-200 hover:bg-rose-50'
                                : 'text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100'
                            }`}
                          >
                            {!isSuspended ? (
                              <>
                                <Lock className="w-3.5 h-3.5" />
                                <span>Suspendre</span>
                              </>
                            ) : (
                              <>
                                <Unlock className="w-3.5 h-3.5" />
                                <span>Réactiver</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: RBAC MATRIX & MODULE ACCESS */}
      {/* ========================================================================= */}
      {activeTab === 'rbac' && (
        <div className="space-y-6">
          
          {/* Presets Bar */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Modèles de Permissions Préconfigurés (Presets RBAC)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Appliquez une matrice de sécurité en un clic sur tous les rôles de la plateforme.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              {RBAC_PRESETS.map((preset) => (
                <div
                  key={preset.id}
                  className="p-4 rounded-2xl border border-slate-200 hover:border-purple-300 bg-slate-50/50 hover:bg-purple-50/30 transition flex flex-col justify-between gap-3 cursor-pointer"
                  onClick={() => applyRbacPreset(preset.id)}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-800">{preset.name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-700">
                        {preset.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">{preset.description}</p>
                  </div>

                  <button
                    type="button"
                    className="w-full py-1.5 rounded-xl bg-white hover:bg-purple-600 hover:text-white text-purple-700 font-bold text-xs border border-purple-200 transition cursor-pointer"
                  >
                    Appliquer ce preset
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Matrix */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-800">Matrice Graphique des Rôles et Modules</h3>
                <p className="text-xs text-slate-500">Cochez ou décochez les modules autorisés pour chaque rôle utilisateur.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Module Kardx</th>
                    <th className="py-3.5 px-4">Catégorie & Risque</th>
                    {rolesToMap.map((r) => (
                      <th key={r.role} className="py-3.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${r.badgeColor}`}>
                          {r.label}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {PLATFORM_MODULES.map((mod) => {
                    return (
                      <tr key={mod.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5 px-4">
                          <div>
                            <span className="font-bold text-slate-800 block text-xs">{mod.name}</span>
                            <span className="text-[11px] text-slate-400">{mod.description}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                              {mod.category}
                            </span>
                            <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                              mod.riskLevel === 'high' ? 'bg-rose-50 text-rose-700' :
                              mod.riskLevel === 'medium' ? 'bg-amber-50 text-amber-700' :
                              'bg-emerald-50 text-emerald-700'
                            }`}>
                              {mod.riskLevel}
                            </span>
                          </div>
                        </td>

                        {rolesToMap.map((r) => {
                          const allowedList = roleModuleMapping[r.role] || [];
                          const isAllowed = allowedList.includes(mod.id);

                          return (
                            <td key={r.role} className="py-3.5 px-4 text-center">
                              <button
                                onClick={() => toggleRoleModule(r.role, mod.id)}
                                className={`w-7 h-7 rounded-xl flex items-center justify-center mx-auto transition cursor-pointer ${
                                  isAllowed
                                    ? 'bg-emerald-500 text-white shadow-xs hover:bg-emerald-600'
                                    : 'bg-slate-100 text-slate-300 hover:bg-slate-200'
                                }`}
                                title={isAllowed ? `Désactiver ${mod.name} pour ${r.label}` : `Activer ${mod.name} pour ${r.label}`}
                              >
                                {isAllowed ? <Check className="w-4 h-4" /> : <X className="w-3.5 h-3.5" />}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: RBAC AUDIT LOGS */}
      {/* ========================================================================= */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-800">Historique des Modifications RBAC</h3>
              <p className="text-xs text-slate-500">Traçabilité complète des changements d'autorisations et règles d'accès.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Date & Heure</th>
                  <th className="py-3.5 px-4">Auteur</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {rbacAuditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {new Date(log.timestamp).toLocaleString('fr-FR')}
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <span className="font-bold text-slate-800 block">{log.actorName}</span>
                        <span className="text-[11px] text-slate-400">{log.actorEmail}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-50 text-purple-700 border border-purple-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">
                      {log.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}
      
      {/* 1. Complete Multi-Step Organization Creation Wizard */}
      <CreateOrgWizardModal
        isOpen={isWizardModalOpen}
        onClose={() => setIsWizardModalOpen(false)}
        onSuccess={(orgId) => {
          setIsWizardModalOpen(false);
          const created = organizations.find((o) => o.id === orgId);
          if (created) {
            setSelectedConfigOrg(created);
          }
        }}
      />

      {/* 2. Granular Organization Configuration Studio */}
      <OrganizationConfigModal
        organization={selectedConfigOrg}
        isOpen={!!selectedConfigOrg}
        onClose={() => setSelectedConfigOrg(null)}
      />

    </div>
  );
};
