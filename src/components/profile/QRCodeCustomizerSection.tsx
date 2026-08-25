import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { QRCustomizationConfig } from '../../types';
import { ImageUploadModal } from '../common/ImageUploadModal';
import { 
  generateQRCodeDataUrl, 
  downloadHighResQRPng, 
  downloadQRSvg, 
  copyQRCodeToClipboard,
  QRCodeCustomOptions 
} from '../../utils/qr';
import {
  QrCode,
  Sparkles,
  Palette,
  Image as ImageIcon,
  Upload,
  Camera,
  Layers,
  Circle,
  Square,
  Copy,
  Download,
  Check,
  RotateCcw,
  Sliders,
  CheckCircle2,
  Brush,
  Zap,
  Type,
  FileDown
} from 'lucide-react';

const GRADIENT_PRESETS: Array<{
  id: string;
  name: string;
  start: string;
  end: string;
  type: 'linear_diagonal' | 'linear_horizontal' | 'linear_vertical' | 'radial';
}> = [
  { id: 'indigo_violet', name: 'Indigo Royal', start: '#4f46e5', end: '#7c3aed', type: 'linear_diagonal' },
  { id: 'ocean_blue', name: 'Bleu Océan', start: '#0284c7', end: '#0ea5e9', type: 'linear_diagonal' },
  { id: 'prestige_gold', name: 'Or & Ambre Prestige', start: '#b45309', end: '#f59e0b', type: 'linear_diagonal' },
  { id: 'emerald_teal', name: 'Émeraude Bio', start: '#059669', end: '#10b981', type: 'linear_diagonal' },
  { id: 'sunset_rose', name: 'Coucher de Soleil', start: '#e11d48', end: '#f97316', type: 'linear_diagonal' },
  { id: 'midnight_obsidian', name: 'Obsidienne Cyber', start: '#0f172a', end: '#334155', type: 'linear_diagonal' },
  { id: 'purple_magenta', name: 'Cosmic Magenta', start: '#9333ea', end: '#db2777', type: 'linear_diagonal' },
  { id: 'brand_dual', name: 'Charte Entreprise', start: '#1e3a8a', end: '#3b82f6', type: 'linear_diagonal' },
];

export const QRCodeCustomizerSection: React.FC = () => {
  const { activeProfile, updateTheme, currentOrg, showToast } = useApp();
  
  const currentTheme = activeProfile.theme;
  const qrConfig: QRCustomizationConfig = currentTheme.qrCustomization || {
    centerLogoUrl: activeProfile.logoUrl || currentOrg.logoUrl,
    logoShape: 'circle',
    logoSize: 'medium',
    logoBgColor: '#ffffff',
    enableGradient: true,
    gradientType: 'linear_diagonal',
    gradientStartColor: currentTheme.primaryColor || '#1e3a8a',
    gradientEndColor: currentTheme.accentColor || '#3b82f6',
    dotColor: currentTheme.primaryColor || '#0f172a',
    bgColor: '#ffffff',
    transparentBg: false,
    frameText: 'Scannez ma carte',
  };

  const [centerLogoUrl, setCenterLogoUrl] = useState<string>(qrConfig.centerLogoUrl || activeProfile.logoUrl || currentOrg.logoUrl || '');
  const [logoShape, setLogoShape] = useState<'circle' | 'square' | 'rounded'>(qrConfig.logoShape || 'circle');
  const [logoSize, setLogoSize] = useState<'small' | 'medium' | 'large'>(qrConfig.logoSize || 'medium');
  const [logoBgColor, setLogoBgColor] = useState<string>(qrConfig.logoBgColor || '#ffffff');
  const [enableLogo, setEnableLogo] = useState<boolean>(!!(qrConfig.centerLogoUrl || activeProfile.logoUrl || currentOrg.logoUrl));

  const [enableGradient, setEnableGradient] = useState<boolean>(qrConfig.enableGradient ?? true);
  const [gradientType, setGradientType] = useState<'linear_diagonal' | 'linear_horizontal' | 'linear_vertical' | 'radial'>(
    qrConfig.gradientType || 'linear_diagonal'
  );
  const [gradientStartColor, setGradientStartColor] = useState<string>(qrConfig.gradientStartColor || currentTheme.primaryColor || '#1e3a8a');
  const [gradientEndColor, setGradientEndColor] = useState<string>(qrConfig.gradientEndColor || currentTheme.accentColor || '#3b82f6');
  const [dotColor, setDotColor] = useState<string>(qrConfig.dotColor || '#0f172a');
  const [bgColor, setBgColor] = useState<string>(qrConfig.bgColor || '#ffffff');
  const [transparentBg, setTransparentBg] = useState<boolean>(qrConfig.transparentBg || false);
  const [includeFrameText, setIncludeFrameText] = useState<boolean>(!!qrConfig.frameText);
  const [frameText, setFrameText] = useState<string>(qrConfig.frameText || 'Scannez ma carte');

  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [qrPreviewUrl, setQrPreviewUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const publicUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/p/${activeProfile.slug}`;

  // Sync back to theme state whenever any property changes
  const handleSaveToTheme = (overrides?: Partial<QRCustomizationConfig>) => {
    const updatedQrConfig: QRCustomizationConfig = {
      centerLogoUrl: enableLogo ? centerLogoUrl : undefined,
      logoShape,
      logoSize,
      logoBgColor,
      enableGradient,
      gradientType,
      gradientStartColor,
      gradientEndColor,
      dotColor,
      bgColor,
      transparentBg,
      frameText: includeFrameText ? frameText : undefined,
      ...overrides,
    };

    updateTheme({
      qrCustomization: updatedQrConfig,
    });
  };

  // Re-generate QR preview on every parameter change
  useEffect(() => {
    let isMounted = true;
    setIsGenerating(true);

    const options: QRCodeCustomOptions = {
      width: 800,
      margin: 2,
      color: {
        dark: dotColor,
        light: bgColor,
      },
      enableGradient,
      gradientType,
      gradientStartColor,
      gradientEndColor,
      centerLogoUrl: enableLogo && centerLogoUrl ? centerLogoUrl : undefined,
      logoShape,
      logoSize,
      logoBgColor,
      frameText: includeFrameText ? frameText : undefined,
      transparentBackground: transparentBg,
      errorCorrectionLevel: enableLogo ? 'H' : 'M',
    };

    generateQRCodeDataUrl(publicUrl, options)
      .then((dataUrl) => {
        if (isMounted) {
          setQrPreviewUrl(dataUrl);
          setIsGenerating(false);
        }
      })
      .catch((e) => {
        console.error(e);
        if (isMounted) setIsGenerating(false);
      });

    return () => {
      isMounted = false;
    };
  }, [
    publicUrl,
    enableLogo,
    centerLogoUrl,
    logoShape,
    logoSize,
    logoBgColor,
    enableGradient,
    gradientType,
    gradientStartColor,
    gradientEndColor,
    dotColor,
    bgColor,
    transparentBg,
    includeFrameText,
    frameText,
  ]);

  // Apply gradient preset
  const handleApplyGradientPreset = (preset: typeof GRADIENT_PRESETS[0]) => {
    setEnableGradient(true);
    setGradientStartColor(preset.start);
    setGradientEndColor(preset.end);
    setGradientType(preset.type);
    handleSaveToTheme({
      enableGradient: true,
      gradientStartColor: preset.start,
      gradientEndColor: preset.end,
      gradientType: preset.type,
    });
    showToast(`Dégradé "${preset.name}" appliqué au QR Code !`);
  };

  // Export handlers
  const handleDownloadPng = async () => {
    await downloadHighResQRPng(publicUrl, `kardx_qrcode_${activeProfile.slug}.png`, {
      width: 2048,
      enableGradient,
      gradientType,
      gradientStartColor,
      gradientEndColor,
      centerLogoUrl: enableLogo && centerLogoUrl ? centerLogoUrl : undefined,
      logoShape,
      logoSize,
      logoBgColor,
      frameText: includeFrameText ? frameText : undefined,
      transparentBackground: transparentBg,
      color: { dark: dotColor, light: bgColor },
    });
    showToast('QR Code HD (2048px) téléchargé !');
  };

  const handleDownloadSvg = async () => {
    await downloadQRSvg(publicUrl, `kardx_qrcode_${activeProfile.slug}.svg`, {
      enableGradient,
      gradientStartColor,
      gradientEndColor,
      transparentBackground: transparentBg,
      color: { dark: dotColor, light: bgColor },
    });
    showToast('Fichier vectoriel SVG téléchargé !');
  };

  const handleCopyClipboard = async () => {
    const success = await copyQRCodeToClipboard(publicUrl, {
      enableGradient,
      gradientType,
      gradientStartColor,
      gradientEndColor,
      centerLogoUrl: enableLogo && centerLogoUrl ? centerLogoUrl : undefined,
      logoShape,
      logoSize,
      logoBgColor,
      frameText: includeFrameText ? frameText : undefined,
      transparentBackground: transparentBg,
      color: { dark: dotColor, light: bgColor },
    });

    if (success) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      showToast('Image du QR Code copiée dans le presse-papier !');
    } else {
      showToast('Impossible de copier automatiquement. Veuillez utiliser le téléchargement.');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* 1. Header Banner & Intro */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-900 to-slate-900 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-sm">
            <QrCode className="w-6 h-6 text-indigo-300" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Personnalisation Avancée du QR Code</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 font-bold uppercase">
                Vector & HD
              </span>
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Intégrez votre logo de marque au centre, appliquez des dégradés de couleurs sur-mesure et téléchargez en haute résolution.
            </p>
          </div>
        </div>

        <button
          onClick={() => handleSaveToTheme()}
          className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <Check className="w-4 h-4" />
          <span>Enregistrer pour mon profil</span>
        </button>
      </div>

      {/* 2. Main Two Column Editor (Controls & Live Preview) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Controls (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          
          {/* SECTION A: LOGO CENTRAL DE MARQUE */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Logo de Marque au Centre</h4>
                  <p className="text-[11px] text-slate-500">Incrustation protégée avec correction d'erreur niveau H (30%)</p>
                </div>
              </div>

              {/* Toggle Enable Logo */}
              <button
                type="button"
                onClick={() => {
                  const next = !enableLogo;
                  setEnableLogo(next);
                  handleSaveToTheme({ centerLogoUrl: next ? (centerLogoUrl || activeProfile.logoUrl || currentOrg.logoUrl) : undefined });
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  enableLogo ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    enableLogo ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {enableLogo && (
              <div className="space-y-4 animate-in fade-in duration-200">
                
                {/* Logo Selector & Preview Pill */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div 
                      onClick={() => setIsLogoModalOpen(true)}
                      className="w-14 h-14 rounded-2xl bg-white p-2 border border-slate-200 shadow-xs flex items-center justify-center cursor-pointer group shrink-0 relative overflow-hidden"
                    >
                      {centerLogoUrl ? (
                        <img src={centerLogoUrl} alt="Logo QR" className="max-w-full max-h-full object-contain" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-slate-400" />
                      )}
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                        <Upload className="w-4 h-4" />
                      </div>
                    </div>

                    <div>
                      <h5 className="text-xs font-bold text-slate-800">Fichier du Logo</h5>
                      <p className="text-[11px] text-slate-500 truncate max-w-[200px] sm:max-w-xs">
                        {centerLogoUrl ? 'Logo personnalisé chargé' : 'Logo de l’organisation ou image importée'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Quick suggest from Org logo if different */}
                    {currentOrg.logoUrl && currentOrg.logoUrl !== centerLogoUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setCenterLogoUrl(currentOrg.logoUrl!);
                          handleSaveToTheme({ centerLogoUrl: currentOrg.logoUrl });
                        }}
                        className="py-1.5 px-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-700 transition"
                      >
                        Logo Entreprise
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setIsLogoModalOpen(true)}
                      className="py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{centerLogoUrl ? 'Changer...' : 'Importer...'}</span>
                    </button>
                  </div>
                </div>

                {/* Logo Shape & Size selectors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Forme de la pastille centrale</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'circle', label: 'Cercle' },
                        { id: 'rounded', label: 'Arrondi' },
                        { id: 'square', label: 'Carré' },
                      ].map((shapeItem) => (
                        <button
                          key={shapeItem.id}
                          type="button"
                          onClick={() => {
                            setLogoShape(shapeItem.id as any);
                            handleSaveToTheme({ logoShape: shapeItem.id as any });
                          }}
                          className={`py-2 px-1 rounded-xl text-xs font-semibold transition border cursor-pointer ${
                            logoShape === shapeItem.id
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {shapeItem.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Taille du Logo Central</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'small', label: 'Discret (18%)' },
                        { id: 'medium', label: 'Standard (22%)' },
                        { id: 'large', label: 'Grand (26%)' },
                      ].map((sizeItem) => (
                        <button
                          key={sizeItem.id}
                          type="button"
                          onClick={() => {
                            setLogoSize(sizeItem.id as any);
                            handleSaveToTheme({ logoSize: sizeItem.id as any });
                          }}
                          className={`py-2 px-1 rounded-xl text-xs font-semibold transition border cursor-pointer ${
                            logoSize === sizeItem.id
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {sizeItem.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Logo Badge Background Color */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Fond de la pastille centrale</label>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-50 border border-slate-200">
                      <input
                        type="color"
                        value={logoBgColor}
                        onChange={(e) => {
                          setLogoBgColor(e.target.value);
                          handleSaveToTheme({ logoBgColor: e.target.value });
                        }}
                        className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                      <span className="text-xs font-mono uppercase font-semibold text-slate-700">{logoBgColor}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setLogoBgColor('#ffffff');
                        handleSaveToTheme({ logoBgColor: '#ffffff' });
                      }}
                      className="text-xs text-indigo-600 font-semibold hover:underline"
                    >
                      Réinitialiser en blanc
                    </button>
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* SECTION B: DÉGRADÉS & PALETTE DE COULEURS */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Palette className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Couleurs & Dégradés Graphiques</h4>
                  <p className="text-[11px] text-slate-500">Personnalisez les modules QR avec des dégradés multi-tons</p>
                </div>
              </div>

              {/* Toggle Gradient */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Dégradé</span>
                <button
                  type="button"
                  onClick={() => {
                    const next = !enableGradient;
                    setEnableGradient(next);
                    handleSaveToTheme({ enableGradient: next });
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    enableGradient ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      enableGradient ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Presets Grid */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Préréglages de Dégradés Élégants</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {GRADIENT_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyGradientPreset(preset)}
                    className="p-2 rounded-xl border border-slate-200 hover:border-indigo-400 text-left transition flex items-center gap-2 group cursor-pointer"
                  >
                    <div 
                      className="w-6 h-6 rounded-lg shadow-xs shrink-0 group-hover:scale-105 transition"
                      style={{ background: `linear-gradient(135deg, ${preset.start}, ${preset.end})` }}
                    />
                    <span className="text-[11px] font-bold text-slate-700 truncate">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Gradient Inputs */}
            {enableGradient ? (
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Couleur Début (Start)</label>
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200">
                      <input
                        type="color"
                        value={gradientStartColor}
                        onChange={(e) => {
                          setGradientStartColor(e.target.value);
                          handleSaveToTheme({ gradientStartColor: e.target.value });
                        }}
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                      <input
                        type="text"
                        value={gradientStartColor}
                        onChange={(e) => {
                          setGradientStartColor(e.target.value);
                          handleSaveToTheme({ gradientStartColor: e.target.value });
                        }}
                        className="w-full bg-transparent text-xs font-mono uppercase font-semibold text-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Couleur Fin (End)</label>
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200">
                      <input
                        type="color"
                        value={gradientEndColor}
                        onChange={(e) => {
                          setGradientEndColor(e.target.value);
                          handleSaveToTheme({ gradientEndColor: e.target.value });
                        }}
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                      <input
                        type="text"
                        value={gradientEndColor}
                        onChange={(e) => {
                          setGradientEndColor(e.target.value);
                          handleSaveToTheme({ gradientEndColor: e.target.value });
                        }}
                        className="w-full bg-transparent text-xs font-mono uppercase font-semibold text-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Gradient Direction Style */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Orientation du Dégradé</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'linear_diagonal', label: 'Diagonale (45°)' },
                      { id: 'linear_horizontal', label: 'Horizontale (→)' },
                      { id: 'linear_vertical', label: 'Verticale (↓)' },
                      { id: 'radial', label: 'Radiale (Centre)' },
                    ].map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => {
                          setGradientType(d.id as any);
                          handleSaveToTheme({ gradientType: d.id as any });
                        }}
                        className={`py-2 px-1 rounded-xl text-xs font-semibold transition border cursor-pointer ${
                          gradientType === d.id
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Solid Single Color Selector */
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Couleur Unie du QR Code</label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200">
                    <input
                      type="color"
                      value={dotColor}
                      onChange={(e) => {
                        setDotColor(e.target.value);
                        handleSaveToTheme({ dotColor: e.target.value });
                      }}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={dotColor}
                      onChange={(e) => {
                        setDotColor(e.target.value);
                        handleSaveToTheme({ dotColor: e.target.value });
                      }}
                      className="w-28 bg-transparent text-xs font-mono uppercase font-semibold text-slate-800 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Background & Transparency */}
            <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-slate-800">Arrière-plan Transparent (PNG sans fond)</span>
                <p className="text-[11px] text-slate-500">Idéal pour l'impression directe sur cartes physiques ou brochures sombres.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = !transparentBg;
                  setTransparentBg(next);
                  handleSaveToTheme({ transparentBg: next });
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer shrink-0 ${
                  transparentBg ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    transparentBg ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Frame Text Banner at Bottom */}
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800">Texte d'incitation (Call-to-Action)</span>
                  <p className="text-[11px] text-slate-500">Ajoute un cadre avec message sous le QR Code</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !includeFrameText;
                    setIncludeFrameText(next);
                    handleSaveToTheme({ frameText: next ? frameText : undefined });
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer shrink-0 ${
                    includeFrameText ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      includeFrameText ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {includeFrameText && (
                <input
                  type="text"
                  value={frameText}
                  onChange={(e) => {
                    setFrameText(e.target.value);
                    handleSaveToTheme({ frameText: e.target.value });
                  }}
                  placeholder="Ex: Scannez pour me contacter"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              )}
            </div>

          </div>

        </div>

        {/* Right Side: High-End Live Preview & Export Hub (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-5 sticky top-20">
          
          <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col items-center gap-5">
            <div className="w-full flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Rendu Haute Définition
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                kardx.app/p/{activeProfile.slug}
              </span>
            </div>

            {/* QR Code Container Mockup */}
            <div className={`p-6 rounded-3xl border flex items-center justify-center relative min-w-[240px] min-h-[240px] transition-all shadow-inner ${
              transparentBg 
                ? 'bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:12px_12px] border-slate-200' 
                : 'bg-white border-slate-100 shadow-sm'
            }`}>
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                  <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-medium">Génération des dégradés...</span>
                </div>
              ) : qrPreviewUrl ? (
                <img
                  src={qrPreviewUrl}
                  alt="QR Code Personnalisé KardX"
                  className="w-56 h-56 object-contain rounded-xl drop-shadow-md animate-in zoom-in duration-150"
                />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-slate-300">
                  <QrCode className="w-16 h-16" />
                </div>
              )}
            </div>

            {/* Cardholder metadata recap */}
            <div className="text-center">
              <h4 className="text-xs font-bold text-slate-800">{activeProfile.firstName} {activeProfile.lastName}</h4>
              <p className="text-[11px] text-slate-500">{activeProfile.headline || activeProfile.company}</p>
            </div>

            {/* Quick Export Actions */}
            <div className="w-full flex flex-col gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleDownloadPng}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Télécharger Image HD (PNG 2048px)</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleDownloadSvg}
                  className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Télécharger en format vectoriel sans perte pour imprimeur"
                >
                  <FileDown className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Vectoriel SVG</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyClipboard}
                  className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copié !</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copier Image</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-[11px] text-indigo-900 leading-tight">
              ✨ <strong>Prêt pour l'impression physique :</strong> Ce QR Code personnalisé s’affiche automatiquement sur le verso de vos cartes NFC KardX et dans vos signatures d'e-mails.
            </div>

          </div>

        </div>

      </div>

      {/* Modal Upload Logo */}
      {isLogoModalOpen && (
        <ImageUploadModal
          isOpen={isLogoModalOpen}
          onClose={() => setIsLogoModalOpen(false)}
          type="logo"
          currentValue={centerLogoUrl}
          onSave={(url) => {
            setCenterLogoUrl(url);
            setEnableLogo(true);
            handleSaveToTheme({ centerLogoUrl: url });
            showToast('Logo central du QR Code mis à jour !');
          }}
        />
      )}

    </div>
  );
};
