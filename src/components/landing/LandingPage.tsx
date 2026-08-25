import React from 'react';
import { useApp } from '../../context/AppContext';
import { PublicProfileView } from '../profile/PublicProfileView';
import { 
  Wifi, 
  QrCode, 
  Users, 
  TrendingUp, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  CreditCard, 
  Check, 
  Mail, 
  MessageSquare,
  Building2,
  ChevronRight
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { setActiveTab, setIsNfcSimModalOpen, activeProfile } = useApp();

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-800 flex flex-col">
      
      {/* HERO SECTION */}
      <section className="relative pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-6 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Plateforme Professionnelle NFC & QR Code de Nouvelle Génération</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-slate-900 tracking-tight max-w-4xl leading-[1.1]">
          Ne donnez plus une carte. <br />
          <span className="text-indigo-600">
            Créez une connexion mémorable.
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl font-normal leading-relaxed">
          KardX transforme vos rencontres professionnelles en opportunités commerciales qualifiées. Partagez votre identité en 1 seconde par simple contact NFC ou scan QR Code.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="py-3.5 px-7 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md shadow-indigo-900/20 flex items-center gap-2 transition active:scale-95 cursor-pointer"
          >
            <span>Accéder au Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsNfcSimModalOpen(true)}
            className="py-3.5 px-6 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm border border-slate-200 shadow-sm flex items-center gap-2 transition cursor-pointer"
          >
            <Wifi className="w-4 h-4 text-indigo-600 rotate-90" />
            <span>Tester la démo NFC interactive</span>
          </button>
        </div>

        {/* INTERACTIVE DEMO PHONE EMBED */}
        <div className="mt-16 w-full max-w-sm rounded-[40px] p-3 bg-slate-900 border-4 border-slate-800 shadow-2xl overflow-hidden relative">
          <div className="absolute top-4 inset-x-0 mx-auto w-28 h-4 rounded-full bg-black z-30 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-slate-800 border border-slate-700"></div>
          </div>
          <div className="rounded-[30px] overflow-hidden overflow-y-auto max-h-[580px] bg-slate-950 border border-slate-800 custom-scrollbar text-left">
            <PublicProfileView isEmbeddedPreview={true} />
          </div>
        </div>
      </section>

      {/* 4 CORE VALUE PILLARS */}
      <section className="py-20 bg-white border-y border-slate-200 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">
              Pourquoi les entreprises leaders abandonnent le papier
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              88% des cartes de visite en papier finissent à la poubelle en moins d'une semaine. KardX garantit la mémorisation et la conversion.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 shadow-xs flex flex-col gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <Wifi className="w-6 h-6 rotate-90" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Sans Contact NFC Immédiat</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Aucune application requise pour vos interlocuteurs. Approchez la carte d'un iPhone ou Android : votre profil s'ouvre instantanément.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 shadow-xs flex flex-col gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Capture de Leads</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Ne vous contentez pas de donner vos informations : recevez celles de votre interlocuteur dans votre boîte de réception CRM intégrée.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 shadow-xs flex flex-col gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Gestion d'Équipe Centralisée</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Déployez et modifiez les profils de 10 à 5 000 collaborateurs en quelques clics. Respect strict de la charte graphique d'entreprise.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 shadow-xs flex flex-col gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Analytics & ROI Mesurable</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Suivez en temps réel les vues, téléchargements VCF, prises de rendez-vous Calendly et messages WhatsApp générés par vos équipes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HARDWARE MATERIELS SHOWCASE */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">
            Des Matériaux Nobles & Durables
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Des cartes physiques premium gravées avec précision pour refléter l'excellence de votre marque.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="h-40 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 text-white">
                <CreditCard className="w-16 h-16 text-slate-300" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Métal Noir Mat & Gravure Laser</h3>
              <p className="text-xs text-slate-500 mt-1">Acier inoxydable avec finition matte et gravure laser haute précision.</p>
            </div>
          </div>

          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="h-40 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-4">
                <CreditCard className="w-16 h-16 text-amber-600" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Bois Bambou Écologique</h3>
              <p className="text-xs text-slate-500 mt-1">Bois véritable certifié FSC avec puce NFC invisible encapsulée.</p>
            </div>
          </div>

          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="h-40 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center mb-4">
                <QrCode className="w-16 h-16 text-indigo-600" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Chevalets & Stands Salons</h3>
              <p className="text-xs text-slate-500 mt-1">Stands NFC & QR pour comptoirs d'accueil, tables de réunion et salons.</p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING PLANS */}
      <section className="py-20 bg-white border-t border-slate-200 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">
              Des Tarifs Clairs et Sans Engagement
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Choisissez la formule adaptée à votre taille d'entreprise.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Free */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Indépendant</h3>
                <p className="text-xs text-slate-500">Pour consultants & solos</p>
                <div className="my-4">
                  <span className="text-3xl font-bold text-slate-800">0 €</span>
                  <span className="text-xs text-slate-500"> / mois</span>
                </div>
                <ul className="text-xs text-slate-600 flex flex-col gap-2.5 my-4">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> 1 Profil digital complet</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> QR Code standard</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Fiche contact .vcf</li>
                </ul>
              </div>
              <button
                onClick={() => setActiveTab('dashboard')}
                className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 shadow-xs transition cursor-pointer"
              >
                Démarrer
              </button>
            </div>

            {/* Business */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between relative shadow-xl text-white">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider">
                Recommandé
              </span>
              <div>
                <h3 className="font-bold text-white text-lg">Business Équipes</h3>
                <p className="text-xs text-slate-400">Pour PME & forces de vente</p>
                <div className="my-4">
                  <span className="text-3xl font-bold text-white">29 €</span>
                  <span className="text-xs text-slate-400"> / mois</span>
                </div>
                <ul className="text-xs text-slate-300 flex flex-col gap-2.5 my-4">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-400" /> Jusqu'à 25 collaborateurs</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-400" /> Mini-CRM & capture de prospects</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-400" /> Scanner IA de cartes papier</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-400" /> Apple & Google Wallet pass</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-400" /> Signatures email HTML</li>
                </ul>
              </div>
              <button
                onClick={() => setActiveTab('dashboard')}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition shadow-md shadow-indigo-900/40 cursor-pointer"
              >
                Essayer 14 jours
              </button>
            </div>

            {/* Enterprise */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Entreprise</h3>
                <p className="text-xs text-slate-500">Pour grands groupes & réseaux</p>
                <div className="my-4">
                  <span className="text-3xl font-bold text-slate-800">Sur devis</span>
                </div>
                <ul className="text-xs text-slate-600 flex flex-col gap-2.5 my-4">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Collaborateurs illimités</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> SSO SAML & SCIM Sync</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Domaine CNAME White-Label</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Intégration CRM sur-mesure</li>
                </ul>
              </div>
              <button
                onClick={() => setActiveTab('dashboard')}
                className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 shadow-xs transition cursor-pointer"
              >
                Contacter l'équipe
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 border-t border-slate-200 text-center text-xs text-slate-500 bg-[#F1F5F9]">
        <p>© 2026 KardX. Tous droits réservés. Conforme RGPD & Chiffrement de bout en bout.</p>
      </footer>

    </div>
  );
};
