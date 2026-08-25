import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Lock, 
  ShieldCheck, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Building2, 
  ArrowRight, 
  LogOut, 
  Sparkles, 
  ShieldAlert, 
  Copy, 
  Check,
  Zap
} from 'lucide-react';
import { getRoleBadge } from '../../utils/permissions';

export const ForcePasswordChangeScreen: React.FC = () => {
  const { 
    currentUser, 
    currentOrg, 
    organizations, 
    completePasswordChange, 
    passwordChangeChallenge, 
    logout, 
    switchUser,
    users,
    showToast 
  } = useApp();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedGenerated, setCopiedGenerated] = useState(false);

  // Identify user's organization
  const userOrg = organizations.find((o) => o.id === currentUser.organizationId) || currentOrg;
  const roleBadge = getRoleBadge(currentUser.role);

  // Security Validation Criteria
  const hasMinLength = newPassword.length >= 8;
  const hasUpperCase = /[A-Z]/.test(newPassword);
  const hasLowerCase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const validCriteriaCount = [
    hasMinLength,
    hasUpperCase,
    hasLowerCase,
    hasNumber,
    hasSpecialChar
  ].filter(Boolean).length;

  const getStrengthLabel = () => {
    if (newPassword.length === 0) return { label: 'Requis', color: 'bg-slate-700 text-slate-400', width: '0%' };
    if (validCriteriaCount <= 2) return { label: 'Trop faible', color: 'bg-rose-500 text-rose-300', width: '25%' };
    if (validCriteriaCount === 3) return { label: 'Moyen', color: 'bg-amber-500 text-amber-300', width: '50%' };
    if (validCriteriaCount === 4) return { label: 'Fort', color: 'bg-blue-500 text-blue-300', width: '75%' };
    return { label: 'Excellent & Sécurisé', color: 'bg-emerald-500 text-emerald-300', width: '100%' };
  };

  const strength = getStrengthLabel();
  const isFormValid = hasMinLength && hasUpperCase && hasNumber && passwordsMatch;

  const handleGenerateStrongPassword = () => {
    const charsUpper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const charsLower = 'abcdefghjkmnpqrstuvwxyz';
    const charsNum = '23456789';
    const charsSym = '!@#$%^&*';
    
    let generated = '';
    generated += charsUpper[Math.floor(Math.random() * charsUpper.length)];
    generated += charsUpper[Math.floor(Math.random() * charsUpper.length)];
    generated += charsLower[Math.floor(Math.random() * charsLower.length)];
    generated += charsLower[Math.floor(Math.random() * charsLower.length)];
    generated += charsNum[Math.floor(Math.random() * charsNum.length)];
    generated += charsNum[Math.floor(Math.random() * charsNum.length)];
    generated += charsSym[Math.floor(Math.random() * charsSym.length)];
    generated += charsSym[Math.floor(Math.random() * charsSym.length)];

    // Shuffle
    const shuffled = generated.split('').sort(() => 0.5 - Math.random()).join('');
    const fullPassword = `KardX-${shuffled}#${Math.floor(100 + Math.random() * 900)}`;
    
    setNewPassword(fullPassword);
    setConfirmPassword(fullPassword);
    setShowNewPassword(true);
    setShowConfirmPassword(true);
    setErrorMsg(null);

    // Copy to clipboard
    navigator.clipboard.writeText(fullPassword);
    setCopiedGenerated(true);
    setTimeout(() => setCopiedGenerated(false), 3000);
    showToast('Mot de passe robuste généré et copié dans le presse-papier !');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!hasMinLength) {
      setErrorMsg('Le mot de passe doit comporter au moins 8 caractères.');
      return;
    }
    if (!hasUpperCase) {
      setErrorMsg('Le mot de passe doit comporter au moins une lettre majuscule (A-Z).');
      return;
    }
    if (!hasNumber) {
      setErrorMsg('Le mot de passe doit comporter au moins un chiffre (0-9).');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('La confirmation du mot de passe ne correspond pas.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      // Use challenge token if present, or fallback token
      const token = passwordChangeChallenge?.token || 'direct_session_token';
      const result = completePasswordChange(token, newPassword, confirmPassword);
      setLoading(false);

      if (result.success) {
        showToast(`Mot de passe mis à jour ! Bienvenue dans l'espace de ${userOrg.name}.`);
      } else {
        setErrorMsg(result.error || 'Une erreur est survenue lors de la mise à jour du mot de passe.');
      }
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 font-sans relative overflow-hidden">
      
      {/* Background Decorative Rings */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto relative z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Security Banner */}
        <div className="p-6 sm:p-8 border-b border-slate-800 bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 relative">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-950/40 shrink-0">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Sécurité Renforcée • 1ère Connexion
                  </span>
                </div>
                <h1 className="text-xl font-black text-white mt-1">
                  Changement Obligatoire de Mot de Passe
                </h1>
              </div>
            </div>

            <button
              onClick={() => logout()}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition cursor-pointer flex items-center gap-1.5 text-xs font-medium"
              title="Se déconnecter"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Quitter</span>
            </button>
          </div>

          <p className="text-xs text-slate-300 mt-3 leading-relaxed">
            Votre compte a été initialisé avec un <strong>mot de passe temporaire à usage unique</strong>. 
            Conformément à la politique de sécurité et d'isolation de votre organisation, vous devez obligatoirement 
            définir votre mot de passe secret avant d'accéder au tableau de bord.
          </p>
        </div>

        {/* User & Organization Context Card */}
        <div className="px-6 sm:px-8 py-4 bg-slate-950/50 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-xs shrink-0"
              style={{ backgroundColor: userOrg.primaryColor || '#6366f1' }}
            >
              {userOrg.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">{currentUser.name}</span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${roleBadge.color}`}>
                  {currentUser.role === 'admin' ? "Responsable d'Organisation" : roleBadge.label}
                </span>
              </div>
              <p className="text-slate-400 text-[11px] mt-0.5">
                {currentUser.email} • {userOrg.name} ({currentUser.position || currentUser.jobTitle || 'Collaborateur'})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
            <Building2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>{userOrg.plan.toUpperCase()} Plan</span>
          </div>
        </div>

        {/* Main Password Change Form */}
        <div className="p-6 sm:p-8 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-xs text-rose-300 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* New Password Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Nouveau mot de passe personnel</span>
                </label>

                <button
                  type="button"
                  onClick={handleGenerateStrongPassword}
                  className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{copiedGenerated ? 'Copié !' : 'Générer mot de passe fort'}</span>
                </button>
              </div>

              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Ex: KardX#2026!Securite"
                  className="w-full pl-3.5 pr-10 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none font-mono"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer p-1"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Password Strength Meter */}
            {newPassword.length > 0 && (
              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Robustesse :</span>
                  <span className="font-bold text-slate-200">{strength.label}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${strength.color}`} 
                    style={{ width: strength.width }} 
                  />
                </div>
              </div>
            )}

            {/* Confirm Password Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Confirmation du nouveau mot de passe</span>
              </label>

              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Répétez votre mot de passe"
                  className={`w-full pl-3.5 pr-10 py-3 rounded-2xl bg-slate-950 border text-xs text-white placeholder-slate-500 focus:outline-none font-mono ${
                    confirmPassword && !passwordsMatch 
                      ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/30' 
                      : confirmPassword && passwordsMatch
                        ? 'border-emerald-500 focus:ring-2 focus:ring-emerald-500/30'
                        : 'border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer p-1"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Real-Time Security Checklist */}
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs space-y-2">
              <span className="font-bold text-slate-300 block text-[11px] uppercase tracking-wider">
                Exigences de sécurité obligatoire :
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {hasMinLength ? <Check className="w-3.5 h-3.5" /> : <span className="w-3.5 h-3.5 rounded-full border border-slate-600 inline-block" />}
                  <span>Au moins 8 caractères</span>
                </div>

                <div className={`flex items-center gap-1.5 ${hasUpperCase ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {hasUpperCase ? <Check className="w-3.5 h-3.5" /> : <span className="w-3.5 h-3.5 rounded-full border border-slate-600 inline-block" />}
                  <span>Au moins 1 majuscule (A-Z)</span>
                </div>

                <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {hasNumber ? <Check className="w-3.5 h-3.5" /> : <span className="w-3.5 h-3.5 rounded-full border border-slate-600 inline-block" />}
                  <span>Au moins 1 chiffre (0-9)</span>
                </div>

                <div className={`flex items-center gap-1.5 ${passwordsMatch ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {passwordsMatch ? <Check className="w-3.5 h-3.5" /> : <span className="w-3.5 h-3.5 rounded-full border border-slate-600 inline-block" />}
                  <span>Mots de passe identiques</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => logout()}
                className="w-full sm:w-auto py-3 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Se déconnecter</span>
              </button>

              <button
                type="submit"
                disabled={loading || !isFormValid}
                className={`flex-1 py-3 px-6 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer ${
                  isFormValid && !loading
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-950/50'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                }`}
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Sécurisation du compte en cours...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Définir mon mot de passe & Déverrouiller mon espace</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

        {/* Footer Security Notice */}
        <div className="px-6 sm:px-8 py-3 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
            <span>Accès sécurisé par chiffrement TLS 1.3 & Hachage Argon2</span>
          </div>
          <span>KardX ID: <code className="text-slate-400 font-mono">{currentUser.id}</code></span>
        </div>

      </div>
    </div>
  );
};
