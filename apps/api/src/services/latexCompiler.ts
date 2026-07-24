import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const SOURCE_FILENAME = "cv.tex";
const OUTPUT_FILENAME = "cv.pdf";
const LOG_FILENAME = "cv.log";

function extractLogTail(log: string): string {
  const lines = log.split("\n").filter(Boolean);
  return lines.slice(-15).join("\n");
}

/** Compiles a LaTeX source string to a PDF buffer using a local `pdflatex` installation. */
export async function compileLatexToPdf(texSource: string): Promise<Buffer> {
  const workDir = await mkdtemp(path.join(tmpdir(), "cvhelper-latex-"));
  const sourcePath = path.join(workDir, SOURCE_FILENAME);

  try {
    await writeFile(sourcePath, texSource, "utf-8");

    try {
      await execFileAsync(
        "pdflatex",
        ["-interaction=nonstopmode", "-halt-on-error", `-output-directory=${workDir}`, sourcePath],
        { cwd: workDir },
      );
    } catch (err) {
      let logTail = "";
      try {
        logTail = extractLogTail(await readFile(path.join(workDir, LOG_FILENAME), "utf-8"));
      } catch {
        // no log file available; fall through with empty logTail
      }

      if (err && typeof err === "object" && "code" in err && (err as NodeJS.ErrnoException).code === "ENOENT") {
        throw new Error(
          "pdflatex was not found on this machine. Install a LaTeX distribution (e.g. `brew install --cask basictex` on macOS) and make sure `pdflatex` is on your PATH.",
        );
      }

      throw new Error(`LaTeX compilation failed.${logTail ? `\n\n${logTail}` : ""}`);
    }

    return await readFile(path.join(workDir, OUTPUT_FILENAME));
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}
