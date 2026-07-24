import type { TechnologyDefinition } from "../types/technology.types.js";

interface AliasEntry {
  name: string;
  alias: string;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Builds a regex pattern for an alias, tolerating extra whitespace between words. */
function buildAliasPattern(alias: string): string {
  return escapeRegExp(alias.trim()).replace(/ +/g, "\\s+");
}

/**
 * Boundary-safe, case-insensitive regex for an alias: the match must not be
 * directly adjacent to another letter/digit on either side. This prevents
 * short names like "Go", "R", or "C" from matching inside longer words
 * ("Google", "Rust", "Cocoa") while still allowing symbol-adjacent aliases
 * like "C++", "C#", or ".NET" to match correctly.
 */
function buildAliasRegex(alias: string): RegExp | null {
  const pattern = buildAliasPattern(alias);
  if (!pattern) return null;
  return new RegExp(`(?<![A-Za-z0-9])${pattern}(?![A-Za-z0-9])`, "gi");
}

function markRangeConsumed(consumed: boolean[], start: number, end: number): void {
  for (let i = start; i < end; i++) consumed[i] = true;
}

function isRangeConsumed(consumed: boolean[], start: number, end: number): boolean {
  for (let i = start; i < end; i++) {
    if (consumed[i]) return true;
  }
  return false;
}

/**
 * Detects which technologies from the catalog are mentioned in a job posting's text.
 *
 * Matching is done alias-by-alias (longest alias first) against the raw text,
 * marking matched character ranges as "consumed" so that a shorter alias
 * (e.g. "Java", "SQL", "Ruby") can never be credited for text that was already
 * claimed by a longer, more specific alias it happens to be a substring of
 * (e.g. "JavaScript", "SQL Server", "Ruby on Rails").
 */
export function extractJobTechnologies(
  jobDescription: string,
  techCatalog: TechnologyDefinition[],
): string[] {
  const text = jobDescription ?? "";
  if (!text.trim() || techCatalog.length === 0) return [];

  const aliasEntries: AliasEntry[] = [];
  for (const tech of techCatalog) {
    aliasEntries.push({ name: tech.name, alias: tech.name });
    for (const alias of tech.aliases) {
      aliasEntries.push({ name: tech.name, alias });
    }
  }
  aliasEntries.sort((a, b) => b.alias.length - a.alias.length);

  const consumed = new Array<boolean>(text.length).fill(false);
  const found = new Set<string>();

  for (const { name, alias } of aliasEntries) {
    const regex = buildAliasRegex(alias);
    if (!regex) continue;

    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      const start = match.index;
      const end = start + match[0].length;

      if (!isRangeConsumed(consumed, start, end)) {
        markRangeConsumed(consumed, start, end);
        found.add(name);
      }

      if (regex.lastIndex === match.index) {
        regex.lastIndex += 1;
      }
    }
  }

  return Array.from(found).sort((a, b) => a.localeCompare(b));
}
