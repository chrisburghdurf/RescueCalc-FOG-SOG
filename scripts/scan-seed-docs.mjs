import fs from "node:fs";
import path from "node:path";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

const dir = path.resolve("public/seed_docs");

for (const fileName of fs.readdirSync(dir).filter((name) => name.endsWith(".pdf"))) {
  const data = fs.readFileSync(path.join(dir, fileName));
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(data) }).promise;
  const page1 = await pdf.getPage(1);
  const textContent = await page1.getTextContent();
  const text = textContent.items
    .map((item) => ("str" in item ? item.str : ""))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  console.log(`\n### ${fileName} | pages=${pdf.numPages}`);
  console.log(text.slice(0, 700));
}
