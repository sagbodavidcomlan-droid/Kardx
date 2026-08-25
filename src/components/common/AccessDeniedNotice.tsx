import React from 'react';
import { ShieldAlert, ArrowLeft, Lock, KeyRound } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getRoleBadge } from '../../utils/permissions';

interface AccessDeniedNoticeProps {
  requiredRole?: string;
  tabName?: string;
}

export const AccessDeniedNotice: React.FC<AccessDeniedNoticeProps> = ({ 
  requiredRole = "Administrateur", 
  tabName = "ce module" 
}) => {
  const { currentUser, setActiveTab, setIsAuthModalOpen } = useApp();
  const badge = getRoleBadge(currentUser.role);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-slate-900/90 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden backdrop-blur-md">
        {/* Subtle accent backdrop */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-rose-950/40">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-black text-white tracking-tight mb-2">
          Accès restreint & Permissions insuffisantes
        </h2>

        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          Votre compte est actuellement connecté en tant que <strong className="text-slate-200">{currentUser.name}</strong> avec le rôle <span className={`inline-block text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${badge.color}`}>{badge.label}</span>.
          <br />
          L'accès à <span className="text-slate-200 font-semibold">{tabName}</span> requiert des privilèges de niveau <strong className="text-indigo-400">{requiredRole}</strong>.
        </p>

        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-left text-xs text-slate-400 mb-6 space-y-2">
          <div className="flex items-center gap-2 text-slate-300 font-bold">
            <Lock className="w-3.5 h-3.5 text-indigo-400" />
            <span>Politique de sécurité & isolation SAAS :</span>
          </div>
          <p>
            Chaque collaborateur ne peut consulter et modifier que ses propres profils digitaux, ses cartes NFC assignées et ses prospects CRM exclusifs.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour à mon tableau de bord</span>
          </button>

          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-900/30 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <KeyRound className="w-4 h-4" />
            <span>Changer de compte / Se connecter en Admin</span>
          </button>
        </div>
      </div>
    </div>
  );
};
