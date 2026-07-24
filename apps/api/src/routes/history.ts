import { Hono } from "hono";
import { listVacancies } from "../services/storage.js";

export const historyRoutes = new Hono();

historyRoutes.get("/", async (c) => {
  const vacancies = await listVacancies();
  return c.json(vacancies);
});
