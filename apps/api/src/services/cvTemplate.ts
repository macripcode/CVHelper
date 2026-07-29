import type { Candidate } from "@cvhelper/shared";

export function candidateToMarkdown(candidate: Candidate): string {
  const { personal } = candidate;
  const lines: string[] = [];

  lines.push(`# ${personal.name || "Untitled candidate"}`);
  if (personal.professionalTitle) lines.push(personal.professionalTitle);

  const contact = [personal.location, personal.email, personal.phone].filter(Boolean).join(" | ");
  if (contact) lines.push(contact);

  const links = [personal.linkedin, personal.github, personal.website].filter(Boolean).join(" | ");
  if (links) lines.push(links);

  lines.push("");

  if (candidate.summary) {
    lines.push("## Summary", candidate.summary, "");
  }

  if (candidate.experience.length > 0) {
    lines.push("## Experience");
    for (const exp of candidate.experience) {
      const title = [exp.role, exp.company].filter(Boolean).join(" — ");
      const dates = [exp.startDate, exp.endDate].filter(Boolean).join(" - ");
      lines.push(`### ${title}${dates ? ` | ${dates}` : ""}`);
      if (exp.description) lines.push(exp.description);
      if (exp.projects.length > 0) {
        for (const project of exp.projects) {
          lines.push(`**${project.name}**`);
          for (const goal of project.goals) lines.push(`- ${goal}`);
        }
      } else {
        for (const achievement of exp.achievements) lines.push(`- ${achievement}`);
      }
      lines.push("");
    }
  }

  if (candidate.education.length > 0) {
    lines.push("## Education");
    for (const edu of candidate.education) {
      const dates = [edu.startDate, edu.endDate].filter(Boolean).join(" - ");
      lines.push(`**${edu.degree}** — ${edu.institution}${dates ? ` (${dates})` : ""}`);
    }
    lines.push("");
  }

  if (candidate.techStack.length > 0) {
    lines.push("## Tech Stack", candidate.techStack.join(", "), "");
  }

  if (candidate.softSkills.length > 0) {
    lines.push("## Soft Skills", candidate.softSkills.join(", "), "");
  }

  if (candidate.languages.length > 0) {
    lines.push("## Languages", candidate.languages.map((l) => `${l.language} (${l.level})`).join(", "));
  }

  return lines.join("\n").trim();
}
