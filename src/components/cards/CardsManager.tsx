import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { PhysicalCard, CardStatus, CardMaterial } from '../../types';
import { 
  generateQRCodeDataUrl, 
  downloadHighResQRPng, 
  downloadQRSvg, 
  copyQRCodeToClipboard,
  QRCodeCustomOptions 
} from '../../utils/qr';
import { QrPrintModal } from './QrPrintModal';
import { BatchNfcWriter } from './BatchNfcWriter';
import { 
  CreditCard, 
  Wifi, 
  QrCode, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  Download, 
  Sparkles, 
  Printer,
  Copy,
  Check,
  Image as ImageIcon,
  Sliders,
  FileCode,
  Layers,
  Info,
  Maximize2,
  Radio,
  Zap,
  ArrowRight
} from 'lucide-react';

const COLOR_PRESETS = [
  { name: 'Noir Onyx', hex: '#0f172a' },
  { name: 'Indigo KardX', hex: '#4f46e5' },
  { name: 'Bleu Royal', hex: '#1d4ed8' },
  { name: 'Émeraude', hex: '#059669' },
  { name: 'Or & Bronze', hex: '#b45309' },
  { name: 'Bordeaux', hex: '#9f1239' },
];

export const CardsManager: React.FC = () => {
  const { 
    currentUser,
    visibleCards, 
    visibleProfiles, 
    activeProfile, 
    addCard, 
    updateCardStatus, 
    deleteCard, 
    setIsNfcSimModalOpen,
    hasUserPermission,
    showToast 
  } = useApp();

  const cards = visibleCards;
  const profiles = visibleProfiles;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'inventory' | 'batch_nfc' | 'qr_studio'>('inventory');

  // Selected profile for QR generation
  const [selectedProfileId, setSelectedProfileId] = useState<string>(activeProfile.id);

  // QR Studio Customization Options
  const [exportFormat, setExportFormat] = useState<'svg' | 'png_4k' | 'png_hd' | 'png_web'>('svg');
  const [qrDarkColor, setQrDarkColor] = useState('#0f172a');
  const [qrLightColor, setQrLightColor] = useState('#ffffff');
  const [isTransparentBg, setIsTransparentBg] = useState(false);
  const [includeCenterLogo, setIncludeCenterLogo] = useState(true);
  const [includeFrameText, setIncludeFrameText] = useState(false);
  const [frameText, setFrameText] = useState('Scannez pour me contacter');
  const [qrMargin, setQrMargin] = useState<number>(2);

  const [qrPreviewDataUrl, setQrPreviewDataUrl] = useState('');
  const [isCopiedClipboard, setIsCopiedClipboard] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // New card form state
  const [newCardName, setNewCardName] = useState('');
  const [newCardUid, setNewCardUid] = useState('');
  const [newCardMaterial, setNewCardMaterial] = useState<CardMaterial>('metal_black');
  const [newCardProfileId, setNewCardProfileId] = useState(activeProfile.id);

  const currentProfile = profiles.find((p) => p.id === selectedProfileId) || activeProfile;
  const currentProfileUrl = `${window.location.origin}/p/${currentProfile.slug}`;

  // Generate QR Code preview whenever options change
  useEffect(() => {
    let isMounted = true;
    setIsGenerating(true);

    const options: QRCodeCustomOptions = {
      width: 600,
      margin: qrMargin,
      color: {
        dark: qrDarkColor,
        light: qrLightColor,
      },
      transparentBackground: isTransparentBg,
      centerLogoUrl: includeCenterLogo ? currentProfile.avatarUrl : undefined,
      centerText: includeCenterLogo && !currentProfile.avatarUrl ? `${currentProfile.firstName[0] || ''}${currentProfile.lastName[0] || ''}` : undefined,
      frameText: includeFrameText ? frameText : undefined,
      errorCorrectionLevel: includeCenterLogo ? 'H' : 'M',
    };

    generateQRCodeDataUrl(currentProfileUrl, options)
      .then((dataUrl) => {
        if (isMounted) {
          setQrPreviewDataUrl(dataUrl);
          setIsGenerating(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsGenerating(false);
      });

    return () => {
      isMounted = false;
    };
  }, [
    currentProfileUrl, 
    qrDarkColor, 
    qrLightColor, 
    isTransparentBg, 
    includeCenterLogo, 
    includeFrameText, 
    frameText, 
    qrMargin, 
    currentProfile
  ]);

  const handleCreateCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardName.trim()) {
      showToast('Veuillez donner un nom à la carte.');
      return;
    }

    const token = `krd_${Math.random().toString(36).substring(2, 9)}`;
    const uid = newCardUid.trim() || `04:${Math.floor(Math.random()*89+10).toString(16).toUpperCase()}:${Math.floor(Math.random()*89+10).toString(16).toUpperCase()}:${Math.floor(Math.random()*89+10).toString(16).toUpperCase()}`;

    addCard({
      name: newCardName.trim(),
      uid,
      token,
      material: newCardMaterial,
      profileId: newCardProfileId,
      organizationId: activeProfile.organizationId,
      status: 'active',
    });

    setIsAddModalOpen(false);
    setNewCardName('');
    setNewCardUid('');
    showToast('Nouvelle carte NFC associée avec succès !');
  };

  // Perform selected export
  const handleExport = async () => {
    const filenamePrefix = `kardx_${currentProfile.slug}_qr`;
    const options: QRCodeCustomOptions = {
      margin: qrMargin,
      color: { dark: qrDarkColor, light: qrLightColor },
      transparentBackground: isTransparentBg,
      centerLogoUrl: includeCenterLogo ? currentProfile.avatarUrl : undefined,
      centerText: includeCenterLogo && !currentProfile.avatarUrl ? `${currentProfile.firstName[0] || ''}${currentProfile.lastName[0] || ''}` : undefined,
      frameText: includeFrameText ? frameText : undefined,
      errorCorrectionLevel: includeCenterLogo ? 'H' : 'M',
    };

    if (exportFormat === 'svg') {
      await downloadQRSvg(currentProfileUrl, `${filenamePrefix}_vector.svg`, options);
      showToast('QR Code Vectoriel SVG téléchargé (Prêt pour Illustrator/Figma/Impression grand format)');
    } else if (exportFormat === 'png_4k') {
      await downloadHighResQRPng(currentProfileUrl, `${filenamePrefix}_4096px_300dpi.png`, {
        ...options,
        width: 4096,
      });
      showToast('QR Code Ultra-HD 4K (4096px) téléchargé (Qualité imprimerie 300 DPI)');
    } else if (exportFormat === 'png_hd') {
      await downloadHighResQRPng(currentProfileUrl, `${filenamePrefix}_2048px_print.png`, {
        ...options,
        width: 2048,
      });
      showToast('QR Code Haute Résolution (2048px) téléchargé (Flyers, Cartes, Stands)');
    } else {
      await downloadHighResQRPng(currentProfileUrl, `${filenamePrefix}_1024px_web.png`, {
        ...options,
        width: 1024,
      });
      showToast('QR Code Standard (1024px) téléchargé (Écrans & Présentations)');
    }
  };

  // Copy PNG image to clipboard
  const handleCopyToClipboard = async () => {
    const options: QRCodeCustomOptions = {
      width: 1024,
      margin: qrMargin,
      color: { dark: qrDarkColor, light: qrLightColor },
      transparentBackground: isTransparentBg,
      centerLogoUrl: includeCenterLogo ? currentProfile.avatarUrl : undefined,
      frameText: includeFrameText ? frameText : undefined,
      errorCorrectionLevel: includeCenterLogo ? 'H' : 'M',
    };

    const success = await copyQRCodeToClipboard(currentProfileUrl, options);
    if (success) {
      setIsCopiedClipboard(true);
      showToast('Image du QR Code copiée dans le presse-papier ! (Collez dans Canva, Word ou Photoshop)');
      setTimeout(() => setIsCopiedClipboard(false), 2500);
    } else {
      showToast('Impossible de copier l\'image automatiquement sur ce navigateur.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-slate-800 flex flex-col gap-8">
      
      {/* HEADER & TABS NAVIGATION */}
      <div className="flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
              <span>Gestion des Cartes & Programmation NFC</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-200">
                13.56 MHz
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Programmez vos puces NFC en série via Web NFC, gérez votre parc physique et exportez des QR codes vectoriels pour l'imprimerie.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsNfcSimModalOpen(true)}
              className="py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 shadow-xs flex items-center gap-2 transition cursor-pointer"
            >
              <Wifi className="w-4 h-4 text-indigo-600 rotate-90" />
              <span>Simulateur Tap NFC</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-indigo-900/20 transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Associer une carte</span>
            </button>
          </div>
        </div>

        {/* THREE-ZONE TAB BAR */}
        <div className="flex items-center p-1 rounded-2xl bg-slate-100 border border-slate-200/80 w-fit max-w-full overflow-x-auto">
          <button
            onClick={() => setActiveTab('batch_nfc')}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'batch_nfc'
                ? 'bg-white text-indigo-900 shadow-xs ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Radio className={`w-4 h-4 ${activeTab === 'batch_nfc' ? 'text-indigo-600' : 'text-slate-400'}`} />
            <span>Programmation NFC en Série (Batch Write)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-700">
              Web NFC
            </span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'inventory'
                ? 'bg-white text-indigo-900 shadow-xs ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className={`w-4 h-4 ${activeTab === 'inventory' ? 'text-indigo-600' : 'text-slate-400'}`} />
            <span>Parc & Cartes Actives</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
              {cards.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('qr_studio')}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'qr_studio'
                ? 'bg-white text-indigo-900 shadow-xs ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode className={`w-4 h-4 ${activeTab === 'qr_studio' ? 'text-indigo-600' : 'text-slate-400'}`} />
            <span>Studio QR Codes & Impression</span>
          </button>
        </div>
      </div>

      {/* TAB 1: BATCH NFC WRITER */}
      {activeTab === 'batch_nfc' && (
        <BatchNfcWriter onCardRegistered={() => showToast('Nouvelle carte ajoutée au parc avec succès !')} />
      )}

      {/* TAB 2: INVENTORY & ACTIVE CARDS */}
      {activeTab === 'inventory' && (
        <div className="flex flex-col gap-6">
          
          {/* Quick CTA to Batch NFC writer */}
          <div className="p-5 rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
                <Radio className="w-6 h-6 animate-pulse text-indigo-400" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <span>Encodeur NFC en Série (Web NFC)</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Prêt
                  </span>
                </h3>
                <p className="text-xs text-indigo-200 mt-0.5">
                  Besoin d'encoder plusieurs cartes ou badges pour votre équipe en séquence rapide ? Utilisez notre module Web NFC automatisé.
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('batch_nfc')}
              className="py-2.5 px-4 rounded-xl bg-white text-indigo-950 hover:bg-indigo-50 font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition active:scale-98 cursor-pointer shrink-0"
            >
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Ouvrir l'Encodeur en Série</span>
              <ArrowRight className="w-4 h-4 text-indigo-600" />
            </button>
          </div>

          {/* Cards Inventory List Table */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-base text-slate-800">Parc de Cartes Actives & Matériaux ({cards.length})</h3>
                <p className="text-xs text-slate-500">Puces NTAG213 / NTAG216 physiques rattachées à votre organisation</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter une carte</span>
                </button>
              </div>
            </div>

            {/* Cards table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50 border-b border-slate-100 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Carte / Matériau</th>
                    <th className="py-3 px-4">Profil Assigné</th>
                    <th className="py-3 px-4">UID Puce NFC</th>
                    <th className="py-3 px-4">Scans</th>
                    <th className="py-3 px-4">Statut</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {cards.map((c) => {
                    const assignedProfile = profiles.find((p) => p.id === c.profileId);
                    const isSelectedForQr = selectedProfileId === c.profileId;

                    return (
                      <tr 
                        key={c.id} 
                        className={`hover:bg-slate-50/80 transition ${isSelectedForQr ? 'bg-indigo-50/40' : ''}`}
                      >
                        {/* Name & Material */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                              c.material === 'wood_bamboo' 
                                ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                                : c.material === 'metal_black'
                                ? 'bg-slate-900 text-white'
                                : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                            }`}>
                              <CreditCard className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-xs">{c.name}</p>
                              <p className="text-[10px] text-slate-500 capitalize">{c.material.replace('_', ' ')}</p>
                            </div>
                          </div>
                        </td>

                        {/* Profile */}
                        <td className="py-4 px-4">
                          {assignedProfile ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-800">{assignedProfile.firstName} {assignedProfile.lastName}</span>
                              <span className="text-[10px] text-slate-500 font-mono">(/p/{assignedProfile.slug})</span>
                            </div>
                          ) : (
                            <span className="text-rose-600 font-medium">Non rattaché</span>
                          )}
                        </td>

                        {/* UID */}
                        <td className="py-4 px-4 font-mono text-[11px] text-slate-500">
                          {c.uid}
                        </td>

                        {/* Scans count */}
                        <td className="py-4 px-4 font-bold text-slate-800">
                          {c.scansCount.toLocaleString('fr-FR')}
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4">
                          <select
                            value={c.status}
                            onChange={(e) => updateCardStatus(c.id, e.target.value as CardStatus)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                              c.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : c.status === 'suspended'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            <option value="active">ACTIVE</option>
                            <option value="suspended">SUSPENDUE</option>
                            <option value="lost">PERDUE</option>
                            <option value="disabled">DÉSACTIVÉE</option>
                          </select>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                if (c.profileId) setSelectedProfileId(c.profileId);
                                setActiveTab('qr_studio');
                                showToast(`QR Code configuré pour le profil de ${assignedProfile?.firstName || 'cette carte'}`);
                              }}
                              className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition cursor-pointer"
                              title="Générer & exporter le QR Code de ce profil"
                            >
                              <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                            </button>
                            <button
                              onClick={() => deleteCard(c.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 flex items-start gap-3 mt-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <p>
                <strong className="text-slate-800">Sécurité & Continuité :</strong> En cas de perte d’une carte physique, passez-la immédiatement en statut <span className="text-amber-700 font-bold">SUSPENDUE</span>. Le profil digital reste accessible via QR et lien direct, et l’historique des prospects est préservé.
              </p>
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: DEDICATED QR CODE PRINT & EXPORT STUDIO */}
      {activeTab === 'qr_studio' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col gap-6">
        
        {/* Studio Title & Profile Selector */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                Studio d'Export & Impression QR Code (SVG / PNG / Print)
              </h3>
              <p className="text-xs text-slate-500">
                Générez des fichiers prêts pour l'impression sur cartes, chevalets, flyers, roll-ups et stands de salon.
              </p>
            </div>
          </div>

          {/* Profile Picker for QR code */}
          <div className="flex items-center gap-2.5 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-600 pl-2">Profil source :</span>
            <select
              value={selectedProfileId}
              onChange={(e) => setSelectedProfileId(e.target.value)}
              className="py-1.5 px-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 font-bold shadow-2xs focus:outline-none cursor-pointer"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName} ({p.company || 'KardX'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Studio Grid: Preview on Left, Settings & Formats on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* PREVIEW & ONE-CLICK ACTIONS (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            
            {/* Visual Canvas Box */}
            <div className={`p-8 rounded-3xl border flex flex-col items-center justify-center min-h-[340px] relative transition-colors ${
              isTransparentBg 
                ? 'bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] bg-slate-50 border-slate-200' 
                : 'bg-slate-50 border-slate-100'
            }`}>
              
              {isGenerating ? (
                <div className="w-56 h-56 rounded-2xl bg-slate-200 animate-pulse flex items-center justify-center text-xs text-slate-500 font-medium">
                  Rendu haute fidélité...
                </div>
              ) : qrPreviewDataUrl ? (
                <div className="p-4 bg-white rounded-2xl shadow-md border border-slate-100 flex flex-col items-center">
                  <img 
                    src={qrPreviewDataUrl} 
                    alt="Aperçu QR Code" 
                    className="w-52 h-auto object-contain max-h-64 select-none" 
                  />
                </div>
              ) : null}

              <div className="mt-4 text-center">
                <span className="text-[11px] font-mono font-medium text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-2xs">
                  /p/{currentProfile.slug}
                </span>
              </div>
            </div>

            {/* Quick Actions Row */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={handleCopyToClipboard}
                className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                {isCopiedClipboard ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                <span>Copier l'image</span>
              </button>

              <button
                onClick={() => setIsPrintModalOpen(true)}
                className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Printer className="w-4 h-4 text-indigo-600" />
                <span>Gabarit Chevalet A4</span>
              </button>
            </div>
          </div>

          {/* CUSTOMIZATION & FORMATS (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* 1. Format Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                1. Choisissez le format & la résolution d'exportation
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                
                {/* SVG Vector */}
                <button
                  type="button"
                  onClick={() => setExportFormat('svg')}
                  className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition cursor-pointer ${
                    exportFormat === 'svg'
                      ? 'bg-indigo-50/70 border-indigo-500 ring-1 ring-indigo-500'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                  }`}
                >
                  <div className={`p-2 rounded-xl shrink-0 ${exportFormat === 'svg' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>
                    <FileCode className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-slate-800">SVG Vectoriel</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-100 text-indigo-700">Recommandé</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Échelle infinie sans perte, idéal pour Illustrator, Figma, kakemonos & imprimeurs.
                    </p>
                  </div>
                </button>

                {/* PNG 4K 300DPI */}
                <button
                  type="button"
                  onClick={() => setExportFormat('png_4k')}
                  className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition cursor-pointer ${
                    exportFormat === 'png_4k'
                      ? 'bg-indigo-50/70 border-indigo-500 ring-1 ring-indigo-500'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                  }`}
                >
                  <div className={`p-2 rounded-xl shrink-0 ${exportFormat === 'png_4k' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-slate-800">PNG Ultra-HD (4096px)</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-200 text-slate-700">300 DPI</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Résolution maximale pour catalogues offset, flyers épais et bâches publicitaires.
                    </p>
                  </div>
                </button>

                {/* PNG HD 2048px */}
                <button
                  type="button"
                  onClick={() => setExportFormat('png_hd')}
                  className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition cursor-pointer ${
                    exportFormat === 'png_hd'
                      ? 'bg-indigo-50/70 border-indigo-500 ring-1 ring-indigo-500'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                  }`}
                >
                  <div className={`p-2 rounded-xl shrink-0 ${exportFormat === 'png_hd' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-800">PNG Haute Résolution (2048px)</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Parfait pour cartes de visite physiques, stickers adhésifs et badges événementiels.
                    </p>
                  </div>
                </button>

                {/* PNG Web 1024px */}
                <button
                  type="button"
                  onClick={() => setExportFormat('png_web')}
                  className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition cursor-pointer ${
                    exportFormat === 'png_web'
                      ? 'bg-indigo-50/70 border-indigo-500 ring-1 ring-indigo-500'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                  }`}
                >
                  <div className={`p-2 rounded-xl shrink-0 ${exportFormat === 'png_web' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-800">PNG Standard (1024px)</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Idéal pour diapositives PowerPoint/Keynote, newsletters et signatures graphiques.
                    </p>
                  </div>
                </button>

              </div>
            </div>

            {/* 2. Colors & Background */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                2. Couleurs & Charte Graphique
              </label>

              {/* Swatch chips */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.hex}
                    type="button"
                    onClick={() => setQrDarkColor(preset.hex)}
                    className={`flex items-center gap-1.5 py-1 px-2.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                      qrDarkColor === preset.hex 
                        ? 'bg-slate-800 text-white border-slate-800 shadow-2xs' 
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: preset.hex }}></span>
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>

              {/* Advanced Color pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Foreground Dark */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Couleur des Motifs</p>
                    <p className="text-[10px] text-slate-500">Contraste élevé recommandé</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={qrDarkColor}
                      onChange={(e) => setQrDarkColor(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <span className="text-xs font-mono font-bold text-slate-700 uppercase">{qrDarkColor}</span>
                  </div>
                </div>

                {/* Background Light or Transparent */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Arrière-Plan</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isTransparentBg}
                          onChange={(e) => setIsTransparentBg(e.target.checked)}
                          className="rounded text-indigo-600 w-3.5 h-3.5"
                        />
                        <span>Transparent</span>
                      </label>
                    </div>
                  </div>

                  {!isTransparentBg && (
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={qrLightColor}
                        onChange={(e) => setQrLightColor(e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                      <span className="text-xs font-mono font-bold text-slate-700 uppercase">{qrLightColor}</span>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* 3. Enhancements: Logo, Frame text, Margin */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                3. Options Avancées (Logo au centre, Cadre & Marge)
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                {/* Center Logo Toggle */}
                <label className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between gap-2 cursor-pointer hover:bg-slate-100/60 transition">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Avatar / Logo Central</span>
                    <input
                      type="checkbox"
                      checked={includeCenterLogo}
                      onChange={(e) => setIncludeCenterLogo(e.target.checked)}
                      className="rounded text-indigo-600 w-4 h-4 cursor-pointer"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">Incruste l'avatar du profil avec badge de correction d'erreur maximale (30%).</p>
                </label>

                {/* Margin / Quiet Zone */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between gap-2">
                  <span className="text-xs font-bold text-slate-800">Marge Blanche (Quiet Zone)</span>
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { val: 0, label: '0' },
                      { val: 1, label: '1' },
                      { val: 2, label: '2' },
                      { val: 4, label: '4' },
                    ].map((m) => (
                      <button
                        key={m.val}
                        type="button"
                        onClick={() => setQrMargin(m.val)}
                        className={`py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          qrMargin === m.val 
                            ? 'bg-indigo-600 text-white shadow-2xs' 
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Frame CTA Text Toggle */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Bannière CTA</span>
                    <input
                      type="checkbox"
                      checked={includeFrameText}
                      onChange={(e) => setIncludeFrameText(e.target.checked)}
                      className="rounded text-indigo-600 w-4 h-4 cursor-pointer"
                    />
                  </div>
                  {includeFrameText ? (
                    <input
                      type="text"
                      value={frameText}
                      onChange={(e) => setFrameText(e.target.value)}
                      placeholder="Texte sous le QR..."
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-800 font-semibold"
                    />
                  ) : (
                    <p className="text-[10px] text-slate-500">Ajoute une mention textuelle d'incitation au scan sous le QR code.</p>
                  )}
                </div>

              </div>
            </div>

            {/* Main Export Action Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleExport}
                className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-md shadow-indigo-900/20 transition active:scale-98 cursor-pointer"
              >
                <Download className="w-5 h-5" />
                <span>
                  {exportFormat === 'svg' && 'Télécharger le QR Code Vectoriel (.SVG)'}
                  {exportFormat === 'png_4k' && 'Télécharger le QR Code Ultra-HD 4K (4096px .PNG)'}
                  {exportFormat === 'png_hd' && 'Télécharger le QR Code Haute Résolution (2048px .PNG)'}
                  {exportFormat === 'png_web' && 'Télécharger le QR Code Standard (1024px .PNG)'}
                </span>
              </button>
            </div>

          </div>

        </div>

        {/* PRINT SIZES & DISTANCE GUIDE BANNER */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600">
          <div className="flex items-center gap-2 font-bold text-slate-800 mb-2">
            <Info className="w-4 h-4 text-indigo-600" />
            <span>Guide de dimensionnement physique pour supports imprimés</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-3">
            <div className="p-3 rounded-xl bg-white border border-slate-200">
              <p className="font-bold text-slate-800 text-xs">Carte de Visite / Badge</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Taille min : <strong className="text-indigo-600">2,5 x 2,5 cm</strong></p>
              <p className="text-[10px] text-slate-400">Scan à 20-30 cm de distance</p>
            </div>

            <div className="p-3 rounded-xl bg-white border border-slate-200">
              <p className="font-bold text-slate-800 text-xs">Flyer / Plaquette A5</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Taille min : <strong className="text-indigo-600">3,5 x 3,5 cm</strong></p>
              <p className="text-[10px] text-slate-400">Scan à 40-50 cm de distance</p>
            </div>

            <div className="p-3 rounded-xl bg-white border border-slate-200">
              <p className="font-bold text-slate-800 text-xs">Chevalet de Table / Comptoir</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Taille min : <strong className="text-indigo-600">6,0 x 6,0 cm</strong></p>
              <p className="text-[10px] text-slate-400">Scan jusqu'à 1 m de distance</p>
            </div>

            <div className="p-3 rounded-xl bg-white border border-slate-200">
              <p className="font-bold text-slate-800 text-xs">Kakemono / Roll-up Salon</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Taille min : <strong className="text-indigo-600">12,0 x 12,0 cm</strong></p>
              <p className="text-[10px] text-slate-400">Scan jusqu'à 2-3 m (utilisez le SVG)</p>
            </div>
          </div>
        </div>

      </div>
      )}

      {/* MODAL: ADD NEW CARD */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-800 animate-in fade-in zoom-in duration-200">
            <h3 className="font-bold text-lg text-slate-800 mb-1">Associer une carte physique</h3>
            <p className="text-xs text-slate-500 mb-5">Renseignez les détails du support NFC / QR à rattacher.</p>

            <form onSubmit={handleCreateCard} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nom / Libellé de la carte</label>
                <input
                  type="text"
                  required
                  placeholder="Ex : Carte Métal Noire - David"
                  value={newCardName}
                  onChange={(e) => setNewCardName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Matériau & Format</label>
                <select
                  value={newCardMaterial}
                  onChange={(e) => setNewCardMaterial(e.target.value as CardMaterial)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-semibold focus:bg-white cursor-pointer"
                >
                  <option value="metal_black">Métal Noir Mat Gravé</option>
                  <option value="metal_silver">Métal Argent Brossé</option>
                  <option value="metal_gold">Métal Or Prestige</option>
                  <option value="wood_bamboo">Bois Bambou Écologique</option>
                  <option value="pvc_matte">PVC Soft-Touch Recyclé</option>
                  <option value="qr_stand">Chevalet / Stand d’accueil</option>
                  <option value="virtual">Carte Virtuelle Smartphone</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Rattacher au Profil</label>
                <select
                  value={newCardProfileId}
                  onChange={(e) => setNewCardProfileId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-semibold focus:bg-white cursor-pointer"
                >
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} ({p.company})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">UID Puce NFC (Optionnel)</label>
                <input
                  type="text"
                  placeholder="Ex: 04:A2:3F:89:C1 (Généré automatiquement si vide)"
                  value={newCardUid}
                  onChange={(e) => setNewCardUid(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-mono focus:bg-white"
                />
              </div>

              <div className="flex gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-900/20 cursor-pointer"
                >
                  Associer la carte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PRINT TENT STAND / FLYER TEMPLATE */}
      <QrPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        profile={currentProfile}
        qrDataUrl={qrPreviewDataUrl}
        customCtaText={frameText}
      />

    </div>
  );
};
