import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";

const GEMINI_MODEL = "gemini-flash-latest";

/**
 * Calls Gemini with structured-output enforcement (responseMimeType + responseSchema) and returns
 * the raw response text, or null for any network/HTTP failure. Throws only when GEMINI_API_KEY is
 * missing, so callers can treat "not configured" (a setup problem) differently from "no result".
 */
export async function generateStructuredJson(prompt: string, schema: Schema): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set. Add it to apps/api/.env to enable AI-assisted detection.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  });

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch {
    return null;
  }
}

export { SchemaType };
