import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Lead, LeadSource, LeadStatus } from '../../types';
import {
  UserPlus,
  X,
  Building,
  Briefcase,
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  Clock,
  Sparkles,
  Tag,
  ShieldCheck,
  CheckCircle,
  FileText,
  UserCheck,
  Zap,
} from 'lucide-react';

interface ManualLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeadCreated?: (lead: Lead) => void;
}

const PRESET_TAGS = [
  'VIP',
  'Grand Compte',
  'Priorité Haute',
  'Décideur',
  'Salon / Conférence',
  'Lead Chaud',
  'SaaS / Tech',
  'Conseil & Stratégie',
  'Budget Validé',
  'Rendez-vous à fixer',
];

export const ManualLeadModal: React.FC<ManualLeadModalProps> = ({
  isOpen,
  onClose,
  onLeadCreated,
}) => {
  const {
    currentUser,
    users,
    profiles,
    activeProfile,
    createLead,
    updateLeadDetails,
    showToast,
  } = useApp();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('France');

  const [source, setSource] = useState<LeadSource>('manual');
  const [status, setStatus] = useState<LeadStatus>('new');
  const [selectedProfileId, setSelectedProfileId] = useState<string>(
    activeProfile?.id || profiles[0]?.id || ''
  );

  // Assignment: 'auto' (run routing rules) vs specific user id
  const [assignmentMode, setAssignmentMode] = useState<'auto' | 'manual'>('manual');
  const [assignedUserId, setAssignedUserId] = useState<string>(currentUser.id);

  // Tags
  const [selectedTags, setSelectedTags] = useState<string[]>(['Priorité Haute']);
  const [customTagInput, setCustomTagInput] = useState('');

  // Meeting notes & Context
  const [notes, setNotes] = useState('');
  const [meetingContext, setMeetingContext] = useState('');

  // Reminder
  const [setReminder, setSetReminder] = useState(false);
  const [reminderDate, setReminderDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    return tomorrow.toISOString().slice(0, 16);
  });
  const [reminderNote, setReminderNote] = useState('Premier appel de qualification et présentation');

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleAddCustomTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    if (!customTagInput.trim()) return;
    const tagClean = customTagInput.trim();
    if (!selectedTags.includes(tagClean)) {
      setSelectedTags([...selectedTags, tagClean]);
    }
    setCustomTagInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      showToast('Veuillez renseigner le prénom et le nom du prospect.');
      return;
    }

    if (!email.trim() && !phone.trim()) {
      showToast('Veuillez renseigner au moins un moyen de contact (Email ou Téléphone).');
      return;
    }

    setIsSubmitting(true);
    try {
      const newLeadData = {
        profileId: selectedProfileId || activeProfile?.id || 'prof_default',
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        jobTitle: jobTitle.trim() || undefined,
        company: company.trim() || undefined,
        email: email.trim().toLowerCase() || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@prospect-manuel.com`,
        phone: phone.trim() || undefined,
        city: city.trim() || undefined,
        country: country.trim() || undefined,
        source: source,
        status: status,
        tags: selectedTags,
        notes: notes.trim() || undefined,
        meetingContext: meetingContext.trim() || undefined,
        assignedUserId: assignmentMode === 'manual' ? assignedUserId : undefined,
        consentGiven: true,
        consentTimestamp: new Date().toISOString(),
        reminderDate: setReminder && reminderDate ? new Date(reminderDate).toISOString() : undefined,
        reminderNote: setReminder ? reminderNote.trim() : undefined,
        reminderStatus: setReminder ? ('pending' as const) : undefined,
      };

      const created = await createLead(newLeadData);

      // If website or extra details are present, update
      if (website.trim()) {
        updateLeadDetails(created.id, {
          notes: notes.trim() ? `${notes.trim()}\nSite Web : ${website.trim()}` : `Site Web : ${website.trim()}`,
        });
      }

      if (onLeadCreated) {
        onLeadCreated(created);
      }

      showToast(`Prospect ${firstName} ${lastName} ajouté avec succès au CRM !`);
      onClose();
    } catch (err) {
      showToast('Une erreur est survenue lors de la création du prospect.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-8 border border-slate-100 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Créer Manuellement un Prospect
              </h2>
              <p className="text-xs text-slate-500">
                Saisie directe de contacts rencontrés lors d'événements, salons ou appels commerciaux.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* 1. IDENTITY & CONTACT */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>1. Identité du Contact</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Prénom <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="ex: Alexandre"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Nom <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="ex: Dupont"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Poste / Fonction
                </label>
                <div className="relative">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="ex: Directeur Commercial & Innovation"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Entreprise / Organisation
                </label>
                <div className="relative">
                  <Building className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="ex: Groupe Capgemini"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Email Professionnel
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alexandre.dupont@entreprise.com"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Téléphone / Mobile
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+33 6 12 34 56 78"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Site Web</label>
                <div className="relative">
                  <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://..."
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Ville</label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="ex: Paris, Lyon, Dakar..."
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Pays</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="France"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* 2. PIPELINE & ATTRIBUTION */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-indigo-600" />
              <span>2. Canal, Statut CRM & Attribution</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Origine / Source</label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value as LeadSource)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="manual">Saisie Manuelle Directe</option>
                  <option value="salon">Salon / Événement Pro</option>
                  <option value="phone">Prospection Téléphonique</option>
                  <option value="recommendation">Recommandation / Réseau</option>
                  <option value="linkedin">Prospection LinkedIn</option>
                  <option value="nfc">NFC Tap Physique</option>
                  <option value="qr">Scan QR Code</option>
                  <option value="email_signature">Signature Email</option>
                  <option value="card_scanner">Scanner IA Carte de Visite</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Statut dans le Pipeline</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as LeadStatus)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="new">Nouveau Contact</option>
                  <option value="contacted">Contacté / En discussion</option>
                  <option value="qualified">Prospect Qualifié</option>
                  <option value="proposal">Proposition / Devis envoyé</option>
                  <option value="won">Client Gagné / Signé</option>
                  <option value="lost">Perdu / Non retenu</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Profil de Rattachement</label>
                <select
                  value={selectedProfileId}
                  onChange={(e) => setSelectedProfileId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} ({p.company || 'Kardx'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Attribution options */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">
                  Attribution du Prospect
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAssignmentMode('manual')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      assignmentMode === 'manual'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Collaborateur Précis
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignmentMode('auto')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                      assignmentMode === 'auto'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Auto-Routage par IA</span>
                  </button>
                </div>
              </div>

              {assignmentMode === 'manual' ? (
                <div className="space-y-1">
                  <select
                    value={assignedUserId}
                    onChange={(e) => setAssignedUserId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} — {u.jobTitle || u.role} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <p className="text-[11px] text-slate-500">
                  Le prospect sera automatiquement analysé et distribué au commercial ou à l'équipe la plus pertinente selon vos règles actives de routage géographique, sectoriel ou de scoring.
                </p>
              )}
            </div>
          </div>

          {/* 3. TAGS & NOTES */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-indigo-600" />
              <span>3. Tags & Contexte de Rencontre</span>
            </h3>

            {/* Suggested Tags */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">
                Tags recommandés (cliquez pour ajouter) :
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleToggleTag(tag)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <span>{tag}</span>
                      {isSelected && <CheckCircle className="w-3 h-3" />}
                    </button>
                  );
                })}
              </div>

              {/* Custom tag input */}
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="text"
                  value={customTagInput}
                  onChange={(e) => setCustomTagInput(e.target.value)}
                  onKeyDown={handleAddCustomTag}
                  placeholder="Ajouter un tag personnalisé puis appuyer sur Entrée..."
                  className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddCustomTag}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700 cursor-pointer"
                >
                  Ajouter Tag
                </button>
              </div>
            </div>

            {/* Notes & Context */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Contexte de Rencontre
                </label>
                <input
                  type="text"
                  value={meetingContext}
                  onChange={(e) => setMeetingContext(e.target.value)}
                  placeholder="ex: Rencontre au stand B12 salon VivaTech"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Notes & Besoins exprimés
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Projet de renouvellement flotte 50 collaborateurs au Q3..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* 4. OPTIONAL SCHEDULED REMINDER */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-800">
                  Planifier immédiatement une relance commerciale
                </span>
              </div>
              <input
                type="checkbox"
                checked={setReminder}
                onChange={(e) => setSetReminder(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
              />
            </div>

            {setReminder && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Date et Heure du Rappel
                  </label>
                  <input
                    type="datetime-local"
                    value={reminderDate}
                    onChange={(e) => setReminderDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Objet de la relance
                  </label>
                  <input
                    type="text"
                    value={reminderNote}
                    onChange={(e) => setReminderNote(e.target.value)}
                    placeholder="ex: Rappel téléphonique après envoi du devis"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SUBMIT BUTTONS */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white text-xs font-bold shadow-md transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isSubmitting ? 'Enregistrement...' : 'Enregistrer le Prospect'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
