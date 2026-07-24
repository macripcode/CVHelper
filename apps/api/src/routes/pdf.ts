import { Hono } from "hono";
import { writeFile } from "node:fs/promises";
import { renderMarkdownToPdf } from "../services/pdfRenderer.js";
import { readVacancyRecord, markPdfExported, vacancyPdfPath } from "../services/storage.js";

export const pdfRoutes = new Hono();

interface ExportPdfBody {
  vacancyId: string;
}

pdfRoutes.post("/", async (c) => {
  const { vacancyId } = await c.req.json<ExportPdfBody>();
  const record = await readVacancyRecord(vacancyId);
  if (!record?.tailoredCvMarkdown) {
    return c.json({ error: "This job posting doesn't have a tailored resume to export yet" }, 400);
  }
  const pdf = await renderMarkdownToPdf(record.tailoredCvMarkdown);
  await writeFile(vacancyPdfPath(vacancyId), pdf);
  await markPdfExported(vacancyId);
  return c.json({ vacancyId, downloadUrl: `/api/pdf/${vacancyId}/download` });
});

pdfRoutes.get("/:id/download", async (c) => {
  const id = c.req.param("id");
  const record = await readVacancyRecord(id);
  if (!record?.hasPdf) {
    return c.json({ error: "PDF not found" }, 404);
  }
  const { readFile } = await import("node:fs/promises");
  const buffer = await readFile(vacancyPdfPath(id));
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${id}.pdf"`,
    },
  });
});
