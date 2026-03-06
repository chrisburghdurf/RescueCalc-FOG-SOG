import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";

const outDir = path.resolve("sample_docs");
fs.mkdirSync(outDir, { recursive: true });

function createPdf(fileName, title, sections) {
  const filePath = path.join(outDir, fileName);
  const doc = new PDFDocument({ margin: 44 });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  doc.fontSize(16).text(title, { underline: true });
  doc.moveDown(0.8);
  doc.fontSize(10).fillColor("#333").text("Non-proprietary training sample document for app testing.");

  sections.forEach((section, index) => {
    doc.addPage();
    doc.fontSize(13).fillColor("#111").text(`${index + 1}. ${section.heading}`);
    doc.moveDown(0.6);
    doc.fontSize(10).fillColor("#222");
    section.lines.forEach((line) => {
      doc.text(`- ${line}`, { lineGap: 2 });
    });
  });

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
  });
}

await createPdf("fog-sample.pdf", "Sample Field Operations Guide (Training Extract)", [
  {
    heading: "Lift and Capture Rhythm",
    lines: [
      "Raise load in short increments and stop to evaluate movement.",
      "Insert cribbing capture after each controlled increment.",
      "Keep personnel clear of pinch points during load transition.",
      "Verify contact surface stability before adding pressure."
    ]
  },
  {
    heading: "Air Bag Lift Setup",
    lines: [
      "Center bag under strongest available contact area.",
      "Stacking or offset requires additional stabilization controls.",
      "Confirm pressure source, hose routing, and communication plan.",
      "Do not exceed rated bag pressure or labeled capacity."
    ]
  }
]);

await createPdf("sog-sample.pdf", "Sample Shoring Operations Guide (Training Extract)", [
  {
    heading: "Raker Shore Geometry",
    lines: [
      "Typical raker setup uses an angle between 45 and 60 degrees.",
      "Measure wall height and establish base setback before cutting members.",
      "Install sole plate on stable surface and verify bearing.",
      "Monitor wall and shore movement continuously during operations."
    ]
  },
  {
    heading: "Shore Class Verification",
    lines: [
      "Member sizing and fastening vary by load class and span.",
      "Confirm nailing pattern and connection method before loading.",
      "Re-tighten and inspect after initial loading cycle.",
      "Escalate to technical specialist if cracks or displacement increase."
    ]
  }
]);

console.log("Sample PDFs generated in sample_docs/");
