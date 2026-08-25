import React, { useState, useEffect, useRef } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const NetworkStatusIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [justReconnected, setJustReconnected] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [popoverOpen, setPopoverOpen] = useState<boolean>(false);
  const [networkSpeed, setNetworkSpeed] = useState<string | null>(null);
  const [offlineSince, setOfflineSince] = useState<Date | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const { showToast } = useApp();

  // Read network connection details if available
  const updateConnectionInfo = () => {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const conn = (navigator as any).connection;
      if (conn && conn.effectiveType) {
        setNetworkSpeed(conn.effectiveType.toUpperCase());
      }
    }
  };

  useEffect(() => {
    updateConnectionInfo();

    const handleOnline = () => {
      setIsOnline(true);
      setJustReconnected(true);
      setOfflineSince(null);
      showToast('Connexion rétablie ! Vos scans NFC/QR et données sont synchronisés.');
      const timer = setTimeout(() => setJustReconnected(false), 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setJustReconnected(false);
      setOfflineSince(new Date());
      showToast('Connexion internet perdue. Mode hors ligne activé.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // If connection info changes
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const conn = (navigator as any).connection;
      conn?.addEventListener('change', updateConnectionInfo);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (typeof navigator !== 'undefined' && 'connection' in navigator) {
        const conn = (navigator as any).connection;
        conn?.removeEventListener('change', updateConnectionInfo);
      }
    };
  }, [showToast]);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverOpen(false);
      }
    };
    if (popoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [popoverOpen]);

  // Manual connection verification ping
  const handleCheckConnection = async () => {
    setIsChecking(true);
    try {
      // Fast probe to origin
      const response = await fetch('/api/gemini/scan-card', {
        method: 'OPTIONS',
        cache: 'no-store',
      }).catch(() => null);

      if (response && response.ok) {
        setIsOnline(true);
        if (!isOnline) {
          setJustReconnected(true);
          setOfflineSince(null);
          setTimeout(() => setJustReconnected(false), 3000);
        }
        showToast('Connexion au serveur vérifiée avec succès (En ligne).');
      } else {
        if (!navigator.onLine) {
          setIsOnline(false);
          showToast('Toujours hors ligne. Vérifiez votre réseau.');
        } else {
          setIsOnline(true);
          showToast('Connexion réseau active.');
        }
      }
    } catch {
      setIsOnline(navigator.onLine);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="relative inline-flex items-center" ref={popoverRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setPopoverOpen((prev) => !prev)}
        aria-label="État de la connexion réseau"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer active:scale-95 ${
          !isOnline
            ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 hover:bg-rose-500/25 shadow-xs shadow-rose-950/40 animate-pulse'
            : justReconnected
            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
            : 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-800'
        }`}
        title={!isOnline ? 'Connexion perdue - Cliquez pour détails' : 'Réseau connecté'}
      >
        {/* Status Dot / Icon */}
        {!isOnline ? (
          <>
            <WifiOff className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline font-bold text-rose-300">Hors ligne</span>
            <span className="w-2 h-2 rounded-full bg-rose-400" />
          </>
        ) : justReconnected ? (
          <>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline font-bold text-emerald-300">Rétabli</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </>
        ) : (
          <>
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
          </>
        )}
      </button>

      {/* Detail Popover */}
      {popoverOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-[#0F172A] border border-slate-800 shadow-2xl p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              {!isOnline ? (
                <div className="w-7 h-7 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <WifiOff className="w-4 h-4" />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Wifi className="w-4 h-4" />
                </div>
              )}
              <div>
                <p className="text-xs font-bold text-white leading-tight">
                  {!isOnline ? 'Mode Hors Ligne' : 'Connecté au Cloud'}
                </p>
                <p className="text-[10px] text-slate-400">
                  {!isOnline
                    ? offlineSince
                      ? `Interrompu à ${offlineSince.toLocaleTimeString()}`
                      : 'Aucun accès internet'
                    : networkSpeed
                    ? `Qualité réseau : ${networkSpeed}`
                    : 'Synchronisation active'}
                </p>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                !isOnline
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              {!isOnline ? 'Hors ligne' : 'En ligne'}
            </span>
          </div>

          {/* NFC & Scanner guidance */}
          <div className="my-2.5 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-[11px] text-slate-300 space-y-1.5">
            {!isOnline ? (
              <>
                <div className="flex items-center gap-1.5 font-bold text-amber-300 text-xs">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Impact sur les fonctionnalités :</span>
                </div>
                <ul className="text-[10px] space-y-1 text-slate-300 list-disc list-inside">
                  <li><strong className="text-white">Scan NFC & QR :</strong> Fonctionnent en mode local avec mise en cache.</li>
                  <li><strong className="text-white">OCR Vision IA :</strong> Mise en file d'attente automatique jusqu'au retour du réseau.</li>
                </ul>
              </>
            ) : (
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-300 leading-snug">
                  Toutes les fonctionnalités (scan NFC/QR, extraction IA, CRM et analytics) sont synchronisées en temps réel.
                </p>
              </div>
            )}
          </div>

          {/* Action button */}
          <button
            onClick={handleCheckConnection}
            disabled={isChecking}
            className="w-full py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'Test en cours...' : 'Vérifier la connexion'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
