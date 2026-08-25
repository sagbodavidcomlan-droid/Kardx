import { GoogleGenAI, Type } from '@google/genai';
import express from 'express';
import type { Request, Response } from 'express';

const CANDIDATE_MODELS = [
  'gemini-3.7-flash',
  'gemini-3.1-flash-lite',
];

export const createApiRouter = () => {
  const router = express.Router();

  // 0. CORS & Preflight Headers
  router.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    next();
  });

  router.use(express.json({ limit: '50mb' }));
  router.use(express.urlencoded({ limit: '50mb', extended: true }));

  // 1. GEMINI MULTIMODAL BUSINESS CARD SCANNER OCR
  router.post('/gemini/scan-card', async (req: Request, res: Response) => {
    try {
      const { imageBase64, mimeType = 'image/jpeg' } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: 'Image base64 requise' });
      }

      // Clean base64 if it has data URL prefix
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-z0-9-+.]+;base64,/, '');

      const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
      const ai = new GoogleGenAI({
        apiKey: apiKey || undefined,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const promptText = `You are a high-precision OCR and entity extraction engine for business cards.
Analyze this business card image carefully and extract all contact and company information accurately.

CRITICAL EXTRACTION RULES:
1. Extract ONLY information that is visibly written on this card image. NEVER invent, hallucinate, or guess names, phone numbers, or emails.
2. Contact Name: Split accurately into 'firstName' and 'lastName' (remove prefixes like Dr, Maître, Ing., Mr, Mme).
3. Company vs Job Title: Differentiate the company/organization name from the individual's job position or title.
4. Phones: Separate office/landline phone from mobile/cell phone (+33 6/7, etc.).
5. Email & Website: Extract exact email and web address.
6. Address: Street address, city, postal code, and country.
7. Social: LinkedIn profile/handle and Twitter/X handle if present.
8. Raw Text: Full verbatim transcript of all readable text on the card.
9. If a field is not present or cannot be read, set its value to "" (empty string).
10. Confidence: Estimate extraction confidence between 0 and 99 (0 if not a business card or unreadable).`;

      const imagePart = {
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: cleanBase64,
        },
      };

      const textPart = {
        text: promptText,
      };

      let parsedData: any = null;
      let lastError: any = null;

      for (const modelName of CANDIDATE_MODELS) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: { parts: [imagePart, textPart] },
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  firstName: { type: Type.STRING, description: 'First name of contact or empty string' },
                  lastName: { type: Type.STRING, description: 'Last name of contact or empty string' },
                  jobTitle: { type: Type.STRING, description: 'Job position or role or empty string' },
                  company: { type: Type.STRING, description: 'Company or organization name or empty string' },
                  email: { type: Type.STRING, description: 'Clean valid email address or empty string' },
                  phone: { type: Type.STRING, description: 'Work or office landline phone number or empty string' },
                  mobile: { type: Type.STRING, description: 'Mobile or direct cell phone number or empty string' },
                  website: { type: Type.STRING, description: 'Company or personal website URL or empty string' },
                  address: { type: Type.STRING, description: 'Physical street address or empty string' },
                  city: { type: Type.STRING, description: 'City name or empty string' },
                  postalCode: { type: Type.STRING, description: 'Postal code or ZIP code or empty string' },
                  country: { type: Type.STRING, description: 'Country name or empty string' },
                  linkedin: { type: Type.STRING, description: 'LinkedIn profile URL or identifier or empty string' },
                  twitter: { type: Type.STRING, description: 'Twitter or X handle or empty string' },
                  notes: { type: Type.STRING, description: 'Slogan, extra details, or services offered or empty string' },
                  rawText: { type: Type.STRING, description: 'Full raw transcript of all text found on the card' },
                  confidence: { type: Type.NUMBER, description: 'Confidence score between 0 and 99' },
                },
              },
            },
          });

          const text = response.text;
          if (text) {
            // Clean markdown code blocks if any
            const cleanedJson = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
            parsedData = JSON.parse(cleanedJson);
            break;
          }
        } catch (modelErr: any) {
          lastError = modelErr;
          console.warn(`Model ${modelName} failed during scan:`, modelErr?.message || modelErr);
        }
      }

      if (parsedData) {
        return res.json({
          success: true,
          data: {
            firstName: parsedData.firstName || '',
            lastName: parsedData.lastName || '',
            jobTitle: parsedData.jobTitle || '',
            company: parsedData.company || '',
            email: parsedData.email || '',
            phone: parsedData.phone || '',
            mobile: parsedData.mobile || '',
            website: parsedData.website || '',
            address: parsedData.address || '',
            city: parsedData.city || '',
            postalCode: parsedData.postalCode || '',
            country: parsedData.country || '',
            linkedin: parsedData.linkedin || '',
            twitter: parsedData.twitter || '',
            notes: parsedData.notes || '',
            rawText: parsedData.rawText || '',
            confidence: typeof parsedData.confidence === 'number' ? parsedData.confidence : (parsedData.rawText ? 90 : 0),
          },
        });
      }

      console.error('All candidate Gemini models failed:', lastError?.message);
      return res.status(500).json({
        success: false,
        error: lastError?.message || 'Erreur lors de l\'analyse de la carte avec l\'IA',
      });
    } catch (err: any) {
      console.error('Gemini Card Scan Exception:', err?.message || err);
      return res.status(500).json({
        success: false,
        error: err?.message || 'Erreur interne du serveur lors de l\'analyse',
      });
    }
  });

  // 2. REAL WEBHOOK TEST SENDER
  router.post('/webhooks/test', async (req: Request, res: Response) => {
    try {
      const { url, payload } = req.body;
      if (!url) {
        return res.status(400).json({ error: 'URL du webhook requise' });
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const testPayload = payload || {
        event: 'lead.created',
        timestamp: new Date().toISOString(),
        data: {
          leadId: `lead_test_${Date.now()}`,
          firstName: 'Jean',
          lastName: 'Dupont',
          company: 'Acme Corp',
          email: 'jean.dupont@example.com',
          phone: '+33 6 12 34 56 78',
          source: 'nfc',
        },
      };

      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'KardX-Webhook-Agent/1.0',
          'X-Kardx-Event': 'lead.created',
        },
        body: JSON.stringify(testPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      return res.json({
        success: resp.ok,
        status: resp.status,
        statusText: resp.statusText,
      });
    } catch (err: any) {
      return res.json({
        success: false,
        error: err?.name === 'AbortError' ? 'Timeout dépassé (6s)' : (err?.message || 'Erreur réseau'),
      });
    }
  });

  return router;
};
