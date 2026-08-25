import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Mail, 
  Copy, 
  Check, 
  Sparkles, 
  Layout, 
  ExternalLink, 
  Phone, 
  Globe, 
  Building,
  User,
  Download,
  Eye,
  Sliders,
  Share2,
  Calendar,
  ShieldCheck,
  Leaf,
  Info,
  CheckCircle2,
  HelpCircle,
  Smartphone,
  Send,
  RefreshCw,
  Palette,
  Linkedin,
  Twitter,
  Instagram,
  Youtube,
  MessageCircle,
  Sun,
  Moon
} from 'lucide-react';

export type SignatureTemplateId = 'corporate' | 'modern' | 'minimal' | 'executive' | 'compact' | 'creative';

const COLOR_PRESETS = [
  { name: 'Indigo KardX', value: '#4f46e5' },
  { name: 'Bleu Corporate', value: '#1d4ed8' },
  { name: 'Saphir Océan', value: '#0284c7' },
  { name: 'Émeraude B2B', value: '#059669' },
  { name: 'Graphite Sombre', value: '#1e293b' },
  { name: 'Rubis Élégant', value: '#be123c' },
  { name: 'Ambre Gold', value: '#d97706' },
  { name: 'Violet Royal', value: '#7c3aed' },
];

export const EmailSignatureGenerator: React.FC = () => {
  const { activeProfile, profiles, setActiveProfile, showToast } = useApp();
  
  // Helpers to safely get social links from activeProfile.socials array
  const getSocialUrl = (platform: string): string => {
    if (!activeProfile?.socials || !Array.isArray(activeProfile.socials)) return '';
    const found = activeProfile.socials.find((s) => s.platform === platform);
    return found?.url || '';
  };

  // Customization state
  const [template, setTemplate] = useState<SignatureTemplateId>(() => {
    return (localStorage.getItem('kardx_sig_template') as SignatureTemplateId) || 'corporate';
  });
  const [primaryColor, setPrimaryColor] = useState<string>(() => {
    return localStorage.getItem('kardx_sig_color') || '#4f46e5';
  });
  const [avatarShape, setAvatarShape] = useState<'round' | 'rounded' | 'square'>('round');
  const [showAvatar, setShowAvatar] = useState(true);
  const [showQrBadge, setShowQrBadge] = useState(true);
  const [showSecondaryCta, setShowSecondaryCta] = useState(true);
  const [secondaryCtaText, setSecondaryCtaText] = useState('Prendre rendez-vous');
  const [secondaryCtaUrl, setSecondaryCtaUrl] = useState(
    activeProfile?.contacts?.bookingUrl || 'https://calendly.com'
  );

  // Social icons toggles
  const [showSocials, setShowSocials] = useState(true);
  const [linkedinUrl, setLinkedinUrl] = useState(getSocialUrl('linkedin'));
  const [twitterUrl, setTwitterUrl] = useState(getSocialUrl('twitter'));
  const [instagramUrl, setInstagramUrl] = useState(getSocialUrl('instagram'));
  const [whatsappPhone, setWhatsappPhone] = useState(
    activeProfile?.contacts?.mobile || activeProfile?.contacts?.phone || ''
  );

  // Add-on Badges
  const [showEcoBanner, setShowEcoBanner] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [disclaimerText, setDisclaimerText] = useState(
    'Ce message et toutes les pièces jointes sont confidentiels et établis à l\'intention exclusive de ses destinataires.'
  );
  const [customPromoBanner, setCustomPromoBanner] = useState(false);
  const [customPromoText, setCustomPromoText] = useState('🚀 Retrouvez nos solutions digitales sur www.kardx.app');

  // Preview & Client simulation
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>('light');
  const [activeGuideTab, setActiveGuideTab] = useState<'gmail' | 'outlook' | 'apple' | 'thunderbird'>('gmail');
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [copiedRich, setCopiedRich] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);

  // Sync profile values when activeProfile changes
  useEffect(() => {
    if (activeProfile?.contacts?.bookingUrl) {
      setSecondaryCtaUrl(activeProfile.contacts.bookingUrl);
    }
    setLinkedinUrl(getSocialUrl('linkedin'));
    setTwitterUrl(getSocialUrl('twitter'));
    setInstagramUrl(getSocialUrl('instagram'));
    setWhatsappPhone(activeProfile?.contacts?.mobile || activeProfile?.contacts?.phone || '');
  }, [activeProfile]);

  // Save settings
  useEffect(() => {
    localStorage.setItem('kardx_sig_template', template);
    localStorage.setItem('kardx_sig_color', primaryColor);
  }, [template, primaryColor]);

  const publicUrl = `${window.location.origin}/p/${activeProfile?.slug || ''}`;
  const fullName = `${activeProfile?.firstName || ''} ${activeProfile?.lastName || ''}`.trim() || 'Votre Nom';
  const phoneToUse = activeProfile?.contacts?.mobile || activeProfile?.contacts?.phone || '';
  const emailToUse = activeProfile?.contacts?.email || '';
  const websiteToUse = activeProfile?.contacts?.website || 'https://kardx.app';
  const cleanWebsite = websiteToUse.replace(/^https?:\/\//, '').replace(/\/$/, '');

  const getBorderRadius = () => {
    if (avatarShape === 'round') return '50%';
    if (avatarShape === 'rounded') return '12px';
    return '0px';
  };

  /**
   * Generates production-ready, email-safe HTML table code
   * with inline CSS compatible across Outlook, Gmail, Apple Mail, Yahoo, Thunderbird.
   */
  const generateCleanSignatureHtml = () => {
    const avatarRadius = getBorderRadius();
    const avatarImg = showAvatar && activeProfile.avatarUrl ? `
      <td valign="top" style="padding-right: 18px;">
        <img src="${activeProfile.avatarUrl}" alt="${fullName}" width="82" height="82" style="border-radius: ${avatarRadius}; width: 82px; height: 82px; object-fit: cover; display: block; border: 0;" />
      </td>
    ` : '';

    const socialsHtml = showSocials ? `
      <div style="margin-top: 10px; line-height: 1;">
        ${linkedinUrl ? `<a href="${linkedinUrl.startsWith('http') ? linkedinUrl : `https://${linkedinUrl}`}" style="text-decoration: none; display: inline-block; margin-right: 8px; color: ${primaryColor}; font-weight: bold; font-size: 11px;">LinkedIn</a>` : ''}
        ${twitterUrl ? `<a href="${twitterUrl.startsWith('http') ? twitterUrl : `https://${twitterUrl}`}" style="text-decoration: none; display: inline-block; margin-right: 8px; color: ${primaryColor}; font-weight: bold; font-size: 11px;">Twitter/X</a>` : ''}
        ${instagramUrl ? `<a href="${instagramUrl.startsWith('http') ? instagramUrl : `https://${instagramUrl}`}" style="text-decoration: none; display: inline-block; margin-right: 8px; color: ${primaryColor}; font-weight: bold; font-size: 11px;">Instagram</a>` : ''}
        ${whatsappPhone ? `<a href="https://wa.me/${whatsappPhone.replace(/[^0-9]/g, '')}" style="text-decoration: none; display: inline-block; color: #16a34a; font-weight: bold; font-size: 11px;">WhatsApp</a>` : ''}
      </div>
    ` : '';

    const buttonsHtml = `
      <div style="margin-top: 12px; display: block;">
        ${showQrBadge ? `
          <a href="${publicUrl}" target="_blank" style="display: inline-block; padding: 7px 14px; background-color: ${primaryColor}; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 11px; font-weight: bold; font-family: Arial, sans-serif; margin-right: 8px; margin-bottom: 6px;">
            📱 Voir ma carte NFC / QR
          </a>
        ` : ''}
        ${showSecondaryCta && secondaryCtaText ? `
          <a href="${secondaryCtaUrl || '#'}" target="_blank" style="display: inline-block; padding: 6px 13px; background-color: #f1f5f9; color: #1e293b; text-decoration: none; border-radius: 6px; font-size: 11px; font-weight: bold; border: 1px solid #cbd5e1; font-family: Arial, sans-serif; margin-bottom: 6px;">
            📅 ${secondaryCtaText}
          </a>
        ` : ''}
      </div>
    `;

    const ecoBannerHtml = showEcoBanner ? `
      <tr>
        <td colspan="2" style="padding-top: 12px; font-size: 11px; color: #15803d; font-family: Arial, sans-serif; border-top: 1px dashed #e2e8f0; margin-top: 10px;">
          🍃 <em>Pensez à l'environnement avant d'imprimer ce courriel. Économisons le papier ensemble.</em>
        </td>
      </tr>
    ` : '';

    const promoBannerHtml = customPromoBanner && customPromoText ? `
      <tr>
        <td colspan="2" style="padding-top: 10px; font-size: 11px; color: ${primaryColor}; font-weight: bold; font-family: Arial, sans-serif;">
          📢 ${customPromoText}
        </td>
      </tr>
    ` : '';

    const disclaimerHtml = showDisclaimer && disclaimerText ? `
      <tr>
        <td colspan="2" style="padding-top: 8px; font-size: 10px; color: #94a3b8; line-height: 1.3; font-family: Arial, sans-serif;">
          🔒 ${disclaimerText}
        </td>
      </tr>
    ` : '';

    if (template === 'minimal') {
      return `
<!-- KardX Email Signature (Minimal) -->
<table cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #334155; line-height: 1.4; max-width: 540px;">
  <tr>
    <td style="padding-bottom: 4px;">
      <span style="font-size: 14px; font-weight: bold; color: #0f172a;">${fullName}</span>
      <span style="color: #94a3b8; margin: 0 6px;">|</span>
      <span style="color: #475569;">${activeProfile?.headline || ''}</span>
      <span style="color: #94a3b8; margin: 0 6px;">|</span>
      <span style="color: ${primaryColor}; font-weight: bold;">${activeProfile?.company || ''}</span>
    </td>
  </tr>
  <tr>
    <td style="color: #64748b; font-size: 11px; padding-bottom: 6px;">
      ${phoneToUse ? `<span>Tél: ${phoneToUse}</span> &nbsp;•&nbsp; ` : ''}
      <a href="mailto:${emailToUse}" style="color: #334155; text-decoration: none;">${emailToUse}</a> &nbsp;•&nbsp;
      <a href="${websiteToUse}" style="color: ${primaryColor}; text-decoration: none;">${cleanWebsite}</a>
    </td>
  </tr>
  <tr>
    <td>
      <a href="${publicUrl}" style="font-size: 11px; font-weight: bold; color: ${primaryColor}; text-decoration: underline;">
        🔗 Découvrir ma carte de visite digitale NFC / QR &rarr;
      </a>
    </td>
  </tr>
  ${ecoBannerHtml}
  ${promoBannerHtml}
  ${disclaimerHtml}
</table>
      `.trim();
    }

    if (template === 'compact') {
      return `
<!-- KardX Email Signature (Compact) -->
<table cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #1e293b; line-height: 1.35; max-width: 520px;">
  <tr>
    ${avatarImg}
    <td valign="middle" style="border-left: 2px solid ${primaryColor}; padding-left: 14px;">
      <div style="font-size: 14px; font-weight: bold; color: #0f172a;">${fullName}</div>
      <div style="font-size: 11px; color: #64748b;">${activeProfile?.headline || ''} — <strong style="color: ${primaryColor};">${activeProfile?.company || ''}</strong></div>
      <div style="font-size: 11px; color: #475569; margin-top: 4px;">
        ${phoneToUse ? `<span>📞 ${phoneToUse}</span> &nbsp; ` : ''}
        <span>✉️ <a href="mailto:${emailToUse}" style="color: ${primaryColor}; text-decoration: none;">${emailToUse}</a></span>
      </div>
      <div style="margin-top: 6px;">
        <a href="${publicUrl}" style="font-size: 10px; font-weight: bold; color: #ffffff; background-color: ${primaryColor}; padding: 4px 8px; border-radius: 4px; text-decoration: none; display: inline-block;">
          📱 Carte Digitale
        </a>
      </div>
    </td>
  </tr>
  ${ecoBannerHtml}
  ${disclaimerHtml}
</table>
      `.trim();
    }

    if (template === 'executive') {
      return `
<!-- KardX Email Signature (Executive) -->
<table cellpadding="0" cellspacing="0" border="0" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; color: #1e293b; line-height: 1.45; max-width: 580px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px;">
  <tr>
    ${avatarImg}
    <td valign="top" style="padding-left: 6px;">
      <div style="font-size: 16px; font-weight: 800; color: #0f172a; letter-spacing: -0.2px;">${fullName}</div>
      <div style="font-size: 12px; font-weight: 600; color: ${primaryColor}; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.5px;">${activeProfile?.headline || ''}</div>
      <div style="font-size: 13px; font-weight: bold; color: #334155; margin-top: 2px;">${activeProfile?.company || ''}</div>
      
      <div style="margin-top: 10px; font-size: 12px; color: #475569; border-top: 1px solid #e2e8f0; padding-top: 8px;">
        ${phoneToUse ? `<div>📞 <strong style="color: #0f172a;">${phoneToUse}</strong></div>` : ''}
        <div>✉️ <a href="mailto:${emailToUse}" style="color: ${primaryColor}; text-decoration: none; font-weight: 600;">${emailToUse}</a></div>
        <div>🌐 <a href="${websiteToUse}" style="color: #334155; text-decoration: none;">${cleanWebsite}</a></div>
        ${activeProfile?.contacts?.address ? `<div>📍 ${activeProfile.contacts.address}</div>` : ''}
      </div>

      ${socialsHtml}
      ${buttonsHtml}
    </td>
  </tr>
  ${promoBannerHtml}
  ${ecoBannerHtml}
  ${disclaimerHtml}
</table>
      `.trim();
    }

    // Default / Corporate & Modern
    return `
<!-- KardX Email Signature (Corporate) -->
<table cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #1e293b; line-height: 1.45; max-width: 580px;">
  <tr>
    ${avatarImg}
    <td valign="top" style="border-left: 3px solid ${primaryColor}; padding-left: 18px;">
      <div style="font-size: 16px; font-weight: bold; color: #0f172a;">${fullName}</div>
      <div style="font-size: 12px; color: #475569; margin-top: 2px;">${activeProfile?.headline || ''}</div>
      <div style="font-size: 13px; font-weight: bold; color: ${primaryColor}; margin-top: 2px;">${activeProfile?.company || ''}</div>
      
      <div style="margin-top: 10px; font-size: 12px; color: #64748b;">
        ${phoneToUse ? `<div style="margin-bottom: 3px;">📞 <span style="color: #1e293b; font-weight: 600;">${phoneToUse}</span></div>` : ''}
        <div style="margin-bottom: 3px;">✉️ <a href="mailto:${emailToUse}" style="color: ${primaryColor}; text-decoration: none; font-weight: 500;">${emailToUse}</a></div>
        <div style="margin-bottom: 3px;">🌐 <a href="${websiteToUse}" style="color: ${primaryColor}; text-decoration: none;">${cleanWebsite}</a></div>
        ${activeProfile?.contacts?.address ? `<div>📍 ${activeProfile.contacts.address}</div>` : ''}
      </div>

      ${socialsHtml}
      ${buttonsHtml}
    </td>
  </tr>
  ${promoBannerHtml}
  ${ecoBannerHtml}
  ${disclaimerHtml}
</table>
    `.trim();
  };

  /**
   * Copy as rich formatted content into system clipboard
   * Supports modern ClipboardItem API + fallback to selectNode
   */
  const handleCopyRichText = async () => {
    const rawHtml = generateCleanSignatureHtml();
    
    if (navigator.clipboard && window.ClipboardItem) {
      try {
        const textBlob = new Blob([rawHtml.replace(/<[^>]+>/g, ' ')], { type: 'text/plain' });
        const htmlBlob = new Blob([rawHtml], { type: 'text/html' });
        const item = new ClipboardItem({
          'text/html': htmlBlob,
          'text/plain': textBlob,
        });
        await navigator.clipboard.write([item]);
        setCopiedRich(true);
        showToast('Signature copiée ! Collez-la directement (Ctrl+V) dans Gmail, Outlook ou Apple Mail.');
        setTimeout(() => setCopiedRich(false), 3000);
        return;
      } catch (e) {
        console.warn('ClipboardItem API fell back to Range selection:', e);
      }
    }

    // Fallback range copy
    if (previewRef.current) {
      const range = document.createRange();
      range.selectNode(previewRef.current);
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(range);
      try {
        document.execCommand('copy');
        window.getSelection()?.removeAllRanges();
        setCopiedRich(true);
        showToast('Signature copiée avec succès !');
        setTimeout(() => setCopiedRich(false), 3000);
      } catch (err) {
        showToast('Erreur lors de la copie.');
      }
    }
  };

  const handleCopyRawHtml = async () => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(generateCleanSignatureHtml());
      setCopiedHtml(true);
      showToast('Code source HTML copié dans le presse-papier !');
      setTimeout(() => setCopiedHtml(false), 3000);
    }
  };

  const handleDownloadHtmlFile = () => {
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Signature Email KardX - ${fullName}</title>
</head>
<body style="margin: 20px; font-family: Arial, sans-serif;">
${generateCleanSignatureHtml()}
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `signature-kardx-${(activeProfile?.firstName || 'contact').toLowerCase()}-${(activeProfile?.lastName || 'kardx').toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Fichier signature.html téléchargé !');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-slate-800 flex flex-col gap-8">
      
      {/* TOP BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
              Signature Email Pro HTML
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-600" />
              100% Compatible Gmail & Outlook
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Créez une signature email responsive, conforme à votre charte et reliée à votre profil digital NFC & QR.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowGuideModal(true)}
            className="py-2 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
            <span>Guide d'installation</span>
          </button>

          <button
            onClick={handleDownloadHtmlFile}
            className="py-2 px-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
            title="Télécharger le fichier .html pour Outlook desktop ou signature centralisée"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Télécharger .HTML</span>
          </button>

          <button
            onClick={handleCopyRawHtml}
            className="py-2 px-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
          >
            {copiedHtml ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>Copier HTML</span>
          </button>

          <button
            onClick={handleCopyRichText}
            className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-indigo-900/20 transition active:scale-95 cursor-pointer"
          >
            {copiedRich ? <Check className="w-4 h-4 text-emerald-300" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
            <span>Copier la Signature</span>
          </button>
        </div>
      </div>

      {/* MAIN WORKBENCH */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: CUSTOMIZATION CONTROLS (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* PROFILE SELECTOR & TEMPLATE PICKER */}
          <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600" />
                Collaborateur & Profil Source
              </h3>
            </div>

            {/* Profile Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Sélectionner la carte à utiliser :</label>
              <select
                value={activeProfile.id}
                onChange={(e) => {
                  const target = profiles.find((p) => p.id === e.target.value);
                  if (target) setActiveProfile(target);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 cursor-pointer focus:bg-white"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName} — {p.headline} ({p.company || 'KardX'})
                  </option>
                ))}
              </select>
            </div>

            {/* Template Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Modèle de mise en page :</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'corporate', label: 'Corporate' },
                  { id: 'modern', label: 'Moderne' },
                  { id: 'minimal', label: 'Minimal' },
                  { id: 'executive', label: 'Executive' },
                  { id: 'compact', label: 'Compact' },
                ].map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => setTemplate(tpl.id as SignatureTemplateId)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition cursor-pointer text-center ${
                      template === tpl.id
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Palette */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center justify-between">
                <span>Couleur d'accentuation :</span>
                <span className="font-mono text-[11px] text-slate-500">{primaryColor}</span>
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {COLOR_PRESETS.map((col) => (
                  <button
                    key={col.value}
                    onClick={() => setPrimaryColor(col.value)}
                    style={{ backgroundColor: col.value }}
                    className={`w-7 h-7 rounded-full transition-transform cursor-pointer border-2 ${
                      primaryColor === col.value ? 'scale-115 border-white ring-2 ring-indigo-500 shadow-xs' : 'border-transparent hover:scale-105'
                    }`}
                    title={col.name}
                  />
                ))}
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-7 h-7 rounded-full border border-slate-200 cursor-pointer overflow-hidden p-0"
                  title="Couleur personnalisée"
                />
              </div>
            </div>

            {/* Photo & Shape */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Photo & Avatar :</label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showAvatar}
                    onChange={(e) => setShowAvatar(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span>Afficher photo</span>
                </label>

                {showAvatar && (
                  <div className="flex items-center gap-1.5 ml-auto">
                    {[
                      { id: 'round', label: 'Rond' },
                      { id: 'rounded', label: 'Carré doux' },
                      { id: 'square', label: 'Carré' },
                    ].map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setAvatarShape(s.id as any)}
                        className={`px-2 py-1 rounded-lg text-[11px] font-bold border cursor-pointer ${
                          avatarShape === s.id
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* CALL TO ACTION & SOCIAL CHANNELS */}
          <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col gap-4">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Calendar className="w-4 h-4 text-indigo-600" />
              Boutons d'Action & Réseaux
            </h3>

            {/* Primary NFC / QR button toggle */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-4 h-4 text-indigo-600" />
                <div>
                  <p className="text-xs font-bold text-slate-800">Bouton Carte NFC / QR</p>
                  <p className="text-[10px] text-slate-500">Lien direct vers votre fiche digitale KardX</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={showQrBadge}
                onChange={(e) => setShowQrBadge(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600"
              />
            </div>

            {/* Secondary CTA */}
            <div className="flex flex-col gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Bouton Secondaire (Prise de RDV)</span>
                <input
                  type="checkbox"
                  checked={showSecondaryCta}
                  onChange={(e) => setShowSecondaryCta(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600"
                />
              </div>

              {showSecondaryCta && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Texte du bouton</label>
                    <input
                      type="text"
                      value={secondaryCtaText}
                      onChange={(e) => setSecondaryCtaText(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Lien (URL)</label>
                    <input
                      type="url"
                      value={secondaryCtaUrl}
                      onChange={(e) => setSecondaryCtaUrl(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Social Links Config */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-indigo-600" />
                  Liens Réseaux Professionnels
                </span>
                <input
                  type="checkbox"
                  checked={showSocials}
                  onChange={(e) => setShowSocials(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600"
                />
              </div>

              {showSocials && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">LinkedIn</label>
                    <input
                      type="text"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      placeholder="linkedin.com/in/..."
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Twitter / X</label>
                    <input
                      type="text"
                      value={twitterUrl}
                      onChange={(e) => setTwitterUrl(e.target.value)}
                      placeholder="@handle"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                    />
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* ADD-ON BANNERS & LEGAL */}
          <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col gap-3.5 text-xs">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Bandeaux & Mentions Légales
            </h3>

            {/* Eco banner */}
            <label className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 cursor-pointer">
              <div className="flex items-center gap-2">
                <Leaf className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-emerald-950">Mention Écologique (Économisons le papier)</span>
              </div>
              <input
                type="checkbox"
                checked={showEcoBanner}
                onChange={(e) => setShowEcoBanner(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600"
              />
            </label>

            {/* Promo banner */}
            <div className="flex flex-col gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Bandeau d'Annonce / Promo</span>
                <input
                  type="checkbox"
                  checked={customPromoBanner}
                  onChange={(e) => setCustomPromoBanner(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600"
                />
              </div>
              {customPromoBanner && (
                <input
                  type="text"
                  value={customPromoText}
                  onChange={(e) => setCustomPromoText(e.target.value)}
                  placeholder="Texte de l'annonce..."
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              )}
            </div>

            {/* Disclaimer */}
            <div className="flex flex-col gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Clause de Confidentialité Légale</span>
                <input
                  type="checkbox"
                  checked={showDisclaimer}
                  onChange={(e) => setShowDisclaimer(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600"
                />
              </div>
              {showDisclaimer && (
                <textarea
                  rows={2}
                  value={disclaimerText}
                  onChange={(e) => setDisclaimerText(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              )}
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: INTERACTIVE EMAIL CLIENT SIMULATOR (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4 sticky top-6">
          
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Aperçu Réaliste Boîte Email</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase">
                {template}
              </span>
            </div>

            {/* Theme switcher */}
            <div className="flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200">
              <button
                onClick={() => setPreviewTheme('light')}
                className={`py-1 px-2 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                  previewTheme === 'light' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Sun className="w-3 h-3 text-amber-500" />
                <span>Clair</span>
              </button>
              <button
                onClick={() => setPreviewTheme('dark')}
                className={`py-1 px-2 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                  previewTheme === 'dark' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Moon className="w-3 h-3 text-indigo-400" />
                <span>Sombre</span>
              </button>
            </div>
          </div>

          {/* Email Window Mockup */}
          <div className={`rounded-3xl border shadow-sm transition overflow-hidden ${
            previewTheme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            
            {/* Window Header */}
            <div className={`px-5 py-3.5 border-b flex items-center justify-between text-xs ${
              previewTheme === 'dark' ? 'bg-slate-800/80 border-slate-800 text-slate-300' : 'bg-slate-50/80 border-slate-100 text-slate-600'
            }`}>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                </div>
                <span className="font-semibold text-slate-700 ml-2">Nouveau Message — Client Partenaire</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">À : alexandre.partner@b2b.com</span>
            </div>

            {/* Email Body Simulation */}
            <div className="p-6 sm:p-8 flex flex-col gap-6 text-xs leading-relaxed">
              <div className={previewTheme === 'dark' ? 'text-slate-300' : 'text-slate-600'}>
                <p>Bonjour Alexandre,</p>
                <p className="mt-2">
                  Suite à notre échange sur le salon, je vous transmets comme convenu notre synthèse et proposition de collaboration. N'hésitez pas à consulter ma carte digitale ci-dessous ou à planifier un créneau directement dans mon agenda.
                </p>
                <p className="mt-3">Bien cordialement,</p>
              </div>

              {/* THE ACTUAL SIGNATURE RENDERED FOR COPY */}
              <div 
                ref={previewRef}
                className={`p-5 rounded-2xl border transition overflow-x-auto ${
                  previewTheme === 'dark' ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50/50 border-slate-200/80'
                }`}
                dangerouslySetInnerHTML={{ __html: generateCleanSignatureHtml() }}
              />

            </div>

            {/* Bottom Bar inside Email Window */}
            <div className={`px-6 py-3 border-t flex items-center justify-between text-[11px] ${
              previewTheme === 'dark' ? 'bg-slate-800/40 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500'
            }`}>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Rendu HTML certifié sans perte de style
              </span>

              <button
                onClick={handleCopyRichText}
                className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
              >
                Copier maintenant &rarr;
              </button>
            </div>

          </div>

          {/* Quick installation tips */}
          <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-900 text-xs flex items-start gap-3">
            <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong className="text-indigo-950">Conseil d'intégration instantanée :</strong> Cliquez sur <strong>"Copier la Signature"</strong>, puis rendez-vous dans les paramètres de votre messagerie (Gmail, Outlook ou Apple Mail) et collez simplement avec <kbd className="px-1.5 py-0.5 bg-white border border-indigo-200 rounded font-mono text-[10px]">Ctrl+V</kbd> ou <kbd className="px-1.5 py-0.5 bg-white border border-indigo-200 rounded font-mono text-[10px]">Cmd+V</kbd>.
            </div>
          </div>

        </div>

      </div>

      {/* INSTALLATION GUIDE MODAL */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Guide d'Installation de votre Signature Mail
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Suivez les étapes adaptées à votre logiciel ou webmail préféré.
                </p>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Webmail Tabs */}
            <div className="flex border-b border-slate-100 bg-slate-50 px-6 gap-2 pt-2">
              {[
                { id: 'gmail', label: 'Gmail / Google Workspace' },
                { id: 'outlook', label: 'Microsoft Outlook' },
                { id: 'apple', label: 'Apple Mail (Mac / iOS)' },
                { id: 'thunderbird', label: 'Thunderbird' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveGuideTab(tab.id as any)}
                  className={`py-2.5 px-3 text-xs font-bold border-b-2 transition cursor-pointer ${
                    activeGuideTab === tab.id
                      ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-xl shadow-2xs'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex flex-col gap-4 text-xs text-slate-700 leading-relaxed">
              {activeGuideTab === 'gmail' && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0">1</span>
                    <div>
                      <p className="font-bold text-slate-800">Copiez votre signature</p>
                      <p className="text-slate-600 mt-0.5">Cliquez sur le bouton violet <strong>"Copier la Signature"</strong> en haut de la page.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="w-6 h-6 rounded-full bg-slate-700 text-white font-bold flex items-center justify-center shrink-0">2</span>
                    <div>
                      <p className="font-bold text-slate-800">Ouvrez les Paramètres Gmail</p>
                      <p className="text-slate-600 mt-0.5">Dans Gmail, cliquez sur l'icône ⚙️ (Paramètres) en haut à droite &gt; <strong>"Voir tous les paramètres"</strong> &gt; Onglet <strong>"Général"</strong>.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="w-6 h-6 rounded-full bg-slate-700 text-white font-bold flex items-center justify-center shrink-0">3</span>
                    <div>
                      <p className="font-bold text-slate-800">Collez et Enregistrez</p>
                      <p className="text-slate-600 mt-0.5">Faites défiler jusqu'à <strong>"Signature"</strong>, cliquez sur <em>"+ Créer"</em>, puis collez (<kbd className="px-1.5 py-0.5 bg-white border rounded font-mono text-[10px]">Ctrl+V</kbd> / <kbd className="px-1.5 py-0.5 bg-white border rounded font-mono text-[10px]">Cmd+V</kbd>). Enregistrez les modifications en bas de page.</p>
                    </div>
                  </div>
                </div>
              )}

              {activeGuideTab === 'outlook' && (
                <div className="flex flex-col gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <p className="font-bold text-slate-800">Sur Outlook Web (Office 365) :</p>
                    <p className="text-slate-600 mt-1">Paramètres ⚙️ &gt; <strong>Courrier</strong> &gt; <strong>Composer et répondre</strong> &gt; Nouvelle signature &gt; Collez directement dans l'éditeur.</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <p className="font-bold text-slate-800">Sur Outlook Bureau (Windows / Mac) :</p>
                    <p className="text-slate-600 mt-1">Fichier &gt; Options &gt; Courrier &gt; Signatures &gt; Nouveau &gt; Collez votre signature dans la zone de texte.</p>
                  </div>
                </div>
              )}

              {activeGuideTab === 'apple' && (
                <div className="flex flex-col gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <p className="font-bold text-slate-800">Sur macOS Apple Mail :</p>
                    <p className="text-slate-600 mt-1">Mail &gt; <strong>Réglages (Préférences)</strong> &gt; Onglet <strong>Signatures</strong> &gt; Ajoutez une signature &gt; Décochez <em>"Toujours utiliser la police par défaut"</em> &gt; Collez avec Cmd+V.</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <p className="font-bold text-slate-800">Sur iPhone / iPad (iOS) :</p>
                    <p className="text-slate-600 mt-1">Réglages iOS &gt; <strong>Mail</strong> &gt; <strong>Signature</strong> &gt; Collez la signature, secouez l'appareil pour annuler la modification de style d'Apple Mail si demandé.</p>
                  </div>
                </div>
              )}

              {activeGuideTab === 'thunderbird' && (
                <div className="flex flex-col gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <p className="font-bold text-slate-800">Sur Mozilla Thunderbird :</p>
                    <p className="text-slate-600 mt-1">Outils &gt; <strong>Paramètres des comptes</strong> &gt; Cochez <em>"Utiliser du HTML"</em> &gt; Cliquez sur "Copier HTML" sur KardX et collez le code source directement.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <button
                onClick={handleCopyRichText}
                className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Copier la signature maintenant</span>
              </button>

              <button
                onClick={() => setShowGuideModal(false)}
                className="py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 cursor-pointer"
              >
                Fermer
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
