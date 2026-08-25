import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Organization, Department, Team, User, PlanType, UserRole } from '../../types';
import { PLATFORM_MODULES } from '../../utils/permissions';
import { ImageUploadModal } from '../common/ImageUploadModal';
import {
  Building2,
  X,
  Check,
  Settings,
  Layers,
  FolderTree,
  Users,
  UserPlus,
  ShieldCheck,
  KeyRound,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Lock,
  Save,
  CheckCircle2,
  RefreshCw,
  Palette,
  Camera,
  Upload,
  Image as ImageIcon
} from 'lucide-react';

interface OrganizationConfigModalProps {
  organization: Organization | null;
  isOpen: boolean;
  onClose: () => void;
}

interface OrganizationConfigModalContentProps {
  organization: Organization;
  onClose: () => void;
}

const OrganizationConfigModalContent: React.FC<OrganizationConfigModalContentProps> = ({
  organization,
  onClose,
}) => {
  const {
    organizations,
    updateOrganization,
    switchOrganization,
    departments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    teams,
    createTeam,
    updateTeam,
    deleteTeam,
    users,
    addUser,
    updateUserRole,
    updateUserPosition,
    updateUserStatus,
    showToast,
  } = useApp();

  // Active tab inside the config studio
  const [activeTab, setActiveTab] = useState<'general' | 'modules' | 'departments' | 'teams' | 'members'>('general');

  // General state
  const [name, setName] = useState(organization.name);
  const [domain, setDomain] = useState(organization.domain || '');
  const [logoUrl, setLogoUrl] = useState(organization.logoUrl || '');
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [plan, setPlan] = useState<PlanType>(organization.plan);
  const [seatsTotal, setSeatsTotal] = useState(organization.seatsTotal);
  const [primaryColor, setPrimaryColor] = useState(organization.primaryColor || '#1e3a8a');
  const [status, setStatus] = useState<'active' | 'trial' | 'suspended'>(organization.status);

  // Enabled modules
  const [enabledModules, setEnabledModules] = useState<string[]>(
    organization.enabledModules || PLATFORM_MODULES.map((m) => m.id)
  );

  // Scoped data for this organization
  const orgDepartments = departments.filter((d) => d.organizationId === organization.id);
  const orgTeams = teams.filter((t) => t.organizationId === organization.id);
  const orgUsers = users.filter((u) => u.organizationId === organization.id);

  // Department creation state
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptDesc, setNewDeptDesc] = useState('');
  const [newDeptHead, setNewDeptHead] = useState('');

  // Team creation state
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDesc, setNewTeamDesc] = useState('');
  const [newTeamDeptId, setNewTeamDeptId] = useState('');
  const [newTeamManagerId, setNewTeamManagerId] = useState('');

  // Member creation state
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<UserRole>('collaborateur');
  const [newMemberPosition, setNewMemberPosition] = useState('Chargé de Compte');
  const [newMemberDeptId, setNewMemberDeptId] = useState('');
  const [newMemberTeamId, setNewMemberTeamId] = useState('');
  const [newMemberTempPassword, setNewMemberTempPassword] = useState(
    () => `KardX-${Math.random().toString(36).substring(2, 6).toUpperCase()}#${Math.floor(1000 + Math.random() * 9000)}`
  );

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    updateOrganization(organization.id, {
      name: name.trim(),
      domain: domain.trim() || undefined,
      logoUrl: logoUrl.trim() || undefined,
      plan,
      seatsTotal,
      primaryColor,
      status,
    });
    showToast(`Paramètres de l'organisation "${name}" enregistrés.`);
  };

  const handleToggleModule = (moduleId: string) => {
    const updated = enabledModules.includes(moduleId)
      ? enabledModules.filter((id) => id !== moduleId)
      : [...enabledModules, moduleId];
    setEnabledModules(updated);
    updateOrganization(organization.id, { enabledModules: updated });
  };

  const handleSelectAllModules = () => {
    const all = PLATFORM_MODULES.map((m) => m.id);
    setEnabledModules(all);
    updateOrganization(organization.id, { enabledModules: all });
    showToast('Tous les modules ont été activés pour cette organisation.');
  };

  // Add Dept
  const handleAddDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    createDepartment({
      name: newDeptName.trim(),
      description: newDeptDesc.trim() || undefined,
      headUserId: newDeptHead || undefined,
    });
    setNewDeptName('');
    setNewDeptDesc('');
    setNewDeptHead('');
    showToast(`Département "${newDeptName}" créé.`);
  };

  // Add Team
  const handleAddTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    createTeam({
      name: newTeamName.trim(),
      description: newTeamDesc.trim() || undefined,
      departmentId: newTeamDeptId || undefined,
      managerId: newTeamManagerId || undefined,
    });
    setNewTeamName('');
    setNewTeamDesc('');
    setNewTeamDeptId('');
    setNewTeamManagerId('');
    showToast(`Équipe "${newTeamName}" créée.`);
  };

  // Add Member
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberEmail.trim()) {
      showToast('Nom et email requis.');
      return;
    }
    addUser({
      name: newMemberName.trim(),
      email: newMemberEmail.trim().toLowerCase(),
      role: newMemberRole,
      position: newMemberPosition.trim() || 'Collaborateur',
      jobTitle: newMemberPosition.trim() || 'Collaborateur',
      departmentId: newMemberDeptId || undefined,
      teamId: newMemberTeamId || undefined,
      password: newMemberTempPassword,
      mustChangePassword: true,
      status: 'active',
      twoFactorEnabled: false,
    });

    setNewMemberName('');
    setNewMemberEmail('');
    setNewMemberPosition('Collaborateur');
    setNewMemberTempPassword(
      `KardX-${Math.random().toString(36).substring(2, 6).toUpperCase()}#${Math.floor(1000 + Math.random() * 9000)}`
    );
    showToast(`Membre invité avec mot de passe temporaire et changement obligatoire.`);
  };

  const handleSwitchToOrg = () => {
    switchOrganization(organization.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-8 border border-slate-100 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold shadow-xs text-base shrink-0"
              style={{ backgroundColor: organization.primaryColor || '#6366f1' }}
            >
              {organization.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{organization.name}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-50 text-purple-700 border border-purple-200">
                  {organization.plan.toUpperCase()}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    organization.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {organization.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                ID: <span className="font-mono">{organization.id}</span> • Responsable : {organization.adminName} ({organization.adminEmail})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSwitchToOrg}
              className="py-2 px-3.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs border border-purple-200 transition cursor-pointer flex items-center gap-1.5"
              title="Basculer sur cette organisation"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Basculer sur cet espace</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl border border-slate-200/80 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('general')}
            className={`py-2 px-3.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'general' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Général & Licences</span>
          </button>

          <button
            onClick={() => setActiveTab('modules')}
            className={`py-2 px-3.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'modules' ? 'bg-white text-purple-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Modules & Briques ({enabledModules.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('departments')}
            className={`py-2 px-3.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'departments' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span>Départements ({orgDepartments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('teams')}
            className={`py-2 px-3.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'teams' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Équipes ({orgTeams.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('members')}
            className={`py-2 px-3.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'members' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Membres & Postes ({orgUsers.length})</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: GENERAL */}
        {/* ========================================================================= */}
        {activeTab === 'general' && (
          <form onSubmit={handleSaveGeneral} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Nom de l'Organisation</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Domaine officiel</label>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="entreprise.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Formule d'Abonnement</label>
                <select
                  value={plan}
                  onChange={(e) => setPlan(e.target.value as PlanType)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white font-semibold cursor-pointer"
                >
                  <option value="pro">Pro (10 sièges)</option>
                  <option value="business">Business (25 sièges)</option>
                  <option value="enterprise">Enterprise (100+ sièges)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Sièges / Licences Max</label>
                <input
                  type="number"
                  min="1"
                  value={seatsTotal}
                  onChange={(e) => setSeatsTotal(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Statut de l'Organisation</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white font-semibold cursor-pointer"
                >
                  <option value="active">Actif</option>
                  <option value="trial">Période d'essai (Trial)</option>
                  <option value="suspended">Suspendu (Accès bloqué)</option>
                </select>
              </div>
            </div>

            {/* Logo de l'organisation */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div 
                  onClick={() => setIsLogoModalOpen(true)}
                  className="w-14 h-14 rounded-2xl bg-white p-2 border border-slate-200 shadow-sm flex items-center justify-center cursor-pointer group shrink-0 relative overflow-hidden"
                >
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <Building2 className="w-6 h-6 text-slate-400" />
                  )}
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px] font-bold">
                    <Upload className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-800">Logo Officiel de l'Organisation</h4>
                  <p className="text-[11px] text-slate-500">
                    {logoUrl ? 'Logo personnalisé en place' : 'PNG transparent, SVG ou suggestions de marques'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsLogoModalOpen(true)}
                className="py-2 px-3.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 shadow-2xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Camera className="w-3.5 h-3.5 text-purple-600" />
                <span>{logoUrl ? 'Modifier le logo...' : 'Choisir / Uploader...'}</span>
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Couleur Primaire de Marque</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-36 px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                className="py-2.5 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Enregistrer les Modifications</span>
              </button>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: MODULES */}
        {/* ========================================================================= */}
        {activeTab === 'modules' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-xs text-slate-800">
                  Feature Flags & Modules Activés pour {organization.name}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Cochez ou décochez les fonctionnalités accessibles par les collaborateurs de cette entreprise.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSelectAllModules}
                className="text-xs font-bold text-purple-600 hover:text-purple-700 cursor-pointer"
              >
                Activer tous les modules
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto p-1">
              {PLATFORM_MODULES.map((mod) => {
                const isEnabled = enabledModules.includes(mod.id);
                return (
                  <div
                    key={mod.id}
                    onClick={() => handleToggleModule(mod.id)}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                      isEnabled
                        ? 'border-purple-300 bg-purple-50/50 text-purple-950 shadow-2xs'
                        : 'border-slate-200 bg-slate-50 text-slate-400 opacity-60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900">{mod.name}</span>
                        <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                          {mod.category}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 line-clamp-1">{mod.description}</p>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-xl flex items-center justify-center shrink-0 ${
                        isEnabled ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-400'
                      }`}
                    >
                      {isEnabled && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: DEPARTMENTS */}
        {/* ========================================================================= */}
        {activeTab === 'departments' && (
          <div className="space-y-5">
            {/* Create Dept form */}
            <form onSubmit={handleAddDepartment} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-purple-600" />
                <span>Créer un Nouveau Département</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  placeholder="Nom (ex: Conseil & Stratégie)"
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-purple-500"
                />
                <input
                  type="text"
                  value={newDeptDesc}
                  onChange={(e) => setNewDeptDesc(e.target.value)}
                  placeholder="Description du département"
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-purple-500"
                />
                <div className="flex items-center gap-2">
                  <select
                    value={newDeptHead}
                    onChange={(e) => setNewDeptHead(e.target.value)}
                    className="flex-1 px-2.5 py-2 rounded-xl border border-slate-200 bg-white text-xs cursor-pointer"
                  >
                    <option value="">Responsable département...</option>
                    {orgUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.jobTitle || u.role})
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-500 cursor-pointer shrink-0"
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            </form>

            {/* List */}
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {orgDepartments.map((dept) => {
                const head = orgUsers.find((u) => u.id === dept.headUserId);
                const deptTeams = orgTeams.filter((t) => t.departmentId === dept.id);
                return (
                  <div
                    key={dept.id}
                    className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{dept.name}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700">
                          {deptTeams.length} équipe(s)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {dept.description || 'Aucune description'}
                        {head && <span className="font-semibold text-slate-700"> • Responsable : {head.name}</span>}
                      </p>
                    </div>

                    <button
                      onClick={() => deleteDepartment(dept.id)}
                      className="p-2 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                      title="Supprimer le département"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: TEAMS */}
        {/* ========================================================================= */}
        {activeTab === 'teams' && (
          <div className="space-y-5">
            {/* Create Team form */}
            <form onSubmit={handleAddTeam} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-purple-600" />
                <span>Créer une Nouvelle Équipe</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <input
                  type="text"
                  required
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="Nom de l'équipe (ex: Grands Comptes)"
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-purple-500"
                />
                <select
                  value={newTeamDeptId}
                  onChange={(e) => setNewTeamDeptId(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs cursor-pointer"
                >
                  <option value="">Rattacher à un département...</option>
                  {orgDepartments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <select
                  value={newTeamManagerId}
                  onChange={(e) => setNewTeamManagerId(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs cursor-pointer"
                >
                  <option value="">Manager de l'équipe...</option>
                  {orgUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-500 cursor-pointer"
                >
                  Créer l'Équipe
                </button>
              </div>
            </form>

            {/* List */}
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {orgTeams.map((team) => {
                const parentDept = orgDepartments.find((d) => d.id === team.departmentId);
                const manager = orgUsers.find((u) => u.id === team.managerId);
                const teamMembers = orgUsers.filter((u) => u.teamId === team.id);
                return (
                  <div
                    key={team.id}
                    className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{team.name}</span>
                        {parentDept && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700">
                            {parentDept.name}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {teamMembers.length} membre(s)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {manager ? `Manager : ${manager.name}` : 'Aucun manager assigné'}
                      </p>
                    </div>

                    <button
                      onClick={() => deleteTeam(team.id)}
                      className="p-2 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                      title="Supprimer l'équipe"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: MEMBERS */}
        {/* ========================================================================= */}
        {activeTab === 'members' && (
          <div className="space-y-5">
            {/* Add Member form */}
            <form onSubmit={handleAddMember} className="p-4 rounded-2xl bg-purple-50/50 border border-purple-200 space-y-3">
              <h4 className="font-bold text-xs text-purple-900 flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5 text-purple-600" />
                <span>Ajouter / Inviter un Nouveau Collaborateur</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <input
                  type="text"
                  required
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="Nom & Prénom"
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                />
                <input
                  type="email"
                  required
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="Email professionnel"
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                />
                <input
                  type="text"
                  value={newMemberPosition}
                  onChange={(e) => setNewMemberPosition(e.target.value)}
                  placeholder="Poste / Fonction (ex: Directeur Achats)"
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value as UserRole)}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs cursor-pointer font-semibold"
                >
                  <option value="admin">Administrateur</option>
                  <option value="manager">Manager d'équipe</option>
                  <option value="collaborateur">Collaborateur</option>
                  <option value="viewer">Observateur</option>
                </select>

                <select
                  value={newMemberDeptId}
                  onChange={(e) => setNewMemberDeptId(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs cursor-pointer"
                >
                  <option value="">Département...</option>
                  {orgDepartments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>

                <select
                  value={newMemberTeamId}
                  onChange={(e) => setNewMemberTeamId(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs cursor-pointer"
                >
                  <option value="">Équipe...</option>
                  {orgTeams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  Inviter & Créer
                </button>
              </div>

              <div className="text-[11px] text-purple-800 bg-purple-100/60 p-2 rounded-xl flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                <span>
                  Mot de passe temporaire : <code className="font-mono font-bold">{newMemberTempPassword}</code> (Changement obligatoire à la 1ère connexion).
                </span>
              </div>
            </form>

            {/* List */}
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {orgUsers.map((user) => {
                const userDept = orgDepartments.find((d) => d.id === user.departmentId);
                const userTeam = orgTeams.find((t) => t.id === user.teamId);
                return (
                  <div
                    key={user.id}
                    className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{user.name}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-50 text-purple-700">
                          {user.role}
                        </span>
                        {user.mustChangePassword && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700">
                            MDP Temporaire
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {user.email} • {user.position || user.jobTitle || 'Collaborateur'}
                        {userDept && ` • Dép: ${userDept.name}`}
                        {userTeam && ` • Éq: ${userTeam.name}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={user.role}
                        onChange={(e) => updateUserRole(user.id, e.target.value as UserRole)}
                        className="px-2 py-1 rounded-lg border border-slate-200 text-xs bg-slate-50 cursor-pointer"
                      >
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="collaborateur">Collaborateur</option>
                        <option value="viewer">Observateur</option>
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* Logo Upload Modal */}
      {isLogoModalOpen && (
        <ImageUploadModal
          isOpen={isLogoModalOpen}
          onClose={() => setIsLogoModalOpen(false)}
          type="logo"
          currentValue={logoUrl}
          onSave={(newUrl) => {
            setLogoUrl(newUrl);
            updateOrganization(organization.id, { logoUrl: newUrl });
            showToast('Logo mis à jour pour l\'organisation.');
          }}
        />
      )}

    </div>
  );
};

export const OrganizationConfigModal: React.FC<OrganizationConfigModalProps> = ({
  organization,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !organization) return null;

  return <OrganizationConfigModalContent organization={organization} onClose={onClose} />;
};
