import { Hono } from "hono";
import { candidateToMarkdown } from "../services/cvTemplate.js";
import { readCandidate, readVacancyRecord, updateTailoredCv } from "../services/storage.js";

export const tailorRoutes = new Hono();

interface TailorBody {
  vacancyId: string;
}

tailorRoutes.post("/", async (c) => {
  const { vacancyId } = await c.req.json<TailorBody>();
  const record = await readVacancyRecord(vacancyId);
  if (!record) {
    return c.json({ error: "Job posting not found" }, 404);
  }
  const candidate = await readCandidate();
  const markdown = candidateToMarkdown(candidate);
  await updateTailoredCv(vacancyId, markdown);
  return c.json({ vacancyId, tailoredCvMarkdown: markdown });
});

interface SaveTailorBody {
  vacancyId: string;
  markdown: string;
}

tailorRoutes.put("/", async (c) => {
  const { vacancyId, markdown } = await c.req.json<SaveTailorBody>();
  await updateTailoredCv(vacancyId, markdown);
  return c.json({ vacancyId, tailoredCvMarkdown: markdown });
});
