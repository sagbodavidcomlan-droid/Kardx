import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  LayoutDashboard, 
  User as UserIcon, 
  Palette, 
  CreditCard, 
  Users, 
  Camera, 
  FileText, 
  BarChart3, 
  Wallet, 
  Mail, 
  Zap, 
  UserCheck, 
  Layers, 
  Settings, 
  ShieldCheck, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  X, 
  Wifi, 
  Sparkles,
  ExternalLink,
  ChevronDown,
  Globe,
  KeyRound,
  Shield,
  LogOut,
  Folder,
  FolderOpen
} from 'lucide-react';
import { canUserAccessTab, getRoleBadge } from '../../utils/permissions';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
  badgeColor?: string;
  description?: string;
}

interface NavCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  mobileOpen,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse,
}) => {
  const { 
    activeTab, 
    setActiveTab, 
    currentUser, 
    currentOrg, 
    visibleProfiles, 
    activeProfile, 
    setActiveProfile,
    visibleLeads,
    visibleCards,
    roleModuleMapping,
    setIsNfcSimModalOpen,
    setPublicProfileSlug,
    setIsAuthModalOpen,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Grouped Navigation Categories
  const allNavCategories: NavCategory[] = useMemo(() => [
    {
      id: 'core',
      title: 'Espace & Identité',
      icon: <UserIcon className="w-4 h-4 text-indigo-400" />,
      items: [
        {
          id: 'dashboard',
          label: currentUser.role === 'collaborateur' ? 'Mon Espace' : 'Tableau de bord',
          icon: <LayoutDashboard className="w-4 h-4 shrink-0" />,
          description: 'Synthèse, alertes et KPI en temps réel',
        },
        {
          id: 'profile',
          label: 'Mon Profil Digital',
          icon: <UserIcon className="w-4 h-4 shrink-0" />,
          description: 'Coordonnées, bio & liens personnalisés',
        },
        {
          id: 'design',
          label: 'Design & Thème',
          icon: <Palette className="w-4 h-4 shrink-0" />,
          description: 'Couleurs, polices & bannières de marque',
        },
        {
          id: 'cards',
          label: currentUser.role === 'collaborateur' ? 'Mes Cartes NFC' : 'Cartes NFC & QR',
          icon: <CreditCard className="w-4 h-4 shrink-0" />,
          badge: visibleCards.length > 0 ? visibleCards.length : undefined,
          badgeColor: 'bg-indigo-500/20 text-indigo-300 font-bold',
          description: 'Activation et suivi des cartes physiques',
        },
      ],
    },
    {
      id: 'crm',
      title: 'Acquisition & CRM',
      icon: <Users className="w-4 h-4 text-purple-400" />,
      items: [
        {
          id: 'leads',
          label: currentUser.role === 'collaborateur' ? 'Mes Prospects' : 'Prospects (CRM)',
          icon: <Users className="w-4 h-4 shrink-0" />,
          badge: visibleLeads.length,
          badgeColor: 'bg-purple-500/20 text-purple-300 font-bold',
          description: 'Pipeline, relances et fiches contacts',
        },
        {
          id: 'scanner',
          label: 'Scanner Cartes IA',
          icon: <Camera className="w-4 h-4 shrink-0" />,
          badge: 'IA',
          badgeColor: 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30',
          description: 'Numérisation OCR instantanée',
        },
        {
          id: 'forms',
          label: 'Formulaires & Routage',
          icon: <FileText className="w-4 h-4 shrink-0" />,
          description: 'Capture automatique et distribution',
        },
        {
          id: 'analytics',
          label: 'Statistiques & ROI',
          icon: <BarChart3 className="w-4 h-4 shrink-0" />,
          description: 'Scans, géographie et taux de conversion',
        },
      ],
    },
    {
      id: 'tools',
      title: 'Outils & Partage',
      icon: <Zap className="w-4 h-4 text-emerald-400" />,
      items: [
        {
          id: 'wallet',
          label: 'Apple / Google Wallet',
          icon: <Wallet className="w-4 h-4 shrink-0" />,
          description: 'Pass virtuel sur smartphone',
        },
        {
          id: 'signature',
          label: 'Signature Email Pro',
          icon: <Mail className="w-4 h-4 shrink-0" />,
          description: 'Générateur de signatures HTML',
        },
        {
          id: 'integrations',
          label: 'Intégrations & API',
          icon: <Zap className="w-4 h-4 shrink-0" />,
          badge: 'Live',
          badgeColor: 'bg-emerald-500/20 text-emerald-300',
          description: 'HubSpot, Salesforce, Webhooks',
        },
      ],
    },
    {
      id: 'admin',
      title: 'Organisation & Admin',
      icon: <ShieldCheck className="w-4 h-4 text-amber-400" />,
      items: [
        {
          id: 'team',
          label: 'Gestion d\'équipe',
          icon: <UserCheck className="w-4 h-4 shrink-0" />,
          description: 'Membres, invitations et rôles RBAC',
        },
        {
          id: 'bulk',
          label: 'Édition en Masse',
          icon: <Layers className="w-4 h-4 shrink-0" />,
          description: 'Mise à jour groupée des collaborateurs',
        },
        {
          id: 'settings',
          label: 'Paramètres Organisation',
          icon: <Settings className="w-4 h-4 shrink-0" />,
          description: 'Branding, sécurité et facturation',
        },
        {
          id: 'admin',
          label: 'Super Admin KardX',
          icon: <ShieldCheck className="w-4 h-4 shrink-0" />,
          badge: 'Plateforme',
          badgeColor: 'bg-rose-500/20 text-rose-300 font-bold',
          description: 'Administration globale de l\'instance',
        },
      ],
    },
  ], [visibleCards.length, visibleLeads.length, currentUser.role]);

  // Filter sections by RBAC permissions
  const permittedCategories = useMemo(() => {
    return allNavCategories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter((item) => canUserAccessTab(currentUser, item.id, roleModuleMapping)),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [allNavCategories, currentUser, roleModuleMapping]);

  // Track accordion expanded states (saved in localStorage or auto-open active category)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {
      core: true,
      crm: true,
      tools: false,
      admin: false,
    };
    return initial;
  });

  // Automatically keep the category of the activeTab open
  useEffect(() => {
    const parentCat = permittedCategories.find((cat) =>
      cat.items.some((item) => item.id === activeTab)
    );
    if (parentCat) {
      setExpandedCategories((prev) => ({
        ...prev,
        [parentCat.id]: true,
      }));
    }
  }, [activeTab, permittedCategories]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  // Filter items if searching in sidebar
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return permittedCategories;
    const query = searchQuery.toLowerCase();
    return permittedCategories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) =>
            item.label.toLowerCase().includes(query) ||
            item.description?.toLowerCase().includes(query)
        ),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [permittedCategories, searchQuery]);

  const handleSelectTab = (id: string) => {
    setActiveTab(id);
    onCloseMobile();
  };

  const roleBadge = getRoleBadge(currentUser.role);
  const activeProfileName = activeProfile 
    ? `${activeProfile.firstName} ${activeProfile.lastName}` 
    : 'Mon profil';

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-xs lg:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Shell */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-[#0B1120] border-r border-slate-800 text-slate-200 flex flex-col transition-all duration-300 ease-in-out shadow-2xl ${
          isCollapsed ? 'w-[74px]' : 'w-[270px]'
        } ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* TOP BRANDING & WORKSPACE HEADER */}
        <div className="h-16 border-b border-slate-800/80 px-4 flex items-center justify-between shrink-0 bg-[#0F172A]">
          <button
            onClick={() => handleSelectTab('dashboard')}
            className="flex items-center gap-3 font-black text-xl tracking-tight text-white hover:opacity-90 transition cursor-pointer overflow-hidden"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center font-black text-lg text-white shadow-lg shadow-indigo-900/40 shrink-0 border border-indigo-400/30">
              K
            </div>
            {!isCollapsed && (
              <div className="flex flex-col text-left min-w-0">
                <span className="font-extrabold tracking-tight text-white text-base leading-tight">
                  KardX
                </span>
                <span className="text-[10px] font-semibold text-indigo-400 truncate tracking-wide">
                  {currentOrg.name}
                </span>
              </div>
            )}
          </button>

          {/* Desktop Collapse / Expand Toggle */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title={isCollapsed ? 'Développer le menu' : 'Réduire le menu'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={onCloseMobile}
            className="flex lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Fermer le menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* USER PROFILE & ROLE STRIP */}
        {!isCollapsed && (
          <div className="px-3 pt-3 pb-1 shrink-0">
            <div 
              onClick={() => setIsAuthModalOpen(true)}
              className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 flex items-center justify-between gap-2 transition cursor-pointer group shadow-xs"
              title="Cliquer pour gérer le compte et les accès"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80'}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-700 shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate leading-tight group-hover:text-indigo-300 transition">
                    {currentUser.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-bold uppercase tracking-wider ${roleBadge.color}`}>
                      {roleBadge.label}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-1.5 rounded-lg text-slate-400 group-hover:text-white group-hover:bg-slate-800 transition">
                <KeyRound className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        )}

        {/* ACTIVE PROFILE QUICK SELECTOR */}
        {!isCollapsed && visibleProfiles.length > 0 && (
          <div className="px-3 py-1.5 shrink-0">
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="w-full p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 flex items-center justify-between gap-2 text-left transition cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <img
                    src={activeProfile?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80'}
                    alt={activeProfileName}
                    className="w-6 h-6 rounded-md object-cover ring-1 ring-indigo-500 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-200 truncate leading-tight">
                      {activeProfileName}
                    </p>
                    <p className="text-[9px] text-slate-400 truncate">
                      {activeProfile?.headline || 'Profil digital actif'}
                    </p>
                  </div>
                </div>
                {visibleProfiles.length > 1 && (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}
              </button>

              {/* Profiles Dropdown list */}
              {profileDropdownOpen && visibleProfiles.length > 1 && (
                <div 
                  className="absolute left-0 right-0 top-full mt-1.5 p-1.5 rounded-xl bg-[#0F172A] border border-slate-700 shadow-2xl z-50 max-h-48 overflow-y-auto"
                  onMouseLeave={() => setProfileDropdownOpen(false)}
                >
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Mes profils autorisés
                  </div>
                  {visibleProfiles.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setActiveProfile(p);
                        setProfileDropdownOpen(false);
                      }}
                      className={`w-full p-2 rounded-lg text-left text-xs flex items-center gap-2 transition cursor-pointer ${
                        p.id === activeProfile?.id
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <img
                        src={p.avatarUrl}
                        alt={`${p.firstName} ${p.lastName}`}
                        className="w-5 h-5 rounded-md object-cover"
                      />
                      <span className="truncate">{p.firstName} {p.lastName}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* QUICK SEARCH MODULES */}
        {!isCollapsed && (
          <div className="px-3 pt-1 pb-2 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtrer les fonctionnalités..."
                className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* CATEGORIZED ACCORDION NAV LIST */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-3 scrollbar-thin scrollbar-thumb-slate-800">
          {filteredCategories.map((cat) => {
            const isExpanded = searchQuery.trim() ? true : (expandedCategories[cat.id] ?? true);
            const hasActiveChild = cat.items.some((item) => item.id === activeTab);

            return (
              <div key={cat.id} className="space-y-1">
                {/* Category Header Accordion Trigger */}
                {!isCollapsed ? (
                  <button
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-left transition cursor-pointer group ${
                      hasActiveChild ? 'text-indigo-300 font-bold' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                      {cat.icon}
                      <span className="text-[11px] font-bold tracking-tight">{cat.title}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-800/80 text-slate-400 font-semibold">
                        {cat.items.length}
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${
                          isExpanded ? 'rotate-0' : '-rotate-90'
                        }`}
                      />
                    </div>
                  </button>
                ) : (
                  <div className="h-px bg-slate-800 my-2 mx-1" />
                )}

                {/* Sub-items list */}
                {(isExpanded || isCollapsed) && (
                  <div className="space-y-1 pl-1">
                    {cat.items.map((item) => {
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelectTab(item.id)}
                          title={isCollapsed ? item.label : undefined}
                          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer group relative ${
                            isActive
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/30'
                              : 'text-slate-400 hover:text-white hover:bg-slate-850'
                          } ${isCollapsed ? 'justify-center px-0' : 'justify-between'}`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`transition shrink-0 ${
                                isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                              }`}
                            >
                              {item.icon}
                            </span>
                            {!isCollapsed && (
                              <span className="truncate whitespace-nowrap text-left font-medium">
                                {item.label}
                              </span>
                            )}
                          </div>

                          {!isCollapsed && item.badge !== undefined && (
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 font-bold ${
                                isActive
                                  ? 'bg-white/20 text-white'
                                  : item.badgeColor || 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* BOTTOM WORKSPACE FOOTER */}
        <div className="p-3 border-t border-slate-800/80 bg-[#0B1120] shrink-0">
          {!isCollapsed ? (
            <div className="flex items-center justify-between text-slate-500 text-[10px]">
              <span className="font-semibold tracking-wider uppercase text-slate-400">
                KardX Enterprise
              </span>
              <span className="font-mono text-slate-400">v2.5</span>
            </div>
          ) : (
            <div className="flex justify-center">
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Système en ligne" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
