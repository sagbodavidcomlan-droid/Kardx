import React, { useState, useRef, useMemo } from 'react';
import { 
  X, 
  Upload, 
  Sparkles, 
  Link as LinkIcon, 
  Check, 
  Image as ImageIcon, 
  Search, 
  Trash2, 
  RefreshCw, 
  Smartphone, 
  User, 
  Building2, 
  Sliders, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  Camera,
  Layers
} from 'lucide-react';
import { 
  BANNER_CATEGORIES, 
  BANNER_PRESETS, 
  AVATAR_CATEGORIES, 
  AVATAR_PRESETS, 
  LOGO_CATEGORIES, 
  LOGO_PRESETS,
  ImagePreset,
  ImageCategory
} from '../../utils/imagePresets';

export type ImageUploadType = 'cover' | 'avatar' | 'logo';

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: ImageUploadType;
  currentValue?: string;
  onSave: (newUrl: string) => void;
  title?: string;
  subtitle?: string;
}

export const ImageUploadModal: React.FC<ImageUploadModalProps> = ({
  isOpen,
  onClose,
  type,
  currentValue = '',
  onSave,
  title,
  subtitle,
}) => {
  if (!isOpen) return null;

  // Tabs: 'presets' (Suggestions), 'upload' (Appareil / Galerie), 'url' (Lien Web)
  const [activeTab, setActiveTab] = useState<'presets' | 'upload' | 'url'>('presets');
  
  // Selected Image state
  const [selectedUrl, setSelectedUrl] = useState<string>(currentValue || '');
  const [urlInput, setUrlInput] = useState<string>(currentValue && currentValue.startsWith('http') ? currentValue : '');
  
  // File upload state
  const [dragActive, setDragActive] = useState(false);
  const [fileDetails, setFileDetails] = useState<{ name: string; size: string } | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search & Category filters for presets
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Category and Preset definitions based on type
  const { categories, presets, defaultTitle, defaultSubtitle, previewShape } = useMemo(() => {
    switch (type) {
      case 'cover':
        return {
          categories: BANNER_CATEGORIES,
          presets: BANNER_PRESETS,
          defaultTitle: 'Bannière de Profil Mobile & Carte',
          defaultSubtitle: 'Sélectionnez une photo de notre collection haute définition, ou importez votre propre visuel depuis votre galerie.',
          previewShape: 'banner',
        };
      case 'avatar':
        return {
          categories: AVATAR_CATEGORIES,
          presets: AVATAR_PRESETS,
          defaultTitle: 'Photo de Profil (Portrait)',
          defaultSubtitle: 'Choisissez un portrait professionnel ou téléversez votre photo personnelle pour personnaliser votre profil KardX.',
          previewShape: 'circle',
        };
      case 'logo':
        return {
          categories: LOGO_CATEGORIES,
          presets: LOGO_PRESETS,
          defaultTitle: 'Logo Officiel de l\'Organisation',
          defaultSubtitle: 'Importez le logo de votre entreprise (PNG transparent ou SVG recommandé) ou choisissez un emblème corporate.',
          previewShape: 'square',
        };
    }
  }, [type]);

  // Filtered Presets
  const filteredPresets = useMemo(() => {
    return presets.filter((p) => {
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      const matchesQuery = 
        !searchQuery.trim() ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesQuery;
    });
  }, [presets, selectedCategory, searchQuery]);

  // Handle File Select & Conversion to Data URL
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = (file: File) => {
    setUploadError(null);
    if (!file.type.startsWith('image/')) {
      setUploadError('Veuillez sélectionner un fichier image valide (JPG, PNG, WebP, SVG).');
      return;
    }

    if (file.size > 12 * 1024 * 1024) {
      setUploadError('L\'image dépasse 12 Mo. Veuillez sélectionner un fichier plus léger.');
      return;
    }

    setIsProcessingFile(true);
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);
    setFileDetails({
      name: file.name,
      size: `${sizeInMb} Mo`,
    });

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setSelectedUrl(event.target.result as string);
        setIsProcessingFile(false);
      }
    };
    reader.onerror = () => {
      setUploadError('Impossible de lire le fichier image sélectionné.');
      setIsProcessingFile(false);
    };
    reader.readAsDataURL(file);
  };

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  // Apply URL input
  const handleApplyUrl = () => {
    if (!urlInput.trim()) return;
    setSelectedUrl(urlInput.trim());
  };

  const handleConfirmSave = () => {
    onSave(selectedUrl);
    onClose();
  };

  const handleClearImage = () => {
    setSelectedUrl('');
    setUrlInput('');
    setFileDetails(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden max-h-[92vh] my-auto">
        
        {/* MODAL HEADER */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 via-white to-indigo-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              {type === 'cover' && <Smartphone className="w-5 h-5" />}
              {type === 'avatar' && <User className="w-5 h-5" />}
              {type === 'logo' && <Building2 className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                {title || defaultTitle}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                {subtitle || defaultSubtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 3 SELECTION MODES / TABS */}
        <div className="px-5 sm:px-6 pt-4 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-100 border border-slate-200">
            
            <button
              type="button"
              onClick={() => setActiveTab('presets')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'presets'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>1. Suggestions & Galerie ({presets.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-4 h-4 text-indigo-600" />
              <span>2. Uploader depuis mon appareil</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'url'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LinkIcon className="w-4 h-4 text-indigo-600" />
              <span>3. Lien Web (URL)</span>
            </button>

          </div>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* TAB 1 : PRESETS & SUGGESTIONS */}
          {activeTab === 'presets' && (
            <div className="space-y-4">
              
              {/* Category Pills & Search */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filtrer par mot-clé (ex : finance, tech, sobre, bleu)..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
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

                <div className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-2 rounded-xl shrink-0">
                  {filteredPresets.length} proposition{filteredPresets.length > 1 ? 's' : ''}
                </div>
              </div>

              {/* Categories Scrollable Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                {categories.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  const count = cat.id === 'all' 
                    ? presets.length 
                    : presets.filter((p) => p.category === cat.id).length;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`py-1.5 px-3 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>{cat.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Grid of Preset Images */}
              <div className={`grid gap-3 ${
                type === 'cover' 
                  ? 'grid-cols-2 sm:grid-cols-3' 
                  : type === 'avatar'
                  ? 'grid-cols-2 sm:grid-cols-4'
                  : 'grid-cols-2 sm:grid-cols-4'
              }`}>
                {filteredPresets.map((preset) => {
                  const isCurrentSelected = selectedUrl === preset.url;

                  return (
                    <div
                      key={preset.id}
                      onClick={() => setSelectedUrl(preset.url)}
                      className={`group relative rounded-2xl overflow-hidden border-2 transition cursor-pointer flex flex-col justify-end ${
                        isCurrentSelected
                          ? 'border-indigo-600 ring-2 ring-indigo-500/30 shadow-md scale-[1.02]'
                          : 'border-slate-200 hover:border-indigo-300 hover:shadow-md'
                      } ${type === 'cover' ? 'h-32' : 'h-36'}`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      
                      {/* Dark Gradient Overlay for title readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent pointer-events-none" />

                      {/* Selected Badge */}
                      {isCurrentSelected && (
                        <div className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-indigo-600 text-white text-[10px] font-bold shadow-md flex items-center gap-1 z-10 animate-in fade-in zoom-in">
                          <Check className="w-3 h-3" />
                          <span>Choisi</span>
                        </div>
                      )}

                      {/* Bottom Title & Tag */}
                      <div className="relative z-10 p-2.5 text-left">
                        <p className="text-[11px] font-bold text-white leading-tight drop-shadow-sm line-clamp-1">
                          {preset.title}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Informative fallback message when presets don't match */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-start gap-3 text-xs text-indigo-900">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <p>
                  Ces propositions ne correspondent pas exactement à votre charte ? Basculez sur l'onglet <strong>« 2. Uploader depuis mon appareil »</strong> pour charger votre fichier haute résolution ou collez un lien web.
                </p>
              </div>

            </div>
          )}

          {/* TAB 2 : UPLOAD FROM DEVICE / LOCAL GALLERY */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
                onChange={handleFileChange}
                className="hidden"
              />

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-8 sm:p-10 rounded-3xl border-2 border-dashed transition flex flex-col items-center justify-center text-center cursor-pointer ${
                  dragActive
                    ? 'border-indigo-600 bg-indigo-50/50 scale-[1.01]'
                    : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/20'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-white shadow-md border border-slate-200 flex items-center justify-center text-indigo-600 mb-3 group-hover:scale-110 transition">
                  <Upload className="w-7 h-7" />
                </div>

                <h3 className="font-bold text-sm text-slate-800">
                  Glissez-déposez votre image ici, ou <span className="text-indigo-600 underline">parcourez vos fichiers</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  Formats acceptés : PNG, JPG, JPEG, WEBP, SVG. Taille maximale conseillée : 10 Mo.
                </p>

                {fileDetails && (
                  <div className="mt-4 px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Fichier importé : {fileDetails.name} ({fileDetails.size})</span>
                  </div>
                )}
              </div>

              {uploadError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                <p className="font-bold text-slate-800">💡 Conseil d'optimisation de rendu :</p>
                {type === 'cover' && (
                  <p>Pour la bannière mobile, préférez une image de ratio horizontal (ex : 1200×600 px) avec le sujet principal centré.</p>
                )}
                {type === 'avatar' && (
                  <p>Pour la photo de profil, un cadrage en buste ou visage centré (ratio 1:1, ex : 800×800 px) offre une netteté idéale.</p>
                )}
                {type === 'logo' && (
                  <p>Pour le logo, privilégiez un format PNG avec fond transparent ou un fichier vectoriel SVG pour s'adapter à tous les thèmes.</p>
                )}
              </div>

            </div>
          )}

          {/* TAB 3 : EXTERNAL WEB URL */}
          {activeTab === 'url' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Lien public de l'image (URL)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://images.unsplash.com/... ou https://monentreprise.com/logo.png"
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleApplyUrl}
                    className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition cursor-pointer"
                  >
                    Tester & Appliquer
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Vous pouvez utiliser un lien direct depuis Unsplash, Pexels, Google Drive public ou le CDN de votre entreprise.
                </p>
              </div>

              {/* Sample quick URLs */}
              <div className="pt-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Suggestions d'adresses d'images libres de droit :
                </span>
                <div className="space-y-1.5">
                  {[
                    { label: 'Gratte-ciel Corporate Bleu', url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80' },
                    { label: 'Ondes Marbre & Or Luxe', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80' },
                    { label: 'Dégradé Vibrant Violet / Indigo', url: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1200&q=80' },
                  ].map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setUrlInput(sample.url);
                        setSelectedUrl(sample.url);
                      }}
                      className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 text-xs text-slate-700 hover:text-indigo-700 flex items-center justify-between transition cursor-pointer"
                    >
                      <span className="font-semibold">{sample.label}</span>
                      <span className="text-[10px] text-slate-400 font-mono">Appliquer ➔</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* LIVE PREVIEW BOX */}
          {selectedUrl && (
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <Eye className="w-4 h-4 text-indigo-400" />
                  <span>Aperçu en direct du résultat :</span>
                </div>
                
                <button
                  type="button"
                  onClick={handleClearImage}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Effacer l'image</span>
                </button>
              </div>

              <div className="flex items-center justify-center p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                {previewShape === 'banner' && (
                  <div className="w-full max-w-md h-28 rounded-xl overflow-hidden relative shadow-md">
                    <img src={selectedUrl} alt="Aperçu Bannière" className="w-full h-full object-cover" />
                    <div className="absolute bottom-2 left-3 px-2 py-0.5 rounded-md bg-black/60 text-[10px] font-bold text-white backdrop-blur-xs">
                      Vue Bannière Mobile
                    </div>
                  </div>
                )}

                {previewShape === 'circle' && (
                  <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-indigo-500 shadow-lg">
                    <img src={selectedUrl} alt="Aperçu Avatar" className="w-full h-full object-cover" />
                  </div>
                )}

                {previewShape === 'square' && (
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white/10 p-2 border border-white/20 shadow-md flex items-center justify-center">
                    <img src={selectedUrl} alt="Aperçu Logo" className="max-w-full max-h-full object-contain" />
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* MODAL FOOTER ACTIONS */}
        <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition cursor-pointer"
          >
            Annuler
          </button>

          <div className="flex items-center gap-2">
            {selectedUrl && (
              <button
                type="button"
                onClick={handleConfirmSave}
                className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 transition cursor-pointer flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Valider et enregistrer cette image</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
