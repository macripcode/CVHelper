const GEMINI_MODEL = "gemini-flash-latest";

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}

/**
 * Shared low-level Gemini call reused by every extraction function in this package.
 * Throws only when GEMINI_API_KEY is missing; any network/HTTP/parse failure resolves null
 * so callers can treat "not configured" (a setup problem) differently from "no result" (expected).
 */
export async function callGemini(prompt: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set. Add it to apps/api/.env to enable AI-assisted detection.");
  }

  let response: Response;
  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      },
    );
  } catch {
    return null;
  }

  if (!response.ok) return null;

  const data = (await response.json().catch(() => null)) as GeminiResponse | null;
  return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? null;
}
