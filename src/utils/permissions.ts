import { 
  User, 
  UserRole, 
  UserPermissions, 
  Profile, 
  PhysicalCard, 
  Lead, 
  Team,
  Department,
  Organization,
  PlatformModule,
  RoleModuleMapping,
  RbacPreset,
  CustomRole
} from '../types';

export const PLATFORM_MODULES: PlatformModule[] = [
  // CORE & IDENTITY
  {
    id: 'dashboard',
    name: 'Tableau de Bord & Synthèse',
    shortName: 'Dashboard',
    description: 'Accès au tableau de bord général, métriques personnelles ou d\'organisation et raccourcis.',
    category: 'core',
    icon: 'LayoutDashboard',
    riskLevel: 'low',
    tabId: 'dashboard',
    capabilities: [
      { id: 'dash_view', name: 'Consulter métriques', description: 'Affichage des KPI et graphiques d\'activité', risk: 'low' },
    ],
  },
  {
    id: 'profile',
    name: 'Profil Digital & Coordonnées',
    shortName: 'Profil',
    description: 'Édition des informations de contact, réseaux sociaux, services, documents et catalogue.',
    category: 'identity',
    icon: 'User',
    riskLevel: 'low',
    tabId: 'profile',
    capabilities: [
      { id: 'prof_edit', name: 'Éditer coordonnées', description: 'Modifier son numéro, email, bio et liens', risk: 'low' },
      { id: 'prof_publish', name: 'Publier profil public', description: 'Rendre la fiche accessible en ligne via URL/QR', risk: 'low' },
    ],
  },
  {
    id: 'design',
    name: 'Design & Personnalisation Graphique',
    shortName: 'Design',
    description: 'Personnalisation des thèmes, typographies, styles de boutons et palettes de couleurs.',
    category: 'identity',
    icon: 'Palette',
    riskLevel: 'low',
    tabId: 'design',
    capabilities: [
      { id: 'design_theme', name: 'Modifier thèmes', description: 'Changer le mode sombre/clair et les polices', risk: 'low' },
      { id: 'design_custom_css', name: 'Couleurs de marque', description: 'Appliquer la charte graphique de l\'entreprise', risk: 'medium' },
    ],
  },
  {
    id: 'cards',
    name: 'Cartes NFC & QR Codes Connectés',
    shortName: 'Cartes NFC',
    description: 'Gestion des cartes physiques, assignation aux collaborateurs et encodage dynamique.',
    category: 'identity',
    icon: 'CreditCard',
    riskLevel: 'medium',
    tabId: 'cards',
    governingPermission: 'canManageAllCards',
    capabilities: [
      { id: 'cards_view', name: 'Voir cartes assignées', description: 'Visualiser ses cartes NFC et QR codes actifs', risk: 'low' },
      { id: 'cards_manage_all', name: 'Gérer flotte complète', description: 'Associer, révoquer et réassigner toutes les cartes NFC', key: 'canManageAllCards', risk: 'high' },
    ],
  },

  // GROWTH & ACQUISITION
  {
    id: 'leads',
    name: 'Prospects & Gestion CRM (Leads)',
    shortName: 'Leads CRM',
    description: 'Centralisation des contacts collectés via NFC/QR, statuts pipeline, tags et export CSV.',
    category: 'growth',
    icon: 'Users',
    riskLevel: 'medium',
    tabId: 'leads',
    governingPermission: 'canViewAllLeads',
    capabilities: [
      { id: 'leads_view_own', name: 'Voir ses propres leads', description: 'Accéder aux contacts capturés personnellement', risk: 'low' },
      { id: 'leads_view_all', name: 'Voir tous les leads organisation', description: 'Accès exhaustif à tous les leads des équipes', key: 'canViewAllLeads', risk: 'high' },
      { id: 'leads_export', name: 'Exporter en CSV/Excel', description: 'Télécharger les bases de données contacts', key: 'canExportData', risk: 'high' },
    ],
  },
  {
    id: 'scanner',
    name: 'Scanner IA de Cartes de Visite (OCR)',
    shortName: 'Scanner OCR',
    description: 'Numérisation automatique par vision artificielle et extraction instantanée de coordonnées.',
    category: 'growth',
    icon: 'Camera',
    riskLevel: 'low',
    tabId: 'scanner',
    governingPermission: 'canUseAiScanner',
    capabilities: [
      { id: 'scan_ocr', name: 'Numériser cartes papier', description: 'Extraire textes et coordonnées avec Gemini OCR', key: 'canUseAiScanner', risk: 'low' },
    ],
  },
  {
    id: 'forms',
    name: 'Formulaires & Moteur de Routage',
    shortName: 'Formulaires',
    description: 'Création de formulaires d\'échange de contacts et règles d\'attribution intelligente.',
    category: 'growth',
    icon: 'FileText',
    riskLevel: 'medium',
    tabId: 'forms',
    governingPermission: 'canManageForms',
    capabilities: [
      { id: 'forms_edit', name: 'Créer formulaires', description: 'Personnaliser les champs requis et l\'UX de capture', key: 'canManageForms', risk: 'medium' },
      { id: 'forms_routing', name: 'Règles de routage automatique', description: 'Attribuer selon le secteur géographique ou la valeur', risk: 'medium' },
    ],
  },
  {
    id: 'analytics',
    name: 'Statistiques, Trafic & ROI',
    shortName: 'Analytics',
    description: 'Mesure d\'audience, taux de conversion NFC/QR, clics sur liens et géolocalisation.',
    category: 'growth',
    icon: 'BarChart3',
    riskLevel: 'medium',
    tabId: 'analytics',
    governingPermission: 'canAccessAnalytics',
    capabilities: [
      { id: 'analytics_view', name: 'Consulter rapports', description: 'Graphiques de performance et rétention', key: 'canAccessAnalytics', risk: 'low' },
    ],
  },

  // TOOLS & SHARING
  {
    id: 'wallet',
    name: 'Apple Wallet & Google Wallet Pass',
    shortName: 'Wallet Pass',
    description: 'Génération de cartes dématérialisées pour smartphones iOS et Android avec QR dynamique.',
    category: 'tools',
    icon: 'Wallet',
    riskLevel: 'low',
    tabId: 'wallet',
    capabilities: [
      { id: 'wallet_generate', name: 'Télécharger pass .pkpass', description: 'Installer sa carte sur Apple Wallet ou Google Pay', risk: 'low' },
    ],
  },
  {
    id: 'signature',
    name: 'Générateur de Signatures Email Pro',
    shortName: 'Signature Email',
    description: 'Génération de signatures HTML interactives avec liens de prise de RDV et vCard.',
    category: 'tools',
    icon: 'Mail',
    riskLevel: 'low',
    tabId: 'signature',
    capabilities: [
      { id: 'sig_generate', name: 'Copier signature HTML', description: 'Intégrer sa signature dans Outlook, Gmail ou Apple Mail', risk: 'low' },
    ],
  },
  {
    id: 'integrations',
    name: 'Hub d\'Intégrations & Webhooks API',
    shortName: 'Intégrations CRM',
    description: 'Connexion aux CRM externes (HubSpot, Salesforce, Pipedrive, Zapier, Webhooks HTTP).',
    category: 'tools',
    icon: 'Zap',
    riskLevel: 'high',
    tabId: 'integrations',
    governingPermission: 'canManageIntegrations',
    capabilities: [
      { id: 'integ_manage', name: 'Configurer clés API & Webhooks', description: 'Synchronisation automatique en temps réel des leads', key: 'canManageIntegrations', risk: 'high' },
    ],
  },

  // ADMINISTRATION & SECURITY
  {
    id: 'team',
    name: 'Gestion d\'Équipe & Attribution des Rôles',
    shortName: 'Équipe',
    description: 'Invitation de membres, création de sous-équipes et modification des rôles.',
    category: 'admin',
    icon: 'UserCheck',
    riskLevel: 'high',
    tabId: 'team',
    governingPermission: 'canManageTeam',
    capabilities: [
      { id: 'team_invite', name: 'Inviter collaborateurs', description: 'Envoyer des accès et assigner un profil', key: 'canManageTeam', risk: 'high' },
      { id: 'team_roles', name: 'Modifier rôles & 2FA', description: 'Gérer les privilèges et exiger la sécurité 2FA', risk: 'critical' },
    ],
  },
  {
    id: 'bulk',
    name: 'Édition en Masse des Profils',
    shortName: 'Édition Masse',
    description: 'Modification simultanée de coordonnées, thèmes et documents pour plusieurs profils.',
    category: 'admin',
    icon: 'Layers',
    riskLevel: 'high',
    tabId: 'bulk',
    governingPermission: 'canBulkEditProfiles',
    capabilities: [
      { id: 'bulk_edit', name: 'Mise à jour groupée', description: 'Appliquer des modifications à toute l\'équipe en 1 clic', key: 'canBulkEditProfiles', risk: 'high' },
    ],
  },
  {
    id: 'settings',
    name: 'Paramètres Organisation & Domaine CNAME',
    shortName: 'Organisation',
    description: 'Configuration white-label, domaine CNAME personnalisé, quotas et sécurité globale 2FA.',
    category: 'admin',
    icon: 'Settings',
    riskLevel: 'critical',
    tabId: 'settings',
    governingPermission: 'canManageOrganization',
    capabilities: [
      { id: 'org_settings', name: 'Gérer paramètres généraux', description: 'Modifier le domaine, logo et politiques 2FA', key: 'canManageOrganization', risk: 'critical' },
    ],
  },
  {
    id: 'admin',
    name: 'Console Super Admin Multi-Tenant',
    shortName: 'Super Admin',
    description: 'Supervision globale de la plateforme, gestion des tenants, matrice RBAC et facturation.',
    category: 'admin',
    icon: 'ShieldCheck',
    riskLevel: 'critical',
    tabId: 'admin',
    governingPermission: 'canAccessSuperAdmin',
    capabilities: [
      { id: 'superadmin_access', name: 'Console SuperAdmin', description: 'Accès absolu à tous les tenants et matrices de droits', key: 'canAccessSuperAdmin', risk: 'critical' },
    ],
  },
];

export const DEFAULT_ROLE_MODULES: RoleModuleMapping = {
  super_admin: [
    'dashboard',
    'profile',
    'design',
    'cards',
    'leads',
    'scanner',
    'forms',
    'analytics',
    'wallet',
    'signature',
    'integrations',
    'team',
    'bulk',
    'settings',
    'admin',
  ],
  admin: [
    'dashboard',
    'profile',
    'design',
    'cards',
    'leads',
    'scanner',
    'forms',
    'analytics',
    'wallet',
    'signature',
    'integrations',
    'team',
    'bulk',
    'settings',
  ],
  manager: [
    'dashboard',
    'profile',
    'design',
    'cards',
    'leads',
    'scanner',
    'forms',
    'analytics',
    'wallet',
    'signature',
    'team',
  ],
  collaborateur: [
    'dashboard',
    'profile',
    'design',
    'cards',
    'leads',
    'scanner',
    'analytics',
    'wallet',
    'signature',
  ],
  viewer: [
    'dashboard',
    'profile',
  ],
};

export const DEFAULT_CUSTOM_ROLES: CustomRole[] = [
  {
    id: 'role_sales_lead',
    name: 'Responsable Commercial',
    description: 'Gestion avancée des leads, attribution des formulaires et suivi des performances sans accès système.',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    baseRole: 'manager',
    isSystem: false,
    createdAt: '2025-01-15T10:00:00Z',
    allowedModules: ['dashboard', 'profile', 'design', 'cards', 'leads', 'scanner', 'forms', 'analytics', 'wallet', 'signature', 'team'],
  },
  {
    id: 'role_marketing_ops',
    name: 'Brand & Marketing Ops',
    description: 'Gestion centralisée du design, des formulaires, signatures et intégrations CRM/Webhooks.',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    baseRole: 'admin',
    isSystem: false,
    createdAt: '2025-02-01T10:00:00Z',
    allowedModules: ['dashboard', 'profile', 'design', 'cards', 'leads', 'forms', 'analytics', 'signature', 'integrations', 'bulk'],
  },
  {
    id: 'role_compliance_auditor',
    name: 'Auditeur Conformité & Sécurité',
    description: 'Accès en lecture et audit des analytics et équipes pour conformité RGPD et ISO 27001.',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    baseRole: 'viewer',
    isSystem: false,
    createdAt: '2025-02-20T10:00:00Z',
    allowedModules: ['dashboard', 'profile', 'analytics', 'team'],
  },
];

export const RBAC_PRESETS: RbacPreset[] = [
  {
    id: 'preset_standard',
    name: 'Standard Entreprise (Recommandé)',
    description: 'Politique équilibrée : administrateurs autonomes, managers supervisant leur équipe, collaborateurs focalisés sur la prospection.',
    badge: 'Standard',
    icon: 'ShieldCheck',
    roleModuleMapping: DEFAULT_ROLE_MODULES,
  },
  {
    id: 'preset_zero_trust',
    name: 'Zero-Trust & Haute Sécurité',
    description: 'Verrouillage maximal des intégrations API, exports de données et édition de masse aux seuls Super Admins.',
    badge: 'Strict ISO',
    icon: 'Lock',
    roleModuleMapping: {
      super_admin: [...DEFAULT_ROLE_MODULES.super_admin],
      admin: ['dashboard', 'profile', 'design', 'cards', 'leads', 'scanner', 'forms', 'analytics', 'wallet', 'signature', 'team', 'settings'],
      manager: ['dashboard', 'profile', 'cards', 'leads', 'scanner', 'forms', 'wallet', 'signature'],
      collaborateur: ['dashboard', 'profile', 'cards', 'leads', 'scanner', 'wallet'],
      viewer: ['dashboard', 'profile'],
    },
  },
  {
    id: 'preset_field_sales',
    name: 'Flotte Commerciale Terrain & Salons',
    description: 'Optimisé pour les équipes de vente terrain : accès complet au scanner OCR IA, cartes NFC, wallet et CRM leads.',
    badge: 'Sales Driven',
    icon: 'Zap',
    roleModuleMapping: {
      super_admin: [...DEFAULT_ROLE_MODULES.super_admin],
      admin: [...DEFAULT_ROLE_MODULES.admin],
      manager: ['dashboard', 'profile', 'design', 'cards', 'leads', 'scanner', 'forms', 'analytics', 'wallet', 'signature', 'team'],
      collaborateur: ['dashboard', 'profile', 'design', 'cards', 'leads', 'scanner', 'forms', 'analytics', 'wallet', 'signature'],
      viewer: ['dashboard', 'profile', 'cards'],
    },
  },
  {
    id: 'preset_read_only',
    name: 'Mode Conformité & Lecture Seule',
    description: 'Restriction de tous les rôles inférieurs aux fonctions de consultation pour période d\'audit ou maintenance.',
    badge: 'Audit Mode',
    icon: 'Eye',
    roleModuleMapping: {
      super_admin: [...DEFAULT_ROLE_MODULES.super_admin],
      admin: ['dashboard', 'profile', 'analytics', 'team', 'settings'],
      manager: ['dashboard', 'profile', 'analytics'],
      collaborateur: ['dashboard', 'profile'],
      viewer: ['dashboard'],
    },
  },
];

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, UserPermissions> = {
  super_admin: {
    canAccessSuperAdmin: true,
    canManageOrganization: true,
    canManageTeam: true,
    canViewAllLeads: true,
    canManageAllCards: true,
    canManageIntegrations: true,
    canManageForms: true,
    canBulkEditProfiles: true,
    canExportData: true,
    canAccessAnalytics: true,
    canUseAiScanner: true,
  },
  admin: {
    canAccessSuperAdmin: false,
    canManageOrganization: true,
    canManageTeam: true,
    canViewAllLeads: true,
    canManageAllCards: true,
    canManageIntegrations: true,
    canManageForms: true,
    canBulkEditProfiles: true,
    canExportData: true,
    canAccessAnalytics: true,
    canUseAiScanner: true,
  },
  manager: {
    canAccessSuperAdmin: false,
    canManageOrganization: false,
    canManageTeam: true,
    canViewAllLeads: true, // Leads of their team/members
    canManageAllCards: false,
    canManageIntegrations: false,
    canManageForms: false,
    canBulkEditProfiles: false,
    canExportData: true,
    canAccessAnalytics: true,
    canUseAiScanner: true,
  },
  collaborateur: {
    canAccessSuperAdmin: false,
    canManageOrganization: false,
    canManageTeam: false,
    canViewAllLeads: false, // strictly restricted to own leads
    canManageAllCards: false, // only their own cards
    canManageIntegrations: false,
    canManageForms: false,
    canBulkEditProfiles: false,
    canExportData: true, // can export own leads
    canAccessAnalytics: true, // own stats
    canUseAiScanner: true,
  },
  viewer: {
    canAccessSuperAdmin: false,
    canManageOrganization: false,
    canManageTeam: false,
    canViewAllLeads: false,
    canManageAllCards: false,
    canManageIntegrations: false,
    canManageForms: false,
    canBulkEditProfiles: false,
    canExportData: false,
    canAccessAnalytics: false,
    canUseAiScanner: false,
  },
};

export const getUserPermissions = (
  user: User,
  customRolePermissions?: Record<string, UserPermissions>
): UserPermissions => {
  const baseMap = customRolePermissions || DEFAULT_ROLE_PERMISSIONS;
  const basePermissions = baseMap[user.role] || DEFAULT_ROLE_PERMISSIONS.collaborateur;
  if (!user.customPermissions) {
    return basePermissions;
  }
  return {
    ...basePermissions,
    ...user.customPermissions,
  };
};

export const hasPermission = (user: User, permission: keyof UserPermissions): boolean => {
  const permissions = getUserPermissions(user);
  return !!permissions[permission];
};

export const canUserAccessTab = (
  user: User, 
  tabId: string, 
  roleModuleMapping?: RoleModuleMapping
): boolean => {
  if (tabId === 'landing') return true;

  // Super admin always has full access
  if (user.role === 'super_admin') return true;

  // If a dynamic roleModuleMapping is provided, check if the module is in the role's allowed list
  if (roleModuleMapping && roleModuleMapping[user.role]) {
    const allowed = roleModuleMapping[user.role].includes(tabId);
    if (!allowed) {
      // Check if user has explicit permission override
      if (tabId === 'settings' && user.customPermissions?.canManageOrganization) return true;
      if (tabId === 'team' && user.customPermissions?.canManageTeam) return true;
      if (tabId === 'integrations' && user.customPermissions?.canManageIntegrations) return true;
      if (tabId === 'forms' && user.customPermissions?.canManageForms) return true;
      if (tabId === 'bulk' && user.customPermissions?.canBulkEditProfiles) return true;
      if (tabId === 'analytics' && user.customPermissions?.canAccessAnalytics) return true;
      if (tabId === 'scanner' && user.customPermissions?.canUseAiScanner) return true;
      return false;
    }
  }

  // Fallback / legacy check against permissions
  const permissions = getUserPermissions(user);

  switch (tabId) {
    case 'admin':
      return permissions.canAccessSuperAdmin;
    case 'settings':
      return permissions.canManageOrganization;
    case 'team':
      return permissions.canManageTeam;
    case 'bulk':
      return permissions.canBulkEditProfiles;
    case 'integrations':
      return permissions.canManageIntegrations;
    case 'forms':
      return permissions.canManageForms;
    case 'analytics':
      return permissions.canAccessAnalytics;
    case 'scanner':
      return permissions.canUseAiScanner;
    case 'dashboard':
    case 'profile':
    case 'design':
    case 'cards':
    case 'leads':
    case 'signature':
    case 'wallet':
      return true;
    default:
      return true;
  }
};

/**
 * Filter profiles that the user is authorized to view/edit
 */
export const filterProfilesForUser = (
  user: User, 
  allProfiles: Profile[],
  teams: Team[] = [],
  departments: Department[] = [],
  allUsers: User[] = []
): Profile[] => {
  // STRICT RULE: Super admin NEVER sees business data of client organizations
  if (user.role === 'super_admin') {
    return allProfiles.filter(p => p.userId === user.id);
  }

  // Org Admin sees all profiles in their organization
  if (user.role === 'admin') {
    return allProfiles.filter((p) => p.organizationId === user.organizationId);
  }

  // Manager: check if head of a department or manager of an individual team
  if (user.role === 'manager') {
    // 1. If head of one or more departments
    const managedDeptIds = departments
      .filter((d) => d.headUserId === user.id && d.organizationId === user.organizationId)
      .map((d) => d.id);

    // Teams inside those departments
    const deptTeamIds = teams
      .filter((t) => t.departmentId && managedDeptIds.includes(t.departmentId))
      .map((t) => t.id);

    // 2. If manager of an individual team
    const managedTeamIds = teams
      .filter((t) => t.managerId === user.id && t.organizationId === user.organizationId)
      .map((t) => t.id);

    const allAllowedTeamIds = new Set([...deptTeamIds, ...managedTeamIds]);

    if (allAllowedTeamIds.size > 0) {
      // Find all user IDs in these teams
      const allowedUserIds = new Set(
        allUsers
          .filter((u) => u.teamId && allAllowedTeamIds.has(u.teamId))
          .map((u) => u.id)
      );
      allowedUserIds.add(user.id);
      return allProfiles.filter(
        (p) => p.organizationId === user.organizationId && allowedUserIds.has(p.userId)
      );
    }

    return allProfiles.filter((p) => p.userId === user.id);
  }

  // Collaborator & Viewer: strictly only own profile
  return allProfiles.filter((p) => p.userId === user.id);
};

/**
 * Filter physical/virtual cards assigned to or accessible by the user
 */
export const filterCardsForUser = (
  user: User,
  allCards: PhysicalCard[],
  userProfiles: Profile[]
): PhysicalCard[] => {
  // Super admin has no access to client cards
  if (user.role === 'super_admin') {
    const userProfileIds = new Set(userProfiles.map((p) => p.id));
    return allCards.filter(
      (c) => c.assignedToUser === user.id || userProfileIds.has(c.profileId)
    );
  }

  if (user.role === 'admin') {
    return allCards;
  }

  const userProfileIds = new Set(userProfiles.map((p) => p.id));
  return allCards.filter(
    (c) => c.assignedToUser === user.id || userProfileIds.has(c.profileId)
  );
};

/**
 * Filter leads based on user ownership, role and hierarchy
 */
export const filterLeadsForUser = (
  user: User,
  allLeads: Lead[],
  userProfiles: Profile[]
): Lead[] => {
  // Super admin NEVER accesses customer leads
  if (user.role === 'super_admin') {
    return [];
  }

  // Organization Admin sees all leads of their organization
  if (user.role === 'admin') {
    return allLeads.filter((l) => l.organizationId === user.organizationId);
  }

  const userProfileIds = new Set(userProfiles.map((p) => p.id));

  // Manager sees leads of accessible profiles or assigned directly
  if (user.role === 'manager') {
    return allLeads.filter(
      (l) => l.assignedUserId === user.id || userProfileIds.has(l.profileId)
    );
  }

  // Collaborator strictly sees only own leads
  return allLeads.filter(
    (l) => l.assignedUserId === user.id || userProfileIds.has(l.profileId)
  );
};

export const ROLE_DEFINITIONS: Array<{
  role: UserRole;
  label: string;
  badgeColor: string;
  description: string;
  permissions: string[];
}> = [
  {
    role: 'super_admin',
    label: 'Super Admin',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    description: 'Accès absolu à tous les espaces, organisations, configurations globales et sécurité.',
    permissions: ['Plateforme globale', 'Organisations', 'Gestion d\'équipe', 'Tous les leads', 'Toutes les cartes', 'Intégrations', 'Formulaires', 'Édition de masse', 'Export CSV', 'Analytics & IA'],
  },
  {
    role: 'admin',
    label: 'Administrateur',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    description: 'Gestion complète de l\'entreprise : collaborateurs, licences, branding, intégrations et vision globale.',
    permissions: ['Gestion d\'équipe', 'Tous les leads', 'Toutes les cartes', 'Intégrations', 'Formulaires', 'Édition de masse', 'Export CSV', 'Analytics & IA'],
  },
  {
    role: 'manager',
    label: 'Manager d\'équipe',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Supervision des membres de son équipe, suivi des opportunités CRM d\'équipe et assignation des prospects.',
    permissions: ['Gestion d\'équipe', 'Leads d\'équipe', 'Cartes de l\'équipe', 'Formulaires', 'Export CSV', 'Analytics'],
  },
  {
    role: 'collaborateur',
    label: 'Collaborateur',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    description: 'Espace individuel et confidentiel : gestion de son profil digital, ses cartes NFC/QR, signature email, wallet et ses propres prospects.',
    permissions: ['Mon profil digital', 'Mes cartes NFC', 'Mes prospects CRM', 'Signature email', 'Scanner IA', 'Mon Wallet'],
  },
  {
    role: 'viewer',
    label: 'Lecteur (Viewer)',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
    description: 'Consultation en lecture seule sans droits de modification ni création.',
    permissions: ['Consultation profil', 'Lecture seule'],
  },
];

export const getRoleBadge = (role: UserRole | string) => {
  switch (role) {
    case 'super_admin':
      return {
        label: 'Super Admin',
        color: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
        badgeBg: 'bg-purple-600 text-white',
        description: 'Accès total à la plateforme, tous les tenants, utilisateurs et métriques globales.',
      };
    case 'admin':
      return {
        label: 'Administrateur',
        color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
        badgeBg: 'bg-indigo-600 text-white',
        description: 'Gestion complète de l\'organisation, de l\'équipe, des cartes et de tous les leads.',
      };
    case 'manager':
      return {
        label: 'Manager Équipe',
        color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        badgeBg: 'bg-blue-600 text-white',
        description: 'Supervision de son équipe commerciale, des leads d\'équipe et assignation.',
      };
    case 'collaborateur':
      return {
        label: 'Collaborateur',
        color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        badgeBg: 'bg-emerald-600 text-white',
        description: 'Espace privé : gestion exclusive de son profil, ses cartes NFC et ses propres leads.',
      };
    case 'viewer':
      return {
        label: 'Lecteur',
        color: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
        badgeBg: 'bg-slate-600 text-white',
        description: 'Consultation restreinte en lecture seule.',
      };
    default:
      return {
        label: role,
        color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
        badgeBg: 'bg-indigo-600 text-white',
        description: 'Rôle personnalisé configuré par l\'administrateur.',
      };
  }
};


