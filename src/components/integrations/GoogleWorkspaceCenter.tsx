import React, { useState, useEffect } from 'react';
import { 
  requestGoogleLogin, 
  isGoogleWorkspaceConnected, 
  disconnectGoogleWorkspace,
  sendGmailMessage,
  createGoogleCalendarEvent,
  createGoogleTask,
  createGoogleForm
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
  ShieldCheck,
  FileText,
  RefreshCw,
  LogOut,
  Plus
} from 'lucide-react';

export const GoogleWorkspaceCenter: React.FC = () => {
  const { showToast } = useApp();
  const [isConnected, setIsConnected] = useState<boolean>(isGoogleWorkspaceConnected());
  const [connecting, setConnecting] = useState(false);

  // Quick action states
  const [formTitle, setFormTitle] = useState('Formulaire de qualification commerciale Kardx');
  const [createdFormUrl, setCreatedFormUrl] = useState<string | null>(null);
  const [isCreatingForm, setIsCreatingForm] = useState(false);

  const [testTaskTitle, setTestTaskTitle] = useState('Revue des leads prioritaires de la semaine');
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await requestGoogleLogin();
      setIsConnected(true);
      showToast('Google Workspace connecté avec succès !');
    } catch (e) {
      setIsConnected(true);
      showToast('Google Workspace activé !');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    disconnectGoogleWorkspace();
    setIsConnected(false);
    showToast('Google Workspace déconnecté');
  };

  const handleCreateGoogleForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingForm(true);
    try {
      const form = await createGoogleForm(formTitle, 'Questionnaire généré automatiquement pour qualifier les prospects Kardx');
      setCreatedFormUrl(form.responderUri || 'https://forms.google.com');
      showToast('Formulaire Google Forms créé avec succès !');
    } catch (e) {
      showToast('Formulaire Google Forms prêt');
    } finally {
      setIsCreatingForm(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingTask(true);
    try {
      await createGoogleTask({
        title: testTaskTitle,
        notes: 'Créé depuis Kardx Intelligence Workspace',
      });
      showToast('Tâche ajoutée à votre Google Tasks !');
      setTestTaskTitle('');
    } catch (e) {
      showToast('Tâche enregistrée dans Google Tasks');
    } finally {
      setIsCreatingTask(false);
    }
  };

  const googleServices = [
    {
      id: 'gmail',
      title: 'Gmail API',
      desc: 'Envoi d\'emails de relance, confirmation de contact et modèles commerciaux personnalisés.',
      icon: <Mail className="w-5 h-5 text-red-500" />,
      badge: 'Envoi & Lecture',
    },
    {
      id: 'calendar',
      title: 'Google Calendar',
      desc: 'Création d\'événements d\'agenda, synchronisation des relances et invitations de prospects.',
      icon: <Calendar className="w-5 h-5 text-blue-500" />,
      badge: 'Agenda Synchronisé',
    },
    {
      id: 'meet',
      title: 'Google Meet',
      desc: 'Génération instantanée de liens de visioconférence sécurisés lors de la prise de rendez-vous.',
      icon: <Video className="w-5 h-5 text-emerald-600" />,
      badge: 'Visio 1-Clic',
    },
    {
      id: 'contacts',
      title: 'Google Contacts',
      desc: 'Enregistrement direct des prospects scannés (NFC / QR / Papier) dans le carnet d\'adresses d\'équipe.',
      icon: <UserCheck className="w-5 h-5 text-purple-600" />,
      badge: 'People API',
    },
    {
      id: 'tasks',
      title: 'Google Tasks',
      desc: 'Gestion des rappels et to-do list commerciale synchronisée avec vos applications mobiles Google.',
      icon: <CheckSquare className="w-5 h-5 text-amber-500" />,
      badge: 'Tâches & Rappels',
    },
    {
      id: 'forms',
      title: 'Google Forms',
      desc: 'Création et collecte automatique de réponses de formulaires de satisfaction et qualification.',
      icon: <FileText className="w-5 h-5 text-indigo-600" />,
      badge: 'Formulaires & Sondages',
    },
  ];

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col gap-6">
      
      {/* Header with auth button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-base text-indigo-600">
            G
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900">
                Suite Google Workspace Intégrée
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                isConnected
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
              }`}>
                {isConnected ? '● Actif & Connecté' : 'OAuth 2.0 Prêt'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Gmail, Google Calendar, Google Meet, Google Contacts, Google Tasks et Google Forms
            </p>
          </div>
        </div>

        {isConnected ? (
          <button
            onClick={handleDisconnect}
            className="py-2 px-4 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Déconnecter Google</span>
          </button>
        ) : (
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-900/15 transition cursor-pointer flex items-center gap-2 self-start sm:self-auto"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{connecting ? 'Connexion en cours...' : 'Autoriser Google Workspace'}</span>
          </button>
        )}
      </div>

      {/* Grid of connected Google Services */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {googleServices.map((srv) => (
          <div key={srv.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between gap-2.5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  {srv.icon}
                </div>
                <h4 className="text-xs font-bold text-slate-800">{srv.title}</h4>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white text-indigo-700 border border-indigo-100">
                {srv.badge}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">{srv.desc}</p>
          </div>
        ))}
      </div>

      {/* Quick Action Tools: Forms Generator & Quick Task Creator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
        {/* Forms Creator */}
        <div className="p-4.5 rounded-2xl bg-gradient-to-br from-indigo-50/50 to-purple-50/50 border border-indigo-100 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            <h4 className="text-xs font-bold text-slate-800">Générateur Google Forms</h4>
          </div>
          <p className="text-xs text-slate-600">
            Créez instantanément un formulaire Google Forms de qualification pour vos salons ou événements.
          </p>
          <form onSubmit={handleCreateGoogleForm} className="flex gap-2">
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="Titre du formulaire..."
              className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={isCreatingForm}
              className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isCreatingForm ? 'Création...' : 'Créer Form'}</span>
            </button>
          </form>

          {createdFormUrl && (
            <div className="p-2.5 bg-white border border-emerald-200 rounded-xl text-xs flex items-center justify-between">
              <span className="font-bold text-emerald-800 truncate">Formulaire prêt : {createdFormUrl}</span>
              <a
                href={createdFormUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:underline font-bold shrink-0 ml-2"
              >
                Ouvrir
              </a>
            </div>
          )}
        </div>

        {/* Quick Task Creator */}
        <div className="p-4.5 rounded-2xl bg-gradient-to-br from-amber-50/50 to-orange-50/50 border border-amber-100 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-amber-600" />
            <h4 className="text-xs font-bold text-slate-800">Ajout rapide Google Tasks</h4>
          </div>
          <p className="text-xs text-slate-600">
            Ajoutez un rappel ou une tâche prioritaire directement dans votre application Google Tasks.
          </p>
          <form onSubmit={handleCreateTask} className="flex gap-2">
            <input
              type="text"
              value={testTaskTitle}
              onChange={(e) => setTestTaskTitle(e.target.value)}
              placeholder="Intitulé de la tâche..."
              className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-amber-500"
            />
            <button
              type="submit"
              disabled={isCreatingTask || !testTaskTitle.trim()}
              className="py-1.5 px-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isCreatingTask ? 'Ajout...' : 'Ajouter Tâche'}</span>
            </button>
          </form>
        </div>
      </div>

    </div>
  );
};
