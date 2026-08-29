import { GoogleGenAI } from '@google/genai';

let geminiClient: GoogleGenAI | null = null;

/**
 * Lazy-initialized GoogleGenAI client with required 'User-Agent': 'aistudio-build'
 */
export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }

  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  return geminiClient;
}

/**
 * Helper to generate text safely using 'gemini-3.7-flash' (standard non-paid text model)
 */
export async function generateSafeAiAnalysis(prompt: string, systemInstruction?: string): Promise<string | null> {
  const client = getGeminiClient();
  if (!client) {
    return null;
  }

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: systemInstruction ? { systemInstruction } : undefined,
    });
    return response.text ?? null;
  } catch (error) {
    console.error('Gemini API execution note:', error);
    return null;
  }
}
