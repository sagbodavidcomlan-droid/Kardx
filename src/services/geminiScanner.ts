import { ExtractedCardData } from '../components/scanner/AiCardScanner';
import { preprocessCardImage, PreprocessingOptions } from '../utils/imagePreprocessing';
import { parseRawOcrTranscript } from '../utils/cardOcrParser';
import { GoogleGenAI, Type } from '@google/genai';

/**
 * Optimizes, enhances and cleans business card image for OCR
 */
export const compressImageForOcr = async (
  dataUrlOrFile: string | File | Blob,
  options: PreprocessingOptions = {}
): Promise<string> => {
  try {
    const result = await preprocessCardImage(dataUrlOrFile, {
      autoLevels: true,
      maxDimension: 1400,
      ...options,
    });
    return result.processedBase64;
  } catch (err) {
    console.warn('Preprocessing fallback triggered:', err);
    if (typeof dataUrlOrFile === 'string') return dataUrlOrFile;
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || '');
      reader.readAsDataURL(dataUrlOrFile);
    });
  }
};

/**
 * Executes Gemini 3.7 Vision OCR with resilient pre-processing and server-side / direct extraction.
 */
export const scanBusinessCardWithGemini = async (
  imageBase64: string,
  options: PreprocessingOptions = {},
  mimeType: string = 'image/jpeg'
): Promise<ExtractedCardData> => {
  let optimizedBase64 = imageBase64;

  try {
    // 1. Run client-side image enhancement (auto-levels, contrast stretch, sharpness)
    const preprocessResult = await preprocessCardImage(imageBase64, {
      autoLevels: options.autoLevels ?? true,
      rotation: options.rotation ?? 0,
      brightness: options.brightness ?? 0,
      contrast: options.contrast ?? 0,
      sharpen: options.sharpen ?? true,
      grayscale: options.grayscale ?? false,
      maxDimension: 1400,
    });
    optimizedBase64 = preprocessResult.processedBase64;
  } catch (prepErr) {
    console.warn('Image preprocessing warning, using raw base64:', prepErr);
    optimizedBase64 = imageBase64;
  }

  // 2. Try calling backend proxy endpoint with timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 28000);

    const res = await fetch('/api/gemini/scan-card', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        imageBase64: optimizedBase64,
        mimeType,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const json = await res.json();
      if (json && json.data) {
        const data = json.data;
        if (data.rawText && (!data.phone || !data.email || !data.city)) {
          const enriched = parseRawOcrTranscript(data.rawText);
          return {
            ...enriched,
            ...data,
            phone: data.phone || enriched.phone || '',
            mobile: data.mobile || enriched.mobile || '',
            email: data.email || enriched.email || '',
            website: data.website || enriched.website || '',
            city: data.city || enriched.city || '',
            postalCode: data.postalCode || enriched.postalCode || '',
          };
        }
        return data;
      }
    } else {
      const errorJson = await res.json().catch(() => ({}));
      console.warn('Backend OCR call returned error status:', res.status, errorJson);
    }
  } catch (netErr: any) {
    console.warn('Backend proxy fetch failed, attempting client-side fallback:', netErr?.message || netErr);
  }

  // 3. Client-side fallback if direct Gemini key is present in client env
  const clientKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (clientKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: clientKey });
      const cleanBase64 = optimizedBase64.replace(/^data:image\/[a-z0-9-+.]+;base64,/, '');

      const promptText = `Analyze this business card image. Extract ONLY visibly written contact details as JSON:
firstName, lastName, jobTitle, company, email, phone, mobile, website, address, city, postalCode, country, linkedin, twitter, notes, rawText.
If absent, use empty string.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: {
          parts: [
            { inlineData: { mimeType, data: cleanBase64 } },
            { text: promptText },
          ],
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              firstName: { type: Type.STRING },
              lastName: { type: Type.STRING },
              jobTitle: { type: Type.STRING },
              company: { type: Type.STRING },
              email: { type: Type.STRING },
              phone: { type: Type.STRING },
              mobile: { type: Type.STRING },
              website: { type: Type.STRING },
              address: { type: Type.STRING },
              city: { type: Type.STRING },
              postalCode: { type: Type.STRING },
              country: { type: Type.STRING },
              linkedin: { type: Type.STRING },
              twitter: { type: Type.STRING },
              notes: { type: Type.STRING },
              rawText: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
            },
          },
        },
      });

      if (response.text) {
        const cleanedJson = response.text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
        const parsed = JSON.parse(cleanedJson);
        return {
          firstName: parsed.firstName || '',
          lastName: parsed.lastName || '',
          jobTitle: parsed.jobTitle || '',
          company: parsed.company || '',
          email: parsed.email || '',
          phone: parsed.phone || '',
          mobile: parsed.mobile || '',
          website: parsed.website || '',
          address: parsed.address || '',
          city: parsed.city || '',
          postalCode: parsed.postalCode || '',
          country: parsed.country || '',
          linkedin: parsed.linkedin || '',
          twitter: parsed.twitter || '',
          notes: parsed.notes || '',
          rawText: parsed.rawText || '',
          confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 85,
        };
      }
    } catch (clientErr: any) {
      console.warn('Direct client Gemini call failed:', clientErr);
    }
  }

  // 4. Return clean editable card template if AI was unreachable
  return {
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
  };
};
