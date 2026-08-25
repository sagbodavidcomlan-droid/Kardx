/**
 * Geographic coordinates, IP geolocation, and mapping utilities for KardX Lead & Scan Distribution
 */

export interface CityGeoData {
  city: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
  region: 'europe' | 'africa' | 'north_america' | 'middle_east' | 'asia' | 'other';
  flag: string;
}

export interface IpScanOriginRecord {
  id: string;
  ipMasked: string;
  isp: string;
  city: string;
  country: string;
  countryCode: string;
  flag: string;
  lat: number;
  lng: number;
  scanType: 'nfc' | 'qr' | 'direct_url' | 'apple_wallet' | 'google_wallet';
  cardName: string;
  profileName: string;
  timestamp: string;
  device: string;
  browser: string;
  latencyMs: number;
  scanCount: number;
}

export const KNOWN_CITIES_COORDS: Record<string, CityGeoData> = {
  // France & Europe
  paris: { city: 'Paris', country: 'France', countryCode: 'FR', lat: 48.8566, lng: 2.3522, region: 'europe', flag: '🇫🇷' },
  lyon: { city: 'Lyon', country: 'France', countryCode: 'FR', lat: 45.7640, lng: 4.8357, region: 'europe', flag: '🇫🇷' },
  marseille: { city: 'Marseille', country: 'France', countryCode: 'FR', lat: 43.2965, lng: 5.3698, region: 'europe', flag: '🇫🇷' },
  bordeaux: { city: 'Bordeaux', country: 'France', countryCode: 'FR', lat: 44.8378, lng: -0.5792, region: 'europe', flag: '🇫🇷' },
  lille: { city: 'Lille', country: 'France', countryCode: 'FR', lat: 50.6292, lng: 3.0573, region: 'europe', flag: '🇫🇷' },
  nantes: { city: 'Nantes', country: 'France', countryCode: 'FR', lat: 47.2184, lng: -1.5536, region: 'europe', flag: '🇫🇷' },
  toulouse: { city: 'Toulouse', country: 'France', countryCode: 'FR', lat: 43.6047, lng: 1.4442, region: 'europe', flag: '🇫🇷' },
  strasbourg: { city: 'Strasbourg', country: 'France', countryCode: 'FR', lat: 48.5734, lng: 7.7521, region: 'europe', flag: '🇫🇷' },
  nice: { city: 'Nice', country: 'France', countryCode: 'FR', lat: 43.7102, lng: 7.2620, region: 'europe', flag: '🇫🇷' },
  rennes: { city: 'Rennes', country: 'France', countryCode: 'FR', lat: 48.1173, lng: -1.6778, region: 'europe', flag: '🇫🇷' },
  montpellier: { city: 'Montpellier', country: 'France', countryCode: 'FR', lat: 43.6108, lng: 3.8767, region: 'europe', flag: '🇫🇷' },
  grenoble: { city: 'Grenoble', country: 'France', countryCode: 'FR', lat: 45.1885, lng: 5.7245, region: 'europe', flag: '🇫🇷' },
  bruxelles: { city: 'Bruxelles', country: 'Belgique', countryCode: 'BE', lat: 50.8503, lng: 4.3517, region: 'europe', flag: '🇧🇪' },
  brussels: { city: 'Bruxelles', country: 'Belgique', countryCode: 'BE', lat: 50.8503, lng: 4.3517, region: 'europe', flag: '🇧🇪' },
  geneve: { city: 'Genève', country: 'Suisse', countryCode: 'CH', lat: 46.2044, lng: 6.1432, region: 'europe', flag: '🇨🇭' },
  geneva: { city: 'Genève', country: 'Suisse', countryCode: 'CH', lat: 46.2044, lng: 6.1432, region: 'europe', flag: '🇨🇭' },
  lausanne: { city: 'Lausanne', country: 'Suisse', countryCode: 'CH', lat: 46.5197, lng: 6.6323, region: 'europe', flag: '🇨🇭' },
  zurich: { city: 'Zurich', country: 'Suisse', countryCode: 'CH', lat: 47.3769, lng: 8.5417, region: 'europe', flag: '🇨🇭' },
  luxembourg: { city: 'Luxembourg', country: 'Luxembourg', countryCode: 'LU', lat: 49.6116, lng: 6.1319, region: 'europe', flag: '🇱🇺' },
  londres: { city: 'Londres', country: 'Royaume-Uni', countryCode: 'GB', lat: 51.5074, lng: -0.1278, region: 'europe', flag: '🇬🇧' },
  london: { city: 'Londres', country: 'Royaume-Uni', countryCode: 'GB', lat: 51.5074, lng: -0.1278, region: 'europe', flag: '🇬🇧' },
  monaco: { city: 'Monaco', country: 'Monaco', countryCode: 'MC', lat: 43.7384, lng: 7.4246, region: 'europe', flag: '🇲🇨' },
  milan: { city: 'Milan', country: 'Italie', countryCode: 'IT', lat: 45.4642, lng: 9.1900, region: 'europe', flag: '🇮🇹' },
  madrid: { city: 'Madrid', country: 'Espagne', countryCode: 'ES', lat: 40.4168, lng: -3.7038, region: 'europe', flag: '🇪🇸' },
  barcelone: { city: 'Barcelone', country: 'Espagne', countryCode: 'ES', lat: 41.3851, lng: 2.1734, region: 'europe', flag: '🇪🇸' },
  berlin: { city: 'Berlin', country: 'Allemagne', countryCode: 'DE', lat: 52.5200, lng: 13.4050, region: 'europe', flag: '🇩🇪' },
  frankfurt: { city: 'Francfort', country: 'Allemagne', countryCode: 'DE', lat: 50.1109, lng: 8.6821, region: 'europe', flag: '🇩🇪' },
  amsterdam: { city: 'Amsterdam', country: 'Pays-Bas', countryCode: 'NL', lat: 52.3676, lng: 4.9041, region: 'europe', flag: '🇳🇱' },

  // Afrique
  lome: { city: 'Lomé', country: 'Togo', countryCode: 'TG', lat: 6.1375, lng: 1.2125, region: 'africa', flag: '🇹🇬' },
  lomé: { city: 'Lomé', country: 'Togo', countryCode: 'TG', lat: 6.1375, lng: 1.2125, region: 'africa', flag: '🇹🇬' },
  cotonou: { city: 'Cotonou', country: 'Bénin', countryCode: 'BJ', lat: 6.3703, lng: 2.3912, region: 'africa', flag: '🇧🇯' },
  abidjan: { city: 'Abidjan', country: 'Côte d\'Ivoire', countryCode: 'CI', lat: 5.3600, lng: -4.0083, region: 'africa', flag: '🇨🇮' },
  dakar: { city: 'Dakar', country: 'Sénégal', countryCode: 'SN', lat: 14.7167, lng: -17.4677, region: 'africa', flag: '🇸🇳' },
  casablanca: { city: 'Casablanca', country: 'Maroc', countryCode: 'MA', lat: 33.5731, lng: -7.5898, region: 'africa', flag: '🇲🇦' },
  rabat: { city: 'Rabat', country: 'Maroc', countryCode: 'MA', lat: 34.0209, lng: -6.8416, region: 'africa', flag: '🇲🇦' },
  tunis: { city: 'Tunis', country: 'Tunisie', countryCode: 'TN', lat: 36.8065, lng: 10.1815, region: 'africa', flag: '🇹🇳' },
  alger: { city: 'Alger', country: 'Algérie', countryCode: 'DZ', lat: 36.7538, lng: 3.0588, region: 'africa', flag: '🇩🇿' },
  douala: { city: 'Douala', country: 'Cameroun', countryCode: 'CM', lat: 4.0511, lng: 9.7679, region: 'africa', flag: '🇨🇲' },
  yaounde: { city: 'Yaoundé', country: 'Cameroun', countryCode: 'CM', lat: 3.8480, lng: 11.5021, region: 'africa', flag: '🇨🇲' },
  yaoundé: { city: 'Yaoundé', country: 'Cameroun', countryCode: 'CM', lat: 3.8480, lng: 11.5021, region: 'africa', flag: '🇨🇲' },
  libreville: { city: 'Libreville', country: 'Gabon', countryCode: 'GA', lat: 0.4162, lng: 9.4673, region: 'africa', flag: '🇬🇦' },
  kinshasa: { city: 'Kinshasa', country: 'RDC', countryCode: 'CD', lat: -4.4419, lng: 15.2663, region: 'africa', flag: '🇨🇩' },
  brazzaville: { city: 'Brazzaville', country: 'Congo', countryCode: 'CG', lat: -4.2634, lng: 15.2429, region: 'africa', flag: '🇨🇬' },
  ouagadougou: { city: 'Ouagadougou', country: 'Burkina Faso', countryCode: 'BF', lat: 12.3714, lng: -1.5197, region: 'africa', flag: '🇧🇫' },
  bamako: { city: 'Bamako', country: 'Mali', countryCode: 'ML', lat: 12.6392, lng: -8.0029, region: 'africa', flag: '🇲🇱' },
  conakry: { city: 'Conakry', country: 'Guinée', countryCode: 'GN', lat: 9.6412, lng: -13.5784, region: 'africa', flag: '🇬🇳' },
  nairobi: { city: 'Nairobi', country: 'Kenya', countryCode: 'KE', lat: -1.2921, lng: 36.8219, region: 'africa', flag: '🇰🇪' },

  // Amérique du Nord & Autres
  montreal: { city: 'Montréal', country: 'Canada', countryCode: 'CA', lat: 45.5017, lng: -73.5673, region: 'north_america', flag: '🇨🇦' },
  montréal: { city: 'Montréal', country: 'Canada', countryCode: 'CA', lat: 45.5017, lng: -73.5673, region: 'north_america', flag: '🇨🇦' },
  quebec: { city: 'Québec', country: 'Canada', countryCode: 'CA', lat: 46.8139, lng: -71.2080, region: 'north_america', flag: '🇨🇦' },
  toronto: { city: 'Toronto', country: 'Canada', countryCode: 'CA', lat: 43.6532, lng: -79.3832, region: 'north_america', flag: '🇨🇦' },
  newyork: { city: 'New York', country: 'États-Unis', countryCode: 'US', lat: 40.7128, lng: -74.0060, region: 'north_america', flag: '🇺🇸' },
  'new york': { city: 'New York', country: 'États-Unis', countryCode: 'US', lat: 40.7128, lng: -74.0060, region: 'north_america', flag: '🇺🇸' },
  sanfrancisco: { city: 'San Francisco', country: 'États-Unis', countryCode: 'US', lat: 37.7749, lng: -122.4194, region: 'north_america', flag: '🇺🇸' },
  'san francisco': { city: 'San Francisco', country: 'États-Unis', countryCode: 'US', lat: 37.7749, lng: -122.4194, region: 'north_america', flag: '🇺🇸' },
  chicago: { city: 'Chicago', country: 'États-Unis', countryCode: 'US', lat: 41.8781, lng: -87.6298, region: 'north_america', flag: '🇺🇸' },
  miami: { city: 'Miami', country: 'États-Unis', countryCode: 'US', lat: 25.7617, lng: -80.1918, region: 'north_america', flag: '🇺🇸' },
  dubai: { city: 'Dubaï', country: 'Émirats Arabes Unis', countryCode: 'AE', lat: 25.2048, lng: 55.2708, region: 'middle_east', flag: '🇦🇪' },
  dubaï: { city: 'Dubaï', country: 'Émirats Arabes Unis', countryCode: 'AE', lat: 25.2048, lng: 55.2708, region: 'middle_east', flag: '🇦🇪' },
  singapour: { city: 'Singapour', country: 'Singapour', countryCode: 'SG', lat: 1.3521, lng: 103.8198, region: 'asia', flag: '🇸🇬' },
  tokyo: { city: 'Tokyo', country: 'Japon', countryCode: 'JP', lat: 35.6762, lng: 139.6503, region: 'asia', flag: '🇯🇵' },
};

/**
 * Get normalized city geodata
 */
export const getCityGeoData = (city?: string, country?: string): CityGeoData => {
  if (city) {
    const key = city.toLowerCase().trim();
    if (KNOWN_CITIES_COORDS[key]) {
      return KNOWN_CITIES_COORDS[key];
    }
  }

  // Fallback approximations by country
  if (country) {
    const c = country.toLowerCase();
    if (c.includes('france')) return { city: city || 'Paris', country: 'France', countryCode: 'FR', lat: 48.8566, lng: 2.3522, region: 'europe', flag: '🇫🇷' };
    if (c.includes('belg')) return { city: city || 'Bruxelles', country: 'Belgique', countryCode: 'BE', lat: 50.8503, lng: 4.3517, region: 'europe', flag: '🇧🇪' };
    if (c.includes('suisse') || c.includes('switz')) return { city: city || 'Genève', country: 'Suisse', countryCode: 'CH', lat: 46.2044, lng: 6.1432, region: 'europe', flag: '🇨🇭' };
    if (c.includes('togo')) return { city: city || 'Lomé', country: 'Togo', countryCode: 'TG', lat: 6.1375, lng: 1.2125, region: 'africa', flag: '🇹🇬' };
    if (c.includes('bénin') || c.includes('benin')) return { city: city || 'Cotonou', country: 'Bénin', countryCode: 'BJ', lat: 6.3703, lng: 2.3912, region: 'africa', flag: '🇧🇯' };
    if (c.includes('ivoire')) return { city: city || 'Abidjan', country: 'Côte d\'Ivoire', countryCode: 'CI', lat: 5.3600, lng: -4.0083, region: 'africa', flag: '🇨🇮' };
    if (c.includes('sénégal') || c.includes('senegal')) return { city: city || 'Dakar', country: 'Sénégal', countryCode: 'SN', lat: 14.7167, lng: -17.4677, region: 'africa', flag: '🇸🇳' };
    if (c.includes('canada')) return { city: city || 'Montréal', country: 'Canada', countryCode: 'CA', lat: 45.5017, lng: -73.5673, region: 'north_america', flag: '🇨🇦' };
    if (c.includes('maroc') || c.includes('morocco')) return { city: city || 'Casablanca', country: 'Maroc', countryCode: 'MA', lat: 33.5731, lng: -7.5898, region: 'africa', flag: '🇲🇦' };
    if (c.includes('cameroun') || c.includes('cameroon')) return { city: city || 'Douala', country: 'Cameroun', countryCode: 'CM', lat: 4.0511, lng: 9.7679, region: 'africa', flag: '🇨🇲' };
    if (c.includes('états-unis') || c.includes('usa') || c.includes('united states')) return { city: city || 'New York', country: 'États-Unis', countryCode: 'US', lat: 40.7128, lng: -74.0060, region: 'north_america', flag: '🇺🇸' };
  }

  // Default fallback Paris
  return {
    city: city || 'Paris',
    country: country || 'France',
    countryCode: 'FR',
    lat: 48.8566,
    lng: 2.3522,
    region: 'europe',
    flag: '🇫🇷',
  };
};

/**
 * Convert lat/lng to SVG map coordinates for different views
 */
export interface MapProjectionView {
  id: 'world' | 'europe' | 'africa' | 'north_america';
  name: string;
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export const MAP_VIEWS: Record<'world' | 'europe' | 'africa' | 'north_america', MapProjectionView> = {
  world: {
    id: 'world',
    name: 'Monde Entier',
    minLat: -55,
    maxLat: 75,
    minLng: -170,
    maxLng: 180,
  },
  europe: {
    id: 'europe',
    name: 'Europe & Méditerranée',
    minLat: 34,
    maxLat: 58,
    minLng: -12,
    maxLng: 25,
  },
  africa: {
    id: 'africa',
    name: 'Afrique de l\'Ouest & Centrale',
    minLat: -10,
    maxLat: 38,
    minLng: -20,
    maxLng: 40,
  },
  north_america: {
    id: 'north_america',
    name: 'Amérique du Nord',
    minLat: 20,
    maxLat: 60,
    minLng: -130,
    maxLng: -60,
  },
};

/**
 * Project latitude / longitude into percentage (x%, y%) based on projection bounds
 */
export const projectCoordinates = (
  lat: number,
  lng: number,
  view: MapProjectionView
): { xPercent: number; yPercent: number; inBounds: boolean } => {
  const { minLat, maxLat, minLng, maxLng } = view;

  // Mercator-like vertical dampening
  const x = ((lng - minLng) / (maxLng - minLng)) * 100;
  const y = ((maxLat - lat) / (maxLat - minLat)) * 100;

  const inBounds = x >= 0 && x <= 100 && y >= 0 && y <= 100;

  return {
    xPercent: Math.max(0, Math.min(100, x)),
    yPercent: Math.max(0, Math.min(100, y)),
    inBounds,
  };
};

/**
 * ISP providers lookup helper by country
 */
export const getEstimatedIsp = (countryCode: string, city: string): string => {
  switch (countryCode.toUpperCase()) {
    case 'FR':
      if (city.toLowerCase().includes('lyon') || city.toLowerCase().includes('marseille')) return 'Orange France 5G';
      if (city.toLowerCase().includes('bordeaux')) return 'Free Mobile SAS';
      return 'Orange SA / SFR Business';
    case 'BE':
      return 'Proximus / Telenet Telecom';
    case 'CH':
      return 'Swisscom AG Telecom';
    case 'LU':
      return 'POST Luxembourg';
    case 'GB':
      return 'BT Group / Vodafone UK';
    case 'TG':
      return 'Togocom / Moov Africa Togo';
    case 'BJ':
      return 'MTN Bénin / Moov Bénin';
    case 'CI':
      return 'Orange Côte d\'Ivoire / MTN';
    case 'SN':
      return 'Sonatel / Orange Sénégal';
    case 'CM':
      return 'MTN Cameroon / Orange CM';
    case 'MA':
      return 'Maroc Telecom (IAM) / Inwi';
    case 'CA':
      return 'Bell Canada / Rogers Mobile';
    case 'US':
      return 'Verizon Wireless / AT&T Internet';
    case 'AE':
      return 'Etisalat UAE / du Telecom';
    default:
      return 'Cloudflare Warp / Global Carrier';
  }
};
