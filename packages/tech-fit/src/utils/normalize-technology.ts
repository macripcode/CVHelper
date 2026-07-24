import type { TechnologyDefinition } from "../types/technology.types.js";

function cleanInput(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

/**
 * Resolves a raw technology string (possibly an alias, with any casing/spacing)
 * to its canonical name from the catalog. If no match is found, returns the
 * cleaned-up original value unchanged rather than discarding it.
 */
export function normalizeTechnology(input: string, techCatalog: TechnologyDefinition[]): string {
  const cleaned = cleanInput(input);
  if (!cleaned) return "";

  const lower = cleaned.toLowerCase();
  for (const tech of techCatalog) {
    if (tech.name.toLowerCase() === lower) return tech.name;
    if (tech.aliases.some((alias) => alias.toLowerCase() === lower)) return tech.name;
  }
  return cleaned;
}

/**
 * Normalizes a list of raw technology strings to their canonical names,
 * removing duplicates and empty values, sorted alphabetically.
 */
export function normalizeTechnologies(inputs: string[], techCatalog: TechnologyDefinition[]): string[] {
  const normalized = new Set<string>();
  for (const input of inputs) {
    const value = normalizeTechnology(input, techCatalog);
    if (value) normalized.add(value);
  }
  return Array.from(normalized).sort((a, b) => a.localeCompare(b));
}
