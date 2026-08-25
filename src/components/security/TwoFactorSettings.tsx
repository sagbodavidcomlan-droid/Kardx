import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TwoFactorMethod } from '../../types';
import {
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Mail,
  Key,
  QrCode,
  Copy,
  Check,
  RefreshCw,
  Download,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Trash2,
  HelpCircle,
} from 'lucide-react';
import {
  generateTOTPSecret,
  generateBackupCodes,
  generateOtpAuthUri,
  generateQrMatrix,
  maskEmail,
} from '../../utils/twoFactor';

export const TwoFactorSettings: React.FC = () => {
  const {
    currentUser,
    updateUserTwoFactor,
    generateNewBackupCodes,
    revokeTrustedDevice,
    showToast,
  } = useApp();

  const [isEnabling, setIsEnabling] = useState(false);
  const [setupStep, setSetupStep] = useState<1 | 2 | 3>(1);
  const [selectedMethod, setSelectedMethod] = useState<TwoFactorMethod>(
    currentUser.twoFactorMethod || 'both'
  );
  const [tempSecret, setTempSecret] = useState(() => currentUser.twoFactorSecret || generateTOTPSecret());
  const [tempBackupCodes, setTempBackupCodes] = useState<string[]>(
    () => currentUser.twoFactorBackupCodes || generateBackupCodes(8)
  );
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [isDisableModalOpen, setIsDisableModalOpen] = useState(false);
  const [disablePasswordConfirm, setDisablePasswordConfirm] = useState('');

  const isEnabled = !!currentUser.twoFactorEnabled;

  const startSetup = () => {
    const newSecret = generateTOTPSecret();
    const newCodes = generateBackupCodes(8);
    setTempSecret(newSecret);
    setTempBackupCodes(newCodes);
    setSetupStep(1);
    setIsEnabling(true);
    setVerificationError(null);
    setVerificationCode('');
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(tempSecret.replace(/-/g, ''));
    setCopiedSecret(true);
    showToast('Clé secrète copiée dans le presse-papier');
    setTimeout(() => setCopiedSecret(false), 2500);
  };

  const handleCopyBackupCodes = () => {
    const codesText = tempBackupCodes.join('\n');
    navigator.clipboard.writeText(codesText);
    setCopiedCodes(true);
    showToast('Codes de secours copiés');
    setTimeout(() => setCopiedCodes(false), 2500);
  };

  const handleDownloadBackupCodes = () => {
    const content = `KardX - Codes de secours d'authentification à double facteur (2FA)\n` +
      `Compte : ${currentUser.email} (${currentUser.name})\n` +
      `Date de génération : ${new Date().toLocaleDateString('fr-FR')}\n\n` +
      `Conservez ces codes en lieu sûr. Chaque code est utilisable une seule fois en cas de perte de votre téléphone ou boîte email.\n\n` +
      tempBackupCodes.map((c, i) => `${i + 1}. ${c}`).join('\n') +
      `\n\nSupport : support@kardx.io`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kardx-codes-secours-2fa-${currentUser.email.split('@')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Fichier des codes de secours téléchargé');
  };

  const handleVerifyAndActivate = (e: React.FormEvent) => {
    e.preventDefault();
    setVerificationError(null);

    const cleanCode = verificationCode.trim().replace(/\s+/g, '');
    if (cleanCode.length < 6) {
      setVerificationError('Veuillez saisir le code complet à 6 chiffres.');
      return;
    }

    // Activate 2FA for current user
    updateUserTwoFactor(currentUser.id, {
      enabled: true,
      method: selectedMethod,
      secret: tempSecret,
      email: currentUser.email,
      backupCodes: tempBackupCodes,
    });

    setIsEnabling(false);
    setSetupStep(1);
    setVerificationCode('');
    showToast('🎉 Double authentification (2FA) configurée et activée avec succès !');
  };

  const handleDisable2Fa = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser.password && disablePasswordConfirm !== currentUser.password) {
      showToast('Mot de passe de confirmation incorrect.');
      return;
    }

    updateUserTwoFactor(currentUser.id, {
      enabled: false,
    });

    setIsDisableModalOpen(false);
    setDisablePasswordConfirm('');
  };

  const qrMatrix = generateQrMatrix(tempSecret, currentUser.email);

  return (
    <div className="flex flex-col gap-6 text-slate-800">
      
      {/* 2FA STATUS & HERO CARD */}
      <div className={`p-6 sm:p-8 rounded-3xl border transition-all ${
        isEnabled 
          ? 'bg-gradient-to-br from-emerald-950/20 via-slate-900 to-slate-950 border-emerald-500/30 text-white shadow-lg shadow-emerald-950/20'
          : 'bg-white border-slate-200 shadow-sm text-slate-800'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              isEnabled 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                : 'bg-amber-100 text-amber-600 border border-amber-200'
            }`}>
              {isEnabled ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="font-bold text-lg leading-tight">
                  Authentification à Double Facteur (2FA / MFA)
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                  isEnabled 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  {isEnabled ? 'Activée & Protégée' : 'Désactivée (Recommandé)'}
                </span>
              </div>
              <p className={`text-xs mt-1.5 max-w-xl leading-relaxed ${isEnabled ? 'text-slate-300' : 'text-slate-600'}`}>
                {isEnabled
                  ? `Votre compte bénéficie d'une protection renforcée via ${
                      currentUser.twoFactorMethod === 'totp'
                        ? "l'application d'authentification (Google Authenticator / 1Password)"
                        : currentUser.twoFactorMethod === 'email'
                        ? `code de validation envoyé à ${maskEmail(currentUser.twoFactorEmail || currentUser.email)}`
                        : "application Authenticator & code sécurisé par email"
                    }.`
                  : "Sécurisez vos accès individuels et vos fiches de prospection contre le vol d'identifiants en exigeant un code à usage unique à chaque connexion."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {isEnabled ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={startSetup}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition cursor-pointer flex items-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reconfigurer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsDisableModalOpen(true)}
                  className="py-2.5 px-4 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-semibold text-xs border border-rose-500/30 transition cursor-pointer"
                >
                  Désactiver
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={startSetup}
                className="py-3 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-900/30 transition active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>Activer la 2FA maintenant</span>
              </button>
            )}
          </div>
        </div>

        {/* METRICS / SECURITY SCORE */}
        <div className={`mt-6 pt-5 border-t grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs ${
          isEnabled ? 'border-slate-800 text-slate-300' : 'border-slate-100 text-slate-600'
        }`}>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Score de sécurité : <strong className={isEnabled ? 'text-emerald-400' : 'text-amber-600'}>{isEnabled ? '98% (Optimal)' : '62% (Moyen)'}</strong></span>
          </div>
          <div className="flex items-center gap-2.5">
            <Smartphone className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>Méthode principale : <strong className={isEnabled ? 'text-white' : 'text-slate-800'}>{currentUser.twoFactorMethod?.toUpperCase() || 'EMAIL'}</strong></span>
          </div>
          <div className="flex items-center gap-2.5">
            <Key className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Codes de secours : <strong className={isEnabled ? 'text-white' : 'text-slate-800'}>{currentUser.twoFactorBackupCodes?.length || 0} disponibles</strong></span>
          </div>
        </div>
      </div>

      {/* SETUP WIZARD MODAL / ACCORDION */}
      {isEnabling && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-indigo-200 shadow-xl ring-4 ring-indigo-500/10 flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
          
          {/* Step Indicator */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                Assistant de configuration 2FA
              </span>
              <h3 className="text-base font-bold text-slate-800">
                {setupStep === 1 && 'Étape 1 : Choisissez votre méthode de double facteur'}
                {setupStep === 2 && 'Étape 2 : Synchronisation & scan du QR Code'}
                {setupStep === 3 && 'Étape 3 : Sauvegarde des codes de secours'}
              </h3>
            </div>

            <div className="flex items-center gap-1.5">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center ${
                    setupStep === step
                      ? 'bg-indigo-600 text-white'
                      : setupStep > step
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {setupStep > step ? <Check className="w-3.5 h-3.5" /> : step}
                </div>
              ))}
            </div>
          </div>

          {/* STEP 1: METHOD SELECTION */}
          {setupStep === 1 && (
            <div className="flex flex-col gap-4">
              <p className="text-xs text-slate-600">
                Sélectionnez le protocole d'authentification renforcée souhaité pour vos connexions :
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Method 1: TOTP App */}
                <div
                  onClick={() => setSelectedMethod('totp')}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between gap-3 ${
                    selectedMethod === 'totp'
                      ? 'border-indigo-600 bg-indigo-50/50'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <input
                      type="radio"
                      checked={selectedMethod === 'totp'}
                      onChange={() => setSelectedMethod('totp')}
                      className="accent-indigo-600"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-800">Application Authenticator (Recommandé)</h4>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Google Authenticator, Microsoft Authenticator, 1Password, Authy.
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md w-fit">
                    Protection maximale
                  </span>
                </div>

                {/* Method 2: Secure Email OTP */}
                <div
                  onClick={() => setSelectedMethod('email')}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between gap-3 ${
                    selectedMethod === 'email'
                      ? 'border-indigo-600 bg-indigo-50/50'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input
                      type="radio"
                      checked={selectedMethod === 'email'}
                      onChange={() => setSelectedMethod('email')}
                      className="accent-indigo-600"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-800">Code temporaire par Email</h4>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Code à 6 chiffres envoyé automatiquement à {maskEmail(currentUser.email)}.
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md w-fit">
                    Sans application requise
                  </span>
                </div>

                {/* Method 3: Hybrid Both */}
                <div
                  onClick={() => setSelectedMethod('both')}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between gap-3 ${
                    selectedMethod === 'both'
                      ? 'border-indigo-600 bg-indigo-50/50'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <input
                      type="radio"
                      checked={selectedMethod === 'both'}
                      onChange={() => setSelectedMethod('both')}
                      className="accent-indigo-600"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-800">Hybride (App & Email)</h4>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Choix flexible à chaque connexion entre l'application ou l'email.
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md w-fit">
                    Flexibilité totale
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEnabling(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => setSetupStep(2)}
                  className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-900/20 cursor-pointer"
                >
                  Continuer vers l'étape 2
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: TOTP SCAN / EMAIL CODE VERIFICATION */}
          {setupStep === 2 && (
            <div className="flex flex-col gap-6">
              {selectedMethod === 'email' ? (
                <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <h4 className="font-bold text-xs text-blue-900">
                      Vérification de votre adresse email
                    </h4>
                  </div>
                  <p className="text-xs text-blue-800 leading-relaxed">
                    Un code de test a été préparé pour votre adresse <strong>{currentUser.email}</strong>. Saisissez <strong>123456</strong> (ou tout code à 6 chiffres) pour valider l'activation.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  {/* Visual QR Code Generator */}
                  <div className="flex flex-col items-center justify-center p-6 bg-slate-900 rounded-2xl text-white border border-slate-800 shadow-inner">
                    <div className="p-3 bg-white rounded-xl shadow-md">
                      {/* Responsive SVG QR Pattern */}
                      <svg
                        viewBox={`0 0 ${qrMatrix.length} ${qrMatrix.length}`}
                        className="w-40 h-40"
                        shapeRendering="crispEdges"
                      >
                        {qrMatrix.map((row, rIdx) =>
                          row.map((cell, cIdx) =>
                            cell ? (
                              <rect
                                key={`${rIdx}-${cIdx}`}
                                x={cIdx}
                                y={rIdx}
                                width="1"
                                height="1"
                                fill="#0F172A"
                              />
                            ) : null
                          )
                        )}
                      </svg>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-3 text-center">
                      Scannez ce QR Code avec votre application d'authentification
                    </p>
                  </div>

                  {/* Manual Key & Instructions */}
                  <div className="flex flex-col gap-3">
                    <div>
                      <h4 className="font-bold text-xs text-slate-800">
                        1. Ouvrez votre application 2FA
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Ajoutez un nouveau compte et scannez le QR code ci-contre.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-bold text-xs text-slate-800">
                        2. Clé de configuration manuelle
                      </h4>
                      <div className="mt-1 flex items-center gap-2">
                        <code className="px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs font-mono text-slate-800 font-bold tracking-widest flex-1 select-all">
                          {tempSecret}
                        </code>
                        <button
                          type="button"
                          onClick={handleCopySecret}
                          className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer"
                          title="Copier la clé"
                        >
                          {copiedSecret ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 6-DIGIT VERIFICATION INPUT */}
              <form onSubmit={handleVerifyAndActivate} className="flex flex-col gap-3 pt-4 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-800">
                  3. Saisissez le code à 6 chiffres généré par l'application pour confirmer :
                </label>

                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    maxLength={6}
                    required
                    placeholder="123456"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    className="w-44 px-4 py-2.5 rounded-xl bg-slate-50 border-2 border-slate-300 text-center font-mono text-lg font-bold tracking-widest text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-0"
                  />

                  <button
                    type="button"
                    onClick={() => setSetupStep(3)}
                    className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
                  >
                    Voir les codes de secours
                  </button>

                  <button
                    type="submit"
                    className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-900/20 cursor-pointer"
                  >
                    Valider et activer
                  </button>
                </div>

                {verificationError && (
                  <p className="text-xs text-rose-600 font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {verificationError}
                  </p>
                )}
              </form>
            </div>
          )}

          {/* STEP 3: EMERGENCY RECOVERY CODES */}
          {setupStep === 3 && (
            <div className="flex flex-col gap-4">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold">Codes de secours d'urgence (Usage unique) :</strong>
                  <p className="mt-0.5 text-amber-800">
                    Ces codes vous permettent d'accéder à votre compte en cas de perte de votre téléphone ou de votre boîte de messagerie. Chaque code ne peut être utilisé qu'une seule fois.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                {tempBackupCodes.map((code, idx) => (
                  <div
                    key={idx}
                    className="py-2 px-3 rounded-lg bg-white border border-slate-200 text-center font-mono text-xs font-bold text-slate-800 tracking-wider shadow-2xs"
                  >
                    {code}
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyBackupCodes}
                    className="py-2 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedCodes ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copier la liste</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadBackupCodes}
                    className="py-2 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Télécharger TXT</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSetupStep(2)}
                    className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer"
                  >
                    Retour à la validation
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TRUSTED DEVICES & ACTIVE SESSIONS */}
      {isEnabled && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                <Laptop className="w-4 h-4 text-indigo-600" />
                Appareils de Confiance & Sessions Sécurisées
              </h3>
              <p className="text-xs text-slate-500">
                Appareils dispensés de code 2FA pendant 30 jours suite à une vérification réussie.
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {(currentUser.trustedDevices || []).length === 0 ? (
              <p className="text-xs text-slate-500 py-3">
                Aucun appareil mémorisé. Le code 2FA sera demandé à chaque connexion.
              </p>
            ) : (
              currentUser.trustedDevices?.map((device) => (
                <div key={device.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                      <Laptop className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-slate-800">{device.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {device.browser} • {device.ip}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Autorisé jusqu'au {new Date(device.trustedUntil).toLocaleDateString('fr-FR')}
                    </span>

                    <button
                      type="button"
                      onClick={() => revokeTrustedDevice(currentUser.id, device.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="Révoquer cet appareil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* DISABLE CONFIRMATION MODAL */}
      {isDisableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Désactiver la double authentification ?</h3>
            <p className="text-xs text-slate-600 mt-1 mb-4 leading-relaxed">
              La désactivation de la 2FA réduit le niveau de sécurité de votre compte et de vos données commerciales.
            </p>

            <form onSubmit={handleDisable2Fa} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirmez votre mot de passe pour valider :
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={disablePasswordConfirm}
                  onChange={(e) => setDisablePasswordConfirm(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                />
              </div>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsDisableModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
                >
                  Conserver la 2FA
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-900/20 cursor-pointer"
                >
                  Confirmer la désactivation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
