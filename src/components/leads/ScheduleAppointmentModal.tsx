import React, { useState } from 'react';
import { Lead } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  downloadIcsFile,
  getGoogleCalendarUrl,
  getOutlookLiveCalendarUrl,
  getYahooCalendarUrl,
  CalendarEventPayload,
} from '../../utils/calendarEventGenerator';
import {
  Calendar,
  Clock,
  Video,
  Phone,
  Building,
  MapPin,
  Sparkles,
  Download,
  ExternalLink,
  CheckCircle2,
  X,
  User,
  Mail,
  Share2,
  CalendarPlus,
  Zap,
} from 'lucide-react';

interface ScheduleAppointmentModalProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
  onAppointmentScheduled?: (updatedLead: Lead) => void;
}

export const ScheduleAppointmentModal: React.FC<ScheduleAppointmentModalProps> = ({
  lead,
  isOpen,
  onClose,
  onAppointmentScheduled,
}) => {
  const { currentUser, addLeadInteraction, updateLeadDetails, showToast } = useApp();

  const [appointmentType, setAppointmentType] = useState<'meeting' | 'call' | 'demo' | 'in_person'>('meeting');
  const [title, setTitle] = useState(
    `Rendez-vous commercial - ${lead.firstName} ${lead.lastName} (${lead.company || 'KardX'})`
  );
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [time, setTime] = useState('10:00');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [meetingMedium, setMeetingMedium] = useState<'meet' | 'teams' | 'zoom' | 'phone' | 'onsite'>('meet');
  const [customLocation, setCustomLocation] = useState(lead.city ? `${lead.city}, France` : '');
  const [description, setDescription] = useState(
    `Point d'échange suite à la prise de contact via la carte connectée KardX.\n\nParticipants : ${lead.firstName} ${lead.lastName} & ${currentUser.name}\nEmail prospect : ${lead.email}\nTéléphone : ${lead.phone || 'Non renseigné'}\nSociété : ${lead.company || 'Non renseignée'}`
  );
  const [syncAsReminder, setSyncAsReminder] = useState(true);

  if (!isOpen) return null;

  // Compute startDate
  const getStartDateTime = (): Date => {
    const [h, m] = time.split(':').map(Number);
    const [year, month, day] = date.split('-').map(Number);
    return new Date(year, month - 1, day, h, m, 0);
  };

  const getComputedLocation = (): string => {
    if (meetingMedium === 'meet') return 'Google Meet (Visioconférence)';
    if (meetingMedium === 'teams') return 'Microsoft Teams';
    if (meetingMedium === 'zoom') return 'Zoom Meeting';
    if (meetingMedium === 'phone') return `Appel téléphonique (${lead.phone || 'Au numéro du prospect'})`;
    return customLocation || lead.city || 'Bureaux / Sur site';
  };

  const getEventPayload = (): CalendarEventPayload => {
    return {
      title,
      description,
      location: getComputedLocation(),
      startDate: getStartDateTime(),
      durationMinutes,
      contactName: `${lead.firstName} ${lead.lastName}`,
      contactEmail: lead.email,
      contactPhone: lead.phone,
      organizerName: currentUser.name,
      organizerEmail: currentUser.email,
    };
  };

  const handleSaveAndDownloadIcs = () => {
    const payload = getEventPayload();
    downloadIcsFile(payload);

    const startDateTime = getStartDateTime();

    // Log interaction
    addLeadInteraction(lead.id, {
      type: appointmentType === 'call' ? 'call' : 'meeting',
      title: `📅 RDV Programmé : ${title}`,
      notes: `Rendez-vous fixé le ${startDateTime.toLocaleDateString('fr-FR')} à ${time} (${durationMinutes} min).\nLieu/Plateforme : ${getComputedLocation()}.\nFichier .ics téléchargé.`,
      date: new Date().toISOString(),
      authorName: currentUser.name,
    });

    if (syncAsReminder) {
      updateLeadDetails(lead.id, {
        reminderDate: startDateTime.toISOString(),
        reminderNote: `RDV : ${title} (${getComputedLocation()})`,
        reminderStatus: 'pending',
      });
    }

    showToast(`Événement généré et téléchargé (.ics) pour ${lead.firstName} ${lead.lastName} !`);
    if (onAppointmentScheduled) {
      onAppointmentScheduled({
        ...lead,
        reminderDate: syncAsReminder ? startDateTime.toISOString() : lead.reminderDate,
        reminderNote: syncAsReminder ? `RDV : ${title}` : lead.reminderNote,
      });
    }
    onClose();
  };

  const handleOpenGoogleCalendar = () => {
    const payload = getEventPayload();
    const url = getGoogleCalendarUrl(payload);
    window.open(url, '_blank', 'noopener,noreferrer');

    const startDateTime = getStartDateTime();
    addLeadInteraction(lead.id, {
      type: 'meeting',
      title: `📅 RDV Google Calendar : ${title}`,
      notes: `Rendez-vous fixé le ${startDateTime.toLocaleDateString('fr-FR')} à ${time} (${durationMinutes} min) sur Google Calendar.`,
      date: new Date().toISOString(),
      authorName: currentUser.name,
    });

    if (syncAsReminder) {
      updateLeadDetails(lead.id, {
        reminderDate: startDateTime.toISOString(),
        reminderNote: `RDV : ${title}`,
        reminderStatus: 'pending',
      });
    }

    showToast('Redirection vers Google Calendar...');
    if (onAppointmentScheduled) {
      onAppointmentScheduled({
        ...lead,
        reminderDate: syncAsReminder ? startDateTime.toISOString() : lead.reminderDate,
      });
    }
  };

  const handleOpenOutlook = () => {
    const payload = getEventPayload();
    const url = getOutlookLiveCalendarUrl(payload);
    window.open(url, '_blank', 'noopener,noreferrer');

    const startDateTime = getStartDateTime();
    addLeadInteraction(lead.id, {
      type: 'meeting',
      title: `📅 RDV Outlook : ${title}`,
      notes: `Rendez-vous fixé le ${startDateTime.toLocaleDateString('fr-FR')} à ${time} (${durationMinutes} min) sur Outlook.`,
      date: new Date().toISOString(),
      authorName: currentUser.name,
    });

    if (syncAsReminder) {
      updateLeadDetails(lead.id, {
        reminderDate: startDateTime.toISOString(),
        reminderNote: `RDV : ${title}`,
        reminderStatus: 'pending',
      });
    }

    showToast('Redirection vers Outlook...');
  };

  const handlePresetSlot = (daysOffset: number, presetTime: string, label: string) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setDate(`${yyyy}-${mm}-${dd}`);
    setTime(presetTime);
    showToast(`Créneau appliqué : ${label}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold">
              <CalendarPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                Planifier un Rendez-vous
              </h3>
              <p className="text-xs text-slate-400">
                Avec <strong className="text-slate-200">{lead.firstName} {lead.lastName}</strong> {lead.company ? `(${lead.company})` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/80 hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs text-slate-700">
          {/* Quick Slot Suggestions */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Créneaux rapides suggérés
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handlePresetSlot(1, '10:00', 'Demain 10h')}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/60 font-semibold text-slate-700 text-left transition cursor-pointer"
              >
                <span className="block text-[11px] font-bold text-indigo-600">Demain</span>
                <span className="text-xs">10:00 - 10:30</span>
              </button>
              <button
                type="button"
                onClick={() => handlePresetSlot(1, '14:30', 'Demain 14h30')}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/60 font-semibold text-slate-700 text-left transition cursor-pointer"
              >
                <span className="block text-[11px] font-bold text-indigo-600">Demain</span>
                <span className="text-xs">14:30 - 15:00</span>
              </button>
              <button
                type="button"
                onClick={() => handlePresetSlot(2, '11:00', 'Dans 2 jours 11h')}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/60 font-semibold text-slate-700 text-left transition cursor-pointer"
              >
                <span className="block text-[11px] font-bold text-indigo-600">Dans 2j</span>
                <span className="text-xs">11:00 - 11:30</span>
              </button>
              <button
                type="button"
                onClick={() => handlePresetSlot(7, '10:00', 'Dans 1 semaine')}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/60 font-semibold text-slate-700 text-left transition cursor-pointer"
              >
                <span className="block text-[11px] font-bold text-indigo-600">Semaine +1</span>
                <span className="text-xs">10:00 - 10:30</span>
              </button>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Titre de la réunion / Objet du RDV
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 text-slate-900"
              />
            </div>

            {/* Date & Time & Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  Date du RDV
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  Heure de début
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Durée prévue
                </label>
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={15}>15 minutes (Point rapide)</option>
                  <option value={30}>30 minutes (Standard)</option>
                  <option value={45}>45 minutes (Démo approfondie)</option>
                  <option value={60}>1 heure (Cadrage complet)</option>
                  <option value={90}>1h30 (Atelier)</option>
                </select>
              </div>
            </div>

            {/* Medium / Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Canal / Support
                </label>
                <select
                  value={meetingMedium}
                  onChange={(e) => setMeetingMedium(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="meet">Google Meet (Visioconférence)</option>
                  <option value="teams">Microsoft Teams</option>
                  <option value="zoom">Zoom Meeting</option>
                  <option value="phone">Appel Téléphonique</option>
                  <option value="onsite">Sur site / Rendez-vous physique</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  Lieu ou Lien
                </label>
                <input
                  type="text"
                  value={
                    meetingMedium === 'onsite'
                      ? customLocation
                      : meetingMedium === 'phone'
                      ? lead.phone || 'Appel direct'
                      : 'Généré automatiquement'
                  }
                  disabled={meetingMedium !== 'onsite'}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  placeholder="Adresse ou salle de réunion..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-500"
                />
              </div>
            </div>

            {/* Description & Agenda */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ordre du jour & Notes transmises
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Sync as lead reminder checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="syncReminder"
                checked={syncAsReminder}
                onChange={(e) => setSyncAsReminder(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
              />
              <label htmlFor="syncReminder" className="text-xs text-slate-600 font-semibold cursor-pointer">
                Synchroniser également comme rappel de relance actif dans mon pipeline KardX
              </label>
            </div>
          </div>
        </div>

        {/* Action Footer: Calendar Export buttons */}
        <div className="p-5 sm:p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenGoogleCalendar}
              className="flex-1 sm:flex-none py-2 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-300 flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
            >
              <span className="text-sm">📅</span>
              <span>Google Calendar</span>
            </button>

            <button
              type="button"
              onClick={handleOpenOutlook}
              className="flex-1 sm:flex-none py-2 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-300 flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
            >
              <span className="text-sm">📧</span>
              <span>Outlook / 365</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 rounded-xl text-slate-600 hover:text-slate-800 text-xs font-semibold transition cursor-pointer"
            >
              Annuler
            </button>

            <button
              type="button"
              onClick={handleSaveAndDownloadIcs}
              className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Générer & Télécharger .ICS</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
