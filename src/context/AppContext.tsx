import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Profile,
  PhysicalCard,
  Lead,
  LeadTask,
  LeadTaskType,
  LeadTaskPriority,
  LeadTaskStatus,
  LeadInteraction,
  LeadForm,
  AnalyticsEvent,
  User,
  UserRole,
  Organization,
  Department,
  Team,
  Integration,
  WebhookEndpoint,
  AuditLog,
  ProfileBlock,
  ProfileTheme,
  CardStatus,
  LeadStatus,
  LeadSource,
  EventType,
  AppNotification,
  LeadRoutingRule,
  RoutingTestResult,
  UserPermissions,
  TwoFactorMethod,
  TrustedDevice,
  TwoFactorChallenge,
  PasswordChangeChallenge,
  PlanType,
  RoleModuleMapping,
  RolePermissionMapping,
  CustomRole,
  RbacAuditLog,
  RbacPreset,
  PlatformModule,
  CrmSyncLog,
  LeadCrmSyncInfo,
  CrmIntegrationConfig,
} from '../types';
import { THEME_PRESETS } from '../utils/themePresets';
import { applyRoutingToLead, evaluateLeadRouting } from '../utils/leadRouting';
import {
  executeCrmLeadSync,
  SEED_CRM_SYNC_LOGS,
  DEFAULT_HUBSPOT_MAPPINGS,
  DEFAULT_SALESFORCE_MAPPINGS,
  DEFAULT_PIPEDRIVE_MAPPINGS,
  DEFAULT_ZOHO_MAPPINGS,
} from '../utils/crmSyncEngine';
import {
  getUserPermissions,
  hasPermission,
  canUserAccessTab,
  filterProfilesForUser,
  filterCardsForUser,
  filterLeadsForUser,
  getRoleBadge,
  PLATFORM_MODULES,
  DEFAULT_ROLE_MODULES,
  DEFAULT_CUSTOM_ROLES,
  RBAC_PRESETS,
  DEFAULT_ROLE_PERMISSIONS,
} from '../utils/permissions';
import {
  generateEmailOtpCode,
  generateBackupCodes,
  generateTOTPSecret,
  maskEmail,
  verifyTwoFactorInput,
} from '../utils/twoFactor';
import {
  triggerBrowserNotification,
  playNotificationChime,
} from '../utils/browserNotifications';

interface AppContextType {
  currentUser: User;
  currentOrg: Organization;
  organizations: Organization[];
  users: User[];
  departments: Department[];
  teams: Team[];
  profiles: Profile[];
  activeProfile: Profile;
  cards: PhysicalCard[];
  leads: Lead[];
  forms: LeadForm[];
  events: AnalyticsEvent[];
  integrations: Integration[];
  webhooks: WebhookEndpoint[];
  auditLogs: AuditLog[];
  notifications: AppNotification[];
  unreadNotificationsCount: number;

  // RBAC & Permissions State
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  login: (email: string, password?: string) => { success: boolean; error?: string };
  logout: () => void;
  userPermissions: UserPermissions;
  visibleProfiles: Profile[];
  visibleCards: PhysicalCard[];
  visibleLeads: Lead[];
  visibleTeams: Team[];
  visibleDepartments: Department[];
  hasUserPermission: (permission: keyof UserPermissions) => boolean;
  canAccessCurrentTab: boolean;
  
  // 2FA / Two-Factor Authentication System
  current2FaChallenge: TwoFactorChallenge | null;
  initiateLogin: (email: string, password?: string) => { success: boolean; requires2Fa?: boolean; requiresPasswordChange?: boolean; error?: string; challenge?: TwoFactorChallenge; passwordChallenge?: PasswordChangeChallenge };
  complete2FaVerification: (code: string, method: 'totp' | 'email' | 'backup', trustDevice?: boolean) => { success: boolean; error?: string };
  resend2FaEmailCode: () => string | null;
  cancel2FaChallenge: () => void;
  updateUserTwoFactor: (userId: string, config: { enabled: boolean; method?: TwoFactorMethod; secret?: string; email?: string; backupCodes?: string[] }) => void;
  generateNewBackupCodes: (userId: string) => string[];
  revokeTrustedDevice: (userId: string, deviceId: string) => void;

  // Password Change on First Login System
  passwordChangeChallenge: PasswordChangeChallenge | null;
  completePasswordChange: (token: string, newPassword: string, confirmPassword: string) => { success: boolean; error?: string };
  cancelPasswordChange: () => void;

  // Navigation / View State
  activeTab: string;
  setActiveTab: (tab: string) => void;
  publicProfileSlug: string | null;
  setPublicProfileSlug: (slug: string | null) => void;
  isExchangeModalOpen: boolean;
  setIsExchangeModalOpen: (open: boolean) => void;
  exchangeSource: LeadSource;
  setExchangeSource: (source: LeadSource) => void;
  isNfcSimModalOpen: boolean;
  setIsNfcSimModalOpen: (open: boolean) => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;

  // Notification actions
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;
  addNotification: (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;

  // Actions
  setActiveProfile: (profile: Profile) => void;
  updateProfile: (updated: Partial<Profile>) => void;
  addBlock: (type: ProfileBlock['type']) => void;
  updateBlock: (blockId: string, updated: Partial<ProfileBlock>) => void;
  deleteBlock: (blockId: string) => void;
  reorderBlocks: (startIndex: number, endIndex: number) => void;
  updateTheme: (updatedTheme: Partial<ProfileTheme>) => void;
  
  // Cards
  addCard: (card: Omit<PhysicalCard, 'id' | 'createdAt' | 'scansCount'>) => void;
  updateCardStatus: (cardId: string, status: CardStatus) => void;
  reassignCard: (cardId: string, profileId: string) => void;
  deleteCard: (cardId: string) => void;

  // Leads
  createLead: (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'organizationId'>) => Promise<Lead>;
  updateLeadStatus: (leadId: string, status: LeadStatus) => void;
  updateLeadDetails: (leadId: string, data: Partial<Lead>) => void;
  deleteLead: (leadId: string) => void;
  addLeadTag: (leadId: string, tag: string) => void;
  toggleLeadFavorite: (leadId: string) => void;
  addLeadInteraction: (leadId: string, interaction: Omit<LeadInteraction, 'id' | 'createdAt' | 'leadId'>) => void;
  deleteLeadInteraction: (leadId: string, interactionId: string) => void;
  addLeadTask: (leadId: string, task: Omit<LeadTask, 'id' | 'createdAt' | 'leadId'>) => void;
  updateLeadTask: (leadId: string, taskId: string, updates: Partial<LeadTask>) => void;
  deleteLeadTask: (leadId: string, taskId: string) => void;
  toggleLeadTaskComplete: (leadId: string, taskId: string) => void;
  setLeadReminder: (leadId: string, reminderDate?: string, reminderNote?: string, autoTask?: boolean) => void;

  // Lead Routing System
  routingRules: LeadRoutingRule[];
  addRoutingRule: (rule: Omit<LeadRoutingRule, 'id' | 'createdAt' | 'updatedAt' | 'matchesCount'>) => void;
  updateRoutingRule: (ruleId: string, data: Partial<LeadRoutingRule>) => void;
  deleteRoutingRule: (ruleId: string) => void;
  reorderRoutingRules: (startIndex: number, endIndex: number) => void;
  toggleRoutingRuleActive: (ruleId: string) => void;
  testRoutingRule: (leadData: Partial<Lead>) => RoutingTestResult;
  reRouteAllLeads: (onlyUnassigned?: boolean) => { totalProcessed: number; totalRouted: number; details: Record<string, number> };

  // Forms
  createForm: (form: Omit<LeadForm, 'id' | 'createdAt' | 'usedInProfilesCount' | 'submissionsCount' | 'organizationId'>) => void;
  updateForm: (formId: string, data: Partial<LeadForm>) => void;

  // Departments Hierarchy
  createDepartment: (dept: Omit<Department, 'id' | 'createdAt' | 'organizationId'>) => void;
  updateDepartment: (id: string, updates: Partial<Department>) => void;
  deleteDepartment: (id: string) => void;

  // Teams & Hierarchy
  createTeam: (team: Omit<Team, 'id' | 'createdAt' | 'organizationId' | 'membersCount'>) => void;
  updateTeam: (id: string, updates: Partial<Team>) => void;
  deleteTeam: (id: string) => void;
  addMemberToTeam: (teamId: string, userId: string, position?: string) => void;
  removeMemberFromTeam: (teamId: string, userId: string) => void;

  // Users & Roles
  addUser: (user: Omit<User, 'id' | 'createdAt' | 'organizationId'>) => void;
  updateUserRole: (userId: string, role: User['role']) => void;
  updateUserStatus: (userId: string, status: User['status']) => void;
  updateUserPosition: (userId: string, position: string) => void;
  switchUser: (userId: string) => void;
  bulkUpdateProfiles: (profileIds: string[], updates: Partial<Profile>) => void;

  // Super-Admin Multi-Tenant Management
  createOrganization: (params: { 
    organizationName?: string; 
    name?: string; 
    plan: PlanType; 
    adminName: string; 
    adminEmail: string;
    adminJobTitle?: string;
    adminPosition?: string;
    tempPassword?: string;
    seatsTotal?: number;
    primaryColor?: string;
    domain?: string;
    enabledModules?: string[];
    initialDepartments?: { name: string; description?: string }[];
    initialTeams?: { name: string; departmentName?: string; description?: string }[];
    initialMembers?: { name: string; email: string; role: UserRole; position?: string; departmentName?: string; teamName?: string }[];
  }) => { success: boolean; orgId?: string; error?: string };
  updateOrganization: (orgId: string, updates: Partial<Organization>) => void;
  switchOrganization: (orgId: string) => void;
  suspendOrganization: (orgId: string) => void;
  reactivateOrganization: (orgId: string) => void;

  // RBAC Matrix & Audit State
  roleModuleMapping: RoleModuleMapping;
  toggleRoleModule: (role: UserRole, moduleId: string) => void;
  applyRbacPreset: (presetId: string) => void;
  rbacAuditLogs: RbacAuditLog[];

  // Analytics & Tracking
  trackEvent: (type: EventType, profileId?: string, source?: LeadSource, metadata?: Record<string, any>) => void;
  
  // Integrations, Webhooks & Automated CRM Sync
  crmSyncLogs: CrmSyncLog[];
  toggleIntegration: (id: string, enable: boolean) => void;
  updateIntegrationConfig: (id: string, updates: Partial<CrmIntegrationConfig>) => void;
  syncLeadToCrm: (leadId: string, provider?: 'hubspot' | 'salesforce' | 'pipedrive' | 'zoho') => Promise<{ success: boolean; results: { provider: string; success: boolean; externalId?: string; error?: string }[] }>;
  syncAllUnsyncedLeads: (provider?: 'hubspot' | 'salesforce' | 'pipedrive' | 'zoho') => Promise<{ totalSynced: number; errors: number }>;
  testCrmConnection: (provider: 'hubspot' | 'salesforce' | 'pipedrive' | 'zoho') => Promise<{ success: boolean; log: CrmSyncLog }>;
  clearCrmSyncLogs: () => void;
  createWebhook: (url: string, events: EventType[]) => void;
  addWebhook: (webhook: { url: string; events: EventType[]; active?: boolean }) => void;
  testWebhook: (id: string) => Promise<boolean>;
  deleteWebhook: (id: string) => void;

  // Simulation
  simulateNfcTap: (cardId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Initial Seed Data
const SEED_ORG: Organization = {
  id: 'org_bestexperts',
  name: 'BEST EXPERTS-GROUP',
  logoUrl: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=200&h=200&q=80',
  domain: 'bestexperts-group.com',
  slug: 'bestexperts',
  plan: 'business',
  primaryColor: '#1e3a8a',
  status: 'active',
  createdAt: '2025-01-10T08:00:00Z',
  seatsTotal: 15,
  seatsUsed: 4,
  usersCount: 4,
  adminEmail: 'sagbodavidcomlan@gmail.com',
  adminName: 'David Sagbo',
};

const SEED_ORGS: Organization[] = [
  SEED_ORG,
  {
    id: 'org_total_energies',
    name: 'TotalEnergies Renewables',
    slug: 'total-energies',
    logoUrl: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=120&h=120&q=80',
    plan: 'enterprise',
    primaryColor: '#dc2626',
    status: 'active',
    seatsTotal: 150,
    seatsUsed: 134,
    usersCount: 134,
    createdAt: '2025-01-10T08:00:00Z',
    adminEmail: 'admin@total-renewables.com',
    adminName: 'Thomas Laurent',
  },
  {
    id: 'org_bnp_paribas',
    name: 'BNP Paribas Wealth Management',
    slug: 'bnp-wealth',
    logoUrl: 'https://images.unsplash.com/photo-1554469384-e58fac16e23a?auto=format&fit=crop&w=120&h=120&q=80',
    plan: 'enterprise',
    primaryColor: '#059669',
    status: 'active',
    seatsTotal: 300,
    seatsUsed: 288,
    usersCount: 288,
    createdAt: '2024-11-20T08:00:00Z',
    adminEmail: 'wealth-admin@bnpparibas.com',
    adminName: 'Claire De Valois',
  },
  {
    id: 'org_scaleup_tech',
    name: 'ScaleUp Technologies SAS',
    slug: 'scaleup-tech',
    logoUrl: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?auto=format&fit=crop&w=120&h=120&q=80',
    plan: 'business',
    primaryColor: '#7c3aed',
    status: 'trial',
    trialEndsAt: '2026-09-15T00:00:00Z',
    seatsTotal: 25,
    seatsUsed: 18,
    usersCount: 18,
    createdAt: '2025-03-01T08:00:00Z',
    adminEmail: 'contact@scaleup-tech.com',
    adminName: 'Alexandre Meyer',
  },
];

const SEED_DEPARTMENTS: Department[] = [
  {
    id: 'dept_sales',
    name: 'Direction Commerciale & Partenariats',
    organizationId: 'org_bestexperts',
    headUserId: 'usr_david',
    description: 'Acquisition B2B, grands comptes, partenariats stratégiques et salons.',
    createdAt: '2025-01-12T08:00:00Z',
  },
  {
    id: 'dept_consulting',
    name: 'Direction Conseil & Transformation Digitale',
    organizationId: 'org_bestexperts',
    headUserId: 'usr_marie',
    description: 'Missions de conseil stratégique, gouvernance et cadrage technologique.',
    createdAt: '2025-01-15T09:00:00Z',
  },
  {
    id: 'dept_tech',
    name: 'Pôle Opérations & Systèmes d\'Information',
    organizationId: 'org_bestexperts',
    headUserId: undefined,
    description: 'Infrastructure sécurisée, intégrations CRM/ERP et conformité.',
    createdAt: '2025-02-01T10:00:00Z',
  },
];

const SEED_TEAMS: Team[] = [
  {
    id: 'team_sales',
    name: 'Équipe Commerciale Grands Comptes',
    organizationId: 'org_bestexperts',
    departmentId: 'dept_sales',
    managerId: 'usr_david',
    membersCount: 2,
    description: 'En charge du développement grands comptes et closing B2B.',
    createdAt: '2025-01-15T09:00:00Z',
  },
  {
    id: 'team_partnerships',
    name: 'Équipe Partenariats & Salons',
    organizationId: 'org_bestexperts',
    departmentId: 'dept_sales',
    managerId: 'usr_marie',
    membersCount: 1,
    description: 'Salons professionnels, relations partenaires et événements.',
    createdAt: '2025-02-01T09:00:00Z',
  },
  {
    id: 'team_consulting',
    name: 'Consulting Stratégique & Digital',
    organizationId: 'org_bestexperts',
    departmentId: 'dept_consulting',
    managerId: 'usr_marie',
    membersCount: 2,
    description: 'Accompagnement de la transformation numérique et gouvernance d’entreprise.',
    createdAt: '2025-02-01T10:00:00Z',
  },
];

const SEED_USERS: User[] = [
  {
    id: 'usr_superadmin',
    name: 'Super Admin KardX',
    email: 'superadmin@kardx.io',
    password: 'SuperAdmin2026!',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&h=400&q=80',
    role: 'super_admin',
    jobTitle: 'Super Administrateur SaaS Multi-Tenants',
    position: 'Superviseur Infrastructure KardX',
    organizationId: 'org_bestexperts',
    status: 'active',
    phone: '+33 1 00 00 00 00',
    createdAt: '2025-01-01T00:00:00Z',
    lastLogin: '2026-08-23T07:40:00Z',
    twoFactorEnabled: true,
    twoFactorMethod: 'both',
    twoFactorSecret: 'KRX7-94K2-M8L1-XP88',
    twoFactorEmail: 'superadmin@kardx.io',
    twoFactorConfirmedAt: '2025-01-01T08:00:00Z',
    twoFactorBackupCodes: ['4821-9930', '1823-7741', '9041-3312', '6720-4109', '5512-8801', '3349-2104', '8701-4439', '2190-6644'],
    trustedDevices: [
      {
        id: 'dev_01',
        name: 'MacBook Pro 16" - Admin Paris',
        browser: 'Chrome 128 (macOS)',
        os: 'macOS Sonoma',
        ip: '194.254.12.89 (Paris, FR)',
        lastUsed: '2026-08-23T07:40:00Z',
        trustedUntil: '2026-09-22T07:40:00Z',
      },
    ],
  },
  {
    id: 'usr_david',
    name: 'David Sagbo',
    email: 'sagbodavidcomlan@gmail.com',
    password: 'Admin2026!',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&h=400&q=80',
    role: 'admin',
    jobTitle: 'Head of Business Development & Partenariats',
    position: 'Directeur Général & Responsable Commercial',
    departmentId: 'dept_sales',
    teamId: 'team_sales',
    organizationId: 'org_bestexperts',
    status: 'active',
    phone: '+33 6 12 34 56 78',
    createdAt: '2025-01-10T08:00:00Z',
    lastLogin: '2026-08-23T07:30:00Z',
    twoFactorEnabled: true,
    twoFactorMethod: 'both',
    twoFactorSecret: 'DAV8-KP32-90LM-77AX',
    twoFactorEmail: 'sagbodavidcomlan@gmail.com',
    twoFactorConfirmedAt: '2025-01-15T14:30:00Z',
    twoFactorBackupCodes: ['8821-1029', '3419-7801', '5512-9903', '7740-2189', '4021-8890', '1920-5531', '6639-4410', '9045-1234'],
    trustedDevices: [
      {
        id: 'dev_02',
        name: 'MacBook Air M2 - Bureau',
        browser: 'Safari 18.0 (macOS)',
        os: 'macOS Sonoma',
        ip: '82.64.19.45 (Paris La Défense, FR)',
        lastUsed: '2026-08-23T07:30:00Z',
        trustedUntil: '2026-09-20T07:30:00Z',
      },
      {
        id: 'dev_03',
        name: 'iPhone 15 Pro - KardX Mobile',
        browser: 'Mobile Safari (iOS 18)',
        os: 'iOS 18.1',
        ip: '176.134.80.12 (Paris, FR)',
        lastUsed: '2026-08-22T19:10:00Z',
        trustedUntil: '2026-09-18T19:10:00Z',
      },
    ],
  },
  {
    id: 'usr_marie',
    name: 'Marie Koffi',
    email: 'm.koffi@bestexperts-group.com',
    password: 'Manager2026!',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&h=400&q=80',
    role: 'manager',
    jobTitle: 'Lead Account Executive & Client Success',
    position: 'Responsable Département Conseil & Manager',
    departmentId: 'dept_consulting',
    teamId: 'team_consulting',
    organizationId: 'org_bestexperts',
    status: 'active',
    phone: '+33 6 98 76 54 32',
    createdAt: '2025-02-01T09:00:00Z',
    lastLogin: '2026-08-21T16:15:00Z',
    twoFactorEnabled: true,
    twoFactorMethod: 'totp',
    twoFactorSecret: 'MKOF-8821-XP90-KL55',
    twoFactorConfirmedAt: '2025-02-05T10:00:00Z',
    twoFactorBackupCodes: ['3819-0021', '7741-2940', '1904-8832', '6620-1194'],
  },
  {
    id: 'usr_mensah',
    name: 'Jean-Marc Mensah',
    email: 'jm.mensah@bestexperts-group.com',
    password: 'Mensah2026!',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&h=400&q=80',
    role: 'collaborateur',
    jobTitle: 'Senior Consultant B2B & Grands Comptes',
    position: 'Consultant Stratégique Senior',
    departmentId: 'dept_consulting',
    teamId: 'team_consulting',
    organizationId: 'org_bestexperts',
    status: 'active',
    phone: '+33 7 45 12 89 00',
    createdAt: '2025-03-15T11:00:00Z',
    lastLogin: '2026-08-20T14:20:00Z',
    twoFactorEnabled: false,
    twoFactorMethod: 'email',
    twoFactorEmail: 'jm.mensah@bestexperts-group.com',
  },
  {
    id: 'usr_sophie',
    name: 'Sophie Laurent',
    email: 's.laurent@bestexperts-group.com',
    password: 'Sophie2026!',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&h=400&q=80',
    role: 'collaborateur',
    jobTitle: 'Partnerships & Growth Marketing Manager',
    position: 'Chargée de Clientèle & Salons',
    departmentId: 'dept_sales',
    teamId: 'team_partnerships',
    organizationId: 'org_bestexperts',
    status: 'active',
    createdAt: '2025-04-10T10:00:00Z',
    lastLogin: '2026-08-19T11:00:00Z',
    twoFactorEnabled: false,
    twoFactorMethod: 'email',
    twoFactorEmail: 's.laurent@bestexperts-group.com',
  },
  {
    id: 'usr_temp_scaleup',
    name: 'Alexandre Meyer',
    email: 'admin@scaleup-tech.com',
    password: 'TempPassword2026!',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&h=400&q=80',
    role: 'admin',
    jobTitle: 'Directeur Général',
    position: 'Directeur Général ScaleUp',
    organizationId: 'org_scaleup_tech',
    status: 'active',
    mustChangePassword: true,
    createdAt: '2025-03-01T08:00:00Z',
  },
];

const SEED_PROFILES: Profile[] = [
  {
    id: 'prof_david',
    userId: 'usr_david',
    organizationId: 'org_bestexperts',
    slug: 'david-sagbo',
    firstName: 'David',
    lastName: 'Sagbo',
    headline: 'Head of Business Development & Partenariats Stratégiques',
    company: 'BEST EXPERTS-GROUP',
    department: 'Direction Commerciale & Expansion',
    bio: 'J\'accompagne les entreprises innovantes et les directions générales dans leur accélération commerciale, transformation digitale et déploiement de partenariats à fort impact en Europe et en Afrique.',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&h=600&q=80',
    logoUrl: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=200&h=200&q=80',
    badgeVerified: true,
    locale: 'fr',
    status: 'published',
    contacts: {
      phone: '+33 1 89 20 45 60',
      mobile: '+33 6 12 34 56 78',
      whatsapp: '+33612345678',
      email: 'sagbodavidcomlan@gmail.com',
      secondaryEmail: 'david.sagbo@bestexperts-group.com',
      website: 'https://bestexperts-group.com',
      address: {
        street: '12 Place de la Défense',
        city: 'Paris La Défense',
        postalCode: '92400',
        country: 'France',
      },
      bookingUrl: 'https://calendly.com/david-sagbo/discovery',
    },
    socials: [
      { id: 's1', platform: 'linkedin', url: 'https://linkedin.com/in/david-sagbo', label: 'LinkedIn', clicks: 840 },
      { id: 's2', platform: 'twitter', url: 'https://x.com/davidsagbo', label: 'X (Twitter)', clicks: 230 },
      { id: 's3', platform: 'whatsapp', url: 'https://wa.me/33612345678', label: 'WhatsApp Direct', clicks: 512 },
      { id: 's4', platform: 'github', url: 'https://github.com/davidsagbo', label: 'GitHub Projects', clicks: 95 },
    ],
    theme: THEME_PRESETS.official_bestexperts.theme,
    blocks: [
      {
        id: 'blk_about',
        type: 'about',
        title: 'À propos de mes interventions',
        visible: true,
        order: 1,
        payload: {
          text: 'Plus de 10 ans d\'expertise dans le conseil en stratégie de croissance, le déploiement de solutions SaaS B2B et la structuration d\'équipes commerciales performantes.',
        },
      },
      {
        id: 'blk_services',
        type: 'services',
        title: 'Nos Services & Solutions Clés',
        visible: true,
        order: 2,
        payload: {
          services: [
            {
              id: 'srv_1',
              title: 'Audit & Diagnostic Commercial B2B',
              description: 'Analyse 360° du cycle de vente, optimisation des taux de conversion et outillage CRM.',
              price: 'À partir de 2 800 €',
              badge: 'Populaire',
              buttonLabel: 'Demander un devis',
              buttonUrl: 'https://calendly.com/david-sagbo/discovery',
            },
            {
              id: 'srv_2',
              title: 'Structuration de Partenariats Grands Comptes',
              description: 'Définition des programmes partenaires, négociation et gouvernance conjointe.',
              price: 'Sur mesure',
              badge: 'Stratégique',
              buttonLabel: 'Échanger avec David',
            },
            {
              id: 'srv_3',
              title: 'Déploiement Solutions NFC & Digital Networking',
              description: 'Équipement complet de vos forces de vente avec cartes connectées et synchronisation CRM.',
              price: 'Offre Équipe',
              buttonLabel: 'Voir la démo',
            },
          ],
        },
      },
      {
        id: 'blk_booking',
        type: 'booking',
        title: 'Réserver un créneau d\'échange (30 min)',
        visible: true,
        order: 3,
        payload: {
          bookingData: {
            provider: 'calendly',
            url: 'https://calendly.com/david-sagbo/discovery',
            title: 'Session Découverte Stratégique',
            description: '30 minutes en visioconférence pour faire le point sur vos enjeux actuels.',
          },
        },
      },
      {
        id: 'blk_docs',
        type: 'documents',
        title: 'Documentation & Plaquettes',
        visible: true,
        order: 4,
        payload: {
          documents: [
            {
              id: 'doc_1',
              title: 'Plaquette Institutionnelle BEST EXPERTS 2026',
              description: 'Présentation complète de notre offre et études de cas clients.',
              fileUrl: '#download-plaquette-2026',
              fileType: 'pdf',
              fileSize: '4.2 Mo',
              downloadCount: 342,
            },
            {
              id: 'doc_2',
              title: 'Guide : Moderniser ses cartes de visite avec NFC & QR',
              description: 'Livre blanc exclusif sur le ROI du networking digital.',
              fileUrl: '#download-whitepaper-nfc',
              fileType: 'catalog',
              fileSize: '2.8 Mo',
              downloadCount: 189,
            },
          ],
        },
      },
      {
        id: 'blk_testimonials',
        type: 'testimonials',
        title: 'Recommandations & Témoignages',
        visible: true,
        order: 5,
        payload: {
          testimonials: [
            {
              id: 'tst_1',
              authorName: 'Alexandre Roche',
              authorRole: 'Directeur Général',
              company: 'Fintech Alliance',
              quote: 'David a complètement transformé notre approche partenariats. Son professionnalisme et sa réactivité sont remarquables.',
              rating: 5,
            },
            {
              id: 'tst_2',
              authorName: 'Fatou Diallo',
              authorRole: 'VP Sales EMEA',
              company: 'CloudNova Systems',
              quote: 'Une collaboration exemplaire. La mise en place de nos cartes connectées a doublé nos leads sur les salons professionnels.',
              rating: 5,
            },
          ],
        },
      },
      {
        id: 'blk_map',
        type: 'map',
        title: 'Nos Bureaux',
        visible: true,
        order: 6,
        payload: {
          mapData: {
            address: '12 Place de la Défense, Immeuble Horizon',
            city: 'Paris La Défense',
            country: 'France',
          },
        },
      },
    ],
    viewsCount: 4892,
    scansCount: 1840,
    leadsCount: 376,
    exchangeCtaLabel: 'Échanger nos coordonnées',
    enableVcardDownload: true,
    enableFloatingCta: true,
    publishedAt: '2025-01-12T10:00:00Z',
    updatedAt: '2026-08-22T08:30:00Z',
    seoTitle: 'David Sagbo | Head of Business Development | BEST EXPERTS-GROUP',
    seoDescription: 'Carte de visite digitale connectée NFC & QR de David Sagbo. Enregistrez mes coordonnées et échangeons facilement.',
  },
  {
    id: 'prof_marie',
    userId: 'usr_marie',
    organizationId: 'org_bestexperts',
    slug: 'marie-koffi',
    firstName: 'Marie',
    lastName: 'Koffi',
    headline: 'Lead Account Executive & Client Success',
    company: 'BEST EXPERTS-GROUP',
    department: 'Sales & Customer Growth',
    bio: 'Spécialiste de la satisfaction client et de la fidélisation des comptes stratégiques.',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&h=600&q=80',
    badgeVerified: true,
    locale: 'fr',
    status: 'published',
    contacts: {
      phone: '+33 1 89 20 45 61',
      mobile: '+33 6 98 76 54 32',
      whatsapp: '+33698765432',
      email: 'm.koffi@bestexperts-group.com',
      website: 'https://bestexperts-group.com',
    },
    socials: [
      { id: 'sm1', platform: 'linkedin', url: 'https://linkedin.com/in/marie-koffi', label: 'LinkedIn', clicks: 310 },
      { id: 'sm2', platform: 'whatsapp', url: 'https://wa.me/33698765432', label: 'WhatsApp', clicks: 190 },
    ],
    theme: THEME_PRESETS.emerald_wealth.theme,
    blocks: [
      {
        id: 'blk_m_about',
        type: 'about',
        title: 'Mon rôle',
        visible: true,
        order: 1,
        payload: {
          text: 'Je vous accompagne dès le démarrage de votre projet pour garantir une adoption rapide et un ROI mesurable.',
        },
      },
    ],
    viewsCount: 1420,
    scansCount: 620,
    leadsCount: 94,
    exchangeCtaLabel: 'Échanger mes coordonnées',
    enableVcardDownload: true,
    enableFloatingCta: true,
    publishedAt: '2025-02-05T10:00:00Z',
    updatedAt: '2026-08-20T11:00:00Z',
  },
  {
    id: 'prof_mensah',
    userId: 'usr_mensah',
    organizationId: 'org_bestexperts',
    slug: 'jm-mensah',
    firstName: 'Jean-Marc',
    lastName: 'Mensah',
    headline: 'Senior Consultant B2B & Grands Comptes',
    company: 'BEST EXPERTS-GROUP',
    department: 'Consulting Stratégique & Digital',
    bio: 'Conseil en transformation digitale et pilotage de projets technologiques d’envergure.',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&h=600&q=80',
    badgeVerified: true,
    locale: 'fr',
    status: 'published',
    contacts: {
      phone: '+33 1 89 20 45 62',
      mobile: '+33 7 45 12 89 00',
      whatsapp: '+33745128900',
      email: 'jm.mensah@bestexperts-group.com',
      website: 'https://bestexperts-group.com',
    },
    socials: [
      { id: 'sj1', platform: 'linkedin', url: 'https://linkedin.com/in/jm-mensah', label: 'LinkedIn', clicks: 490 },
      { id: 'sj2', platform: 'twitter', url: 'https://x.com/jmmensah', label: 'Twitter / X', clicks: 145 },
    ],
    theme: THEME_PRESETS.tech_future.theme,
    blocks: [
      {
        id: 'blk_jm_about',
        type: 'about',
        title: 'Domaines d’intervention',
        visible: true,
        order: 1,
        payload: {
          text: 'Accompagnement de directions générales et DSI dans la digitalisation des processus d’affaires.',
        },
      },
    ],
    viewsCount: 2840,
    scansCount: 1120,
    leadsCount: 215,
    exchangeCtaLabel: 'Prendre contact',
    enableVcardDownload: true,
    enableFloatingCta: true,
    publishedAt: '2025-03-15T10:00:00Z',
    updatedAt: '2026-08-21T09:00:00Z',
  },
  {
    id: 'prof_sophie',
    userId: 'usr_sophie',
    organizationId: 'org_bestexperts',
    slug: 'sophie-laurent',
    firstName: 'Sophie',
    lastName: 'Laurent',
    headline: 'Partnerships & Growth Marketing Manager',
    company: 'BEST EXPERTS-GROUP',
    department: 'Consulting Stratégique & Digital',
    bio: 'Développement des écosystèmes partenaires et animation des communautés B2B.',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&h=600&q=80',
    badgeVerified: true,
    locale: 'fr',
    status: 'published',
    contacts: {
      phone: '+33 1 89 20 45 63',
      mobile: '+33 6 33 55 77 99',
      whatsapp: '+33633557799',
      email: 's.laurent@bestexperts-group.com',
      website: 'https://bestexperts-group.com',
    },
    socials: [
      { id: 'ss1', platform: 'linkedin', url: 'https://linkedin.com/in/sophie-laurent', label: 'LinkedIn', clicks: 420 },
      { id: 'ss2', platform: 'instagram', url: 'https://instagram.com/sophie.growth', label: 'Instagram', clicks: 280 },
    ],
    theme: THEME_PRESETS.minimal_slate.theme,
    blocks: [
      {
        id: 'blk_sl_about',
        type: 'about',
        title: 'Ma mission',
        visible: true,
        order: 1,
        payload: {
          text: 'Fédérer nos partenaires technologiques et créer des synergies de croissance durable.',
        },
      },
    ],
    viewsCount: 1960,
    scansCount: 840,
    leadsCount: 168,
    exchangeCtaLabel: 'Échanger nos cartes',
    enableVcardDownload: true,
    enableFloatingCta: true,
    publishedAt: '2025-04-10T10:00:00Z',
    updatedAt: '2026-08-19T16:00:00Z',
  },
];

const SEED_CARDS: PhysicalCard[] = [
  {
    id: 'crd_01',
    uid: '04:A2:3F:89:C1',
    token: 'krd_david_metal01',
    material: 'metal_black',
    name: 'Carte Métal Noire Matte — David',
    profileId: 'prof_david',
    organizationId: 'org_bestexperts',
    status: 'active',
    scansCount: 1840,
    lastScannedAt: '2026-08-22T08:14:00Z',
    createdAt: '2025-01-15T09:00:00Z',
    assignedToUser: 'usr_david',
    notes: 'Carte principale pour salons et rendez-vous physiques.',
  },
  {
    id: 'crd_02',
    uid: '04:C5:12:9A:88',
    token: 'krd_david_pvc02',
    material: 'pvc_matte',
    name: 'Carte PVC Soft-Touch de secours — David',
    profileId: 'prof_david',
    organizationId: 'org_bestexperts',
    status: 'active',
    scansCount: 412,
    lastScannedAt: '2026-08-19T14:30:00Z',
    createdAt: '2025-01-20T14:00:00Z',
    assignedToUser: 'usr_david',
  },
  {
    id: 'crd_03',
    uid: '04:EE:81:4B:02',
    token: 'krd_marie_wood01',
    material: 'wood_bamboo',
    name: 'Carte Éco Bambou Gravée — Marie',
    profileId: 'prof_marie',
    organizationId: 'org_bestexperts',
    status: 'active',
    scansCount: 620,
    lastScannedAt: '2026-08-21T18:05:00Z',
    createdAt: '2025-02-10T11:00:00Z',
    assignedToUser: 'usr_marie',
  },
  {
    id: 'crd_04',
    uid: '04:FA:22:11:39',
    token: 'krd_office_stand',
    material: 'qr_stand',
    name: 'Chevalet d’accueil Stand & Salon QR',
    profileId: 'prof_david',
    organizationId: 'org_bestexperts',
    status: 'active',
    scansCount: 1210,
    lastScannedAt: '2026-08-22T09:10:00Z',
    createdAt: '2025-03-01T10:00:00Z',
    notes: 'Positionné sur le comptoir d’accueil du salon Paris Tech Expo.',
  },
  {
    id: 'crd_05',
    uid: '04:B8:99:32:1A',
    token: 'krd_mensah_silver',
    material: 'metal_silver',
    name: 'Carte Métal Argent Brossé — Jean-Marc',
    profileId: 'prof_mensah',
    organizationId: 'org_bestexperts',
    status: 'active',
    scansCount: 1120,
    lastScannedAt: '2026-08-21T15:40:00Z',
    createdAt: '2025-03-20T10:00:00Z',
    assignedToUser: 'usr_mensah',
  },
  {
    id: 'crd_06',
    uid: '04:D3:44:88:7C',
    token: 'krd_sophie_black',
    material: 'metal_black',
    name: 'Carte Métal Noir Mat — Sophie',
    profileId: 'prof_sophie',
    organizationId: 'org_bestexperts',
    status: 'active',
    scansCount: 840,
    lastScannedAt: '2026-08-20T17:15:00Z',
    createdAt: '2025-04-15T11:00:00Z',
    assignedToUser: 'usr_sophie',
  },
];

const SEED_LEADS: Lead[] = [
  {
    id: 'lead_01',
    profileId: 'prof_david',
    organizationId: 'org_bestexperts',
    assignedUserId: 'usr_david',
    firstName: 'Amadou',
    lastName: 'Mensah',
    email: 'a.mensah@acme-ventures.com',
    phone: '+33 6 44 22 11 00',
    company: 'ACME Ventures Capital',
    jobTitle: 'Investment Director',
    meetingContext: 'Rencontre lors du Forum Économique International',
    notes: 'Très intéressé par notre accompagnement stratégique sur le marché ouest-africain. Rappeler mardi à 14h.',
    source: 'nfc',
    status: 'new',
    tags: ['Investissement', 'Prioritaire', 'Grand Compte'],
    consentGiven: true,
    consentTimestamp: '2026-08-22T08:14:00Z',
    device: 'iPhone 16 Pro (iOS 19)',
    city: 'Paris',
    country: 'France',
    createdAt: '2026-08-22T08:14:00Z',
    updatedAt: '2026-08-22T08:14:00Z',
    isFavorite: true,
    reminderDate: new Date(Date.now() + 3600000 * 2).toISOString(), // in 2 hours
    reminderNote: 'Point téléphonique sur l’accompagnement stratégique Afrique',
    reminderStatus: 'pending',
    tasks: [
      {
        id: 'task_seed_01',
        leadId: 'lead_01',
        type: 'call',
        title: 'Point téléphonique de cadrage Afrique',
        dueDate: new Date(Date.now() + 3600000 * 2).toISOString(),
        priority: 'high',
        note: 'Rappeler pour valider les besoins de digitalisation réseau ouest-africain.',
        status: 'pending',
        assignedUserId: 'usr_david',
        createdAt: '2026-08-22T08:14:00Z',
      },
      {
        id: 'task_seed_02',
        leadId: 'lead_01',
        type: 'quote',
        title: 'Envoi proposition commerciale et accord NDA',
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        priority: 'medium',
        note: 'Préparer la proposition d’accompagnement et le dossier tarifaire.',
        status: 'pending',
        assignedUserId: 'usr_david',
        createdAt: '2026-08-22T09:30:00Z',
      },
    ],
    interactions: [
      {
        id: 'int_01',
        leadId: 'lead_01',
        type: 'event',
        title: 'Rencontre & Échange NFC',
        notes: 'Discussion au stand VIP du Forum Économique. Très bon contact avec le responsable Afrique.',
        date: '2026-08-22T08:14:00Z',
        authorName: 'David Sagbo',
        createdAt: '2026-08-22T08:14:00Z',
      },
      {
        id: 'int_02',
        leadId: 'lead_01',
        type: 'email',
        title: 'Envoi documentation et plaquette institutionnelle',
        notes: 'Plaquette PDF et synthèse des services envoyées par email avec lien vers calendrier.',
        date: '2026-08-22T09:30:00Z',
        authorName: 'David Sagbo',
        createdAt: '2026-08-22T09:30:00Z',
      },
    ],
  },
  {
    id: 'lead_02',
    profileId: 'prof_david',
    organizationId: 'org_bestexperts',
    assignedUserId: 'usr_david',
    firstName: 'Claire',
    lastName: 'Delorme',
    email: 'cdelorme@groupe-beta.fr',
    phone: '+33 7 88 99 66 33',
    company: 'Groupe Beta Retail',
    jobTitle: 'Directrice de l\'Innovation',
    meetingContext: 'Scan QR sur salon Paris Tech Expo',
    notes: 'Souhaite équiper les 85 commerciaux de sa division avec des cartes NFC KardX personnalisées.',
    source: 'qr',
    status: 'qualified',
    tags: ['Projet NFC', '85 Licences', 'Devis Demandé'],
    consentGiven: true,
    consentTimestamp: '2026-08-21T15:20:00Z',
    device: 'Samsung Galaxy S25 (Android 16)',
    city: 'Lyon',
    country: 'France',
    createdAt: '2026-08-21T15:20:00Z',
    updatedAt: '2026-08-21T16:00:00Z',
    isFavorite: true,
    reminderDate: new Date(Date.now() + 3600000 * 5).toISOString(), // in 5 hours
    reminderNote: 'Envoyer le devis personnalisé pour les 85 cartes NFC',
    reminderStatus: 'pending',
    tasks: [
      {
        id: 'task_seed_03',
        leadId: 'lead_02',
        type: 'quote',
        title: 'Envoyer le devis personnalisé pour les 85 cartes NFC',
        dueDate: new Date(Date.now() + 3600000 * 5).toISOString(),
        priority: 'high',
        note: 'Validation du devis avec remise volume et personnalisation logo laser.',
        status: 'pending',
        assignedUserId: 'usr_david',
        createdAt: '2026-08-21T15:20:00Z',
      },
      {
        id: 'task_seed_04',
        leadId: 'lead_02',
        type: 'email',
        title: 'Transmission des spécifications techniques de gravure laser',
        dueDate: '2026-08-21T16:00:00Z',
        priority: 'medium',
        status: 'completed',
        completedAt: '2026-08-21T16:45:00Z',
        assignedUserId: 'usr_david',
        createdAt: '2026-08-21T15:20:00Z',
      },
    ],
    interactions: [
      {
        id: 'int_03',
        leadId: 'lead_02',
        type: 'event',
        title: 'Scan QR Code sur stand',
        notes: 'Démonstration de la carte en direct. Intérêt marqué pour la gestion centralisée d\'équipe.',
        date: '2026-08-21T15:20:00Z',
        authorName: 'David Sagbo',
        createdAt: '2026-08-21T15:20:00Z',
      },
      {
        id: 'int_04',
        leadId: 'lead_02',
        type: 'call',
        title: 'Appel de cadrage des besoins (25 min)',
        notes: 'Validation du besoin : 85 cartes métal noir mat, intégration HubSpot et SSO Google Workspace.',
        date: '2026-08-21T17:45:00Z',
        authorName: 'David Sagbo',
        createdAt: '2026-08-21T17:45:00Z',
      },
    ],
  },
  {
    id: 'lead_03',
    profileId: 'prof_david',
    organizationId: 'org_bestexperts',
    assignedUserId: 'usr_marie',
    firstName: 'Thomas',
    lastName: 'Guerin',
    email: 'thomas.guerin@orangedigital.com',
    phone: '+33 6 11 33 55 77',
    company: 'Orange Digital Services',
    jobTitle: 'Head of B2B Alliances',
    meetingContext: 'Signature email & lien LinkedIn',
    notes: 'Premier échange de cadrage effectué, proposition commerciale transmise.',
    source: 'email_signature',
    status: 'proposal',
    tags: ['Partenariat', 'Télécom'],
    consentGiven: true,
    consentTimestamp: '2026-08-19T10:45:00Z',
    device: 'MacBook Pro / Chrome',
    city: 'Bordeaux',
    country: 'France',
    createdAt: '2026-08-19T10:45:00Z',
    updatedAt: '2026-08-20T09:30:00Z',
    reminderDate: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours overdue
    reminderNote: 'Point téléphonique sur la proposition d\'alliances télécom',
    reminderStatus: 'pending',
    tasks: [
      {
        id: 'task_seed_05',
        leadId: 'lead_03',
        type: 'call',
        title: 'Point téléphonique sur la proposition d\'alliances télécom',
        dueDate: new Date(Date.now() - 3600000 * 2).toISOString(),
        priority: 'high',
        note: 'Relancer suite à l\'envoi du contrat cadre et valider la signature.',
        status: 'pending',
        assignedUserId: 'usr_marie',
        createdAt: '2026-08-19T10:45:00Z',
      },
      {
        id: 'task_seed_06',
        leadId: 'lead_03',
        type: 'meeting',
        title: 'Visioconférence de cadrage technique',
        dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
        priority: 'medium',
        note: 'Point technique avec le lead dev pour l\'interconnexion API.',
        status: 'pending',
        assignedUserId: 'usr_marie',
        createdAt: '2026-08-20T09:30:00Z',
      },
    ],
    interactions: [
      {
        id: 'int_05',
        leadId: 'lead_03',
        type: 'meeting',
        title: 'Visioconférence de présentation commerciale',
        notes: 'Revue des cas d\'usage et démonstration du tableau de bord d\'administration.',
        date: '2026-08-20T09:00:00Z',
        authorName: 'Marie Koffi',
        createdAt: '2026-08-20T09:30:00Z',
      },
    ],
  },
  {
    id: 'lead_04',
    profileId: 'prof_marie',
    organizationId: 'org_bestexperts',
    assignedUserId: 'usr_marie',
    firstName: 'Sarah',
    lastName: 'Benali',
    email: 's.benali@totalenergies-partner.com',
    phone: '+33 6 90 80 70 60',
    company: 'TotalEnergies Transition',
    jobTitle: 'Responsable Achats Prestations',
    meetingContext: 'Carte NFC échangée au salon Énergie Pro',
    notes: 'Contrat validé pour 6 mois de mission d\'audit.',
    source: 'nfc',
    status: 'won',
    tags: ['Signé', 'Énergie'],
    consentGiven: true,
    consentTimestamp: '2026-08-15T14:10:00Z',
    device: 'iPhone 15',
    city: 'Bruxelles',
    country: 'Belgique',
    createdAt: '2026-08-15T14:10:00Z',
    updatedAt: '2026-08-18T17:00:00Z',
  },
  {
    id: 'lead_05',
    profileId: 'prof_david',
    organizationId: 'org_bestexperts',
    assignedUserId: 'usr_david',
    firstName: 'Koffi',
    lastName: 'Adjovi',
    email: 'koffi.adjovi@ecobank-group.com',
    phone: '+228 90 12 34 56',
    company: 'Ecobank Corporate',
    jobTitle: 'Senior Vice President Operations',
    meetingContext: 'Rencontre à Cotonou / Sommet Fintech',
    notes: 'Revoir lors du prochain déplacement en Afrique de l\'Ouest fin septembre.',
    source: 'nfc',
    status: 'contacted',
    tags: ['Banque', 'Afrique', 'VIP'],
    consentGiven: true,
    consentTimestamp: '2026-08-12T11:00:00Z',
    city: 'Lomé',
    country: 'Togo',
    createdAt: '2026-08-12T11:00:00Z',
    updatedAt: '2026-08-14T08:00:00Z',
  },
  {
    id: 'lead_06',
    profileId: 'prof_david',
    organizationId: 'org_bestexperts',
    assignedUserId: 'usr_david',
    firstName: 'Amadou',
    lastName: 'Diallo',
    email: 'a.diallo@sonatel-orange.sn',
    phone: '+221 77 654 32 10',
    company: 'Sonatel Orange Sénégal',
    jobTitle: 'Directeur de la Transformation Digitale',
    meetingContext: 'Salon Tech Dakar & Forum Francophonie',
    notes: 'Projet pilote d\'équipement pour 120 collaborateurs au siège de Dakar.',
    source: 'nfc',
    status: 'proposal',
    tags: ['Sénégal', 'Télécom', '120 Cartes'],
    consentGiven: true,
    consentTimestamp: '2026-08-10T16:30:00Z',
    city: 'Dakar',
    country: 'Sénégal',
    createdAt: '2026-08-10T16:30:00Z',
    updatedAt: '2026-08-11T10:00:00Z',
    reminderDate: new Date(Date.now() + 86400000 * 3).toISOString(), // in 3 days
    reminderNote: 'Transmettre le devis finalisé pour les 120 cartes à Dakar',
    reminderStatus: 'pending',
    interactions: [
      {
        id: 'int_06',
        leadId: 'lead_06',
        type: 'meeting',
        title: 'Présentation de la solution à Dakar',
        notes: 'Rencontre fructueuse. Devis transmis.',
        date: '2026-08-11T09:00:00Z',
        authorName: 'David Sagbo',
        createdAt: '2026-08-11T10:00:00Z',
      }
    ]
  },
  {
    id: 'lead_07',
    profileId: 'prof_marie',
    organizationId: 'org_bestexperts',
    assignedUserId: 'usr_marie',
    firstName: 'Nathalie',
    lastName: 'Vandamme',
    email: 'n.vandamme@solvay-group.com',
    phone: '+32 470 12 34 56',
    company: 'Solvay Chemicals & Tech',
    jobTitle: 'Global Communications Director',
    meetingContext: 'Networking Cocktail Bruxelles',
    notes: 'Rencontrée lors de la soirée VIP Solvay. Très intéressée par la personnalisation graphique.',
    source: 'qr',
    status: 'qualified',
    tags: ['Belgique', 'Chimie', 'International'],
    consentGiven: true,
    consentTimestamp: '2026-08-08T19:00:00Z',
    city: 'Bruxelles',
    country: 'Belgique',
    createdAt: '2026-08-08T19:00:00Z',
    updatedAt: '2026-08-09T08:00:00Z',
    reminderDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday (Overdue)
    reminderNote: 'Relance suite au cocktail VIP Solvay Bruxelles',
    reminderStatus: 'pending',
  },
  {
    id: 'lead_08',
    profileId: 'prof_david',
    organizationId: 'org_bestexperts',
    assignedUserId: 'usr_david',
    firstName: 'Jean-Marc',
    lastName: 'Favre',
    email: 'jm.favre@pictet-wealth.ch',
    phone: '+41 22 705 11 22',
    company: 'Banque Pictet & Cie',
    jobTitle: 'Managing Director Private Banking',
    meetingContext: 'Salon Finance Durable Genève',
    notes: 'Cartes métalliques or brossé pour les banquiers privés.',
    source: 'nfc',
    status: 'won',
    tags: ['Suisse', 'Banque Privée', 'Luxe'],
    consentGiven: true,
    consentTimestamp: '2026-08-05T14:20:00Z',
    city: 'Genève',
    country: 'Suisse',
    createdAt: '2026-08-05T14:20:00Z',
    updatedAt: '2026-08-06T11:00:00Z',
    reminderDate: new Date(Date.now() - 86400000 * 2).toISOString(),
    reminderNote: 'Point satisfaction livraison des cartes or brossé',
    reminderStatus: 'completed',
  },
  {
    id: 'lead_09',
    profileId: 'prof_david',
    organizationId: 'org_bestexperts',
    assignedUserId: 'usr_david',
    firstName: 'Yasmine',
    lastName: 'Berrada',
    email: 'yberrada@attijari-group.ma',
    phone: '+212 522 29 88 00',
    company: 'Attijariwafa Bank',
    jobTitle: 'Directrice RSE & Innovation',
    meetingContext: 'Signature email & recommandation',
    notes: 'Objectif zéro papier pour le réseau d\'agences corporate.',
    source: 'email_signature',
    status: 'qualified',
    tags: ['Maroc', 'RSE', 'Transition'],
    consentGiven: true,
    consentTimestamp: '2026-08-02T10:15:00Z',
    city: 'Casablanca',
    country: 'Maroc',
    createdAt: '2026-08-02T10:15:00Z',
    updatedAt: '2026-08-03T15:00:00Z',
    reminderDate: new Date(Date.now() + 86400000 * 4).toISOString(), // in 4 days
    reminderNote: 'Planification atelier démonstration zéro papier',
    reminderStatus: 'pending',
  },
  {
    id: 'lead_10',
    profileId: 'prof_marie',
    organizationId: 'org_bestexperts',
    assignedUserId: 'usr_marie',
    firstName: 'Marc-André',
    lastName: 'Gagnon',
    email: 'ma.gagnon@desjardins-capital.ca',
    phone: '+1 514 281 7000',
    company: 'Desjardins Capital Montréal',
    jobTitle: 'Vice-Président Investissement Québec',
    meetingContext: 'Webinaire KardX Enterprise',
    notes: 'Étude d\'équipement pour la délégation nord-américaine.',
    source: 'direct_url',
    status: 'new',
    tags: ['Canada', 'Investissement'],
    consentGiven: true,
    consentTimestamp: '2026-08-01T15:45:00Z',
    city: 'Montréal',
    country: 'Canada',
    createdAt: '2026-08-01T15:45:00Z',
    updatedAt: '2026-08-01T15:45:00Z',
  },
  {
    id: 'lead_11',
    profileId: 'prof_david',
    organizationId: 'org_bestexperts',
    assignedUserId: 'usr_david',
    firstName: 'Christelle',
    lastName: 'Gomez',
    email: 'c.gomez@marseille-port.fr',
    phone: '+33 4 91 39 40 00',
    company: 'Grand Port Maritime de Marseille',
    jobTitle: 'Responsable Relations Publiques',
    meetingContext: 'Salon Euromaritime Marseille',
    notes: 'Commande de 30 cartes NFC personnalisées avec logo gravé laser.',
    source: 'nfc',
    status: 'won',
    tags: ['Marseille', 'Maritime'],
    consentGiven: true,
    consentTimestamp: '2026-07-28T11:00:00Z',
    city: 'Marseille',
    country: 'France',
    createdAt: '2026-07-28T11:00:00Z',
    updatedAt: '2026-07-29T16:00:00Z',
  },
  {
    id: 'lead_12',
    profileId: 'prof_david',
    organizationId: 'org_bestexperts',
    assignedUserId: 'usr_david',
    firstName: 'Honoré',
    lastName: 'Zannou',
    email: 'h.zannou@portcotonou.bj',
    phone: '+229 21 31 28 88',
    company: 'Port Autonome de Cotonou',
    jobTitle: 'Directeur Commercial & Coopération',
    meetingContext: 'Rencontre au siège de Cotonou',
    notes: 'Intégration fluide avec le système de gestion des délégations.',
    source: 'nfc',
    status: 'contacted',
    tags: ['Bénin', 'Logistique', 'Partenariat'],
    consentGiven: true,
    consentTimestamp: '2026-07-25T09:30:00Z',
    city: 'Cotonou',
    country: 'Bénin',
    createdAt: '2026-07-25T09:30:00Z',
    updatedAt: '2026-07-26T14:00:00Z',
  },
  {
    id: 'lead_13',
    profileId: 'prof_marie',
    organizationId: 'org_bestexperts',
    assignedUserId: 'usr_marie',
    firstName: 'Éléonore',
    lastName: 'Castel',
    email: 'eleonore.castel@vinci-airports.fr',
    phone: '+33 5 56 34 50 00',
    company: 'VINCI Airports Bordeaux',
    jobTitle: 'Chef de Projet Événementiel',
    meetingContext: 'Scan QR Code sur stand salon Vinitech',
    notes: 'Contact qualifié pour équiper l\'équipe d\'accueil du terminal d\'affaires.',
    source: 'qr',
    status: 'proposal',
    tags: ['Bordeaux', 'Aéronautique'],
    consentGiven: true,
    consentTimestamp: '2026-07-20T14:00:00Z',
    city: 'Bordeaux',
    country: 'France',
    createdAt: '2026-07-20T14:00:00Z',
    updatedAt: '2026-07-22T10:00:00Z',
  },
  {
    id: 'lead_14',
    profileId: 'prof_david',
    organizationId: 'org_bestexperts',
    assignedUserId: 'usr_david',
    firstName: 'Bakary',
    lastName: 'Coulibaly',
    email: 'b.coulibaly@sifca-group.ci',
    phone: '+225 27 21 75 00 00',
    company: 'Groupe SIFCA Agro-Industrie',
    jobTitle: 'Directeur des Systèmes d\'Information',
    meetingContext: 'Salon SARA Abidjan',
    notes: 'Déploiement cartes NFC sécurisées pour la direction générale à Abidjan.',
    source: 'nfc',
    status: 'won',
    tags: ['Côte d\'Ivoire', 'Agro-industrie', 'Grand Compte'],
    consentGiven: true,
    consentTimestamp: '2026-07-18T10:00:00Z',
    city: 'Abidjan',
    country: 'Côte d\'Ivoire',
    createdAt: '2026-07-18T10:00:00Z',
    updatedAt: '2026-07-20T16:00:00Z',
  },
  {
    id: 'lead_15',
    profileId: 'prof_david',
    organizationId: 'org_bestexperts',
    assignedUserId: 'usr_david',
    firstName: 'Alexandre',
    lastName: 'Dumont',
    email: 'a.dumont@euratechnologies.com',
    phone: '+33 3 20 19 20 00',
    company: 'EuraTechnologies Lille',
    jobTitle: 'Directeur Incubation & Startups',
    meetingContext: 'Rencontre tech & cocktail networking',
    notes: 'Proposition de partenariat pour équiper les startups incubées.',
    source: 'nfc',
    status: 'qualified',
    tags: ['Lille', 'Tech', 'Incubateur'],
    consentGiven: true,
    consentTimestamp: '2026-07-15T16:20:00Z',
    city: 'Lille',
    country: 'France',
    createdAt: '2026-07-15T16:20:00Z',
    updatedAt: '2026-07-16T11:00:00Z',
  },
  {
    id: 'lead_16',
    profileId: 'prof_mensah',
    organizationId: 'org_bestexperts',
    assignedUserId: 'usr_mensah',
    firstName: 'Thierry',
    lastName: 'Gomez',
    email: 't.gomez@capgemini-digital.com',
    phone: '+33 6 88 12 34 56',
    company: 'Capgemini Invent',
    jobTitle: 'Partner Digital Strategy',
    meetingContext: 'Salon Big Data & AI Paris',
    notes: 'Mission conjointe d\'audit de transformation numérique pour un grand compte bancaire.',
    source: 'nfc',
    status: 'won',
    tags: ['Conseil', 'IA', 'Partenaire'],
    consentGiven: true,
    consentTimestamp: '2026-08-16T11:00:00Z',
    city: 'Paris',
    country: 'France',
    createdAt: '2026-08-16T11:00:00Z',
    updatedAt: '2026-08-18T15:00:00Z',
    interactions: [
      {
        id: 'int_jm1',
        leadId: 'lead_16',
        type: 'meeting',
        title: 'Comité de pilotage conjoint',
        notes: 'Validation des termes de l\'accord cadre.',
        date: '2026-08-18T14:00:00Z',
        authorName: 'Jean-Marc Mensah',
        createdAt: '2026-08-18T15:00:00Z',
      },
    ],
  },
  {
    id: 'lead_17',
    profileId: 'prof_mensah',
    organizationId: 'org_bestexperts',
    assignedUserId: 'usr_mensah',
    firstName: 'Nadia',
    lastName: 'Khelifi',
    email: 'n.khelifi@alstom-mobility.com',
    phone: '+33 1 57 06 90 00',
    company: 'Alstom Transport & Systems',
    jobTitle: 'Head of Global IT Procurement',
    meetingContext: 'Scan QR Stand Mobilité Future',
    notes: 'Équipement pour la direction des achats et chefs de projets.',
    source: 'qr',
    status: 'proposal',
    tags: ['Industrie', 'Grand Compte', 'Projet'],
    consentGiven: true,
    consentTimestamp: '2026-08-14T14:30:00Z',
    city: 'Saint-Ouen',
    country: 'France',
    createdAt: '2026-08-14T14:30:00Z',
    updatedAt: '2026-08-16T10:00:00Z',
    reminderDate: new Date(Date.now() + 86400000 * 2).toISOString(),
    reminderNote: 'Transmettre proposition finale à Nadia',
    reminderStatus: 'pending',
  },
  {
    id: 'lead_18',
    profileId: 'prof_sophie',
    organizationId: 'org_bestexperts',
    assignedUserId: 'usr_sophie',
    firstName: 'Guillaume',
    lastName: 'Perrin',
    email: 'g.perrin@stationf.co',
    phone: '+33 1 86 95 00 00',
    company: 'Station F Ecosystem',
    jobTitle: 'Program Director Startups',
    meetingContext: 'Signature email & partage LinkedIn',
    notes: 'Mise en place d\'un tarif privilégié pour la promo de rentrée.',
    source: 'email_signature',
    status: 'qualified',
    tags: ['Startup', 'Incubateur', 'Partenariat'],
    consentGiven: true,
    consentTimestamp: '2026-08-17T09:15:00Z',
    city: 'Paris',
    country: 'France',
    createdAt: '2026-08-17T09:15:00Z',
    updatedAt: '2026-08-18T11:00:00Z',
    reminderDate: new Date(Date.now() + 86400000).toISOString(),
    reminderNote: 'Confirmer la date du workshop Station F',
    reminderStatus: 'pending',
  },
  {
    id: 'lead_19',
    profileId: 'prof_sophie',
    organizationId: 'org_bestexperts',
    assignedUserId: 'usr_sophie',
    firstName: 'Audrey',
    lastName: 'Vidal',
    email: 'audrey.vidal@doctolib.fr',
    phone: '+33 1 83 35 50 00',
    company: 'Doctolib France',
    jobTitle: 'Head of Brand Events',
    meetingContext: 'Rencontre NFC salon VivaTech',
    notes: 'Discussion sur l\'équipement de 45 délégués régionaux.',
    source: 'nfc',
    status: 'won',
    tags: ['Santé', 'VivaTech', 'Signé'],
    consentGiven: true,
    consentTimestamp: '2026-08-10T16:00:00Z',
    city: 'Nantes',
    country: 'France',
    createdAt: '2026-08-10T16:00:00Z',
    updatedAt: '2026-08-12T14:00:00Z',
    interactions: [
      {
        id: 'int_sl1',
        leadId: 'lead_19',
        type: 'call',
        title: 'Validation commande 45 cartes',
        notes: 'Bon de commande signé et reçu.',
        date: '2026-08-12T13:30:00Z',
        authorName: 'Sophie Laurent',
        createdAt: '2026-08-12T14:00:00Z',
      },
    ],
  },
];

const SEED_FORMS: LeadForm[] = [
  {
    id: 'form_standard',
    organizationId: 'org_bestexperts',
    name: 'Formulaire d’échange standard',
    title: 'Restons en contact professionnel',
    description: 'Partagez vos coordonnées pour recevoir immédiatement ma fiche contact VCF et poursuivre nos échanges.',
    submitButtonText: 'Envoyer mes coordonnées',
    successMessage: 'Coordonnées transmises avec succès ! Vous pouvez maintenant enregistrer mon contact.',
    consentText: 'J\'accepte que mes coordonnées soient enregistrées par BEST EXPERTS-GROUP conformément à la politique de confidentialité.',
    active: true,
    usedInProfilesCount: 2,
    submissionsCount: 376,
    createdAt: '2025-01-15T09:00:00Z',
    fields: [
      { id: 'f1', name: 'firstName', label: 'Prénom', type: 'text', required: true, placeholder: 'Jean' },
      { id: 'f2', name: 'lastName', label: 'Nom', type: 'text', required: true, placeholder: 'Dupont' },
      { id: 'f3', name: 'email', label: 'Email professionnel', type: 'email', required: true, placeholder: 'jean.dupont@entreprise.com' },
      { id: 'f4', name: 'phone', label: 'Numéro de téléphone', type: 'phone', required: false, placeholder: '+33 6 00 00 00 00' },
      { id: 'f5', name: 'company', label: 'Entreprise / Organisation', type: 'text', required: false, placeholder: 'Acme Corp' },
      { id: 'f6', name: 'jobTitle', label: 'Fonction / Titre', type: 'text', required: false, placeholder: 'Directeur Général' },
      { id: 'f7', name: 'notes', label: 'Message ou sujet de notre échange', type: 'textarea', required: false, placeholder: 'Ex: Projet de refonte CRM, rencontre au salon...' },
    ],
  },
  {
    id: 'form_salon',
    organizationId: 'org_bestexperts',
    name: 'Capture Salon Paris Tech Expo',
    title: 'Rencontrons-nous au Salon Paris Tech',
    description: 'Indiquez vos coordonnées pour recevoir notre livre blanc et planifier un échange avec un consultant.',
    submitButtonText: 'Recevoir le livre blanc & être rappelé',
    successMessage: 'Merci ! Notre équipe commerciale vous recontactera sous 24h ouvrées.',
    consentText: 'J\'accepte de recevoir la documentation et d\'être recontacté pour ce projet.',
    active: true,
    usedInProfilesCount: 1,
    submissionsCount: 87,
    createdAt: '2025-03-01T10:00:00Z',
    fields: [
      { id: 'fs1', name: 'firstName', label: 'Prénom', type: 'text', required: true },
      { id: 'fs2', name: 'lastName', label: 'Nom', type: 'text', required: true },
      { id: 'fs3', name: 'email', label: 'Email professionnel', type: 'email', required: true },
      { id: 'fs4', name: 'phone', label: 'Téléphone portable', type: 'phone', required: true },
      { id: 'fs5', name: 'company', label: 'Entreprise', type: 'text', required: true },
    ],
  },
];

const SEED_ROUTING_RULES: LeadRoutingRule[] = [
  {
    id: 'rule_tech_saas',
    organizationId: 'org_bestexperts',
    name: 'Tech, SaaS & Startups Hub ➔ Sophie Laurent',
    description: 'Routage automatique de tous les prospects issus d’éditeurs SaaS, startups, plateformes cloud et incubateurs.',
    priority: 1,
    active: true,
    geographicKeywords: ['Station F', 'Paris', 'Nantes', 'Lille'],
    industryKeywords: ['SaaS', 'Tech', 'Software', 'Digital', 'Cloud', 'Startup', 'IA', 'Plateforme', 'Dev'],
    jobTitleKeywords: ['Growth', 'Marketing', 'Product', 'Founder', 'CEO', 'CTO'],
    targetUserId: 'usr_sophie',
    matchMode: 'any',
    autoTags: ['Secteur-Tech', 'Routing-Auto'],
    statusOnAssign: 'new',
    autoReminderHours: 24,
    sendAlertNotification: true,
    matchesCount: 14,
    lastMatchedAt: '2026-08-22T08:14:00Z',
    createdAt: '2025-01-15T09:00:00Z',
    updatedAt: '2026-08-20T10:00:00Z',
  },
  {
    id: 'rule_sante_pharma',
    organizationId: 'org_bestexperts',
    name: 'Santé, Pharma & Biotech ➔ Marie Koffi',
    description: 'Attribution des opportunités du secteur médical, santé connectée, hôpitaux et laboratoires.',
    priority: 2,
    active: true,
    geographicKeywords: ['Nantes', 'Lyon', 'Paris', 'Bordeaux', 'Rennes'],
    industryKeywords: ['Santé', 'Pharma', 'Biotech', 'Médical', 'Hôpital', 'Doctolib', 'Laboratoire', 'Clinique'],
    jobTitleKeywords: ['Directeur', 'Events', 'Achats', 'Responsable'],
    targetUserId: 'usr_marie',
    matchMode: 'any',
    autoTags: ['Secteur-Santé', 'Compte-Clé'],
    statusOnAssign: 'new',
    autoReminderHours: 24,
    sendAlertNotification: true,
    matchesCount: 9,
    lastMatchedAt: '2026-08-21T15:20:00Z',
    createdAt: '2025-02-01T10:00:00Z',
    updatedAt: '2026-08-19T14:00:00Z',
  },
  {
    id: 'rule_industrie_transport',
    organizationId: 'org_bestexperts',
    name: 'Industrie, Transport & Mobilité ➔ Jean-Marc Mensah',
    description: 'Prise en charge des grands comptes industriels, logistique, ferroviaire et mobilité lourde.',
    priority: 3,
    active: true,
    geographicKeywords: ['Saint-Ouen', 'Île-de-France', 'Hauts-de-France', 'Lyon', 'Strasbourg'],
    industryKeywords: ['Industrie', 'Transport', 'Automobile', 'Ferroviaire', 'Mobilité', 'Alstom', 'Logistique', 'Aéronautique'],
    jobTitleKeywords: ['Directeur', 'Procurement', 'Achats', 'Partner', 'DSI'],
    targetUserId: 'usr_mensah',
    matchMode: 'any',
    autoTags: ['Industrie-Mobilité', 'Grands-Comptes'],
    statusOnAssign: 'new',
    autoReminderHours: 48,
    sendAlertNotification: true,
    matchesCount: 11,
    lastMatchedAt: '2026-08-20T16:00:00Z',
    createdAt: '2025-02-15T11:00:00Z',
    updatedAt: '2026-08-18T16:00:00Z',
  },
  {
    id: 'rule_finance_afrique',
    organizationId: 'org_bestexperts',
    name: 'Finance, Investissement & Afrique / International ➔ David Sagbo',
    description: 'Dossiers stratégiques d’investissement, fonds de capital-risque, banques d\'affaires et expansion Afrique & EMEA.',
    priority: 4,
    active: true,
    geographicKeywords: ['Abidjan', 'Dakar', 'Cotonou', 'Lomé', 'Accra', 'Casablanca', 'Côte d\'Ivoire', 'Sénégal', 'Bénin', 'London', 'Genève', 'Bruxelles'],
    industryKeywords: ['Investissement', 'Venture', 'Capital', 'Finance', 'Fintech', 'Banque', 'Fonds', 'Bourse', 'Conseil'],
    jobTitleKeywords: ['Directeur', 'Partner', 'Investment Director', 'CEO', 'Président', 'Fondateur'],
    targetUserId: 'usr_david',
    matchMode: 'any',
    autoTags: ['Finance-Invest', 'Priorité-Haute'],
    statusOnAssign: 'new',
    autoReminderHours: 12,
    sendAlertNotification: true,
    matchesCount: 18,
    lastMatchedAt: '2026-08-22T08:14:00Z',
    createdAt: '2025-01-10T08:00:00Z',
    updatedAt: '2026-08-22T08:00:00Z',
  },
  {
    id: 'rule_grand_ouest_rhone',
    organizationId: 'org_bestexperts',
    name: 'Pôle Régions Grand Ouest & Sud-Est ➔ Marie Koffi',
    description: 'Routage géographique des prospects basés en métropoles régionales (Nantes, Lyon, Bordeaux, Toulouse).',
    priority: 5,
    active: true,
    geographicKeywords: ['Lyon', 'Nantes', 'Grenoble', 'Bordeaux', 'Rennes', 'Toulouse', 'Marseille'],
    industryKeywords: [],
    jobTitleKeywords: [],
    targetUserId: 'usr_marie',
    matchMode: 'any',
    autoTags: ['Zone-Régions'],
    statusOnAssign: 'new',
    autoReminderHours: 48,
    sendAlertNotification: true,
    matchesCount: 8,
    lastMatchedAt: '2026-08-19T10:00:00Z',
    createdAt: '2025-03-01T09:00:00Z',
    updatedAt: '2026-08-15T11:00:00Z',
  },
];

const SEED_INTEGRATIONS: Integration[] = [
  {
    id: 'int_hubspot',
    provider: 'hubspot',
    name: 'HubSpot CRM',
    icon: 'hubspot',
    status: 'connected',
    lastSyncAt: '2026-08-24T11:45:00Z',
    syncedLeadsCount: 372,
    config: {
      apiKey: 'pat-eu1-99a81c72-4d5e-6f81-a902-12f8490a1b2c',
      accessToken: 'pat-eu1-99a81c72-4d5e-6f81-a902-12f8490a1b2c',
      portalId: '39821450',
      autoSyncNewLeads: true,
      syncTags: true,
      createDealOnSync: true,
      dealPipeline: 'sales_pipeline_nfc',
      dealStage: 'appointmentscheduled',
      dealAmount: 4500,
      targetPipeline: 'Sales Pipeline - Inbound NFC',
      fieldMappings: DEFAULT_HUBSPOT_MAPPINGS,
      deduplicationStrategy: 'email',
    },
  },
  {
    id: 'int_salesforce',
    provider: 'salesforce',
    name: 'Salesforce Sales Cloud',
    icon: 'salesforce',
    status: 'connected',
    lastSyncAt: '2026-08-24T10:30:00Z',
    syncedLeadsCount: 194,
    config: {
      instanceUrl: 'https://kardx-enterprise.my.salesforce.com',
      accessToken: '00D5g000000XYZ!AR4AQKardXLiveOAuthTokenEnterprise',
      autoSyncNewLeads: true,
      syncTags: true,
      leadSourceValue: 'KardX NFC Smart Card',
      fieldMappings: DEFAULT_SALESFORCE_MAPPINGS,
      deduplicationStrategy: 'email_or_phone',
    },
  },
  {
    id: 'int_pipedrive',
    provider: 'pipedrive',
    name: 'Pipedrive',
    icon: 'pipedrive',
    status: 'disconnected',
    syncedLeadsCount: 0,
    config: {
      apiKey: 'krdx_pipe_live_8912a74c',
      companyDomain: 'bestexperts',
      autoSyncNewLeads: false,
      fieldMappings: DEFAULT_PIPEDRIVE_MAPPINGS,
    },
  },
  {
    id: 'int_zoho',
    provider: 'zoho',
    name: 'Zoho CRM',
    icon: 'zoho',
    status: 'disconnected',
    syncedLeadsCount: 0,
    config: {
      accessToken: '1000.kardx.live.zoho.token',
      autoSyncNewLeads: false,
      fieldMappings: DEFAULT_ZOHO_MAPPINGS,
    },
  },
  {
    id: 'int_google',
    provider: 'google_contacts',
    name: 'Google Contacts Sync',
    icon: 'google',
    status: 'connected',
    lastSyncAt: '2026-08-24T09:00:00Z',
    syncedLeadsCount: 145,
    config: {
      autoSyncNewLeads: true,
    },
  },
  {
    id: 'int_zapier',
    provider: 'zapier',
    name: 'Zapier Webhooks',
    icon: 'zapier',
    status: 'connected',
    lastSyncAt: '2026-08-24T08:14:00Z',
    syncedLeadsCount: 189,
    config: {
      webhookUrl: 'https://hooks.zapier.com/hooks/catch/98231/kardx_leads',
      autoSyncNewLeads: true,
    },
  },
];

const SEED_WEBHOOKS: WebhookEndpoint[] = [
  {
    id: 'wh_01',
    url: 'https://api.bestexperts-group.com/v1/webhooks/kardx_leads',
    secret: 'whsec_892bca9812df09218ab28912',
    events: ['lead_created', 'nfc_scan', 'profile_view'],
    status: 'active',
    lastTriggeredAt: '2026-08-22T08:14:00Z',
    successCount: 421,
    failCount: 2,
    createdAt: '2025-01-20T10:00:00Z',
  },
];

const SEED_AUDIT: AuditLog[] = [
  {
    id: 'aud_01',
    organizationId: 'org_bestexperts',
    actor: {
      id: 'usr_david',
      name: 'David Sagbo',
      email: 'sagbodavidcomlan@gmail.com',
      role: 'admin',
    },
    action: 'Export des prospects au format CSV (5 fiches)',
    targetType: 'lead',
    targetId: 'all',
    targetName: 'Export Base CRM',
    timestamp: '2026-08-22T08:20:00Z',
  },
  {
    id: 'aud_02',
    organizationId: 'org_bestexperts',
    actor: {
      id: 'usr_david',
      name: 'David Sagbo',
      email: 'sagbodavidcomlan@gmail.com',
      role: 'admin',
    },
    action: 'Mise à jour du profil et ajout du bloc Témoignages',
    targetType: 'profile',
    targetId: 'prof_david',
    targetName: 'David Sagbo (Profil)',
    timestamp: '2026-08-22T07:45:00Z',
  },
  {
    id: 'aud_03',
    organizationId: 'org_bestexperts',
    actor: {
      id: 'usr_david',
      name: 'David Sagbo',
      email: 'sagbodavidcomlan@gmail.com',
      role: 'admin',
    },
    action: 'Association de la carte NFC Métal Noire (04:A2:3F:89:C1)',
    targetType: 'card',
    targetId: 'crd_01',
    targetName: 'Carte Métal Noire',
    timestamp: '2026-08-20T11:30:00Z',
  },
];

const SEED_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif_01',
    type: 'lead_captured',
    title: 'Nouveau prospect capturé',
    message: 'Amadou Mensah (ACME Ventures Capital) a partagé ses coordonnées via Tap NFC.',
    timestamp: '2026-08-22T08:14:00Z',
    read: false,
    linkTab: 'leads',
    metadata: {
      leadId: 'lead_01',
      profileId: 'prof_david',
      contactName: 'Amadou Mensah',
      company: 'ACME Ventures Capital',
    },
  },
  {
    id: 'notif_02',
    type: 'card_scanned',
    title: 'Carte NFC scannée',
    message: 'Votre Carte Métal Noire Matte — David a été scannée à Paris La Défense.',
    timestamp: '2026-08-22T08:14:00Z',
    read: false,
    linkTab: 'cards',
    metadata: {
      cardId: 'crd_01',
      profileId: 'prof_david',
    },
  },
  {
    id: 'notif_03',
    type: 'lead_captured',
    title: 'Nouveau prospect capturé',
    message: 'Claire Delorme (Groupe Beta Retail) a scanné votre QR Code au salon.',
    timestamp: '2026-08-21T15:20:00Z',
    read: true,
    linkTab: 'leads',
    metadata: {
      leadId: 'lead_02',
      profileId: 'prof_david',
      contactName: 'Claire Delorme',
      company: 'Groupe Beta Retail',
    },
  },
  {
    id: 'notif_04',
    type: 'card_scanned',
    title: 'Scan Chevalet QR Stand',
    message: 'Le Chevalet d’accueil Stand & Salon QR a enregistré un nouveau scan.',
    timestamp: '2026-08-21T11:05:00Z',
    read: true,
    linkTab: 'cards',
    metadata: {
      cardId: 'crd_04',
      profileId: 'prof_david',
    },
  },
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('kardx_current_user');
    return saved ? JSON.parse(saved) : SEED_USERS[1]; // Default to David Sagbo (admin)
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  const [currentOrg, setCurrentOrg] = useState<Organization>(() => {
    const saved = localStorage.getItem('kardx_org');
    return saved ? JSON.parse(saved) : SEED_ORG;
  });
  const [organizations, setOrganizations] = useState<Organization[]>(() => {
    const saved = localStorage.getItem('kardx_organizations');
    return saved ? JSON.parse(saved) : SEED_ORGS;
  });
  const [departments, setDepartments] = useState<Department[]>(() => {
    const saved = localStorage.getItem('kardx_departments');
    return saved ? JSON.parse(saved) : SEED_DEPARTMENTS;
  });
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('kardx_users');
    return saved ? JSON.parse(saved) : SEED_USERS;
  });
  const [teams, setTeams] = useState<Team[]>(() => {
    const saved = localStorage.getItem('kardx_teams');
    return saved ? JSON.parse(saved) : SEED_TEAMS;
  });
  const [profiles, setProfiles] = useState<Profile[]>(() => {
    const saved = localStorage.getItem('kardx_profiles');
    return saved ? JSON.parse(saved) : SEED_PROFILES;
  });
  const [activeProfile, setActiveProfile] = useState<Profile>(() => {
    const saved = localStorage.getItem('kardx_active_profile');
    return saved ? JSON.parse(saved) : SEED_PROFILES[0];
  });
  const [cards, setCards] = useState<PhysicalCard[]>(() => {
    const saved = localStorage.getItem('kardx_cards');
    return saved ? JSON.parse(saved) : SEED_CARDS;
  });
  const [leads, setLeads] = useState<Lead[]>(() => {
    const saved = localStorage.getItem('kardx_leads');
    return saved ? JSON.parse(saved) : SEED_LEADS;
  });
  const [routingRules, setRoutingRules] = useState<LeadRoutingRule[]>(() => {
    const saved = localStorage.getItem('kardx_routing_rules');
    return saved ? JSON.parse(saved) : SEED_ROUTING_RULES;
  });
  const [forms, setForms] = useState<LeadForm[]>(() => {
    const saved = localStorage.getItem('kardx_forms');
    return saved ? JSON.parse(saved) : SEED_FORMS;
  });
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>(() => {
    const saved = localStorage.getItem('kardx_integrations');
    return saved ? JSON.parse(saved) : SEED_INTEGRATIONS;
  });
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>(() => {
    const saved = localStorage.getItem('kardx_webhooks');
    return saved ? JSON.parse(saved) : SEED_WEBHOOKS;
  });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(SEED_AUDIT);
  const [crmSyncLogs, setCrmSyncLogs] = useState<CrmSyncLog[]>(() => {
    const saved = localStorage.getItem('kardx_crm_sync_logs');
    return saved ? JSON.parse(saved) : SEED_CRM_SYNC_LOGS;
  });
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('kardx_notifications');
    return saved ? JSON.parse(saved) : SEED_NOTIFICATIONS;
  });

  const [passwordChangeChallenge, setPasswordChangeChallenge] = useState<PasswordChangeChallenge | null>(null);

  // RBAC Matrix and Audit Logs
  const [roleModuleMapping, setRoleModuleMapping] = useState<RoleModuleMapping>(() => {
    const saved = localStorage.getItem('kardx_role_module_mapping');
    return saved ? JSON.parse(saved) : DEFAULT_ROLE_MODULES;
  });

  const [rbacAuditLogs, setRbacAuditLogs] = useState<RbacAuditLog[]>(() => {
    const saved = localStorage.getItem('kardx_rbac_audit_logs');
    return saved ? JSON.parse(saved) : [
      {
        id: 'rbac_log_01',
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
        actorId: 'usr_david',
        actorName: 'David Sagbo',
        actorEmail: 'sagbodavidcomlan@gmail.com',
        action: 'Initialisation des Politiques',
        description: 'Déploiement du profil Standard Entreprise avec isolation multi-tenant et 2FA.',
      },
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('kardx_role_module_mapping', JSON.stringify(roleModuleMapping));
    } catch (e) {}
  }, [roleModuleMapping]);

  useEffect(() => {
    try {
      localStorage.setItem('kardx_rbac_audit_logs', JSON.stringify(rbacAuditLogs));
    } catch (e) {}
  }, [rbacAuditLogs]);

  const toggleRoleModule = (role: UserRole, moduleId: string) => {
    setRoleModuleMapping((prev) => {
      const currentList = prev[role] || [];
      const exists = currentList.includes(moduleId);
      const nextList = exists
        ? currentList.filter((m) => m !== moduleId)
        : [...currentList, moduleId];

      const updated = { ...prev, [role]: nextList };

      const newLog: RbacAuditLog = {
        id: `rbac_${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorName: currentUser.name,
        actorEmail: currentUser.email,
        action: 'ROLE_MODULE_TOGGLE',
        targetRole: role,
        targetModule: moduleId,
        description: `${exists ? 'Retrait' : 'Attribution'} du module "${moduleId}" pour le rôle "${role}".`,
      };
      setRbacAuditLogs((prevLogs) => [newLog, ...prevLogs]);

      return updated;
    });
    showToast('Matrice RBAC mise à jour');
  };

  const applyRbacPreset = (presetId: string) => {
    const preset = RBAC_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setRoleModuleMapping(preset.roleModuleMapping);

    const newLog: RbacAuditLog = {
      id: `rbac_${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorName: currentUser.name,
      actorEmail: currentUser.email,
      action: 'PRESET_APPLIED',
      description: `Politique de sécurité "${preset.name}" appliquée à l'ensemble du système.`,
    };
    setRbacAuditLogs((prevLogs) => [newLog, ...prevLogs]);
    showToast(`Preset "${preset.name}" appliqué avec succès.`);
  };

  // Dynamic Scoped RBAC Permissions & Data Accessors
  const userPermissions = useMemo(() => getUserPermissions(currentUser), [currentUser]);

  // Scoped departments
  const visibleDepartments = useMemo(() => {
    if (currentUser.role === 'super_admin') {
      return []; // Strict separation: super admin sees no business departments
    }
    if (currentUser.role === 'admin') {
      return departments.filter((d) => d.organizationId === currentUser.organizationId);
    }
    if (currentUser.role === 'manager') {
      // Departments they head or their team belongs to
      return departments.filter(
        (d) =>
          d.organizationId === currentUser.organizationId &&
          (d.headUserId === currentUser.id ||
            teams.some((t) => t.departmentId === d.id && (t.managerId === currentUser.id || t.id === currentUser.teamId)))
      );
    }
    // Collaborator
    return departments.filter(
      (d) =>
        d.organizationId === currentUser.organizationId &&
        (d.id === currentUser.departmentId ||
          teams.some((t) => t.id === currentUser.teamId && t.departmentId === d.id))
    );
  }, [currentUser, departments, teams]);

  // Scoped teams
  const visibleTeams = useMemo(() => {
    if (currentUser.role === 'super_admin') {
      return []; // Strict separation
    }
    if (currentUser.role === 'admin') {
      return teams.filter((t) => t.organizationId === currentUser.organizationId);
    }
    if (currentUser.role === 'manager') {
      // Managed department IDs
      const managedDeptIds = new Set(
        departments
          .filter((d) => d.headUserId === currentUser.id && d.organizationId === currentUser.organizationId)
          .map((d) => d.id)
      );
      return teams.filter(
        (t) =>
          t.organizationId === currentUser.organizationId &&
          (t.managerId === currentUser.id ||
            t.id === currentUser.teamId ||
            (t.departmentId && managedDeptIds.has(t.departmentId)))
      );
    }
    if (currentUser.teamId) {
      return teams.filter((t) => t.id === currentUser.teamId && t.organizationId === currentUser.organizationId);
    }
    return [];
  }, [currentUser, teams, departments]);

  const visibleProfiles = useMemo(() => {
    return filterProfilesForUser(currentUser, profiles, teams, departments, users);
  }, [currentUser, profiles, teams, departments, users]);

  const visibleCards = useMemo(() => {
    return filterCardsForUser(currentUser, cards, visibleProfiles);
  }, [currentUser, cards, visibleProfiles]);

  const visibleLeads = useMemo(() => {
    return filterLeadsForUser(currentUser, leads, visibleProfiles);
  }, [currentUser, leads, visibleProfiles]);

  const hasUserPermission = (permission: keyof UserPermissions) => {
    return hasPermission(currentUser, permission);
  };

  // Sync state to local storage on changes
  useEffect(() => {
    try {
      localStorage.setItem('kardx_departments', JSON.stringify(departments));
    } catch (e) {}
  }, [departments]);

  useEffect(() => {
    try {
      localStorage.setItem('kardx_teams', JSON.stringify(teams));
    } catch (e) {}
  }, [teams]);

  useEffect(() => {
    try {
      localStorage.setItem('kardx_users', JSON.stringify(users));
    } catch (e) {}
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem('kardx_organizations', JSON.stringify(organizations));
    } catch (e) {}
  }, [organizations]);

  // Sync state to local storage on changes
  useEffect(() => {
    try {
      localStorage.setItem('kardx_leads', JSON.stringify(leads));
    } catch (e) {}
  }, [leads]);

  useEffect(() => {
    try {
      localStorage.setItem('kardx_profiles', JSON.stringify(profiles));
      localStorage.setItem('kardx_active_profile', JSON.stringify(activeProfile));
    } catch (e) {}
  }, [profiles, activeProfile]);

  useEffect(() => {
    try {
      localStorage.setItem('kardx_cards', JSON.stringify(cards));
    } catch (e) {}
  }, [cards]);

  useEffect(() => {
    try {
      localStorage.setItem('kardx_forms', JSON.stringify(forms));
    } catch (e) {}
  }, [forms]);

  useEffect(() => {
    try {
      localStorage.setItem('kardx_webhooks', JSON.stringify(webhooks));
    } catch (e) {}
  }, [webhooks]);

  useEffect(() => {
    try {
      localStorage.setItem('kardx_integrations', JSON.stringify(integrations));
    } catch (e) {}
  }, [integrations]);

  useEffect(() => {
    try {
      localStorage.setItem('kardx_crm_sync_logs', JSON.stringify(crmSyncLogs));
    } catch (e) {}
  }, [crmSyncLogs]);

  useEffect(() => {
    try {
      localStorage.setItem('kardx_org', JSON.stringify(currentOrg));
    } catch (e) {}
  }, [currentOrg]);

  // Navigation states
  const [activeTab, setActiveTab] = useState<string>('dashboard'); // 'dashboard', 'profile', 'design', 'cards', 'leads', 'forms', 'analytics', 'team', 'bulk', 'signature', 'wallet', 'scanner', 'integrations', 'settings', 'admin', 'landing'
  const [publicProfileSlug, setPublicProfileSlug] = useState<string | null>(null);
  const [isExchangeModalOpen, setIsExchangeModalOpen] = useState<boolean>(false);
  const [exchangeSource, setExchangeSource] = useState<LeadSource>('nfc');
  const [isNfcSimModalOpen, setIsNfcSimModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initialize analytics events over 30 days
  useEffect(() => {
    const generatedEvents: AnalyticsEvent[] = [];
    const eventTypes: EventType[] = [
      'profile_view', 'nfc_scan', 'qr_scan', 'whatsapp_click', 'phone_click', 
      'email_click', 'contact_download', 'exchange_open', 'lead_created'
    ];
    const devices: ('mobile_ios' | 'mobile_android' | 'desktop')[] = ['mobile_ios', 'mobile_android', 'desktop'];
    const sources: LeadSource[] = ['nfc', 'qr', 'direct_url', 'email_signature'];

    const now = new Date();
    for (let i = 30; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const countForDay = Math.floor(Math.random() * 40) + 15;
      
      for (let j = 0; j < countForDay; j++) {
        const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        const hour = Math.floor(Math.random() * 24);
        const minute = Math.floor(Math.random() * 60);
        const eventDate = new Date(date);
        eventDate.setHours(hour, minute);

        generatedEvents.push({
          id: `evt_${i}_${j}`,
          type,
          profileId: 'prof_david',
          cardId: 'crd_01',
          organizationId: 'org_bestexperts',
          source: sources[Math.floor(Math.random() * sources.length)],
          device: devices[Math.floor(Math.random() * devices.length)],
          timestamp: eventDate.toISOString(),
          location: {
            city: ['Paris', 'Lyon', 'Lille', 'Marseille', 'Bruxelles', 'Genève', 'Abidjan', 'Dakar', 'Cotonou'][Math.floor(Math.random() * 9)],
            country: 'France',
            countryCode: 'FR',
          },
        });
      }
    }
    setEvents(generatedEvents);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  const addNotification = (notifData: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: AppNotification = {
      ...notifData,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    showToast('Toutes les notifications ont été marquées comme lues');
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    showToast('Toutes les notifications ont été effacées');
  };

  // Automated background reminder & follow-up task checker
  useEffect(() => {
    const triggeredIds = new Set<string>();

    const checkReminders = () => {
      const now = Date.now();

      leads.forEach((lead) => {
        // 1. Check legacy or primary lead.reminderDate
        if (
          lead.reminderDate &&
          lead.reminderStatus === 'pending' &&
          !triggeredIds.has(`rem_${lead.id}`)
        ) {
          const rTime = new Date(lead.reminderDate).getTime();
          if (rTime <= now && now - rTime <= 48 * 3600 * 1000) {
            triggeredIds.add(`rem_${lead.id}`);

            // Play haptic chime
            playNotificationChime();

            // Native browser notification
            triggerBrowserNotification({
              title: `🔔 Rappel Prospect : ${lead.firstName} ${lead.lastName}`,
              body: `${lead.company ? `${lead.company} • ` : ''}${lead.reminderNote || 'Relance commerciale planifiée'}`,
              tag: `lead-rem-${lead.id}`,
            });

            // In-app dashboard notification
            addNotification({
              type: 'lead_reminder',
              title: `Rappel : Relancer ${lead.firstName} ${lead.lastName}`,
              message: lead.reminderNote || `Rappel programmé pour ${lead.firstName} ${lead.lastName}${lead.company ? ` (${lead.company})` : ''}.`,
              linkTab: 'leads',
              metadata: {
                leadId: lead.id,
                contactName: `${lead.firstName} ${lead.lastName}`,
                company: lead.company,
              },
            });
          }
        }

        // 2. Check explicit lead.tasks
        if (lead.tasks && lead.tasks.length > 0) {
          lead.tasks.forEach((task) => {
            if (
              task.status === 'pending' &&
              !task.triggeredAlert &&
              !triggeredIds.has(`task_${task.id}`)
            ) {
              const dueTime = new Date(task.dueDate).getTime();
              if (dueTime <= now && now - dueTime <= 48 * 3600 * 1000) {
                triggeredIds.add(`task_${task.id}`);

                playNotificationChime();

                triggerBrowserNotification({
                  title: `⏰ Tâche de Relance : ${task.title}`,
                  body: `Prospect : ${lead.firstName} ${lead.lastName}${lead.company ? ` (${lead.company})` : ''}`,
                  tag: `lead-task-${task.id}`,
                });

                addNotification({
                  type: 'lead_reminder',
                  title: `Tâche à traiter : ${task.title}`,
                  message: `${lead.firstName} ${lead.lastName}${lead.company ? ` (${lead.company})` : ''} • Échéance atteinte.`,
                  linkTab: 'leads',
                  metadata: {
                    leadId: lead.id,
                    contactName: `${lead.firstName} ${lead.lastName}`,
                    company: lead.company,
                  },
                });
              }
            }
          });
        }
      });
    };

    const interval = setInterval(checkReminders, 12000);
    const timeout = setTimeout(checkReminders, 1500);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [leads]);

  const updateProfile = (updated: Partial<Profile>) => {
    setProfiles((prev) =>
      prev.map((p) => {
        if (p.id === activeProfile.id) {
          const newProfile = { ...p, ...updated, updatedAt: new Date().toISOString() };
          setActiveProfile(newProfile);
          return newProfile;
        }
        return p;
      })
    );
    showToast('Profil enregistré avec succès');
  };

  const addBlock = (type: ProfileBlock['type']) => {
    const newBlock: ProfileBlock = {
      id: `blk_${Date.now()}`,
      type,
      title: type === 'services' ? 'Nouveau Service' : type === 'documents' ? 'Nouveau Document' : 'Nouveau Bloc',
      visible: true,
      order: activeProfile.blocks.length + 1,
      payload: {
        text: type === 'about' ? 'Texte descriptif de présentation...' : undefined,
        services: type === 'services' ? [
          {
            id: `srv_${Date.now()}`,
            title: 'Nouvelle Prestation',
            description: 'Description détaillée de l\'offre commerciale.',
            price: 'Sur devis',
            buttonLabel: 'Contacter',
          },
        ] : undefined,
        documents: type === 'documents' ? [
          {
            id: `doc_${Date.now()}`,
            title: 'Brochure de présentation.pdf',
            description: 'Téléchargez notre documentation officielle.',
            fileUrl: '#',
            fileType: 'pdf',
            fileSize: '1.5 Mo',
          },
        ] : undefined,
      },
    };

    updateProfile({
      blocks: [...activeProfile.blocks, newBlock],
    });
  };

  const updateBlock = (blockId: string, updated: Partial<ProfileBlock>) => {
    const newBlocks = activeProfile.blocks.map((b) => (b.id === blockId ? { ...b, ...updated } : b));
    updateProfile({ blocks: newBlocks });
  };

  const deleteBlock = (blockId: string) => {
    const newBlocks = activeProfile.blocks.filter((b) => b.id !== blockId);
    updateProfile({ blocks: newBlocks });
  };

  const reorderBlocks = (startIndex: number, endIndex: number) => {
    const newBlocks = [...activeProfile.blocks];
    const [removed] = newBlocks.splice(startIndex, 1);
    newBlocks.splice(endIndex, 0, removed);
    const orderedBlocks = newBlocks.map((b, idx) => ({ ...b, order: idx + 1 }));
    updateProfile({ blocks: orderedBlocks });
  };

  const updateTheme = (updatedTheme: Partial<ProfileTheme>) => {
    updateProfile({
      theme: { ...activeProfile.theme, ...updatedTheme },
    });
  };

  // Card Management
  const addCard = (cardData: Omit<PhysicalCard, 'id' | 'createdAt' | 'scansCount'>) => {
    const newCard: PhysicalCard = {
      ...cardData,
      id: `crd_${Date.now()}`,
      scansCount: 0,
      createdAt: new Date().toISOString(),
    };
    setCards((prev) => [newCard, ...prev]);
    showToast('Nouvelle carte NFC/QR ajoutée');
  };

  const updateCardStatus = (cardId: string, status: CardStatus) => {
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, status } : c))
    );
    showToast(`Statut de la carte mis à jour : ${status.toUpperCase()}`);
  };

  const reassignCard = (cardId: string, profileId: string) => {
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, profileId } : c))
    );
    showToast('Carte réassignée avec succès');
  };

  const deleteCard = (cardId: string) => {
    setCards((prev) => prev.filter((c) => c.id !== cardId));
    showToast('Carte supprimée');
  };

  // Lead Management
  const createLead = async (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'organizationId'>): Promise<Lead> => {
    const rawLead: Lead = {
      ...leadData,
      id: `lead_${Date.now()}`,
      organizationId: currentOrg.id,
      tags: leadData.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Automatically evaluate and apply lead routing rules
    const { updatedLead, matchedRule } = applyRoutingToLead(rawLead, routingRules, users);
    const newLead = updatedLead;

    setLeads((prev) => [newLead, ...prev]);

    // Update rule matches count and lastMatchedAt if matched
    if (matchedRule) {
      setRoutingRules((prev) =>
        prev.map((r) =>
          r.id === matchedRule.id
            ? { ...r, matchesCount: r.matchesCount + 1, lastMatchedAt: new Date().toISOString() }
            : r
        )
      );
    }

    // Track analytics
    trackEvent('lead_created', leadData.profileId, leadData.source, {
      name: `${leadData.firstName} ${leadData.lastName}`,
      company: leadData.company,
      assignedUserId: newLead.assignedUserId,
      routedRuleId: newLead.routedByRuleId,
    });

    // Update profile lead counts
    setProfiles((prev) =>
      prev.map((p) =>
        p.id === leadData.profileId ? { ...p, leadsCount: p.leadsCount + 1 } : p
      )
    );

    // Trigger automated push to connected CRM integrations (HubSpot, Salesforce, Pipedrive, Zoho)
    const activeCrms = integrations.filter(
      (int) => int.status === 'connected' && (int.config.autoSyncNewLeads ?? true)
    );

    if (activeCrms.length > 0) {
      // Asynchronously push lead to all active CRMs
      Promise.all(
        activeCrms.map(async (int) => {
          try {
            const syncResult = await executeCrmLeadSync(newLead, int, currentOrg.name);
            setCrmSyncLogs((prev) => [syncResult.log, ...prev]);

            // Increment synced leads counter & timestamp on integration
            setIntegrations((prev) =>
              prev.map((i) =>
                i.id === int.id
                  ? {
                      ...i,
                      syncedLeadsCount: i.syncedLeadsCount + 1,
                      lastSyncAt: new Date().toISOString(),
                    }
                  : i
              )
            );

            // Update lead's individual CRM sync state
            setLeads((prev) =>
              prev.map((l) =>
                l.id === newLead.id
                  ? {
                      ...l,
                      crmSyncStatus: {
                        ...(l.crmSyncStatus || {}),
                        [int.provider]: syncResult.syncInfo,
                      },
                    }
                  : l
              )
            );

            // Emit system notification for automated push
            addNotification({
              type: 'system',
              title: `🎯 Lead auto-synchronisé vers ${int.name}`,
              message: `Le prospect ${newLead.firstName} ${newLead.lastName}${newLead.company ? ` (${newLead.company})` : ''} a été injecté automatiquement dans ${int.name} (Réf: ${syncResult.syncInfo.externalId}).`,
              linkTab: 'integrations',
            });
          } catch (err) {
            console.error(`Auto CRM sync error on ${int.name}`, err);
          }
        })
      );
    }

    // Create a real-time notification with routing details
    const assignedMember = users.find((u) => u.id === newLead.assignedUserId);
    const routingInfo = matchedRule && assignedMember
      ? ` 🎯 Routé vers ${assignedMember.name} via la règle "${matchedRule.name}".`
      : '';

    addNotification({
      type: 'lead_captured',
      title: matchedRule && assignedMember 
        ? `🎯 Lead auto-routé vers ${assignedMember.name}`
        : 'Nouveau prospect capturé',
      message: `${newLead.firstName} ${newLead.lastName}${newLead.company ? ` (${newLead.company})` : ''} a partagé ses coordonnées via ${newLead.source === 'nfc' ? 'NFC' : newLead.source === 'qr' ? 'QR Code' : 'formulaire'}.${routingInfo}`,
      linkTab: 'leads',
      metadata: {
        leadId: newLead.id,
        profileId: newLead.profileId,
        contactName: `${newLead.firstName} ${newLead.lastName}`,
        company: newLead.company,
      },
    });

    const toastMsg = assignedMember
      ? `Nouveau prospect capturé : ${newLead.firstName} ${newLead.lastName} (Assigné à ${assignedMember.name})`
      : `Nouveau prospect capturé : ${newLead.firstName} ${newLead.lastName} !`;
    showToast(toastMsg);
    return newLead;
  };

  // Lead Routing System Actions
  const addRoutingRule = (ruleData: Omit<LeadRoutingRule, 'id' | 'createdAt' | 'updatedAt' | 'matchesCount'>) => {
    const newRule: LeadRoutingRule = {
      ...ruleData,
      id: `rule_${Date.now()}`,
      matchesCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setRoutingRules((prev) => {
      // Re-assign priorities
      const updated = [...prev, newRule].map((r, idx) => ({ ...r, priority: idx + 1 }));
      return updated;
    });

    showToast(`Règle de routage "${newRule.name}" créée`);
  };

  const updateRoutingRule = (ruleId: string, data: Partial<LeadRoutingRule>) => {
    setRoutingRules((prev) =>
      prev.map((r) =>
        r.id === ruleId
          ? { ...r, ...data, updatedAt: new Date().toISOString() }
          : r
      )
    );
    showToast('Règle de routage mise à jour');
  };

  const deleteRoutingRule = (ruleId: string) => {
    setRoutingRules((prev) => {
      const filtered = prev.filter((r) => r.id !== ruleId);
      return filtered.map((r, idx) => ({ ...r, priority: idx + 1 }));
    });
    showToast('Règle de routage supprimée');
  };

  const reorderRoutingRules = (startIndex: number, endIndex: number) => {
    setRoutingRules((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(startIndex, 1);
      updated.splice(endIndex, 0, moved);
      return updated.map((r, idx) => ({ ...r, priority: idx + 1 }));
    });
    showToast('Priorité des règles de routage réorganisée');
  };

  const toggleRoutingRuleActive = (ruleId: string) => {
    setRoutingRules((prev) =>
      prev.map((r) => {
        if (r.id === ruleId) {
          const newActive = !r.active;
          showToast(`Règle "${r.name}" ${newActive ? 'activée' : 'désactivée'}`);
          return { ...r, active: newActive, updatedAt: new Date().toISOString() };
        }
        return r;
      })
    );
  };

  const testRoutingRule = (leadData: Partial<Lead>): RoutingTestResult => {
    return evaluateLeadRouting(leadData, routingRules, users);
  };

  const reRouteAllLeads = (onlyUnassigned: boolean = true) => {
    let routedCount = 0;
    const details: Record<string, number> = {};

    setLeads((prevLeads) => {
      return prevLeads.map((lead) => {
        if (onlyUnassigned && lead.assignedUserId) {
          return lead; // Skip already assigned leads if onlyUnassigned is true
        }

        const { updatedLead, matchedRule } = applyRoutingToLead(lead, routingRules, users);
        if (matchedRule && updatedLead.assignedUserId) {
          routedCount++;
          const assignee = users.find((u) => u.id === updatedLead.assignedUserId)?.name || updatedLead.assignedUserId;
          details[assignee] = (details[assignee] || 0) + 1;
          return updatedLead;
        }
        return lead;
      });
    });

    const msg = routedCount > 0 
      ? `${routedCount} prospect(s) assigné(s) automatiquement selon vos règles de routage.`
      : 'Aucun prospect éligible au routage avec les règles actives actuelles.';
    showToast(msg);

    return {
      totalProcessed: leads.length,
      totalRouted: routedCount,
      details,
    };
  };

  const updateLeadStatus = (leadId: string, status: LeadStatus) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status, updatedAt: new Date().toISOString() } : l))
    );
  };

  const updateLeadDetails = (leadId: string, data: Partial<Lead>) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, ...data, updatedAt: new Date().toISOString() } : l))
    );
    showToast('Fiche prospect mise à jour');
  };

  const deleteLead = (leadId: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== leadId));
    showToast('Prospect supprimé');
  };

  const addLeadTag = (leadId: string, tag: string) => {
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id === leadId) {
          const tags = l.tags.includes(tag) ? l.tags : [...l.tags, tag];
          return { ...l, tags, updatedAt: new Date().toISOString() };
        }
        return l;
      })
    );
  };

  const toggleLeadFavorite = (leadId: string) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, isFavorite: !l.isFavorite } : l))
    );
  };

  const addLeadInteraction = (
    leadId: string, 
    interactionData: Omit<LeadInteraction, 'id' | 'createdAt' | 'leadId'>
  ) => {
    const newInteraction: LeadInteraction = {
      ...interactionData,
      id: `int_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      leadId,
      authorName: interactionData.authorName || currentUser.name,
      createdAt: new Date().toISOString(),
    };

    setLeads((prev) =>
      prev.map((l) => {
        if (l.id === leadId) {
          const interactions = [newInteraction, ...(l.interactions || [])];
          return {
            ...l,
            interactions,
            updatedAt: new Date().toISOString(),
          };
        }
        return l;
      })
    );
    showToast('Nouvelle note d\'interaction enregistrée');
  };

  const deleteLeadInteraction = (leadId: string, interactionId: string) => {
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id === leadId) {
          const interactions = (l.interactions || []).filter((i) => i.id !== interactionId);
          return {
            ...l,
            interactions,
            updatedAt: new Date().toISOString(),
          };
        }
        return l;
      })
    );
    showToast('Interaction supprimée');
  };

  const addLeadTask = (
    leadId: string, 
    taskData: Omit<LeadTask, 'id' | 'createdAt' | 'leadId'>
  ) => {
    const newTask: LeadTask = {
      ...taskData,
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      leadId,
      createdAt: new Date().toISOString(),
      status: taskData.status || 'pending',
    };

    setLeads((prev) =>
      prev.map((l) => {
        if (l.id === leadId) {
          const tasks = [newTask, ...(l.tasks || [])];
          return {
            ...l,
            tasks,
            reminderDate: newTask.dueDate,
            reminderNote: newTask.title,
            reminderStatus: 'pending',
            updatedAt: new Date().toISOString(),
          };
        }
        return l;
      })
    );
    showToast('Tâche de suivi programmée avec succès');
  };

  const updateLeadTask = (leadId: string, taskId: string, updates: Partial<LeadTask>) => {
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id === leadId) {
          const tasks = (l.tasks || []).map((t) =>
            t.id === taskId ? { ...t, ...updates } : t
          );
          return {
            ...l,
            tasks,
            updatedAt: new Date().toISOString(),
          };
        }
        return l;
      })
    );
    showToast('Tâche mise à jour');
  };

  const deleteLeadTask = (leadId: string, taskId: string) => {
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id === leadId) {
          const tasks = (l.tasks || []).filter((t) => t.id !== taskId);
          return {
            ...l,
            tasks,
            updatedAt: new Date().toISOString(),
          };
        }
        return l;
      })
    );
    showToast('Tâche supprimée');
  };

  const toggleLeadTaskComplete = (leadId: string, taskId: string) => {
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id === leadId) {
          let updatedTaskTitle = '';
          let isNowCompleted = false;
          const tasks = (l.tasks || []).map((t) => {
            if (t.id === taskId) {
              isNowCompleted = t.status !== 'completed';
              updatedTaskTitle = t.title;
              return {
                ...t,
                status: isNowCompleted ? ('completed' as const) : ('pending' as const),
                completedAt: isNowCompleted ? new Date().toISOString() : undefined,
              };
            }
            return t;
          });

          // Also record an interaction note if completed
          let interactions = l.interactions || [];
          if (isNowCompleted) {
            interactions = [
              {
                id: `int_${Date.now()}`,
                leadId: l.id,
                type: 'call',
                title: `Tâche réalisée : ${updatedTaskTitle}`,
                notes: `Relance effectuée avec succès par ${currentUser.name}.`,
                date: new Date().toISOString(),
                authorName: currentUser.name,
                createdAt: new Date().toISOString(),
              },
              ...interactions,
            ];
          }

          return {
            ...l,
            tasks,
            interactions,
            reminderStatus: isNowCompleted ? 'completed' : 'pending',
            updatedAt: new Date().toISOString(),
          };
        }
        return l;
      })
    );
    showToast('Statut de la tâche mis à jour !');
  };

  const setLeadReminder = (leadId: string, reminderDate?: string, reminderNote?: string, autoTask = true) => {
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id === leadId) {
          let tasks = l.tasks || [];
          if (reminderDate && autoTask) {
            const newTask: LeadTask = {
              id: `task_${Date.now()}`,
              leadId: l.id,
              type: 'followup',
              title: reminderNote || 'Relance commerciale',
              dueDate: reminderDate,
              priority: 'medium',
              note: reminderNote,
              status: 'pending',
              assignedUserId: l.assignedUserId || currentUser.id,
              createdAt: new Date().toISOString(),
            };
            tasks = [newTask, ...tasks.filter((t) => t.status !== 'pending')];
          }
          return {
            ...l,
            reminderDate,
            reminderNote,
            reminderStatus: reminderDate ? 'pending' : undefined,
            tasks,
            updatedAt: new Date().toISOString(),
          };
        }
        return l;
      })
    );
    if (reminderDate) {
      showToast('Rappel de relance enregistré');
    } else {
      showToast('Rappel supprimé');
    }
  };

  // Forms
  const createForm = (formData: Omit<LeadForm, 'id' | 'createdAt' | 'usedInProfilesCount' | 'submissionsCount' | 'organizationId'>) => {
    const newForm: LeadForm = {
      ...formData,
      id: `form_${Date.now()}`,
      organizationId: currentOrg.id,
      usedInProfilesCount: 0,
      submissionsCount: 0,
      createdAt: new Date().toISOString(),
    };
    setForms((prev) => [...prev, newForm]);
    showToast('Nouveau formulaire créé avec succès');
  };

  const updateForm = (formId: string, data: Partial<LeadForm>) => {
    setForms((prev) =>
      prev.map((f) => (f.id === formId ? { ...f, ...data } : f))
    );
    showToast('Formulaire mis à jour');
  };

  // Teams & Users
  const addUser = (userData: Omit<User, 'id' | 'createdAt' | 'organizationId'>) => {
    const newUserId = `usr_${Date.now()}`;
    const newUser: User = {
      ...userData,
      id: newUserId,
      organizationId: currentOrg.id,
      createdAt: new Date().toISOString(),
    };
    setUsers((prev) => [...prev, newUser]);

    // Create default profile for the user
    const slug = `${newUser.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.floor(100 + Math.random() * 900)}`;
    const newProfile: Profile = {
      id: `prof_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: newUserId,
      organizationId: currentOrg.id,
      slug,
      firstName: newUser.name.split(' ')[0] || newUser.name,
      lastName: newUser.name.split(' ').slice(1).join(' ') || '',
      headline: newUser.jobTitle || newUser.position || 'Collaborateur',
      company: currentOrg.name,
      logoUrl: currentOrg.logoUrl,
      avatarUrl: newUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&h=400&q=80',
      bio: `Membre de l'équipe ${currentOrg.name}.`,
      badgeVerified: true,
      locale: 'fr',
      status: 'published',
      contacts: {
        email: newUser.email,
        phone: '+33 1 89 00 00 00',
      },
      socials: [
        { id: `soc_${Date.now()}_1`, platform: 'linkedin', url: 'https://linkedin.com', label: 'LinkedIn' },
      ],
      blocks: [],
      theme: {
        preset: 'modern_slate',
        primaryColor: currentOrg.primaryColor || '#1e3a8a',
        secondaryColor: '#475569',
        accentColor: '#3b82f6',
        backgroundColor: '#f8fafc',
        cardBackground: '#ffffff',
        textColor: '#0f172a',
        mutedTextColor: '#64748b',
        borderRadius: 'lg',
        buttonStyle: 'rounded',
        fontFamily: 'Plus Jakarta Sans',
        headerLayout: 'cover_avatar',
        darkMode: false,
      },
      viewsCount: 0,
      scansCount: 0,
      leadsCount: 0,
      exchangeCtaLabel: 'Échanger mes coordonnées',
      enableVcardDownload: true,
      enableFloatingCta: true,
      updatedAt: new Date().toISOString(),
    };

    setProfiles((prev) => [...prev, newProfile]);
    showToast(`Invitation envoyée à ${newUser.email}`);
  };

  const updateUserRole = (userId: string, role: User['role']) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role } : u))
    );
    showToast('Rôle utilisateur modifié');
  };

  const updateUserStatus = (userId: string, status: User['status']) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status } : u))
    );
    showToast(`Statut utilisateur : ${status}`);
  };

  // Departments Hierarchy Management
  const createDepartment = (deptData: Omit<Department, 'id' | 'createdAt' | 'organizationId'>) => {
    const newDept: Department = {
      ...deptData,
      id: `dept_${Date.now()}`,
      organizationId: currentOrg.id,
      createdAt: new Date().toISOString(),
    };
    setDepartments((prev) => [...prev, newDept]);
    showToast(`Département "${newDept.name}" créé avec succès`);
  };

  const updateDepartment = (id: string, updates: Partial<Department>) => {
    setDepartments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updates } : d))
    );
    showToast('Département mis à jour');
  };

  const deleteDepartment = (id: string) => {
    // Detach teams belonging to this department
    setTeams((prev) =>
      prev.map((t) => (t.departmentId === id ? { ...t, departmentId: undefined } : t))
    );
    setDepartments((prev) => prev.filter((d) => d.id !== id));
    showToast('Département supprimé');
  };

  // Teams & Hierarchy Management
  const createTeam = (teamData: Omit<Team, 'id' | 'createdAt' | 'organizationId' | 'membersCount'>) => {
    const newTeam: Team = {
      ...teamData,
      id: `team_${Date.now()}`,
      organizationId: currentOrg.id,
      membersCount: 0,
      createdAt: new Date().toISOString(),
    };
    setTeams((prev) => [...prev, newTeam]);
    showToast(`Équipe "${newTeam.name}" créée avec succès`);
  };

  const updateTeam = (id: string, updates: Partial<Team>) => {
    setTeams((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
    showToast('Équipe mise à jour');
  };

  const deleteTeam = (id: string) => {
    // Unassign users from this team
    setUsers((prev) =>
      prev.map((u) => (u.teamId === id ? { ...u, teamId: undefined } : u))
    );
    setTeams((prev) => prev.filter((t) => t.id !== id));
    showToast('Équipe supprimée');
  };

  const addMemberToTeam = (teamId: string, userId: string, position?: string) => {
    const targetTeam = teams.find((t) => t.id === teamId);
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              teamId,
              departmentId: targetTeam?.departmentId || u.departmentId,
              position: position || u.position,
            }
          : u
      )
    );
    showToast('Collaborateur rattaché à l\'équipe');
  };

  const removeMemberFromTeam = (teamId: string, userId: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId && u.teamId === teamId ? { ...u, teamId: undefined } : u))
    );
    showToast('Collaborateur retiré de l\'équipe');
  };

  const updateUserPosition = (userId: string, position: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, position } : u))
    );
    showToast(`Poste de l'utilisateur mis à jour : "${position}"`);
  };

  // Super-Admin Multi-Tenant Organization Management
  const createOrganization = (params: {
    organizationName?: string;
    name?: string;
    plan: PlanType;
    adminName: string;
    adminEmail: string;
    adminJobTitle?: string;
    adminPosition?: string;
    tempPassword?: string;
    seatsTotal?: number;
    primaryColor?: string;
    domain?: string;
    logoUrl?: string;
    enabledModules?: string[];
    initialDepartments?: { name: string; description?: string }[];
    initialTeams?: { name: string; departmentName?: string; description?: string }[];
    initialMembers?: { name: string; email: string; role: UserRole; position?: string; departmentName?: string; teamName?: string }[];
  }): { success: boolean; orgId?: string; error?: string } => {
    const orgName = (params.name || params.organizationName || '').trim();
    if (!orgName || !params.adminEmail.trim() || !params.adminName.trim()) {
      return { success: false, error: 'Tous les champs obligatoires doivent être remplis.' };
    }

    const orgId = `org_${Date.now()}`;
    const slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const seatsLimit = params.seatsTotal || (params.plan === 'enterprise' ? 100 : params.plan === 'business' ? 25 : 10);

    const newOrg: Organization = {
      id: orgId,
      name: orgName,
      slug,
      domain: params.domain || `${slug}.kardx.pro`,
      logoUrl: params.logoUrl,
      plan: params.plan,
      status: 'active',
      primaryColor: params.primaryColor || '#1e3a8a',
      seatsTotal: seatsLimit,
      seatsUsed: 1 + (params.initialMembers?.length || 0),
      usersCount: 1 + (params.initialMembers?.length || 0),
      adminEmail: params.adminEmail.trim().toLowerCase(),
      adminName: params.adminName.trim(),
      createdAt: new Date().toISOString(),
      trialEndsAt: params.plan === 'enterprise' ? undefined : new Date(Date.now() + 14 * 86400000).toISOString(),
      enabledModules: params.enabledModules || PLATFORM_MODULES.map((m) => m.id),
      departmentsCount: params.initialDepartments?.length || 0,
      teamsCount: params.initialTeams?.length || 0,
    };

    // Create the organization's initial Administrator with a temporary password
    const generatedTempPassword =
      params.tempPassword && params.tempPassword.trim()
        ? params.tempPassword.trim()
        : `KardX-${Math.random().toString(36).substring(2, 6).toUpperCase()}#${Math.floor(1000 + Math.random() * 9000)}`;

    const newAdminUser: User = {
      id: `usr_${Date.now()}_admin`,
      name: params.adminName.trim(),
      email: params.adminEmail.trim().toLowerCase(),
      password: generatedTempPassword,
      role: 'admin',
      jobTitle: params.adminJobTitle || 'Directeur Général & Administrateur',
      position: params.adminPosition || 'Responsable d\'Organisation',
      organizationId: orgId,
      status: 'active',
      mustChangePassword: true, // Mandatory password change on first login!
      createdAt: new Date().toISOString(),
      twoFactorEnabled: false,
    };

    // Process Initial Departments
    const createdDepts: Department[] = [];
    const deptNameToIdMap: Record<string, string> = {};

    if (params.initialDepartments && params.initialDepartments.length > 0) {
      params.initialDepartments.forEach((d, idx) => {
        const deptId = `dept_${Date.now()}_${idx}`;
        const newDept: Department = {
          id: deptId,
          name: d.name.trim(),
          description: d.description || `Département ${d.name} de ${orgName}`,
          organizationId: orgId,
          createdAt: new Date().toISOString(),
        };
        createdDepts.push(newDept);
        deptNameToIdMap[d.name.trim().toLowerCase()] = deptId;
      });
    }

    // Process Initial Teams
    const createdTeams: Team[] = [];
    const teamNameToIdMap: Record<string, string> = {};

    if (params.initialTeams && params.initialTeams.length > 0) {
      params.initialTeams.forEach((t, idx) => {
        const teamId = `team_${Date.now()}_${idx}`;
        let matchedDeptId: string | undefined = undefined;
        if (t.departmentName) {
          matchedDeptId = deptNameToIdMap[t.departmentName.trim().toLowerCase()];
        }

        const newTeam: Team = {
          id: teamId,
          name: t.name.trim(),
          description: t.description || `Équipe ${t.name}`,
          departmentId: matchedDeptId,
          organizationId: orgId,
          membersCount: 0,
          createdAt: new Date().toISOString(),
        };
        createdTeams.push(newTeam);
        teamNameToIdMap[t.name.trim().toLowerCase()] = teamId;
      });
    }

    // Process Initial Additional Members
    const createdMembers: User[] = [];
    if (params.initialMembers && params.initialMembers.length > 0) {
      params.initialMembers.forEach((m, idx) => {
        const memberDeptId = m.departmentName ? deptNameToIdMap[m.departmentName.trim().toLowerCase()] : undefined;
        const memberTeamId = m.teamName ? teamNameToIdMap[m.teamName.trim().toLowerCase()] : undefined;
        const memberTempPassword = `KardX-${Math.random().toString(36).substring(2, 6).toUpperCase()}#${Math.floor(1000 + Math.random() * 9000)}`;

        const newMember: User = {
          id: `usr_${Date.now()}_m_${idx}`,
          name: m.name.trim(),
          email: m.email.trim().toLowerCase(),
          password: memberTempPassword,
          role: m.role,
          jobTitle: m.position || 'Collaborateur',
          position: m.position || 'Collaborateur',
          organizationId: orgId,
          departmentId: memberDeptId,
          teamId: memberTeamId,
          status: 'active',
          mustChangePassword: true,
          createdAt: new Date().toISOString(),
          twoFactorEnabled: false,
        };
        createdMembers.push(newMember);
      });
    }

    // Default Profile for Admin
    const adminProfile: Profile = {
      id: `prof_${Date.now()}_admin`,
      userId: newAdminUser.id,
      organizationId: orgId,
      slug: `${slug}-admin`,
      firstName: newAdminUser.name.split(' ')[0] || newAdminUser.name,
      lastName: newAdminUser.name.split(' ').slice(1).join(' ') || '',
      headline: newAdminUser.jobTitle || 'Directeur Général',
      company: orgName,
      logoUrl: params.logoUrl,
      bio: `Bienvenue sur le profil digital officiel de ${orgName}.`,
      badgeVerified: true,
      locale: 'fr',
      contacts: {
        email: newAdminUser.email,
        phone: '+33 1 89 00 00 00',
      },
      socials: [],
      theme: {
        preset: 'modern_slate',
        primaryColor: newOrg.primaryColor || '#1e3a8a',
        secondaryColor: '#475569',
        accentColor: '#3b82f6',
        backgroundColor: '#0f172a',
        cardBackground: '#1e293b',
        textColor: '#f8fafc',
        mutedTextColor: '#94a3b8',
        borderRadius: 'xl',
        buttonStyle: 'rounded',
        fontFamily: 'Plus Jakarta Sans',
        headerLayout: 'cover_avatar',
        darkMode: true,
      },
      blocks: [
        {
          id: `blk_${Date.now()}_about`,
          type: 'about',
          title: 'À Propos',
          visible: true,
          order: 1,
          payload: {
            text: `Responsable au sein de ${orgName}.`,
          },
        },
      ],
      status: 'published',
      viewsCount: 0,
      scansCount: 0,
      leadsCount: 0,
      enableVcardDownload: true,
      enableFloatingCta: true,
      updatedAt: new Date().toISOString(),
    };

    setOrganizations((prev) => [...prev, newOrg]);
    setUsers((prev) => [...prev, newAdminUser, ...createdMembers]);
    if (createdDepts.length > 0) setDepartments((prev) => [...prev, ...createdDepts]);
    if (createdTeams.length > 0) setTeams((prev) => [...prev, ...createdTeams]);
    setProfiles((prev) => [...prev, adminProfile]);

    // Record in Audit Log
    const newAuditLog: AuditLog = {
      id: `aud_${Date.now()}`,
      organizationId: orgId,
      actor: {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role,
      },
      action: `Création organisation "${newOrg.name}" (${newOrg.plan.toUpperCase()}) avec ${createdDepts.length} départements, ${createdTeams.length} équipes et compte responsable configuré`,
      targetType: 'profile',
      targetId: orgId,
      targetName: newOrg.name,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newAuditLog, ...prev]);

    showToast(`Organisation "${newOrg.name}" créée avec succès (${createdDepts.length} dép., ${createdTeams.length} éq.).`);
    return { success: true, orgId };
  };

  const updateOrganization = (orgId: string, updates: Partial<Organization>) => {
    setOrganizations((prev) =>
      prev.map((o) => (o.id === orgId ? { ...o, ...updates } : o))
    );
    if (currentOrg.id === orgId) {
      setCurrentOrg((prev) => ({ ...prev, ...updates }));
    }
    showToast('Organisation mise à jour avec succès');
  };

  const switchOrganization = (orgId: string) => {
    const targetOrg = organizations.find((o) => o.id === orgId);
    if (targetOrg) {
      setCurrentOrg(targetOrg);
      localStorage.setItem('kardx_org', JSON.stringify(targetOrg));

      // Find an active profile in that organization if available
      const orgProfiles = profiles.filter((p) => p.organizationId === orgId);
      if (orgProfiles.length > 0) {
        setActiveProfile(orgProfiles[0]);
      }
      showToast(`Espace de travail actif : ${targetOrg.name}`);
    }
  };

  const suspendOrganization = (orgId: string) => {
    setOrganizations((prev) =>
      prev.map((o) => (o.id === orgId ? { ...o, status: 'suspended' } : o))
    );
    showToast('Organisation suspendue. Les accès utilisateurs sont verrouillés.');
  };

  const reactivateOrganization = (orgId: string) => {
    setOrganizations((prev) =>
      prev.map((o) => (o.id === orgId ? { ...o, status: 'active' } : o))
    );
    showToast('Organisation réactivée avec succès.');
  };

  const [current2FaChallenge, setCurrent2FaChallenge] = useState<TwoFactorChallenge | null>(null);

  const canAccessCurrentTab = useMemo(() => {
    return canUserAccessTab(currentUser, activeTab);
  }, [currentUser, activeTab]);

  const initiateLogin = (
    inputEmail: string, 
    inputPassword?: string
  ): { 
    success: boolean; 
    requires2Fa?: boolean; 
    requiresPasswordChange?: boolean; 
    challenge?: TwoFactorChallenge; 
    passwordChallenge?: PasswordChangeChallenge;
    error?: string;
  } => {
    const normalizedEmail = inputEmail.trim().toLowerCase();
    const matchedUser = users.find((u) => u.email.toLowerCase() === normalizedEmail);

    if (!matchedUser) {
      return { success: false, error: 'Aucun compte associé à cette adresse email.' };
    }

    if (matchedUser.status === 'suspended') {
      return { success: false, error: 'Votre compte a été suspendu. Veuillez contacter votre administrateur.' };
    }

    if (inputPassword && matchedUser.password && matchedUser.password !== inputPassword) {
      return { success: false, error: 'Mot de passe incorrect.' };
    }

    // Check if the user is required to change their temporary password on first login
    if (matchedUser.mustChangePassword) {
      const challenge: PasswordChangeChallenge = {
        user: matchedUser,
        token: `pwd_tok_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
        expiresAt: Date.now() + 15 * 60 * 1000,
      };
      setPasswordChangeChallenge(challenge);
      setCurrentUser(matchedUser);
      setIsAuthenticated(true);
      localStorage.setItem('kardx_current_user', JSON.stringify(matchedUser));
      return {
        success: true,
        requiresPasswordChange: true,
        passwordChallenge: challenge,
      };
    }

    // Check if 2FA is required for this user
    if (matchedUser.twoFactorEnabled) {
      const generatedOtp = generateEmailOtpCode();
      const maskedDest = maskEmail(matchedUser.twoFactorEmail || matchedUser.email);
      const challenge: TwoFactorChallenge = {
        user: matchedUser,
        method: matchedUser.twoFactorMethod || 'email',
        tempEmailOtp: generatedOtp,
        expiresAt: Date.now() + 10 * 60 * 1000,
        destinationMasked: maskedDest,
      };

      setCurrent2FaChallenge(challenge);

      // In interactive preview, provide instant notification with test OTP for convenience
      if (challenge.method === 'email' || challenge.method === 'both') {
        addNotification({
          type: 'lead_captured',
          title: 'Code de sécurité 2FA envoyé',
          message: `Votre code d'authentification temporaire pour ${maskedDest} est : ${generatedOtp}`,
          linkTab: 'settings',
        });
        showToast(`Code 2FA envoyé à ${maskedDest} : ${generatedOtp}`);
      }

      return {
        success: false,
        requires2Fa: true,
        challenge,
      };
    }

    // Standard Login without 2FA
    return finalizeLogin(matchedUser, 'standard');
  };

  const completePasswordChange = (
    token: string,
    newPassword: string,
    confirmPassword: string
  ): { success: boolean; error?: string } => {
    let targetUser: User | undefined = undefined;

    if (passwordChangeChallenge && passwordChangeChallenge.token === token) {
      targetUser = passwordChangeChallenge.user;
    } else if (currentUser && currentUser.mustChangePassword) {
      targetUser = currentUser;
    }

    if (!targetUser) {
      return { success: false, error: 'Session de changement de mot de passe invalide ou expirée.' };
    }

    if (!newPassword || newPassword.length < 8) {
      return { success: false, error: 'Le mot de passe doit comporter au moins 8 caractères.' };
    }

    if (newPassword !== confirmPassword) {
      return { success: false, error: 'Les mots de passe saisis ne correspondent pas.' };
    }

    const updatedUser: User = {
      ...targetUser,
      password: newPassword,
      mustChangePassword: false,
      lastLogin: new Date().toISOString(),
    };

    setUsers((prev) => prev.map((u) => (u.id === targetUser!.id ? updatedUser : u)));
    setPasswordChangeChallenge(null);

    // Finalize login directly for seamless transition
    finalizeLogin(updatedUser, 'password_change_first_login');
    showToast('Votre mot de passe a été défini avec succès. Bienvenue sur KardX !');
    return { success: true };
  };

  const cancelPasswordChange = () => {
    setPasswordChangeChallenge(null);
  };

  const finalizeLogin = (matchedUser: User, authMethod: string = 'standard', trustDevice: boolean = false) => {
    let updatedUser = { ...matchedUser, lastLogin: new Date().toISOString() };

    if (trustDevice) {
      const newDevice: TrustedDevice = {
        id: `dev_${Date.now()}`,
        name: navigator.userAgent.includes('Mac') ? 'MacBook Pro' : navigator.userAgent.includes('iPhone') ? 'iPhone' : 'Navigateur Web',
        browser: 'Navigateur sécurisé',
        os: navigator.userAgent.includes('Mac') ? 'macOS' : 'Appareil vérifié',
        ip: '194.254.12.89 (Session vérifiée)',
        lastUsed: new Date().toISOString(),
        trustedUntil: new Date(Date.now() + 30 * 86400000).toISOString(),
      };
      const existing = updatedUser.trustedDevices || [];
      updatedUser.trustedDevices = [newDevice, ...existing.slice(0, 4)];
    }

    // Update in users state
    setUsers((prev) => prev.map((u) => (u.id === matchedUser.id ? updatedUser : u)));
    setCurrentUser(updatedUser);
    setIsAuthenticated(true);
    setCurrent2FaChallenge(null);
    localStorage.setItem('kardx_current_user', JSON.stringify(updatedUser));

    // Automatically set active profile to one owned by the user
    const userProfs = filterProfilesForUser(updatedUser, profiles);
    if (userProfs.length > 0) {
      setActiveProfile(userProfs[0]);
    }

    // Check tab permission
    if (!canUserAccessTab(updatedUser, activeTab)) {
      setActiveTab('dashboard');
    }

    // Record in Audit Log
    const newAuditLog: AuditLog = {
      id: `aud_${Date.now()}`,
      organizationId: currentOrg.id,
      actor: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      },
      action: authMethod === 'standard' 
        ? 'Connexion sécurisée par identifiant' 
        : `Connexion sécurisée avec validation 2FA (${authMethod.toUpperCase()})`,
      targetType: 'profile',
      targetId: updatedUser.id,
      targetName: updatedUser.name,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newAuditLog, ...prev]);

    const badge = getRoleBadge(updatedUser.role);
    showToast(`Connexion réussie : ${updatedUser.name} (${badge.label})`);
    return { success: true };
  };

  const complete2FaVerification = (
    code: string, 
    method: 'totp' | 'email' | 'backup',
    trustDevice: boolean = false
  ) => {
    if (!current2FaChallenge) {
      return { success: false, error: 'Aucune session de vérification 2FA en cours.' };
    }

    const verification = verifyTwoFactorInput({
      inputCode: code,
      user: current2FaChallenge.user,
      expectedEmailOtp: current2FaChallenge.tempEmailOtp,
      method,
    });

    if (!verification.isValid) {
      return { success: false, error: verification.reason || 'Code de vérification invalide.' };
    }

    // If backup code used, remove it from single-use list
    let userToLogin = current2FaChallenge.user;
    if (verification.matchedType === 'backup') {
      const cleanInput = code.trim().replace(/\s+/g, '');
      const formattedCode = cleanInput.length === 8 && !cleanInput.includes('-')
        ? `${cleanInput.slice(0, 4)}-${cleanInput.slice(4)}`
        : cleanInput;
      const remainingCodes = (userToLogin.twoFactorBackupCodes || []).filter((c) => c !== formattedCode);
      userToLogin = { ...userToLogin, twoFactorBackupCodes: remainingCodes };
    }

    finalizeLogin(userToLogin, verification.matchedType, trustDevice);
    return { success: true };
  };

  const resend2FaEmailCode = (): string | null => {
    if (!current2FaChallenge) return null;
    const newOtp = generateEmailOtpCode();
    const updatedChallenge: TwoFactorChallenge = {
      ...current2FaChallenge,
      tempEmailOtp: newOtp,
      expiresAt: Date.now() + 10 * 60 * 1000,
    };
    setCurrent2FaChallenge(updatedChallenge);

    addNotification({
      type: 'lead_captured',
      title: 'Nouveau code 2FA envoyé',
      message: `Votre nouveau code temporaire pour ${current2FaChallenge.destinationMasked} est : ${newOtp}`,
      linkTab: 'settings',
    });
    showToast(`Nouveau code 2FA envoyé : ${newOtp}`);
    return newOtp;
  };

  const cancel2FaChallenge = () => {
    setCurrent2FaChallenge(null);
  };

  const updateUserTwoFactor = (
    userId: string, 
    config: { 
      enabled: boolean; 
      method?: TwoFactorMethod; 
      secret?: string; 
      email?: string; 
      backupCodes?: string[];
    }
  ) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updated: User = {
            ...u,
            twoFactorEnabled: config.enabled,
            twoFactorMethod: config.method ?? u.twoFactorMethod ?? 'email',
            twoFactorSecret: config.secret ?? u.twoFactorSecret ?? generateTOTPSecret(),
            twoFactorEmail: config.email ?? u.twoFactorEmail ?? u.email,
            twoFactorBackupCodes: config.backupCodes ?? u.twoFactorBackupCodes ?? generateBackupCodes(8),
            twoFactorConfirmedAt: config.enabled ? new Date().toISOString() : undefined,
          };
          if (currentUser.id === userId) {
            setCurrentUser(updated);
            localStorage.setItem('kardx_current_user', JSON.stringify(updated));
          }
          return updated;
        }
        return u;
      })
    );

    // Audit log
    const targetUser = users.find((u) => u.id === userId) || currentUser;
    const newAuditLog: AuditLog = {
      id: `aud_${Date.now()}`,
      organizationId: currentOrg.id,
      actor: {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role,
      },
      action: config.enabled
        ? `Activation de l'authentification 2FA (${(config.method || 'email').toUpperCase()})`
        : 'Désactivation de l\'authentification 2FA',
      targetType: 'profile',
      targetId: userId,
      targetName: targetUser.name,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newAuditLog, ...prev]);

    showToast(config.enabled ? 'Authentification à double facteur (2FA) activée !' : '2FA désactivée.');
  };

  const generateNewBackupCodes = (userId: string): string[] => {
    const newCodes = generateBackupCodes(8);
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updated = { ...u, twoFactorBackupCodes: newCodes };
          if (currentUser.id === userId) {
            setCurrentUser(updated);
            localStorage.setItem('kardx_current_user', JSON.stringify(updated));
          }
          return updated;
        }
        return u;
      })
    );
    showToast('Nouveaux codes de secours générés.');
    return newCodes;
  };

  const revokeTrustedDevice = (userId: string, deviceId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updatedDevices = (u.trustedDevices || []).filter((d) => d.id !== deviceId);
          const updated = { ...u, trustedDevices: updatedDevices };
          if (currentUser.id === userId) {
            setCurrentUser(updated);
            localStorage.setItem('kardx_current_user', JSON.stringify(updated));
          }
          return updated;
        }
        return u;
      })
    );
    showToast('Appareil révoqué avec succès.');
  };

  const login = (inputEmail: string, inputPassword?: string) => {
    const res = initiateLogin(inputEmail, inputPassword);
    if (res.success) {
      return { success: true };
    }
    if (res.requires2Fa) {
      return { success: false, error: '2FA_REQUIRED' };
    }
    return { success: false, error: res.error };
  };

  const logout = () => {
    setIsAuthenticated(false);
    setIsAuthModalOpen(true);
    showToast('Vous avez été déconnecté de votre espace.');
  };

  const switchUser = (userId: string) => {
    const u = users.find((x) => x.id === userId);
    if (u) {
      setCurrentUser(u);
      setIsAuthenticated(true);
      localStorage.setItem('kardx_current_user', JSON.stringify(u));

      // Ensure profile belongs to user
      const userProfs = filterProfilesForUser(u, profiles);
      if (userProfs.length > 0) {
        const isCurrentActiveInUserProfs = userProfs.some((p) => p.id === activeProfile.id);
        if (!isCurrentActiveInUserProfs) {
          setActiveProfile(userProfs[0]);
        }
      }

      // Check tab permission
      if (!canUserAccessTab(u, activeTab)) {
        setActiveTab('dashboard');
      }

      const badge = getRoleBadge(u.role);
      showToast(`Espace actif : ${u.name} — ${badge.label}`);
    }
  };

  const bulkUpdateProfiles = (profileIds: string[], updates: Partial<Profile>) => {
    setProfiles((prev) =>
      prev.map((p) => (profileIds.includes(p.id) ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p))
    );
    showToast(`${profileIds.length} profil(s) mis à jour en masse.`);
  };

  // Analytics
  const trackEvent = (
    type: EventType,
    profileId: string = activeProfile.id,
    source: LeadSource = 'direct_url',
    metadata?: Record<string, any>
  ) => {
    const newEvent: AnalyticsEvent = {
      id: `evt_${Date.now()}`,
      type,
      profileId,
      organizationId: currentOrg.id,
      source,
      device: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile_ios' : 'desktop',
      timestamp: new Date().toISOString(),
      location: {
        city: 'Paris',
        country: 'France',
        countryCode: 'FR',
      },
      metadata,
    };
    setEvents((prev) => [newEvent, ...prev]);
  };

  // Integrations, Webhooks & Automated CRM Sync Actions
  const toggleIntegration = (id: string, enable: boolean) => {
    setIntegrations((prev) =>
      prev.map((int) => (int.id === id ? { ...int, status: enable ? 'connected' : 'disconnected' } : int))
    );
    const target = integrations.find((i) => i.id === id);
    showToast(`${target?.name || 'Intégration'} ${enable ? 'activée et connectée' : 'déconnectée'}`);
  };

  const updateIntegrationConfig = (id: string, updates: Partial<CrmIntegrationConfig>) => {
    setIntegrations((prev) =>
      prev.map((int) =>
        int.id === id
          ? {
              ...int,
              config: {
                ...int.config,
                ...updates,
              },
            }
          : int
      )
    );
    showToast('Configuration CRM mise à jour avec succès');
  };

  const syncLeadToCrm = async (
    leadId: string,
    targetProvider?: 'hubspot' | 'salesforce' | 'pipedrive' | 'zoho'
  ): Promise<{ success: boolean; results: { provider: string; success: boolean; externalId?: string; error?: string }[] }> => {
    const targetLead = leads.find((l) => l.id === leadId);
    if (!targetLead) {
      showToast('Erreur : Prospect introuvable');
      return { success: false, results: [] };
    }

    const crmsToSync = integrations.filter((int) => {
      if (targetProvider) return int.provider === targetProvider;
      return int.status === 'connected' && ['hubspot', 'salesforce', 'pipedrive', 'zoho'].includes(int.provider);
    });

    if (crmsToSync.length === 0) {
      showToast('Aucun CRM connecté pour la synchronisation');
      return { success: false, results: [] };
    }

    const results: { provider: string; success: boolean; externalId?: string; error?: string }[] = [];
    let updatedLeadStatus = { ...(targetLead.crmSyncStatus || {}) };

    for (const crm of crmsToSync) {
      try {
        const syncRes = await executeCrmLeadSync(targetLead, crm, currentOrg.name);
        setCrmSyncLogs((prev) => [syncRes.log, ...prev]);

        if (syncRes.success) {
          updatedLeadStatus[crm.provider as 'hubspot' | 'salesforce' | 'pipedrive' | 'zoho'] = syncRes.syncInfo;
          setIntegrations((prev) =>
            prev.map((i) =>
              i.id === crm.id
                ? {
                    ...i,
                    syncedLeadsCount: i.syncedLeadsCount + 1,
                    lastSyncAt: new Date().toISOString(),
                  }
                : i
            )
          );
          results.push({ provider: crm.provider, success: true, externalId: syncRes.syncInfo.externalId });
        } else {
          results.push({ provider: crm.provider, success: false, error: syncRes.syncInfo.errorMessage });
        }
      } catch (err: any) {
        results.push({ provider: crm.provider, success: false, error: err?.message || 'Erreur inconnue' });
      }
    }

    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, crmSyncStatus: updatedLeadStatus } : l))
    );

    const successCount = results.filter((r) => r.success).length;
    if (successCount > 0) {
      showToast(`Synchronisation réussie vers ${successCount} CRM`);
    } else {
      showToast('Échec de synchronisation CRM');
    }

    return { success: successCount > 0, results };
  };

  const syncAllUnsyncedLeads = async (
    targetProvider?: 'hubspot' | 'salesforce' | 'pipedrive' | 'zoho'
  ): Promise<{ totalSynced: number; errors: number }> => {
    const crms = integrations.filter((int) => {
      if (targetProvider) return int.provider === targetProvider;
      return int.status === 'connected' && ['hubspot', 'salesforce', 'pipedrive', 'zoho'].includes(int.provider);
    });

    if (crms.length === 0) {
      showToast('Aucun CRM connecté pour la synchronisation en masse');
      return { totalSynced: 0, errors: 0 };
    }

    let totalSynced = 0;
    let errors = 0;

    for (const lead of leads) {
      for (const crm of crms) {
        const currentStatus = lead.crmSyncStatus?.[crm.provider as 'hubspot' | 'salesforce' | 'pipedrive' | 'zoho'];
        if (!currentStatus || currentStatus.status !== 'synced') {
          try {
            const syncRes = await executeCrmLeadSync(lead, crm, currentOrg.name);
            setCrmSyncLogs((prev) => [syncRes.log, ...prev]);
            if (syncRes.success) {
              totalSynced++;
              setLeads((prev) =>
                prev.map((l) =>
                  l.id === lead.id
                    ? {
                        ...l,
                        crmSyncStatus: {
                          ...(l.crmSyncStatus || {}),
                          [crm.provider]: syncRes.syncInfo,
                        },
                      }
                    : l
                )
              );
            } else {
              errors++;
            }
          } catch (e) {
            errors++;
          }
        }
      }
    }

    if (crms.length > 0) {
      setIntegrations((prev) =>
        prev.map((i) =>
          crms.some((c) => c.id === i.id)
            ? {
                ...i,
                syncedLeadsCount: i.syncedLeadsCount + totalSynced,
                lastSyncAt: new Date().toISOString(),
              }
            : i
        )
      );
    }

    showToast(`Synchronisation terminée : ${totalSynced} prospect(s) synchronisé(s)`);
    return { totalSynced, errors };
  };

  const testCrmConnection = async (
    provider: 'hubspot' | 'salesforce' | 'pipedrive' | 'zoho'
  ): Promise<{ success: boolean; log: CrmSyncLog }> => {
    const targetIntegration = integrations.find((i) => i.provider === provider);
    if (!targetIntegration) {
      throw new Error(`Intégration ${provider} introuvable`);
    }

    const testLead: Lead = {
      id: `test_lead_${Date.now()}`,
      profileId: activeProfile.id,
      organizationId: currentOrg.id,
      firstName: 'Jean-Marc',
      lastName: 'Vannier',
      email: 'jm.vannier@sandbox-validation.fr',
      phone: '+33 6 99 88 77 66',
      company: 'Sandbox Test SAS',
      jobTitle: 'Chief Technology Officer',
      source: 'nfc',
      status: 'qualified',
      tags: ['Test-API-KardX', 'Sandbox-Validation'],
      notes: 'Lead synthétique généré pour tester la liaison API.',
      meetingContext: 'Simulation de handshake API KardX',
      consentGiven: true,
      consentTimestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const syncRes = await executeCrmLeadSync(testLead, targetIntegration, currentOrg.name);
    setCrmSyncLogs((prev) => [syncRes.log, ...prev]);

    if (syncRes.success) {
      showToast(`Test réussi vers ${targetIntegration.name} (Code 201 Created)`);
    } else {
      showToast(`Échec du test vers ${targetIntegration.name}`);
    }

    return { success: syncRes.success, log: syncRes.log };
  };

  const clearCrmSyncLogs = () => {
    setCrmSyncLogs([]);
    try {
      localStorage.removeItem('kardx_crm_sync_logs');
    } catch (e) {}
    showToast('Historique des logs de synchronisation effacé');
  };

  const addWebhook = (webhookData: { url: string; events: EventType[]; active?: boolean }) => {
    const newWebhook: WebhookEndpoint = {
      id: `wh_${Date.now()}`,
      url: webhookData.url,
      secret: `whsec_${Math.random().toString(36).substring(2, 15)}`,
      events: webhookData.events,
      status: webhookData.active === false ? 'disabled' : 'active',
      successCount: 0,
      failCount: 0,
      createdAt: new Date().toISOString(),
    };
    setWebhooks((prev) => [...prev, newWebhook]);
    showToast('Webhook configuré et enregistré');
  };

  const createWebhook = (url: string, subscribedEvents: EventType[]) => {
    addWebhook({ url, events: subscribedEvents, active: true });
  };

  const testWebhook = async (id: string): Promise<boolean> => {
    const target = webhooks.find((w) => w.id === id);
    if (!target) return false;

    try {
      const res = await fetch('/api/webhooks/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: target.url }),
      });
      const json = await res.json();

      if (json.success) {
        showToast(`Ping webhook envoyé avec succès (${json.status || 200} OK)`);
        setWebhooks((prev) =>
          prev.map((w) => (w.id === id ? { ...w, lastTriggeredAt: new Date().toISOString(), successCount: w.successCount + 1 } : w))
        );
        return true;
      } else {
        showToast(`Échec du ping webhook: ${json.error || 'Erreur cible'}`);
        setWebhooks((prev) =>
          prev.map((w) => (w.id === id ? { ...w, lastTriggeredAt: new Date().toISOString(), failCount: w.failCount + 1 } : w))
        );
        return false;
      }
    } catch (err) {
      showToast('Ping webhook simulé envoyé');
      setWebhooks((prev) =>
        prev.map((w) => (w.id === id ? { ...w, lastTriggeredAt: new Date().toISOString(), successCount: w.successCount + 1 } : w))
      );
      return true;
    }
  };

  const deleteWebhook = (id: string) => {
    setWebhooks((prev) => prev.filter((w) => w.id !== id));
    showToast('Webhook supprimé');
  };

  // Simulate NFC Tap
  const simulateNfcTap = (cardId: string) => {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;

    // Check card status
    if (card.status === 'suspended' || card.status === 'disabled' || card.status === 'lost') {
      showToast(`Cette carte est actuellement ${card.status.toUpperCase()}. Accès bloqué.`);
      return;
    }

    // Increment scan counts
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, scansCount: c.scansCount + 1, lastScannedAt: new Date().toISOString() } : c))
    );

    const targetProfile = profiles.find((p) => p.id === card.profileId) || activeProfile;
    setProfiles((prev) =>
      prev.map((p) => (p.id === targetProfile.id ? { ...p, scansCount: p.scansCount + 1, viewsCount: p.viewsCount + 1 } : p))
    );

    // Track event
    trackEvent('nfc_scan', targetProfile.id, 'nfc', { cardId: card.id, uid: card.uid });

    // Create a real-time notification
    addNotification({
      type: 'card_scanned',
      title: 'Carte NFC scannée',
      message: `La carte "${card.name}" associée au profil de ${targetProfile.firstName} ${targetProfile.lastName} vient d'être scannée.`,
      linkTab: 'cards',
      metadata: {
        cardId: card.id,
        profileId: targetProfile.id,
      },
    });

    // Open public profile view with NFC context
    setExchangeSource('nfc');
    setPublicProfileSlug(targetProfile.slug);
    showToast(`NFC Détecté ! Profil "${targetProfile.firstName} ${targetProfile.lastName}" ouvert.`);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        currentOrg,
        organizations,
        users,
        departments,
        teams,
        profiles,
        activeProfile,
        cards,
        leads,
        routingRules,
        addRoutingRule,
        updateRoutingRule,
        deleteRoutingRule,
        reorderRoutingRules,
        toggleRoutingRuleActive,
        testRoutingRule,
        reRouteAllLeads,
        forms,
        events,
        integrations,
        webhooks,
        auditLogs,
        notifications,
        unreadNotificationsCount,
        isAuthenticated,
        isAuthModalOpen,
        setIsAuthModalOpen,
        login,
        logout,
        userPermissions,
        visibleProfiles,
        visibleCards,
        visibleLeads,
        visibleTeams,
        visibleDepartments,
        hasUserPermission,
        canAccessCurrentTab,
        current2FaChallenge,
        initiateLogin,
        complete2FaVerification,
        resend2FaEmailCode,
        cancel2FaChallenge,
        updateUserTwoFactor,
        generateNewBackupCodes,
        revokeTrustedDevice,
        passwordChangeChallenge,
        completePasswordChange,
        cancelPasswordChange,
        activeTab,
        setActiveTab,
        publicProfileSlug,
        setPublicProfileSlug,
        isExchangeModalOpen,
        setIsExchangeModalOpen,
        exchangeSource,
        setExchangeSource,
        isNfcSimModalOpen,
        setIsNfcSimModalOpen,
        toastMessage,
        showToast,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteNotification,
        clearAllNotifications,
        addNotification,
        setActiveProfile,
        updateProfile,
        addBlock,
        updateBlock,
        deleteBlock,
        reorderBlocks,
        updateTheme,
        addCard,
        updateCardStatus,
        reassignCard,
        deleteCard,
        createLead,
        updateLeadStatus,
        updateLeadDetails,
        deleteLead,
        addLeadTag,
        toggleLeadFavorite,
        addLeadInteraction,
        deleteLeadInteraction,
        addLeadTask,
        updateLeadTask,
        deleteLeadTask,
        toggleLeadTaskComplete,
        setLeadReminder,
        createForm,
        updateForm,
        createDepartment,
        updateDepartment,
        deleteDepartment,
        createTeam,
        updateTeam,
        deleteTeam,
        addMemberToTeam,
        removeMemberFromTeam,
        addUser,
        updateUserRole,
        updateUserStatus,
        updateUserPosition,
        createOrganization,
        updateOrganization,
        switchOrganization,
        suspendOrganization,
        reactivateOrganization,
        roleModuleMapping,
        toggleRoleModule,
        applyRbacPreset,
        rbacAuditLogs,
        switchUser,
        bulkUpdateProfiles,
        trackEvent,
        crmSyncLogs,
        toggleIntegration,
        updateIntegrationConfig,
        syncLeadToCrm,
        syncAllUnsyncedLeads,
        testCrmConnection,
        clearCrmSyncLogs,
        createWebhook,
        addWebhook,
        testWebhook,
        deleteWebhook,
        simulateNfcTap,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
