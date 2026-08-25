import React, { useState } from 'react';
import { Lead, LeadInteraction } from '../../types';
import { useApp } from '../../context/AppContext';
import { ScheduleAppointmentModal } from './ScheduleAppointmentModal';
import { 
  History, 
  Plus, 
  Phone, 
  Mail, 
  Video, 
  MessageSquare, 
  FileText, 
  Calendar, 
  Trash2, 
  Check, 
  X, 
  Clock, 
  User, 
  ChevronDown,
  Sparkles,
  CalendarPlus
} from 'lucide-react';

interface LeadInteractionHistoryProps {
  lead: Lead;
  onUpdateLead?: (updatedLead: Lead) => void;
}

export const LeadInteractionHistory: React.FC<LeadInteractionHistoryProps> = ({ 
  lead,
  onUpdateLead 
}) => {
  const { addLeadInteraction, deleteLeadInteraction, currentUser } = useApp();
  
  const [isAdding, setIsAdding] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [type, setType] = useState<LeadInteraction['type']>('call');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [interactionDate, setInteractionDate] = useState<string>(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  });

  const interactions = lead.interactions || [];

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim() && !title.trim()) return;

    const defaultTitle = 
      title.trim() ||
      (type === 'call'
        ? 'Appel téléphonique'
        : type === 'email'
        ? 'Échange par email'
        : type === 'meeting'
        ? 'Rendez-vous / Visioconférence'
        : type === 'whatsapp'
        ? 'Message WhatsApp'
        : type === 'event'
        ? 'Rencontre salon / événement'
        : 'Note interne de suivi');

    const newInteractionData = {
      type,
      title: defaultTitle,
      notes: notes.trim(),
      date: new Date(interactionDate).toISOString(),
      authorName: currentUser.name,
    };

    addLeadInteraction(lead.id, newInteractionData);

    if (onUpdateLead) {
      const simulatedNew: LeadInteraction = {
        id: `int_${Date.now()}`,
        leadId: lead.id,
        ...newInteractionData,
        createdAt: new Date().toISOString(),
      };
      onUpdateLead({
        ...lead,
        interactions: [simulatedNew, ...interactions],
      });
    }

    // Reset form
    setTitle('');
    setNotes('');
    setIsAdding(false);
  };

  const handleDelete = (interactionId: string) => {
    deleteLeadInteraction(lead.id, interactionId);
    if (onUpdateLead) {
      onUpdateLead({
        ...lead,
        interactions: interactions.filter((i) => i.id !== interactionId),
      });
    }
  };

  const getTypeIcon = (interactionType: LeadInteraction['type']) => {
    switch (interactionType) {
      case 'call':
        return <Phone className="w-3.5 h-3.5 text-blue-600" />;
      case 'email':
        return <Mail className="w-3.5 h-3.5 text-purple-600" />;
      case 'meeting':
        return <Video className="w-3.5 h-3.5 text-emerald-600" />;
      case 'whatsapp':
        return <MessageSquare className="w-3.5 h-3.5 text-green-600" />;
      case 'event':
        return <Calendar className="w-3.5 h-3.5 text-amber-600" />;
      case 'note':
      default:
        return <FileText className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  const getTypeBadge = (interactionType: LeadInteraction['type']) => {
    switch (interactionType) {
      case 'call':
        return { label: 'Appel', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'email':
        return { label: 'Email', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'meeting':
        return { label: 'Rendez-vous', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'whatsapp':
        return { label: 'WhatsApp', bg: 'bg-green-50 text-green-700 border-green-200' };
      case 'event':
        return { label: 'Événement', bg: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'note':
      default:
        return { label: 'Note', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const quickPresets = [
    { type: 'call' as const, label: '📞 Appel court (point de cadrage)' },
    { type: 'meeting' as const, label: '🤝 Démo / Présentation effectuée' },
    { type: 'email' as const, label: '✉️ Proposition transmise par email' },
    { type: 'whatsapp' as const, label: '💬 Échange rapide sur WhatsApp' },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4.5 sm:p-5 flex flex-col gap-4 shadow-2xs">
      
      {/* SECTION HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Historique des Interactions
            </h4>
            <p className="text-[11px] text-slate-500">
              {interactions.length} échange{interactions.length > 1 ? 's' : ''} consigné{interactions.length > 1 ? 's' : ''} avec ce prospect
            </p>
          </div>
        </div>

        {!isAdding && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAppointmentModalOpen(true)}
              className="py-1.5 px-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs flex items-center gap-1.5 border border-purple-200 transition cursor-pointer"
              title="Planifier un rendez-vous et générer un événement calendrier"
            >
              <CalendarPlus className="w-3.5 h-3.5 text-purple-600" />
              <span>Planifier RDV</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter une interaction</span>
            </button>
          </div>
        )}
      </div>

      {/* ADD INTERACTION FORM */}
      {isAdding && (
        <form 
          onSubmit={handleAdd}
          className="p-4 rounded-xl bg-slate-50 border border-indigo-100 flex flex-col gap-3 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Consigner un nouvel échange
            </span>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick presets buttons */}
          <div className="flex flex-wrap gap-1.5">
            {quickPresets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setType(preset.type);
                  setTitle(preset.label.replace(/^.*? /, ''));
                }}
                className="px-2.5 py-1 rounded-lg text-[11px] bg-white hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 border border-slate-200 font-medium transition cursor-pointer"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Type selector & Date input */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Type de contact
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as LeadInteraction['type'])}
                className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="call">📞 Appel téléphonique</option>
                <option value="meeting">🤝 Rendez-vous / Visioconférence</option>
                <option value="email">✉️ Email envoyé / reçu</option>
                <option value="whatsapp">💬 WhatsApp / Messagerie</option>
                <option value="event">🎪 Rencontre Salon / Événement</option>
                <option value="note">📝 Note de suivi interne</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Date & Heure de l'interaction
              </label>
              <input
                type="datetime-local"
                value={interactionDate}
                onChange={(e) => setInteractionDate(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Titre / Objet du contact
            </label>
            <input
              type="text"
              placeholder="Ex : Débrief proposition budgétaire, retour sur démo..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Notes textarea */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Compte-rendu ou points clés discutés *
            </label>
            <textarea
              rows={2}
              required
              placeholder="Résumé des échanges, objections levées, prochaines étapes convenues..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="py-1.5 px-3 rounded-lg text-slate-600 hover:bg-slate-200/60 text-xs font-semibold transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="py-1.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Enregistrer l'interaction</span>
            </button>
          </div>
        </form>
      )}

      {/* TIMELINE LIST */}
      {interactions.length > 0 ? (
        <div className="relative pl-5 border-l-2 border-slate-100 flex flex-col gap-4 my-1">
          {interactions.map((interaction) => {
            const badge = getTypeBadge(interaction.type);
            const intDate = new Date(interaction.date || interaction.createdAt);

            return (
              <div key={interaction.id} className="relative group flex flex-col gap-1">
                {/* Bullet point on timeline */}
                <div className="absolute -left-[27px] top-1 w-5 h-5 rounded-full bg-white border-2 border-indigo-500 flex items-center justify-center shadow-2xs">
                  {getTypeIcon(interaction.type)}
                </div>

                {/* Card header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badge.bg}`}>
                      {badge.label}
                    </span>
                    <h5 className="text-xs font-bold text-slate-800">
                      {interaction.title}
                    </h5>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {intDate.toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>

                    <button
                      onClick={() => handleDelete(interaction.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition rounded-md hover:bg-rose-50 cursor-pointer"
                      title="Supprimer cette note d'interaction"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Card Body / Notes */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {interaction.notes}
                </div>

                {/* Author footer */}
                {interaction.authorName && (
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 pl-1">
                    <User className="w-3 h-3 text-slate-400" />
                    <span>Consigné par <strong className="font-semibold text-slate-600">{interaction.authorName}</strong></span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-6 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center flex flex-col items-center justify-center gap-2">
          <Clock className="w-6 h-6 text-slate-300" />
          <p className="text-xs font-semibold text-slate-600">
            Aucune interaction consignée pour le moment
          </p>
          <p className="text-[11px] text-slate-400 max-w-xs">
            Gardez une trace de chaque appel téléphonique, rendez-vous ou échange par email pour un suivi commercial optimal.
          </p>
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="mt-1 py-1.5 px-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ajouter le premier échange</span>
          </button>
        </div>
      )}

      {/* APPOINTMENT SCHEDULER MODAL */}
      {isAppointmentModalOpen && (
        <ScheduleAppointmentModal
          lead={lead}
          isOpen={isAppointmentModalOpen}
          onClose={() => setIsAppointmentModalOpen(false)}
          onAppointmentScheduled={(updatedLead) => {
            if (onUpdateLead) {
              onUpdateLead(updatedLead);
            }
          }}
        />
      )}

    </div>
  );
};
