import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Support large base64 receipt uploads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Initialize Gemini SDK with User-Agent telemetry header
  const apiKey = process.env.GEMINI_API_KEY || '';
  const ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasApiKey: !!process.env.GEMINI_API_KEY,
      timestamp: new Date().toISOString(),
    });
  });

  // OCR and Information Extraction endpoint for medical receipts
  app.post('/api/extract-medical-bill', async (req, res) => {
    try {
      const { image, mimeType = 'image/jpeg', fileName } = req.body;

      if (!image) {
        return res.status(400).json({ error: 'Image data is required (base64)' });
      }

      if (!apiKey) {
        return res.status(500).json({
          error: 'GEMINI_API_KEY is not configured on the server. Please ensure the secret is set.',
        });
      }

      // Clean base64 string if data URL prefix exists
      let base64Data = image;
      let detectedMime = mimeType;
      if (image.startsWith('data:')) {
        const matches = image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          detectedMime = matches[1];
          base64Data = matches[2];
        } else {
          base64Data = image.split(',')[1] || image;
        }
      }

      const promptText = `
You are an expert medical receipt and clinic tax invoice OCR extraction specialist.
Analyze this medical invoice / receipt image and extract the following required fields with precision:
1. Name of Employee (or Patient)
2. Clinic Name (or Medical Centre / Practice / Hospital)
3. Sub-Total (Amount before GST/tax; if not explicitly stated, compute Grand Total minus GST)
4. GST (Goods and Services Tax / VAT / sales tax; 0 if exempt, zero-rated, or not listed)
5. Grand Total (Final amount payable/paid)
6. Summary of illness (Diagnosis, reason for medical consultation, or inferred medical condition from medicines/services such as "Acute URTI & Bronchitis", "Dental Consultation & Filling", "Hypertension Review", "Fever & Gastritis", "Routine Health Screening", etc.)

Also extract supplementary details if available:
- Date of visit / invoice (YYYY-MM-DD format if possible)
- Receipt / Invoice number
- Currency code (e.g. SGD, USD, MYR, EUR, AUD, or default "$")
- Line items breakdown with item name and amount
- Brief OCR notes or remarks on clarity/confidence.

Return structured JSON conforming to the schema.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: detectedMime,
                data: base64Data,
              },
            },
            {
              text: promptText,
            },
          ],
        },
        config: {
          systemInstruction:
            'You are an accurate OCR information extraction engine for employee medical expense claims. Always extract numeric values as numbers, not strings. Format dates clearly. If diagnosis is not written, deduce a reasonable clinical summary of illness based on prescribed medications or consultation type. If employee/patient name is not present, use "Not Stated".',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              employeeName: {
                type: Type.STRING,
                description: 'Name of the employee or patient on the receipt',
              },
              clinicName: {
                type: Type.STRING,
                description: 'Name of clinic, hospital, doctor, or medical provider',
              },
              subTotal: {
                type: Type.NUMBER,
                description: 'Sub-Total amount before GST/tax (e.g., 85.00)',
              },
              gst: {
                type: Type.NUMBER,
                description: 'GST / Tax amount (e.g., 7.65). 0 if zero tax or not itemized.',
              },
              grandTotal: {
                type: Type.NUMBER,
                description: 'Grand Total paid / payable amount (e.g., 92.65)',
              },
              illnessSummary: {
                type: Type.STRING,
                description:
                  'Summary of illness or medical reason for consultation (e.g., "Acute Upper Respiratory Tract Infection", "Dental Scaling & Polishing", "Allergic Rhinitis")',
              },
              date: {
                type: Type.STRING,
                description: 'Date of receipt / consultation (preferably YYYY-MM-DD)',
              },
              receiptNumber: {
                type: Type.STRING,
                description: 'Receipt or invoice reference number',
              },
              currency: {
                type: Type.STRING,
                description: 'Currency code or symbol, e.g. SGD, USD, $',
              },
              lineItems: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    description: { type: Type.STRING },
                    amount: { type: Type.NUMBER },
                  },
                  required: ['description', 'amount'],
                },
                description: 'Itemized fee breakdown if present',
              },
              notes: {
                type: Type.STRING,
                description: 'Any notable observations or OCR confidence notes',
              },
            },
            required: [
              'employeeName',
              'clinicName',
              'subTotal',
              'gst',
              'grandTotal',
              'illnessSummary',
            ],
          },
        },
      });

      const textOutput = response.text;
      if (!textOutput) {
        throw new Error('Gemini model returned empty response text');
      }

      const extractedData = JSON.parse(textOutput);

      // Sanitize numbers to ensure 2 decimal precision safety
      extractedData.subTotal = Number(extractedData.subTotal) || 0;
      extractedData.gst = Number(extractedData.gst) || 0;
      extractedData.grandTotal = Number(extractedData.grandTotal) || (extractedData.subTotal + extractedData.gst);

      return res.json({
        success: true,
        data: extractedData,
        fileName: fileName || 'Uploaded Receipt',
      });
    } catch (err: any) {
      console.error('Error extracting medical bill:', err);
      return res.status(500).json({
        error: err.message || 'Failed to extract medical bill information',
        details: err.stack,
      });
    }
  });

  // Serve static files in production or delegate to Vite in development
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MediClaim OCR Server active on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
