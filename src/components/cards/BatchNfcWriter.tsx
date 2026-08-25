import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { CardMaterial, PhysicalCard } from '../../types';
import { 
  NfcBatchQueueItem, 
  NfcBatchConfig, 
  NfcWriteStatus, 
  NfcBatchSessionStats 
} from '../../types/nfc';
import { 
  isWebNfcSupported, 
  getNfcSupportDiagnostics, 
  writeNfcTag, 
  generateRandomNfcUid, 
  exportNfcBatchToCsv, 
  getMaterialLabel 
} from '../../utils/webNfc';
import { 
  Radio, 
  Wifi, 
  Smartphone, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  Download, 
  Plus, 
  Trash2, 
  Settings, 
  Volume2, 
  VolumeX, 
  Zap, 
  Check, 
  Layers, 
  CreditCard, 
  Users, 
  Info, 
  ShieldCheck, 
  ExternalLink,
  Sparkles,
  ChevronRight,
  ArrowRight,
  Database,
  Sliders,
  HelpCircle
} from 'lucide-react';

interface BatchNfcWriterProps {
  onCardRegistered?: () => void;
}

export const BatchNfcWriter: React.FC<BatchNfcWriterProps> = ({ onCardRegistered }) => {
  const { 
    visibleProfiles, 
    visibleCards, 
    activeProfile, 
    addCard, 
    showToast 
  } = useApp();

  const profiles = visibleProfiles;
  const existingCards = visibleCards;

  // Diagnostics info
  const [diagnostics, setDiagnostics] = useState(() => getNfcSupportDiagnostics());
  const [showDiagModal, setShowDiagModal] = useState(false);

  // Configuration settings
  const [config, setConfig] = useState<NfcBatchConfig>({
    autoAdvance: true,
    soundEnabled: true,
    hapticEnabled: true,
    autoRegisterCardInInventory: true,
    ndefRecordType: 'url',
    writeTimeoutSeconds: 15,
    defaultMaterial: 'metal_black',
  });

  // Batch Queue State
  const [queue, setQueue] = useState<NfcBatchQueueItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [isWritingNow, setIsWritingNow] = useState<boolean>(false);
  const [lastWrittenResult, setLastWrittenResult] = useState<{
    success: boolean;
    uid?: string;
    durationMs?: number;
    error?: string;
  } | null>(null);

  // Session timer tracking
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [sessionEndTime, setSessionEndTime] = useState<number | null>(null);
  const [activeAntennaAnimation, setActiveAntennaAnimation] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize queue with profiles on first mount if empty
  useEffect(() => {
    if (queue.length === 0 && profiles.length > 0) {
      loadTeamProfilesToQueue();
    }
  }, [profiles]);

  // Update diagnostics on mount
  useEffect(() => {
    setDiagnostics(getNfcSupportDiagnostics());
  }, []);

  // Populate queue with all team profiles
  const loadTeamProfilesToQueue = (selectedMaterial: CardMaterial = config.defaultMaterial) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const newItems: NfcBatchQueueItem[] = profiles.map((p, idx) => ({
      id: `batch_${Date.now()}_${idx}_${p.id}`,
      profileId: p.id,
      profileName: `${p.firstName} ${p.lastName}`,
      profileCompany: p.company,
      profileHeadline: p.headline,
      profileAvatar: p.avatarUrl,
      profileSlug: p.slug,
      targetUrl: `${origin}/p/${p.slug}`,
      cardName: `Carte NFC - ${p.firstName} ${p.lastName}`,
      material: selectedMaterial,
      status: 'pending',
    }));

    setQueue(newItems);
    setCurrentIndex(0);
    setIsSessionActive(false);
    setLastWrittenResult(null);
    showToast(`${newItems.length} profils chargés dans la file de programmation`);
  };

  // Populate queue with profiles that don't have an active card yet
  const loadUnassignedProfilesToQueue = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const assignedProfileIds = new Set(existingCards.map((c) => c.profileId));
    const unassignedProfiles = profiles.filter((p) => !assignedProfileIds.has(p.id));

    if (unassignedProfiles.length === 0) {
      showToast('Tous les profils possèdent déjà au moins une carte physique enregistrée.');
      return;
    }

    const newItems: NfcBatchQueueItem[] = unassignedProfiles.map((p, idx) => ({
      id: `batch_unassigned_${Date.now()}_${idx}_${p.id}`,
      profileId: p.id,
      profileName: `${p.firstName} ${p.lastName}`,
      profileCompany: p.company,
      profileHeadline: p.headline,
      profileAvatar: p.avatarUrl,
      profileSlug: p.slug,
      targetUrl: `${origin}/p/${p.slug}`,
      cardName: `Carte NFC - ${p.firstName} ${p.lastName}`,
      material: config.defaultMaterial,
      status: 'pending',
    }));

    setQueue(newItems);
    setCurrentIndex(0);
    setIsSessionActive(false);
    setLastWrittenResult(null);
    showToast(`${newItems.length} profils sans carte ajoutés à la file`);
  };

  // Add a blank custom sequential batch
  const generateGenericEventBatch = (count = 5) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const targetProfile = activeProfile;
    const newItems: NfcBatchQueueItem[] = Array.from({ length: count }, (_, i) => {
      const batchNum = (i + 1).toString().padStart(2, '0');
      const token = `krd_event_${Math.random().toString(36).substring(2, 7)}`;
      return {
        id: `batch_event_${Date.now()}_${i}`,
        profileId: targetProfile.id,
        profileName: `${targetProfile.firstName} ${targetProfile.lastName}`,
        profileCompany: targetProfile.company,
        profileHeadline: targetProfile.headline,
        profileAvatar: targetProfile.avatarUrl,
        profileSlug: targetProfile.slug,
        targetUrl: `${origin}/p/${targetProfile.slug}?nfc_batch=${batchNum}&t=${token}`,
        cardName: `Badge Event #${batchNum} (${targetProfile.firstName})`,
        material: config.defaultMaterial,
        status: 'pending',
      };
    });

    setQueue((prev) => [...prev, ...newItems]);
    showToast(`${count} badges événementiels ajoutés à la file`);
  };

  // Add individual profile to queue
  const addProfileToQueue = (profileId: string) => {
    const p = profiles.find((prof) => prof.id === profileId);
    if (!p) return;

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const newItem: NfcBatchQueueItem = {
      id: `batch_item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      profileId: p.id,
      profileName: `${p.firstName} ${p.lastName}`,
      profileCompany: p.company,
      profileHeadline: p.headline,
      profileAvatar: p.avatarUrl,
      profileSlug: p.slug,
      targetUrl: `${origin}/p/${p.slug}`,
      cardName: `Carte NFC - ${p.firstName} ${p.lastName}`,
      material: config.defaultMaterial,
      status: 'pending',
    };

    setQueue((prev) => [...prev, newItem]);
    showToast(`Profil "${p.firstName} ${p.lastName}" ajouté à la file.`);
  };

  // Remove single item from queue
  const removeFromQueue = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
    if (currentIndex >= queue.length - 1 && currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // Clear entire queue
  const clearQueue = () => {
    if (isSessionActive) {
      handleStopSession();
    }
    setQueue([]);
    setCurrentIndex(0);
    setLastWrittenResult(null);
    showToast('File de programmation vidée');
  };

  // Change material for all items
  const updateAllMaterials = (material: CardMaterial) => {
    setConfig((prev) => ({ ...prev, defaultMaterial: material }));
    setQueue((prev) => prev.map((item) => ({ ...item, material })));
    showToast(`Matériau appliqué à tout le lot : ${getMaterialLabel(material)}`);
  };

  // Computed Session Stats
  const stats: NfcBatchSessionStats = useMemo(() => {
    const total = queue.length;
    const completed = queue.filter((i) => i.status === 'success' || i.status === 'failed' || i.status === 'skipped').length;
    const success = queue.filter((i) => i.status === 'success').length;
    const failed = queue.filter((i) => i.status === 'failed').length;
    const skipped = queue.filter((i) => i.status === 'skipped').length;

    const durations = queue.filter((i) => i.durationMs && i.status === 'success').map((i) => i.durationMs as number);
    const avgDurationMs = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;

    return {
      total,
      completed,
      success,
      failed,
      skipped,
      avgDurationMs,
      startTime: sessionStartTime,
      endTime: sessionEndTime,
    };
  }, [queue, sessionStartTime, sessionEndTime]);

  const currentItem = queue[currentIndex] || null;
  const hasRemainingPending = queue.some((i) => i.status === 'pending');

  // Start Batch Session
  const handleStartSession = () => {
    if (queue.length === 0) {
      showToast('Veuillez ajouter des cartes à la file de programmation.');
      return;
    }

    // Find first pending item
    const firstPendingIdx = queue.findIndex((i) => i.status === 'pending');
    const targetIdx = firstPendingIdx !== -1 ? firstPendingIdx : 0;

    setCurrentIndex(targetIdx);
    setIsSessionActive(true);
    setSessionStartTime(Date.now());
    setSessionEndTime(null);
    setLastWrittenResult(null);

    showToast('Session de programmation en série active ! Approchez la première carte.');
  };

  // Pause / Stop Session
  const handlePauseSession = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsSessionActive(false);
    setIsWritingNow(false);
    setActiveAntennaAnimation(false);
    showToast('Session en pause');
  };

  const handleStopSession = () => {
    handlePauseSession();
    setSessionEndTime(Date.now());
    showToast('Session terminée');
  };

  // Perform NFC write on the CURRENT active card in queue
  const handleProgramCurrentCard = async () => {
    if (!currentItem || isWritingNow) return;

    setIsWritingNow(true);
    setActiveAntennaAnimation(true);

    // Update item status in queue to 'writing'
    setQueue((prev) =>
      prev.map((item, idx) => (idx === currentIndex ? { ...item, status: 'writing' } : item))
    );

    const abortCtrl = new AbortController();
    abortControllerRef.current = abortCtrl;

    try {
      const result = await writeNfcTag(currentItem.targetUrl, {
        textDescription: `KardX Digital Card - ${currentItem.profileName}`,
        timeoutMs: config.writeTimeoutSeconds * 1000,
        abortSignal: abortCtrl.signal,
        simulateIfUnsupported: true,
        playAudio: config.soundEnabled,
        triggerHaptics: config.hapticEnabled,
      });

      setLastWrittenResult(result);
      setIsWritingNow(false);
      setActiveAntennaAnimation(false);

      const writtenUid = result.uid || generateRandomNfcUid();
      const writtenAt = new Date().toISOString();

      if (result.success) {
        // Automatically register in AppContext Cards Inventory if configured
        if (config.autoRegisterCardInInventory) {
          const generatedToken = `krd_${Math.random().toString(36).substring(2, 9)}`;
          addCard({
            name: currentItem.cardName,
            uid: writtenUid,
            token: generatedToken,
            material: currentItem.material,
            profileId: currentItem.profileId,
            organizationId: activeProfile.organizationId,
            status: 'active',
            notes: `Programmée en série via Batch NFC le ${new Date().toLocaleDateString('fr-FR')}`,
          });
          if (onCardRegistered) onCardRegistered();
        }

        // Update item state to 'success'
        setQueue((prev) =>
          prev.map((item, idx) =>
            idx === currentIndex
              ? {
                  ...item,
                  status: 'success',
                  writtenUid,
                  writtenAt,
                  durationMs: result.durationMs,
                  errorMessage: undefined,
                }
              : item
          )
        );

        showToast(`Carte #${currentIndex + 1} (${currentItem.profileName}) programmée avec succès !`);

        // Auto Advance to next card if enabled
        if (config.autoAdvance) {
          setTimeout(() => {
            handleAdvanceToNext();
          }, 800);
        }
      } else {
        // Failed
        setQueue((prev) =>
          prev.map((item, idx) =>
            idx === currentIndex
              ? {
                  ...item,
                  status: 'failed',
                  errorMessage: result.error || 'Échec de programmation',
                  durationMs: result.durationMs,
                }
              : item
          )
        );
        showToast(result.error || 'Erreur lors de la programmation.');
      }
    } catch (err: unknown) {
      const errorObj = err as Error;
      setIsWritingNow(false);
      setActiveAntennaAnimation(false);
      setQueue((prev) =>
        prev.map((item, idx) =>
          idx === currentIndex
            ? {
                ...item,
                status: 'failed',
                errorMessage: errorObj.message || 'Erreur inattendue',
              }
            : item
        )
      );
    }
  };

  // Move to next card in queue
  const handleAdvanceToNext = () => {
    if (currentIndex < queue.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setLastWrittenResult(null);
    } else {
      // Reached the end of queue
      setIsSessionActive(false);
      setSessionEndTime(Date.now());
      showToast('Toutes les cartes de la file ont été traitées !');
    }
  };

  // Skip current card
  const handleSkipCurrent = () => {
    setQueue((prev) =>
      prev.map((item, idx) => (idx === currentIndex ? { ...item, status: 'skipped' } : item))
    );
    handleAdvanceToNext();
  };

  // Retry current or selected card
  const handleRetryCard = (index: number) => {
    setCurrentIndex(index);
    setQueue((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, status: 'pending', errorMessage: undefined } : item))
    );
    setLastWrittenResult(null);
    setIsSessionActive(true);
  };

  // Export report
  const handleExportReport = () => {
    const filename = `kardx_batch_nfc_${new Date().toISOString().slice(0, 10)}.csv`;
    exportNfcBatchToCsv(queue, filename);
    showToast('Rapport de programmation NFC exporté en .CSV');
  };

  return (
    <div className="flex flex-col gap-6 text-slate-800 animate-in fade-in duration-200">
      
      {/* 1. TOP HARDWARE DIAGNOSTICS & STATUS BANNER */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
            diagnostics.isSupported 
              ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
              : 'bg-indigo-50 text-indigo-600 border-indigo-200'
          }`}>
            <Radio className={`w-5 h-5 ${isWritingNow ? 'animate-pulse text-indigo-500' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-800">
                Module Web NFC API & Encodeur RFID 13.56 MHz
              </h3>
              {diagnostics.isSupported ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Web NFC Actif
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-600" />
                  Mode Hybride & Simulateur Live
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
              {diagnostics.recommendation}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          <button
            onClick={() => setShowDiagModal(true)}
            className="py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold text-xs border border-slate-200 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Info className="w-3.5 h-3.5 text-indigo-600" />
            <span>Guide & Compatibilité</span>
          </button>

          <button
            onClick={() => setConfig((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
              config.soundEnabled
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
            title={config.soundEnabled ? 'Son haptique activé' : 'Son désactivé'}
          >
            {config.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. STATS & PROGRESS OVERVIEW BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        
        {/* Total in queue */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">File de Cartes</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-800">{stats.total}</span>
            <span className="text-xs text-slate-500 font-medium">prêtes</span>
          </div>
        </div>

        {/* Success */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Programmées</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600">{stats.success}</span>
            <span className="text-xs text-slate-500 font-medium">
              ({stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 0}%)
            </span>
          </div>
        </div>

        {/* Pending */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Restantes</span>
            <Radio className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600">{stats.total - stats.completed}</span>
            <span className="text-xs text-slate-500 font-medium">en attente</span>
          </div>
        </div>

        {/* Speed / Latency */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-indigo-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Temps Moyen</span>
            <Zap className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-600">
              {stats.avgDurationMs > 0 ? `${stats.avgDurationMs}` : '—'}
            </span>
            <span className="text-xs text-slate-500 font-medium">{stats.avgDurationMs > 0 ? 'ms / tag' : 'NTAG216'}</span>
          </div>
        </div>

      </div>

      {/* 3. MAIN INTERFACE GRID: LIVE PROGRAMMING STATION (LEFT) & QUEUE CONTROLLER (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: LIVE RFID NFC ENCODER STATION (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          
          <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col gap-6">
            
            {/* Header: Station Status */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                  <span>Poste d'Encodage NFC en Série</span>
                  {isSessionActive && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white animate-pulse">
                      Session en cours
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500">
                  {queue.length > 0 
                    ? `Carte ${currentIndex + 1} sur ${queue.length} • Format NDEF URI (RFC 3986)` 
                    : 'Aucune carte dans la file'}
                </p>
              </div>

              {/* Progress pill */}
              {queue.length > 0 && (
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-slate-700">
                    {Math.round(((currentIndex + 1) / queue.length) * 100)}%
                  </span>
                  <div className="w-24 h-2 rounded-full bg-slate-100 overflow-hidden mt-1">
                    <div 
                      className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                      style={{ width: `${((currentIndex + (currentItem?.status === 'success' ? 1 : 0)) / queue.length) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* INTERACTIVE ANTENNA & ACTIVE CARD SPOT */}
            {currentItem ? (
              <div className="flex flex-col items-center gap-6">
                
                {/* Visual Card Representation */}
                <div className={`w-full max-w-sm h-48 rounded-2xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden transition-all duration-300 ${
                  isWritingNow 
                    ? 'ring-4 ring-indigo-500 scale-102 shadow-indigo-500/25' 
                    : currentItem.status === 'success'
                    ? 'ring-2 ring-emerald-500 shadow-emerald-500/10'
                    : currentItem.status === 'failed'
                    ? 'ring-2 ring-rose-500 shadow-rose-500/10'
                    : 'shadow-slate-200'
                } ${
                  currentItem.material === 'wood_bamboo'
                    ? 'bg-amber-900 text-amber-50 border border-amber-800'
                    : currentItem.material === 'metal_black'
                    ? 'bg-slate-950 text-white border border-slate-800'
                    : currentItem.material === 'metal_gold'
                    ? 'bg-gradient-to-tr from-amber-700 via-yellow-600 to-amber-800 text-white'
                    : currentItem.material === 'metal_silver'
                    ? 'bg-gradient-to-tr from-slate-700 via-slate-600 to-slate-800 text-white'
                    : 'bg-indigo-950 text-white border border-indigo-900'
                }`}>
                  {/* Decorative shimmer */}
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />

                  {/* Card top */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black tracking-widest uppercase">
                        KARDX • {getMaterialLabel(currentItem.material)}
                      </span>
                    </div>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      isWritingNow 
                        ? 'bg-indigo-500 text-white animate-spin' 
                        : currentItem.status === 'success'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white/10 text-indigo-300'
                    }`}>
                      {currentItem.status === 'success' ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Wifi className="w-4 h-4 rotate-90" />
                      )}
                    </div>
                  </div>

                  {/* Card Center: Profile details */}
                  <div className="flex items-center gap-3">
                    {currentItem.profileAvatar ? (
                      <img 
                        src={currentItem.profileAvatar} 
                        alt={currentItem.profileName}
                        className="w-11 h-11 rounded-full object-cover border-2 border-white/40 shadow-sm" 
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-white/20 border border-white/30 flex items-center justify-center font-bold text-sm text-white">
                        {currentItem.profileName.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-black truncate text-white">{currentItem.profileName}</p>
                      <p className="text-[11px] text-slate-300 truncate font-medium">{currentItem.profileCompany || 'KardX Network'}</p>
                    </div>
                  </div>

                  {/* Card Footer: Target URL & UID */}
                  <div className="flex items-center justify-between text-[10px] font-mono border-t border-white/15 pt-2 text-slate-300">
                    <span className="truncate max-w-[170px] text-white/80">/p/{currentItem.profileSlug}</span>
                    <span className="font-bold text-indigo-200">
                      {currentItem.writtenUid ? currentItem.writtenUid.substring(0, 14) + '...' : 'Attente Puce NFC'}
                    </span>
                  </div>
                </div>

                {/* RFID ANTENNA TARGET ZONE & PULSE EFFECT */}
                <div className={`w-full p-6 rounded-3xl border text-center flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300 ${
                  isWritingNow
                    ? 'bg-indigo-950 text-white border-indigo-500 shadow-xl'
                    : currentItem.status === 'success'
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                    : currentItem.status === 'failed'
                    ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}>
                  {/* Concentric wave rings when transmitting */}
                  {isWritingNow && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-24 h-24 rounded-full border-2 border-indigo-400 animate-ping opacity-75" />
                      <div className="w-48 h-48 rounded-full border border-cyan-400 animate-pulse opacity-50" />
                    </div>
                  )}

                  {isWritingNow ? (
                    <div className="flex flex-col items-center gap-2 z-10">
                      <Radio className="w-8 h-8 text-indigo-400 animate-spin" />
                      <h4 className="font-bold text-sm text-white">Écriture NDEF en cours...</h4>
                      <p className="text-xs text-indigo-200">Maintenez la puce NFC immobile contre l'antenne (&lt; 2 cm)</p>
                    </div>
                  ) : currentItem.status === 'success' ? (
                    <div className="flex flex-col items-center gap-1 z-10 animate-in zoom-in duration-200">
                      <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-1">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-sm text-emerald-900">Puce NTAG Programmée & Enregistrée !</h4>
                      <p className="text-xs text-emerald-700 font-mono">
                        UID : {currentItem.writtenUid} • Durée : {currentItem.durationMs || 32} ms
                      </p>
                    </div>
                  ) : currentItem.status === 'failed' ? (
                    <div className="flex flex-col items-center gap-1 z-10 animate-in zoom-in duration-200">
                      <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-1">
                        <XCircle className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-sm text-rose-900">Échec de programmation</h4>
                      <p className="text-xs text-rose-700">{currentItem.errorMessage || 'Carte retirée trop tôt'}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 z-10">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                        <Smartphone className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-800">
                          Prêt pour la carte #{currentIndex + 1} : {currentItem.profileName}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Cliquez ci-dessous pour déclencher l'écriture sans contact
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Primary NFC Trigger Button */}
                  <div className="mt-5 w-full flex flex-col sm:flex-row items-center justify-center gap-2.5 z-10">
                    <button
                      onClick={handleProgramCurrentCard}
                      disabled={isWritingNow}
                      className={`w-full sm:w-auto py-3 px-6 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition active:scale-98 cursor-pointer disabled:opacity-60 ${
                        currentItem.status === 'success'
                          ? 'bg-slate-800 hover:bg-slate-700 text-white'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/20'
                      }`}
                    >
                      <Zap className="w-4 h-4 text-amber-300" />
                      <span>
                        {currentItem.status === 'success'
                          ? 'Ré-encoder cette carte'
                          : isWritingNow
                          ? 'Communication NFC...'
                          : 'Encoder la carte (Approcher la puce NFC)'}
                      </span>
                    </button>

                    <button
                      onClick={handleSkipCurrent}
                      disabled={isWritingNow}
                      className="py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 transition cursor-pointer flex items-center gap-1.5"
                    >
                      <SkipForward className="w-3.5 h-3.5" />
                      <span>Passer</span>
                    </button>

                    {currentIndex < queue.length - 1 && (
                      <button
                        onClick={handleAdvanceToNext}
                        disabled={isWritingNow}
                        className="py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
                      >
                        <span>Suivante</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                </div>

              </div>
            ) : (
              /* EMPTY STATE: NO CARDS IN QUEUE */
              <div className="p-10 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center flex flex-col items-center justify-center">
                <CreditCard className="w-10 h-10 text-slate-300 mb-3" />
                <h4 className="font-bold text-sm text-slate-700">Aucune carte dans la file</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  Ajoutez les profils de votre équipe ou générez un lot de badges pour démarrer la session de programmation en série.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                  <button
                    onClick={() => loadTeamProfilesToQueue()}
                    className="py-2 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Charger toute l'équipe ({profiles.length})</span>
                  </button>
                  <button
                    onClick={() => generateGenericEventBatch(5)}
                    className="py-2 px-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 transition cursor-pointer"
                  >
                    + 5 Badges Événementiels
                  </button>
                </div>
              </div>
            )}

            {/* ACTIVE CONFIGURATION QUICK TOGGLES */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={config.autoAdvance}
                  onChange={(e) => setConfig((prev) => ({ ...prev, autoAdvance: e.target.checked }))}
                  className="rounded text-indigo-600 w-4 h-4 cursor-pointer"
                />
                <span>Avance automatique à la carte suivante après succès</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={config.autoRegisterCardInInventory}
                  onChange={(e) => setConfig((prev) => ({ ...prev, autoRegisterCardInInventory: e.target.checked }))}
                  className="rounded text-indigo-600 w-4 h-4 cursor-pointer"
                />
                <span className="flex items-center gap-1">
                  <Database className="w-3 h-3 text-indigo-600" />
                  <span>Enregistrer automatiquement dans l'inventaire KardX</span>
                </span>
              </label>
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: BATCH QUEUE MANAGER & HISTORY (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          
          <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col gap-5">
            
            {/* Queue Header & Actions */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-base text-slate-800">
                  File d'Attente & Lots ({queue.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Ordre de programmation séquentielle
                </p>
              </div>

              {queue.length > 0 && (
                <button
                  onClick={clearQueue}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer text-xs font-semibold flex items-center gap-1"
                  title="Vider la file"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Vider</span>
                </button>
              )}
            </div>

            {/* Quick Add Presets Panel */}
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Génération Rapide de Lots :
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => loadTeamProfilesToQueue()}
                  className="py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 transition flex items-center justify-center gap-1.5 cursor-pointer text-center"
                >
                  <Users className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>Tous les Profils ({profiles.length})</span>
                </button>

                <button
                  onClick={loadUnassignedProfilesToQueue}
                  className="py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 transition flex items-center justify-center gap-1.5 cursor-pointer text-center"
                >
                  <CreditCard className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Sans carte NFC</span>
                </button>
              </div>

              {/* Add specific profile dropdown */}
              <div className="flex items-center gap-2 mt-1">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      addProfileToQueue(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  defaultValue=""
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer focus:bg-white"
                >
                  <option value="" disabled>+ Ajouter un profil individuel...</option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} ({p.company || 'KardX'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Material Bulk Preset Picker */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Matériau du lot :</span>
              <select
                value={config.defaultMaterial}
                onChange={(e) => updateAllMaterials(e.target.value as CardMaterial)}
                className="py-1 px-2.5 rounded-lg bg-white border border-slate-200 font-bold text-slate-800 cursor-pointer text-xs"
              >
                <option value="metal_black">Métal Noir Mat Gravé</option>
                <option value="metal_silver">Métal Argent Brossé</option>
                <option value="metal_gold">Métal Or Prestige</option>
                <option value="wood_bamboo">Bois Bambou Écologique</option>
                <option value="pvc_matte">PVC Soft-Touch Recyclé</option>
                <option value="qr_stand">Chevalet / Stand</option>
              </select>
            </div>

            {/* Scrollable Queue List */}
            <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-1">
              {queue.map((item, idx) => {
                const isSelected = idx === currentIndex;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setLastWrittenResult(null);
                    }}
                    className={`p-3 rounded-2xl border transition flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-500/20 shadow-xs'
                        : item.status === 'success'
                        ? 'border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50/70'
                        : item.status === 'failed'
                        ? 'border-rose-200 bg-rose-50/40 hover:bg-rose-50/70'
                        : 'border-slate-200/80 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Status Icon Indicator */}
                      <div className="shrink-0">
                        {item.status === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : item.status === 'writing' ? (
                          <Radio className="w-4 h-4 text-indigo-600 animate-spin" />
                        ) : item.status === 'failed' ? (
                          <XCircle className="w-4 h-4 text-rose-600" />
                        ) : item.status === 'skipped' ? (
                          <span className="w-4 h-4 rounded-full bg-slate-300 text-white text-[9px] flex items-center justify-center font-bold">
                            S
                          </span>
                        ) : (
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-[10px] flex items-center justify-center font-bold font-mono">
                            {idx + 1}
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="min-w-0">
                        <p className={`text-xs font-bold truncate ${isSelected ? 'text-indigo-950' : 'text-slate-800'}`}>
                          {item.profileName}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate font-mono">
                          {item.writtenUid ? `UID: ${item.writtenUid}` : `/p/${item.profileSlug}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        item.status === 'success'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'failed'
                          ? 'bg-rose-100 text-rose-800'
                          : isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {item.status === 'success'
                          ? 'OK'
                          : item.status === 'failed'
                          ? 'Échec'
                          : isSelected
                          ? 'Actif'
                          : 'En attente'}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromQueue(item.id);
                        }}
                        className="p-1 rounded text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Retirer de la file"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Export Report Action */}
            {queue.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleExportReport}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Download className="w-4 h-4 text-slate-600" />
                  <span>Exporter le rapport d'encodage (.CSV)</span>
                </button>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* 4. DIAGNOSTICS & COMPATIBILITY MODAL */}
      {showDiagModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-800 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-800">Spécifications & Compatibilité Web NFC</h3>
                  <p className="text-xs text-slate-500">Standards ISO/IEC 14443-A & NDEF (NFC Data Exchange Format)</p>
                </div>
              </div>
              <button
                onClick={() => setShowDiagModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-4 text-xs text-slate-600">
              
              {/* Browser support card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-indigo-600" />
                  <span>Navigateurs et Équipements Compatibles</span>
                </h4>
                <ul className="list-disc pl-4 space-y-1.5 text-slate-600">
                  <li>
                    <strong className="text-slate-800">Google Chrome pour Android :</strong> Support natif complet sans extension requise (Android 8.0+ avec NFC activé).
                  </li>
                  <li>
                    <strong className="text-slate-800">PC / Mac / Ordinateur :</strong> Utilisez les lecteurs USB NFC standard (ACR122U, Omnikey) ou le mode simulateur interactif intégré.
                  </li>
                  <li>
                    <strong className="text-slate-800">Apple iOS (iPhone) :</strong> Apple restreint l'écriture NFC Web directe aux applications natives. Les cartes écrites sont cependant 100% lisibles par tous les iPhones dès l'iPhone XR / 11 / 12 / 13 / 14 / 15 sans aucune application !
                  </li>
                </ul>
              </div>

              {/* Supported chip types */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Types de Puces NFC Supportées</span>
                </h4>
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                    <p className="font-bold text-slate-800">NXP NTAG213</p>
                    <p className="text-slate-500 mt-0.5">Capacité : 144 octets</p>
                    <p className="text-[10px] text-indigo-600 mt-1">Idéal URLs courtes</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                    <p className="font-bold text-slate-800">NXP NTAG215</p>
                    <p className="text-slate-500 mt-0.5">Capacité : 504 octets</p>
                    <p className="text-[10px] text-indigo-600 mt-1">Standard polyvalent</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                    <p className="font-bold text-slate-800">NXP NTAG216</p>
                    <p className="text-slate-500 mt-0.5">Capacité : 888 octets</p>
                    <p className="text-[10px] text-emerald-600 mt-1">Recommandé KardX</p>
                  </div>
                </div>
              </div>

              {/* Metal cards guidance */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900">
                <p className="font-bold text-xs flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Cartes en Métal & Blindage Anti-Interférence :</span>
                </p>
                <p className="text-[11px] leading-relaxed">
                  Pour les cartes en métal (noir mat, argent brossé, or), veillez à utiliser des puces avec couche de ferrite isolante (Anti-Metal Foil) afin d'éviter l'atténuation du champ électromagnétique 13.56 MHz.
                </p>
              </div>

            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowDiagModal(false)}
                className="py-2.5 px-5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
