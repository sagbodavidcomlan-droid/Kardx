import React, { useState, useEffect } from 'react';
import { Lead, LeadTaskPriority, LeadTaskType } from '../../types';
import { 
  getNotificationPermission, 
  requestNotificationPermission, 
  triggerBrowserNotification, 
  isNotificationSupported,
  formatReminderTime,
  playNotificationChime
} from '../../utils/browserNotifications';
import { 
  Bell, 
  Clock, 
  Calendar, 
  Check, 
  X, 
  AlertCircle, 
  Sparkles, 
  Trash2, 
  CheckCircle2,
  Volume2,
  Building,
  User,
  ShieldAlert,
  Phone,
  Mail,
  Video,
  FileText,
  Flame,
  Zap
} from 'lucide-react';

interface ScheduleReminderModalProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
  onSaveReminder?: (leadId: string, reminderDate: string | undefined, reminderNote: string | undefined) => void;
  onSave?: (date: string | undefined, note: string | undefined) => void;
  onTriggerNotificationNow?: (lead: Lead) => void;
}

export const ScheduleReminderModal: React.FC<ScheduleReminderModalProps> = ({
  lead,
  isOpen,
  onClose,
  onSaveReminder,
  onSave,
}) => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('09:00');
  const [taskType, setTaskType] = useState<LeadTaskType>('call');
  const [taskPriority, setTaskPriority] = useState<LeadTaskPriority>('high');
  const [note, setNote] = useState<string>(lead.reminderNote || 'Relancer suite au contact carte de visite');
  const [quickPreset, setQuickPreset] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setPermission(getNotificationPermission());

      if (lead.reminderDate) {
        const dateObj = new Date(lead.reminderDate);
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        const hh = String(dateObj.getHours()).padStart(2, '0');
        const min = String(dateObj.getMinutes()).padStart(2, '0');
        
        setSelectedDate(`${yyyy}-${mm}-${dd}`);
        setSelectedTime(`${hh}:${min}`);
        setNote(lead.reminderNote || '');
      } else {
        // Default to tomorrow 09:00
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const yyyy = tomorrow.getFullYear();
        const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const dd = String(tomorrow.getDate()).padStart(2, '0');
        setSelectedDate(`${yyyy}-${mm}-${dd}`);
        setSelectedTime('09:00');
        setNote('Relancer pour faire le point sur le projet');
      }
    }
  }, [isOpen, lead]);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const res = await requestNotificationPermission();
    setPermission(res);
    if (res === 'granted') {
      playNotificationChime();
      triggerBrowserNotification({
        title: '✅ Notifications activées sur KardX',
        body: 'Vous recevrez désormais des rappels automatiques pour recontacter vos prospects.',
      });
    }
  };

  const handleApplyPreset = (minutesOffset: number, presetLabel: string, defaultHour?: number) => {
    setQuickPreset(presetLabel);
    const target = new Date();
    
    if (defaultHour !== undefined) {
      // Set to tomorrow at specific hour
      target.setDate(target.getDate() + 1);
      target.setHours(defaultHour, 0, 0, 0);
    } else {
      target.setMinutes(target.getMinutes() + minutesOffset);
    }

    const yyyy = target.getFullYear();
    const mm = String(target.getMonth() + 1).padStart(2, '0');
    const dd = String(target.getDate()).padStart(2, '0');
    const hh = String(target.getHours()).padStart(2, '0');
    const min = String(target.getMinutes()).padStart(2, '0');

    setSelectedDate(`${yyyy}-${mm}-${dd}`);
    setSelectedTime(`${hh}:${min}`);
  };

  const handleTestNotification = async () => {
    let currentPerm = permission;
    if (currentPerm !== 'granted') {
      currentPerm = await requestNotificationPermission();
      setPermission(currentPerm);
    }

    playNotificationChime();
    triggerBrowserNotification({
      title: `🔔 Rappel prospect : ${lead.firstName} ${lead.lastName}`,
      body: note || `Relance commerciale prévue pour ${lead.company || lead.firstName}`,
      data: { leadId: lead.id },
    });
  };

  const handleSave = async () => {
    if (!selectedDate || !selectedTime) return;

    if (permission === 'default') {
      const res = await requestNotificationPermission();
      setPermission(res);
    }

    const [year, month, day] = selectedDate.split('-').map(Number);
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const scheduledDate = new Date(year, month - 1, day, hours, minutes, 0);
    const scheduledIso = scheduledDate.toISOString();
    const scheduledNote = note.trim();

    if (typeof onSaveReminder === 'function') {
      onSaveReminder(lead.id, scheduledIso, scheduledNote);
    }
    if (typeof onSave === 'function') {
      onSave(scheduledIso, scheduledNote);
    }
    onClose();
  };

  const handleRemoveReminder = () => {
    if (typeof onSaveReminder === 'function') {
      onSaveReminder(lead.id, undefined, undefined);
    }
    if (typeof onSave === 'function') {
      onSave(undefined, undefined);
    }
    onClose();
  };

  const quickChips = [
    'Relance pour proposition / devis',
    'Point téléphonique de cadrage',
    'Vérifier signature du contrat',
    'Envoi documentation & tarifs',
    'Suivi après salon / événement',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* MODAL HEADER */}
        <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Planifier une tâche de relance
              </h3>
              <p className="text-xs text-slate-500">
                {lead.firstName} {lead.lastName} {lead.company ? `• ${lead.company}` : ''}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL CONTENT */}
        <div className="p-5 sm:p-6 overflow-y-auto flex flex-col gap-4">
          
          {/* BROWSER PERMISSION BANNER */}
          {isNotificationSupported() && permission !== 'granted' && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 text-amber-800 font-medium">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Activez les notifications pour recevoir les alertes même navigateur réduit.</span>
              </div>
              <button
                type="button"
                onClick={handleRequestPermission}
                className="py-1.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shrink-0 transition cursor-pointer text-xs"
              >
                Autoriser
              </button>
            </div>
          )}

          {/* QUICK PRESETS */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Raccourcis de planification
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleApplyPreset(60, '1h')}
                className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition text-left flex items-center gap-2 cursor-pointer ${
                  quickPreset === '1h' 
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' 
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>Dans 1h</span>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset(0, 'tomorrow_09', 9)}
                className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition text-left flex items-center gap-2 cursor-pointer ${
                  quickPreset === 'tomorrow_09' 
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' 
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>Demain 09h</span>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset(2880, '2d')}
                className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition text-left flex items-center gap-2 cursor-pointer ${
                  quickPreset === '2d' 
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' 
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>Dans 2 jours</span>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset(10080, '1w')}
                className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition text-left flex items-center gap-2 cursor-pointer ${
                  quickPreset === '1w' 
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' 
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>Semaine pro</span>
              </button>
            </div>
          </div>

          {/* ACTION TYPE & PRIORITY */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Type de relance
              </label>
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value as LeadTaskType)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="call">📞 Appel téléphonique</option>
                <option value="email">✉️ Email / Message</option>
                <option value="meeting">📅 Rendez-vous / Visio</option>
                <option value="quote">💼 Devis / Offre</option>
                <option value="demo">🚀 Démonstration</option>
                <option value="followup">🔔 Suivi général</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Priorité
              </label>
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value as LeadTaskPriority)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="high">🔥 Haute / Urgente</option>
                <option value="medium">⚡ Normale</option>
                <option value="low">☕ Basse</option>
              </select>
            </div>
          </div>

          {/* DATE & TIME INPUTS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                Date du rappel *
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setQuickPreset('');
                }}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                Heure du rappel *
              </label>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => {
                  setSelectedTime(e.target.value);
                  setQuickPreset('');
                }}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* NOTE / REASON */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Objet ou instruction de relance
              </label>
              <button
                type="button"
                onClick={handleTestNotification}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Volume2 className="w-3 h-3" />
                <span>Tester le carillon</span>
              </button>
            </div>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex : Rappeler pour valider le cahier des charges et envoyer le devis..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 resize-none font-medium"
            />

            {/* Quick chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {quickChips.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setNote(chip)}
                  className="px-2.5 py-1 rounded-lg text-[11px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 transition font-medium cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* MODAL FOOTER */}
        <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3">
          {lead.reminderDate ? (
            <button
              type="button"
              onClick={handleRemoveReminder}
              className="py-2.5 px-3.5 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Supprimer le rappel</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl text-slate-600 hover:bg-slate-200/60 text-xs font-bold transition cursor-pointer"
            >
              Annuler
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold transition shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Enregistrer la relance</span>
          </button>
        </div>

      </div>
    </div>
  );
};
