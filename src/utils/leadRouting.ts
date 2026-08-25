import { Lead, LeadRoutingRule, User, RoutingTestResult } from '../types';

/**
 * Normalizes text for keyword matching: removes accents, converts to lowercase.
 */
export const normalizeText = (text: string): string => {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

/**
 * Checks if any keyword is present in a target text string.
 */
export const findMatchingKeywords = (targetText: string, keywords: string[]): string[] => {
  if (!targetText || !keywords || keywords.length === 0) return [];
  const normalizedTarget = normalizeText(targetText);
  
  return keywords.filter((kw) => {
    const normalizedKw = normalizeText(kw);
    if (!normalizedKw) return false;
    
    // Check whole word or substring match
    const regex = new RegExp(`\\b${normalizedKw.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
    return regex.test(normalizedTarget) || normalizedTarget.includes(normalizedKw);
  });
};

/**
 * Evaluates a lead against a list of routing rules in priority order.
 */
export const evaluateLeadRouting = (
  lead: Partial<Lead>,
  rules: LeadRoutingRule[],
  users: User[]
): RoutingTestResult => {
  // Sort active rules by priority (ascending: 1, 2, 3...)
  const activeRules = rules
    .filter((r) => r.active)
    .sort((a, b) => a.priority - b.priority);

  // Combine relevant text fields for evaluation
  const geoText = [
    lead.city || '',
    lead.country || '',
    lead.meetingContext || '',
    lead.notes || '',
    lead.company || '',
  ].join(' ');

  const industryText = [
    lead.company || '',
    lead.jobTitle || '',
    lead.notes || '',
    lead.meetingContext || '',
    ...(lead.tags || []),
  ].join(' ');

  const jobTitleText = [
    lead.jobTitle || '',
    lead.notes || '',
  ].join(' ');

  for (const rule of activeRules) {
    const geoMatches = findMatchingKeywords(geoText, rule.geographicKeywords);
    const industryMatches = findMatchingKeywords(industryText, rule.industryKeywords);
    const jobTitleMatches = rule.jobTitleKeywords && rule.jobTitleKeywords.length > 0
      ? findMatchingKeywords(jobTitleText, rule.jobTitleKeywords)
      : [];

    const hasGeoRule = rule.geographicKeywords.length > 0;
    const hasIndustryRule = rule.industryKeywords.length > 0;
    const hasJobTitleRule = (rule.jobTitleKeywords || []).length > 0;

    let isMatch = false;

    if (rule.matchMode === 'all') {
      // Must match every criteria group that is configured
      const geoOk = !hasGeoRule || geoMatches.length > 0;
      const industryOk = !hasIndustryRule || industryMatches.length > 0;
      const jobTitleOk = !hasJobTitleRule || jobTitleMatches.length > 0;

      // At least one criteria must have matched if configured
      isMatch = geoOk && industryOk && jobTitleOk && (hasGeoRule || hasIndustryRule || hasJobTitleRule);
    } else {
      // 'any' mode: matches if ANY configured keyword group matches
      isMatch = geoMatches.length > 0 || industryMatches.length > 0 || jobTitleMatches.length > 0;
    }

    if (isMatch) {
      const targetUser = users.find((u) => u.id === rule.targetUserId);
      const matchedParts: string[] = [];
      if (geoMatches.length > 0) matchedParts.push(`Géo: [${geoMatches.join(', ')}]`);
      if (industryMatches.length > 0) matchedParts.push(`Secteur: [${industryMatches.join(', ')}]`);
      if (jobTitleMatches.length > 0) matchedParts.push(`Fonction: [${jobTitleMatches.join(', ')}]`);

      const reason = `Règle #${rule.priority} "${rule.name}" (${matchedParts.join(' • ')})`;

      return {
        matched: true,
        rule,
        targetUser,
        matchedKeywords: {
          geographic: geoMatches,
          industry: industryMatches,
          jobTitle: jobTitleMatches,
        },
        reason,
      };
    }
  }

  return {
    matched: false,
    matchedKeywords: { geographic: [], industry: [], jobTitle: [] },
    reason: 'Aucune règle de routage active ne correspond aux critères du prospect.',
  };
};

/**
 * Applies routing evaluation to a lead and returns the modified lead and matched rule.
 */
export const applyRoutingToLead = (
  lead: Lead,
  rules: LeadRoutingRule[],
  users: User[]
): { updatedLead: Lead; matchedRule?: LeadRoutingRule } => {
  const result = evaluateLeadRouting(lead, rules, users);

  if (result.matched && result.rule && result.targetUser) {
    const updatedTags = [...lead.tags];
    if (result.rule.autoTags && result.rule.autoTags.length > 0) {
      result.rule.autoTags.forEach((tag) => {
        if (!updatedTags.includes(tag)) {
          updatedTags.push(tag);
        }
      });
    }

    let reminderDate = lead.reminderDate;
    let reminderNote = lead.reminderNote;
    let reminderStatus = lead.reminderStatus;

    if (result.rule.autoReminderHours && result.rule.autoReminderHours > 0) {
      reminderDate = new Date(Date.now() + result.rule.autoReminderHours * 3600000).toISOString();
      reminderNote = `Rappel auto-assigné via règle "${result.rule.name}" : Relancer ${lead.firstName} ${lead.lastName}.`;
      reminderStatus = 'pending';
    }

    const updatedLead: Lead = {
      ...lead,
      assignedUserId: result.targetUser.id,
      routedByRuleId: result.rule.id,
      routedRuleName: result.rule.name,
      routedAt: new Date().toISOString(),
      routedReason: result.reason,
      tags: updatedTags,
      status: result.rule.statusOnAssign || lead.status,
      reminderDate,
      reminderNote,
      reminderStatus,
      updatedAt: new Date().toISOString(),
    };

    return { updatedLead, matchedRule: result.rule };
  }

  return { updatedLead: lead };
};

// Preset Keywords for Quick Rule Building
export const GEOGRAPHIC_PRESETS = [
  { label: 'Paris & Île-de-France', keywords: ['Paris', 'Île-de-France', 'IDF', 'La Défense', 'Boulogne', 'Saint-Ouen', 'Neuilly', 'Versailles'] },
  { label: 'Auvergne-Rhône-Alpes', keywords: ['Lyon', 'Grenoble', 'Saint-Étienne', 'Annecy', 'Rhône-Alpes'] },
  { label: 'Grand Ouest (Nantes, Rennes, Bordeaux)', keywords: ['Nantes', 'Rennes', 'Bordeaux', 'Bretagne', 'Nouvelle-Aquitaine'] },
  { label: 'Région Sud / PACA', keywords: ['Marseille', 'Nice', 'Toulon', 'Aix-en-Provence', 'Sophia Antipolis', 'PACA'] },
  { label: 'Hauts-de-France & Grand Est', keywords: ['Lille', 'Strasbourg', 'Metz', 'Nancy'] },
  { label: 'International — Benelux & Suisse', keywords: ['Bruxelles', 'Belgique', 'Genève', 'Lausanne', 'Zurich', 'Suisse', 'Luxembourg'] },
  { label: 'International — Afrique & UEMOA', keywords: ['Abidjan', 'Dakar', 'Cotonou', 'Lomé', 'Accra', 'Casablanca', 'Côte d\'Ivoire', 'Sénégal', 'Bénin', 'Maroc'] },
  { label: 'International — EMEA / UK / US', keywords: ['London', 'United Kingdom', 'New York', 'San Francisco', 'USA', 'Germany', 'Berlin'] },
];

export const INDUSTRY_PRESETS = [
  { label: 'Tech, SaaS & Startups', keywords: ['SaaS', 'Tech', 'Software', 'Digital', 'Cloud', 'Startup', 'AI', 'IA', 'Plateforme', 'Dev', 'Station F'] },
  { label: 'Banque, Finance & Fintech', keywords: ['Banque', 'Finance', 'Fintech', 'Assurance', 'Capital', 'Investissement', 'Fonds', 'Venture', 'Bourse'] },
  { label: 'Santé, Pharma & Biotech', keywords: ['Santé', 'Pharma', 'Biotech', 'Médical', 'Hôpital', 'Doctolib', 'Laboratoire', 'Clinique'] },
  { label: 'Industrie, Transport & Mobilité', keywords: ['Industrie', 'Transport', 'Automobile', 'Ferroviaire', 'Mobilité', 'Alstom', 'Logistique', 'Aéronautique'] },
  { label: 'Conseil, Audit & Juridique', keywords: ['Conseil', 'Consulting', 'Audit', 'Stratégie', 'Avocat', 'Cabinet', 'Capgemini', 'McKinsey', 'EY', 'Deloitte'] },
  { label: 'Retail, Luxe & E-commerce', keywords: ['Retail', 'Commerce', 'Luxe', 'E-commerce', 'Mode', 'Distribution', 'Cosmétique', 'Vente'] },
  { label: 'Immobilier & BTP', keywords: ['Immobilier', 'BTP', 'Construction', 'Architecture', 'Urbanisme', 'Promoteur'] },
];

export const JOB_TITLE_PRESETS = [
  { label: 'Dirigeants & C-Level', keywords: ['CEO', 'DG', 'Directeur Général', 'Fondateur', 'Président', 'Partner', 'Managing Director', 'Chief'] },
  { label: 'Directions Commerciales & Ventes', keywords: ['Directeur Commercial', 'VP Sales', 'Head of Sales', 'Business Development', 'Account Executive', 'Commercial'] },
  { label: 'Directions Achats & Procurement', keywords: ['Achats', 'Procurement', 'Acheteur', 'Directeur Achats', 'Head of Procurement'] },
  { label: 'Directions Marketing & Partenariats', keywords: ['Directeur Marketing', 'CMO', 'Head of Growth', 'Partenariats', 'Communication', 'Events'] },
  { label: 'Directions IT & Systèmes d\'Information', keywords: ['DSI', 'CTO', 'Directeur Informatique', 'Lead Tech', 'IT Director', 'Architecte'] },
];
