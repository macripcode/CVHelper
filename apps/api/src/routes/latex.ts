import { Hono } from "hono";
import type { Candidate } from "@cvhelper/shared";
import { candidateToLatex } from "../services/latexTemplate.js";
import { compileLatexToPdf } from "../services/latexCompiler.js";

export const latexRoutes = new Hono();

interface LatexPdfBody {
  candidate: Candidate;
}

latexRoutes.post("/pdf", async (c) => {
  const { candidate } = await c.req.json<LatexPdfBody>();

  const texSource = candidateToLatex(candidate);

  let pdf: Buffer;
  try {
    pdf = await compileLatexToPdf(texSource);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error compiling the LaTeX resume";
    return c.json({ error: message }, 500);
  }

  const filename = (candidate.personal.name || "cv").trim().replace(/\s+/g, "-").toLowerCase();

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}.pdf"`,
    },
  });
});
