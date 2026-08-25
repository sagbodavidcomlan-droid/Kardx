import { Lead } from '../types';
import { LeadFilterState, SavedLeadFilter, DateRangePreset } from '../types/savedFilters';

export const DEFAULT_INITIAL_FILTER_STATE: LeadFilterState = {
  searchQuery: '',
  dateRangePreset: 'all',
  customDateStart: '',
  customDateEnd: '',
  sources: [],
  statuses: [],
  selectedAssignee: 'all',
  selectedRoutingFilter: 'all',
  selectedTags: [],
  tagMatchMode: 'any',
  onlyFavorites: false,
  hasReminder: false,
  reminderOverdueOnly: false,
  crmSyncFilter: 'all',
  companyQuery: '',
  cityQuery: '',
};

export const DEFAULT_SAVED_FILTERS: SavedLeadFilter[] = [
  {
    id: 'preset_vip_priority',
    name: '🌟 Leads Prioritaires & VIP',
    description: 'Prospects marqués favoris ou tagués VIP en cours de négociation',
    icon: 'Star',
    color: 'amber',
    isDefault: true,
    filterState: {
      ...DEFAULT_INITIAL_FILTER_STATE,
      onlyFavorites: true,
      selectedTags: ['VIP', 'Décideur'],
      tagMatchMode: 'any',
    },
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'preset_nfc_recent',
    name: '⚡ Captures NFC (7 derniers jours)',
    description: 'Prospects capturés via tap de carte NFC physique cette semaine',
    icon: 'Zap',
    color: 'indigo',
    isDefault: true,
    filterState: {
      ...DEFAULT_INITIAL_FILTER_STATE,
      sources: ['nfc'],
      dateRangePreset: 'last7days',
    },
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'preset_urgent_reminders',
    name: '⏰ Relances & Rappels Urgents',
    description: 'Prospects avec rappel planifié en retard ou prévu aujourd\'hui',
    icon: 'Clock',
    color: 'rose',
    isDefault: true,
    filterState: {
      ...DEFAULT_INITIAL_FILTER_STATE,
      hasReminder: true,
    },
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'preset_new_unassigned',
    name: '🎯 Nouveaux à Assigner',
    description: 'Prospects récents au statut Nouveau non encore assignés à un collaborateur',
    icon: 'UserCheck',
    color: 'sky',
    isDefault: true,
    filterState: {
      ...DEFAULT_INITIAL_FILTER_STATE,
      statuses: ['new'],
      selectedAssignee: 'unassigned',
    },
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'preset_unsynced_crm',
    name: '🔄 Non Synchronisés CRM',
    description: 'Prospects en attente d\'exportation vers HubSpot, Salesforce ou Pipedrive',
    icon: 'RefreshCw',
    color: 'emerald',
    isDefault: true,
    filterState: {
      ...DEFAULT_INITIAL_FILTER_STATE,
      crmSyncFilter: 'unsynced',
    },
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'preset_ai_scanned',
    name: '📸 Scans Scanner IA (Cartes Papier)',
    description: 'Cartes de visite physiques numérisées et retranscrites par OCR / IA',
    icon: 'Sparkles',
    color: 'purple',
    isDefault: true,
    filterState: {
      ...DEFAULT_INITIAL_FILTER_STATE,
      sources: ['card_scanner'],
    },
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

const STORAGE_KEY = 'kardx_saved_lead_filters_v2';

export const loadSavedFiltersFromStorage = (): SavedLeadFilter[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SAVED_FILTERS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Ensure defaults exist if user hasn't deleted them
      const customOnes = parsed.filter((p: SavedLeadFilter) => !p.isDefault);
      const defaults = DEFAULT_SAVED_FILTERS.filter(
        (def) => !parsed.some((p: SavedLeadFilter) => p.id === def.id && !p.isDefault)
      );
      return [...defaults, ...customOnes];
    }
    return DEFAULT_SAVED_FILTERS;
  } catch (err) {
    console.warn('Error loading saved filters from storage', err);
    return DEFAULT_SAVED_FILTERS;
  }
};

export const saveSavedFiltersToStorage = (filters: SavedLeadFilter[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  } catch (err) {
    console.warn('Error saving filters to storage', err);
  }
};

/**
 * Evaluates date matching based on preset or custom range
 */
export const checkDateMatchesPreset = (
  leadDateIso: string,
  preset: DateRangePreset,
  customStart?: string,
  customEnd?: string
): boolean => {
  if (preset === 'all') return true;
  if (!leadDateIso) return false;

  const leadDate = new Date(leadDateIso);
  const now = new Date();

  // Reset times for day comparison
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  switch (preset) {
    case 'today': {
      return leadDate >= todayStart && leadDate <= todayEnd;
    }
    case 'yesterday': {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      return leadDate >= startOfDay(yesterday) && leadDate <= endOfDay(yesterday);
    }
    case 'last7days': {
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);
      return leadDate >= startOfDay(sevenDaysAgo) && leadDate <= todayEnd;
    }
    case 'last30days': {
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 30);
      return leadDate >= startOfDay(thirtyDaysAgo) && leadDate <= todayEnd;
    }
    case 'thisMonth': {
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      return leadDate >= firstOfMonth && leadDate <= todayEnd;
    }
    case 'lastMonth': {
      const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      const lastOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return leadDate >= firstOfLastMonth && leadDate <= lastOfLastMonth;
    }
    case 'custom': {
      if (customStart && customEnd) {
        const start = startOfDay(new Date(customStart));
        const end = endOfDay(new Date(customEnd));
        return leadDate >= start && leadDate <= end;
      }
      if (customStart) {
        const start = startOfDay(new Date(customStart));
        return leadDate >= start;
      }
      if (customEnd) {
        const end = endOfDay(new Date(customEnd));
        return leadDate <= end;
      }
      return true;
    }
    default:
      return true;
  }
};

/**
 * Filter leads according to full filter state
 */
export const applyFilterStateToLeads = (
  leads: Lead[],
  filterState: LeadFilterState
): Lead[] => {
  const query = filterState.searchQuery.trim().toLowerCase();
  const companyQuery = filterState.companyQuery?.trim().toLowerCase();
  const cityQuery = filterState.cityQuery?.trim().toLowerCase();

  return leads.filter((lead) => {
    // 1. Text search query
    if (query) {
      const name = `${lead.firstName} ${lead.lastName}`.toLowerCase();
      const email = (lead.email || '').toLowerCase();
      const company = (lead.company || '').toLowerCase();
      const city = (lead.city || '').toLowerCase();
      const job = (lead.jobTitle || '').toLowerCase();
      const phone = (lead.phone || '').toLowerCase();
      const notes = (lead.notes || '').toLowerCase();
      const reminder = (lead.reminderNote || '').toLowerCase();
      const tagsMatch = lead.tags?.some((t) => t.toLowerCase().includes(query));
      const interactionsMatch = lead.interactions?.some(
        (i) =>
          (i.notes && i.notes.toLowerCase().includes(query)) ||
          (i.title && i.title.toLowerCase().includes(query)) ||
          (i.authorName && i.authorName.toLowerCase().includes(query))
      );

      const matchesSearch =
        name.includes(query) ||
        email.includes(query) ||
        company.includes(query) ||
        city.includes(query) ||
        job.includes(query) ||
        phone.includes(query) ||
        notes.includes(query) ||
        reminder.includes(query) ||
        Boolean(tagsMatch) ||
        Boolean(interactionsMatch);

      if (!matchesSearch) return false;
    }

    // 2. Specific company query
    if (companyQuery && !(lead.company || '').toLowerCase().includes(companyQuery)) {
      return false;
    }

    // 3. Specific city query
    if (cityQuery && !(lead.city || '').toLowerCase().includes(cityQuery)) {
      return false;
    }

    // 4. Date range
    if (
      filterState.dateRangePreset !== 'all' &&
      !checkDateMatchesPreset(
        lead.createdAt,
        filterState.dateRangePreset,
        filterState.customDateStart,
        filterState.customDateEnd
      )
    ) {
      return false;
    }

    // 5. Sources filter (multi-select)
    if (filterState.sources.length > 0) {
      if (!filterState.sources.includes(lead.source)) {
        return false;
      }
    }

    // 6. Status filter (multi-select)
    if (filterState.statuses.length > 0) {
      if (!filterState.statuses.includes(lead.status)) {
        return false;
      }
    }

    // 7. Assignee filter
    if (filterState.selectedAssignee === 'unassigned') {
      if (lead.assignedUserId) return false;
    } else if (filterState.selectedAssignee !== 'all') {
      if (lead.assignedUserId !== filterState.selectedAssignee) return false;
    }

    // 8. Routing filter
    if (filterState.selectedRoutingFilter === 'routed') {
      if (!lead.routedByRuleId) return false;
    } else if (filterState.selectedRoutingFilter === 'manual') {
      if (!lead.assignedUserId || lead.routedByRuleId) return false;
    } else if (filterState.selectedRoutingFilter === 'unassigned') {
      if (lead.assignedUserId) return false;
    }

    // 9. Tags filter (with mode any / all)
    if (filterState.selectedTags.length > 0) {
      const leadTags = (lead.tags || []).map((t) => t.toLowerCase());
      if (filterState.tagMatchMode === 'all') {
        const hasAll = filterState.selectedTags.every((reqTag) =>
          leadTags.includes(reqTag.toLowerCase())
        );
        if (!hasAll) return false;
      } else {
        const hasAny = filterState.selectedTags.some((reqTag) =>
          leadTags.includes(reqTag.toLowerCase())
        );
        if (!hasAny) return false;
      }
    }

    // 10. Favorites
    if (filterState.onlyFavorites && !lead.isFavorite) {
      return false;
    }

    // 11. Reminders
    if (filterState.hasReminder) {
      if (!lead.reminderDate || lead.reminderStatus === 'completed' || lead.reminderStatus === 'cancelled') {
        return false;
      }
      if (filterState.reminderOverdueOnly) {
        const reminderTime = new Date(lead.reminderDate).getTime();
        if (reminderTime > Date.now()) {
          return false;
        }
      }
    }

    // 12. CRM Sync filter
    if (filterState.crmSyncFilter !== 'all') {
      const syncValues = lead.crmSyncStatus ? Object.values(lead.crmSyncStatus) : [];
      const hasSynced = syncValues.some((s) => s?.status === 'synced');

      if (filterState.crmSyncFilter === 'synced' && !hasSynced) return false;
      if (filterState.crmSyncFilter === 'unsynced' && hasSynced) return false;
    }

    return true;
  });
};

/**
 * Counts how many individual filter criteria are actively applied
 */
export const countActiveFilters = (state: LeadFilterState): number => {
  let count = 0;
  if (state.searchQuery.trim()) count++;
  if (state.dateRangePreset !== 'all') count++;
  if (state.sources.length > 0) count += state.sources.length;
  if (state.statuses.length > 0) count += state.statuses.length;
  if (state.selectedAssignee !== 'all') count++;
  if (state.selectedRoutingFilter !== 'all') count++;
  if (state.selectedTags.length > 0) count += state.selectedTags.length;
  if (state.onlyFavorites) count++;
  if (state.hasReminder) count++;
  if (state.crmSyncFilter !== 'all') count++;
  if (state.companyQuery?.trim()) count++;
  if (state.cityQuery?.trim()) count++;
  return count;
};

/**
 * Returns formatted label for date range
 */
export const getDatePresetLabel = (preset: DateRangePreset): string => {
  switch (preset) {
    case 'all': return 'Toutes les dates';
    case 'today': return "Aujourd'hui";
    case 'yesterday': return 'Hier';
    case 'last7days': return '7 derniers jours';
    case 'last30days': return '30 derniers jours';
    case 'thisMonth': return 'Ce mois-ci';
    case 'lastMonth': return 'Mois dernier';
    case 'custom': return 'Période personnalisée';
    default: return preset;
  }
};
