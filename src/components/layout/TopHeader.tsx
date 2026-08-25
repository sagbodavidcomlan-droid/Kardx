import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { NotificationCenter } from './NotificationCenter';
import { NetworkStatusIndicator } from './NetworkStatusIndicator';
import { 
  WifiOff,
  ChevronDown, 
  Menu,
  Sparkles,
  ShieldCheck,
  Building2,
  SlidersHorizontal,
  KeyRound,
  LogOut,
  UserCheck
} from 'lucide-react';
import { getRoleBadge } from '../../utils/permissions';

interface TopHeaderProps {
  onToggleMobileSidebar: () => void;
}

const TAB_TITLES: Record<string, { title: string; category: string }> = {
  dashboard: { title: 'Tableau de bord', category: 'Vue d\'ensemble' },
  profile: { title: 'Mon profil digital', category: 'Identité' },
  design: { title: 'Design & Thème', category: 'Personnalisation' },
  cards: { title: 'Cartes NFC & QR', category: 'Supports physiques' },
  leads: { title: 'Prospects (CRM)', category: 'Acquisition' },
  forms: { title: 'Formulaires d\'échange', category: 'Acquisition' },
  analytics: { title: 'Statistiques & ROI', category: 'Performances' },
  team: { title: 'Gestion d\'équipe', category: 'Organisation' },
  bulk: { title: 'Édition en masse', category: 'Gestion collective' },
  signature: { title: 'Signature email', category: 'Partage' },
  wallet: { title: 'Apple & Google Wallet', category: 'Portefeuille virtuel' },
  scanner: { title: 'Scanner de cartes IA (OCR)', category: 'Capture automatique' },
  integrations: { title: 'Intégrations & Webhooks', category: 'Connectivité' },
  settings: { title: 'Paramètres', category: 'Configuration' },
  admin: { title: 'Super Admin Platform', category: 'Administration' },
  landing: { title: 'Page d\'accueil KardX', category: 'Vitrine' },
};

export const TopHeader: React.FC<TopHeaderProps> = ({ onToggleMobileSidebar }) => {
  const { 
    currentUser, 
    currentOrg, 
    users, 
    switchUser, 
    activeProfile, 
    activeTab,
    setActiveTab,
    setIsAuthModalOpen,
    logout
  } = useApp();

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const currentTabMeta = TAB_TITLES[activeTab] || { title: 'KardX', category: 'Plateforme' };
  const roleBadge = getRoleBadge(currentUser.role);

  return (
    <header className="sticky top-0 z-30 w-full bg-[#0F172A] border-b border-slate-800 text-white shadow-md shadow-slate-950/20">
      {/* Offline Alert Strip */}
      {!isOnline && (
        <div className="w-full bg-rose-600 text-white px-4 py-1.5 text-xs font-semibold flex items-center justify-center gap-2 animate-in slide-in-from-top duration-200">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Connexion internet perdue. Les scans de cartes physiques et les interactions NFC/QR sont sauvegardés localement.</span>
        </div>
      )}

      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* ZONE 1: BRAND TITLE & MOBILE HAMBURGER */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Mobile Sidebar Hamburger Trigger */}
          <button
            onClick={onToggleMobileSidebar}
            className="flex lg:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            aria-label="Ouvrir le menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Wordmark */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2.5 font-black text-xl tracking-tight text-white hover:opacity-90 transition cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-base text-white shadow-md shadow-indigo-900/30">
              K
            </div>
            <span className="font-bold tracking-tight">KardX</span>
          </button>

          {/* Current Workspace Pill */}
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-800/90 text-slate-300 border border-slate-700/60">
            <Building2 className="w-3 h-3 text-indigo-400" />
            <span className="truncate max-w-[140px]">{currentOrg.name}</span>
          </span>
        </div>

        {/* ZONE 2: ACTIVE MODULE BREADCRUMB & QUICK CONTEXT */}
        <div className="hidden md:flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
            <span className="text-slate-400 font-medium">{currentTabMeta.category}</span>
            <span className="text-slate-600">/</span>
            <span className="text-white font-bold tracking-tight">{currentTabMeta.title}</span>
          </div>
        </div>

        {/* ZONE 3: STATUS INDICATORS & USER AVATAR */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Network Status Indicator */}
          <NetworkStatusIndicator />

          {/* Notifications Center */}
          <NotificationCenter />

          {/* User & Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800/80 border border-transparent hover:border-slate-700/60 transition cursor-pointer"
              title="Changer d'utilisateur ou de rôle"
            >
              <img
                src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80'}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-400"
              />
              <div className="hidden xl:flex flex-col text-left">
                <span className="text-xs font-bold text-white max-w-[100px] truncate leading-tight">
                  {currentUser.name}
                </span>
                <span className={`text-[9px] px-1 py-0.1 rounded font-bold uppercase ${roleBadge.color} w-fit`}>
                  {roleBadge.label}
                </span>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {userDropdownOpen && (
              <div 
                className="absolute right-0 mt-2 w-80 rounded-2xl bg-[#0F172A] border border-slate-800 shadow-2xl p-3 z-50 animate-in fade-in zoom-in duration-150"
                onMouseLeave={() => setUserDropdownOpen(false)}
              >
                <div className="px-3 py-2 border-b border-slate-800 mb-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-white">{currentUser.name}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${roleBadge.color}`}>
                      {roleBadge.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{currentUser.email}</p>
                  {currentUser.jobTitle && (
                    <p className="text-[10px] text-indigo-300 truncate mt-0.5">{currentUser.jobTitle}</p>
                  )}
                </div>

                {/* Switch Workspace / Login button */}
                <button
                  onClick={() => {
                    setIsAuthModalOpen(true);
                    setUserDropdownOpen(false);
                  }}
                  className="w-full mb-2 p-2.5 rounded-xl bg-indigo-600/15 hover:bg-indigo-600/25 border border-indigo-500/30 text-indigo-300 text-xs font-bold flex items-center justify-between transition cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-indigo-400" />
                    <span>Identifiants & Connexion</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-200">Gérer</span>
                </button>

                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 my-1.5">
                  Changement rapide d'espace :
                </p>

                <div className="flex flex-col gap-1 max-h-44 overflow-y-auto">
                  {users.map((u) => {
                    const uBadge = getRoleBadge(u.role);
                    return (
                      <button
                        key={u.id}
                        onClick={() => {
                          switchUser(u.id);
                          setUserDropdownOpen(false);
                        }}
                        className={`flex items-center justify-between gap-2.5 p-2 rounded-xl text-left text-xs transition cursor-pointer ${
                          u.id === currentUser.id
                            ? 'bg-indigo-600 text-white font-bold'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80'}
                            alt={u.name}
                            className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-600 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold truncate leading-tight">{u.name}</p>
                            <p className="text-[10px] opacity-80 truncate">{u.jobTitle || u.email}</p>
                          </div>
                        </div>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold shrink-0 ${u.id === currentUser.id ? 'bg-white/20 text-white' : uBadge.color}`}>
                          {uBadge.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-2 pt-2 border-t border-slate-800 space-y-1">
                  <button
                    onClick={() => {
                      setActiveTab('landing');
                      setUserDropdownOpen(false);
                    }}
                    className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 text-left transition cursor-pointer"
                  >
                    Voir la Landing Page KardX
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      setUserDropdownOpen(false);
                    }}
                    className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 text-left transition cursor-pointer flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Se déconnecter</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
