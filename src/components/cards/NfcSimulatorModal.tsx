import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  Wifi, 
  Smartphone, 
  CheckCircle2, 
  Sparkles, 
  CreditCard,
  Layers,
  ArrowRight,
  ShieldCheck,
  Volume2,
  VolumeX,
  Radio,
  Zap,
  Check
} from 'lucide-react';
import { playNfcApproachSound, playNfcSuccessSound, triggerHaptic } from '../../utils/hapticsAudio';

export const NfcSimulatorModal: React.FC = () => {
  const { 
    isNfcSimModalOpen, 
    setIsNfcSimModalOpen, 
    cards, 
    simulateNfcTap, 
    activeProfile 
  } = useApp();

  const [selectedCardId, setSelectedCardId] = useState<string>(cards[0]?.id || '');
  const [isTapping, setIsTapping] = useState(false);
  const [notificationTriggered, setNotificationTriggered] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [shockwaveActive, setShockwaveActive] = useState(false);

  useEffect(() => {
    if (cards.length > 0 && !selectedCardId) {
      setSelectedCardId(cards[0].id);
    }
  }, [cards, selectedCardId]);

  if (!isNfcSimModalOpen) return null;

  const selectedCard = cards.find((c) => c.id === selectedCardId) || cards[0];

  const handleTap = () => {
    setIsTapping(true);
    setNotificationTriggered(false);
    setShockwaveActive(false);

    if (soundEnabled) {
      playNfcApproachSound();
    }

    // Step 1: Approach NFC antenna
    setTimeout(() => {
      // Step 2: Successful detection event!
      if (soundEnabled) {
        playNfcSuccessSound();
      }
      triggerHaptic([30, 45, 65]);
      setShockwaveActive(true);
      setNotificationTriggered(true);
      setIsTapping(false);
    }, 850);
  };

  const handleOpenFromNotification = () => {
    setIsNfcSimModalOpen(false);
    setNotificationTriggered(false);
    setShockwaveActive(false);
    simulateNfcTap(selectedCard?.id || '');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 animate-in fade-in zoom-in duration-200">
        
        {/* Top Control Bar: Sound Toggle & Close Button */}
        <div className="absolute top-5 right-5 flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
              soundEnabled
                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20'
                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title={soundEnabled ? 'Désactiver le son haptique' : 'Activer le son haptique'}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-indigo-400" />
                <span className="text-[11px] hidden sm:inline">Son Haptique ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-slate-500" />
                <span className="text-[11px] hidden sm:inline">Son OFF</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              setIsNfcSimModalOpen(false);
              setNotificationTriggered(false);
              setShockwaveActive(false);
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6 pr-28 sm:pr-36">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              Simulateur de Tap NFC Physique
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                13.56 MHz Live
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Visualisez la détection instantanée de la puce NTAG216 par un smartphone à proximité (&lt; 3cm)
            </p>
          </div>
        </div>

        {/* Card Selector */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
            <span>Sélectionner une carte physique du compte :</span>
            <span className="text-[10px] text-slate-500 font-mono">Puce sans contact NXP NTAG216</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {cards.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedCardId(c.id);
                  setNotificationTriggered(false);
                  setShockwaveActive(false);
                }}
                className={`p-3 rounded-xl border text-left transition flex items-center gap-2.5 ${
                  selectedCard?.id === c.id
                    ? 'border-indigo-500 bg-indigo-950/40 text-white shadow-sm ring-1 ring-indigo-500/40'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <CreditCard className="w-4 h-4 text-indigo-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate text-white">{c.name}</p>
                  <p className="text-[10px] text-slate-400 truncate font-mono">UID : {c.uid}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* SIMULATION ARENA */}
        <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden min-h-[300px]">
          
          {/* NFC Electromagnetic Wave Pulse Rings during read */}
          {isTapping && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-24 h-24 rounded-full border-2 border-indigo-400/80 animate-ping opacity-80" />
              <div className="w-48 h-48 rounded-full border border-indigo-500/50 animate-ping opacity-60" style={{ animationDelay: '180ms' }} />
              <div className="w-72 h-72 rounded-full border border-cyan-400/30 animate-pulse" />
            </div>
          )}

          {/* Successful Read Shockwave Ripple (Subtle Haptic Radial Burst) */}
          {shockwaveActive && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-64 rounded-full bg-emerald-500/10 blur-xl animate-pulse" />
              <div className="absolute w-36 h-36 rounded-full border-2 border-emerald-400/90 animate-ping opacity-90 duration-500" />
              <div className="absolute w-60 h-60 rounded-full border border-teal-400/50 animate-ping opacity-60 duration-700" style={{ animationDelay: '100ms' }} />
            </div>
          )}

          {!notificationTriggered ? (
            <div className="flex flex-col items-center text-center w-full relative">
              
              {/* Virtual Smartphone Hovering Animation when Tapping */}
              {isTapping && (
                <div className="absolute -top-6 z-20 transition-all duration-700 transform translate-y-10 scale-95 pointer-events-none animate-bounce">
                  <div className="w-36 h-20 bg-slate-900/95 border-2 border-indigo-400 rounded-2xl p-2.5 shadow-2xl backdrop-blur-md flex flex-col items-center justify-center text-white">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-300">
                      <Wifi className="w-3.5 h-3.5 rotate-90 animate-pulse text-indigo-400" />
                      <span>Lecture du Tag NFC...</span>
                    </div>
                    <span className="text-[9px] text-slate-400 mt-1 font-mono">Distance : ~1.5 cm</span>
                  </div>
                </div>
              )}

              {/* Virtual Physical Card Mockup */}
              <div className={`w-72 h-40 rounded-2xl p-5 flex flex-col justify-between shadow-2xl relative transition-all duration-500 ${
                isTapping 
                  ? 'scale-105 -translate-y-2 ring-4 ring-indigo-400/80 shadow-indigo-500/20' 
                  : 'hover:scale-102 hover:shadow-indigo-950/40'
              } ${
                selectedCard?.material === 'wood_bamboo'
                  ? 'bg-amber-950/90 border border-amber-800 text-amber-100'
                  : selectedCard?.material === 'metal_black'
                  ? 'bg-gradient-to-tr from-zinc-900 via-neutral-900 to-black border border-neutral-700 text-white'
                  : 'bg-slate-900 border border-slate-700 text-white'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold tracking-widest uppercase">KARDX METAL</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                    <Wifi className="w-4 h-4 rotate-90 text-indigo-400" />
                  </div>
                </div>

                <div className="flex flex-col text-left">
                  <p className="text-sm font-bold text-white tracking-tight">{activeProfile.firstName} {activeProfile.lastName}</p>
                  <p className="text-[11px] text-slate-400 font-medium">{activeProfile.headline || activeProfile.company}</p>
                </div>

                <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono pt-2 border-t border-white/10">
                  <span className="flex items-center gap-1">
                    <Radio className="w-3 h-3 text-indigo-400" />
                    <span>NFC ISO 14443-A</span>
                  </span>
                  <span>{selectedCard?.uid || '04:A2:38:1F:90'}</span>
                </div>
              </div>

              {/* Tap action button */}
              <button
                onClick={handleTap}
                disabled={isTapping}
                className="mt-6 py-3.5 px-7 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2.5 transition active:scale-95 cursor-pointer disabled:opacity-75"
              >
                {isTapping ? (
                  <>
                    <Radio className="w-4 h-4 animate-spin text-white" />
                    <span>Communication radiofréquence en cours...</span>
                  </>
                ) : (
                  <>
                    <Smartphone className="w-4 h-4" />
                    <span>Approcher le smartphone (Tap NFC)</span>
                  </>
                )}
              </button>
              
              <div className="flex items-center gap-2 mt-3 text-[11px] text-slate-400">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Simule le déclenchement haptique & audio à moins de 3 cm du capteur</span>
              </div>
            </div>
          ) : (
            /* PHONE NOTIFICATION & SUCCESS FEEDBACK BANNER */
            <div className="flex flex-col items-center w-full max-w-md animate-in slide-in-from-bottom duration-300">
              
              {/* Telemetry Success Pill */}
              <div className="mb-3 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold flex items-center gap-1.5 animate-in fade-in duration-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Puce NTAG lue en 28ms • Fréquence 13.56 MHz OK • UID validé</span>
              </div>

              {/* Push notification mockup with haptic micro-bounce */}
              <div className="w-full p-4 rounded-2xl bg-slate-900/95 border-2 border-emerald-500/50 shadow-2xl shadow-emerald-500/10 backdrop-blur-md flex items-start gap-3.5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-400/40">
                  <Wifi className="w-5 h-5 rotate-90" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">KardX NFC Tag</span>
                      <span className="w-1 h-1 rounded-full bg-slate-500" />
                      <span className="text-[9px] text-slate-400">À l'instant</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                      {selectedCard?.uid}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-white mt-1 flex items-center gap-1.5">
                    <span>{activeProfile.firstName} {activeProfile.lastName}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-normal">
                      {activeProfile.company}
                    </span>
                  </h4>
                  
                  <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                    {activeProfile.headline ? `${activeProfile.headline} — ` : ''}Touchez pour ouvrir la carte de visite et échanger vos coordonnées.
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2.5 w-full mt-4">
                <button
                  onClick={handleOpenFromNotification}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition active:scale-98 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Ouvrir la carte de visite instantanément</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    setNotificationTriggered(false);
                    setShockwaveActive(false);
                  }}
                  className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition cursor-pointer border border-slate-700"
                >
                  Refaire un Tap
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

