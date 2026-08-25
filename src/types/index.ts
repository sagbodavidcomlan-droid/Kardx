export type UserRole = 'super_admin' | 'admin' | 'manager' | 'collaborateur' | 'viewer';

export type ModuleCategory = 'core' | 'identity' | 'growth' | 'tools' | 'admin';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface ModuleCapability {
  id: string;
  name: string;
  description: string;
  key?: keyof UserPermissions;
  risk: RiskLevel;
}

export interface PlatformModule {
  id: string;
  name: string;
  shortName: string;
  description: string;
  category: ModuleCategory;
  icon: string;
  riskLevel: RiskLevel;
  tabId: string;
  governingPermission?: keyof UserPermissions;
  capabilities?: ModuleCapability[];
}

export type RoleModuleMapping = Record<string, string[]>;

export type RolePermissionMapping = Record<string, UserPermissions>;

export interface CustomRole {
  id: string;
  name: string;
  description: string;
  badgeColor: string;
  baseRole: UserRole;
  isSystem: boolean;
  createdAt: string;
  allowedModules: string[];
}

export interface RbacAuditLog {
  id: string;
  timestamp: string;
  actorName: string;
  actorEmail: string;
  action: 'ROLE_MODULE_TOGGLE' | 'PRESET_APPLIED' | 'ROLE_CREATED' | 'ROLE_DELETED' | 'USER_OVERRIDE' | 'RBAC_RESET';
  targetRole?: string;
  targetModule?: string;
  description: string;
}

export interface RbacPreset {
  id: string;
  name: string;
  description: string;
  badge: string;
  icon: string;
  roleModuleMapping: RoleModuleMapping;
}

export type TwoFactorMethod = 'totp' | 'email' | 'both';

export interface TrustedDevice {
  id: string;
  name: string;
  browser: string;
  os: string;
  ip: string;
  lastUsed: string;
  trustedUntil: string;
}

export interface TwoFactorChallenge {
  user: User;
  method: TwoFactorMethod;
  tempEmailOtp?: string;
  expiresAt: number;
  destinationMasked: string;
}

export interface PasswordChangeChallenge {
  user: User;
  token: string;
  expiresAt: number;
}

export interface UserPermissions {
  canAccessSuperAdmin: boolean;
  canManageOrganization: boolean;
  canManageTeam: boolean;
  canViewAllLeads: boolean;
  canManageAllCards: boolean;
  canManageIntegrations: boolean;
  canManageForms: boolean;
  canBulkEditProfiles: boolean;
  canExportData: boolean;
  canAccessAnalytics: boolean;
  canUseAiScanner: boolean;
}

export type PlanType = 'free' | 'pro' | 'business' | 'enterprise';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: UserRole;
  password?: string;
  teamId?: string;
  departmentId?: string;
  organizationId: string;
  status: 'active' | 'invited' | 'suspended';
  createdAt: string;
  lastLogin?: string;
  phone?: string;
  jobTitle?: string;
  position?: string; // Intitulé de fonction / Poste (ex. Directeur Commercial)
  mustChangePassword?: boolean; // Mot de passe temporaire à changer obligatoirement à la 1ère connexion
  passwordChangeToken?: string;
  customPermissions?: Partial<UserPermissions>;
  // 2FA Security properties
  twoFactorEnabled?: boolean;
  twoFactorMethod?: TwoFactorMethod;
  twoFactorSecret?: string;
  twoFactorEmail?: string;
  twoFactorBackupCodes?: string[];
  twoFactorConfirmedAt?: string;
  trustedDevices?: TrustedDevice[];
}

export interface Organization {
  id: string;
  name: string;
  logoUrl?: string;
  domain?: string;
  slug?: string;
  plan: PlanType;
  primaryColor: string;
  status: 'active' | 'trial' | 'suspended';
  createdAt: string;
  seatsTotal: number;
  seatsUsed: number;
  usersCount?: number;
  adminEmail?: string;
  adminName?: string;
  trialEndsAt?: string;
  defaultTheme?: ProfileTheme;
  enabledModules?: string[]; // Allowed platform module IDs for this organization
  departmentsCount?: number;
  teamsCount?: number;
}

export interface Department {
  id: string;
  name: string;
  organizationId: string;
  headUserId?: string; // Responsable du département
  description?: string;
  createdAt: string;
}

export interface Team {
  id: string;
  name: string;
  organizationId: string;
  departmentId?: string; // Rattachée à un département
  managerId?: string; // Responsable d'équipe (optionnel)
  membersCount: number;
  description?: string;
  createdAt: string;
}

export interface ContactInfo {
  phone?: string;
  mobile?: string;
  whatsapp?: string;
  email: string;
  secondaryEmail?: string;
  website?: string;
  address?: {
    street?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    googleMapsUrl?: string;
  };
  bookingUrl?: string; // Calendly, SavvyCal, etc.
}

export interface SocialLink {
  id: string;
  platform: 'linkedin' | 'twitter' | 'instagram' | 'github' | 'youtube' | 'tiktok' | 'facebook' | 'telegram' | 'discord' | 'whatsapp' | 'threads' | 'behance' | 'dribbble' | 'custom';
  url: string;
  label?: string;
  iconName?: string;
  clicks?: number;
}

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  price?: string;
  badge?: string;
  buttonLabel?: string;
  buttonUrl?: string;
  icon?: string;
}

export interface DocumentItem {
  id: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileType: 'pdf' | 'docx' | 'presentation' | 'catalog';
  fileSize?: string;
  downloadCount?: number;
}

export interface LinkButton {
  id: string;
  label: string;
  url: string;
  subtext?: string;
  icon?: string;
  style?: 'solid' | 'outline' | 'glass' | 'glow';
  highlight?: boolean;
}

export interface TestimonialItem {
  id: string;
  authorName: string;
  authorRole: string;
  company: string;
  avatarUrl?: string;
  quote: string;
  rating: number;
}

export type BlockType = 
  | 'actions'
  | 'about'
  | 'services'
  | 'links'
  | 'video'
  | 'gallery'
  | 'documents'
  | 'booking'
  | 'map'
  | 'testimonials'
  | 'badges';

export interface ProfileBlock {
  id: string;
  type: BlockType;
  title?: string;
  visible: boolean;
  order: number;
  payload: {
    text?: string;
    videoUrl?: string;
    videoProvider?: 'youtube' | 'vimeo' | 'loom';
    services?: ServiceItem[];
    documents?: DocumentItem[];
    links?: LinkButton[];
    images?: string[];
    testimonials?: TestimonialItem[];
    badges?: Array<{ id: string; label: string; icon: string; value: string }>;
    mapData?: {
      address: string;
      city: string;
      country: string;
      coordinates?: { lat: number; lng: number };
    };
    bookingData?: {
      provider: 'calendly' | 'savvycal' | 'custom';
      url: string;
      title: string;
      description?: string;
    };
  };
}

export type TemplateCategory = 
  | 'all' 
  | 'company_official' 
  | 'executive' 
  | 'tech_saas' 
  | 'finance_consulting' 
  | 'creative_agency' 
  | 'health_eco' 
  | 'luxury_vip';

export interface CardTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  categoryLabel: string;
  description: string;
  bestFor: string;
  badge?: string;
  isOfficial?: boolean;
  isCustom?: boolean;
  theme: ProfileTheme;
  previewThumbnail?: string;
  tags: string[];
  recommendedIndustry: string;
  popularityScore?: number;
  createdAt?: string;
}

export interface QRCustomizationConfig {
  centerLogoUrl?: string;
  logoShape?: 'circle' | 'square' | 'rounded';
  logoSize?: 'small' | 'medium' | 'large';
  logoBgColor?: string;
  enableGradient?: boolean;
  gradientType?: 'linear_vertical' | 'linear_horizontal' | 'linear_diagonal' | 'radial';
  gradientStartColor?: string;
  gradientEndColor?: string;
  dotColor?: string;
  bgColor?: string;
  transparentBg?: boolean;
  frameText?: string;
  dotStyle?: 'square' | 'dots' | 'rounded';
}

export interface ProfileTheme {
  preset: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  cardBackground: string;
  textColor: string;
  mutedTextColor: string;
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  buttonStyle: 'rounded' | 'pill' | 'sharp' | 'glass';
  fontFamily: 'Plus Jakarta Sans' | 'Outfit' | 'Space Grotesk' | 'Inter' | 'Playfair Display' | 'DM Sans';
  headerLayout: 'cover_avatar' | 'centered_card' | 'split_modern' | 'minimalist';
  coverImageUrl?: string;
  patternOverlay?: 'none' | 'dots' | 'grid' | 'mesh' | 'waves';
  darkMode: boolean;
  qrCustomization?: QRCustomizationConfig;
}

export type LandingHeroLayout = 
  | 'executive_showcase' 
  | 'modern_bento' 
  | 'lead_magnet' 
  | 'minimal_biolink' 
  | 'services_portfolio';

export interface LandingPitchBullet {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
}

export interface LandingTrustBadge {
  id: string;
  label: string;
  value: string;
}

export interface LandingPageConfig {
  vanityDomain: string; // e.g. 'kardx.io/p/', 'kardx.pro/', 'card.bestexperts.fr/', 'meet.bio/', 'custom'
  vanitySlug: string; // e.g. 'david.sagbo'
  customDomain?: string; // e.g. 'connect.davidsagbo.fr'
  pageHeadline?: string; // Custom Landing Page Headline
  pageTagline?: string; // Custom Landing Page Sub-headline / Pitch
  heroLayout: LandingHeroLayout;
  primaryCtaLabel?: string;
  primaryCtaType: 'booking' | 'exchange' | 'vcard' | 'phone' | 'email' | 'custom_url';
  primaryCtaUrl?: string;
  secondaryCtaLabel?: string;
  secondaryCtaType?: 'vcard' | 'exchange' | 'phone' | 'email' | 'none';
  pitchBullets?: LandingPitchBullet[];
  trustBadges?: LandingTrustBadge[];
  showFloatingContactBar: boolean;
  showDirectLeadForm: boolean;
  showServicesGrid: boolean;
  showTestimonials: boolean;
  showVideoPitch: boolean;
  showDocumentsDownload: boolean;
  showLocationMap: boolean;
  showSocialProofCounter: boolean;
  seoTitle?: string;
  seoDescription?: string;
  ogImageUrl?: string;
  noIndex?: boolean;
  isPublished?: boolean;
  publishedAt?: string;
}

export interface Profile {
  id: string;
  userId: string;
  organizationId: string;
  slug: string; // e.g. "david-sagbo" -> /p/david-sagbo
  firstName: string;
  lastName: string;
  headline: string; // e.g. "Directeur Business Development & Partenariats"
  company: string;
  department?: string;
  bio: string;
  avatarUrl?: string;
  logoUrl?: string;
  badgeVerified: boolean;
  locale: 'fr' | 'en';
  status: 'published' | 'draft' | 'archived';
  contacts: ContactInfo;
  socials: SocialLink[];
  theme: ProfileTheme;
  blocks: ProfileBlock[];
  formId?: string; // Associated lead capture form
  seoTitle?: string;
  seoDescription?: string;
  noIndex?: boolean;
  publishedAt?: string;
  updatedAt: string;
  viewsCount: number;
  scansCount: number;
  leadsCount: number;
  exchangeCtaLabel?: string;
  enableVcardDownload: boolean;
  enableFloatingCta: boolean;
  landingPage?: LandingPageConfig;
}

export type CardStatus = 'active' | 'pending' | 'suspended' | 'lost' | 'replaced' | 'disabled';
export type CardMaterial = 'metal_black' | 'metal_silver' | 'metal_gold' | 'wood_bamboo' | 'pvc_matte' | 'qr_stand' | 'virtual';

export interface PhysicalCard {
  id: string;
  uid: string; // NFC UID e.g. "04:A2:3F:89:C1"
  token: string; // Dynamic redirect token e.g. "krd_8921f01"
  material: CardMaterial;
  name: string; // e.g. "Carte Métal Noire - David"
  profileId: string;
  organizationId: string;
  status: CardStatus;
  scansCount: number;
  lastScannedAt?: string;
  createdAt: string;
  assignedToUser?: string;
  notes?: string;
}

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost';
export type LeadSource = 
  | 'nfc' 
  | 'qr' 
  | 'direct_url' 
  | 'email_signature' 
  | 'apple_wallet' 
  | 'google_wallet' 
  | 'card_scanner'
  | 'manual'
  | 'salon'
  | 'phone'
  | 'recommendation'
  | 'linkedin'
  | 'website';

export interface LeadInteraction {
  id: string;
  leadId: string;
  type: 'call' | 'email' | 'meeting' | 'whatsapp' | 'note' | 'event';
  title: string;
  notes: string;
  date: string; // ISO date of the interaction
  authorName?: string;
  createdAt: string;
}

export type LeadTaskType = 'call' | 'email' | 'meeting' | 'quote' | 'demo' | 'followup' | 'contract';
export type LeadTaskPriority = 'high' | 'medium' | 'low';
export type LeadTaskStatus = 'pending' | 'completed' | 'cancelled';

export interface LeadTask {
  id: string;
  leadId: string;
  type: LeadTaskType;
  title: string;
  dueDate: string; // ISO string
  priority: LeadTaskPriority;
  note?: string;
  status: LeadTaskStatus;
  assignedUserId?: string;
  createdAt: string;
  completedAt?: string;
  triggeredAlert?: boolean;
}

export interface Lead {
  id: string;
  profileId: string;
  organizationId: string;
  assignedUserId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  notes?: string;
  meetingContext?: string;
  source: LeadSource;
  status: LeadStatus;
  tags: string[];
  consentGiven: boolean;
  consentTimestamp: string;
  device?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
  updatedAt: string;
  customFields?: Record<string, string>;
  isFavorite?: boolean;
  reminderDate?: string;
  reminderNote?: string;
  reminderStatus?: 'pending' | 'triggered' | 'completed' | 'cancelled';
  tasks?: LeadTask[];
  interactions?: LeadInteraction[];
  routedByRuleId?: string;
  routedRuleName?: string;
  routedAt?: string;
  routedReason?: string;
  crmSyncStatus?: Partial<Record<'hubspot' | 'salesforce' | 'pipedrive' | 'zoho' | 'google_contacts', LeadCrmSyncInfo>>;
}

export interface LeadCrmSyncInfo {
  provider: 'hubspot' | 'salesforce' | 'pipedrive' | 'zoho' | 'google_contacts';
  status: 'synced' | 'failed' | 'pending';
  syncedAt: string;
  externalId?: string;
  dealId?: string;
  errorMessage?: string;
}

export interface CrmFieldMapping {
  kardxField: string;
  crmField: string;
  crmFieldLabel: string;
  isRequired?: boolean;
  defaultValue?: string;
}

export interface CrmSyncLog {
  id: string;
  timestamp: string;
  provider: 'hubspot' | 'salesforce' | 'pipedrive' | 'zoho';
  leadId: string;
  leadName: string;
  leadEmail: string;
  status: 'success' | 'error' | 'queued';
  statusCode: number;
  action: string;
  externalId?: string;
  requestPayload: Record<string, any>;
  responseBody?: Record<string, any>;
  durationMs: number;
  errorMessage?: string;
}

export interface CrmIntegrationConfig {
  webhookUrl?: string;
  apiKey?: string;
  accessToken?: string;
  refreshToken?: string;
  portalId?: string;
  instanceUrl?: string;
  companyDomain?: string;
  autoSyncNewLeads?: boolean;
  syncTags?: boolean;
  createDealOnSync?: boolean;
  dealPipeline?: string;
  dealStage?: string;
  dealAmount?: number;
  leadSourceValue?: string;
  fieldMappings?: CrmFieldMapping[];
  environment?: 'production' | 'sandbox';
  deduplicationStrategy?: 'email' | 'phone' | 'email_or_phone' | 'always_create';
  targetPipeline?: string;
}

export interface LeadRoutingRule {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  priority: number; // 1 = highest
  active: boolean;
  geographicKeywords: string[]; // e.g. ["Paris", "Île-de-France", "Lyon", "Abidjan", "Dakar", "Europe", "Afrique"]
  industryKeywords: string[]; // e.g. ["Tech", "SaaS", "Santé", "Pharma", "Fintech", "Banque", "Industrie", "Conseil"]
  jobTitleKeywords?: string[]; // e.g. ["Directeur", "CEO", "Partner", "VP", "Manager", "Acheteur"]
  targetUserId: string; // User ID of assigned team member
  targetTeamId?: string; // Optional team ID
  matchMode: 'any' | 'all'; // Whether to match ANY keyword or ALL keywords
  autoTags?: string[]; // Tags to automatically append
  statusOnAssign?: LeadStatus;
  autoReminderHours?: number; // e.g. 24 -> sets a reminder 24h later
  sendAlertNotification: boolean;
  matchesCount: number;
  lastMatchedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoutingTestResult {
  matched: boolean;
  rule?: LeadRoutingRule;
  targetUser?: User;
  matchedKeywords: {
    geographic: string[];
    industry: string[];
    jobTitle: string[];
  };
  reason: string;
}

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox';
  required: boolean;
  placeholder?: string;
  options?: string[]; // for select
  defaultValue?: string;
}

export interface LeadForm {
  id: string;
  organizationId: string;
  name: string;
  title: string;
  description: string;
  submitButtonText: string;
  successMessage: string;
  fields: FormField[];
  consentText: string;
  active: boolean;
  usedInProfilesCount: number;
  submissionsCount: number;
  createdAt: string;
}

export type EventType = 
  | 'profile_view'
  | 'nfc_scan'
  | 'qr_scan'
  | 'phone_click'
  | 'whatsapp_click'
  | 'email_click'
  | 'website_click'
  | 'social_click'
  | 'document_click'
  | 'booking_click'
  | 'contact_download'
  | 'exchange_open'
  | 'lead_created'
  | 'wallet_add'
  | 'share_copy';

export interface AnalyticsEvent {
  id: string;
  type: EventType;
  profileId: string;
  cardId?: string;
  organizationId: string;
  source: LeadSource;
  timestamp: string;
  device: 'mobile_ios' | 'mobile_android' | 'desktop' | 'tablet';
  browser?: string;
  location?: {
    city: string;
    country: string;
    countryCode: string;
  };
  metadata?: Record<string, any>;
}

export interface Integration {
  id: string;
  provider: 'hubspot' | 'salesforce' | 'pipedrive' | 'zoho' | 'zapier' | 'make' | 'n8n' | 'google_contacts' | 'webhook';
  name: string;
  icon: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSyncAt?: string;
  syncedLeadsCount: number;
  config: CrmIntegrationConfig;
}

export interface WebhookEndpoint {
  id: string;
  url: string;
  secret: string;
  events: EventType[];
  status: 'active' | 'disabled';
  lastTriggeredAt?: string;
  successCount: number;
  failCount: number;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  organizationId: string;
  actor: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
  action: string;
  targetType: 'profile' | 'card' | 'lead' | 'team' | 'user' | 'security' | 'integration';
  targetId: string;
  targetName: string;
  ipAddress?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export type NotificationType = 'card_scanned' | 'lead_captured' | 'qr_scanned' | 'lead_reminder' | 'system';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  linkTab?: string;
  metadata?: {
    leadId?: string;
    cardId?: string;
    profileId?: string;
    contactName?: string;
    company?: string;
  };
}
