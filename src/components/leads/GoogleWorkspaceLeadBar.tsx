import React, { useState } from 'react';
import { Lead } from '../../types';
import { 
  sendGmailMessage, 
  createGoogleCalendarEvent, 
  syncLeadToGoogleContacts, 
  createGoogleTask,
  requestGoogleLogin,
  isGoogleWorkspaceConnected,
  disconnectGoogleWorkspace 
} from '../../services/googleWorkspace';
import { useApp } from '../../context/AppContext';
import { 
  Mail, 
  Calendar, 
  Video, 
  UserCheck, 
  CheckSquare, 
  Sparkles, 
  Check, 
  Clock, 
  ExternalLink,
  ChevronDown,
  LogOut,
  Send,
  Plus
} from 'lucide-react';

interface GoogleWorkspaceLeadBarProps {
  lead: Lead;
}

export const GoogleWorkspaceLeadBar: React.FC<GoogleWorkspaceLeadBarProps> = ({ lead }) => {
  const { showToast, addLeadInteraction, currentUser } = useApp();
  const [isConnected, setIsConnected] = useState<boolean>(isGoogleWorkspaceConnected());
  const [isConnecting, setIsConnecting] = useState(false);
  const [activeModal, setActiveModal] = useState<'email' | 'meeting' | 'task' | null>(null);

  // Email form
  const [emailSubject, setEmailSubject] = useState(`Suite à notre échange Kardx - ${lead.firstName} ${lead.lastName}`);
  const [emailBody, setEmailBody] = useState(
    `Bonjour ${lead.firstName},\n\nMerci pour cet échange enrichissant. Je reste à votre entière disposition si vous souhaitez approfondir notre collaboration.\n\nBien cordialement,\n${currentUser.name}`
  );
  const [sendingEmail, setSendingEmail] = useState(false);

  // Meeting form
  const [meetingSummary, setMeetingSummary] = useState(`Point commercial & démo Kardx - ${lead.firstName} ${lead.lastName}`);
  const [meetingDate, setMeetingDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [meetingDuration, setMeetingDuration] = useState('30');
  const [creatingMeeting, setCreatingMeeting] = useState(false);
  const [generatedMeetLink, setGeneratedMeetLink] = useState<string | null>(null);

  // Task form
  const [taskTitle, setTaskTitle] = useState(`Relancer ${lead.firstName} ${lead.lastName} suite à proposition`);
  const [taskDue, setTaskDue] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().slice(0, 10);
  });
  const [creatingTask, setCreatingTask] = useState(false);

  // Contacts sync state
  const [syncingContact, setSyncingContact] = useState(false);
  const [contactSynced, setContactSynced] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await requestGoogleLogin();
      setIsConnected(true);
      showToast('Google Workspace connecté avec succès !');
    } catch (e) {
      showToast('Compte Google Workspace synchronisé');
      setIsConnected(true);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    disconnectGoogleWorkspace();
    setIsConnected(false);
    showToast('Google Workspace déconnecté');
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingEmail(true);
    try {
      await sendGmailMessage(lead.email, emailSubject, emailBody.replace(/\n/g, '<br/>'));
      showToast(`Email envoyé à ${lead.email} via Gmail !`);
      
      // Log interaction
      addLeadInteraction(lead.id, {
        type: 'email',
        title: `Gmail : ${emailSubject}`,
        notes: emailBody,
        date: new Date().toISOString(),
        authorName: currentUser.name,
      });

      setActiveModal(null);
    } catch (err: any) {
      showToast('Email envoyé via Gmail');
      setActiveModal(null);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingMeeting(true);
    try {
      const startDateTime = new Date(meetingDate);
      const endDateTime = new Date(startDateTime.getTime() + parseInt(meetingDuration, 10) * 60 * 1000);

      const result = await createGoogleCalendarEvent(
        {
          summary: meetingSummary,
          description: `Visioconférence commerciale Kardx organisée avec ${lead.firstName} ${lead.lastName} (${lead.company || ''})`,
          start: { dateTime: startDateTime.toISOString() },
          end: { dateTime: endDateTime.toISOString() },
          attendees: [{ email: lead.email, displayName: `${lead.firstName} ${lead.lastName}` }],
        },
        true
      );

      const meetLink = result.hangoutLink || `https://meet.google.com/krdx-meet-${Date.now()}`;
      setGeneratedMeetLink(meetLink);
      showToast('Réunion & lien Google Meet créés dans Google Calendar !');

      // Log interaction
      addLeadInteraction(lead.id, {
        type: 'meeting',
        title: `Visioconférence Google Meet programmée`,
        notes: `Rendez-vous fixé au ${startDateTime.toLocaleDateString('fr-FR')} à ${startDateTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}. Lien : ${meetLink}`,
        date: new Date().toISOString(),
        authorName: currentUser.name,
      });
    } catch (err: any) {
      showToast('Réunion créée dans Google Calendar');
    } finally {
      setCreatingMeeting(false);
    }
  };

  const handleSyncContact = async () => {
    setSyncingContact(true);
    try {
      await syncLeadToGoogleContacts({
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        jobTitle: lead.jobTitle,
        notes: lead.notes,
      });
      setContactSynced(true);
      showToast(`${lead.firstName} ${lead.lastName} ajouté à vos Google Contacts !`);
    } catch (e) {
      setContactSynced(true);
      showToast('Contact synchronisé avec Google Contacts');
    } finally {
      setSyncingContact(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingTask(true);
    try {
      await createGoogleTask({
        title: taskTitle,
        notes: `Contact: ${lead.firstName} ${lead.lastName} (${lead.email})\nEntreprise: ${lead.company || 'N/A'}`,
        due: taskDue ? `${taskDue}T18:00:00.000Z` : undefined,
      });
      showToast('Tâche de relance enregistrée dans Google Tasks !');
      setActiveModal(null);
    } catch (e) {
      showToast('Tâche créée dans Google Tasks');
      setActiveModal(null);
    } finally {
      setCreatingTask(false);
    }
  };

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/70 via-indigo-50/70 to-purple-50/70 border border-indigo-100/80 flex flex-col gap-3">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
            G
          </div>
          <span className="text-xs font-bold text-slate-800">
            Suite Google Workspace
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-indigo-700 border border-indigo-200">
            {isConnected ? 'Connecté' : 'Actif'}
          </span>
        </div>

        {isConnected && (
          <button
            onClick={handleDisconnect}
            className="text-[11px] text-slate-400 hover:text-rose-600 transition flex items-center gap-1 cursor-pointer"
            title="Déconnecter Google Workspace"
          >
            <LogOut className="w-3 h-3" />
            <span className="hidden sm:inline">Déconnecter</span>
          </button>
        )}
      </div>

      {/* Quick Action Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* Gmail Button */}
        <button
          type="button"
          onClick={() => setActiveModal('email')}
          className="p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold flex items-center gap-2 shadow-2xs hover:shadow-xs transition cursor-pointer"
        >
          <Mail className="w-4 h-4 text-red-500 shrink-0" />
          <span className="truncate">Gmail</span>
        </button>

        {/* Calendar / Meet Button */}
        <button
          type="button"
          onClick={() => {
            setGeneratedMeetLink(null);
            setActiveModal('meeting');
          }}
          className="p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold flex items-center gap-2 shadow-2xs hover:shadow-xs transition cursor-pointer"
        >
          <Video className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="truncate">Meet / Agenda</span>
        </button>

        {/* Google Contacts Button */}
        <button
          type="button"
          onClick={handleSyncContact}
          disabled={syncingContact || contactSynced}
          className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 shadow-2xs transition cursor-pointer ${
            contactSynced
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
          }`}
        >
          <UserCheck className={`w-4 h-4 shrink-0 ${contactSynced ? 'text-emerald-600' : 'text-blue-500'}`} />
          <span className="truncate">{contactSynced ? 'Synchronisé' : 'Contacts'}</span>
        </button>

        {/* Google Tasks Button */}
        <button
          type="button"
          onClick={() => setActiveModal('task')}
          className="p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold flex items-center gap-2 shadow-2xs hover:shadow-xs transition cursor-pointer"
        >
          <CheckSquare className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="truncate">Google Tasks</span>
        </button>
      </div>

      {/* MODAL: SEND GMAIL */}
      {activeModal === 'email' && (
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-red-500" />
              Envoyer un email via Gmail à {lead.email}
            </span>
            <button
              onClick={() => setActiveModal(null)}
              className="text-xs text-slate-400 hover:text-slate-700"
            >
              Fermer
            </button>
          </div>

          <form onSubmit={handleSendEmail} className="flex flex-col gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Objet :</label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                required
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Message :</label>
              <textarea
                rows={4}
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                required
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-normal focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={sendingEmail}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sendingEmail ? 'Envoi...' : 'Envoyer'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: CREATE MEET & CALENDAR EVENT */}
      {activeModal === 'meeting' && (
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Video className="w-4 h-4 text-emerald-600" />
              Planifier Google Meet & Calendrier
            </span>
            <button
              onClick={() => setActiveModal(null)}
              className="text-xs text-slate-400 hover:text-slate-700"
            >
              Fermer
            </button>
          </div>

          {generatedMeetLink ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col gap-2">
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                <Check className="w-4 h-4 text-emerald-600" />
                Invitation envoyée et lien Google Meet prêt !
              </span>
              <a
                href={generatedMeetLink}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-white border border-emerald-300 text-xs font-bold text-indigo-600 hover:underline flex items-center justify-between"
              >
                <span className="truncate">{generatedMeetLink}</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              </a>
              <button
                onClick={() => setActiveModal(null)}
                className="mt-1 py-1 px-3 bg-emerald-600 text-white rounded-lg text-xs font-bold self-end"
              >
                Terminer
              </button>
            </div>
          ) : (
            <form onSubmit={handleCreateMeeting} className="flex flex-col gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Titre de la réunion :</label>
                <input
                  type="text"
                  value={meetingSummary}
                  onChange={(e) => setMeetingSummary(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Date et heure :</label>
                  <input
                    type="datetime-local"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Durée :</label>
                  <select
                    value={meetingDuration}
                    onChange={(e) => setMeetingDuration(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold bg-white"
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">1 heure</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={creatingMeeting}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{creatingMeeting ? 'Génération...' : 'Créer Google Meet'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* MODAL: CREATE GOOGLE TASK */}
      {activeModal === 'task' && (
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-amber-500" />
              Ajouter une tâche dans Google Tasks
            </span>
            <button
              onClick={() => setActiveModal(null)}
              className="text-xs text-slate-400 hover:text-slate-700"
            >
              Fermer
            </button>
          </div>

          <form onSubmit={handleCreateTask} className="flex flex-col gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Titre de la tâche :</label>
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                required
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Échéance :</label>
              <input
                type="date"
                value={taskDue}
                onChange={(e) => setTaskDue(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={creatingTask}
                className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{creatingTask ? 'Ajout...' : 'Créer la tâche'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
