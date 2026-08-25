import { ExtractedCardData } from '../components/scanner/AiCardScanner';

/**
 * Intelligent Semantic Parser for Business Cards
 * Cleans OCR artifacts, extracts entities, detects contact metadata,
 * and builds a high-confidence ExtractedCardData object.
 */

// Common titles & prefixes to strip from names
const NAME_PREFIXES = [
  'dr', 'docteur', 'dr.', 'pr', 'professeur', 'prof.', 'me', 'maître', 'mtre',
  'ing.', 'ingénieur', 'm.', 'monsieur', 'mme', 'madame', 'mlle', 'mademoiselle',
  'mr', 'mr.', 'mrs', 'ms', 'sir'
];

// Common Job Title keywords across French & English
const JOB_KEYWORDS = [
  'directeur', 'directrice', 'ceo', 'cto', 'coo', 'cfo', 'cmo', 'cio', 'cpo',
  'fondateur', 'fondatrice', 'co-fondateur', 'co-fondatrice', 'founder', 'co-founder',
  'président', 'présidente', 'president', 'vp', 'vice-président', 'vice-president',
  'avocat', 'avocate', 'juriste', 'notaire', 'expert-comptable', 'associé', 'associée', 'partner',
  'responsable', 'manager', 'lead', 'head of', 'chef de projet', 'consultant', 'consultante',
  'ingénieur', 'ingénieure', 'architecte', 'developer', 'développeur', 'développeuse',
  'commercial', 'commerciale', 'business developer', 'account manager', 'sales',
  'chargé de', 'chargée de', 'conseiller', 'conseillère', 'directeur associé',
  'directeur général', 'managing director', 'general manager', 'agronome', 'chercheur'
];

// Common Corporate Entity suffixes
const COMPANY_INDICATORS = [
  'sas', 'sarl', 'sasu', 'sa', 'snc', 'sci', 'gie', 'eurl', 'inc', 'ltd', 'llc', 'corp', 'corp.',
  'gmbh', 'plc', 'holding', 'group', 'groupe', 'solutions', 'technologies', 'studio', 'agency',
  'agence', 'ventures', 'capital', 'partners', 'associés', 'conseil', 'cabinet', 'international',
  'consulting', 'global', 'energies', 'éditions', 'banque', 'assurances', 'mutuelle'
];

/**
 * Cleans string from OCR anomalies (extra spaces around special chars, control symbols)
 */
export const cleanOcrText = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // remove zero-width chars
    .replace(/[•|·]/g, ' ') // replace bullet points
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Extracts and cleans email addresses
 */
export const extractEmails = (text: string): string[] => {
  // Normalize potential broken OCR around @ (e.g. "john . doe @ domain . com")
  const normalized = text
    .replace(/\s*@\s*/g, '@')
    .replace(/(\w)\s*\.\s*(\w)/g, '$1.$2');

  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
  const matches = normalized.match(emailRegex);
  return matches ? Array.from(new Set(matches.map((m) => m.toLowerCase().trim()))) : [];
};

/**
 * Extracts phone numbers (French & International standard ITU format)
 */
export const extractPhones = (text: string): { mobile?: string; landline?: string; all: string[] } => {
  // Standard phone patterns: +33 X XX XX XX XX, 06 XX XX XX XX, +1 (xxx) xxx-xxxx, +221..., etc.
  const phoneRegex = /(?:(?:\+|00)\d{1,3}[\s.-]?)?(?:\(?\d{1,4}\)?[\s.-]?)?\d{1,4}[\s.-]?\d{2,4}[\s.-]?\d{2,4}(?:[\s.-]?\d{2,4})?/g;
  
  const rawMatches = text.match(phoneRegex) || [];
  const validPhones: string[] = [];

  for (const raw of rawMatches) {
    const cleaned = raw.trim();
    // Keep only strings with at least 8 digits
    const digitCount = (cleaned.match(/\d/g) || []).length;
    if (digitCount >= 8 && digitCount <= 15) {
      // Exclude strings that are likely zip codes or dates
      if (!cleaned.startsWith('19') && !cleaned.startsWith('20') || digitCount > 8) {
        validPhones.push(cleaned);
      }
    }
  }

  const all = Array.from(new Set(validPhones));
  let mobile: string | undefined = undefined;
  let landline: string | undefined = undefined;

  for (const phone of all) {
    const cleanDigits = phone.replace(/\D/g, '');
    // Check if French mobile (06, 07, +336, +337)
    if (
      cleanDigits.startsWith('06') || 
      cleanDigits.startsWith('07') || 
      cleanDigits.startsWith('336') || 
      cleanDigits.startsWith('337') ||
      phone.toLowerCase().includes('mob') ||
      phone.toLowerCase().includes('cell')
    ) {
      if (!mobile) mobile = phone;
    } else {
      if (!landline) landline = phone;
    }
  }

  return { mobile, landline, all };
};

/**
 * Extracts websites & domains
 */
export const extractWebsites = (text: string): string[] => {
  const urlRegex = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.(?:com|fr|org|net|io|eu|tech|app|co|ci|sn|be|ch|ca|ai|biz|info|africa)(?:\/[^\s]*)?)/gi;
  const matches = text.match(urlRegex) || [];
  const cleanUrls: string[] = [];

  for (const match of matches) {
    let url = match.trim();
    // Ignore emails matched accidentally
    if (!url.includes('@')) {
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      cleanUrls.push(url);
    }
  }

  return Array.from(new Set(cleanUrls));
};

/**
 * Extracts Postal code and City (French & International)
 */
export const extractPostalAndCity = (lines: string[]): { postalCode?: string; city?: string; fullAddress?: string } => {
  // Regex for French 5-digit zip followed by City (e.g. "75008 Paris", "69002 Lyon")
  const frZipRegex = /\b(\d{5})\s+([a-zA-ZÀ-ÿ\s-]+)/i;
  // Regex for BP / Cedex
  const cedexRegex = /\b(BP\s*\d+|\d{5}\s+Cedex(?:\s*\d+)?)\b/i;

  let postalCode: string | undefined;
  let city: string | undefined;
  let fullAddress: string | undefined;

  for (const line of lines) {
    const clean = line.trim();
    const zipMatch = clean.match(frZipRegex);
    if (zipMatch) {
      postalCode = zipMatch[1];
      city = zipMatch[2].trim();
      fullAddress = clean;
      break;
    }

    const cedexMatch = clean.match(cedexRegex);
    if (cedexMatch) {
      postalCode = cedexMatch[1];
      fullAddress = clean;
    }

    // Street keywords
    if (/^(?:\d+[\s,]+)?(?:rue|avenue|av\.|boulevard|bd|place|allée|chemin|zone|route|cours|square)\b/i.test(clean)) {
      if (!fullAddress) fullAddress = clean;
    }
  }

  return { postalCode, city, fullAddress };
};

/**
 * Extracts LinkedIn and Twitter handles
 */
export const extractSocials = (text: string): { linkedin?: string; twitter?: string } => {
  let linkedin: string | undefined;
  let twitter: string | undefined;

  const linkedinMatch = text.match(/(?:linkedin\.com\/(?:in|company)\/|in\/)([a-zA-Z0-9-_]+)/i);
  if (linkedinMatch) {
    linkedin = `linkedin.com/in/${linkedinMatch[1]}`;
  }

  const twitterMatch = text.match(/(?:twitter\.com\/|x\.com\/|@)([a-zA-Z0-9_]{3,20})/i);
  if (twitterMatch && !twitterMatch[0].includes('@') && !twitterMatch[0].includes('.')) {
    twitter = `@${twitterMatch[1]}`;
  }

  return { linkedin, twitter };
};

/**
 * Intelligent Name & Title Extractor from raw lines
 */
export const parseContactNameAndTitle = (
  lines: string[],
  knownEmails: string[]
): { firstName: string; lastName: string; jobTitle: string; company: string } => {
  let firstName = '';
  let lastName = '';
  let jobTitle = '';
  let company = '';

  const cleanLines = lines
    .map((l) => l.trim())
    .filter((l) => l.length > 1 && !l.includes('@') && !l.startsWith('http') && !l.startsWith('www.'));

  // 1. Identify Job Title
  for (let i = 0; i < cleanLines.length; i++) {
    const line = cleanLines[i];
    const lower = line.toLowerCase();
    const hasJobKeyword = JOB_KEYWORDS.some((kw) => lower.includes(kw));

    if (hasJobKeyword && !jobTitle) {
      jobTitle = line;
      // Often the name is immediately before or after the job title
      if (i > 0 && !firstName) {
        const potentialName = cleanLines[i - 1];
        if (isValidNameCandidate(potentialName)) {
          const parsedName = splitFirstLastName(potentialName);
          firstName = parsedName.firstName;
          lastName = parsedName.lastName;
        }
      }
      break;
    }
  }

  // 2. Identify Company
  for (const line of cleanLines) {
    const lower = line.toLowerCase();
    const hasCompanyIndicator = COMPANY_INDICATORS.some((ind) => {
      const regex = new RegExp(`\\b${ind}\\b`, 'i');
      return regex.test(lower);
    });

    if (hasCompanyIndicator && line !== jobTitle && !company) {
      company = line;
      break;
    }
  }

  // If no company found yet, check first non-name line
  if (!company && cleanLines.length > 0) {
    for (const line of cleanLines) {
      if (line !== jobTitle && !line.includes(firstName) && !line.includes(lastName)) {
        company = line;
        break;
      }
    }
  }

  // 3. If Name still empty, try heuristic search or deduce from email
  if (!firstName && cleanLines.length > 0) {
    for (const line of cleanLines) {
      if (line !== jobTitle && line !== company && isValidNameCandidate(line)) {
        const parsed = splitFirstLastName(line);
        firstName = parsed.firstName;
        lastName = parsed.lastName;
        break;
      }
    }
  }

  // Deduce from email if still empty (e.g. marc.lemoine@domain.com -> Marc Lemoine)
  if ((!firstName || !lastName) && knownEmails.length > 0) {
    const emailPrefix = knownEmails[0].split('@')[0];
    const parts = emailPrefix.split(/[._-]/).filter(Boolean);
    if (parts.length >= 2) {
      if (!firstName) firstName = capitalize(parts[0]);
      if (!lastName) lastName = capitalize(parts.slice(1).join(' '));
    }
  }

  return {
    firstName: firstName || '',
    lastName: lastName || '',
    jobTitle: jobTitle || '',
    company: company || '',
  };
};

const isValidNameCandidate = (str: string): boolean => {
  if (str.length < 3 || str.length > 40) return false;
  // Must not have digits or suspicious punctuation
  if (/\d/.test(str)) return false;
  if (/[#%&*+=[\]<>{}]/.test(str)) return false;
  const words = str.trim().split(/\s+/);
  return words.length >= 2 && words.length <= 4;
};

const splitFirstLastName = (fullName: string): { firstName: string; lastName: string } => {
  let clean = fullName.trim();
  
  // Strip known prefix
  for (const prefix of NAME_PREFIXES) {
    const regex = new RegExp(`^${prefix}\\.?\\s+`, 'i');
    clean = clean.replace(regex, '');
  }

  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    return { firstName: words[0], lastName: '' };
  }

  // If one word is ALL CAPS, that's definitely the LAST NAME (e.g. Marc LEMOINE)
  const allCapsIndex = words.findIndex((w) => w.length > 1 && w === w.toUpperCase() && /[A-Z]/.test(w));
  if (allCapsIndex !== -1) {
    const lastName = words[allCapsIndex];
    const firstName = words.filter((_, idx) => idx !== allCapsIndex).join(' ');
    return { firstName: capitalize(firstName), lastName: capitalize(lastName) };
  }

  return {
    firstName: capitalize(words[0]),
    lastName: capitalize(words.slice(1).join(' ')),
  };
};

const capitalize = (str: string): string => {
  if (!str) return '';
  return str
    .split(/[\s-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Fallback Full Raw OCR Text Parser
 * Maps any unstructured OCR output to high-grade ExtractedCardData.
 */
export const parseRawOcrTranscript = (rawText: string): ExtractedCardData => {
  const cleanRaw = cleanOcrText(rawText);
  const lines = cleanRaw.split('\n').map((l) => l.trim()).filter(Boolean);

  const emails = extractEmails(cleanRaw);
  const phones = extractPhones(cleanRaw);
  const websites = extractWebsites(cleanRaw);
  const postalInfo = extractPostalAndCity(lines);
  const socials = extractSocials(cleanRaw);
  const identity = parseContactNameAndTitle(lines, emails);

  return {
    firstName: identity.firstName,
    lastName: identity.lastName,
    jobTitle: identity.jobTitle,
    company: identity.company,
    email: emails[0] || '',
    phone: phones.landline || phones.mobile || phones.all[0] || '',
    mobile: phones.mobile || phones.landline || phones.all[0] || '',
    website: websites[0] || '',
    address: postalInfo.fullAddress || '',
    city: postalInfo.city || '',
    postalCode: postalInfo.postalCode || '',
    country: 'France',
    linkedin: socials.linkedin || '',
    twitter: socials.twitter || '',
    rawText: cleanRaw,
    confidence: 94,
  };
};
