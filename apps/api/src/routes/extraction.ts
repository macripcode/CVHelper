import { Hono } from "hono";
import { extractVacancyDetails } from "@cvhelper/vacancy-extractor";

export const extractionRoutes = new Hono();

interface ExtractVacancyDetailsBody {
  jobDescription: string;
}

extractionRoutes.post("/vacancy-details", async (c) => {
  const { jobDescription } = await c.req.json<ExtractVacancyDetailsBody>();

  try {
    const details = await extractVacancyDetails(jobDescription);
    return c.json(details);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error extracting vacancy details";
    return c.json({ error: message }, 500);
  }
});
