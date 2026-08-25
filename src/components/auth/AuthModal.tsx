import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  Lock, 
  Mail, 
  ShieldCheck, 
  UserCheck, 
  User, 
  Building2, 
  ArrowRight, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Users,
  Smartphone,
  Key,
  RefreshCw,
  Clock,
  Shield,
  ArrowLeft,
  Laptop,
  Check,
  Building,
  Briefcase
} from 'lucide-react';
import { getRoleBadge } from '../../utils/permissions';
import { maskEmail } from '../../utils/twoFactor';

export const AuthModal: React.FC = () => {
  const { 
    isAuthModalOpen, 
    setIsAuthModalOpen, 
    users, 
    currentUser, 
    departments,
    teams,
    switchUser, 
    addUser,
    showToast,
    current2FaChallenge,
    passwordChangeChallenge,
    initiateLogin,
    complete2FaVerification,
    resend2FaEmailCode,
    cancel2FaChallenge,
    completePasswordChange,
    cancelPasswordChange,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'login' | 'quick_switch' | 'register'>('quick_switch');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Mandatory First-Login Password Change State
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 2FA Pin state (6 individual digits)
  const [pinDigits, setPinDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [active2FaMethod, setActive2FaMethod] = useState<'totp' | 'email' | 'backup'>('totp');
  const [backupCodeInput, setBackupCodeInput] = useState('');
  const [trustDevice, setTrustDevice] = useState(true);
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Registration state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regJobTitle, setRegJobTitle] = useState('');
  const [regPosition, setRegPosition] = useState('');
  const [regDepartmentId, setRegDepartmentId] = useState('');
  const [regTeamId, setRegTeamId] = useState('');
  const [regRole, setRegRole] = useState<'admin' | 'manager' | 'collaborateur'>('collaborateur');
  const [regPassword, setRegPassword] = useState('');
  const [regMustChangePassword, setRegMustChangePassword] = useState(true);

  // Sync active 2FA method when challenge starts
  useEffect(() => {
    if (current2FaChallenge) {
      if (current2FaChallenge.method === 'email') {
        setActive2FaMethod('email');
      } else {
        setActive2FaMethod('totp');
      }
      setPinDigits(['', '', '', '', '', '']);
      setBackupCodeInput('');
      setErrorMsg(null);
      // Auto-focus first input box
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [current2FaChallenge]);

  // Reset password change inputs when challenge opens
  useEffect(() => {
    if (passwordChangeChallenge) {
      setNewPasswordInput('');
      setConfirmPasswordInput('');
      setErrorMsg(null);
    }
  }, [passwordChangeChallenge]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  if (!isAuthModalOpen) return null;

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim()) {
      setErrorMsg('Veuillez renseigner votre adresse email.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const result = initiateLogin(email, password);
      setLoading(false);

      if (result.success) {
        setIsAuthModalOpen(false);
        setEmail('');
        setPassword('');
      } else if (result.requiresPasswordChange) {
        // Handled directly via ForcePasswordChangeScreen full-page gate
        setIsAuthModalOpen(false);
        setEmail('');
        setPassword('');
        setErrorMsg(null);
      } else if (result.requires2Fa) {
        // 2FA Challenge triggered in AppContext
        setErrorMsg(null);
      } else {
        setErrorMsg(result.error || 'Identifiants incorrects.');
      }
    }, 250);
  };

  const handleQuickLogin = (userId: string, enforce2FaCheck: boolean = false) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;

    if (targetUser.mustChangePassword) {
      initiateLogin(targetUser.email, targetUser.password);
      setIsAuthModalOpen(false);
      return;
    }

    if (enforce2FaCheck && targetUser.twoFactorEnabled) {
      initiateLogin(targetUser.email, targetUser.password);
      return;
    }

    switchUser(userId);
    setIsAuthModalOpen(false);
  };

  const handlePasswordChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!passwordChangeChallenge) return;

    if (newPasswordInput.length < 8) {
      setErrorMsg('Le nouveau mot de passe doit comporter au moins 8 caractères.');
      return;
    }

    if (newPasswordInput !== confirmPasswordInput) {
      setErrorMsg('La confirmation ne correspond pas au mot de passe saisi.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const res = completePasswordChange(
        passwordChangeChallenge.token,
        newPasswordInput,
        confirmPasswordInput
      );
      setLoading(false);
      if (res.success) {
        setIsAuthModalOpen(false);
        setNewPasswordInput('');
        setConfirmPasswordInput('');
      } else {
        setErrorMsg(res.error || 'Erreur lors de la mise à jour du mot de passe.');
      }
    }, 250);
  };

  const handlePinChange = (index: number, value: string) => {
    const cleanVal = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...pinDigits];
    newDigits[index] = cleanVal;
    setPinDigits(newDigits);

    // Auto-advance to next input
    if (cleanVal && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit if all 6 digits entered
    if (cleanVal && index === 5 && newDigits.every((d) => d !== '')) {
      submit2FaCode(newDigits.join(''), active2FaMethod);
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePinPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = [...pinDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || '';
    }
    setPinDigits(newDigits);

    if (pasted.length === 6) {
      submit2FaCode(pasted, active2FaMethod);
    } else {
      inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  const submit2FaCode = (code: string, method: 'totp' | 'email' | 'backup') => {
    setErrorMsg(null);
    setLoading(true);

    setTimeout(() => {
      const res = complete2FaVerification(code, method, trustDevice);
      setLoading(false);
      if (res.success) {
        setIsAuthModalOpen(false);
        setEmail('');
        setPassword('');
      } else {
        setErrorMsg(res.error || 'Code de sécurité invalide.');
      }
    }, 250);
  };

  const handle2FaFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (active2FaMethod === 'backup') {
      if (!backupCodeInput.trim()) {
        setErrorMsg('Veuillez saisir un code de secours valide (ex: 8821-1029).');
        return;
      }
      submit2FaCode(backupCodeInput, 'backup');
    } else {
      const fullCode = pinDigits.join('');
      if (fullCode.length < 6) {
        setErrorMsg('Veuillez saisir les 6 chiffres du code de sécurité.');
        return;
      }
      submit2FaCode(fullCode, active2FaMethod);
    }
  };

  const handleResendEmail = () => {
    if (resendCooldown > 0) return;
    const newOtp = resend2FaEmailCode();
    setResendCooldown(30);
    setPinDigits(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim()) {
      setErrorMsg('Veuillez remplir le nom et l\'email.');
      return;
    }

    addUser({
      name: regName,
      email: regEmail,
      jobTitle: regJobTitle || 'Collaborateur',
      position: regPosition || regJobTitle || 'Poste opérationnel',
      departmentId: regDepartmentId || undefined,
      teamId: regTeamId || undefined,
      role: regRole,
      password: regPassword || 'Kardx2026!',
      mustChangePassword: regMustChangePassword,
      status: 'active',
      avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&h=400&q=80`,
    });

    setIsAuthModalOpen(false);
    showToast(`Compte créé pour ${regName} (${regRole})${regMustChangePassword ? ' - Mot de passe temporaire requis à la 1ère connexion' : ''}`);
  };

  // Password strength helper
  const getPasswordStrength = (pass: string) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (pass.length >= 12) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };

  const passwordStrength = getPasswordStrength(newPasswordInput);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={() => {
        if (current2FaChallenge) cancel2FaChallenge();
        if (passwordChangeChallenge) cancelPasswordChange();
        setIsAuthModalOpen(false);
      }}
    >
      <div 
        className="relative w-full max-w-xl bg-[#0F172A] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-200 max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800/80 bg-slate-900/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-lg ${
              passwordChangeChallenge
                ? 'bg-amber-600 shadow-amber-900/40'
                : current2FaChallenge 
                  ? 'bg-emerald-600 shadow-emerald-900/40' 
                  : 'bg-indigo-600 shadow-indigo-900/40'
            }`}>
              {passwordChangeChallenge ? (
                <KeyRound className="w-5 h-5" />
              ) : current2FaChallenge ? (
                <ShieldCheck className="w-5 h-5" />
              ) : (
                'K'
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                {passwordChangeChallenge
                  ? 'Première Connexion — Changement Obligatoire du Mot de Passe'
                  : current2FaChallenge 
                    ? 'Double Facteur de Sécurité (2FA)' 
                    : 'Authentification & Espaces Collaborateurs'}
              </h2>
              <p className="text-xs text-slate-400">
                {passwordChangeChallenge
                  ? 'Pour des raisons de sécurité, vous devez définir votre mot de passe personnel.'
                  : current2FaChallenge
                    ? 'Validation de sécurité obligatoire pour cet accès'
                    : 'Chaque collaborateur dispose de son propre espace et permissions'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (current2FaChallenge) cancel2FaChallenge();
              if (passwordChangeChallenge) cancelPasswordChange();
              setIsAuthModalOpen(false);
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation (Hidden during active 2FA or Password Change challenges) */}
        {!current2FaChallenge && !passwordChangeChallenge && (
          <div className="px-6 pt-4 pb-2 border-b border-slate-800 flex gap-2 shrink-0 bg-slate-900/20">
            <button
              onClick={() => {
                setActiveTab('quick_switch');
                setErrorMsg(null);
              }}
              className={`py-2 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'quick_switch'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Sélection rapide de rôles</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('login');
                setErrorMsg(null);
              }}
              className={`py-2 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Connexion avec mot de passe</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('register');
                setErrorMsg(null);
              }}
              className={`py-2 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Inviter</span>
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-xs text-rose-300 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ========================================================= */}
          {/* MANDATORY PASSWORD CHANGE VIEW (FIRST LOGIN) */}
          {/* ========================================================= */}
          {passwordChangeChallenge ? (
            <div className="space-y-5 animate-in fade-in zoom-in-95 duration-150">
              {/* User Identity Card */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={passwordChangeChallenge.user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80'}
                    alt={passwordChangeChallenge.user.name}
                    className="w-11 h-11 rounded-xl object-cover ring-2 ring-amber-500/40"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{passwordChangeChallenge.user.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        1ère Connexion
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{passwordChangeChallenge.user.email}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={cancelPasswordChange}
                  className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Annuler</span>
                </button>
              </div>

              {/* Security Banner */}
              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-amber-300">
                  <Shield className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Protocole de sécurité KardX</span>
                </div>
                <p className="leading-relaxed">
                  Votre compte a été initialisé avec un <strong>mot de passe temporaire à usage unique</strong>. 
                  Conformément aux normes de sécurité et de confidentialité de votre organisation, vous devez définir votre 
                  propre mot de passe secret avant d'accéder à votre espace de travail.
                </p>
              </div>

              {/* Form to set new password */}
              <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    Nouveau mot de passe personnel
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      placeholder="Minimum 8 caractères, majuscule, chiffre et symbole"
                      className="w-full pl-4 pr-10 py-3 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Strength Meter */}
                  {newPasswordInput && (
                    <div className="space-y-1 pt-1">
                      <div className="flex gap-1 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-300 ${
                          passwordStrength <= 2 ? 'w-1/3 bg-rose-500' : passwordStrength <= 3 ? 'w-2/3 bg-amber-500' : 'w-full bg-emerald-500'
                        }`} />
                      </div>
                      <p className="text-[11px] text-slate-400 flex items-center justify-between">
                        <span>Solidité du mot de passe</span>
                        <span className={`font-bold ${
                          passwordStrength <= 2 ? 'text-rose-400' : passwordStrength <= 3 ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {passwordStrength <= 2 ? 'Faible' : passwordStrength <= 3 ? 'Moyen' : 'Excellent & Sécurisé'}
                        </span>
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                    Confirmez le nouveau mot de passe
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPasswordInput}
                      onChange={(e) => setConfirmPasswordInput(e.target.value)}
                      placeholder="Retapez exactement votre nouveau mot de passe"
                      className="w-full pl-4 pr-10 py-3 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-900/30 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{loading ? 'Validation en cours...' : 'Enregistrer mon mot de passe et entrer'}</span>
                </button>
              </form>
            </div>
          ) : current2FaChallenge ? (
            /* ========================================================= */
            /* 2FA VERIFICATION CHALLENGE VIEW */
            /* ========================================================= */
            <div className="space-y-5 animate-in fade-in zoom-in-95 duration-150">
              {/* User Identity Card */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={current2FaChallenge.user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80'}
                    alt={current2FaChallenge.user.name}
                    className="w-11 h-11 rounded-xl object-cover ring-2 ring-indigo-500/30"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{current2FaChallenge.user.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        2FA Activée
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{maskEmail(current2FaChallenge.user.email)}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={cancel2FaChallenge}
                  className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Changer</span>
                </button>
              </div>

              {/* Method Switcher Tabs */}
              <div className="flex gap-2 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setActive2FaMethod('totp');
                    setErrorMsg(null);
                  }}
                  className={`flex-1 py-2 px-2.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    active2FaMethod === 'totp'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Application 2FA</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActive2FaMethod('email');
                    setErrorMsg(null);
                  }}
                  className={`flex-1 py-2 px-2.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    active2FaMethod === 'email'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Code Email</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActive2FaMethod('backup');
                    setErrorMsg(null);
                  }}
                  className={`py-2 px-2.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    active2FaMethod === 'backup'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Secours</span>
                </button>
              </div>

              {/* SIMULATION TEST BANNER */}
              {active2FaMethod === 'email' && current2FaChallenge.tempEmailOtp && (
                <div className="p-3.5 rounded-2xl bg-indigo-950/50 border border-indigo-500/40 text-xs text-indigo-200 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Code de sécurité reçu par email : </span>
                    <span className="font-mono font-bold text-white bg-indigo-900/60 px-2 py-0.5 rounded border border-indigo-400/40 text-sm tracking-widest">
                      {current2FaChallenge.tempEmailOtp}
                    </span>
                    <p className="text-[11px] text-indigo-300 mt-1">
                      Envoyé à {current2FaChallenge.destinationMasked}. Saisissez ce code à 6 chiffres pour vous connecter.
                    </p>
                  </div>
                </div>
              )}

              {active2FaMethod === 'totp' && (
                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
                  <p className="leading-relaxed">
                    Ouvrez votre application d'authentification (<strong>Google Authenticator</strong>, <strong>Microsoft Authenticator</strong>, <strong>1Password</strong>) et entrez le code à 6 chiffres.
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    (En mode test de démonstration, vous pouvez également saisir <strong>123456</strong>)
                  </p>
                </div>
              )}

              {/* 2FA INPUT FORM */}
              <form onSubmit={handle2FaFormSubmit} className="space-y-4">
                {active2FaMethod === 'backup' ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-amber-400" />
                      Saisissez l'un de vos codes de secours (Format : 1234-5678)
                    </label>
                    <input
                      type="text"
                      placeholder="ex: 8821-1029"
                      value={backupCodeInput}
                      onChange={(e) => setBackupCodeInput(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-center font-mono text-base font-bold text-white tracking-widest placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 block text-center">
                      Code de vérification à 6 chiffres
                    </label>

                    {/* 6-PIN DIGIT BOXES */}
                    <div className="flex items-center justify-center gap-2 sm:gap-3" onPaste={handlePinPaste}>
                      {pinDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => (inputRefs.current[idx] = el)}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handlePinChange(idx, e.target.value)}
                          onKeyDown={(e) => handlePinKeyDown(idx, e)}
                          className="w-11 h-14 sm:w-12 sm:h-16 text-center text-xl sm:text-2xl font-mono font-black text-white bg-slate-900 border-2 border-slate-800 rounded-2xl focus:border-emerald-500 focus:bg-slate-950 focus:outline-none transition-all shadow-inner"
                        />
                      ))}
                    </div>

                    {active2FaMethod === 'email' && (
                      <div className="flex items-center justify-center gap-2 pt-2 text-xs">
                        <button
                          type="button"
                          onClick={handleResendEmail}
                          disabled={resendCooldown > 0}
                          className="text-slate-400 hover:text-white transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${resendCooldown > 0 ? 'animate-spin' : ''}`} />
                          <span>
                            {resendCooldown > 0 
                              ? `Renvoyer dans ${resendCooldown}s` 
                              : 'Renvoyer un nouveau code par email'}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* TRUST DEVICE CHECKBOX */}
                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 cursor-pointer hover:bg-slate-900 transition">
                  <input
                    type="checkbox"
                    checked={trustDevice}
                    onChange={(e) => setTrustDevice(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <Laptop className="w-3.5 h-3.5 text-slate-400" />
                      Se souvenir de cet appareil pendant 30 jours
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Ne pas redemander de code 2FA sur ce navigateur de confiance.
                    </p>
                  </div>
                </label>

                {/* SUBMIT BUTTON */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-900/30 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{loading ? 'Vérification du code...' : 'Valider la connexion 2FA'}</span>
                </button>
              </form>
            </div>
          ) : (
            <>
              {/* ========================================================= */}
              {/* TAB 1: QUICK ROLE SWITCHER WITH CREDENTIALS */}
              {/* ========================================================= */}
              {activeTab === 'quick_switch' && (
                <div className="space-y-3">
                  <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200 flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Test multi-utilisateurs & hiérarchie :</span> Cliquez sur n'importe quel profil ci-dessous pour tester son espace dédié avec son périmètre hiérarchique et ses permissions.
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    {users.map((u) => {
                      const badge = getRoleBadge(u.role);
                      const isCurrent = u.id === currentUser.id;
                      const userDept = departments.find((d) => d.id === u.departmentId);
                      const userTeam = teams.find((t) => t.id === u.teamId);

                      return (
                        <div
                          key={u.id}
                          className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            isCurrent
                              ? 'bg-indigo-950/40 border-indigo-500/60 ring-1 ring-indigo-500/40'
                              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80'}
                              alt={u.name}
                              className="w-10 h-10 rounded-xl object-cover ring-2 ring-slate-700 shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-bold text-white truncate">{u.name}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${badge.color}`}>
                                  {badge.label}
                                </span>
                                {u.mustChangePassword && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 flex items-center gap-1">
                                    <KeyRound className="w-3 h-3" />
                                    1ère Connexion (Mdp temporaire)
                                  </span>
                                )}
                                {u.twoFactorEnabled && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3" />
                                    2FA
                                  </span>
                                )}
                                {isCurrent && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                                    Actif
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 truncate">{u.email}</p>
                              
                              {/* Position and Department / Team Info */}
                              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 flex-wrap">
                                {u.position && (
                                  <span className="text-slate-300 font-medium">{u.position}</span>
                                )}
                                {userDept && (
                                  <span className="bg-slate-800/80 px-1.5 py-0.5 rounded text-[10px] text-slate-400">
                                    {userDept.name}
                                  </span>
                                )}
                                {userTeam && (
                                  <span className="bg-indigo-950/60 px-1.5 py-0.5 rounded text-[10px] text-indigo-300">
                                    {userTeam.name}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-mono">
                                <span>Mot de passe: <strong className="text-slate-300">{u.password || 'Admin2026!'}</strong></span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {u.mustChangePassword && !isCurrent ? (
                              <button
                                type="button"
                                onClick={() => handleQuickLogin(u.id, false)}
                                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-900/30 transition cursor-pointer flex items-center gap-1.5"
                                title="Tester le parcours de 1ère connexion avec changement obligatoire de mot de passe"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                                <span>Tester 1ʳᵉ Connexion</span>
                              </button>
                            ) : (
                              <>
                                {u.twoFactorEnabled && !isCurrent && (
                                  <button
                                    type="button"
                                    onClick={() => handleQuickLogin(u.id, true)}
                                    className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition cursor-pointer flex items-center gap-1"
                                    title="Tester le parcours de vérification 2FA"
                                  >
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    <span>Tester 2FA</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleQuickLogin(u.id, false)}
                                  disabled={isCurrent}
                                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer ${
                                    isCurrent
                                      ? 'bg-slate-800 text-slate-500 cursor-default'
                                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-900/30 active:scale-95'
                                  }`}
                                >
                                  {isCurrent ? (
                                    <>
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                      <span>Espace Actif</span>
                                    </>
                                  ) : (
                                    <>
                                      <span>Accéder</span>
                                      <ArrowRight className="w-3.5 h-3.5" />
                                    </>
                                  )}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 2: MANUAL LOGIN WITH EMAIL & PASSWORD */}
              {/* ========================================================= */}
              {activeTab === 'login' && (
                <form onSubmit={handleManualLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-indigo-400" />
                      Adresse email professionnelle
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ex: sagbodavidcomlan@gmail.com, superadmin@kardx.io ou admin@scaleup-tech.com"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-indigo-400" />
                      Mot de passe
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Entrez votre mot de passe (ou temporaire)"
                        className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-1">
                    <p className="font-semibold text-slate-300">Exemples de comptes disponibles :</p>
                    <p>• <strong>David Sagbo (Admin) :</strong> sagbodavidcomlan@gmail.com / Admin2026!</p>
                    <p>• <strong>Alexandre Meyer (1ère connexion) :</strong> admin@scaleup-tech.com / TempPassword2026!</p>
                    <p>• <strong>Marie Koffi (Manager) :</strong> m.koffi@bestexperts-group.com / Manager2026!</p>
                    <p>• <strong>Super Admin KardX :</strong> superadmin@kardx.io / SuperAdmin2026!</p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-900/30 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? 'Vérification des identifiants...' : 'Se connecter à mon espace'}
                  </button>
                </form>
              )}

              {/* ========================================================= */}
              {/* TAB 3: REGISTER NEW USER */}
              {/* ========================================================= */}
              {activeTab === 'register' && (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">Nom complet</label>
                      <input
                        type="text"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="ex: Thomas Martin"
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:border-indigo-500"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">Intitulé du poste</label>
                      <input
                        type="text"
                        value={regPosition}
                        onChange={(e) => setRegPosition(e.target.value)}
                        placeholder="ex: Lead Account Executive"
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Email professionnel</label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="thomas.martin@bestexperts-group.com"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-indigo-400" />
                        Département
                      </label>
                      <select
                        value={regDepartmentId}
                        onChange={(e) => setRegDepartmentId(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:border-indigo-500"
                      >
                        <option value="">-- Aucun département --</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-indigo-400" />
                        Équipe de rattachement
                      </label>
                      <select
                        value={regTeamId}
                        onChange={(e) => setRegTeamId(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:border-indigo-500"
                      >
                        <option value="">-- Aucune équipe --</option>
                        {teams.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Rôle & Niveau d'accès</label>
                    <select
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value as any)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:border-indigo-500"
                    >
                      <option value="collaborateur">Collaborateur (Espace privé : profil, cartes et leads personnels uniquement)</option>
                      <option value="manager">Manager d'équipe (Accès équipe/département et leads assignés)</option>
                      <option value="admin">Administrateur (Gestion complète de l'organisation)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Mot de passe temporaire initial</label>
                    <input
                      type="text"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Kardx2026!"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 cursor-pointer hover:bg-slate-900 transition">
                    <input
                      type="checkbox"
                      checked={regMustChangePassword}
                      onChange={(e) => setRegMustChangePassword(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 accent-amber-600"
                    />
                    <div className="text-xs">
                      <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                        Exiger le changement de mot de passe à la 1ère connexion
                      </span>
                      <p className="text-[11px] text-slate-400">
                        Le collaborateur devra obligatoirement définir son mot de passe secret lors de son premier accès.
                      </p>
                    </div>
                  </label>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-900/30 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Créer et inviter le collaborateur</span>
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
