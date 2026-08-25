import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { scanBusinessCardWithGemini, compressImageForOcr } from '../../services/geminiScanner';
import { preprocessCardImage, PreprocessingOptions } from '../../utils/imagePreprocessing';
import { parseRawOcrTranscript } from '../../utils/cardOcrParser';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  CheckCircle, 
  Save, 
  RefreshCw, 
  Building, 
  User, 
  Phone, 
  Mail, 
  Globe, 
  MapPin, 
  FileText,
  AlertCircle,
  Layers,
  Zap,
  Play,
  Pause,
  Plus,
  Trash2,
  Check,
  CheckCheck,
  ArrowRight,
  Download,
  Eye,
  Sliders,
  Tag,
  ListOrdered,
  RotateCw,
  Share2,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Filter,
  FileSpreadsheet,
  Sun,
  Contrast,
  Wand2,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon
} from 'lucide-react';

export interface ExtractedCardData {
  firstName: string;
  lastName: string;
  jobTitle: string;
  company: string;
  email: string;
  phone: string;
  mobile?: string;
  website: string;
  address: string;
  city?: string;
  postalCode?: string;
  country?: string;
  linkedin?: string;
  twitter?: string;
  notes?: string;
  rawText?: string;
  confidence: number;
}

export interface QueuedCard {
  id: string;
  originalImageUrl: string;
  processedImageUrl?: string;
  label?: string;
  rotation: number;
  brightness: number;
  contrast: number;
  sharpen: boolean;
  grayscale: boolean;
  autoLevels: boolean;
  status: 'pending' | 'scanning' | 'processed' | 'saved' | 'error';
  extractedData?: ExtractedCardData;
  createdAt: string;
}

const SAMPLE_DEMO_PACK: Array<{ label: string; imageUrl: string; data: ExtractedCardData }> = [
  {
    label: 'Dirigeant BTP & Infrastructures',
    imageUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
    data: {
      firstName: 'Marc',
      lastName: 'Lemoine',
      jobTitle: 'Directeur Associé & Partenariats B2B',
      company: 'Vinci Énergie & Infrastructures',
      email: 'm.lemoine@vinci-energies.fr',
      phone: '+33 1 44 20 89 00',
      mobile: '+33 6 42 19 88 00',
      website: 'https://vinci-energies.com',
      address: '50 Rue de la Victoire',
      city: 'Paris',
      postalCode: '75009',
      country: 'France',
      linkedin: 'linkedin.com/in/marc-lemoine-vinci',
      twitter: '@mlemoine_infra',
      notes: 'Infrastructures énergétiques & décarbonation',
      rawText: 'Vinci Énergie & Infrastructures\nMarc Lemoine\nDirecteur Associé & Partenariats B2B\n50 Rue de la Victoire, 75009 Paris\n+33 6 42 19 88 00 | m.lemoine@vinci-energies.fr\nwww.vinci-energies.com',
      confidence: 98,
    },
  },
  {
    label: 'Fondatrice Startup DeepTech',
    imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80',
    data: {
      firstName: 'Aïssata',
      lastName: 'Diop',
      jobTitle: 'Co-Founder & CEO',
      company: 'NovaTech Africa Ventures',
      email: 'aissata@novatech-africa.com',
      phone: '+221 33 800 12 34',
      mobile: '+221 77 890 12 34',
      website: 'https://novatech-africa.com',
      address: 'Immeuble Horizon, Plateau',
      city: 'Dakar',
      postalCode: 'BP 11000',
      country: 'Sénégal',
      linkedin: 'linkedin.com/in/aissata-diop-tech',
      twitter: '@aissata_ventures',
      notes: 'Fonds d\'accélération FinTech & IA',
      rawText: 'NovaTech Africa Ventures\nAïssata Diop\nCo-Founder & CEO\nImmeuble Horizon, Plateau Dakar\n+221 77 890 12 34 | aissata@novatech-africa.com',
      confidence: 96,
    },
  },
  {
    label: 'Directeur Commercial FinTech',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    data: {
      firstName: 'Guillaume',
      lastName: 'Vasseur',
      jobTitle: 'VP Global Sales EMEA',
      company: 'PayFlow Solutions Europe',
      email: 'g.vasseur@payflow.eu',
      phone: '+33 1 70 90 22 11',
      mobile: '+33 7 88 20 45 12',
      website: 'https://payflow.eu',
      address: '14 Rue de Paradis',
      city: 'Paris',
      postalCode: '75010',
      country: 'France',
      linkedin: 'linkedin.com/in/guillaume-vasseur-pay',
      twitter: '@g_vasseur',
      notes: 'Solutions de paiement instantané B2B',
      rawText: 'PayFlow Solutions Europe\nGuillaume Vasseur\nVP Global Sales EMEA\n14 Rue de Paradis, 75010 Paris\n+33 7 88 20 45 12 | g.vasseur@payflow.eu',
      confidence: 99,
    },
  },
  {
    label: 'Avocate d\'Affaires M&A',
    imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
    data: {
      firstName: 'Éléonore',
      lastName: 'de Saint-Germain',
      jobTitle: 'Avocate Associée Fusions-Acquisitions',
      company: 'Cabinet Saint-Germain & Partners',
      email: 'eleonore@sg-avocats.fr',
      phone: '+33 1 44 89 22 10',
      mobile: '+33 6 11 22 33 44',
      website: 'https://sg-avocats.fr',
      address: '8 Boulevard Malesherbes',
      city: 'Paris',
      postalCode: '75008',
      country: 'France',
      linkedin: 'linkedin.com/in/eleonore-sg-avocat',
      notes: 'Barreau de Paris, Conseil M&A',
      rawText: 'Cabinet Saint-Germain & Partners\nÉléonore de Saint-Germain\nAvocate Associée Fusions-Acquisitions\n8 Boulevard Malesherbes, 75008 Paris\n+33 6 11 22 33 44 | eleonore@sg-avocats.fr',
      confidence: 97,
    },
  },
  {
    label: 'Directeur R&D AgroTech',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    data: {
      firstName: 'Koffi',
      lastName: 'Kouassi',
      jobTitle: 'Lead Agronomist & CTO',
      company: 'AgroBio Solutions International',
      email: 'koffi.kouassi@agrobio.ci',
      phone: '+225 21 00 11 22',
      mobile: '+225 07 09 88 12 34',
      website: 'https://agrobio.ci',
      address: 'Zone Industrielle de Yopougon',
      city: 'Abidjan',
      postalCode: '01 BP 4500',
      country: 'Côte d\'Ivoire',
      linkedin: 'linkedin.com/in/koffi-kouassi-agrobio',
      notes: 'Traçabilité agricole et bio-fertilisants',
      rawText: 'AgroBio Solutions International\nKoffi Kouassi\nLead Agronomist & CTO\nZone Industrielle de Yopougon, Abidjan\n+225 07 09 88 12 34 | koffi.kouassi@agrobio.ci',
      confidence: 95,
    },
  },
];

export const AiCardScanner: React.FC = () => {
  const { createLead, activeProfile, profiles, setActiveTab, showToast } = useApp();

  // Mode: 'continuous' (Rafale / Session) or 'single' (Unitaire)
  const [scanMode, setScanMode] = useState<'continuous' | 'single'>('continuous');

  // Single card mode states
  const [singleImage, setSingleImage] = useState<string | null>(null);
  const [singleProcessedImage, setSingleProcessedImage] = useState<string | null>(null);
  const [isSingleScanning, setIsSingleScanning] = useState(false);
  const [singleExtractedData, setSingleExtractedData] = useState<ExtractedCardData | null>(null);
  const [singlePreprocessing, setSinglePreprocessing] = useState<PreprocessingOptions>({
    rotation: 0,
    brightness: 0,
    contrast: 0,
    sharpen: true,
    grayscale: false,
    autoLevels: true,
  });

  // Continuous batch queue states (starts clean with user cards)
  const [queue, setQueue] = useState<QueuedCard[]>([]);
  const [selectedQueueId, setSelectedQueueId] = useState<string>('');
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'processed' | 'saved'>('all');
  const [showAdvancedPreprocessing, setShowAdvancedPreprocessing] = useState(false);

  // Live Camera state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<'environment' | 'user'>('environment');
  const [autoShutterInterval, setAutoShutterInterval] = useState<number | null>(null);
  const [cameraFlash, setCameraFlash] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Batch Session metadata
  const [batchEventTag, setBatchEventTag] = useState('Salon B2B / Événement');
  const [batchTargetProfileId, setBatchTargetProfileId] = useState(activeProfile?.id || '');

  // Keep target profile synchronized
  useEffect(() => {
    if (activeProfile?.id && !batchTargetProfileId) {
      setBatchTargetProfileId(activeProfile.id);
    }
  }, [activeProfile?.id]);

  // Play subtle camera shutter audio chime
  const playCameraChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
    } catch (e) {
      // Ignore if autoplay audio is blocked
    }
  };

  // Synchronize video element srcObject whenever camera is active
  useEffect(() => {
    if (isCameraActive && mediaStreamRef.current && videoRef.current) {
      videoRef.current.srcObject = mediaStreamRef.current;
      videoRef.current.play().catch((err) => {
        console.warn('Video play error:', err);
      });
    }
  }, [isCameraActive]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async (facing: 'environment' | 'user' = cameraFacingMode) => {
    setCameraError(null);
    try {
      if (mediaStreamRef.current) {
        stopCamera();
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const msg = "L'accès direct à la caméra n'est pas disponible sur ce navigateur. Vous pouvez importer des photos directement.";
        setCameraError(msg);
        showToast(msg);
        return;
      }

      let stream: MediaStream | null = null;
      // 1. Try high-definition with desired facing mode
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1920, min: 640 },
            height: { ideal: 1080, min: 480 },
          },
          audio: false,
        });
      } catch (e1) {
        // 2. Try simple facing mode
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facing },
            audio: false,
          });
        } catch (e2) {
          // 3. Try any basic video source
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }
      }

      if (stream) {
        mediaStreamRef.current = stream;
        setIsCameraActive(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        showToast('Caméra activée avec succès !');
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      const isDenied = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';
      const msg = isDenied
        ? "Accès caméra refusé. Veuillez autoriser la caméra dans votre navigateur ou importer des photos."
        : "Impossible d'allumer la caméra. Vous pouvez utiliser le bouton d'importation de fichier.";
      setCameraError(msg);
      setIsCameraActive(false);
      showToast(msg);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    if (autoShutterInterval) {
      clearInterval(autoShutterInterval);
      setAutoShutterInterval(null);
    }
  };

  const toggleCameraFacing = () => {
    const nextFacing = cameraFacingMode === 'environment' ? 'user' : 'environment';
    setCameraFacingMode(nextFacing);
    if (isCameraActive) {
      startCamera(nextFacing);
    }
  };

  // Re-apply preprocessing to a specific queued card
  const reprocessQueuedCardImage = async (card: QueuedCard, newOptions: Partial<QueuedCard>) => {
    const merged = { ...card, ...newOptions };
    try {
      const result = await preprocessCardImage(merged.originalImageUrl, {
        rotation: merged.rotation,
        brightness: merged.brightness,
        contrast: merged.contrast,
        sharpen: merged.sharpen,
        grayscale: merged.grayscale,
        autoLevels: merged.autoLevels,
      });

      setQueue((prev) =>
        prev.map((c) =>
          c.id === card.id
            ? { ...merged, processedImageUrl: result.processedBase64 }
            : c
        )
      );
    } catch (e) {
      console.warn('Reprocess card error:', e);
    }
  };

  // Trigger snapshot from camera
  const handleSnapCamera = async () => {
    if (!isCameraActive || !videoRef.current) {
      showToast("Veuillez d'abord allumer la caméra avant de déclencher la capture.");
      return;
    }

    const videoEl = videoRef.current;
    if (videoEl.readyState < 2 || videoEl.videoWidth === 0) {
      showToast("La caméra initialise le flux vidéo, veuillez patienter un instant...");
      return;
    }

    setCameraFlash(true);
    playCameraChime();
    setTimeout(() => setCameraFlash(false), 150);

    const canvas = document.createElement('canvas');
    canvas.width = videoEl.videoWidth || 1280;
    canvas.height = videoEl.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      showToast("Erreur lors de la capture du viseur vidéo.");
      return;
    }

    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    const snappedUrl = canvas.toDataURL('image/jpeg', 0.95);

    // Run initial auto-enhancement
    const enhanced = await preprocessCardImage(snappedUrl, {
      autoLevels: true,
      sharpen: true,
    });

    if (scanMode === 'continuous') {
      const newCard: QueuedCard = {
        id: `card_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        originalImageUrl: snappedUrl,
        processedImageUrl: enhanced.processedBase64,
        label: `Photo #${queue.length + 1}`,
        rotation: 0,
        brightness: 0,
        contrast: 0,
        sharpen: true,
        grayscale: false,
        autoLevels: true,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      setQueue((prev) => [...prev, newCard]);
      setSelectedQueueId(newCard.id);
      showToast(`Carte #${queue.length + 1} capturée avec succès !`);
    } else {
      setSingleImage(snappedUrl);
      setSingleProcessedImage(enhanced.processedBase64);
      processSingleCardOcr(enhanced.processedBase64);
    }
  };

  // Toggle Auto-shutter
  const toggleAutoShutter = () => {
    if (autoShutterInterval) {
      clearInterval(autoShutterInterval);
      setAutoShutterInterval(null);
      showToast('Capture automatique en pause');
    } else {
      if (!isCameraActive) {
        startCamera();
      }
      const interval = window.setInterval(() => {
        handleSnapCamera();
      }, 3500);
      setAutoShutterInterval(interval);
      showToast('Mode rafale automatique activé (1 photo toutes les 3,5s)');
    }
  };

  // Multi-file upload with preprocessing
  const handleBatchFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newCards: QueuedCard[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const enhanced = await preprocessCardImage(file, {
        autoLevels: true,
        sharpen: true,
      });

      newCards.push({
        id: `card_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 5)}`,
        originalImageUrl: enhanced.processedBase64,
        processedImageUrl: enhanced.processedBase64,
        label: file.name.replace(/\.[^/.]+$/, ''),
        rotation: 0,
        brightness: 0,
        contrast: 0,
        sharpen: true,
        grayscale: false,
        autoLevels: true,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
    }

    setQueue((prev) => [...prev, ...newCards]);
    if (newCards.length > 0) {
      setSelectedQueueId(newCards[0].id);
    }
    showToast(`${newCards.length} carte${newCards.length > 1 ? 's' : ''} importée${newCards.length > 1 ? 's' : ''} et prétraitée${newCards.length > 1 ? 's' : ''} !`);
  };

  // Load demo sample pack
  const handleLoadDemoPack = () => {
    const newItems: QueuedCard[] = SAMPLE_DEMO_PACK.map((item, idx) => ({
      id: `demo_${Date.now()}_${idx}`,
      originalImageUrl: item.imageUrl,
      processedImageUrl: item.imageUrl,
      label: item.label,
      rotation: 0,
      brightness: 0,
      contrast: 0,
      sharpen: true,
      grayscale: false,
      autoLevels: true,
      status: 'pending',
      extractedData: undefined,
      createdAt: new Date().toISOString(),
    }));

    setQueue((prev) => [...prev, ...newItems]);
    setSelectedQueueId(newItems[0].id);
    showToast(`Pack salon démo de ${newItems.length} cartes ajouté !`);
  };

  // Process all pending cards in batch
  const handleProcessAllBatch = async () => {
    const pendingItems = queue.filter((item) => item.status === 'pending' || item.status === 'error');
    if (pendingItems.length === 0) {
      showToast('Toutes les cartes de la session ont déjà été analysées !');
      return;
    }

    setIsBulkProcessing(true);
    setBulkProgress(0);

    const total = pendingItems.length;

    for (let i = 0; i < total; i++) {
      const card = pendingItems[i];

      setQueue((prev) =>
        prev.map((c) => (c.id === card.id ? { ...c, status: 'scanning' } : c))
      );

      try {
        const imageToScan = card.processedImageUrl || card.originalImageUrl;
        let extracted: ExtractedCardData;

        if (imageToScan.startsWith('data:image/')) {
          extracted = await scanBusinessCardWithGemini(imageToScan, {
            rotation: card.rotation,
            brightness: card.brightness,
            contrast: card.contrast,
            sharpen: card.sharpen,
            grayscale: card.grayscale,
            autoLevels: card.autoLevels,
          });
        } else {
          // Demo pack items
          const match = SAMPLE_DEMO_PACK.find((s) => s.label === card.label);
          if (match) {
            extracted = match.data;
          } else {
            extracted = await scanBusinessCardWithGemini(imageToScan, {
              rotation: card.rotation,
              brightness: card.brightness,
              contrast: card.contrast,
              sharpen: card.sharpen,
              grayscale: card.grayscale,
              autoLevels: card.autoLevels,
            });
          }
        }

        setQueue((prev) =>
          prev.map((c) =>
            c.id === card.id
              ? { ...c, status: 'processed', extractedData: extracted }
              : c
          )
        );
      } catch (err: any) {
        console.warn('Batch OCR error:', err);
        setQueue((prev) =>
          prev.map((c) => (c.id === card.id ? { ...c, status: 'error' } : c))
        );
      }

      setBulkProgress(Math.round(((i + 1) / total) * 100));
    }

    setIsBulkProcessing(false);
    showToast(`Extraction IA terminée avec succès pour ${total} carte${total > 1 ? 's' : ''} !`);
  };

  // Rotate a card by 90 degrees
  const handleRotateCard = async (cardId: string) => {
    const target = queue.find((c) => c.id === cardId);
    if (!target) return;
    const nextRot = ((target.rotation || 0) + 90) % 360;
    await reprocessQueuedCardImage(target, { rotation: nextRot });
  };

  // Toggle Magic Auto-Levels Enhancement
  const handleToggleAutoLevels = async (cardId: string) => {
    const target = queue.find((c) => c.id === cardId);
    if (!target) return;
    const nextVal = !target.autoLevels;
    await reprocessQueuedCardImage(target, { 
      autoLevels: nextVal,
      brightness: nextVal ? 0 : target.brightness,
      contrast: nextVal ? 0 : target.contrast,
      sharpen: nextVal ? true : target.sharpen,
    });
    showToast(nextVal ? '✨ Amélioration Magique appliquée !' : 'Amélioration réinitialisée');
  };

  // Save all processed cards to CRM
  const handleSaveBatchToCrm = async () => {
    const readyItems = queue.filter((c) => c.status === 'processed' && c.extractedData);
    if (readyItems.length === 0) {
      showToast('Aucune carte analysée prête à être enregistrée.');
      return;
    }

    for (const card of readyItems) {
      if (!card.extractedData) continue;

      await createLead({
        profileId: batchTargetProfileId,
        firstName: card.extractedData.firstName,
        lastName: card.extractedData.lastName,
        email: card.extractedData.email,
        phone: card.extractedData.phone || card.extractedData.mobile || '',
        company: card.extractedData.company,
        jobTitle: card.extractedData.jobTitle,
        source: 'card_scanner',
        status: 'new',
        tags: ['Scanner IA', 'OCR Vision', batchEventTag],
        meetingContext: `Scanné lors de la session "${batchEventTag}" le ${new Date().toLocaleDateString('fr-FR')}`,
        notes: `Adresse : ${card.extractedData.address || ''} ${card.extractedData.city || ''}. Site : ${card.extractedData.website || ''}. LinkedIn : ${card.extractedData.linkedin || ''}. Notes : ${card.extractedData.notes || ''}`,
        consentGiven: true,
        consentTimestamp: new Date().toISOString(),
      });

      setQueue((prev) =>
        prev.map((c) => (c.id === card.id ? { ...c, status: 'saved' } : c))
      );
    }

    showToast(`${readyItems.length} contact${readyItems.length > 1 ? 's' : ''} importé${readyItems.length > 1 ? 's' : ''} dans le CRM !`);
    setActiveTab('leads');
  };

  // Export batch to CSV
  const handleExportSessionCsv = () => {
    const processed = queue.filter((c) => c.extractedData);
    if (processed.length === 0) {
      showToast('Aucune donnée à exporter.');
      return;
    }

    const headers = ['Prénom', 'Nom', 'Poste', 'Entreprise', 'Email', 'Téléphone Direct', 'Mobile', 'Site Web', 'Adresse', 'Ville', 'Code Postal', 'Pays', 'LinkedIn', 'Score IA'];
    const rows = processed.map((c) => [
      `"${c.extractedData?.firstName || ''}"`,
      `"${c.extractedData?.lastName || ''}"`,
      `"${c.extractedData?.jobTitle || ''}"`,
      `"${c.extractedData?.company || ''}"`,
      `"${c.extractedData?.email || ''}"`,
      `"${c.extractedData?.phone || ''}"`,
      `"${c.extractedData?.mobile || ''}"`,
      `"${c.extractedData?.website || ''}"`,
      `"${c.extractedData?.address || ''}"`,
      `"${c.extractedData?.city || ''}"`,
      `"${c.extractedData?.postalCode || ''}"`,
      `"${c.extractedData?.country || ''}"`,
      `"${c.extractedData?.linkedin || ''}"`,
      `"${c.extractedData?.confidence || 95}%"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kardx-ocr-export-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Fichier CSV exporté avec succès !');
  };

  // Download individual vCard (.vcf)
  const handleDownloadVCard = (data: ExtractedCardData) => {
    const vCardData = `BEGIN:VCARD
VERSION:3.0
N:${data.lastName};${data.firstName};;;
FN:${data.firstName} ${data.lastName}
ORG:${data.company};
TITLE:${data.jobTitle}
TEL;TYPE=WORK,VOICE:${data.phone || ''}
TEL;TYPE=CELL,VOICE:${data.mobile || data.phone || ''}
EMAIL;TYPE=WORK,INTERNET:${data.email}
URL:${data.website}
ADR;TYPE=WORK:;;${data.address};${data.city || ''};;${data.postalCode || ''};${data.country || 'France'}
NOTE:Scanné avec KardX OCR Vision IA.
END:VCARD`;

    const blob = new Blob([vCardData], { type: 'text/vcard;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contact_${data.firstName.toLowerCase()}_${data.lastName.toLowerCase()}.vcf`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Fiche vCard téléchargée (.vcf) !');
  };

  // Remove card from queue
  const handleRemoveQueueItem = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setQueue((prev) => prev.filter((c) => c.id !== id));
    if (selectedQueueId === id) {
      const remaining = queue.filter((c) => c.id !== id);
      if (remaining.length > 0) setSelectedQueueId(remaining[0].id);
    }
  };

  // Clear queue
  const handleClearQueue = () => {
    setQueue([]);
    showToast('Session de scan réinitialisée');
  };

  // Single card OCR execution
  const processSingleCardOcr = async (imageUrl: string) => {
    setIsSingleScanning(true);
    try {
      const extracted = await scanBusinessCardWithGemini(imageUrl, singlePreprocessing);
      setSingleExtractedData(extracted);
      if (extracted.firstName || extracted.company || extracted.email || extracted.phone) {
        showToast('Carte scannée et analysée par l\'IA Gemini Vision !');
      } else {
        showToast('Carte scannée. Vous pouvez compléter ou vérifier les coordonnées.');
      }
    } catch (err: any) {
      console.warn('Single OCR error:', err);
      setSingleExtractedData({
        firstName: '',
        lastName: '',
        jobTitle: '',
        company: '',
        email: '',
        phone: '',
        mobile: '',
        website: '',
        address: '',
        city: '',
        postalCode: '',
        country: '',
        linkedin: '',
        twitter: '',
        notes: '',
        rawText: '',
        confidence: 0,
      });
      showToast('Image traitée. Vous pouvez renseigner les informations.');
    } finally {
      setIsSingleScanning(false);
    }
  };

  const handleSingleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const enhanced = await preprocessCardImage(file, {
      autoLevels: true,
      sharpen: true,
    });
    setSingleImage(enhanced.processedBase64);
    setSingleProcessedImage(enhanced.processedBase64);
    processSingleCardOcr(enhanced.processedBase64);
  };

  const handleSaveSingleToCrm = async () => {
    if (!singleExtractedData) return;

    await createLead({
      profileId: activeProfile.id,
      firstName: singleExtractedData.firstName,
      lastName: singleExtractedData.lastName,
      email: singleExtractedData.email,
      phone: singleExtractedData.phone || singleExtractedData.mobile || '',
      company: singleExtractedData.company,
      jobTitle: singleExtractedData.jobTitle,
      source: 'card_scanner',
      status: 'new',
      tags: ['Scanner IA', 'Carte Papier'],
      meetingContext: `Scanné via KardX OCR le ${new Date().toLocaleDateString('fr-FR')}`,
      notes: `Adresse : ${singleExtractedData.address || ''} ${singleExtractedData.city || ''}. Site : ${singleExtractedData.website || ''}. LinkedIn : ${singleExtractedData.linkedin || ''}`,
      consentGiven: true,
      consentTimestamp: new Date().toISOString(),
    });

    showToast('Contact enregistré dans votre CRM !');
    setActiveTab('leads');
  };

  const selectedQueuedCard = queue.find((c) => c.id === selectedQueueId);
  const processedCount = queue.filter((c) => c.status === 'processed' || c.status === 'saved').length;
  const pendingCount = queue.filter((c) => c.status === 'pending' || c.status === 'error').length;
  const filteredQueue = queue.filter((item) => {
    if (filterStatus === 'pending') return item.status === 'pending' || item.status === 'error';
    if (filterStatus === 'processed') return item.status === 'processed';
    if (filterStatus === 'saved') return item.status === 'saved';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-slate-800 flex flex-col gap-8">
      
      {/* HEADER WITH MODE SWITCHER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
              Scanner IA de Cartes Papier (OCR Vision & Prétraitement)
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-600" />
              Gemini 3.7 Vision + Auto-Levels
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Numérisez vos cartes physiques, améliorez automatiquement la lisibilité (luminosité, rotation, contraste) et synchronisez vos leads dans le CRM.
          </p>
        </div>

        {/* MODE TOGGLE BUTTONS */}
        <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200 self-start md:self-auto">
          <button
            onClick={() => {
              if (isCameraActive) stopCamera();
              setScanMode('continuous');
              showToast('Mode Continu / Rafale activé');
            }}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              scanMode === 'continuous'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>Mode Continu / Rafale</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 text-indigo-700 font-extrabold">
              Multi-cartes
            </span>
          </button>

          <button
            onClick={() => {
              if (isCameraActive) stopCamera();
              setScanMode('single');
              showToast('Mode Unitaire activé');
            }}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              scanMode === 'single'
                ? 'bg-white text-slate-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-slate-500" />
            <span>Mode Unitaire</span>
          </button>
        </div>
      </div>

      {/* CONTINUOUS BATCH SCANNING WORKFLOW */}
      {scanMode === 'continuous' ? (
        <div className="flex flex-col gap-8">
          
          {/* TOP CONTROLS & BATCH SESSION BAR */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                <h3 className="font-bold text-sm text-slate-800">
                  Session de Scan : <span className="text-indigo-600 font-extrabold">{queue.length} Carte{queue.length > 1 ? 's' : ''}</span>
                </h3>
              </div>

              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                  {processedCount} Prête{processedCount > 1 ? 's' : ''}
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 font-bold border border-amber-200">
                  {pendingCount} En attente
                </span>
              </div>
            </div>

            {/* Bulk Action Controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              {queue.length > 0 && (
                <button
                  onClick={handleClearQueue}
                  className="py-2 px-3 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                  title="Réinitialiser la session"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Vider</span>
                </button>
              )}

              {processedCount > 0 && (
                <button
                  onClick={handleExportSessionCsv}
                  className="py-2 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  title="Exporter la session au format CSV"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Export CSV</span>
                </button>
              )}

              <button
                onClick={handleLoadDemoPack}
                className="py-2 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>+ Pack Démo (5 cartes)</span>
              </button>

              <button
                onClick={handleProcessAllBatch}
                disabled={isBulkProcessing || pendingCount === 0}
                className={`py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                  pendingCount === 0
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-900/20 active:scale-95'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>
                  {isBulkProcessing ? 'Analyse OCR en cours...' : `Tout analyser par l'IA (${pendingCount})`}
                </span>
              </button>

              <button
                onClick={handleSaveBatchToCrm}
                disabled={processedCount === 0}
                className={`py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                  processedCount === 0
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/20 active:scale-95'
                }`}
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Importer dans le CRM ({processedCount})</span>
              </button>
            </div>

          </div>

          {/* PROGRESS BAR */}
          {isBulkProcessing && (
            <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 flex flex-col gap-2 animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
                  Prétraitement & extraction des données par l'IA Gemini Vision...
                </span>
                <span>{bulkProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-indigo-200 overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
                  style={{ width: `${bulkProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* MAIN 3-PANEL WORKBENCH */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* PANEL 1: LIVE VIEWFINDER & BATCH CAPTURE (4 Cols) */}
            <div className="lg:col-span-4 p-6 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col gap-5">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-indigo-600" />
                  Capture & Caméra HD
                </h3>
                <div className="flex items-center gap-2">
                  {isCameraActive && (
                    <button
                      onClick={toggleCameraFacing}
                      className="text-[11px] font-semibold text-slate-500 hover:text-indigo-600 cursor-pointer"
                      title="Changer de caméra"
                    >
                      Inverser
                    </button>
                  )}
                  {isCameraActive ? (
                    <button
                      onClick={stopCamera}
                      className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                    >
                      Éteindre
                    </button>
                  ) : (
                    <button
                      onClick={() => startCamera()}
                      className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
                    >
                      Allumer caméra
                    </button>
                  )}
                </div>
              </div>

              {/* Viewfinder Box */}
              <div className="relative rounded-2xl bg-slate-900 overflow-hidden min-h-[250px] flex flex-col items-center justify-center border border-slate-800 text-white">
                
                {/* Camera Flash effect */}
                {cameraFlash && (
                  <div className="absolute inset-0 bg-white z-30 animate-out fade-out duration-150"></div>
                )}

                {isCameraActive ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover min-h-[250px]"
                  />
                ) : (
                  <div className="p-6 text-center flex flex-col items-center justify-center gap-2 text-slate-400">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mb-1">
                      <Camera className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-200">Viseur Prêt</p>
                    <p className="text-[11px] text-slate-400 max-w-[220px]">
                      Cadrez les cartes physiques et déclenchez instantanément.
                    </p>
                  </div>
                )}

                {/* Card boundary guide overlay */}
                <div className="absolute inset-5 border-2 border-dashed border-white/60 rounded-xl pointer-events-none flex items-center justify-center shadow-sm">
                  <span className="text-[10px] font-bold text-white/90 bg-black/50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Cadrez la carte ici
                  </span>
                </div>

                {/* Shutter bar */}
                <div className="absolute bottom-3 inset-x-3 flex items-center justify-between gap-2 z-20">
                  <button
                    onClick={toggleAutoShutter}
                    className={`py-1.5 px-2.5 rounded-xl text-[11px] font-bold backdrop-blur-md transition flex items-center gap-1.5 cursor-pointer ${
                      autoShutterInterval
                        ? 'bg-rose-600 text-white'
                        : 'bg-black/60 text-slate-200 hover:bg-black/80'
                    }`}
                  >
                    {autoShutterInterval ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{autoShutterInterval ? 'Pause Rafale' : 'Rafale Auto (3.5s)'}</span>
                  </button>

                  <button
                    onClick={handleSnapCamera}
                    className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-lg flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Déclencher (+1)</span>
                  </button>
                </div>
              </div>

              {/* Multi-file batch dropzone */}
              <div>
                <label className="border-2 border-dashed border-slate-200 hover:border-indigo-500 rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition bg-slate-50 hover:bg-indigo-50/20 group">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleBatchFileUpload}
                    className="hidden"
                  />
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700 group-hover:text-indigo-600">
                    <Upload className="w-4 h-4 text-indigo-600" />
                    <span>Importer plusieurs photos / fichiers</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Sélectionnez plusieurs cartes depuis votre galerie ou ordinateur
                  </p>
                </label>
              </div>

              {/* Session Event & Profile Target settings */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col gap-2.5 text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-indigo-600" />
                  Paramètres de la session
                </span>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tag d'événement / Salon :</label>
                  <input
                    type="text"
                    value={batchEventTag}
                    onChange={(e) => setBatchEventTag(e.target.value)}
                    placeholder="Ex: VivaTech 2026, Congrès B2B..."
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Attribuer au collaborateur :</label>
                  <select
                    value={batchTargetProfileId}
                    onChange={(e) => setBatchTargetProfileId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold cursor-pointer"
                  >
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.firstName} {p.lastName} ({p.company || 'KardX'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

            </div>

            {/* PANEL 2: QUEUE STACK & THUMBNAILS (3 Cols) */}
            <div className="lg:col-span-3 p-6 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col gap-4">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  <ListOrdered className="w-4 h-4 text-indigo-600" />
                  File ({queue.length})
                </h3>

                {/* Filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 cursor-pointer"
                >
                  <option value="all">Toutes</option>
                  <option value="pending">En attente</option>
                  <option value="processed">Analysées</option>
                  <option value="saved">Importées</option>
                </select>
              </div>

              {/* Cards List */}
              <div className="flex flex-col gap-2.5 max-h-[540px] overflow-y-auto pr-1">
                {filteredQueue.length === 0 ? (
                  <div className="p-8 text-center flex flex-col items-center justify-center gap-2 text-slate-400">
                    <Layers className="w-8 h-8 opacity-30 text-slate-400" />
                    <p className="text-xs font-semibold text-slate-600">Aucune carte</p>
                    <p className="text-[11px] text-slate-400">
                      Prenez des photos à gauche ou chargez le pack démo.
                    </p>
                  </div>
                ) : (
                  filteredQueue.map((item, idx) => {
                    const isSelected = item.id === selectedQueueId;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedQueueId(item.id)}
                        className={`p-2.5 rounded-2xl border transition cursor-pointer flex items-center gap-3 relative group ${
                          isSelected
                            ? 'bg-indigo-50/80 border-indigo-400 ring-1 ring-indigo-400 shadow-2xs'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80'
                        }`}
                      >
                        {/* Thumbnail */}
                        <div className="w-12 h-10 rounded-xl overflow-hidden bg-slate-200 shrink-0 border border-slate-200 relative">
                          <img
                            src={item.processedImageUrl || item.originalImageUrl}
                            alt="Card thumb"
                            className="w-full h-full object-cover transition-transform"
                          />
                          {item.status === 'scanning' && (
                            <div className="absolute inset-0 bg-indigo-900/60 flex items-center justify-center">
                              <RefreshCw className="w-3.5 h-3.5 text-white animate-spin" />
                            </div>
                          )}
                        </div>

                        {/* Title & Status */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-slate-800 truncate">
                              {item.extractedData
                                ? `${item.extractedData.firstName} ${item.extractedData.lastName}`
                                : `Carte #${idx + 1}`}
                            </p>
                            <button
                              onClick={(e) => handleRemoveQueueItem(item.id, e)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition"
                              title="Retirer de la file"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between mt-0.5">
                            <p className="text-[10px] text-slate-500 truncate">
                              {item.extractedData?.company || item.label || 'En attente d\'analyse'}
                            </p>
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase ${
                              item.status === 'processed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.status === 'saved'
                                ? 'bg-indigo-100 text-indigo-800'
                                : item.status === 'scanning'
                                ? 'bg-amber-100 text-amber-800 animate-pulse'
                                : 'bg-slate-200 text-slate-700'
                            }`}>
                              {item.status === 'processed' ? 'Prêt' : item.status === 'saved' ? 'Importé' : item.status === 'scanning' ? 'Scan...' : 'Attente'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>

            {/* PANEL 3: CARD INSPECTOR, PREPROCESSING & FIELDS (5 Cols) */}
            <div className="lg:col-span-5 p-6 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col gap-5">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-800">
                    Fiche Prospect Extraite & Prétraitement
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Ajustez l'image et validez les données reconnues
                  </p>
                </div>

                {selectedQueuedCard?.extractedData && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Score IA : {selectedQueuedCard.extractedData.confidence}%
                  </span>
                )}
              </div>

              {selectedQueuedCard ? (
                <div className="flex flex-col gap-4">
                  
                  {/* Photo Preview Strip with Quick Preprocessing Tools */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={selectedQueuedCard.processedImageUrl || selectedQueuedCard.originalImageUrl}
                          alt="Selected preview"
                          className="w-20 h-14 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0 transition-transform"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {selectedQueuedCard.label || 'Carte Papier'}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Rotation : <span className="font-bold text-slate-700">{selectedQueuedCard.rotation}°</span>
                            {selectedQueuedCard.autoLevels && (
                              <span className="ml-1 text-emerald-600 font-bold">• Auto-Niveaux Actif</span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Tool buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleRotateCard(selectedQueuedCard.id)}
                          className="p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 transition cursor-pointer"
                          title="Pivoter l'image de 90°"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleToggleAutoLevels(selectedQueuedCard.id)}
                          className={`p-2 rounded-xl border transition cursor-pointer flex items-center gap-1 text-xs font-bold ${
                            selectedQueuedCard.autoLevels
                              ? 'bg-purple-100 text-purple-700 border-purple-300 shadow-2xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                          title="Amélioration automatique de la luminosité et du contraste"
                        >
                          <Wand2 className="w-3.5 h-3.5 text-purple-600" />
                        </button>

                        <button
                          onClick={() => setShowAdvancedPreprocessing(!showAdvancedPreprocessing)}
                          className={`p-2 rounded-xl border transition cursor-pointer text-xs font-bold ${
                            showAdvancedPreprocessing
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                          title="Ajustements d'image avancés"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                        </button>

                        {selectedQueuedCard.status === 'pending' && (
                          <button
                            onClick={async () => {
                              setQueue((prev) =>
                                prev.map((c) => (c.id === selectedQueuedCard.id ? { ...c, status: 'scanning' } : c))
                              );
                              try {
                                const imageToScan = selectedQueuedCard.processedImageUrl || selectedQueuedCard.originalImageUrl;
                                const extracted = await scanBusinessCardWithGemini(imageToScan, {
                                  rotation: selectedQueuedCard.rotation,
                                  brightness: selectedQueuedCard.brightness,
                                  contrast: selectedQueuedCard.contrast,
                                  sharpen: selectedQueuedCard.sharpen,
                                  grayscale: selectedQueuedCard.grayscale,
                                  autoLevels: selectedQueuedCard.autoLevels,
                                });
                                setQueue((prev) =>
                                  prev.map((c) =>
                                    c.id === selectedQueuedCard.id
                                      ? { ...c, status: 'processed', extractedData: extracted }
                                      : c
                                  )
                                );
                                showToast('Carte analysée avec succès !');
                              } catch (e) {
                                showToast('Erreur lors de l\'analyse');
                              }
                            }}
                            className="py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-2xs cursor-pointer flex items-center gap-1"
                          >
                            <Zap className="w-3 h-3" />
                            <span>Analyser</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Advanced Preprocessing Controls Drawer */}
                    {showAdvancedPreprocessing && (
                      <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs animate-in fade-in duration-150">
                        <div>
                          <label className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-1">
                            <span className="flex items-center gap-1">
                              <Sun className="w-3 h-3 text-amber-500" />
                              Luminosité
                            </span>
                            <span className="font-mono text-slate-700">{selectedQueuedCard.brightness}%</span>
                          </label>
                          <input
                            type="range"
                            min="-50"
                            max="50"
                            value={selectedQueuedCard.brightness}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              reprocessQueuedCardImage(selectedQueuedCard, { brightness: val, autoLevels: false });
                            }}
                            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                          />
                        </div>

                        <div>
                          <label className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-1">
                            <span className="flex items-center gap-1">
                              <Contrast className="w-3 h-3 text-indigo-500" />
                              Contraste
                            </span>
                            <span className="font-mono text-slate-700">{selectedQueuedCard.contrast}%</span>
                          </label>
                          <input
                            type="range"
                            min="-50"
                            max="50"
                            value={selectedQueuedCard.contrast}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              reprocessQueuedCardImage(selectedQueuedCard, { contrast: val, autoLevels: false });
                            }}
                            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                          />
                        </div>

                        <div className="flex items-center gap-4 sm:col-span-2 pt-1">
                          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedQueuedCard.sharpen}
                              onChange={(e) => {
                                reprocessQueuedCardImage(selectedQueuedCard, { sharpen: e.target.checked });
                              }}
                              className="rounded text-indigo-600"
                            />
                            <span>Filtre Netteté (Sharpen)</span>
                          </label>

                          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedQueuedCard.grayscale}
                              onChange={(e) => {
                                reprocessQueuedCardImage(selectedQueuedCard, { grayscale: e.target.checked });
                              }}
                              className="rounded text-indigo-600"
                            />
                            <span>Noir & Blanc</span>
                          </label>

                          <button
                            onClick={async () => {
                              const imageToScan = selectedQueuedCard.processedImageUrl || selectedQueuedCard.originalImageUrl;
                              showToast('Ré-analyse de l\'image avec les nouveaux réglages...');
                              try {
                                const extracted = await scanBusinessCardWithGemini(imageToScan, {
                                  rotation: selectedQueuedCard.rotation,
                                  brightness: selectedQueuedCard.brightness,
                                  contrast: selectedQueuedCard.contrast,
                                  sharpen: selectedQueuedCard.sharpen,
                                  grayscale: selectedQueuedCard.grayscale,
                                  autoLevels: selectedQueuedCard.autoLevels,
                                });
                                setQueue((prev) =>
                                  prev.map((c) =>
                                    c.id === selectedQueuedCard.id
                                      ? { ...c, status: 'processed', extractedData: extracted }
                                      : c
                                  )
                                );
                                showToast('Données ré-extraites !');
                              } catch (e) {
                                showToast('Erreur OCR');
                              }
                            }}
                            className="ml-auto text-[11px] font-bold text-indigo-600 hover:text-indigo-700 underline cursor-pointer"
                          >
                            Ré-analyser l'image
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Form fields */}
                  {selectedQueuedCard.extractedData ? (
                    <div className="flex flex-col gap-3">
                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Prénom</label>
                          <input
                            type="text"
                            value={selectedQueuedCard.extractedData.firstName}
                            onChange={(e) => {
                              const val = e.target.value;
                              setQueue((prev) =>
                                prev.map((c) =>
                                  c.id === selectedQueuedCard.id && c.extractedData
                                    ? { ...c, extractedData: { ...c.extractedData, firstName: val } }
                                    : c
                                )
                              );
                            }}
                            className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-semibold focus:bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Nom</label>
                          <input
                            type="text"
                            value={selectedQueuedCard.extractedData.lastName}
                            onChange={(e) => {
                              const val = e.target.value;
                              setQueue((prev) =>
                                prev.map((c) =>
                                  c.id === selectedQueuedCard.id && c.extractedData
                                    ? { ...c, extractedData: { ...c.extractedData, lastName: val } }
                                    : c
                                )
                              );
                            }}
                            className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-semibold focus:bg-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Poste / Titre</label>
                          <input
                            type="text"
                            value={selectedQueuedCard.extractedData.jobTitle}
                            onChange={(e) => {
                              const val = e.target.value;
                              setQueue((prev) =>
                                prev.map((c) =>
                                  c.id === selectedQueuedCard.id && c.extractedData
                                    ? { ...c, extractedData: { ...c.extractedData, jobTitle: val } }
                                    : c
                                )
                              );
                            }}
                            className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Entreprise</label>
                          <input
                            type="text"
                            value={selectedQueuedCard.extractedData.company}
                            onChange={(e) => {
                              const val = e.target.value;
                              setQueue((prev) =>
                                prev.map((c) =>
                                  c.id === selectedQueuedCard.id && c.extractedData
                                    ? { ...c, extractedData: { ...c.extractedData, company: val } }
                                    : c
                                )
                              );
                            }}
                            className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-bold focus:bg-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Email</label>
                          <div className="flex items-center">
                            <input
                              type="email"
                              value={selectedQueuedCard.extractedData.email}
                              onChange={(e) => {
                                const val = e.target.value;
                                setQueue((prev) =>
                                  prev.map((c) =>
                                    c.id === selectedQueuedCard.id && c.extractedData
                                      ? { ...c, extractedData: { ...c.extractedData, email: val } }
                                      : c
                                  )
                                );
                              }}
                              className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Téléphone / Mobile</label>
                          <input
                            type="tel"
                            value={selectedQueuedCard.extractedData.phone || selectedQueuedCard.extractedData.mobile || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setQueue((prev) =>
                                prev.map((c) =>
                                  c.id === selectedQueuedCard.id && c.extractedData
                                    ? { ...c, extractedData: { ...c.extractedData, phone: val, mobile: val } }
                                    : c
                                )
                              );
                            }}
                            className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Site Web</label>
                          <input
                            type="url"
                            value={selectedQueuedCard.extractedData.website}
                            onChange={(e) => {
                              const val = e.target.value;
                              setQueue((prev) =>
                                prev.map((c) =>
                                  c.id === selectedQueuedCard.id && c.extractedData
                                    ? { ...c, extractedData: { ...c.extractedData, website: val } }
                                    : c
                                )
                              );
                            }}
                            className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">LinkedIn</label>
                          <input
                            type="text"
                            value={selectedQueuedCard.extractedData.linkedin || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setQueue((prev) =>
                                prev.map((c) =>
                                  c.id === selectedQueuedCard.id && c.extractedData
                                    ? { ...c, extractedData: { ...c.extractedData, linkedin: val } }
                                    : c
                                )
                              );
                            }}
                            placeholder="linkedin.com/in/..."
                            className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Adresse Physique & Ville</label>
                        <input
                          type="text"
                          value={`${selectedQueuedCard.extractedData.address || ''} ${selectedQueuedCard.extractedData.postalCode || ''} ${selectedQueuedCard.extractedData.city || ''}`.trim()}
                          onChange={(e) => {
                            const val = e.target.value;
                            setQueue((prev) =>
                              prev.map((c) =>
                                c.id === selectedQueuedCard.id && c.extractedData
                                  ? { ...c, extractedData: { ...c.extractedData, address: val } }
                                  : c
                              )
                            );
                          }}
                          className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white"
                        />
                      </div>

                      {/* Action buttons for single inspected card */}
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => handleDownloadVCard(selectedQueuedCard.extractedData!)}
                          className="py-2 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                        >
                          <Download className="w-3.5 h-3.5 text-slate-500" />
                          <span>Fiche .vcf</span>
                        </button>

                        <button
                          onClick={async () => {
                            await createLead({
                              profileId: batchTargetProfileId,
                              firstName: selectedQueuedCard.extractedData!.firstName,
                              lastName: selectedQueuedCard.extractedData!.lastName,
                              email: selectedQueuedCard.extractedData!.email,
                              phone: selectedQueuedCard.extractedData!.phone || selectedQueuedCard.extractedData!.mobile || '',
                              company: selectedQueuedCard.extractedData!.company,
                              jobTitle: selectedQueuedCard.extractedData!.jobTitle,
                              source: 'card_scanner',
                              status: 'new',
                              tags: ['Scanner IA', batchEventTag],
                              meetingContext: `Scanné le ${new Date().toLocaleDateString('fr-FR')} (${batchEventTag})`,
                              notes: `Adresse : ${selectedQueuedCard.extractedData!.address || ''}. Site : ${selectedQueuedCard.extractedData!.website || ''}.`,
                              consentGiven: true,
                              consentTimestamp: new Date().toISOString(),
                            });
                            setQueue((prev) =>
                              prev.map((c) => (c.id === selectedQueuedCard.id ? { ...c, status: 'saved' } : c))
                            );
                            showToast('Contact enregistré dans le CRM !');
                          }}
                          className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Enregistrer ce contact</span>
                        </button>
                      </div>

                    </div>
                  ) : (
                    <div className="p-8 text-center flex flex-col items-center justify-center gap-3 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse" />
                      <div>
                        <p className="text-xs font-bold text-slate-700">Carte prête pour l'analyse</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Cliquez sur "Analyser" ci-dessus ou lancez l'analyse globale de la file.
                        </p>
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                <div className="p-12 text-center text-slate-400">
                  Sélectionnez une carte dans la file pour afficher ses détails.
                </div>
              )}

            </div>

          </div>

        </div>
      ) : (
        /* SINGLE CARD SCANNING MODE */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left panel: Upload & Viewfinder (5 cols) */}
          <div className="lg:col-span-5 p-6 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col gap-5">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Camera className="w-4 h-4 text-indigo-600" />
                Numériser une carte de visite
              </h3>
            </div>

            {/* Viewfinder or Upload Box */}
            <div className="relative rounded-2xl bg-slate-900 overflow-hidden min-h-[260px] flex flex-col items-center justify-center border border-slate-800 text-white">
              {isCameraActive ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover min-h-[260px]"
                />
              ) : singleProcessedImage ? (
                <img
                  src={singleProcessedImage}
                  alt="Scanned card"
                  className="w-full h-full object-contain max-h-[300px]"
                />
              ) : (
                <div className="p-8 text-center flex flex-col items-center justify-center gap-2 text-slate-400">
                  <Camera className="w-10 h-10 text-slate-500 mb-1" />
                  <p className="text-xs font-bold text-slate-200">Prêt pour la capture</p>
                  <p className="text-[11px] text-slate-400">
                    Utilisez votre caméra ou importez une photo depuis votre appareil.
                  </p>
                </div>
              )}

              {/* Shutter controls */}
              <div className="absolute bottom-3 inset-x-3 flex items-center justify-between gap-2 z-20">
                {isCameraActive ? (
                  <>
                    <button
                      onClick={stopCamera}
                      className="py-1.5 px-3 rounded-xl bg-black/60 hover:bg-black/80 text-white text-xs font-bold backdrop-blur-md cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleSnapCamera}
                      className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-lg flex items-center gap-1.5 cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Prendre la photo</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => startCamera()}
                    className="w-full py-2 px-4 rounded-xl bg-indigo-600/90 hover:bg-indigo-600 text-white text-xs font-bold backdrop-blur-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Activer la caméra HD</span>
                  </button>
                )}
              </div>
            </div>

            {/* File dropzone */}
            <div>
              <label className="border-2 border-dashed border-slate-200 hover:border-indigo-500 rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition bg-slate-50 hover:bg-indigo-50/20 group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSingleFileUpload}
                  className="hidden"
                />
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 group-hover:text-indigo-600">
                  <Upload className="w-4 h-4 text-indigo-600" />
                  <span>Importer un fichier image</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Formats JPEG, PNG, WEBP (optimisation automatique)
                </p>
              </label>
            </div>

          </div>

          {/* Right panel: Extracted Fields (7 cols) */}
          <div className="lg:col-span-7 p-6 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col gap-5">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-800">
                  Résultats de l'Extraction IA
                </h3>
                <p className="text-[11px] text-slate-500">
                  Champs reconnus et formatés pour votre carnet de contacts
                </p>
              </div>

              {singleExtractedData && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Score de confiance : {singleExtractedData.confidence}%
                </span>
              )}
            </div>

            {isSingleScanning ? (
              <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
                <p className="text-xs font-bold text-slate-800">Analyse OCR Multimodale en cours...</p>
                <p className="text-[11px] text-slate-500">
                  Lecture et extraction des coordonnées avec Gemini Vision
                </p>
              </div>
            ) : singleExtractedData ? (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Prénom</label>
                    <input
                      type="text"
                      value={singleExtractedData.firstName}
                      onChange={(e) => setSingleExtractedData({ ...singleExtractedData, firstName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Nom</label>
                    <input
                      type="text"
                      value={singleExtractedData.lastName}
                      onChange={(e) => setSingleExtractedData({ ...singleExtractedData, lastName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Poste / Fonction</label>
                    <input
                      type="text"
                      value={singleExtractedData.jobTitle}
                      onChange={(e) => setSingleExtractedData({ ...singleExtractedData, jobTitle: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Entreprise</label>
                    <input
                      type="text"
                      value={singleExtractedData.company}
                      onChange={(e) => setSingleExtractedData({ ...singleExtractedData, company: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={singleExtractedData.email}
                      onChange={(e) => setSingleExtractedData({ ...singleExtractedData, email: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Téléphone</label>
                    <input
                      type="tel"
                      value={singleExtractedData.phone || singleExtractedData.mobile || ''}
                      onChange={(e) => setSingleExtractedData({ ...singleExtractedData, phone: e.target.value, mobile: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Site Web</label>
                    <input
                      type="url"
                      value={singleExtractedData.website}
                      onChange={(e) => setSingleExtractedData({ ...singleExtractedData, website: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">LinkedIn</label>
                    <input
                      type="text"
                      value={singleExtractedData.linkedin || ''}
                      onChange={(e) => setSingleExtractedData({ ...singleExtractedData, linkedin: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Adresse</label>
                  <input
                    type="text"
                    value={`${singleExtractedData.address || ''} ${singleExtractedData.postalCode || ''} ${singleExtractedData.city || ''}`.trim()}
                    onChange={(e) => setSingleExtractedData({ ...singleExtractedData, address: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleDownloadVCard(singleExtractedData)}
                    className="py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>Télécharger vCard (.vcf)</span>
                  </button>

                  <button
                    onClick={handleSaveSingleToCrm}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-900/20 transition cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Enregistrer dans mon CRM KardX</span>
                  </button>
                </div>

              </div>
            ) : (
              <div className="p-12 text-center flex flex-col items-center justify-center gap-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400">
                <FileText className="w-10 h-10 text-slate-400 opacity-40" />
                <div>
                  <p className="text-xs font-bold text-slate-700">Aucune carte analysée</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Prenez une photo ou importez un fichier à gauche pour démarrer.
                  </p>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
};
