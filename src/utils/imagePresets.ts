export interface ImagePreset {
  id: string;
  url: string;
  thumbnail?: string;
  title: string;
  category: string;
  tags: string[];
}

export interface ImageCategory {
  id: string;
  label: string;
  iconName?: string;
}

// ============================================================================
// 1. BANNIÈRES / COVERS PROFESSIONNELLES (POUR PROFIL MOBILE & CARTES)
// ============================================================================

export const BANNER_CATEGORIES: ImageCategory[] = [
  { id: 'all', label: 'Toutes les suggestions' },
  { id: 'corporate', label: 'Finance & Affaires' },
  { id: 'tech', label: 'Tech & Digital' },
  { id: 'luxury', label: 'Luxe & Élégance Sombre' },
  { id: 'creative', label: 'Créatif & Design' },
  { id: 'minimal', label: 'Minimaliste & Épuré' },
  { id: 'nature', label: 'Nature & RSE' },
  { id: 'architecture', label: 'Architecture & Ville' },
];

export const BANNER_PRESETS: ImagePreset[] = [
  // Corporate & Finance
  {
    id: 'ban_corp_1',
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=85',
    thumbnail: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=70',
    title: 'Tour d\'Affaires Verre & Ciel',
    category: 'corporate',
    tags: ['business', 'finance', 'verre', 'moderne', 'building', 'bleu'],
  },
  {
    id: 'ban_corp_2',
    url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1400&q=85',
    title: 'Salle de Conseil Direction',
    category: 'corporate',
    tags: ['bureau', 'boardroom', 'executive', 'meeting', 'sobre'],
  },
  {
    id: 'ban_corp_3',
    url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1400&q=85',
    title: 'Espace Collaboratif Moderne',
    category: 'corporate',
    tags: ['workspace', 'openspace', 'travail', 'mobilier', 'bois'],
  },
  {
    id: 'ban_corp_4',
    url: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=1400&q=85',
    title: 'Façade Architecturale Bleue',
    category: 'corporate',
    tags: ['bleu', 'géométrie', 'vitres', 'prestige', 'consulting'],
  },

  // Tech & Digital
  {
    id: 'ban_tech_1',
    url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1400&q=85',
    thumbnail: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=400&q=70',
    title: 'Flux Cybersécurité & Réseaux',
    category: 'tech',
    tags: ['cyber', 'neon', 'technologie', 'futur', 'donnees', 'bleu'],
  },
  {
    id: 'ban_tech_2',
    url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1400&q=85',
    title: 'Matrice Binaire & Code Vert',
    category: 'tech',
    tags: ['code', 'data', 'developpeur', 'saas', 'software'],
  },
  {
    id: 'ban_tech_3',
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=85',
    title: 'Composant Circuit & Microprocesseur',
    category: 'tech',
    tags: ['hardware', 'composant', 'ia', 'circuit', 'high-tech'],
  },
  {
    id: 'ban_tech_4',
    url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1400&q=85',
    title: 'Équipe Tech en Session Laptop',
    category: 'tech',
    tags: ['startup', 'equipe', 'ordinateur', 'code', 'collaboration'],
  },

  // Luxe & Élégance Sombre
  {
    id: 'ban_lux_1',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1400&q=85',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=70',
    title: 'Ondes Marbre & Noir Abyssal',
    category: 'luxury',
    tags: ['luxe', 'marbre', 'noir', 'or', 'vip', 'abstrait'],
  },
  {
    id: 'ban_lux_2',
    url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1400&q=85',
    title: 'Sculpture Géométrique 3D Or & Métal',
    category: 'luxury',
    tags: ['or', '3d', 'sphère', 'luxe', 'prestige', 'design'],
  },
  {
    id: 'ban_lux_3',
    url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1400&q=85',
    title: 'Dégradé Sombre Velours & Satin',
    category: 'luxury',
    tags: ['soie', 'satin', 'noir', 'sombre', 'minimaliste'],
  },
  {
    id: 'ban_lux_4',
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=85',
    title: 'Villa d\'Architecte Nocturne',
    category: 'luxury',
    tags: ['immobilier', 'prestige', 'villa', 'luxe', 'piscine'],
  },

  // Créatif & Design
  {
    id: 'ban_crea_1',
    url: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1400&q=85',
    thumbnail: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=400&q=70',
    title: 'Dégradé Mesh Radiant Violet & Indigo',
    category: 'creative',
    tags: ['gradient', 'mesh', 'vibrant', 'violet', 'agence'],
  },
  {
    id: 'ban_crea_2',
    url: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=1400&q=85',
    title: 'Pigments Abstraits & Effet Aquarelle',
    category: 'creative',
    tags: ['art', 'couleur', 'aquarelle', 'peinture', 'studio'],
  },
  {
    id: 'ban_crea_3',
    url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1400&q=85',
    title: 'Bureau Minimaliste & Moodboard Créatif',
    category: 'creative',
    tags: ['creation', 'designer', 'portfolio', 'agences'],
  },

  // Minimaliste & Épuré
  {
    id: 'ban_min_1',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1400&q=85',
    thumbnail: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=70',
    title: 'Ombres Douces & Béton Ciré Blanc',
    category: 'minimal',
    tags: ['blanc', 'sobre', 'ombre', 'zen', 'scandinave'],
  },
  {
    id: 'ban_min_2',
    url: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=1400&q=85',
    title: 'Lampe Design & Nuance Grège',
    category: 'minimal',
    tags: ['beige', 'grege', 'epure', 'luminaire', 'calme'],
  },

  // Nature & RSE
  {
    id: 'ban_nat_1',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1400&q=85',
    thumbnail: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=400&q=70',
    title: 'Canopée de Forêt Brumeuse',
    category: 'nature',
    tags: ['vert', 'foret', 'nature', 'ecologie', 'rse', 'arbres'],
  },
  {
    id: 'ban_nat_2',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1400&q=85',
    title: 'Pics de Montagne & Ciel Pur',
    category: 'nature',
    tags: ['montagne', 'altitude', 'alpes', 'randonnee', 'air'],
  },
  {
    id: 'ban_nat_3',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=85',
    title: 'Océan Pacifique & Écume Turquoise',
    category: 'nature',
    tags: ['mer', 'ocean', 'plage', 'bleu', 'eau', 'ete'],
  },

  // Architecture & Ville
  {
    id: 'ban_arch_1',
    url: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=1400&q=85',
    thumbnail: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=400&q=70',
    title: 'Façade Sculpturale Contemporaine',
    category: 'architecture',
    tags: ['architecture', 'batiment', 'ville', 'urbanisme', 'lignes'],
  },
  {
    id: 'ban_arch_2',
    url: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=1400&q=85',
    title: 'Skyline Urbaine au Crépuscule',
    category: 'architecture',
    tags: ['skyline', 'metropole', 'paris', 'newyork', 'lumieres'],
  },
];

// ============================================================================
// 2. PHOTOS DE PROFIL / AVATARS PROFESSIONNELS
// ============================================================================

export const AVATAR_CATEGORIES: ImageCategory[] = [
  { id: 'all', label: 'Tous les portraits' },
  { id: 'men_corporate', label: 'Hommes (Corporate & Direction)' },
  { id: 'women_corporate', label: 'Femmes (Corporate & Direction)' },
  { id: 'casual_tech', label: 'Tech & Créatif' },
  { id: 'illustrated', label: 'Avatars & Initiales' },
];

export const AVATAR_PRESETS: ImagePreset[] = [
  // Men Corporate
  {
    id: 'av_man_1',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&h=500&q=85',
    thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200&q=70',
    title: 'Portrait Homme Souriant & Costume',
    category: 'men_corporate',
    tags: ['homme', 'sourire', 'costume', 'direction', 'commercial'],
  },
  {
    id: 'av_man_2',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&h=500&q=85',
    thumbnail: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&h=200&q=70',
    title: 'Portrait Homme Regard Confiant',
    category: 'men_corporate',
    tags: ['homme', 'regard', 'associe', 'consultant'],
  },
  {
    id: 'av_man_3',
    url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=500&h=500&q=85',
    thumbnail: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&h=200&q=70',
    title: 'Portrait Executive Senior',
    category: 'men_corporate',
    tags: ['homme', 'senior', 'directeur', 'finance', 'c-level'],
  },
  {
    id: 'av_man_4',
    url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=500&h=500&q=85',
    thumbnail: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&h=200&q=70',
    title: 'Portrait Directeur Général',
    category: 'men_corporate',
    tags: ['homme', 'costume', 'business', 'fondateur'],
  },

  // Women Corporate
  {
    id: 'av_wom_1',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=500&h=500&q=85',
    thumbnail: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&h=200&q=70',
    title: 'Portrait Femme Leader & Blazer',
    category: 'women_corporate',
    tags: ['femme', 'direction', 'blazer', 'associee', 'leadership'],
  },
  {
    id: 'av_wom_2',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=500&h=500&q=85',
    thumbnail: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&h=200&q=70',
    title: 'Portrait Femme Souriante Studio',
    category: 'women_corporate',
    tags: ['femme', 'sourire', 'consultante', 'manager', 'rh'],
  },
  {
    id: 'av_wom_3',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&h=500&q=85',
    thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=70',
    title: 'Portrait Élégant Fond Neutre',
    category: 'women_corporate',
    tags: ['femme', 'mode', 'elegance', 'communication', 'directrice'],
  },
  {
    id: 'av_wom_4',
    url: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=500&h=500&q=85',
    thumbnail: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=200&h=200&q=70',
    title: 'Portrait Directrice des Opérations',
    category: 'women_corporate',
    tags: ['femme', 'operations', 'vp', 'executive'],
  },

  // Casual & Tech
  {
    id: 'av_tech_1',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=500&h=500&q=85',
    thumbnail: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&h=200&q=70',
    title: 'Portrait Développeur / Lead Tech',
    category: 'casual_tech',
    tags: ['tech', 'developpeur', 'casual', 'startup', 'jeune'],
  },
  {
    id: 'av_tech_2',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=500&h=500&q=85',
    thumbnail: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&h=200&q=70',
    title: 'Portrait Designer UX / UI',
    category: 'casual_tech',
    tags: ['designer', 'ux', 'product', 'creatif'],
  },
  {
    id: 'av_tech_3',
    url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=500&h=500&q=85',
    thumbnail: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&h=200&q=70',
    title: 'Portrait Product Manager',
    category: 'casual_tech',
    tags: ['product', 'manager', 'tech', 'lunettes'],
  },

  // Illustrated & Badges
  {
    id: 'av_ill_1',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=500&h=500&q=85',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&h=200&q=70',
    title: 'Monogramme VIP Or & Marbre',
    category: 'illustrated',
    tags: ['monogramme', 'or', 'luxe', 'anonyme'],
  },
];

// ============================================================================
// 3. LOGOS D'ORGANISATION & SYMBOLES ENTREPRISE
// ============================================================================

export const LOGO_CATEGORIES: ImageCategory[] = [
  { id: 'all', label: 'Tous les logos' },
  { id: 'corporate', label: 'Corporate & Conseil' },
  { id: 'tech', label: 'Tech & Fintech' },
  { id: 'luxury', label: 'Luxe & Prestige' },
  { id: 'nature', label: 'Écologie & Santé' },
];

export const LOGO_PRESETS: ImagePreset[] = [
  {
    id: 'logo_1',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&h=300&q=85',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&h=150&q=70',
    title: 'Emblème Hexagonal Or & Marine',
    category: 'corporate',
    tags: ['hexagone', 'or', 'marine', 'prestige', 'audit'],
  },
  {
    id: 'logo_2',
    url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=300&h=300&q=85',
    thumbnail: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=150&h=150&q=70',
    title: 'Sphere 3D & Alliance Dynamique',
    category: 'tech',
    tags: ['tech', 'sphere', 'digital', 'saas', 'ia'],
  },
  {
    id: 'logo_3',
    url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=300&h=300&q=85',
    thumbnail: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=150&h=150&q=70',
    title: 'Badge Cyber Pulse Cyan',
    category: 'tech',
    tags: ['cyber', 'reseau', 'cyan', 'software'],
  },
  {
    id: 'logo_4',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=300&h=300&q=85',
    thumbnail: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=150&h=150&q=70',
    title: 'Feuille Éco Vert Forêt',
    category: 'nature',
    tags: ['vert', 'nature', 'rse', 'sante', 'biotech'],
  },
];
