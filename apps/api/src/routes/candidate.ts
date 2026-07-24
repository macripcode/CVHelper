import { Hono } from "hono";
import type { Candidate } from "@cvhelper/shared";
import { readCandidate, writeCandidate } from "../services/storage.js";

export const candidateRoutes = new Hono();

candidateRoutes.get("/", async (c) => {
  const candidate = await readCandidate();
  return c.json(candidate);
});

candidateRoutes.post("/", async (c) => {
  const body = await c.req.json<Candidate>();
  await writeCandidate(body);
  return c.json(body);
});
