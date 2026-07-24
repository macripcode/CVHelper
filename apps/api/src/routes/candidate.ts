import { Hono } from "hono";
import { readCandidate } from "../services/storage.js";

export const candidateRoutes = new Hono();

candidateRoutes.get("/", async (c) => {
  const candidate = await readCandidate();
  return c.json(candidate);
});
