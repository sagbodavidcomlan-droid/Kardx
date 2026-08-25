import { Profile, Organization, LandingPageConfig, LandingHeroLayout } from '../types';

export const VANITY_DOMAINS = [
  { id: 'kardx_p', label: 'kardx.io/p/', prefix: 'https://kardx.io/p/', isDefault: true, badge: 'Standard Rapide' },
  { id: 'kardx_pro', label: 'kardx.pro/', prefix: 'https://kardx.pro/', badge: 'Pro & Direction' },
  { id: 'card_org', label: 'card.bestexperts.fr/', prefix: 'https://card.bestexperts.fr/', badge: 'Domaine Entreprise' },
  { id: 'meet_bio', label: 'meet.bio/', prefix: 'https://meet.bio/', badge: 'Lien Minimaliste' },
  { id: 'custom', label: 'Domaine Personnalisé (DNS CNAME)', prefix: 'https://', badge: 'Whitelabel' },
];

export const HERO_LAYOUTS: Array<{
  id: LandingHeroLayout;
  title: string;
  badge: string;
  description: string;
  recommendedFor: string;
  iconName: string;
}> = [
  {
    id: 'executive_showcase',
    title: 'Direction & C-Suite Prestige',
    badge: 'Recommandé',
    description: 'En-tête haute stature, badge de vérification officiel, pitch percutant et actions prioritaires (RDV + vCard immédiat).',
    recommendedFor: 'DG, Associés, Directeurs Commerciaux, Consultants Seniors',
    iconName: 'ShieldCheck',
  },
  {
    id: 'modern_bento',
    title: 'Bento Grid Moderne',
    badge: 'Tendance UI',
    description: 'Grille dynamique modulaire mettant en valeur le pitch vidéo, les offres phares, les réseaux sociaux et la prise de contact.',
    recommendedFor: 'Startups, Tech, Agences Créatives, Product Leaders',
    iconName: 'LayoutGrid',
  },
  {
    id: 'lead_magnet',
    title: 'Conversion & Lead Magnet',
    badge: 'Haute Performance',
    description: 'Formulaire d\'échange de coordonnées et réservation de créneau intégrés directement dans le hero pour maximiser les prises de contact.',
    recommendedFor: 'Business Developers, Sales B2B, Salons Professionnels',
    iconName: 'Zap',
  },
  {
    id: 'minimal_biolink',
    title: 'Bio-Link Épuré & Mobile First',
    badge: 'Ultra Rapide',
    description: 'Structure épurée avec boutons d\'action rapides, liens sociaux et accès direct aux messageries instantanées (WhatsApp, Tel, Email).',
    recommendedFor: 'Créateurs, Dirigeants nomades, Conférenciers',
    iconName: 'Smartphone',
  },
  {
    id: 'services_portfolio',
    title: 'Portfolio & Catalogue d\'Offres',
    badge: 'B2B & Prestations',
    description: 'Mise en avant riche des services avec tarifs indicatifs, plaquettes PDF à télécharger et témoignages clients certifiés.',
    recommendedFor: 'Cabinets de Conseil, Freelances, Avocats, Architectes',
    iconName: 'Briefcase',
  },
];

export function sanitizeVanitySlug(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9-_.]/g, '-') // replace forbidden chars with -
    .replace(/--+/g, '-') // remove consecutive dashes
    .replace(/^-+|-+$/g, ''); // trim dashes from ends
}

export function getSlugSuggestions(profile: Profile, org?: Organization): string[] {
  const f = sanitizeVanitySlug(profile.firstName || 'user');
  const l = sanitizeVanitySlug(profile.lastName || 'pro');
  const o = org?.slug || sanitizeVanitySlug(profile.company || 'kardx');

  const list = [
    `${f}-${l}`,
    `${f}.${l}`,
    `${f[0] || ''}${l}`,
    `${f}-${o}`,
    `pro.${f}`,
    `contact-${f}`,
  ];

  return Array.from(new Set(list)).filter(Boolean);
}

export function getDefaultLandingPageConfig(profile: Profile, org?: Organization): LandingPageConfig {
  const vanitySlug = profile.slug || sanitizeVanitySlug(`${profile.firstName}-${profile.lastName}`);
  
  return {
    vanityDomain: 'kardx.io/p/',
    vanitySlug,
    customDomain: '',
    pageHeadline: profile.headline || 'Accélérateur de Croissance & Partenariats Stratégiques',
    pageTagline: profile.bio || "J'accompagne les entreprises et décideurs dans leur transformation et le développement d'alliances à fort impact.",
    heroLayout: 'executive_showcase',
    primaryCtaLabel: 'Prendre Rendez-vous',
    primaryCtaType: 'booking',
    primaryCtaUrl: profile.contacts.bookingUrl || 'https://calendly.com/david-sagbo/discovery',
    secondaryCtaLabel: 'Enregistrer le contact (vCard)',
    secondaryCtaType: 'vcard',
    pitchBullets: [
      {
        id: 'bullet_1',
        icon: 'Award',
        title: 'Expertise & Stratégie B2B',
        subtitle: '+10 ans d\'expérience dans le développement commercial et la gouvernance de partenariats.',
      },
      {
        id: 'bullet_2',
        icon: 'Zap',
        title: 'Accompagnement Express',
        subtitle: 'Diagnostic ciblé et mise en relation directe avec les décideurs clés de l\'écosystème.',
      },
      {
        id: 'bullet_3',
        icon: 'ShieldCheck',
        title: 'Garantie d\'Excellence',
        subtitle: 'Process certifié ISO et méthodologie éprouvée auprès de 50+ grands comptes.',
      },
    ],
    trustBadges: [
      { id: 'badge_1', label: 'Clients & Partenaires', value: '500+' },
      { id: 'badge_2', label: 'Satisfaction Avis', value: '★ 4.9/5' },
      { id: 'badge_3', label: 'Taux de Recommandation', value: '98%' },
    ],
    showFloatingContactBar: true,
    showDirectLeadForm: true,
    showServicesGrid: true,
    showTestimonials: true,
    showVideoPitch: true,
    showDocumentsDownload: true,
    showLocationMap: true,
    showSocialProofCounter: true,
    seoTitle: `${profile.firstName} ${profile.lastName} • ${profile.headline} | ${profile.company || org?.name || 'KardX'}`,
    seoDescription: `Consultez le profil digital officiel et la page de présentation de ${profile.firstName} ${profile.lastName}. Réservez un entretien, téléchargez la fiche de contact et découvrez nos offres.`,
    ogImageUrl: profile.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80',
    noIndex: false,
    isPublished: true,
    publishedAt: new Date().toISOString(),
  };
}

export function computePublicLandingUrl(config: LandingPageConfig, originUrl?: string): string {
  const origin = originUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://kardx.io');
  const slug = config.vanitySlug || 'profile';

  if (config.vanityDomain === 'custom' && config.customDomain) {
    const cleanDomain = config.customDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    return `https://${cleanDomain}`;
  }

  if (config.vanityDomain === 'kardx.pro/') {
    return `https://kardx.pro/${slug}`;
  }

  if (config.vanityDomain === 'card.bestexperts.fr/') {
    return `https://card.bestexperts.fr/${slug}`;
  }

  if (config.vanityDomain === 'meet.bio/') {
    return `https://meet.bio/${slug}`;
  }

  return `${origin}/p/${slug}`;
}
