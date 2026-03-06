import fs from "node:fs";
import path from "node:path";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

const root = path.resolve("public/seed_docs");
const outPath = path.resolve("data/seed_doc_profiles.json");

function normalize(text) {
  return text.replace(/\s+/g, " ").trim();
}

async function extractPageText(pdf, pageNumber) {
  const page = await pdf.getPage(pageNumber);
  const content = await page.getTextContent();
  return normalize(content.items.map((item) => ("str" in item ? item.str : "")).join(" "));
}

const profiles = [];

for (const fileName of fs.readdirSync(root).filter((name) => name.endsWith(".pdf")).sort()) {
  const data = fs.readFileSync(path.join(root, fileName));
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(data) }).promise;

  const samples = [];
  for (const pageNumber of [1, 2, 3]) {
    if (pageNumber > pdf.numPages) {
      continue;
    }
    const text = await extractPageText(pdf, pageNumber);
    if (text) {
      samples.push({ page: pageNumber, excerpt: text.slice(0, 350) });
    }
  }

  profiles.push({
    fileName,
    pageCount: pdf.numPages,
    titleGuess: samples[0]?.excerpt?.slice(0, 140) ?? fileName,
    sampleText: samples,
  });
}

fs.writeFileSync(outPath, `${JSON.stringify(profiles, null, 2)}\n`);
console.log(`Wrote ${profiles.length} profiles to ${outPath}`);
