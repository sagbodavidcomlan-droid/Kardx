import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole, Department, Team } from '../../types';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Building2, 
  Mail, 
  Phone, 
  MoreVertical, 
  Trash2, 
  CheckCircle, 
  Edit3,
  Layers,
  Sparkles,
  Search,
  KeyRound,
  Shield,
  Info,
  Smartphone,
  Lock,
  Building,
  Plus,
  Network,
  Briefcase,
  ChevronRight,
  UserCheck,
  Crown,
  Filter,
  Camera,
  Upload,
  Trophy
} from 'lucide-react';
import { getRoleBadge, ROLE_DEFINITIONS } from '../../utils/permissions';
import { ImageUploadModal } from '../common/ImageUploadModal';
import { TeamLeaderboard } from './TeamLeaderboard';

export const TeamManager: React.FC = () => {
  const { 
    currentUser,
    users, 
    currentOrg, 
    visibleTeams: teams, 
    visibleDepartments: departments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    createTeam,
    updateTeam,
    deleteTeam,
    addUser, 
    updateUserRole, 
    updateUserStatus, 
    updateUserPosition,
    updateUserTwoFactor,
    setActiveTab,
    showToast 
  } = useApp();

  const [activeSubView, setActiveSubView] = useState<'hierarchy' | 'leaderboard' | 'departments' | 'members'>('hierarchy');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);

  // Invite user state
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteAvatarUrl, setInviteAvatarUrl] = useState('');
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [invitePassword, setInvitePassword] = useState('Kardx2026!');
  const [invitePosition, setInvitePosition] = useState('');
  const [inviteDepartmentId, setInviteDepartmentId] = useState('');
  const [inviteTeamId, setInviteTeamId] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('collaborateur');
  const [inviteMustChangePassword, setInviteMustChangePassword] = useState(true);
  const [inviteRequire2Fa, setInviteRequire2Fa] = useState(false);

  // Department modal state
  const [deptName, setDeptName] = useState('');
  const [deptDesc, setDeptDesc] = useState('');
  const [deptHeadUserId, setDeptHeadUserId] = useState('');

  // Team modal state
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');
  const [teamDeptId, setTeamDeptId] = useState('');
  const [teamManagerId, setTeamManagerId] = useState('');

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;

    addUser({
      name: inviteName.trim(),
      email: inviteEmail.trim().toLowerCase(),
      role: inviteRole,
      password: invitePassword.trim() || 'Kardx2026!',
      position: invitePosition.trim() || 'Collaborateur',
      jobTitle: invitePosition.trim() || 'Collaborateur',
      departmentId: inviteDepartmentId || undefined,
      teamId: inviteTeamId || undefined,
      status: 'active',
      mustChangePassword: inviteMustChangePassword,
      twoFactorEnabled: inviteRequire2Fa,
      twoFactorMethod: 'email',
      avatarUrl: inviteAvatarUrl || `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random()*1000)}?auto=format&fit=crop&w=400&h=400&q=80`,
    });

    setIsInviteModalOpen(false);
    setInviteName('');
    setInviteEmail('');
    setInviteAvatarUrl('');
    setInvitePassword('Kardx2026!');
    setInvitePosition('');
    setInviteDepartmentId('');
    setInviteTeamId('');
    showToast(`Collaborateur ${inviteName} ajouté.`);
  };

  const handleCreateDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName.trim()) return;

    createDepartment({
      name: deptName.trim(),
      description: deptDesc.trim(),
      headUserId: deptHeadUserId || undefined,
    });

    setIsDeptModalOpen(false);
    setDeptName('');
    setDeptDesc('');
    setDeptHeadUserId('');
  };

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;

    createTeam({
      name: teamName.trim(),
      description: teamDesc.trim(),
      departmentId: teamDeptId || undefined,
      managerId: teamManagerId || currentUser.id,
    });

    setIsTeamModalOpen(false);
    setTeamName('');
    setTeamDesc('');
    setTeamDeptId('');
    setTeamManagerId('');
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.position && u.position.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesDept = 
      selectedDeptFilter === 'all' || 
      u.departmentId === selectedDeptFilter;

    return matchesSearch && matchesDept;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-slate-800 flex flex-col gap-8">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
              Hiérarchie & Collaborateurs — {currentOrg.name}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {currentOrg.seatsUsed} / {currentOrg.seatsTotal} Licences
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Structure organisationnelle en Départements, Équipes et Postes avec isolation stricte des accès et gestion des mots de passe.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setActiveTab('bulk')}
            className="py-2.5 px-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 shadow-xs flex items-center gap-2 transition cursor-pointer"
          >
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>Édition en masse</span>
          </button>

          <button
            onClick={() => setIsDeptModalOpen(true)}
            className="py-2.5 px-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 shadow-xs flex items-center gap-2 transition cursor-pointer"
          >
            <Building className="w-4 h-4 text-indigo-600" />
            <span>Nouveau Département</span>
          </button>

          <button
            onClick={() => setIsTeamModalOpen(true)}
            className="py-2.5 px-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 shadow-xs flex items-center gap-2 transition cursor-pointer"
          >
            <Users className="w-4 h-4 text-indigo-600" />
            <span>Nouvelle Équipe</span>
          </button>

          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-indigo-900/20 transition active:scale-95 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Ajouter un membre</span>
          </button>
        </div>
      </div>

      {/* VIEW TABS */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveSubView('hierarchy')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubView === 'hierarchy'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Network className="w-4 h-4" />
            <span>Organigramme & Hiérarchie</span>
          </button>

          <button
            onClick={() => setActiveSubView('leaderboard')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubView === 'leaderboard'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Classement & Performance (Leaderboard)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-extrabold uppercase">
              Top Leads
            </span>
          </button>

          <button
            onClick={() => setActiveSubView('departments')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubView === 'departments'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Départements ({departments.length})</span>
          </button>

          <button
            onClick={() => setActiveSubView('members')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubView === 'members'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Annuaire des Membres & Postes ({users.length})</span>
          </button>
        </div>

        {/* Search */}
        {activeSubView !== 'leaderboard' && (
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher nom, poste, email..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-xs"
            />
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SUBVIEW 0: TEAM LEADERBOARD (RANKINGS BY LEADS & CARDS SHARED) */}
      {/* ========================================================================= */}
      {activeSubView === 'leaderboard' && (
        <TeamLeaderboard />
      )}

      {/* ========================================================================= */}
      {/* SUBVIEW 1: ORGANIGRAMME & HIERARCHY TREE */}
      {/* ========================================================================= */}
      {activeSubView === 'hierarchy' && (
        <div className="space-y-8">
          
          {/* Top Org Card */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-2xl shadow-inner text-white">
                {currentOrg.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-xl font-bold text-white">{currentOrg.name}</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Organisation Active
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Responsable d'Organisation : <strong className="text-slate-200">{currentOrg.adminName || 'David Sagbo'}</strong> ({currentOrg.adminEmail})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs text-slate-300">
              <div className="text-center">
                <span className="block text-xl font-black text-white">{departments.length}</span>
                <span className="text-[11px] text-slate-400">Départements</span>
              </div>
              <div className="text-center">
                <span className="block text-xl font-black text-white">{teams.length}</span>
                <span className="text-[11px] text-slate-400">Équipes</span>
              </div>
              <div className="text-center">
                <span className="block text-xl font-black text-white">{users.length}</span>
                <span className="text-[11px] text-slate-400">Collaborateurs</span>
              </div>
            </div>
          </div>

          {/* Departments Cascade */}
          <div className="space-y-6">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-600" />
              <span>Arborescence des Départements & Équipes</span>
            </h4>

            <div className="grid grid-cols-1 gap-6">
              {departments.map((dept) => {
                const deptTeams = teams.filter((t) => t.departmentId === dept.id);
                const deptHead = users.find((u) => u.id === dept.headUserId);
                const deptMembers = users.filter((u) => u.departmentId === dept.id);

                return (
                  <div key={dept.id} className="rounded-3xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
                    {/* Department Header */}
                    <div className="p-5 bg-slate-50/80 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                          <Building className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-bold text-slate-800">{dept.name}</h4>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700">
                              {deptMembers.length} membre(s)
                            </span>
                          </div>
                          {dept.description && (
                            <p className="text-xs text-slate-500 mt-0.5">{dept.description}</p>
                          )}
                        </div>
                      </div>

                      {/* Head of Department Badge */}
                      <div className="flex items-center gap-2 text-xs bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                        <Crown className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-slate-500">Directeur / Resp. Département :</span>
                        <strong className="text-slate-700">{deptHead ? deptHead.name : 'Non assigné'}</strong>
                      </div>
                    </div>

                    {/* Department Sub-Teams */}
                    <div className="p-5 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {deptTeams.map((team) => {
                          const teamManager = users.find((u) => u.id === team.managerId);
                          const teamMembers = users.filter((u) => u.teamId === team.id);

                          return (
                            <div key={team.id} className="p-4 rounded-2xl bg-slate-50/50 border border-slate-200/60 flex flex-col justify-between gap-3">
                              <div>
                                <div className="flex items-center justify-between gap-2 mb-2">
                                  <span className="text-sm font-bold text-slate-800">{team.name}</span>
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700">
                                    {teamMembers.length} membres
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 mb-3">{team.description || 'Équipe opérationnelle'}</p>
                                
                                <div className="flex items-center gap-2 text-[11px] text-slate-600 bg-white p-2 rounded-xl border border-slate-200/60 mb-2">
                                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                  <span className="truncate">Manager : <strong>{teamManager ? teamManager.name : 'Non assigné'}</strong></span>
                                </div>

                                {/* Members Mini Avatars */}
                                <div className="space-y-1.5 pt-2 border-t border-slate-200/40">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                    Membres & Postes
                                  </span>
                                  <div className="space-y-1">
                                    {teamMembers.slice(0, 3).map((m) => (
                                      <div key={m.id} className="flex items-center justify-between text-xs py-0.5">
                                        <div className="flex items-center gap-2 min-w-0">
                                          <img
                                            src={m.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=60&h=60&q=80'}
                                            alt={m.name}
                                            className="w-5 h-5 rounded-full object-cover shrink-0"
                                          />
                                          <span className="font-medium text-slate-700 truncate">{m.name}</span>
                                        </div>
                                        <span className="text-[10px] text-slate-500 font-mono truncate max-w-[110px] text-right">
                                          {m.position || m.jobTitle || 'Poste'}
                                        </span>
                                      </div>
                                    ))}
                                    {teamMembers.length > 3 && (
                                      <span className="text-[10px] text-indigo-600 font-medium block">
                                        + {teamMembers.length - 3} autre(s) membre(s)
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {deptTeams.length === 0 && (
                          <div className="col-span-full py-6 text-center text-xs text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                            Aucune équipe créée dans ce département. 
                            <button
                              onClick={() => {
                                setTeamDeptId(dept.id);
                                setIsTeamModalOpen(true);
                              }}
                              className="ml-2 text-indigo-600 font-bold hover:underline cursor-pointer"
                            >
                              Créer une première équipe
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBVIEW 2: DEPARTMENTS MANAGEMENT */}
      {/* ========================================================================= */}
      {activeSubView === 'departments' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {departments.map((dept) => {
              const deptTeams = teams.filter((t) => t.departmentId === dept.id);
              const deptHead = users.find((u) => u.id === dept.headUserId);
              const deptMembers = users.filter((u) => u.departmentId === dept.id);

              return (
                <div key={dept.id} className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                        <Building className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {deptTeams.length} équipe(s)
                      </span>
                    </div>

                    <h4 className="font-bold text-base text-slate-800">{dept.name}</h4>
                    <p className="text-xs text-slate-500 mt-1">{dept.description || 'Aucune description'}</p>

                    <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Responsable :</span>
                        <strong className="text-slate-700">{deptHead ? deptHead.name : 'Non assigné'}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Membres rattachés :</span>
                        <strong className="text-slate-700">{deptMembers.length} personnes</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => deleteDepartment(dept.id)}
                      className="text-xs text-rose-600 hover:text-rose-700 p-2 rounded-xl hover:bg-rose-50 transition cursor-pointer"
                      title="Supprimer ce département"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBVIEW 3: MEMBERS & POSITIONS DIRECTORY */}
      {/* ========================================================================= */}
      {activeSubView === 'members' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-700">Filtrer par Département :</span>
                <select
                  value={selectedDeptFilter}
                  onChange={(e) => setSelectedDeptFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">Tous les Départements ({departments.length})</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <span className="text-xs text-slate-500">
                Affichage de <strong>{filteredUsers.length}</strong> collaborateur(s)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Collaborateur</th>
                    <th className="py-3 px-4">Poste / Fonction</th>
                    <th className="py-3 px-4">Département & Équipe</th>
                    <th className="py-3 px-4">Rôle & Permissions</th>
                    <th className="py-3 px-4">Statut & Sécurité</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredUsers.map((u) => {
                    const badge = getRoleBadge(u.role);
                    const userDept = departments.find((d) => d.id === u.departmentId);
                    const userTeam = teams.find((t) => t.id === u.teamId);

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&h=80&q=80'}
                              alt={u.name}
                              className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-200"
                            />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-800">{u.name}</span>
                                {u.id === currentUser.id && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-bold">
                                    Vous
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-400 block">{u.email}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-medium text-slate-700">
                          <div className="flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                            <span>{u.position || u.jobTitle || 'Non spécifié'}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            {userDept ? (
                              <span className="text-xs font-semibold text-slate-800 block">
                                {userDept.name}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Aucun département</span>
                            )}
                            {userTeam && (
                              <span className="text-[11px] text-indigo-600 block">
                                • {userTeam.name}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${badge.color}`}>
                            {badge.label}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {u.mustChangePassword ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold flex items-center gap-1">
                                <KeyRound className="w-3 h-3 text-amber-600" />
                                Mdp Temporaire
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold">
                                Mot de passe défini
                              </span>
                            )}

                            {u.twoFactorEnabled && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3 text-indigo-600" />
                                2FA
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <select
                            value={u.role}
                            onChange={(e) => updateUserRole(u.id, e.target.value as any)}
                            disabled={u.id === currentUser.id}
                            className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-700 cursor-pointer disabled:opacity-50"
                          >
                            <option value="collaborateur">Collaborateur</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
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
      {/* MODAL: CREATE DEPARTMENT */}
      {/* ========================================================================= */}
      {isDeptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                <Building className="w-5 h-5 text-indigo-600" />
                <span>Nouveau Département</span>
              </h3>
              <button onClick={() => setIsDeptModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDepartment} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Nom du Département</label>
                <input
                  type="text"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  placeholder="ex: Direction Commerciale & Grands Comptes"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Description / Missions</label>
                <textarea
                  value={deptDesc}
                  onChange={(e) => setDeptDesc(e.target.value)}
                  placeholder="Missions principales de ce département..."
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Directeur / Responsable du Département</label>
                <select
                  value={deptHeadUserId}
                  onChange={(e) => setDeptHeadUserId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">-- Aucun responsable désigné --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
              >
                Créer le Département
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE TEAM */}
      {/* ========================================================================= */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <span>Nouvelle Équipe</span>
              </h3>
              <button onClick={() => setIsTeamModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Nom de l'équipe</label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="ex: Équipe B2B Enterprise"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Département de rattachement</label>
                <select
                  value={teamDeptId}
                  onChange={(e) => setTeamDeptId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">-- Sans département direct --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Chef d'Équipe / Manager</label>
                <select
                  value={teamManagerId}
                  onChange={(e) => setTeamManagerId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">-- Désigner un manager --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
              >
                Créer l'Équipe
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: INVITE MEMBER WITH MANDATORY PASSWORD CHANGE */}
      {/* ========================================================================= */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                <span>Ajouter un Collaborateur</span>
              </h3>
              <button onClick={() => setIsInviteModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              
              {/* Photo de profil / Avatar selector */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div 
                    onClick={() => setIsAvatarModalOpen(true)}
                    className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-indigo-500 shadow-xs cursor-pointer group shrink-0"
                  >
                    <img
                      src={inviteAvatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&h=400&q=80'}
                      alt="Avatar"
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                    <div className="absolute inset-0 bg-indigo-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                      <Camera className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Photo de profil du collaborateur</h4>
                    <p className="text-[11px] text-slate-500">
                      {inviteAvatarUrl ? 'Photo personnalisée sélectionnée' : 'Portraits pro suggérés ou upload personnalisé'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAvatarModalOpen(true)}
                  className="py-1.5 px-3 rounded-xl bg-white hover:bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-700 shadow-2xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Camera className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{inviteAvatarUrl ? 'Modifier' : 'Choisir'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Nom complet</label>
                  <input
                    type="text"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="ex: Sarah Benali"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-indigo-500"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Intitulé du Poste</label>
                  <input
                    type="text"
                    value={invitePosition}
                    onChange={(e) => setInvitePosition(e.target.value)}
                    placeholder="ex: Senior Key Account"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Email professionnel</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="sarah.benali@bestexperts-group.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Département</label>
                  <select
                    value={inviteDepartmentId}
                    onChange={(e) => setInviteDepartmentId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-indigo-500"
                  >
                    <option value="">-- Sélectionner un département --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Équipe</label>
                  <select
                    value={inviteTeamId}
                    onChange={(e) => setInviteTeamId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-indigo-500"
                  >
                    <option value="">-- Sélectionner une équipe --</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Rôle & Permissions</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-indigo-500"
                >
                  <option value="collaborateur">Collaborateur (Espace privé : son profil, ses cartes & leads)</option>
                  <option value="manager">Manager (Accès aux membres de son équipe/département et leads assignés)</option>
                  <option value="admin">Administrateur (Gestion complète de l'organisation)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Mot de passe temporaire initial</label>
                <input
                  type="text"
                  value={invitePassword}
                  onChange={(e) => setInvitePassword(e.target.value)}
                  placeholder="Kardx2026!"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono"
                />
              </div>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50/80 border border-amber-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inviteMustChangePassword}
                  onChange={(e) => setInviteMustChangePassword(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 accent-amber-600"
                />
                <div className="text-xs">
                  <span className="font-bold text-amber-900 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                    Changement obligatoire du mot de passe à la première connexion
                  </span>
                  <p className="text-[11px] text-amber-800">
                    Pour des raisons de sécurité, le collaborateur devra définir son mot de passe secret lors de son premier accès.
                  </p>
                </div>
              </label>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
              >
                Créer le compte collaborateur
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal avatar for invite */}
      {isAvatarModalOpen && (
        <ImageUploadModal
          isOpen={isAvatarModalOpen}
          onClose={() => setIsAvatarModalOpen(false)}
          type="avatar"
          currentValue={inviteAvatarUrl}
          onSave={(url) => {
            setInviteAvatarUrl(url);
            showToast('Photo de profil sélectionnée');
          }}
        />
      )}

    </div>
  );
};
