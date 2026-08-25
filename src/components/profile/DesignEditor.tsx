import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { CARD_TEMPLATES, THEME_PRESETS } from '../../utils/themePresets';
import { CardTemplate, TemplateCategory, ProfileTheme, Profile } from '../../types';
import { PublicProfileView } from './PublicProfileView';
import { ImageUploadModal, ImageUploadType } from '../common/ImageUploadModal';
import { QRCodeCustomizerSection } from './QRCodeCustomizerSection';
import { LandingPageBuilder } from './LandingPageBuilder';
import { generateQRCodeDataUrl } from '../../utils/qr';
import { 
  Palette, 
  Sparkles, 
  Type, 
  Check, 
  Layout, 
  Globe,
  Square, 
  Circle, 
  Eye, 
  RotateCcw,
  ArrowRight,
  Users,
  ShieldCheck,
  Building2,
  Briefcase,
  Search,
  Sliders,
  Filter,
  Plus,
  Trash2,
  Smartphone,
  CreditCard,
  Wifi,
  QrCode,
  Layers,
  CheckCheck,
  X,
  ExternalLink,
  Copy,
  FolderLock,
  Flame,
  Star,
  Award,
  Sparkle,
  Camera,
  Upload
} from 'lucide-react';

const CATEGORIES: Array<{ id: TemplateCategory; label: string; icon?: React.ReactNode }> = [
  { id: 'all', label: 'Tous les modèles' },
  { id: 'company_official', label: 'Charte Entreprise' },
  { id: 'executive', label: 'Direction & C-Level' },
  { id: 'finance_consulting', label: 'Finance & Conseil' },
  { id: 'tech_saas', label: 'Tech & Startups' },
  { id: 'creative_agency', label: 'Créatif & Agences' },
  { id: 'health_eco', label: 'Santé & RSE' },
  { id: 'luxury_vip', label: 'Luxe & VIP' },
];

export const DesignEditor: React.FC = () => {
  const { 
    activeProfile, 
    profiles, 
    currentOrg, 
    updateTheme, 
    updateProfile,
    bulkUpdateProfiles,
    setActiveTab, 
    showToast,
    addNotification
  } = useApp();

  const currentTheme = activeProfile.theme;

  // Editor mode: 'landing_builder' (Landing Page Builder), 'library' (Template Library), 'customizer' (Theme Fine-tuning), or 'qr_customizer' (QR Code brand & gradients)
  const [activeEditorTab, setActiveEditorTab] = useState<'landing_builder' | 'library' | 'customizer' | 'qr_customizer'>('landing_builder');
  const [cardBackQrDataUrl, setCardBackQrDataUrl] = useState<string>('');

  // Generate QR preview for the back of physical card
  useEffect(() => {
    const qrConf = currentTheme.qrCustomization;
    const currentProfileUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/p/${activeProfile.slug}`;
    
    generateQRCodeDataUrl(currentProfileUrl, {
      width: 400,
      margin: 1,
      color: {
        dark: qrConf?.dotColor || '#0f172a',
        light: qrConf?.bgColor || '#ffffff',
      },
      enableGradient: qrConf?.enableGradient ?? true,
      gradientType: qrConf?.gradientType || 'linear_diagonal',
      gradientStartColor: qrConf?.gradientStartColor || currentTheme.primaryColor || '#1e3a8a',
      gradientEndColor: qrConf?.gradientEndColor || currentTheme.accentColor || '#3b82f6',
      centerLogoUrl: qrConf?.centerLogoUrl || activeProfile.logoUrl || currentOrg.logoUrl,
      logoShape: qrConf?.logoShape || 'circle',
      logoSize: qrConf?.logoSize || 'medium',
      logoBgColor: qrConf?.logoBgColor || '#ffffff',
      errorCorrectionLevel: 'H',
    }).then((url) => {
      if (url) setCardBackQrDataUrl(url);
    }).catch(() => {});
  }, [activeProfile, currentTheme, currentOrg]);

  // Preview mode: 'phone' (Mobile profile), 'physical_card' (Recto/Verso NFC card), 'team_lineup' (Multi-member consistency)
  const [previewMode, setPreviewMode] = useState<'phone' | 'physical_card' | 'team_lineup'>('phone');
  const [physicalCardSide, setPhysicalCardSide] = useState<'front' | 'back'>('front');

  // Filter & Search states for Template Library
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Custom User/Org Templates list (persisted in local state)
  const [customTemplates, setCustomTemplates] = useState<CardTemplate[]>([
    {
      id: 'custom_tpl_bestexperts_gold',
      name: 'Charte BEST EXPERTS Prestige Gold',
      category: 'company_official',
      categoryLabel: 'Charte Entreprise',
      description: 'Variante or & marine validée pour le directoire et les associés seniors.',
      bestFor: 'Associés & Directeurs de Mission',
      badge: 'Charte Validée',
      isOfficial: true,
      isCustom: true,
      recommendedIndustry: 'Conseil & Audit',
      tags: ['Entreprise', 'Or', 'Direction'],
      popularityScore: 99,
      theme: {
        preset: 'custom_tpl_bestexperts_gold',
        primaryColor: '#1e3a8a',
        secondaryColor: '#d97706',
        accentColor: '#fbbf24',
        backgroundColor: '#050c1e',
        cardBackground: '#0e1830',
        textColor: '#f8fafc',
        mutedTextColor: '#cbd5e1',
        borderRadius: 'lg',
        buttonStyle: 'rounded',
        fontFamily: 'Plus Jakarta Sans',
        headerLayout: 'cover_avatar',
        coverImageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
        patternOverlay: 'mesh',
        darkMode: true,
      },
    },
  ]);

  // Modals
  const [rolloutModalTemplate, setRolloutModalTemplate] = useState<CardTemplate | null>(null);
  const [rolloutScope, setRolloutScope] = useState<'all' | 'sales' | 'selection'>('all');
  const [selectedProfileIdsForRollout, setSelectedProfileIdsForRollout] = useState<string[]>(
    profiles.map((p) => p.id)
  );
  const [syncBannerImage, setSyncBannerImage] = useState(true);
  const [lockAsDefaultCompanyTheme, setLockAsDefaultCompanyTheme] = useState(true);

  // New Custom Template Creation Modal
  const [isCreateTemplateModalOpen, setIsCreateTemplateModalOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateCategory, setNewTemplateCategory] = useState<TemplateCategory>('company_official');
  const [newTemplateBestFor, setNewTemplateBestFor] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');
  const [newTemplateBadge, setNewTemplateBadge] = useState('Charte Équipe');

  // Cover Image Modal state
  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);

  // Combined Templates
  const allTemplates = useMemo(() => {
    return [...customTemplates, ...CARD_TEMPLATES];
  }, [customTemplates]);

  // Filtered Templates
  const filteredTemplates = useMemo(() => {
    return allTemplates.filter((tpl) => {
      const matchCategory = selectedCategory === 'all' || tpl.category === selectedCategory;
      const matchQuery = 
        tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tpl.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tpl.bestFor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tpl.recommendedIndustry.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tpl.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCategory && (searchQuery.trim() === '' || matchQuery);
    });
  }, [allTemplates, selectedCategory, searchQuery]);

  // Apply template to active profile
  const handleApplyTemplateToMe = (template: CardTemplate) => {
    updateTheme(template.theme);
    showToast(`Modèle "${template.name}" appliqué à votre profil !`);
  };

  // Open Rollout Modal
  const handleOpenRolloutModal = (template: CardTemplate, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRolloutModalTemplate(template);
    setSelectedProfileIdsForRollout(profiles.map((p) => p.id));
    setRolloutScope('all');
  };

  // Execute Rollout across Team
  const handleExecuteRollout = () => {
    if (!rolloutModalTemplate) return;

    let targetIds: string[] = [];
    if (rolloutScope === 'all') {
      targetIds = profiles.map((p) => p.id);
    } else if (rolloutScope === 'sales') {
      targetIds = profiles.filter((p) => p.department?.toLowerCase().includes('commerc') || p.department?.toLowerCase().includes('sales') || p.id === activeProfile.id).map((p) => p.id);
      if (targetIds.length === 0) targetIds = [activeProfile.id];
    } else {
      targetIds = selectedProfileIdsForRollout;
    }

    const themeUpdates: Partial<ProfileTheme> = {
      ...rolloutModalTemplate.theme,
    };

    if (!syncBannerImage) {
      delete (themeUpdates as any).coverImageUrl;
    }

    // Apply to profiles in state
    bulkUpdateProfiles(targetIds, {
      theme: { ...currentTheme, ...themeUpdates },
    });

    // Also update activeProfile immediately
    if (targetIds.includes(activeProfile.id)) {
      updateTheme(themeUpdates);
    }

    // Create system notification
    addNotification({
      type: 'system',
      title: 'Charte graphique déployée sur l’équipe',
      message: `Le modèle "${rolloutModalTemplate.name}" a été appliqué à ${targetIds.length} collaborateur(s) pour garantir l'uniformité de la marque.`,
      linkTab: 'team',
    });

    showToast(`Charte "${rolloutModalTemplate.name}" déployée avec succès sur ${targetIds.length} profil(s) !`);
    setRolloutModalTemplate(null);
  };

  // Save Current Custom Styling as a Company Template
  const handleSaveCurrentAsCustomTemplate = () => {
    if (!newTemplateName.trim()) {
      showToast('Veuillez saisir un nom pour le modèle');
      return;
    }

    const created: CardTemplate = {
      id: `custom_${Date.now()}`,
      name: newTemplateName.trim(),
      category: newTemplateCategory,
      categoryLabel: CATEGORIES.find((c) => c.id === newTemplateCategory)?.label || 'Charte Entreprise',
      description: newTemplateDescription.trim() || 'Modèle de carte de visite personnalisé enregistré pour l’équipe.',
      bestFor: newTemplateBestFor.trim() || 'Collaborateurs de l’entreprise',
      badge: newTemplateBadge.trim() || 'Charte Équipe',
      isOfficial: newTemplateCategory === 'company_official',
      isCustom: true,
      recommendedIndustry: currentOrg.name,
      tags: ['Personnalisé', 'Équipe', currentOrg.name],
      popularityScore: 99,
      createdAt: new Date().toISOString(),
      theme: {
        ...currentTheme,
        preset: `custom_${Date.now()}`,
      },
    };

    setCustomTemplates((prev) => [created, ...prev]);
    setIsCreateTemplateModalOpen(false);
    setNewTemplateName('');
    setNewTemplateDescription('');
    setNewTemplateBestFor('');
    showToast(`Nouveau modèle "${created.name}" enregistré dans votre bibliothèque d’entreprise !`);
  };

  // Delete Custom Template
  const handleDeleteCustomTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCustomTemplates((prev) => prev.filter((t) => t.id !== id));
    showToast('Modèle personnalisé supprimé de la bibliothèque');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-slate-800 flex flex-col gap-8">
      
      {/* 1. TOP HEADER & MAIN TABS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
              Design & Modèles de Cartes d’Entreprise
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              Cohérence de Marque
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Appliquez des chartes graphiques professionnelles prêtes à l’emploi ou déployez votre identité sur l’ensemble de vos collaborateurs.
          </p>
        </div>

        {/* TOP CONTROLS & SWITCHERS */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Editor Mode Tabs */}
          <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200">
            <button
              onClick={() => setActiveEditorTab('landing_builder')}
              className={`py-2 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeEditorTab === 'landing_builder'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-indigo-600" />
              <span>Landing Page Builder</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 text-indigo-700 font-extrabold uppercase">
                URL Vanity & Conversion
              </span>
            </button>

            <button
              onClick={() => setActiveEditorTab('library')}
              className={`py-2 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeEditorTab === 'library'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Modèles</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 text-indigo-700 font-extrabold">
                {allTemplates.length}
              </span>
            </button>

            <button
              onClick={() => setActiveEditorTab('customizer')}
              className={`py-2 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeEditorTab === 'customizer'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-slate-500" />
              <span>Thème & Couleurs</span>
            </button>

            <button
              onClick={() => setActiveEditorTab('qr_customizer')}
              className={`py-2 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeEditorTab === 'qr_customizer'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <QrCode className="w-3.5 h-3.5 text-indigo-600" />
              <span>Studio QR Code</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-100 text-amber-800 font-extrabold uppercase">
                Dégradés & Logo
              </span>
            </button>
          </div>

          <button
            onClick={() => setIsCreateTemplateModalOpen(true)}
            className="py-2.5 px-3.5 rounded-xl bg-white hover:bg-slate-50 text-indigo-600 border border-indigo-200 text-xs font-bold transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
            title="Enregistrer le design actuel comme modèle d'équipe"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Créer un modèle d’équipe</span>
          </button>
        </div>
      </div>

      {/* 2. TAB CONTENT: LANDING PAGE BUILDER OR 2-PANEL DESIGN/THEME EDITOR */}
      {activeEditorTab === 'landing_builder' ? (
        <LandingPageBuilder />
      ) : (
        /* 2-PANEL LAYOUT (LEFT CONTROLS & RIGHT MULTI-VIEW PREVIEW) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: TEMPLATE LIBRARY OR CUSTOMIZER (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {activeEditorTab === 'library' ? (
            /* TAB 1: TEMPLATE LIBRARY BROWSER */
            <div className="flex flex-col gap-5">
              
              {/* Category Filter Pills & Search */}
              <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col gap-3.5">
                
                {/* Search input & counter */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Rechercher par secteur, métier, couleur ou mot-clé..."
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0 font-medium">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 font-bold text-slate-700">
                      {filteredTemplates.length} modèle{filteredTemplates.length > 1 ? 's' : ''} disponible{filteredTemplates.length > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                  {CATEGORIES.map((cat) => {
                    const isSelected = selectedCategory === cat.id;
                    const count = cat.id === 'all' 
                      ? allTemplates.length 
                      : allTemplates.filter((t) => t.category === cat.id).length;
                    
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`py-1.5 px-3 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <span>{cat.label}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          isSelected ? 'bg-indigo-500/80 text-white' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

              </div>

              {/* TEMPLATES GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredTemplates.length === 0 ? (
                  <div className="sm:col-span-2 p-12 text-center bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-2 text-slate-500">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <p className="font-bold text-sm text-slate-800">Aucun modèle correspondant</p>
                    <p className="text-xs text-slate-500 max-w-sm">
                      Essayez de modifier vos termes de recherche ou réinitialisez la catégorie sélectionnée.
                    </p>
                    <button
                      onClick={() => {
                        setSelectedCategory('all');
                        setSearchQuery('');
                      }}
                      className="mt-2 text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                    >
                      Réinitialiser les filtres
                    </button>
                  </div>
                ) : (
                  filteredTemplates.map((template) => {
                    const isCurrentActive = currentTheme.preset === template.theme.preset || currentTheme.preset === template.id;
                    const isDark = template.theme.darkMode;

                    return (
                      <div
                        key={template.id}
                        onClick={() => handleApplyTemplateToMe(template)}
                        className={`rounded-3xl border transition overflow-hidden flex flex-col justify-between group cursor-pointer relative ${
                          isCurrentActive
                            ? 'bg-indigo-50/40 border-indigo-500 ring-2 ring-indigo-500/30 shadow-md'
                            : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md'
                        }`}
                      >
                        {/* TOP VISUAL HEADER CARD MOCKUP */}
                        <div 
                          className="h-28 relative p-4 flex flex-col justify-between overflow-hidden"
                          style={{
                            backgroundColor: template.theme.backgroundColor || '#0f172a',
                            color: template.theme.textColor || '#ffffff',
                          }}
                        >
                          {/* Background cover image or gradient */}
                          {template.theme.coverImageUrl ? (
                            <img
                              src={template.theme.coverImageUrl}
                              alt="Cover"
                              className="absolute inset-0 w-full h-full object-cover opacity-35 group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div
                              className="absolute inset-0 opacity-40"
                              style={{
                                background: `linear-gradient(135deg, ${template.theme.primaryColor}, ${template.theme.secondaryColor})`
                              }}
                            />
                          )}

                          {/* Pattern Overlay simulation */}
                          {template.theme.patternOverlay === 'grid' && (
                            <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:12px_12px] opacity-15"></div>
                          )}

                          {/* Header pill badges */}
                          <div className="relative z-10 flex items-center justify-between gap-1">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md bg-black/40 text-white border border-white/20">
                              {template.categoryLabel}
                            </span>

                            {template.badge && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950 shadow-xs flex items-center gap-1">
                                <Star className="w-2.5 h-2.5 fill-current" />
                                {template.badge}
                              </span>
                            )}
                          </div>

                          {/* Mini member header preview */}
                          <div className="relative z-10 flex items-center gap-2.5 mt-auto">
                            <div 
                              className="w-8 h-8 rounded-full border-2 border-white/60 bg-slate-800 flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-sm"
                              style={{ backgroundColor: template.theme.primaryColor }}
                            >
                              {activeProfile.firstName[0]}{activeProfile.lastName[0]}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold truncate leading-tight drop-shadow-xs" style={{ color: template.theme.textColor }}>
                                {activeProfile.firstName} {activeProfile.lastName}
                              </p>
                              <p className="text-[10px] opacity-80 truncate" style={{ color: template.theme.mutedTextColor }}>
                                {activeProfile.company || currentOrg.name}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* BODY CONTENT */}
                        <div className="p-4 flex-1 flex flex-col justify-between gap-3 bg-white">
                          
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-bold text-sm text-slate-800 group-hover:text-indigo-600 transition leading-snug">
                                {template.name}
                              </h4>
                              {template.isCustom && (
                                <button
                                  onClick={(e) => handleDeleteCustomTemplate(template.id, e)}
                                  className="text-slate-400 hover:text-rose-600 p-1 transition"
                                  title="Supprimer ce modèle personnalisé"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                            
                            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                              {template.description}
                            </p>

                            <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-slate-600 font-medium">
                              <Briefcase className="w-3 h-3 text-indigo-600 shrink-0" />
                              <span className="truncate"><strong>Idéal pour :</strong> {template.bestFor}</span>
                            </div>
                          </div>

                          {/* Color swatches & typography indicators */}
                          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <div 
                                className="w-4 h-4 rounded-full border border-slate-200 shadow-2xs" 
                                style={{ backgroundColor: template.theme.primaryColor }} 
                                title={`Primaire : ${template.theme.primaryColor}`}
                              />
                              <div 
                                className="w-4 h-4 rounded-full border border-slate-200 shadow-2xs" 
                                style={{ backgroundColor: template.theme.secondaryColor }} 
                                title={`Secondaire : ${template.theme.secondaryColor}`}
                              />
                              <div 
                                className="w-4 h-4 rounded-full border border-slate-200 shadow-2xs" 
                                style={{ backgroundColor: template.theme.accentColor }} 
                                title={`Accent : ${template.theme.accentColor}`}
                              />
                            </div>

                            <span className="text-[10px] text-slate-400 font-mono">
                              {template.theme.fontFamily}
                            </span>
                          </div>

                          {/* ACTION BUTTONS (APPLY TO ME & DEPLOY TO TEAM) */}
                          <div className="pt-2 grid grid-cols-2 gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApplyTemplateToMe(template);
                              }}
                              className={`py-1.5 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                                isCurrentActive
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              }`}
                            >
                              {isCurrentActive ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Actif</span>
                                </>
                              ) : (
                                <span>Appliquer (Moi)</span>
                              )}
                            </button>

                            <button
                              onClick={(e) => handleOpenRolloutModal(template, e)}
                              className="py-1.5 px-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition flex items-center justify-center gap-1 cursor-pointer"
                              title="Déployer sur toute l'équipe pour harmoniser la marque"
                            >
                              <Users className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Déployer Équipe</span>
                            </button>
                          </div>

                        </div>

                      </div>
                    );
                  })
                )}
              </div>

            </div>
          ) : activeEditorTab === 'customizer' ? (
            /* TAB 2: ADVANCED THEME CUSTOMIZER */
            <div className="flex flex-col gap-6">
              
              {/* 1. CUSTOM COLORS & PALETTE */}
              <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col gap-4">
                <h3 className="font-bold text-base text-slate-800 border-b border-slate-100 pb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-indigo-600" />
                    Palette de Couleurs Personnalisée
                  </span>
                  <button
                    onClick={() => setIsCreateTemplateModalOpen(true)}
                    className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Sauvegarder comme modèle</span>
                  </button>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Couleur Primaire (CTA)</label>
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200">
                      <input
                        type="color"
                        value={currentTheme.primaryColor}
                        onChange={(e) => updateTheme({ primaryColor: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                      <input
                        type="text"
                        value={currentTheme.primaryColor}
                        onChange={(e) => updateTheme({ primaryColor: e.target.value })}
                        className="w-full bg-transparent text-xs font-mono uppercase text-slate-800 font-semibold focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Couleur Secondaire</label>
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200">
                      <input
                        type="color"
                        value={currentTheme.secondaryColor}
                        onChange={(e) => updateTheme({ secondaryColor: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                      <input
                        type="text"
                        value={currentTheme.secondaryColor}
                        onChange={(e) => updateTheme({ secondaryColor: e.target.value })}
                        className="w-full bg-transparent text-xs font-mono uppercase text-slate-800 font-semibold focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Couleur Accent</label>
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200">
                      <input
                        type="color"
                        value={currentTheme.accentColor}
                        onChange={(e) => updateTheme({ accentColor: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                      <input
                        type="text"
                        value={currentTheme.accentColor}
                        onChange={(e) => updateTheme({ accentColor: e.target.value })}
                        className="w-full bg-transparent text-xs font-mono uppercase text-slate-800 font-semibold focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Couleur d'Arrière-Plan</label>
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200">
                      <input
                        type="color"
                        value={currentTheme.backgroundColor}
                        onChange={(e) => updateTheme({ backgroundColor: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                      <input
                        type="text"
                        value={currentTheme.backgroundColor}
                        onChange={(e) => updateTheme({ backgroundColor: e.target.value })}
                        className="w-full bg-transparent text-xs font-mono uppercase text-slate-800 font-semibold focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Fond des Cartes / Widgets</label>
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200">
                      <input
                        type="color"
                        value={currentTheme.cardBackground}
                        onChange={(e) => updateTheme({ cardBackground: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                      <input
                        type="text"
                        value={currentTheme.cardBackground}
                        onChange={(e) => updateTheme({ cardBackground: e.target.value })}
                        className="w-full bg-transparent text-xs font-mono uppercase text-slate-800 font-semibold focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Banner image */}
                <div className="pt-2 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-indigo-600" />
                      <label className="text-xs font-bold text-slate-800">
                        Bannière de Profil Mobile & Cartes NFC
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCoverModalOpen(true)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Choisir une photo...</span>
                    </button>
                  </div>

                  {/* Visual preview and click area */}
                  <div
                    onClick={() => setIsCoverModalOpen(true)}
                    className="group relative h-28 w-full rounded-xl overflow-hidden border border-slate-200 shadow-inner cursor-pointer"
                  >
                    {currentTheme.coverImageUrl ? (
                      <img
                        src={currentTheme.coverImageUrl}
                        alt="Bannière"
                        className="w-full h-full object-cover group-hover:scale-102 transition duration-300"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-white text-xs font-semibold"
                        style={{
                          background: `linear-gradient(135deg, ${currentTheme.primaryColor || '#1e3a8a'}, ${currentTheme.secondaryColor || '#d97706'})`,
                        }}
                      >
                        Dégradé par défaut de l'entreprise
                      </div>
                    )}
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 text-white text-xs font-bold backdrop-blur-2xs">
                      <Upload className="w-4 h-4" />
                      <span>Suggestions HD, Galerie & Liens Web</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500">
                    💡 Sélectionnez un fond parmi notre bibliothèque de propositions thématiques (Corporate, Tech, Luxe, Nature) ou importez votre propre fichier.
                  </p>
                </div>
              </div>

              {/* 2. TYPOGRAPHY & BUTTON STYLES */}
              <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col gap-4">
                <h3 className="font-bold text-base text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
                  <Type className="w-4 h-4 text-indigo-600" />
                  Typographie & Rayon des Boutons
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Font selection */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Police de caractères</label>
                    <select
                      value={currentTheme.fontFamily}
                      onChange={(e) => updateTheme({ fontFamily: e.target.value as any })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white cursor-pointer"
                    >
                      <option value="Plus Jakarta Sans">Plus Jakarta Sans (Corporate & Sobre)</option>
                      <option value="Outfit">Outfit (Tech, Élégant & Moderne)</option>
                      <option value="Space Grotesk">Space Grotesk (Design & Impact)</option>
                      <option value="Inter">Inter (Minimaliste & Lisibilité maximale)</option>
                      <option value="DM Sans">DM Sans (Équilibré & Épuré)</option>
                    </select>
                  </div>

                  {/* Button Radius */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Style des Rayons</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { id: 'sm', label: 'Carré' },
                        { id: 'md', label: 'Moyen' },
                        { id: 'lg', label: 'Arrondi' },
                        { id: 'full', label: 'Pilule' },
                      ].map((r) => (
                        <button
                          key={r.id}
                          onClick={() => updateTheme({ borderRadius: r.id as any })}
                          className={`py-2 px-1 rounded-xl text-xs font-semibold transition border cursor-pointer ${
                            currentTheme.borderRadius === r.id
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Header Layout Choice */}
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Disposition du Header</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'cover_avatar', label: 'Bannière + Avatar' },
                      { id: 'centered_card', label: 'Carte Centrée' },
                      { id: 'split_modern', label: 'Split Moderne' },
                      { id: 'minimalist', label: 'Minimaliste' },
                    ].map((layoutItem) => (
                      <button
                        key={layoutItem.id}
                        onClick={() => updateTheme({ headerLayout: layoutItem.id as any })}
                        className={`py-2 px-2.5 rounded-xl text-xs font-semibold transition border cursor-pointer ${
                          currentTheme.headerLayout === layoutItem.id
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {layoutItem.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dark Mode toggle */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                  <div>
                    <span className="text-xs font-bold text-slate-800">Mode Sombre Haute Visibilité</span>
                    <p className="text-[11px] text-slate-500">Ajuste automatiquement les contrastes de texte et cartes.</p>
                  </div>
                  <button
                    onClick={() => updateTheme({ darkMode: !currentTheme.darkMode })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      currentTheme.darkMode ? 'bg-indigo-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        currentTheme.darkMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

              </div>

            </div>
          ) : (
            /* TAB 3: QR CODE CUSTOMIZER (Logo brand + Custom gradients) */
            <QRCodeCustomizerSection />
          )}

        </div>

        {/* RIGHT COLUMN: MULTI-VIEW INTERACTIVE PREVIEWS (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="sticky top-20 flex flex-col items-center w-full gap-3">
            
            {/* PREVIEW MODE SELECTOR */}
            <div className="flex items-center justify-between w-full max-w-sm bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs">
              <button
                onClick={() => setPreviewMode('phone')}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  previewMode === 'phone'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile</span>
              </button>

              <button
                onClick={() => setPreviewMode('physical_card')}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  previewMode === 'physical_card'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Carte NFC</span>
              </button>

              <button
                onClick={() => setPreviewMode('team_lineup')}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  previewMode === 'team_lineup'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Équipe</span>
              </button>
            </div>

            {/* VIEW 1: SMARTPHONE PREVIEW */}
            {previewMode === 'phone' && (
              <div className="w-full max-w-sm rounded-[40px] p-3 bg-slate-900 border-4 border-slate-800 shadow-2xl overflow-hidden relative animate-in fade-in duration-200">
                <div className="rounded-[30px] overflow-hidden overflow-y-auto max-h-[620px] bg-white border border-slate-800 custom-scrollbar">
                  <PublicProfileView isEmbeddedPreview={true} />
                </div>
              </div>
            )}

            {/* VIEW 2: PHYSICAL NFC BUSINESS CARD SIMULATION (RECTO / VERSO) */}
            {previewMode === 'physical_card' && (
              <div className="w-full max-w-sm flex flex-col gap-4 animate-in fade-in duration-200">
                
                {/* Recto / Verso Switcher */}
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => setPhysicalCardSide('front')}
                    className={`py-1 px-3 rounded-lg text-xs font-bold transition ${
                      physicalCardSide === 'front' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    Recto (Face)
                  </button>
                  <button
                    onClick={() => setPhysicalCardSide('back')}
                    className={`py-1 px-3 rounded-lg text-xs font-bold transition ${
                      physicalCardSide === 'back' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    Verso (QR Code)
                  </button>
                </div>

                {/* PHYSICAL CARD CONTAINER */}
                <div 
                  className="w-full aspect-[1.586/1] rounded-2xl p-6 shadow-2xl border flex flex-col justify-between relative overflow-hidden transition-all duration-300 transform hover:scale-[1.02]"
                  style={{
                    backgroundColor: currentTheme.cardBackground || '#0f172a',
                    borderColor: `${currentTheme.primaryColor}40`,
                    color: currentTheme.textColor || '#ffffff',
                    fontFamily: currentTheme.fontFamily || 'Plus Jakarta Sans',
                  }}
                >
                  {/* Subtle luxury sheen gradient */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none"></div>

                  {physicalCardSide === 'front' ? (
                    <>
                      {/* Top Bar: Company Name & NFC Chip Icon */}
                      <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-xs"
                            style={{ backgroundColor: currentTheme.primaryColor }}
                          >
                            K
                          </div>
                          <span className="font-extrabold tracking-wider text-xs uppercase" style={{ color: currentTheme.textColor }}>
                            {activeProfile.company || currentOrg.name}
                          </span>
                        </div>

                        {/* Contactless Wave icon */}
                        <div className="flex items-center gap-1 text-xs opacity-80" style={{ color: currentTheme.accentColor || '#38bdf8' }}>
                          <Wifi className="w-5 h-5 rotate-90" />
                        </div>
                      </div>

                      {/* Center: Member Name & Headline */}
                      <div className="relative z-10 my-auto">
                        <h3 className="text-lg font-bold tracking-tight leading-tight" style={{ color: currentTheme.textColor }}>
                          {activeProfile.firstName} {activeProfile.lastName}
                        </h3>
                        <p className="text-xs opacity-80 mt-0.5 truncate font-medium" style={{ color: currentTheme.mutedTextColor }}>
                          {activeProfile.headline}
                        </p>
                      </div>

                      {/* Bottom Bar: Laser Engraved ID & Verified status */}
                      <div className="relative z-10 flex items-center justify-between text-[10px] opacity-70">
                        <span className="font-mono">NFC ID • {activeProfile.slug}</span>
                        <span className="font-bold tracking-wider uppercase">KardX Smart NFC</span>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Back Side: QR Code & Connection Prompt */}
                      <div className="relative z-10 flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                          Scannez pour enregistrer le contact
                        </span>
                        <Wifi className="w-4 h-4 rotate-90 opacity-60" />
                      </div>

                      <div className="relative z-10 flex items-center justify-center gap-4 my-auto">
                        <div className="w-24 h-24 rounded-xl bg-white p-1 flex items-center justify-center shadow-lg border border-slate-200 overflow-hidden">
                          {cardBackQrDataUrl ? (
                            <img src={cardBackQrDataUrl} alt="QR Code" className="w-full h-full object-contain" />
                          ) : (
                            <QrCode className="w-full h-full text-slate-900" />
                          )}
                        </div>
                        <div className="flex flex-col text-xs gap-1 max-w-[140px]">
                          <span className="font-bold leading-tight" style={{ color: currentTheme.textColor }}>
                            {activeProfile.firstName} {activeProfile.lastName}
                          </span>
                          <span className="text-[10px] opacity-75 font-mono truncate">
                            kardx.app/p/{activeProfile.slug}
                          </span>
                        </div>
                      </div>

                      <div className="relative z-10 text-center text-[9px] opacity-60 font-mono">
                        Propulsé par KardX & BEST EXPERTS-GROUP
                      </div>
                    </>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-100 text-xs text-slate-600 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Ce rendu correspond à l’impression sur carte physique PVC Mate, Métal Noir ou Bois gravé.
                  </span>
                </div>

              </div>
            )}

            {/* VIEW 3: TEAM CONSISTENCY MULTI-MEMBER LINEUP */}
            {previewMode === 'team_lineup' && (
              <div className="w-full max-w-sm flex flex-col gap-3.5 animate-in fade-in duration-200">
                <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-indigo-900 text-xs">
                  <p className="font-bold flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-600" />
                    Aperçu de Cohérence Multi-Collaborateurs
                  </p>
                  <p className="text-[11px] text-indigo-700 mt-0.5">
                    Visualisez comment cette charte graphique s’adapte à chaque membre de votre entreprise.
                  </p>
                </div>

                {/* Team member cards preview */}
                <div className="flex flex-col gap-3">
                  {profiles.slice(0, 3).map((member) => (
                    <div
                      key={member.id}
                      className="p-3.5 rounded-2xl border shadow-sm flex items-center gap-3.5 transition"
                      style={{
                        backgroundColor: currentTheme.cardBackground || '#ffffff',
                        borderColor: `${currentTheme.primaryColor}30`,
                        color: currentTheme.textColor || '#0f172a',
                        fontFamily: currentTheme.fontFamily || 'Plus Jakarta Sans',
                      }}
                    >
                      {/* Avatar */}
                      <div 
                        className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-xs"
                        style={{ backgroundColor: currentTheme.primaryColor }}
                      >
                        {member.avatarUrl ? (
                          <img src={member.avatarUrl} alt={member.firstName} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          `${member.firstName[0]}${member.lastName[0]}`
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate leading-tight" style={{ color: currentTheme.textColor }}>
                          {member.firstName} {member.lastName}
                        </p>
                        <p className="text-[11px] opacity-75 truncate" style={{ color: currentTheme.mutedTextColor }}>
                          {member.headline}
                        </p>
                        <span className="text-[9px] font-mono opacity-60">
                          {member.company || currentOrg.name}
                        </span>
                      </div>

                      {/* Mini CTA button preview */}
                      <div 
                        className="px-2 py-1 rounded-lg text-[10px] font-bold text-white shadow-2xs shrink-0"
                        style={{ backgroundColor: currentTheme.primaryColor }}
                      >
                        Contact
                      </div>
                    </div>
                  ))}
                </div>

                {profiles.length > 3 && (
                  <p className="text-center text-[11px] text-slate-500 font-medium">
                    + {profiles.length - 3} autre(s) collaborateur(s) dans l'équipe
                  </p>
                )}
              </div>
            )}

          </div>
        </div>

      </div>
      )}

      {/* 3. TEAM ROLLOUT MODAL ("DÉPLOIEMENT CHARTE ÉQUIPE") */}
      {rolloutModalTemplate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  Déployer la Charte sur l’Équipe
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Appliquer le modèle <strong>"{rolloutModalTemplate.name}"</strong>
                </p>
              </div>
              <button
                onClick={() => setRolloutModalTemplate(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex flex-col gap-5">
              
              {/* Scope selector */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  Sélectionnez les collaborateurs cibles :
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      setRolloutScope('all');
                      setSelectedProfileIdsForRollout(profiles.map((p) => p.id));
                    }}
                    className={`p-3 rounded-2xl text-xs font-bold border transition text-center flex flex-col items-center gap-1 cursor-pointer ${
                      rolloutScope === 'all'
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-900 ring-1 ring-indigo-500'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white'
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    <span>Toute l’entreprise</span>
                    <span className="text-[10px] font-normal text-slate-500">({profiles.length} profils)</span>
                  </button>

                  <button
                    onClick={() => {
                      setRolloutScope('sales');
                      const salesIds = profiles.filter((p) => p.department?.toLowerCase().includes('commerc') || p.department?.toLowerCase().includes('sales') || p.id === activeProfile.id).map((p) => p.id);
                      setSelectedProfileIdsForRollout(salesIds.length ? salesIds : [activeProfile.id]);
                    }}
                    className={`p-3 rounded-2xl text-xs font-bold border transition text-center flex flex-col items-center gap-1 cursor-pointer ${
                      rolloutScope === 'sales'
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-900 ring-1 ring-indigo-500'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white'
                    }`}
                  >
                    <Briefcase className="w-4 h-4 text-indigo-600" />
                    <span>Pôle Commercial</span>
                    <span className="text-[10px] font-normal text-slate-500">Équipe Sales</span>
                  </button>

                  <button
                    onClick={() => setRolloutScope('selection')}
                    className={`p-3 rounded-2xl text-xs font-bold border transition text-center flex flex-col items-center gap-1 cursor-pointer ${
                      rolloutScope === 'selection'
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-900 ring-1 ring-indigo-500'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white'
                    }`}
                  >
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span>Sur-mesure</span>
                    <span className="text-[10px] font-normal text-slate-500">Choix manuel</span>
                  </button>
                </div>
              </div>

              {/* Specific members checklist if custom selection */}
              {rolloutScope === 'selection' && (
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-2 max-h-48 overflow-y-auto">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-200 text-[11px] font-bold text-slate-600">
                    <span>Collaborateurs ({selectedProfileIdsForRollout.length}/{profiles.length})</span>
                    <button
                      onClick={() => {
                        if (selectedProfileIdsForRollout.length === profiles.length) {
                          setSelectedProfileIdsForRollout([]);
                        } else {
                          setSelectedProfileIdsForRollout(profiles.map((p) => p.id));
                        }
                      }}
                      className="text-indigo-600 hover:underline cursor-pointer"
                    >
                      {selectedProfileIdsForRollout.length === profiles.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                    </button>
                  </div>

                  {profiles.map((p) => {
                    const isChecked = selectedProfileIdsForRollout.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 hover:bg-indigo-50/30 transition cursor-pointer text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setSelectedProfileIdsForRollout((prev) =>
                                isChecked ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                              );
                            }}
                            className="rounded text-indigo-600"
                          />
                          <div>
                            <p className="font-bold text-slate-800">{p.firstName} {p.lastName}</p>
                            <p className="text-[10px] text-slate-500">{p.headline}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">{p.department || 'Général'}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* Options Checkboxes */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-3 text-xs">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={syncBannerImage}
                    onChange={(e) => setSyncBannerImage(e.target.checked)}
                    className="mt-0.5 rounded text-indigo-600"
                  />
                  <div>
                    <span className="font-bold text-slate-800">Harmoniser la bannière d’en-tête</span>
                    <p className="text-[11px] text-slate-500">Applique la même image de marque officielle sur tous les profils.</p>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lockAsDefaultCompanyTheme}
                    onChange={(e) => setLockAsDefaultCompanyTheme(e.target.checked)}
                    className="mt-0.5 rounded text-indigo-600"
                  />
                  <div>
                    <span className="font-bold text-slate-800">Verrouiller comme Charte Officielle Entreprise</span>
                    <p className="text-[11px] text-slate-500">Les nouveaux collaborateurs invités recevront automatiquement ce thème.</p>
                  </div>
                </label>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px]">
                <strong>Garantie de données :</strong> Les coordonnées personnelles (téléphone, email, réseaux sociaux, documents) de chaque collaborateur sont préservées intactes.
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
              <button
                onClick={() => setRolloutModalTemplate(null)}
                className="py-2 px-4 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
              >
                Annuler
              </button>

              <button
                onClick={handleExecuteRollout}
                className="py-2 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-900/20 transition cursor-pointer flex items-center gap-1.5"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Confirmer le déploiement ({rolloutScope === 'all' ? profiles.length : selectedProfileIdsForRollout.length})</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 4. CREATE CUSTOM TEAM TEMPLATE MODAL */}
      {isCreateTemplateModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-100 shadow-2xl overflow-hidden flex flex-col">
            
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  Créer un Modèle d’Entreprise
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enregistrez votre design actuel pour le réutiliser et le partager avec l’équipe.
                </p>
              </div>
              <button
                onClick={() => setIsCreateTemplateModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Nom du modèle *</label>
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="Ex: Charte BEST EXPERTS Audit 2026"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Catégorie</label>
                <select
                  value={newTemplateCategory}
                  onChange={(e) => setNewTemplateCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:bg-white cursor-pointer"
                >
                  <option value="company_official">Charte Entreprise (Officielle)</option>
                  <option value="executive">Direction & C-Level</option>
                  <option value="finance_consulting">Finance & Conseil</option>
                  <option value="tech_saas">Tech & Startups</option>
                  <option value="creative_agency">Créatif & Agences</option>
                  <option value="health_eco">Santé & RSE</option>
                  <option value="luxury_vip">Luxe & VIP</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Public cible / Usage conseillé</label>
                <input
                  type="text"
                  value={newTemplateBestFor}
                  onChange={(e) => setNewTemplateBestFor(e.target.value)}
                  placeholder="Ex: Pôle Commercial, Consultants Seniors..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Badge d'identification</label>
                <input
                  type="text"
                  value={newTemplateBadge}
                  onChange={(e) => setNewTemplateBadge(e.target.value)}
                  placeholder="Ex: Charte Validée, Top Sales..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Description</label>
                <textarea
                  value={newTemplateDescription}
                  onChange={(e) => setNewTemplateDescription(e.target.value)}
                  placeholder="Brève description de la charte..."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsCreateTemplateModalOpen(false)}
                className="py-2 px-4 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveCurrentAsCustomTemplate}
                className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-1"
              >
                <Check className="w-4 h-4" />
                <span>Enregistrer le modèle</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Banner / Cover Image Modal */}
      {isCoverModalOpen && (
        <ImageUploadModal
          isOpen={isCoverModalOpen}
          onClose={() => setIsCoverModalOpen(false)}
          type="cover"
          currentValue={currentTheme.coverImageUrl}
          onSave={(newUrl) => {
            updateTheme({ coverImageUrl: newUrl });
            showToast('Bannière mise à jour dans votre thème');
          }}
        />
      )}

    </div>
  );
};
