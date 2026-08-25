import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Lead } from '../../types';
import { 
  Sparkles, 
  X, 
  MapPin, 
  Building, 
  Briefcase, 
  UserCheck, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  RefreshCw,
  Tag,
  Clock,
  Send
} from 'lucide-react';

interface RoutingSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLead?: Partial<Lead> | null;
}

export const RoutingSimulatorModal: React.FC<RoutingSimulatorModalProps> = ({
  isOpen,
  onClose,
  initialLead,
}) => {
  const { routingRules, users, testRoutingRule, createLead } = useApp();

  const [firstName, setFirstName] = useState(initialLead?.firstName || 'Jean-Philippe');
  const [lastName, setLastName] = useState(initialLead?.lastName || 'Benoît');
  const [email, setEmail] = useState(initialLead?.email || 'jp.benoit@healthtech-biotech.fr');
  const [company, setCompany] = useState(initialLead?.company || 'HealthTech Systems & Pharma');
  const [jobTitle, setJobTitle] = useState(initialLead?.jobTitle || 'Directeur Achats & Partenariats');
  const [city, setCity] = useState(initialLead?.city || 'Nantes');
  const [country, setCountry] = useState(initialLead?.country || 'France');
  const [notes, setNotes] = useState(
    initialLead?.notes || 'Rencontre salon Biotech. Souhaite équiper 35 commerciaux d\'ici le trimestre prochain.'
  );
  const [tagsInput, setTagsInput] = useState('Biotech, Santé, Salon');

  if (!isOpen) return null;

  const currentTags = tagsInput
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  const testLeadData: Partial<Lead> = {
    firstName,
    lastName,
    email,
    company,
    jobTitle,
    city,
    country,
    notes,
    tags: currentTags,
  };

  const testResult = testRoutingRule(testLeadData);

  const handleCreateSimulatedLead = async () => {
    await createLead({
      profileId: 'prof_david',
      firstName,
      lastName,
      email,
      company,
      jobTitle,
      city,
      country,
      notes,
      source: 'nfc',
      status: 'new',
      tags: currentTags,
      consentGiven: true,
      consentTimestamp: new Date().toISOString(),
    });
    onClose();
  };

  const handleLoadSample = (sampleType: 'pharma' | 'tech' | 'industrie' | 'afrique' | 'lyon') => {
    switch (sampleType) {
      case 'pharma':
        setFirstName('Camille');
        setLastName('Rousseau');
        setEmail('c.rousseau@doctolib-group.fr');
        setCompany('Doctolib Santé & Soins');
        setJobTitle('Directrice des Événements');
        setCity('Nantes');
        setCountry('France');
        setNotes('Rencontre NFC. Projet de digitalisation des équipes régionales.');
        setTagsInput('Santé, Médical, Salons');
        break;
      case 'tech':
        setFirstName('Julien');
        setLastName('Vasseur');
        setEmail('julien@saas-flow.io');
        setCompany('SaaS Flow Technologies');
        setJobTitle('CEO & Founder');
        setCity('Paris');
        setCountry('France');
        setNotes('Incubé à Station F. Cherche une solution de networking corporate.');
        setTagsInput('Tech, SaaS, Startup');
        break;
      case 'industrie':
        setFirstName('Thierry');
        setLastName('Garnier');
        setEmail('t.garnier@alstom-transport.com');
        setCompany('Alstom Ferroviaire & Mobilité');
        setJobTitle('Directeur Logistique & Achats');
        setCity('Saint-Ouen');
        setCountry('France');
        setNotes('Équipement de la flotte de directeurs de projets.');
        setTagsInput('Industrie, Transport, Ferroviaire');
        break;
      case 'afrique':
        setFirstName('Mamadou');
        setLastName('Touré');
        setEmail('m.toure@abidjan-capital.ci');
        setCompany('Abidjan Venture Capital & Finance');
        setJobTitle('Managing Partner');
        setCity('Abidjan');
        setCountry('Côte d\'Ivoire');
        setNotes('Fonds d\'investissement régional. Recherche partenariat de conseil.');
        setTagsInput('Investissement, Finance, Afrique');
        break;
      case 'lyon':
        setFirstName('Nathalie');
        setLastName('Dubois');
        setEmail('n.dubois@groupe-rhone.fr');
        setCompany('Cabinet Conseil Rhône-Alpes');
        setJobTitle('Partner RH');
        setCity('Lyon');
        setCountry('France');
        setNotes('Déploiement pour les consultants en région.');
        setTagsInput('Conseil, Régions');
        break;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Simulateur & Bac à Sable de Routage en Temps Réel
              </h2>
              <p className="text-xs text-slate-400">
                Testez vos règles de ciblage géographique et sectoriel sur des profils de prospects.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-h-[75vh] overflow-y-auto">
          
          {/* Left Column: Test Lead Form (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Quick Samples bar */}
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Charger un exemple de test rapide :</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleLoadSample('pharma')}
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 transition"
                >
                  🏥 Santé / Pharma
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadSample('tech')}
                  className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 transition"
                >
                  🚀 Tech & SaaS (Station F)
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadSample('industrie')}
                  className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold border border-amber-200 transition"
                >
                  🚆 Industrie (Alstom)
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadSample('afrique')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200 transition"
                >
                  🌍 Finance (Abidjan / Afrique)
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadSample('lyon')}
                  className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold border border-purple-200 transition"
                >
                  📍 Régions (Lyon)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Prénom
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Nom
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Entreprise / Société
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Ex: ACME Corp"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Fonction / Titre
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="Ex: Directeur Achats"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Ville
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ex: Paris, Lyon, Abidjan..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Pays
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Ex: France, Côte d'Ivoire..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Tags associés (séparés par virgules)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Ex: Tech, SaaS, Prioritaire"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Notes de rencontre / Contexte
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes de rendez-vous ou besoins exprimés..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Right Column: Live Routing Engine Verdict (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-indigo-600" />
              <span>Verdict du Moteur de Routage</span>
            </div>

            {testResult.matched && testResult.rule && testResult.targetUser ? (
              <div className="p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-300 space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Règle Correspondante Détectée !</span>
                </div>

                {/* Target Assigned User Card */}
                <div className="p-3.5 rounded-xl bg-white border border-emerald-200 shadow-xs flex items-center gap-3">
                  <img
                    src={testResult.targetUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                    alt={testResult.targetUser.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-emerald-400 shrink-0"
                  />
                  <div>
                    <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                      Attribution automatique à :
                    </div>
                    <div className="text-sm font-bold text-slate-900">
                      {testResult.targetUser.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {testResult.targetUser.email}
                    </div>
                  </div>
                </div>

                {/* Rule info */}
                <div className="text-xs space-y-2 text-slate-700 bg-white/80 p-3 rounded-xl border border-emerald-200/60">
                  <div>
                    <span className="font-bold text-slate-900 block">Règle activée :</span>
                    <span className="text-indigo-700 font-semibold">
                      #{testResult.rule.priority} - {testResult.rule.name}
                    </span>
                  </div>

                  {/* Matched Geo Keywords */}
                  {testResult.matchedKeywords.geographic.length > 0 && (
                    <div className="flex items-start gap-1.5 pt-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                      <div className="text-[11px]">
                        <span className="font-bold text-slate-800">Mots-clés Géo : </span>
                        <span className="text-rose-700 font-medium">
                          {testResult.matchedKeywords.geographic.join(', ')}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Matched Industry Keywords */}
                  {testResult.matchedKeywords.industry.length > 0 && (
                    <div className="flex items-start gap-1.5 pt-1">
                      <Building className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                      <div className="text-[11px]">
                        <span className="font-bold text-slate-800">Mots-clés Secteur : </span>
                        <span className="text-indigo-700 font-medium">
                          {testResult.matchedKeywords.industry.join(', ')}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Matched Job Title Keywords */}
                  {testResult.matchedKeywords.jobTitle.length > 0 && (
                    <div className="flex items-start gap-1.5 pt-1">
                      <Briefcase className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="text-[11px]">
                        <span className="font-bold text-slate-800">Mots-clés Fonction : </span>
                        <span className="text-emerald-700 font-medium">
                          {testResult.matchedKeywords.jobTitle.join(', ')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Auto Actions details */}
                <div className="p-3 bg-white/90 rounded-xl border border-emerald-200 text-xs space-y-1.5">
                  <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block">
                    Automatisations déclenchées :
                  </span>
                  {testResult.rule.autoTags && testResult.rule.autoTags.length > 0 && (
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Tag className="w-3.5 h-3.5 text-slate-400" />
                      <span>Tags : <b>{testResult.rule.autoTags.join(', ')}</b></span>
                    </div>
                  )}
                  {testResult.rule.autoReminderHours && (
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Rappel auto dans : <b>{testResult.rule.autoReminderHours}h</b></span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>Aucune règle ne correspond</span>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Ce prospect n'a déclenché aucun mot-clé géographique ou sectoriel parmi vos {routingRules.filter(r => r.active).length} règles actives.
                </p>
                <div className="p-3 bg-white rounded-xl border border-amber-200/80 text-xs text-slate-600">
                  Le prospect resterait <b>non assigné</b> ou assigné au propriétaire du profil scanné.
                </div>
              </div>
            )}

            {/* Test submission action */}
            <div className="mt-auto pt-4">
              <button
                type="button"
                onClick={handleCreateSimulatedLead}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Injecter ce prospect test dans le CRM</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {routingRules.filter((r) => r.active).length} règle(s) active(s) testée(s) par ordre de priorité.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
          >
            Fermer le simulateur
          </button>
        </div>
      </div>
    </div>
  );
};
