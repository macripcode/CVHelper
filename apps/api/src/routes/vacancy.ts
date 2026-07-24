import { Hono } from "hono";
import type { VacancyDetails } from "@cvhelper/shared";
import { makeVacancyId, saveVacancyRecord, readVacancyRecord } from "../services/storage.js";

export const vacancyRoutes = new Hono();

interface CreateVacancyBody {
  vacancy: VacancyDetails;
  notes?: string;
}

vacancyRoutes.post("/", async (c) => {
  const body = await c.req.json<CreateVacancyBody>();

  if (!body.vacancy?.company?.trim() && !body.vacancy?.role?.trim()) {
    return c.json({ error: "You must provide at least the company or the role" }, 400);
  }

  const id = makeVacancyId(body.vacancy.company, body.vacancy.role);
  const record = {
    id,
    createdAt: new Date().toISOString(),
    notes: body.notes?.trim() ?? "",
    vacancy: body.vacancy,
    tailoredCvMarkdown: null,
    hasPdf: false,
  };
  await saveVacancyRecord(record);
  return c.json(record);
});

vacancyRoutes.get("/:id", async (c) => {
  const record = await readVacancyRecord(c.req.param("id"));
  if (!record) {
    return c.json({ error: "Job posting not found" }, 404);
  }
  return c.json(record);
});
