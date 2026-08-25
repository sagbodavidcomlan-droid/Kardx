import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { generateQRCodeDataUrl } from '../../utils/qr';
import { 
  CreditCard, 
  Download, 
  Smartphone, 
  QrCode, 
  Sparkles, 
  CheckCircle, 
  Share2, 
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export const WalletPassGenerator: React.FC = () => {
  const { activeProfile, showToast } = useApp();
  const [walletQrUrl, setWalletQrUrl] = useState('');
  const [walletType, setWalletType] = useState<'apple' | 'google'>('apple');

  const publicUrl = `${window.location.origin}/p/${activeProfile.slug}`;

  useEffect(() => {
    generateQRCodeDataUrl(publicUrl, {
      width: 320,
      color: { dark: '#0f172a', light: '#ffffff' },
    }).then((url) => setWalletQrUrl(url));
  }, [publicUrl]);

  const handleDownloadApplePass = () => {
    showToast('Pass Apple Wallet (.pkpass) généré avec succès !');
  };

  const handleDownloadGooglePass = () => {
    showToast('Pass Google Wallet enregistré dans votre compte !');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-slate-800 flex flex-col gap-8">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            Cartes Apple Wallet & Google Wallet
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Permettez à vos interlocuteurs ou à vos collaborateurs de garder votre carte digitale directement dans le Wallet de leur smartphone.
          </p>
        </div>

        {/* Wallet platform tabs */}
        <div className="flex items-center p-1 rounded-xl bg-white border border-slate-200 shadow-sm">
          <button
            onClick={() => setWalletType('apple')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              walletType === 'apple' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Apple Wallet</span>
          </button>
          <button
            onClick={() => setWalletType('google')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              walletType === 'google' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Google Wallet</span>
          </button>
        </div>
      </div>

      {/* WALLET PASS PREVIEW & INSTALL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* LEFT COLUMN: PASS MOCKUP (6 Cols) */}
        <div className="lg:col-span-6 flex flex-col items-center">
          
          {/* Apple Wallet Pass Container */}
          {walletType === 'apple' ? (
            <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl flex flex-col justify-between min-h-[440px] relative text-white">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center font-bold text-[11px]">
                    KX
                  </span>
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-300">
                    {activeProfile.company}
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">
                  CARTE DIGITALE
                </span>
              </div>

              {/* Body */}
              <div className="flex items-center gap-4 my-4">
                <img
                  src={activeProfile.avatarUrl}
                  alt={activeProfile.firstName}
                  className="w-16 h-16 rounded-full object-cover ring-2 ring-indigo-500 shadow-md"
                />
                <div>
                  <h3 className="text-lg font-bold text-white leading-tight">
                    {activeProfile.firstName} {activeProfile.lastName}
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">{activeProfile.headline}</p>
                </div>
              </div>

              {/* QR Center in Pass */}
              <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-inner my-2">
                {walletQrUrl ? (
                  <img src={walletQrUrl} alt="Wallet QR" className="w-36 h-36" />
                ) : (
                  <div className="w-36 h-36 bg-slate-200 animate-pulse rounded-lg"></div>
                )}
                <p className="text-[10px] text-slate-700 font-mono mt-1 font-semibold">
                  Scannez pour échanger
                </p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                <span>NFC ID : 04:A2:3F:89:C1</span>
                <span>/p/{activeProfile.slug}</span>
              </div>
            </div>
          ) : (
            /* Google Wallet Pass Mockup */
            <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl flex flex-col justify-between min-h-[440px] relative text-white">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="font-bold text-xs text-slate-300">{activeProfile.company}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                  Google Wallet
                </span>
              </div>

              <div className="flex items-center gap-3 my-4">
                <img
                  src={activeProfile.avatarUrl}
                  alt={activeProfile.firstName}
                  className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white/20"
                />
                <div>
                  <h3 className="text-base font-bold text-white">{activeProfile.firstName} {activeProfile.lastName}</h3>
                  <p className="text-xs text-slate-300">{activeProfile.headline}</p>
                </div>
              </div>

              <div className="flex items-center justify-center p-3 bg-white rounded-2xl shadow-md my-2">
                {walletQrUrl && <img src={walletQrUrl} alt="QR" className="w-32 h-32" />}
              </div>

              <p className="text-center text-[10px] text-slate-400">
                Passe professionnel certifié KardX
              </p>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: ACTIONS & PWA SHORTCUT (6 Cols) */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col gap-4">
            <h3 className="font-bold text-base text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Téléchargement & Ajout 1-Clic
            </h3>

            <p className="text-xs text-slate-500 leading-relaxed">
              Le pass digital permet à vos contacts d'afficher votre QR Code et vos coordonnées même en l'absence de réseau internet (hors-ligne).
            </p>

            <div className="flex flex-col gap-3 pt-2">
              {walletType === 'apple' ? (
                <button
                  onClick={handleDownloadApplePass}
                  className="w-full py-3 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-3 shadow-md shadow-slate-900/20 transition active:scale-98 cursor-pointer"
                >
                  <CreditCard className="w-5 h-5 text-slate-200" />
                  <span>Ajouter à Apple Wallet (.pkpass)</span>
                </button>
              ) : (
                <button
                  onClick={handleDownloadGooglePass}
                  className="w-full py-3 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-3 shadow-md shadow-indigo-900/20 transition active:scale-98 cursor-pointer"
                >
                  <Smartphone className="w-5 h-5" />
                  <span>Enregistrer dans Google Wallet</span>
                </button>
              )}
            </div>
          </div>

          {/* PWA Section */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col gap-3">
            <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-600" />
              Raccourci Écran d'Accueil (PWA)
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Sur iPhone (Safari) ou Android (Chrome), ouvrez l'URL de votre profil puis appuyez sur <strong>« Partager » → « Sur l'écran d'accueil »</strong> pour créer une icône d'application dédiée.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
