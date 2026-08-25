import { CardMaterial } from './index';

export type NfcWriteStatus = 'pending' | 'writing' | 'success' | 'failed' | 'skipped';

export interface NfcBatchQueueItem {
  id: string;
  profileId: string;
  profileName: string;
  profileCompany?: string;
  profileHeadline?: string;
  profileAvatar?: string;
  profileSlug: string;
  targetUrl: string;
  cardName: string;
  material: CardMaterial;
  status: NfcWriteStatus;
  writtenUid?: string;
  writtenAt?: string;
  errorMessage?: string;
  durationMs?: number;
  existingCardId?: string;
}

export interface NfcBatchConfig {
  autoAdvance: boolean;
  soundEnabled: boolean;
  hapticEnabled: boolean;
  autoRegisterCardInInventory: boolean;
  ndefRecordType: 'url' | 'url_with_text' | 'vcard_link';
  writeTimeoutSeconds: number;
  defaultMaterial: CardMaterial;
}

export interface NfcBatchSessionStats {
  total: number;
  completed: number;
  success: number;
  failed: number;
  skipped: number;
  avgDurationMs: number;
  startTime: number | null;
  endTime: number | null;
}

export interface NfcWriteResult {
  success: boolean;
  uid?: string;
  durationMs: number;
  error?: string;
}
