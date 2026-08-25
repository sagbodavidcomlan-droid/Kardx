import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { downloadVCard } from '../../utils/vcard';
import { 
  X, 
  Sparkles, 
  CheckCircle, 
  Download, 
  Send, 
  MessageSquare, 
  ShieldCheck,
  UserCheck,
  Building,
  Mail,
  Phone
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const ExchangeModal: React.FC = () => {
  const { 
    isExchangeModalOpen, 
    setIsExchangeModalOpen, 
    activeProfile, 
    exchangeSource, 
    createLead,
    showToast 
  } = useApp();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    jobTitle: '',
    meetingContext: '',
    notes: '',
    consent: true,
    honeypot: '', // anti-spam
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isExchangeModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Anti-spam check
    if (formData.honeypot) {
      setIsExchangeModalOpen(false);
      return;
    }

    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      showToast('Veuillez renseigner votre prénom, nom et email.');
      return;
    }

    if (!formData.consent) {
      showToast('Veuillez accepter la politique de confidentialité pour continuer.');
      return;
    }

    setIsSubmitting(true);

    try {
      await createLead({
        profileId: activeProfile.id,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim() || undefined,
        company: formData.company.trim() || undefined,
        jobTitle: formData.jobTitle.trim() || undefined,
        meetingContext: formData.meetingContext.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        source: exchangeSource || 'nfc',
        status: 'new',
        tags: ['Nouveau Contact', exchangeSource === 'nfc' ? 'NFC Tap' : 'QR Scan'],
        consentGiven: true,
        consentTimestamp: new Date().toISOString(),
        device: /Mobi|Android/i.test(navigator.userAgent) ? 'Smartphone' : 'Ordinateur',
      });

      setIsSubmitting(false);
      setIsSubmitted(true);

      // Trigger Confetti!
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'],
        });
      } catch (err) {
        // ignore
      }
    } catch (err) {
      setIsSubmitting(false);
      showToast('Une erreur est survenue lors de l\'envoi.');
    }
  };

  const handleClose = () => {
    setIsExchangeModalOpen(false);
    setIsSubmitted(false);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
      jobTitle: '',
      meetingContext: '',
      notes: '',
      consent: true,
      honeypot: '',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 my-8 animate-in fade-in zoom-in duration-200 text-slate-900 dark:text-slate-100">
        
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {!isSubmitted ? (
          <div>
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Échanger mes coordonnées
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Partagez vos coordonnées avec <span className="font-semibold text-slate-700 dark:text-slate-200">{activeProfile.firstName} {activeProfile.lastName}</span>
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 mt-4">
              {/* Hidden honeypot */}
              <input
                type="text"
                name="website_dummy"
                value={formData.honeypot}
                onChange={(e) => setFormData({ ...formData, honeypot: e.target.value })}
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
              />

              {/* Name fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Prénom <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Jean"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nom <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Dupont"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email professionnel <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="jean.dupont@entreprise.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    placeholder="+33 6 12 34 56 78"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Company & Job */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Entreprise / Organisation
                  </label>
                  <input
                    type="text"
                    placeholder="Acme Corp"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Fonction / Poste
                  </label>
                  <input
                    type="text"
                    placeholder="Directeur Commercial"
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Notes / Message */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Message ou contexte de notre rencontre
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex : Rencontré au salon, intéressé par un devis..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* RGPD Consent */}
              <label className="flex items-start gap-2.5 text-xs text-slate-500 dark:text-slate-400 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={formData.consent}
                  onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
                  className="mt-0.5 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
                <span>
                  J'accepte que mes coordonnées soient transmises à {activeProfile.company || 'l’organisation'} pour assurer le suivi de notre échange professionnel.
                </span>
              </label>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm shadow-lg flex items-center justify-center gap-2 transition cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Envoi en cours...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Envoyer mes coordonnées</span>
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* SUCCESS STATE & RECIPROCAL VCARD DOWNLOAD */
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-500 flex items-center justify-center mb-4 ring-8 ring-emerald-500/10">
              <CheckCircle className="w-9 h-9" />
            </div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
              Coordonnées transmises avec succès !
            </h3>
            
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-6">
              {activeProfile.firstName} {activeProfile.lastName} a bien reçu vos informations. Vous pouvez maintenant enregistrer sa fiche contact complète.
            </p>

            <div className="w-full flex flex-col gap-2.5">
              {/* Reciprocal Download VCF */}
              <button
                onClick={() => downloadVCard(activeProfile)}
                className="w-full py-3.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Télécharger la fiche contact de {activeProfile.firstName} (.vcf)</span>
              </button>

              {/* Quick WhatsApp Follow-up */}
              {activeProfile.contacts.whatsapp && (
                <a
                  href={`https://wa.me/${activeProfile.contacts.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Bonjour ${activeProfile.firstName}, je viens de vous laisser mes coordonnées via votre carte KardX.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-medium text-xs flex items-center justify-center gap-2 transition"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-500" />
                  <span>Envoyer un message WhatsApp direct</span>
                </a>
              )}

              <button
                onClick={handleClose}
                className="w-full mt-2 py-2 text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Fermer
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
