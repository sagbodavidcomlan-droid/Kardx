import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PublicProfileView } from './PublicProfileView';
import { ImageUploadModal, ImageUploadType } from '../common/ImageUploadModal';
import { 
  User, 
  Building, 
  Briefcase, 
  Phone, 
  Mail, 
  MessageSquare, 
  Globe, 
  MapPin, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Eye, 
  EyeOff, 
  Check, 
  Save, 
  Sparkles, 
  Layers, 
  FileText, 
  Share2, 
  Calendar, 
  Star, 
  Palette,
  ExternalLink,
  ShieldCheck,
  Camera,
  Upload,
  Image as ImageIcon,
  Building2,
  Smartphone
} from 'lucide-react';

export const ProfileEditor: React.FC = () => {
  const { 
    activeProfile, 
    updateProfile, 
    updateTheme,
    addBlock, 
    updateBlock, 
    deleteBlock, 
    reorderBlocks,
    setActiveTab, 
    showToast 
  } = useApp();

  const [activeSection, setActiveSection] = useState<'identity' | 'media' | 'contacts' | 'socials' | 'blocks'>('identity');
  const [newSocialPlatform, setNewSocialPlatform] = useState<string>('linkedin');
  const [newSocialUrl, setNewSocialUrl] = useState<string>('');

  // Image Upload Modal States
  const [imageModalType, setImageModalType] = useState<ImageUploadType | null>(null);

  const handleOpenImageModal = (type: ImageUploadType) => {
    setImageModalType(type);
  };

  const handleSaveImage = (newUrl: string) => {
    if (!imageModalType) return;

    if (imageModalType === 'avatar') {
      updateProfile({ avatarUrl: newUrl });
      showToast('Photo de profil mise à jour avec succès');
    } else if (imageModalType === 'cover') {
      updateTheme({ coverImageUrl: newUrl });
      showToast('Bannière de profil mise à jour avec succès');
    } else if (imageModalType === 'logo') {
      updateProfile({ logoUrl: newUrl });
      showToast('Logo d\'entreprise mis à jour avec succès');
    }
  };

  const handleAddSocial = () => {
    if (!newSocialUrl.trim()) return;
    const newSocial = {
      id: `s_${Date.now()}`,
      platform: newSocialPlatform as any,
      url: newSocialUrl.trim(),
      label: newSocialPlatform.toUpperCase(),
      clicks: 0,
    };
    updateProfile({
      socials: [...activeProfile.socials, newSocial],
    });
    setNewSocialUrl('');
    showToast('Réseau social ajouté');
  };

  const handleRemoveSocial = (id: string) => {
    updateProfile({
      socials: activeProfile.socials.filter((s) => s.id !== id),
    });
    showToast('Lien supprimé');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-slate-800">
      
      {/* HEADER & PREVIEW BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
              Éditeur de Profil Digital
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              URL : /p/{activeProfile.slug}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Personnalisez vos photos, bannières, coordonnées et blocs de contenu. Tout est synchronisé en temps réel sur vos cartes NFC et QR Codes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('design')}
            className="py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 shadow-sm flex items-center gap-2 transition"
          >
            <Palette className="w-4 h-4 text-indigo-600" />
            <span>Thème & Couleurs</span>
          </button>
        </div>
      </div>

      {/* SPLIT SCREEN : EDITOR (Left 7 cols) & LIVE MOBILE PREVIEW (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: EDIT FORM */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Section Navigation Tabs */}
          <div className="flex items-center p-1.5 rounded-2xl bg-white border border-slate-200 shadow-sm overflow-x-auto gap-1">
            <button
              onClick={() => setActiveSection('identity')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                activeSection === 'identity'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              1. Identité & Visuels
            </button>
            <button
              onClick={() => setActiveSection('contacts')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                activeSection === 'contacts'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              2. Coordonnées & Liens
            </button>
            <button
              onClick={() => setActiveSection('socials')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                activeSection === 'socials'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              3. Réseaux ({activeProfile.socials.length})
            </button>
            <button
              onClick={() => setActiveSection('blocks')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                activeSection === 'blocks'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              4. Blocs ({activeProfile.blocks.length})
            </button>
          </div>

          {/* SECTION 1: IDENTITY & VISUALS */}
          {activeSection === 'identity' && (
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col gap-6">
              
              {/* TOP VISUALS STUDIO: BANNER & AVATAR & LOGO */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                      <Camera className="w-5 h-5 text-indigo-600" />
                      <span>Visuels & Photos du Profil</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Bannière mobile, photo de profil et logo officiel d'entreprise.
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg">
                    Suggestions & Upload
                  </span>
                </div>

                {/* 1. BANNER / COVER IMAGE PICKER BOX */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-indigo-600" />
                      <span className="text-xs font-bold text-slate-800">
                        Bannière au-dessus du profil (Version Mobile & Carte)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenImageModal('cover')}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-white hover:bg-indigo-50/50 border border-indigo-200 px-3 py-1.5 rounded-xl shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Changer la bannière...</span>
                    </button>
                  </div>

                  {/* Banner Preview Strip */}
                  <div 
                    onClick={() => handleOpenImageModal('cover')}
                    className="group relative h-28 w-full rounded-xl overflow-hidden border border-slate-200 shadow-inner cursor-pointer"
                  >
                    {activeProfile.theme.coverImageUrl ? (
                      <img
                        src={activeProfile.theme.coverImageUrl}
                        alt="Bannière profil"
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-white text-xs font-semibold"
                        style={{
                          background: `linear-gradient(135deg, ${activeProfile.theme.primaryColor || '#1e3a8a'}, ${activeProfile.theme.secondaryColor || '#d97706'})`,
                        }}
                      >
                        Dégradé par défaut de l'entreprise
                      </div>
                    )}

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-bold backdrop-blur-2xs">
                      <Upload className="w-4 h-4" />
                      <span>Modifier la photo de couverture (Suggestions ou Upload)</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500">
                    💡 Choisissez parmi nos suggestions classées par thématique (Corporate, Tech, Luxe, Nature) ou importez votre propre photo depuis votre appareil ou par URL.
                  </p>
                </div>

                {/* 2. AVATAR & LOGO DUAL GRID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Photo de profil (Portrait) */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Photo de Profil (Portrait)</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div 
                        onClick={() => handleOpenImageModal('avatar')}
                        className="relative w-16 h-16 rounded-full overflow-hidden ring-2 ring-indigo-500 shadow-md cursor-pointer group shrink-0"
                      >
                        <img
                          src={activeProfile.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&h=400&q=80'}
                          alt="Avatar"
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                          <Camera className="w-4 h-4" />
                        </div>
                      </div>

                      <div className="flex-1 space-y-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenImageModal('avatar')}
                          className="w-full py-2 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <Camera className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Changer la photo...</span>
                        </button>
                        <p className="text-[10px] text-slate-400">
                          Portraits pro suggérés ou upload perso
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Logo Entreprise */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Logo de l'Organisation</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div 
                        onClick={() => handleOpenImageModal('logo')}
                        className="relative w-16 h-16 rounded-2xl bg-white p-2 border border-slate-200 shadow-sm cursor-pointer group flex items-center justify-center shrink-0"
                      >
                        {activeProfile.logoUrl ? (
                          <img
                            src={activeProfile.logoUrl}
                            alt="Logo"
                            className="max-w-full max-h-full object-contain group-hover:scale-105 transition"
                          />
                        ) : (
                          <Building2 className="w-7 h-7 text-slate-400" />
                        )}
                        <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                          <Upload className="w-4 h-4" />
                        </div>
                      </div>

                      <div className="flex-1 space-y-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenImageModal('logo')}
                          className="w-full py-2 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{activeProfile.logoUrl ? 'Modifier le logo...' : 'Ajouter un logo...'}</span>
                        </button>
                        <p className="text-[10px] text-slate-400">
                          PNG transparent ou SVG conseillé
                        </p>
                      </div>
                    </div>
                  </div>

                </div>

              </div>

              {/* TEXTUAL IDENTITY FIELDS */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                  Informations Générales
                </h4>

                {/* First name & Last name */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Prénom</label>
                    <input
                      type="text"
                      value={activeProfile.firstName}
                      onChange={(e) => updateProfile({ firstName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nom</label>
                    <input
                      type="text"
                      value={activeProfile.lastName}
                      onChange={(e) => updateProfile({ lastName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Headline / Job Title */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fonction / Titre professionnel
                  </label>
                  <input
                    type="text"
                    value={activeProfile.headline}
                    onChange={(e) => updateProfile({ headline: e.target.value })}
                    placeholder="Ex : Directeur Commercial & Partenariats"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Company & Department */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Entreprise</label>
                    <input
                      type="text"
                      value={activeProfile.company}
                      onChange={(e) => updateProfile({ company: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Département / Division</label>
                    <input
                      type="text"
                      value={activeProfile.department || ''}
                      onChange={(e) => updateProfile({ department: e.target.value })}
                      placeholder="Ex : Direction Commerciale"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Biographie / Présentation courte
                  </label>
                  <textarea
                    rows={3}
                    value={activeProfile.bio}
                    onChange={(e) => updateProfile({ bio: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>

                {/* Verified badge & Public CTA Label */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={activeProfile.badgeVerified}
                      onChange={(e) => updateProfile({ badgeVerified: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-semibold text-slate-700">Badge Vérifié Certifié</span>
                  </label>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Texte du bouton CTA principal</label>
                    <input
                      type="text"
                      value={activeProfile.exchangeCtaLabel || 'Échanger nos coordonnées'}
                      onChange={(e) => updateProfile({ exchangeCtaLabel: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* SECTION 2: CONTACTS */}
          {activeSection === 'contacts' && (
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col gap-5">
              <h3 className="font-bold text-base text-slate-800 border-b border-slate-100 pb-3">
                Coordonnées Directes & Liens d'Action
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Téléphone Mobile</label>
                  <input
                    type="tel"
                    value={activeProfile.contacts.mobile || ''}
                    onChange={(e) => updateProfile({ contacts: { ...activeProfile.contacts, mobile: e.target.value } })}
                    placeholder="+33 6 12 34 56 78"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Numéro WhatsApp</label>
                  <input
                    type="tel"
                    value={activeProfile.contacts.whatsapp || ''}
                    onChange={(e) => updateProfile({ contacts: { ...activeProfile.contacts, whatsapp: e.target.value } })}
                    placeholder="+33612345678"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Principal</label>
                  <input
                    type="email"
                    value={activeProfile.contacts.email}
                    onChange={(e) => updateProfile({ contacts: { ...activeProfile.contacts, email: e.target.value } })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Site Web</label>
                  <input
                    type="url"
                    value={activeProfile.contacts.website || ''}
                    onChange={(e) => updateProfile({ contacts: { ...activeProfile.contacts, website: e.target.value } })}
                    placeholder="https://mon-entreprise.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 focus:bg-white"
                  />
                </div>
              </div>

              {/* Calendly Booking Link */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lien de réservation Calendly / SavvyCal
                </label>
                <input
                  type="url"
                  value={activeProfile.contacts.bookingUrl || ''}
                  onChange={(e) => updateProfile({ contacts: { ...activeProfile.contacts, bookingUrl: e.target.value } })}
                  placeholder="https://calendly.com/votre-nom/30min"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 focus:bg-white"
                />
              </div>

              {/* Address */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ville & Code Postal</label>
                  <input
                    type="text"
                    value={activeProfile.contacts.address?.city || ''}
                    onChange={(e) => updateProfile({
                      contacts: {
                        ...activeProfile.contacts,
                        address: { ...activeProfile.contacts.address, city: e.target.value }
                      }
                    })}
                    placeholder="Paris La Défense (92400)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pays</label>
                  <input
                    type="text"
                    value={activeProfile.contacts.address?.country || 'France'}
                    onChange={(e) => updateProfile({
                      contacts: {
                        ...activeProfile.contacts,
                        address: { ...activeProfile.contacts.address, country: e.target.value }
                      }
                    })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 focus:bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: SOCIALS */}
          {activeSection === 'socials' && (
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col gap-5">
              <h3 className="font-bold text-base text-slate-800 border-b border-slate-100 pb-3">
                Réseaux Sociaux & Liens Externes
              </h3>

              {/* Add social bar */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row gap-2.5">
                <select
                  value={newSocialPlatform}
                  onChange={(e) => setNewSocialPlatform(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 font-semibold focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="linkedin">LinkedIn</option>
                  <option value="twitter">X (Twitter)</option>
                  <option value="whatsapp">WhatsApp Direct</option>
                  <option value="github">GitHub</option>
                  <option value="youtube">YouTube</option>
                  <option value="instagram">Instagram</option>
                  <option value="tiktok">TikTok</option>
                  <option value="telegram">Telegram</option>
                  <option value="custom">Autre lien web</option>
                </select>

                <input
                  type="url"
                  placeholder="https://..."
                  value={newSocialUrl}
                  onChange={(e) => setNewSocialUrl(e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />

                <button
                  onClick={handleAddSocial}
                  className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shrink-0 cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajouter</span>
                </button>
              </div>

              {/* Existing socials list */}
              <div className="flex flex-col divide-y divide-slate-100">
                {activeProfile.socials.map((social) => (
                  <div key={social.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs font-bold uppercase shrink-0 border border-indigo-100">
                        {social.platform[0]}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 capitalize">{social.platform}</p>
                        <p className="text-[11px] text-slate-500 truncate">{social.url}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveSocial(social.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      title="Supprimer le lien"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 4: BLOCKS */}
          {activeSection === 'blocks' && (
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-base text-slate-800">Blocs de Contenu Enrichi</h3>
                  <p className="text-xs text-slate-500">Ajoutez, réorganisez ou masquez les sections de votre profil</p>
                </div>

                {/* Add block dropdown buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => addBlock('services')}
                    className="py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1 transition shadow-sm cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Service</span>
                  </button>
                  <button
                    onClick={() => addBlock('documents')}
                    className="py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Document</span>
                  </button>
                </div>
              </div>

              {/* Blocks list with reordering */}
              <div className="flex flex-col gap-3">
                {activeProfile.blocks.map((block, idx) => (
                  <div
                    key={block.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-white border border-slate-200 text-indigo-600 text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={block.title || ''}
                          onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                          placeholder="Titre du bloc..."
                          className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-800"
                        />
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          Type: {block.type}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Move Up */}
                        <button
                          disabled={idx === 0}
                          onClick={() => reorderBlocks(idx, idx - 1)}
                          className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-800 disabled:opacity-30 transition cursor-pointer"
                          title="Monter"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        {/* Move Down */}
                        <button
                          disabled={idx === activeProfile.blocks.length - 1}
                          onClick={() => reorderBlocks(idx, idx + 1)}
                          className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-800 disabled:opacity-30 transition cursor-pointer"
                          title="Descendre"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        {/* Toggle visibility */}
                        <button
                          onClick={() => updateBlock(block.id, { visible: !block.visible })}
                          className={`p-1.5 rounded-lg border transition cursor-pointer ${
                            block.visible ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-slate-400 border-slate-200'
                          }`}
                          title={block.visible ? 'Visible' : 'Masqué'}
                        >
                          {block.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>
                        {/* Delete block */}
                        <button
                          onClick={() => deleteBlock(block.id)}
                          className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                          title="Supprimer ce bloc"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Block Content Editor depending on type */}
                    {block.type === 'about' && (
                      <textarea
                        rows={2}
                        value={block.payload.text || ''}
                        onChange={(e) => updateBlock(block.id, { payload: { ...block.payload, text: e.target.value } })}
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800"
                      />
                    )}

                    {block.type === 'services' && (
                      <div className="flex flex-col gap-2">
                        {block.payload.services?.map((srv, srvIdx) => (
                          <div key={srv.id} className="p-3 rounded-xl bg-white border border-slate-200 grid grid-cols-2 gap-2 text-xs">
                            <input
                              type="text"
                              value={srv.title}
                              onChange={(e) => {
                                const newServices = [...(block.payload.services || [])];
                                newServices[srvIdx] = { ...srv, title: e.target.value };
                                updateBlock(block.id, { payload: { ...block.payload, services: newServices } });
                              }}
                              placeholder="Titre prestation"
                              className="px-2.5 py-1.5 rounded bg-slate-50 border border-slate-200 text-slate-800 font-bold"
                            />
                            <input
                              type="text"
                              value={srv.price || ''}
                              onChange={(e) => {
                                const newServices = [...(block.payload.services || [])];
                                newServices[srvIdx] = { ...srv, price: e.target.value };
                                updateBlock(block.id, { payload: { ...block.payload, services: newServices } });
                              }}
                              placeholder="Tarif (ex: 2 500 €)"
                              className="px-2.5 py-1.5 rounded bg-slate-50 border border-slate-200 text-slate-800"
                            />
                            <textarea
                              rows={2}
                              value={srv.description}
                              onChange={(e) => {
                                const newServices = [...(block.payload.services || [])];
                                newServices[srvIdx] = { ...srv, description: e.target.value };
                                updateBlock(block.id, { payload: { ...block.payload, services: newServices } });
                              }}
                              className="col-span-2 px-2.5 py-1.5 rounded bg-slate-50 border border-slate-200 text-slate-800 text-[11px]"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: INTERACTIVE LIVE MOBILE PHONE PREVIEW */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="sticky top-20 flex flex-col items-center w-full">
            <div className="flex items-center justify-between w-full max-w-sm mb-3 px-1">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Aperçu Smartphone Live
              </span>
              <span className="text-[11px] text-slate-400">Mise à jour instantanée</span>
            </div>

            {/* Device Shell Frame */}
            <div className="w-full max-w-sm rounded-[40px] p-3 bg-slate-900 border-4 border-slate-800 shadow-2xl overflow-hidden relative">
              {/* Notch */}
              <div className="absolute top-4 inset-x-0 mx-auto w-28 h-4 rounded-full bg-black z-30 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-slate-900 border border-slate-800"></div>
              </div>

              {/* Scrollable screen viewport */}
              <div className="rounded-[30px] overflow-hidden overflow-y-auto max-h-[640px] bg-white border border-slate-800 custom-scrollbar">
                <PublicProfileView isEmbeddedPreview={true} />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Image Upload / Suggestions / URL Modal */}
      {imageModalType && (
        <ImageUploadModal
          isOpen={!!imageModalType}
          onClose={() => setImageModalType(null)}
          type={imageModalType}
          currentValue={
            imageModalType === 'avatar'
              ? activeProfile.avatarUrl
              : imageModalType === 'cover'
              ? activeProfile.theme.coverImageUrl
              : activeProfile.logoUrl
          }
          onSave={handleSaveImage}
        />
      )}

    </div>
  );
};
