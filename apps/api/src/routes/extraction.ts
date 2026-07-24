import { Hono } from "hono";
import { extractJobPosting } from "@cvhelper/vacancy-extractor";

export const extractionRoutes = new Hono();

interface ExtractJobPostingBody {
  jobDescription: string;
}

extractionRoutes.post("/job-posting", async (c) => {
  const { jobDescription } = await c.req.json<ExtractJobPostingBody>();

  try {
    const analysis = await extractJobPosting(jobDescription);
    return c.json(analysis);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error extracting the job posting";
    return c.json({ error: message }, 500);
  }
});
