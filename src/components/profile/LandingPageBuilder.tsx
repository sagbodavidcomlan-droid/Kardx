import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Profile, 
  LandingPageConfig, 
  LandingHeroLayout, 
  LandingPitchBullet, 
  LandingTrustBadge 
} from '../../types';
import { 
  VANITY_DOMAINS, 
  HERO_LAYOUTS, 
  sanitizeVanitySlug, 
  getSlugSuggestions, 
  getDefaultLandingPageConfig, 
  computePublicLandingUrl 
} from '../../utils/landingPageDefaults';
import { generateQRCodeDataUrl, downloadHighResQRPng } from '../../utils/qr';
import { downloadVCard } from '../../utils/vcard';
import { 
  Globe, 
  Link2, 
  Copy, 
  Check, 
  ExternalLink, 
  Sparkles, 
  ShieldCheck, 
  Smartphone, 
  Laptop, 
  QrCode, 
  Download, 
  Share2, 
  Eye, 
  Zap, 
  Sliders, 
  Award, 
  Plus, 
  Trash2, 
  Calendar, 
  UserCheck, 
  FileText, 
  Layers, 
  Video, 
  MapPin, 
  MessageSquare, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  HelpCircle, 
  LayoutGrid, 
  Briefcase, 
  ArrowRight,
  RefreshCw,
  Phone,
  Mail,
  Building2,
  Lock,
  Flame,
  Send,
  Star
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface LandingPageBuilderProps {
  onPreviewPublic?: () => void;
}

export const LandingPageBuilder: React.FC<LandingPageBuilderProps> = ({ onPreviewPublic }) => {
  const { 
    activeProfile, 
    profiles, 
    currentOrg, 
    updateProfile, 
    showToast, 
    setPublicProfileSlug,
    setIsExchangeModalOpen,
    setExchangeSource
  } = useApp();

  // Initialize landing config from activeProfile or fallback defaults
  const [config, setConfig] = useState<LandingPageConfig>(() => {
    if (activeProfile.landingPage) {
      return {
        ...getDefaultLandingPageConfig(activeProfile, currentOrg),
        ...activeProfile.landingPage,
      };
    }
    return getDefaultLandingPageConfig(activeProfile, currentOrg);
  });

  // Builder sub-tabs
  const [activeBuilderSection, setActiveBuilderSection] = useState<'url_domain' | 'hero_layout' | 'sections_visibility' | 'seo_social'>('url_domain');

  // Preview device mode in right-hand column
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile');

  // Copied link feedback state
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbedCode, setCopiedEmbedCode] = useState(false);

  // QR Code preview data URL
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Vanity slug suggestions
  const slugSuggestions = useMemo(() => {
    return getSlugSuggestions(activeProfile, currentOrg);
  }, [activeProfile, currentOrg]);

  // Compute current public URL
  const publicUrl = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://kardx.io';
    return computePublicLandingUrl(config, origin);
  }, [config]);

  // Check slug availability (does any other profile already have this slug?)
  const isSlugAvailable = useMemo(() => {
    const slug = config.vanitySlug.trim().toLowerCase();
    if (!slug) return false;
    const conflicting = profiles.find((p) => p.id !== activeProfile.id && (p.slug.toLowerCase() === slug || p.landingPage?.vanitySlug?.toLowerCase() === slug));
    return !conflicting;
  }, [config.vanitySlug, profiles, activeProfile.id]);

  // Generate QR Code for this vanity URL
  useEffect(() => {
    if (publicUrl) {
      generateQRCodeDataUrl(publicUrl, {
        width: 400,
        margin: 1,
        color: {
          dark: activeProfile.theme.primaryColor || '#0f172a',
          light: '#ffffff',
        },
        enableGradient: true,
        gradientType: 'linear_diagonal',
        gradientStartColor: activeProfile.theme.primaryColor || '#1e3a8a',
        gradientEndColor: activeProfile.theme.accentColor || '#3b82f6',
        centerLogoUrl: activeProfile.logoUrl || currentOrg.logoUrl,
        logoShape: 'circle',
        logoSize: 'medium',
        errorCorrectionLevel: 'H',
      }).then((url) => {
        if (url) setQrCodeDataUrl(url);
      }).catch(() => {});
    }
  }, [publicUrl, activeProfile.theme, activeProfile.logoUrl, currentOrg.logoUrl]);

  // Handle Slug Change with auto-sanitization
  const handleSlugChange = (raw: string) => {
    const sanitized = sanitizeVanitySlug(raw);
    setConfig((prev) => ({ ...prev, vanitySlug: sanitized }));
  };

  // Apply a suggested slug
  const handleApplySuggestion = (s: string) => {
    setConfig((prev) => ({ ...prev, vanitySlug: s }));
    showToast(`Identifiant vanity "${s}" appliqué !`);
  };

  // Add Pitch Bullet
  const handleAddPitchBullet = () => {
    const newBullet: LandingPitchBullet = {
      id: `bullet_${Date.now()}`,
      icon: 'CheckCircle2',
      title: 'Nouvelle proposition de valeur',
      subtitle: 'Décrivez un point fort ou une compétence clé...',
    };
    setConfig((prev) => ({
      ...prev,
      pitchBullets: [...(prev.pitchBullets || []), newBullet],
    }));
  };

  // Remove Pitch Bullet
  const handleRemovePitchBullet = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      pitchBullets: (prev.pitchBullets || []).filter((b) => b.id !== id),
    }));
  };

  // Update Pitch Bullet
  const handleUpdatePitchBullet = (id: string, updates: Partial<LandingPitchBullet>) => {
    setConfig((prev) => ({
      ...prev,
      pitchBullets: (prev.pitchBullets || []).map((b) => (b.id === id ? { ...b, ...updates } : b)),
    }));
  };

  // Add Trust Badge
  const handleAddTrustBadge = () => {
    const newBadge: LandingTrustBadge = {
      id: `badge_${Date.now()}`,
      label: 'Nouvel indicateur',
      value: '100%',
    };
    setConfig((prev) => ({
      ...prev,
      trustBadges: [...(prev.trustBadges || []), newBadge],
    }));
  };

  // Remove Trust Badge
  const handleRemoveTrustBadge = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      trustBadges: (prev.trustBadges || []).filter((b) => b.id !== id),
    }));
  };

  // Update Trust Badge
  const handleUpdateTrustBadge = (id: string, updates: Partial<LandingTrustBadge>) => {
    setConfig((prev) => ({
      ...prev,
      trustBadges: (prev.trustBadges || []).map((b) => (b.id === id ? { ...b, ...updates } : b)),
    }));
  };

  // Copy Vanity Link
  const handleCopyLink = async () => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(publicUrl);
      setCopiedLink(true);
      showToast('Lien public copié dans le presse-papier !');
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  // Save and Publish Landing Page
  const handlePublishLandingPage = () => {
    if (!config.vanitySlug.trim()) {
      showToast('Veuillez renseigner un identifiant vanity (slug) valide.');
      return;
    }

    const updatedConfig: LandingPageConfig = {
      ...config,
      isPublished: true,
      publishedAt: new Date().toISOString(),
    };

    setConfig(updatedConfig);

    // Update activeProfile with new landingPage config and sync profile slug if standard domain
    updateProfile({
      slug: config.vanitySlug,
      headline: config.pageHeadline || activeProfile.headline,
      landingPage: updatedConfig,
    });

    // Trigger celebratory confetti
    try {
      confetti({
        particleCount: 75,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch (e) {}

    showToast('Landing Page publiée & URL vanity synchronisée avec succès !');
  };

  // Test Open Public Landing Page in app
  const handleOpenPublicPreview = () => {
    setPublicProfileSlug(config.vanitySlug || activeProfile.slug);
  };

  return (
    <div className="flex flex-col gap-6 text-slate-800 animate-in fade-in duration-200">
      
      {/* 1. TOP HERO BAR: VANITY URL HERO & PUBLISH STATUS */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center shrink-0 shadow-2xs">
            <Globe className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-slate-800">
                Générateur de Landing Page & URL Vanity
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Page Publique Active
              </span>
            </div>
            {/* Live Vanity URL Display Pill */}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50/70 border border-indigo-200/60 px-2.5 py-0.5 rounded-lg select-all">
                {publicUrl}
              </span>
              <button
                onClick={handleCopyLink}
                className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition cursor-pointer"
                title="Copier le lien vanity"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Top Action Buttons */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          <button
            onClick={() => setIsQrModalOpen(true)}
            className="py-2.5 px-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 shadow-2xs transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            title="Générer le QR Code de la Landing Page"
          >
            <QrCode className="w-4 h-4 text-indigo-600" />
            <span className="hidden sm:inline">QR Code HD</span>
          </button>

          <button
            onClick={handleOpenPublicPreview}
            className="py-2.5 px-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 shadow-2xs transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            title="Tester la page publique"
          >
            <ExternalLink className="w-4 h-4 text-slate-600" />
            <span>Tester en direct</span>
          </button>

          <button
            onClick={handlePublishLandingPage}
            className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-indigo-900/20 transition active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Publier la Landing Page</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN 2-PANEL LAYOUT (LEFT CONTROLS & RIGHT LIVE RESPONSIVE PREVIEW) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        
        {/* LEFT COLUMN: BUILDER TABS & SETTINGS (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          
          {/* Sub-Navigation Tabs inside Landing Builder */}
          <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200 w-full overflow-x-auto">
            <button
              onClick={() => setActiveBuilderSection('url_domain')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeBuilderSection === 'url_domain'
                  ? 'bg-white text-indigo-900 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Link2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>1. URL & Domaine</span>
            </button>

            <button
              onClick={() => setActiveBuilderSection('hero_layout')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeBuilderSection === 'hero_layout'
                  ? 'bg-white text-indigo-900 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-indigo-600" />
              <span>2. Structure & Pitch</span>
            </button>

            <button
              onClick={() => setActiveBuilderSection('sections_visibility')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeBuilderSection === 'sections_visibility'
                  ? 'bg-white text-indigo-900 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>3. Blocs Actifs</span>
            </button>

            <button
              onClick={() => setActiveBuilderSection('seo_social')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeBuilderSection === 'seo_social'
                  ? 'bg-white text-indigo-900 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-indigo-600" />
              <span>4. SEO & Partage</span>
            </button>
          </div>

          {/* SECTION 1: URL & DOMAINE VANITY */}
          {activeBuilderSection === 'url_domain' && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col gap-6">
              
              <div>
                <h4 className="font-bold text-base text-slate-800 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-600" />
                  <span>Configuration de l'URL Publique Vanity</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Personnalisez le domaine d'accès et l'identifiant mémorisable pour votre carte NFC et vos supports de communication.
                </p>
              </div>

              {/* Domain Preset Selector */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-700">
                  Préfixe de Domaine :
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {VANITY_DOMAINS.map((dom) => {
                    const isSelected = config.vanityDomain === dom.label || (dom.id === 'custom' && config.vanityDomain === 'custom');
                    return (
                      <button
                        key={dom.id}
                        type="button"
                        onClick={() => setConfig((prev) => ({ ...prev, vanityDomain: dom.id === 'custom' ? 'custom' : dom.label }))}
                        className={`p-3 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-500/20 text-indigo-950 shadow-2xs'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="font-mono font-bold text-xs truncate">{dom.label}</p>
                          <span className="text-[10px] text-slate-500">{dom.badge}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Domain Input if custom selected */}
              {config.vanityDomain === 'custom' && (
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs flex flex-col gap-2.5">
                  <div className="flex items-center gap-2 font-bold text-amber-900">
                    <Lock className="w-4 h-4 text-amber-700" />
                    <span>Domaine Personnalisé en Marque Blanche (Whitelabel)</span>
                  </div>
                  <input
                    type="text"
                    value={config.customDomain || ''}
                    onChange={(e) => setConfig((prev) => ({ ...prev, customDomain: e.target.value }))}
                    placeholder="ex: connect.davidsagbo.fr ou card.monentreprise.com"
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-amber-300 font-mono text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-[11px] text-amber-800">
                    Pointez l'enregistrement DNS <code>CNAME</code> de votre sous-domaine vers <code>cname.kardx.io</code>. Le certificat SSL HTTPS est généré automatiquement sous 10 minutes.
                  </p>
                </div>
              )}

              {/* Vanity Slug Input & Validator */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Identifiant Vanity (Slug unique) :</span>
                  {isSlugAvailable ? (
                    <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Disponible
                    </span>
                  ) : (
                    <span className="text-[11px] text-rose-600 font-bold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Déjà utilisé par un autre collaborateur
                    </span>
                  )}
                </label>

                <div className="flex items-center rounded-2xl bg-slate-50 border border-slate-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 overflow-hidden">
                  <span className="px-3.5 py-2.5 bg-slate-100 text-slate-500 text-xs font-mono font-bold border-r border-slate-200">
                    {config.vanityDomain === 'custom' ? 'https://' : config.vanityDomain}
                  </span>
                  <input
                    type="text"
                    value={config.vanitySlug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="prenom.nom"
                    className="flex-1 px-3.5 py-2.5 bg-transparent text-xs font-mono font-bold text-slate-900 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-3 py-2.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition cursor-pointer border-l border-slate-200"
                  >
                    {copiedLink ? 'Copié !' : 'Copier'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Caractères autorisés : lettres minuscules, chiffres, points (.) et tirets (-).
                </p>
              </div>

              {/* Suggestions Pills */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Suggestions Intelligentes :
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {slugSuggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleApplySuggestion(s)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition cursor-pointer border ${
                        config.vanitySlug === s
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Embed & Share snippet */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <Share2 className="w-4 h-4 text-indigo-600" />
                  <span>Intégrez ce lien dans votre signature email, bio LinkedIn ou badge NFC.</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="py-1.5 px-3 rounded-xl bg-white border border-slate-200 font-bold text-indigo-600 hover:bg-indigo-50 transition cursor-pointer shrink-0"
                >
                  {copiedLink ? 'Copié !' : 'Copier URL'}
                </button>
              </div>

            </div>
          )}

          {/* SECTION 2: STRUCTURE HERO & PITCH */}
          {activeBuilderSection === 'hero_layout' && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col gap-6">
              
              <div>
                <h4 className="font-bold text-base text-slate-800 flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-indigo-600" />
                  <span>Structure de la Page & Pitch Commercial</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Définissez l'architecture visuelle et le positionnement professionnel qui convertira vos visiteurs en contacts qualifiés.
                </p>
              </div>

              {/* Hero Archetypes */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-700">
                  Modèle d'En-tête & Disposition :
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {HERO_LAYOUTS.map((h) => {
                    const isSelected = config.heroLayout === h.id;
                    return (
                      <div
                        key={h.id}
                        onClick={() => setConfig((prev) => ({ ...prev, heroLayout: h.id }))}
                        className={`p-3.5 rounded-2xl border transition cursor-pointer flex flex-col justify-between gap-2 ${
                          isSelected
                            ? 'bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-500/20 text-indigo-950 shadow-2xs'
                            : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-xs">{h.title}</span>
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-md bg-indigo-100 text-indigo-700">
                              {h.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                            {h.description}
                          </p>
                        </div>
                        <span className="text-[10px] text-indigo-600 font-semibold">
                          Idéal pour : {h.recommendedFor}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Headline & Tagline Customization */}
              <div className="flex flex-col gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Titre d'Accroche Principal (Headline) :
                  </label>
                  <input
                    type="text"
                    value={config.pageHeadline || ''}
                    onChange={(e) => setConfig((prev) => ({ ...prev, pageHeadline: e.target.value }))}
                    placeholder="ex: Directeur Associé • Conseil & Stratégie Grands Comptes"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pitch Court / Proposition de Valeur (Sous-titre) :
                  </label>
                  <textarea
                    rows={2}
                    value={config.pageTagline || ''}
                    onChange={(e) => setConfig((prev) => ({ ...prev, pageTagline: e.target.value }))}
                    placeholder="Décrivez en 2 phrases comment vous aidez vos clients et partenaires..."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Primary & Secondary CTA Buttons */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-3">
                <span className="text-xs font-bold text-slate-800">
                  Boutons d'Action Prioritaires (Hero CTA) :
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Primary CTA */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Action Principale :
                    </label>
                    <input
                      type="text"
                      value={config.primaryCtaLabel || ''}
                      onChange={(e) => setConfig((prev) => ({ ...prev, primaryCtaLabel: e.target.value }))}
                      placeholder="Prendre Rendez-vous"
                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-800 mb-1.5"
                    />
                    <select
                      value={config.primaryCtaType}
                      onChange={(e) => setConfig((prev) => ({ ...prev, primaryCtaType: e.target.value as any }))}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700"
                    >
                      <option value="booking">📅 Prendre Rendez-vous (Calendly)</option>
                      <option value="exchange">🤝 Échanger coordonnées (Formulaire)</option>
                      <option value="vcard">📥 Télécharger contact (vCard)</option>
                      <option value="phone">📞 Appel direct</option>
                      <option value="email">✉️ Envoyer un Email</option>
                      <option value="custom_url">🔗 Lien Web personnalisé</option>
                    </select>
                  </div>

                  {/* Secondary CTA */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Action Secondaire :
                    </label>
                    <input
                      type="text"
                      value={config.secondaryCtaLabel || ''}
                      onChange={(e) => setConfig((prev) => ({ ...prev, secondaryCtaLabel: e.target.value }))}
                      placeholder="Enregistrer le contact (vCard)"
                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-800 mb-1.5"
                    />
                    <select
                      value={config.secondaryCtaType || 'vcard'}
                      onChange={(e) => setConfig((prev) => ({ ...prev, secondaryCtaType: e.target.value as any }))}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700"
                    >
                      <option value="vcard">📥 Enregistrer vCard (.vcf)</option>
                      <option value="exchange">🤝 Échanger coordonnées</option>
                      <option value="phone">📞 Appeler</option>
                      <option value="email">✉️ Email</option>
                      <option value="none">🚫 Aucun (bouton unique)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Pitch Bullets (Points Clés) */}
              <div className="flex flex-col gap-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    Points Forts & Arguments Clés (Pitch Points) :
                  </label>
                  <button
                    type="button"
                    onClick={handleAddPitchBullet}
                    className="py-1 px-2.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter un point fort</span>
                  </button>
                </div>

                <div className="flex flex-col gap-2.5">
                  {(config.pitchBullets || []).map((bullet) => (
                    <div
                      key={bullet.id}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-2.5"
                    >
                      <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-indigo-600 shrink-0 shadow-2xs mt-0.5">
                        <Award className="w-4 h-4" />
                      </div>
                      <div className="flex-1 flex flex-col gap-1.5">
                        <input
                          type="text"
                          value={bullet.title}
                          onChange={(e) => handleUpdatePitchBullet(bullet.id, { title: e.target.value })}
                          placeholder="Titre du point fort"
                          className="w-full px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-800"
                        />
                        <input
                          type="text"
                          value={bullet.subtitle}
                          onChange={(e) => handleUpdatePitchBullet(bullet.id, { subtitle: e.target.value })}
                          placeholder="Description concise..."
                          className="w-full px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] text-slate-600"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePitchBullet(bullet.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer"
                        title="Supprimer ce point fort"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trust Badges & Social Proof */}
              <div className="flex flex-col gap-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    Chiffres Clés & Badges de Confiance (Preuve Sociale) :
                  </label>
                  <button
                    type="button"
                    onClick={handleAddTrustBadge}
                    className="py-1 px-2.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter un badge</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {(config.trustBadges || []).map((badge) => (
                    <div
                      key={badge.id}
                      className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-1 relative group"
                    >
                      <input
                        type="text"
                        value={badge.value}
                        onChange={(e) => handleUpdateTrustBadge(badge.id, { value: e.target.value })}
                        placeholder="500+ ou ★ 4.9/5"
                        className="w-full px-2 py-0.5 rounded-md bg-white border border-slate-200 text-xs font-black text-indigo-600 text-center"
                      />
                      <input
                        type="text"
                        value={badge.label}
                        onChange={(e) => handleUpdateTrustBadge(badge.id, { label: e.target.value })}
                        placeholder="Label"
                        className="w-full px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-semibold text-slate-700 text-center"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveTrustBadge(badge.id)}
                        className="absolute top-1 right-1 p-1 text-slate-300 hover:text-rose-600 rounded opacity-0 group-hover:opacity-100 transition cursor-pointer"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* SECTION 3: BLOCS ACTIFS & SECTIONS VISIBLES */}
          {activeBuilderSection === 'sections_visibility' && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col gap-5">
              
              <div>
                <h4 className="font-bold text-base text-slate-800 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>Sections & Blocs Actifs sur la Landing Page</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Activez ou masquez les modules d'interaction selon vos objectifs de conversion.
                </p>
              </div>

              {/* Toggles Grid */}
              <div className="flex flex-col gap-2.5">
                
                {/* Floating Contact Bar */}
                <label className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-100/70 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-slate-800">Barre de Contact Rapide Flottante</p>
                      <p className="text-[11px] text-slate-500">Accès direct aux boutons Appel, WhatsApp, Email et Plan</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.showFloatingContactBar}
                    onChange={(e) => setConfig((prev) => ({ ...prev, showFloatingContactBar: e.target.checked }))}
                    className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                  />
                </label>

                {/* Direct Lead Magnet Form */}
                <label className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-100/70 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-slate-800">Formulaire d'Échange de Coordonnées Direct (Lead Magnet)</p>
                      <p className="text-[11px] text-slate-500">Permet aux prospects de vous laisser leur contact en 1 clic</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.showDirectLeadForm}
                    onChange={(e) => setConfig((prev) => ({ ...prev, showDirectLeadForm: e.target.checked }))}
                    className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                  />
                </label>

                {/* Services & Offers */}
                <label className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-100/70 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-slate-800">Catalogue des Services & Tarifs</p>
                      <p className="text-[11px] text-slate-500">Affiche vos prestations avec badges et boutons de devis</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.showServicesGrid}
                    onChange={(e) => setConfig((prev) => ({ ...prev, showServicesGrid: e.target.checked }))}
                    className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                  />
                </label>

                {/* Video Pitch */}
                <label className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-100/70 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                      <Video className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-slate-800">Vidéo Pitch de Présentation</p>
                      <p className="text-[11px] text-slate-500">Intègre votre vidéo YouTube, Vimeo ou Loom</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.showVideoPitch}
                    onChange={(e) => setConfig((prev) => ({ ...prev, showVideoPitch: e.target.checked }))}
                    className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                  />
                </label>

                {/* Documents & Plaquettes */}
                <label className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-100/70 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-slate-800">Documents Téléchargeables (Plaquettes & PDF)</p>
                      <p className="text-[11px] text-slate-500">Téléchargement direct de vos présentations commerciales</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.showDocumentsDownload}
                    onChange={(e) => setConfig((prev) => ({ ...prev, showDocumentsDownload: e.target.checked }))}
                    className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                  />
                </label>

                {/* Testimonials */}
                <label className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-100/70 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                      <Star className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-slate-800">Témoignages & Avis Clients</p>
                      <p className="text-[11px] text-slate-500">Recommandations clients et notes de satisfaction</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.showTestimonials}
                    onChange={(e) => setConfig((prev) => ({ ...prev, showTestimonials: e.target.checked }))}
                    className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                  />
                </label>

                {/* Location Map */}
                <label className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-100/70 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-slate-800">Localisation & Carte du Bureau</p>
                      <p className="text-[11px] text-slate-500">Itinéraire Google Maps vers vos bureaux</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.showLocationMap}
                    onChange={(e) => setConfig((prev) => ({ ...prev, showLocationMap: e.target.checked }))}
                    className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                  />
                </label>

              </div>

            </div>
          )}

          {/* SECTION 4: SEO & PARTAGE SOCIAL (OPENGRAPH) */}
          {activeBuilderSection === 'seo_social' && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col gap-6">
              
              <div>
                <h4 className="font-bold text-base text-slate-800 flex items-center gap-2">
                  <Search className="w-4 h-4 text-indigo-600" />
                  <span>Référencement SEO & Aperçu Social Media</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Optimisez l'apparence de votre lien lorsqu'il est partagé sur LinkedIn, WhatsApp, X ou indexé par Google.
                </p>
              </div>

              {/* SEO Title & Description */}
              <div className="flex flex-col gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">Titre SEO (Meta Title) :</label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {(config.seoTitle || '').length} / 60 car.
                    </span>
                  </div>
                  <input
                    type="text"
                    value={config.seoTitle || ''}
                    onChange={(e) => setConfig((prev) => ({ ...prev, seoTitle: e.target.value }))}
                    placeholder="David Sagbo • Directeur Business Development | BEST EXPERTS"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">Description SEO (Meta Description) :</label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {(config.seoDescription || '').length} / 160 car.
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={config.seoDescription || ''}
                    onChange={(e) => setConfig((prev) => ({ ...prev, seoDescription: e.target.value }))}
                    placeholder="Consultez le profil digital officiel de David Sagbo. Prenez rendez-vous, échangez vos coordonnées et accédez aux services..."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* LIVE GOOGLE SNIPPET PREVIEW */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Aperçu Google Search :
                </span>
                <div className="font-sans text-left">
                  <p className="text-[11px] text-emerald-800 font-mono line-clamp-1">
                    {publicUrl}
                  </p>
                  <p className="text-sm font-semibold text-blue-800 hover:underline line-clamp-1">
                    {config.seoTitle || `${activeProfile.firstName} ${activeProfile.lastName} • ${activeProfile.headline}`}
                  </p>
                  <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">
                    {config.seoDescription || activeProfile.bio || 'Consultez la fiche officielle et contactez notre expert.'}
                  </p>
                </div>
              </div>

              {/* LIVE OPENGRAPH / LINKEDIN / WHATSAPP CARD PREVIEW */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Aperçu Carte de Partage Sociale (LinkedIn / WhatsApp / iMessage) :
                </span>
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-white shadow-xs">
                  <div className="h-32 bg-slate-900 relative overflow-hidden flex items-center justify-center">
                    <img 
                      src={config.ogImageUrl || activeProfile.theme.coverImageUrl || activeProfile.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'} 
                      alt="Preview" 
                      className="w-full h-full object-cover opacity-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-600 text-white uppercase tracking-wider">
                        KardX Official Card
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                      {config.vanityDomain === 'custom' ? config.customDomain : 'kardx.io'}
                    </p>
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {config.seoTitle || `${activeProfile.firstName} ${activeProfile.lastName} • ${activeProfile.headline}`}
                    </p>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {config.seoDescription || activeProfile.bio}
                    </p>
                  </div>
                </div>
              </div>

              {/* Indexation switch */}
              <label className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 cursor-pointer">
                <div>
                  <p className="font-bold text-xs text-slate-800">Autoriser l'indexation sur Google (SEO public)</p>
                  <p className="text-[11px] text-slate-500">Recommandé pour maximiser votre visibilité professionnelle et votre personal branding</p>
                </div>
                <input
                  type="checkbox"
                  checked={!config.noIndex}
                  onChange={(e) => setConfig((prev) => ({ ...prev, noIndex: !e.target.checked }))}
                  className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                />
              </label>

            </div>
          )}

        </div>

        {/* RIGHT COLUMN: LIVE INTERACTIVE PREVIEW & TESTBENCH (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4 sticky top-6">
          
          {/* Preview Header & Device Selector */}
          <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-indigo-600" />
              <span className="font-bold text-xs text-slate-800">Aperçu Visuel en Direct</span>
            </div>

            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setPreviewDevice('mobile')}
                className={`py-1 px-2.5 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                  previewDevice === 'mobile'
                    ? 'bg-white text-indigo-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewDevice('desktop')}
                className={`py-1 px-2.5 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                  previewDevice === 'desktop'
                    ? 'bg-white text-indigo-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>Bureau</span>
              </button>
            </div>
          </div>

          {/* LIVE SIMULATED DEVICE FRAME */}
          <div className="w-full flex justify-center">
            
            {previewDevice === 'mobile' ? (
              /* MOBILE SMARTPHONE VIEWPORT */
              <div className="w-full max-w-[340px] rounded-[36px] bg-slate-900 p-3 shadow-2xl border-4 border-slate-800 relative">
                
                {/* Speaker & Dynamic island */}
                <div className="absolute top-4 inset-x-0 flex justify-center z-30 pointer-events-none">
                  <div className="w-20 h-4 bg-black rounded-full" />
                </div>

                {/* Inner Screen */}
                <div 
                  className="w-full h-[580px] rounded-[28px] overflow-y-auto bg-slate-950 text-slate-100 flex flex-col text-xs scrollbar-none relative"
                  style={{
                    fontFamily: activeProfile.theme.fontFamily || 'Plus Jakarta Sans',
                    backgroundColor: activeProfile.theme.darkMode ? '#050c1e' : '#f8fafc',
                    color: activeProfile.theme.darkMode ? '#f8fafc' : '#0f172a',
                  }}
                >
                  
                  {/* Hero Banner with Avatar */}
                  <div className="relative pt-6">
                    <div className="h-28 w-full relative overflow-hidden bg-slate-800">
                      {activeProfile.theme.coverImageUrl ? (
                        <img src={activeProfile.theme.coverImageUrl} alt="Cover" className="w-full h-full object-cover opacity-85" />
                      ) : (
                        <div 
                          className="w-full h-full"
                          style={{
                            background: `linear-gradient(135deg, ${activeProfile.theme.primaryColor}, ${activeProfile.theme.accentColor || '#3b82f6'})`
                          }}
                        />
                      )}
                      <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-black/50 text-white backdrop-blur-xs">
                          NFC Verified
                        </span>
                      </div>
                    </div>

                    {/* Avatar Overlap */}
                    <div className="px-4 -mt-12 flex flex-col items-center text-center relative z-20">
                      <div className="w-20 h-20 rounded-full p-1 bg-white dark:bg-slate-900 shadow-xl relative">
                        <img
                          src={activeProfile.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
                          alt={activeProfile.firstName}
                          className="w-full h-full object-cover rounded-full"
                        />
                        {activeProfile.badgeVerified && (
                          <div 
                            className="absolute bottom-0 right-0 p-1 rounded-full text-white shadow-md"
                            style={{ backgroundColor: activeProfile.theme.primaryColor }}
                          >
                            <ShieldCheck className="w-3 h-3" />
                          </div>
                        )}
                      </div>

                      {/* Name & Headline */}
                      <h4 className="font-black text-sm mt-2 text-slate-900 dark:text-white">
                        {activeProfile.firstName} {activeProfile.lastName}
                      </h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium line-clamp-2 mt-0.5">
                        {config.pageHeadline || activeProfile.headline}
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {activeProfile.company}
                      </span>
                    </div>
                  </div>

                  {/* Primary & Secondary Hero CTAs */}
                  <div className="px-4 mt-3 flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (config.primaryCtaType === 'exchange') {
                          setExchangeSource('direct_url');
                          setIsExchangeModalOpen(true);
                        } else if (config.primaryCtaType === 'vcard') {
                          downloadVCard(activeProfile);
                        } else if (config.primaryCtaType === 'booking' && activeProfile.contacts.bookingUrl) {
                          window.open(activeProfile.contacts.bookingUrl, '_blank');
                        }
                      }}
                      className="w-full py-2.5 px-4 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition cursor-pointer"
                      style={{ backgroundColor: activeProfile.theme.primaryColor || '#1e3a8a' }}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{config.primaryCtaLabel || 'Prendre Rendez-vous'}</span>
                    </button>

                    {config.secondaryCtaType !== 'none' && (
                      <button
                        type="button"
                        onClick={() => downloadVCard(activeProfile)}
                        className="w-full py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-[11px] flex items-center justify-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{config.secondaryCtaLabel || 'Enregistrer le contact'}</span>
                      </button>
                    )}
                  </div>

                  {/* Trust Badges Counter row */}
                  {config.trustBadges && config.trustBadges.length > 0 && (
                    <div className="px-4 mt-3 grid grid-cols-3 gap-1.5 text-center">
                      {config.trustBadges.map((tb) => (
                        <div 
                          key={tb.id} 
                          className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                        >
                          <p className="font-extrabold text-[11px] text-indigo-600 dark:text-indigo-400">{tb.value}</p>
                          <p className="text-[9px] text-slate-500 truncate">{tb.label}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Fast Action Quick Icons */}
                  {config.showFloatingContactBar && (
                    <div className="px-4 mt-3 grid grid-cols-4 gap-1.5 text-center text-[10px]">
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col items-center">
                        <Phone className="w-3.5 h-3.5 text-indigo-500 mb-0.5" />
                        <span>Appel</span>
                      </div>
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col items-center">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-500 mb-0.5" />
                        <span>WhatsApp</span>
                      </div>
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col items-center">
                        <Mail className="w-3.5 h-3.5 text-blue-500 mb-0.5" />
                        <span>Email</span>
                      </div>
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col items-center">
                        <Globe className="w-3.5 h-3.5 text-amber-500 mb-0.5" />
                        <span>Site</span>
                      </div>
                    </div>
                  )}

                  {/* Pitch Bullets */}
                  {config.pitchBullets && config.pitchBullets.length > 0 && (
                    <div className="px-4 mt-3 flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Points Clés :
                      </span>
                      {config.pitchBullets.map((pb) => (
                        <div 
                          key={pb.id}
                          className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2"
                        >
                          <Award className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-bold text-[11px] text-slate-800 dark:text-slate-100 truncate">{pb.title}</p>
                            <p className="text-[9px] text-slate-500 truncate">{pb.subtitle}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Services preview */}
                  {config.showServicesGrid && (
                    <div className="px-4 mt-3 flex flex-col gap-1.5 pb-6">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Services & Offres :
                      </span>
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-[11px] text-slate-800 dark:text-slate-100">Audit & Diagnostic B2B</p>
                          <p className="text-[9px] text-emerald-600 font-bold">À partir de 2 800 €</p>
                        </div>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
                          Devis
                        </span>
                      </div>
                    </div>
                  )}

                </div>

              </div>
            ) : (
              /* DESKTOP 16:9 WIDESCREEN LANDING VIEWPORT */
              <div className="w-full rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden flex flex-col">
                
                {/* Browser top chrome */}
                <div className="px-3 py-2 bg-slate-100 border-b border-slate-200 flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <div className="flex-1 bg-white px-2.5 py-0.5 rounded-md border border-slate-200 text-[10px] truncate text-slate-700">
                    {publicUrl}
                  </div>
                </div>

                {/* Inner Desktop Landing view */}
                <div 
                  className="p-5 overflow-y-auto max-h-[500px] flex flex-col gap-4 text-xs"
                  style={{
                    fontFamily: activeProfile.theme.fontFamily || 'Plus Jakarta Sans',
                    backgroundColor: activeProfile.theme.darkMode ? '#050c1e' : '#f8fafc',
                    color: activeProfile.theme.darkMode ? '#f8fafc' : '#0f172a',
                  }}
                >
                  {/* Widescreen Hero Split */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img 
                        src={activeProfile.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'} 
                        alt={activeProfile.firstName}
                        className="w-14 h-14 rounded-full object-cover border-2 border-indigo-500 shadow-md"
                      />
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          {activeProfile.firstName} {activeProfile.lastName}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                          {config.pageHeadline || activeProfile.headline}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {activeProfile.company} • {activeProfile.contacts.address?.city || 'Paris'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => downloadVCard(activeProfile)}
                      className="py-2 px-3 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-sm"
                      style={{ backgroundColor: activeProfile.theme.primaryColor || '#1e3a8a' }}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{config.primaryCtaLabel || 'Prendre RDV'}</span>
                    </button>
                  </div>

                  {/* 3-Column Pitch & Stats Grid */}
                  {config.trustBadges && config.trustBadges.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {config.trustBadges.map((tb) => (
                        <div key={tb.id} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <p className="font-black text-sm text-indigo-600 dark:text-indigo-400">{tb.value}</p>
                          <p className="text-[10px] text-slate-500">{tb.label}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Bullet points showcase */}
                  {config.pitchBullets && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {config.pitchBullets.map((pb) => (
                        <div key={pb.id} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2">
                          <Award className="w-4 h-4 text-indigo-500 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate">{pb.title}</p>
                            <p className="text-[10px] text-slate-500 truncate">{pb.subtitle}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>

              </div>
            )}

          </div>

          {/* Quick Action Footer in Right Column */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-600">Lien Public :</span>
            <button
              onClick={handleOpenPublicPreview}
              className="font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition cursor-pointer"
            >
              <span>Ouvrir la page dans le navigateur</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>

      {/* MODAL: QR CODE HAUTE DÉFINITION FOR THIS LANDING PAGE */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 border border-slate-200 shadow-2xl flex flex-col items-center text-center gap-4">
            <div className="flex items-center justify-between w-full border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-800">
                <QrCode className="w-4 h-4 text-indigo-600" />
                <h4 className="font-bold text-sm">QR Code de la Landing Page</h4>
              </div>
              <button
                onClick={() => setIsQrModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {qrCodeDataUrl ? (
              <div className="p-3 bg-white rounded-2xl border-2 border-indigo-100 shadow-md">
                <img src={qrCodeDataUrl} alt="QR Code" className="w-48 h-48 rounded-xl object-contain" />
              </div>
            ) : (
              <div className="w-48 h-48 rounded-2xl bg-slate-100 flex items-center justify-center animate-pulse text-xs text-slate-400">
                Génération...
              </div>
            )}

            <div className="text-xs">
              <p className="font-mono font-bold text-indigo-600 truncate max-w-[240px]">{publicUrl}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Scannable instantanément par tous les smartphones iOS & Android.</p>
            </div>

            <div className="grid grid-cols-2 gap-2 w-full pt-1">
              <button
                type="button"
                onClick={() => {
                  if (qrCodeDataUrl) {
                    const a = document.createElement('a');
                    a.href = qrCodeDataUrl;
                    a.download = `kardx_landing_${config.vanitySlug}.png`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  } else {
                    downloadHighResQRPng(publicUrl, `kardx_landing_${config.vanitySlug}.png`);
                  }
                  showToast('QR Code PNG téléchargé !');
                }}
                className="py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Télécharger PNG</span>
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedLink ? 'Copié !' : 'Copier Lien'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
