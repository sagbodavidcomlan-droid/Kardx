import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PlanType, UserRole } from '../../types';
import { PLATFORM_MODULES } from '../../utils/permissions';
import { ImageUploadModal } from '../common/ImageUploadModal';
import {
  Building2,
  X,
  Check,
  ShieldCheck,
  KeyRound,
  Users,
  Layers,
  FolderTree,
  UserPlus,
  Plus,
  Trash2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Lock,
  Zap,
  Camera,
  Upload,
  Image as ImageIcon
} from 'lucide-react';

interface CreateOrgWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (orgId: string) => void;
}

const PRESET_DEPARTMENTS = [
  { name: 'Direction Commerciale', description: 'Équipes de vente, prospection grands comptes et partenariats' },
  { name: 'Marketing & Communication', description: 'Image de marque, événements et acquisition digitale' },
  { name: 'Conseil & Stratégie', description: 'Consultants, chefs de projets et experts métiers' },
  { name: 'Ressources Humaines', description: 'Talents, onboarding et relations internes' },
];

export const CreateOrgWizardModal: React.FC<CreateOrgWizardModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { createOrganization, showToast } = useApp();

  // Wizard step: 1 (General & Plan), 2 (Modules), 3 (Structure: Depts & Teams), 4 (Admin & Users), 5 (Review)
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Step 1: General & Logo
  const [orgName, setOrgName] = useState('');
  const [domain, setDomain] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [plan, setPlan] = useState<PlanType>('business');
  const [seatsTotal, setSeatsTotal] = useState(25);
  const [primaryColor, setPrimaryColor] = useState('#1e3a8a');

  // Step 2: Enabled Modules
  const [selectedModules, setSelectedModules] = useState<string[]>(
    PLATFORM_MODULES.map((m) => m.id)
  );

  // Step 3: Departments & Teams
  const [departments, setDepartments] = useState<{ name: string; description?: string }[]>([
    { name: 'Direction Commerciale', description: 'Développement commercial & Vente terrain' },
    { name: 'Marketing & Digital', description: 'Communication, salons & partenariats' },
  ]);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptDesc, setNewDeptDesc] = useState('');

  const [teams, setTeams] = useState<{ name: string; departmentName?: string; description?: string }[]>([
    { name: 'Équipe Grands Comptes', departmentName: 'Direction Commerciale' },
    { name: 'Équipe Partenariats & Salons', departmentName: 'Direction Commerciale' },
  ]);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDept, setNewTeamDept] = useState('Direction Commerciale');

  // Step 4: Admin & Initial Collaborators
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminJobTitle, setAdminJobTitle] = useState('Directeur Général');
  const [adminPosition, setAdminPosition] = useState('Responsable d\'Organisation');
  const [tempPassword, setTempPassword] = useState(() => `KardX-${Math.random().toString(36).substring(2, 6).toUpperCase()}#${Math.floor(1000 + Math.random() * 9000)}`);

  const [initialMembers, setInitialMembers] = useState<{
    name: string;
    email: string;
    role: UserRole;
    position: string;
    departmentName: string;
    teamName: string;
  }[]>([]);

  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<UserRole>('collaborateur');
  const [newMemberPosition, setNewMemberPosition] = useState('Chargé de Compte');
  const [newMemberDept, setNewMemberDept] = useState('');
  const [newMemberTeam, setNewMemberTeam] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleToggleModule = (modId: string) => {
    if (selectedModules.includes(modId)) {
      setSelectedModules(selectedModules.filter((id) => id !== modId));
    } else {
      setSelectedModules([...selectedModules, modId]);
    }
  };

  const handleSelectAllModules = () => {
    setSelectedModules(PLATFORM_MODULES.map((m) => m.id));
  };

  const handleAddDepartment = () => {
    if (!newDeptName.trim()) return;
    setDepartments([...departments, { name: newDeptName.trim(), description: newDeptDesc.trim() || undefined }]);
    setNewDeptName('');
    setNewDeptDesc('');
  };

  const handleRemoveDepartment = (index: number) => {
    const targetDept = departments[index];
    setDepartments(departments.filter((_, i) => i !== index));
    // Remove or unlink teams
    setTeams(teams.map((t) => (t.departmentName === targetDept?.name ? { ...t, departmentName: undefined } : t)));
  };

  const handleAddTeam = () => {
    if (!newTeamName.trim()) return;
    setTeams([...teams, { name: newTeamName.trim(), departmentName: newTeamDept || undefined }]);
    setNewTeamName('');
  };

  const handleRemoveTeam = (index: number) => {
    setTeams(teams.filter((_, i) => i !== index));
  };

  const handleAddMember = () => {
    if (!newMemberName.trim() || !newMemberEmail.trim()) {
      showToast('Nom et email requis pour ajouter un membre.');
      return;
    }
    setInitialMembers([
      ...initialMembers,
      {
        name: newMemberName.trim(),
        email: newMemberEmail.trim(),
        role: newMemberRole,
        position: newMemberPosition.trim() || 'Collaborateur',
        departmentName: newMemberDept || (departments[0]?.name || ''),
        teamName: newMemberTeam || (teams[0]?.name || ''),
      },
    ]);
    setNewMemberName('');
    setNewMemberEmail('');
    setNewMemberPosition('Collaborateur');
  };

  const handleRemoveMember = (index: number) => {
    setInitialMembers(initialMembers.filter((_, i) => i !== index));
  };

  const handleCreate = async () => {
    if (!orgName.trim() || !adminName.trim() || !adminEmail.trim()) {
      showToast('Le nom de l\'organisation et les informations de l\'administrateur sont obligatoires.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = createOrganization({
        name: orgName.trim(),
        plan,
        seatsTotal,
        domain: domain.trim() || undefined,
        logoUrl: logoUrl.trim() || undefined,
        primaryColor,
        adminName: adminName.trim(),
        adminEmail: adminEmail.trim(),
        adminJobTitle: adminJobTitle.trim() || undefined,
        adminPosition: adminPosition.trim() || undefined,
        tempPassword,
        enabledModules: selectedModules,
        initialDepartments: departments,
        initialTeams: teams,
        initialMembers: initialMembers,
      });

      if (res.success && res.orgId) {
        if (onSuccess) onSuccess(res.orgId);
        onClose();
      } else {
        showToast(res.error || 'Erreur lors de la création de l\'organisation.');
      }
    } catch (err) {
      showToast('Erreur inattendue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-3xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-8 border border-slate-100 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Création Guidée d'une Organisation KardX
              </h2>
              <p className="text-xs text-slate-500">
                Configurez l'entreprise, ses départements, équipes, responsables et modules autorisés.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="grid grid-cols-5 gap-2 text-center text-xs">
          {[
            { num: 1, label: 'Général & Offre' },
            { num: 2, label: 'Modules & Accès' },
            { num: 3, label: 'Départements' },
            { num: 4, label: 'Responsable' },
            { num: 5, label: 'Validation' },
          ].map((s) => (
            <button
              key={s.num}
              type="button"
              onClick={() => setStep(s.num as any)}
              className={`p-2 rounded-xl border text-left transition flex flex-col gap-0.5 cursor-pointer ${
                step === s.num
                  ? 'border-purple-600 bg-purple-50/50 text-purple-900 shadow-xs'
                  : step > s.num
                  ? 'border-slate-200 bg-slate-50 text-slate-700'
                  : 'border-slate-100 bg-slate-50/40 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider">Étape {s.num}</span>
                {step > s.num && <Check className="w-3 h-3 text-emerald-600" />}
              </div>
              <span className="font-semibold text-[11px] truncate">{s.label}</span>
            </button>
          ))}
        </div>

        {/* ========================================================================= */}
        {/* STEP 1: GENERAL & PLAN */}
        {/* ========================================================================= */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800">
                Nom de l'Organisation / Entreprise <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="ex: Cabinet Dujardin & Associés"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800">Domaine officiel / Intranet</label>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="dujardin-associes.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800">Couleur Primaire de Marque</label>
                <div className="flex items-center gap-2">
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
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Logo de l'organisation */}
            <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div 
                  onClick={() => setIsLogoModalOpen(true)}
                  className="w-14 h-14 rounded-2xl bg-white p-2 border border-purple-200 shadow-sm flex items-center justify-center cursor-pointer group shrink-0 relative overflow-hidden"
                >
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <Building2 className="w-6 h-6 text-purple-400" />
                  )}
                  <div className="absolute inset-0 bg-purple-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px] font-bold">
                    <Upload className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-800">Logo Officiel de l'Organisation</h4>
                  <p className="text-[11px] text-slate-500">
                    {logoUrl ? 'Logo personnalisé configuré' : 'PNG transparent, SVG ou suggestions corporate'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsLogoModalOpen(true)}
                className="py-2 px-3.5 rounded-xl bg-white hover:bg-purple-50 border border-purple-200 text-xs font-bold text-purple-700 shadow-2xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Camera className="w-3.5 h-3.5 text-purple-600" />
                <span>{logoUrl ? 'Modifier...' : 'Choisir / Uploader...'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800">Formule d'Abonnement</label>
                <select
                  value={plan}
                  onChange={(e) => {
                    const newPlan = e.target.value as PlanType;
                    setPlan(newPlan);
                    if (newPlan === 'enterprise') setSeatsTotal(100);
                    else if (newPlan === 'business') setSeatsTotal(25);
                    else setSeatsTotal(10);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-purple-500 cursor-pointer font-semibold"
                >
                  <option value="pro">Pro (10 sièges)</option>
                  <option value="business">Business (25 sièges)</option>
                  <option value="enterprise">Enterprise (100+ sièges illimités)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800">Nombre de Licences / Sièges</label>
                <input
                  type="number"
                  min="1"
                  value={seatsTotal}
                  onChange={(e) => setSeatsTotal(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: MODULES ACTIVÉS */}
        {/* ========================================================================= */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-xs text-slate-800">
                  Modules KardX Autorisés pour cette Organisation
                </h3>
                <p className="text-[11px] text-slate-500">
                  Activez ou restreignez les fonctionnalités selon le contrat client.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSelectAllModules}
                className="text-xs font-bold text-purple-600 hover:text-purple-700 cursor-pointer"
              >
                Tout Activer ({PLATFORM_MODULES.length})
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto p-1">
              {PLATFORM_MODULES.map((mod) => {
                const isSelected = selectedModules.includes(mod.id);
                return (
                  <div
                    key={mod.id}
                    onClick={() => handleToggleModule(mod.id)}
                    className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-purple-300 bg-purple-50/40 text-purple-950 shadow-2xs'
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
                        isSelected ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-400'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: DEPARTMENTS & TEAMS */}
        {/* ========================================================================= */}
        {step === 3 && (
          <div className="space-y-5">
            {/* Departments */}
            <div className="space-y-3">
              <h3 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <FolderTree className="w-4 h-4 text-purple-600" />
                <span>1. Départements Initiaux</span>
              </h3>

              <div className="flex flex-wrap gap-2">
                {departments.map((d, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-xs font-semibold text-purple-900"
                  >
                    <span>{d.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveDepartment(i)}
                      className="text-purple-400 hover:text-purple-700 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  placeholder="Nom d'un nouveau département (ex: Direction Commerciale)"
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="button"
                  onClick={handleAddDepartment}
                  className="px-3.5 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-500 cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter</span>
                </button>
              </div>
            </div>

            {/* Teams */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <h3 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-purple-600" />
                <span>2. Équipes Opérationnelles</span>
              </h3>

              <div className="flex flex-wrap gap-2">
                {teams.map((t, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800"
                  >
                    <span>{t.name}</span>
                    {t.departmentName && (
                      <span className="text-[10px] text-slate-500">({t.departmentName})</span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveTeam(i)}
                      className="text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="Nom de l'équipe (ex: Vente Grands Comptes)"
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500"
                />
                <div className="flex items-center gap-2">
                  <select
                    value={newTeamDept}
                    onChange={(e) => setNewTeamDept(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white cursor-pointer"
                  >
                    {departments.map((d) => (
                      <option key={d.name} value={d.name}>
                        Dép. : {d.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddTeam}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: PRIMARY ADMIN & OPTIONAL MEMBERS */}
        {/* ========================================================================= */}
        {step === 4 && (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-200 space-y-3">
              <h3 className="font-bold text-xs text-purple-900 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-purple-600" />
                <span>Responsable Principal de l'Organisation</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Nom & Prénom du Responsable <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="ex: Marc Lawson"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Email Professionnel <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="m.lawson@entreprise.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Intitulé du Poste</label>
                  <input
                    type="text"
                    value={adminJobTitle}
                    onChange={(e) => setAdminJobTitle(e.target.value)}
                    placeholder="Directeur Général"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>Mot de passe temporaire initial</span>
                    <span className="text-[10px] text-amber-700 bg-amber-100 font-bold px-2 py-0.5 rounded-md">
                      Renouvellement forcé à la 1ère connexion
                    </span>
                  </label>
                  <input
                    type="text"
                    value={tempPassword}
                    onChange={(e) => setTempPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-amber-200 bg-amber-50/50 text-xs font-mono text-amber-900"
                  />
                  <p className="text-[10px] text-slate-500">
                    🔒 Ce mot de passe provisoire sera obligatoirement renouvelé par le responsable lors de sa toute première connexion via l'écran sécurisé de validation.
                  </p>
                </div>
              </div>
            </div>

            {/* Pre-Add Initial Members (Optional) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-purple-600" />
                  <span>Ajouter d'autres collaborateurs dès maintenant ({initialMembers.length})</span>
                </h4>
              </div>

              {initialMembers.length > 0 && (
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {initialMembers.map((m, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-900">{m.name}</span>
                        <span className="text-slate-500 ml-2">({m.email})</span>
                        <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-100 text-purple-800">
                          {m.role}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(i)}
                        className="text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="Nom & Prénom"
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
                <input
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="Email"
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
                <div className="flex items-center gap-1">
                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value as UserRole)}
                    className="flex-1 px-2 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 cursor-pointer"
                  >
                    <option value="manager">Manager</option>
                    <option value="collaborateur">Collaborateur</option>
                    <option value="viewer">Observateur</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAddMember}
                    className="px-3 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 5: REVIEW & SECURITY CONFIRMATION */}
        {/* ========================================================================= */}
        {step === 5 && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2 text-emerald-950 text-xs">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-900">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Récapitulatif de la Création</span>
              </div>
              <p>
                Vous vous apprêtez à initialiser l'organisation <strong>"{orgName}"</strong> avec :
              </p>
              <ul className="list-disc pl-5 space-y-1 text-[11px] text-emerald-800">
                <li>Formule : <strong>{plan.toUpperCase()}</strong> ({seatsTotal} licences)</li>
                <li>Modules activés : <strong>{selectedModules.length}</strong> modules KardX</li>
                <li>Départements créés : <strong>{departments.length}</strong> ({departments.map((d) => d.name).join(', ')})</li>
                <li>Équipes créées : <strong>{teams.length}</strong> ({teams.map((t) => t.name).join(', ')})</li>
                <li>Responsable d'Organisation : <strong>{adminName}</strong> ({adminEmail})</li>
                <li>Membres additionnels : <strong>{initialMembers.length}</strong> utilisateurs</li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <Lock className="w-4 h-4 text-amber-600" />
                <span>Sécurité & Changement de mot de passe obligatoire</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                À sa première connexion, le responsable <strong>{adminName}</strong> recevra l'obligation de changer son mot de passe temporaire par un mot de passe fort et privé.
                L'équipe SuperAdmin KardX n'a pas accès à ses données privées métier.
              </p>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div>
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((step - 1) as any)}
                className="py-2 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Précédent</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="py-2 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 transition cursor-pointer"
              >
                Annuler
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {step < 5 ? (
              <button
                type="button"
                onClick={() => {
                  if (step === 1 && !orgName.trim()) {
                    showToast('Veuillez renseigner le nom de l\'organisation.');
                    return;
                  }
                  if (step === 4 && (!adminName.trim() || !adminEmail.trim())) {
                    showToast('Veuillez renseigner le nom et l\'email du responsable.');
                    return;
                  }
                  setStep((step + 1) as any);
                }}
                className="py-2.5 px-5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                <span>Suivant</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleCreate}
                className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white text-xs font-bold shadow-lg transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isSubmitting ? 'Création en cours...' : 'Créer & Initialiser l\'Organisation'}</span>
              </button>
            )}
          </div>
        </div>

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
            showToast('Logo enregistré pour la nouvelle organisation');
          }}
        />
      )}

    </div>
  );
};
