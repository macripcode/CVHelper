import MarkdownIt from "markdown-it";
import puppeteer from "puppeteer";

const md = new MarkdownIt();

const CSS = `
  @page { size: A4; margin: 18mm 16mm; }
  body { font-family: "Helvetica Neue", Arial, sans-serif; color: #1a1a1a; font-size: 11pt; line-height: 1.45; }
  h1 { font-size: 20pt; margin-bottom: 2pt; }
  h2 { font-size: 13pt; border-bottom: 1px solid #ccc; padding-bottom: 2pt; margin-top: 16pt; }
  h3 { font-size: 11.5pt; margin-bottom: 2pt; }
  ul { margin-top: 2pt; padding-left: 18pt; }
  p { margin: 4pt 0; }
`;

export function renderMarkdownToHtml(markdown: string): string {
  const body = md.render(markdown);
  return `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>${body}</body></html>`;
}

export async function renderMarkdownToPdf(markdown: string): Promise<Buffer> {
  const html = renderMarkdownToHtml(markdown);
  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    const pdf = await page.pdf({ format: "a4", printBackground: true });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
