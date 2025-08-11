import { Document, Packer, Paragraph, HeadingLevel, TextRun } from "docx";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function exportToDocx(title: string, content: string) {
  const paragraphs = content.split(/\n\n+/).map((block) =>
    new Paragraph({ children: [new TextRun({ text: block, size: 24 })] })
  );

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: title,
            heading: HeadingLevel.HEADING_1,
          }),
          ...paragraphs,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  triggerDownload(blob, slug(`${title}.docx`));
}

export async function exportToPDF(title: string, content: string) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { height, width } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const fontSizeTitle = 18;
  const fontSizeBody = 11;
  let y = height - 50;

  page.drawText(title, {
    x: 50,
    y,
    size: fontSizeTitle,
    font,
    color: rgb(0, 0, 0),
  });
  y -= 30;

  const lines = wrapText(content, 80);
  lines.forEach((line) => {
    if (y < 50) {
      y = height - 50;
      pdfDoc.addPage();
    }
    page.drawText(line, { x: 50, y, size: fontSizeBody, font, color: rgb(0, 0, 0) });
    y -= 16;
  });

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  triggerDownload(blob, slug(`${title}.pdf`));
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function slug(name: string) {
  return name.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-_.]/g, "").toLowerCase();
}

function wrapText(text: string, maxChars: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    if ((current + " " + w).trim().length > maxChars) {
      lines.push(current.trim());
      current = w;
    } else {
      current += " " + w;
    }
  }
  if (current.trim()) lines.push(current.trim());
  return lines;
}
