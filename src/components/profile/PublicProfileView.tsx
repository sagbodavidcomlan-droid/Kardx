import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { generateVCardString, downloadVCard } from '../../utils/vcard';
import { generateQRCodeDataUrl } from '../../utils/qr';
import { 
  Phone, 
  Mail, 
  MessageSquare, 
  Globe, 
  MapPin, 
  Share2, 
  Calendar, 
  Download, 
  CheckCircle, 
  ShieldCheck, 
  ExternalLink, 
  FileText, 
  Star, 
  Sparkles, 
  ChevronRight,
  QrCode,
  Smartphone,
  Copy,
  Check,
  Building2,
  Briefcase,
  Layers,
  Send,
  Linkedin,
  Twitter,
  Instagram,
  Youtube,
  Github,
  Zap,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PublicProfileViewProps {
  slug?: string;
  isEmbeddedPreview?: boolean;
}

export const PublicProfileView: React.FC<PublicProfileViewProps> = ({
  slug,
  isEmbeddedPreview = false,
}) => {
  const { 
    profiles, 
    activeProfile, 
    setIsExchangeModalOpen, 
    setExchangeSource,
    trackEvent,
    showToast 
  } = useApp();

  const profile = (slug ? profiles.find((p) => p.slug === slug) : null) || activeProfile;
  const theme = profile?.theme || {
    primaryColor: '#4F46E5',
    secondaryColor: '#312E81',
    darkMode: true,
    fontFamily: 'Inter',
    roundedCorners: 'xl',
  };

  const [activeTabSection, setActiveTabSection] = useState<'all' | 'services' | 'booking' | 'docs'>('all');
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Track initial page view on mount
  useEffect(() => {
    if (profile?.id) {
      trackEvent('profile_view', profile.id, 'direct_url');
    }
  }, [profile?.id]);

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-4 text-center">
        <p>Profil non trouvé ou non configuré.</p>
      </div>
    );
  }

  const handleOpenExchange = () => {
    trackEvent('exchange_open', profile.id, 'direct_url');
    setExchangeSource('direct_url');
    setIsExchangeModalOpen(true);
  };

  const handleDownloadVcard = () => {
    trackEvent('contact_download', profile.id, 'direct_url');
    downloadVCard(profile);
    
    // Confetti celebration on saving contact!
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.8 }
      });
    } catch {
      // safe fallback
    }
    
    showToast('Fiche contact téléchargée (.vcf)');
  };

  const handleShareClick = async () => {
    const url = `${window.location.origin}/p/${profile.slug}`;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      showToast('Lien du profil copié dans le presse-papier !');
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  const handleShowQr = async () => {
    const url = `${window.location.origin}/p/${profile.slug}`;
    const dataUrl = await generateQRCodeDataUrl(url, {
      width: 400,
      color: { dark: theme.primaryColor || '#0f172a', light: '#ffffff' }
    });
    setQrDataUrl(dataUrl);
    setQrModalOpen(true);
  };

  // Social Icon resolver
  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'linkedin':
        return (
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76c.9 0 1.63-.73 1.63-1.63a1.63 1.63 0 1 0-3.26 0c0 .9.73 1.63 1.63 1.63m1.4 9.74v-8.37H5.06v8.37h2.8z"/>
          </svg>
        );
      case 'twitter':
        return (
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        );
      case 'whatsapp':
        return <MessageSquare className="w-4 h-4" />;
      case 'github':
        return (
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/>
          </svg>
        );
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  const isDark = theme.darkMode ?? true;

  return (
    <div 
      className={`min-h-screen transition-colors duration-300 py-0 sm:py-6 flex flex-col justify-center items-center ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}
      style={{
        fontFamily: theme.fontFamily || 'Inter, sans-serif',
      }}
    >
      {/* MAIN RESPONSIVE PROFILE CARD CONTAINER */}
      <div 
        className={`w-full max-w-md min-h-screen sm:min-h-0 sm:rounded-[36px] shadow-2xl overflow-hidden flex flex-col relative transition-all ${
          isDark 
            ? 'bg-[#0F172A] border border-slate-800 text-slate-100' 
            : 'bg-white border border-slate-200 text-slate-900'
        }`}
      >
        
        {/* BANNER / HEADER HERO */}
        <div className="relative">
          <div className="h-44 sm:h-48 w-full relative overflow-hidden bg-slate-900">
            {theme.coverImageUrl ? (
              <img 
                src={theme.coverImageUrl} 
                alt="Banner" 
                className="w-full h-full object-cover object-center opacity-90"
              />
            ) : (
              <div 
                className="w-full h-full"
                style={{
                  background: `linear-gradient(135deg, ${theme.primaryColor || '#4f46e5'}, ${theme.secondaryColor || '#1e1b4b'})`
                }}
              />
            )}
            
            {/* Top Quick Actions bar */}
            <div className="absolute top-4 inset-x-4 flex items-center justify-between z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold backdrop-blur-md bg-black/40 text-white border border-white/15 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                NFC & QR Vérifié
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleShowQr}
                  aria-label="Afficher le QR code"
                  className="p-2 rounded-full backdrop-blur-md bg-black/40 text-white hover:bg-black/60 transition border border-white/15 shadow-sm cursor-pointer"
                  title="Afficher le QR Code"
                >
                  <QrCode className="w-4 h-4" />
                </button>
                <button
                  onClick={handleShareClick}
                  aria-label="Partager le profil"
                  className="p-2 rounded-full backdrop-blur-md bg-black/40 text-white hover:bg-black/60 transition border border-white/15 shadow-sm cursor-pointer"
                  title="Copier le lien"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* AVATAR & IDENTITY CENTERPIECE */}
          <div className="px-6 -mt-16 flex flex-col items-center text-center relative z-20">
            <div className="relative mb-3">
              <div className="w-28 h-28 rounded-full p-1 bg-white dark:bg-slate-900 shadow-2xl ring-4 ring-black/10 dark:ring-white/10">
                <img
                  src={profile.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&h=400&q=80'}
                  alt={`${profile.firstName} ${profile.lastName}`}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              {profile.badgeVerified && (
                <div 
                  className="absolute bottom-1 right-1 p-1.5 rounded-full text-white shadow-lg ring-2 ring-white dark:ring-slate-900"
                  style={{ backgroundColor: theme.primaryColor || '#4f46e5' }}
                  title="Profil Professionnel Certifié"
                >
                  <ShieldCheck className="w-4 h-4" />
                </div>
              )}
            </div>

            {/* Name & Headline */}
            <h1 className="text-2xl font-black tracking-tight flex items-center justify-center gap-1.5">
              {profile.firstName} {profile.lastName}
            </h1>
            
            <p className="text-xs sm:text-sm font-semibold text-indigo-400 dark:text-indigo-300 mt-1 max-w-xs leading-snug">
              {profile.headline}
            </p>

            {/* Company & Department Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
                <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                <span>{profile.company}</span>
              </span>
              {profile.department && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  <span>{profile.department}</span>
                </span>
              )}
            </div>

            {/* Address Location */}
            {profile.contacts.address?.city && (
              <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1.5 font-medium">
                <MapPin className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                <span>{profile.contacts.address.city}, {profile.contacts.address.country || 'France'}</span>
              </div>
            )}
          </div>
        </div>

        {/* 4-GRID QUICK DIRECT ACTIONS */}
        <div className="px-5 mt-5">
          <div className="grid grid-cols-4 gap-2">
            {/* Phone Call */}
            <a
              href={`tel:${profile.contacts.mobile || profile.contacts.phone || ''}`}
              onClick={() => trackEvent('phone_click', profile.id, 'direct_url')}
              className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 shadow-2xs hover:border-indigo-500/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95 group"
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-1 group-hover:scale-110 transition">
                <Phone className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Appel</span>
            </a>

            {/* WhatsApp Direct */}
            <a
              href={`https://wa.me/${(profile.contacts.whatsapp || profile.contacts.mobile || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Bonjour ${profile.firstName}, j'ai scanné votre carte de visite digitale.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent('whatsapp_click', profile.id, 'direct_url')}
              className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 shadow-2xs hover:border-emerald-500/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95 group"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1 group-hover:scale-110 transition">
                <MessageSquare className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">WhatsApp</span>
            </a>

            {/* Email Direct */}
            <a
              href={`mailto:${profile.contacts.email}?subject=${encodeURIComponent(`Prise de contact via votre carte KardX`)}`}
              onClick={() => trackEvent('email_click', profile.id, 'direct_url')}
              className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 shadow-2xs hover:border-blue-500/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95 group"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-1 group-hover:scale-110 transition">
                <Mail className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Email</span>
            </a>

            {/* Website / Links */}
            <a
              href={profile.contacts.website || '#'}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent('website_click', profile.id, 'direct_url')}
              className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 shadow-2xs hover:border-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95 group"
            >
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center mb-1 group-hover:scale-110 transition">
                <Globe className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Site Web</span>
            </a>
          </div>
        </div>

        {/* PRIMARY CTA & VCARD ACTION BUTTONS */}
        <div className="px-5 mt-4 flex flex-col gap-2.5">
          {/* Main Exchange Button */}
          <button
            onClick={handleOpenExchange}
            className="w-full py-3.5 px-4 rounded-2xl text-white font-extrabold text-sm shadow-xl shadow-indigo-900/30 flex items-center justify-center gap-2 transition transform active:scale-[0.98] cursor-pointer"
            style={{
              backgroundColor: theme.primaryColor || '#4F46E5',
            }}
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>{profile.landingPage?.primaryCtaLabel || profile.exchangeCtaLabel || 'Échanger nos coordonnées'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Secondary Save Contact (VCard) Button */}
          {profile.enableVcardDownload && (
            <button
              onClick={handleDownloadVcard}
              className="w-full py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700/60 flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer"
            >
              <Download className="w-4 h-4 text-indigo-400" />
              <span>Enregistrer dans mes contacts (.vcf)</span>
            </button>
          )}

          {/* Trust Badges */}
          {profile.landingPage?.showTrustBadges && profile.landingPage?.trustBadges && profile.landingPage.trustBadges.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[10px] text-slate-500 dark:text-slate-400">
              {profile.landingPage.trustBadges.map((badge, idx) => (
                <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800/80 font-bold border border-slate-200 dark:border-slate-700/60">
                  <CheckCircle className="w-3 h-3 text-emerald-500" />
                  {badge}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* PITCH BULLETS */}
        {profile.landingPage?.showPitchBullets && profile.landingPage?.pitchBullets && profile.landingPage.pitchBullets.length > 0 && (
          <div className="px-5 mt-4">
            <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 flex flex-col gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                Pourquoi échanger ensemble ?
              </span>
              <div className="flex flex-col gap-2">
                {profile.landingPage.pitchBullets.map((bullet, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-200">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold shrink-0">✦</span>
                    <span className="leading-snug">{bullet}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* BIO / ABOUT */}
        {profile.bio && (
          <div className="px-5 mt-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {profile.bio}
            </div>
          </div>
        )}

        {/* SOCIAL LINKS */}
        {profile.socials && profile.socials.length > 0 && (
          <div className="px-5 mt-4">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {profile.socials.map((social) => (
                <a
                  key={social.id}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent('social_click', profile.id, 'direct_url', { platform: social.platform })}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:text-indigo-400 hover:border-indigo-500/40 shadow-2xs transition active:scale-95 flex items-center gap-1.5"
                  title={social.label || social.platform}
                >
                  {getSocialIcon(social.platform)}
                  {social.label && (
                    <span className="text-[11px] font-bold pr-1">{social.label}</span>
                  )}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* DYNAMIC CONTENT BLOCKS */}
        <div className="px-5 mt-5 pb-28 flex flex-col gap-4">
          {profile.blocks
            .filter((b) => b.visible)
            .sort((a, b) => a.order - b.order)
            .map((block) => {
              switch (block.type) {
                case 'about':
                  return (
                    <div key={block.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                      {block.title && (
                        <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                          {block.title}
                        </h3>
                      )}
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        {block.payload.text}
                      </p>
                    </div>
                  );

                case 'services':
                  return (
                    <div key={block.id} className="flex flex-col gap-2.5">
                      {block.title && (
                        <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
                          {block.title}
                        </h3>
                      )}
                      <div className="flex flex-col gap-2.5">
                        {block.payload.services?.map((srv) => (
                          <div
                            key={srv.id}
                            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 shadow-2xs hover:border-indigo-500/40 transition flex flex-col gap-2"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                                {srv.title}
                              </h4>
                              {srv.badge && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 shrink-0">
                                  {srv.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                              {srv.description}
                            </p>
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                              {srv.price && (
                                <span className="text-xs font-black text-slate-900 dark:text-white">
                                  {srv.price}
                                </span>
                              )}
                              <button
                                onClick={handleOpenExchange}
                                className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                              >
                                {srv.buttonLabel || 'Demander un devis'}
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );

                case 'booking':
                  return (
                    <div
                      key={block.id}
                      className="p-5 rounded-2xl bg-gradient-to-br from-indigo-900/40 to-blue-900/30 border border-indigo-500/30 shadow-md flex flex-col gap-3"
                    >
                      <div className="flex items-center gap-2 text-indigo-400 font-extrabold text-[11px] uppercase tracking-wider">
                        <Calendar className="w-4 h-4" />
                        <span>{block.title || 'Prendre Rendez-vous'}</span>
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                        {block.payload.bookingData?.title || 'Session d’échange stratégique'}
                      </h4>
                      {block.payload.bookingData?.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          {block.payload.bookingData.description}
                        </p>
                      )}
                      <a
                        href={block.payload.bookingData?.url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackEvent('booking_click', profile.id, 'direct_url')}
                        className="mt-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition"
                      >
                        <span>Réserver un créneau dans l'agenda</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  );

                case 'documents':
                  return (
                    <div key={block.id} className="flex flex-col gap-2.5">
                      {block.title && (
                        <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
                          {block.title}
                        </h3>
                      )}
                      <div className="flex flex-col gap-2">
                        {block.payload.documents?.map((doc) => (
                          <div
                            key={doc.id}
                            className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 shadow-2xs flex items-center justify-between gap-3 hover:border-slate-400 dark:hover:border-slate-600 transition"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 font-bold">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                  {doc.title}
                                </p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                  {doc.fileSize || 'Plaquette PDF'}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                trackEvent('document_click', profile.id, 'direct_url', { docTitle: doc.title });
                                showToast(`Téléchargement de : ${doc.title}`);
                              }}
                              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 shrink-0 transition cursor-pointer"
                              title="Télécharger"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );

                case 'testimonials':
                  return (
                    <div key={block.id} className="flex flex-col gap-2.5">
                      {block.title && (
                        <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
                          {block.title}
                        </h3>
                      )}
                      <div className="flex flex-col gap-2.5">
                        {block.payload.testimonials?.map((t) => (
                          <div
                            key={t.id}
                            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 shadow-2xs flex flex-col gap-2"
                          >
                            <div className="flex items-center gap-1 text-amber-400">
                              {[...Array(t.rating || 5)].map((_, i) => (
                                <Star key={i} className="w-3.5 h-3.5 fill-current" />
                              ))}
                            </div>
                            <p className="text-xs italic text-slate-700 dark:text-slate-300 leading-relaxed">
                              "{t.quote}"
                            </p>
                            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900 dark:text-white">
                                {t.authorName}
                              </span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                {t.authorRole} • {t.company}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );

                case 'map':
                  return (
                    <div key={block.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 shadow-2xs flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        <MapPin className="w-4 h-4 text-rose-500" />
                        <span>{block.title || 'Adresse & Localisation'}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {block.payload.mapData?.address}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {block.payload.mapData?.city}, {block.payload.mapData?.country}
                      </p>
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(`${block.payload.mapData?.address} ${block.payload.mapData?.city}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Ouvrir dans Google Maps</span>
                      </a>
                    </div>
                  );

                default:
                  return null;
              }
            })}
        </div>

        {/* STICKY BOTTOM FLOATING BAR */}
        {profile.enableFloatingCta && (
          <div className="fixed sm:absolute bottom-0 inset-x-0 max-w-md mx-auto p-3.5 z-40 bg-slate-950/85 backdrop-blur-xl border-t border-slate-800">
            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenExchange}
                className="flex-1 py-3 px-4 rounded-xl text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
                style={{ backgroundColor: theme.primaryColor || '#4F46E5' }}
              >
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                <span className="whitespace-nowrap">Échanger mes coordonnées</span>
              </button>

              <button
                onClick={handleDownloadVcard}
                className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition active:scale-95 shrink-0 border border-slate-700 cursor-pointer"
                title="Enregistrer le contact (.vcf)"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* QR CODE POPUP MODAL */}
        {qrModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-xs bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center animate-in fade-in zoom-in duration-200">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white mb-1">
                {profile.firstName} {profile.lastName}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Scannez avec l’appareil photo d’un smartphone
              </p>

              {qrDataUrl && (
                <div className="p-3 bg-white rounded-2xl shadow-inner border border-slate-200 mb-4">
                  <img src={qrDataUrl} alt="QR Code Profil" className="w-48 h-48" />
                </div>
              )}

              <div className="flex flex-col w-full gap-2">
                <button
                  onClick={handleShareClick}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copier le lien public</span>
                </button>
                <button
                  onClick={() => setQrModalOpen(false)}
                  className="w-full py-2 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold text-xs transition cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
