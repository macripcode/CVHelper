import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import type { HealthResponse } from "@cvhelper/shared";
import { candidateRoutes } from "./routes/candidate.js";
import { vacancyRoutes } from "./routes/vacancy.js";
import { tailorRoutes } from "./routes/tailor.js";
import { pdfRoutes } from "./routes/pdf.js";
import { historyRoutes } from "./routes/history.js";
import { latexRoutes } from "./routes/latex.js";

const app = new Hono();

app.use("/*", cors({ origin: process.env.WEB_ORIGIN ?? "http://localhost:5173" }));

app.get("/api/health", (c) => {
  const body: HealthResponse = { status: "ok", timestamp: new Date().toISOString() };
  return c.json(body);
});

app.route("/api/candidate", candidateRoutes);
app.route("/api/vacancy", vacancyRoutes);
app.route("/api/tailor", tailorRoutes);
app.route("/api/pdf", pdfRoutes);
app.route("/api/history", historyRoutes);
app.route("/api/latex", latexRoutes);

const port = Number(process.env.PORT ?? 3001);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`API listening on http://localhost:${info.port}`);
});
