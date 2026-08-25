import { LeadStatus } from './index';

export type DateRangePreset = 
  | 'all' 
  | 'today' 
  | 'yesterday' 
  | 'last7days' 
  | 'last30days' 
  | 'thisMonth' 
  | 'lastMonth' 
  | 'custom';

export interface LeadFilterState {
  searchQuery: string;
  dateRangePreset: DateRangePreset;
  customDateStart?: string; // YYYY-MM-DD
  customDateEnd?: string;   // YYYY-MM-DD
  sources: string[];        // Empty array means 'all sources'
  statuses: LeadStatus[];   // Empty array means 'all statuses'
  selectedAssignee: string; // 'all' | 'unassigned' | userId
  selectedRoutingFilter: 'all' | 'routed' | 'manual' | 'unassigned';
  selectedTags: string[];   // Empty array means no tag filter
  tagMatchMode: 'any' | 'all'; // 'any' (OR) vs 'all' (AND)
  onlyFavorites: boolean;
  hasReminder: boolean;     // filter leads that have a reminder
  reminderOverdueOnly: boolean;
  crmSyncFilter: 'all' | 'synced' | 'unsynced';
  companyQuery?: string;
  cityQuery?: string;
}

export interface SavedLeadFilter {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji or lucide icon name
  color: 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky' | 'purple' | 'slate';
  isDefault?: boolean;
  filterState: LeadFilterState;
  createdAt: string;
  updatedAt?: string;
}
