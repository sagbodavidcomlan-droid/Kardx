import React, { useRef } from 'react';
import { Profile } from '../../types';
import { Printer, X, Download, Sparkles, Check, QrCode } from 'lucide-react';

interface QrPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
  qrDataUrl: string;
  customCtaText: string;
}

export const QrPrintModal: React.FC<QrPrintModalProps> = ({
  isOpen,
  onClose,
  profile,
  qrDataUrl,
  customCtaText,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-800 flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
              <Printer className="w-5 h-5 text-indigo-600" />
              Gabarit d'Impression Physique (Chevalet / Affiche)
            </h3>
            <p className="text-xs text-slate-500">
              Format standard prêt pour impression sur papier A4 ou support cartonné de stand.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Paper Preview (with print styling) */}
        <div className="p-4 bg-slate-100 rounded-2xl flex items-center justify-center overflow-hidden">
          <div 
            id="printable-qr-stand"
            className="w-full max-w-sm bg-white border-2 border-slate-200 rounded-3xl p-8 shadow-md flex flex-col items-center text-center gap-5 my-2"
          >
            {/* Header info */}
            <div>
              <span className="text-[10px] font-bold tracking-widest text-indigo-600 uppercase">
                {profile.company || 'KardX Connect'}
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-1">
                {profile.firstName} {profile.lastName}
              </h2>
              <p className="text-xs font-semibold text-slate-500">{profile.headline}</p>
            </div>

            {/* QR Box with decorative frame */}
            <div className="p-5 rounded-2xl bg-slate-50 border-2 border-slate-900 shadow-sm flex flex-col items-center">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR Code" className="w-48 h-48 object-contain" />
              ) : (
                <div className="w-48 h-48 bg-slate-200 animate-pulse flex items-center justify-center text-xs text-slate-500">
                  Génération...
                </div>
              )}
              <div className="mt-3 px-3 py-1 rounded-full bg-slate-900 text-white text-[11px] font-extrabold uppercase tracking-wide">
                {customCtaText || 'Scannez avec votre smartphone'}
              </div>
            </div>

            {/* Subtext info */}
            <div className="flex flex-col gap-1 text-slate-600">
              <p className="text-xs font-bold text-slate-800">
                1. Ouvrez l'appareil photo de votre téléphone
              </p>
              <p className="text-[11px] text-slate-500">
                2. Pointez vers le QR Code pour enregistrer instantanément les coordonnées
              </p>
            </div>

            {/* Footer mark */}
            <div className="pt-2 border-t border-slate-100 w-full flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>kardx.app/p/{profile.slug}</span>
              <span>Sans contact NFC / QR</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <p className="text-xs text-slate-500">
            Astuce : Utilisez du papier 250g/m² ou un présentoir transparent en plexiglas.
          </p>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
            >
              Fermer
            </button>
            <button
              onClick={handlePrint}
              className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-indigo-900/20 transition cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer le document</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
