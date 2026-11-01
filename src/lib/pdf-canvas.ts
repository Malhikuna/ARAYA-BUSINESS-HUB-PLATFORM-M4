export const PAGE_WIDTH = 595.28; // A4 width in pt
export const PAGE_HEIGHT = 841.89; // A4 height in pt
export const MARGIN_X = 36;
export const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2; // 523.28 pt
export const TABLE_RIGHT_X = MARGIN_X + CONTENT_WIDTH; // 559.28 pt

export const COLOR_NAVY: [number, number, number] = [0.098, 0.216, 0.427]; // #19376d
export const COLOR_TEAL: [number, number, number] = [0.055, 0.455, 0.565]; // #0e7490
export const COLOR_SLATE_900: [number, number, number] = [0.059, 0.09, 0.165]; // #0f172a
export const COLOR_SLATE_700: [number, number, number] = [0.2, 0.255, 0.333]; // #334155
export const COLOR_SLATE_500: [number, number, number] = [0.392, 0.455, 0.545]; // #64748b
export const COLOR_WHITE: [number, number, number] = [1, 1, 1];

export function escapePdfText(input: string): string {
  const sanitized = input
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, " ");

  return sanitized
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

export function pdfY(topY: number): string {
  return (PAGE_HEIGHT - topY).toFixed(2);
}

export function drawRect(
  x: number,
  topY: number,
  w: number,
  h: number,
  mode: "f" | "S" | "B"
): string {
  const bottomY = PAGE_HEIGHT - topY - h;
  return `${x.toFixed(2)} ${bottomY.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re ${mode}`;
}

export function drawLine(x1: number, topY1: number, x2: number, topY2: number): string {
  return `${x1.toFixed(2)} ${pdfY(topY1)} m ${x2.toFixed(2)} ${pdfY(topY2)} l S`;
}

export function drawText(
  text: string,
  x: number,
  topY: number,
  font: "F1" | "F2" | "F3",
  size: number,
  rgb: [number, number, number]
): string {
  const [r, g, b] = rgb;
  return [
    "BT",
    `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg`,
    `/${font} ${size} Tf`,
    `${x.toFixed(2)} ${pdfY(topY)} Td`,
    `(${escapePdfText(text)}) Tj`,
    "ET",
  ].join("\n");
}

export function assemblePdf14Document(pagesCommands: string[][]): Uint8Array {
  const totalPages = pagesCommands.length;
  const objects: string[] = [];
  const pageObjectIds: number[] = [];

  pagesCommands.forEach((_, idx) => {
    pageObjectIds.push(6 + idx * 2);
  });

  objects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  objects.push(
    `2 0 obj\n<< /Type /Pages /Kids [${pageObjectIds
      .map((id) => `${id} 0 R`)
      .join(" ")}] /Count ${totalPages} >>\nendobj\n`
  );
  objects.push(
    "3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n"
  );
  objects.push(
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n"
  );
  objects.push(
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>\nendobj\n"
  );

  const encoder = new TextEncoder();

  pagesCommands.forEach((cmds, idx) => {
    const pageObjId = 6 + idx * 2;
    const streamObjId = 7 + idx * 2;
    const streamBody = cmds.join("\n");
    const streamByteLength = encoder.encode(streamBody).length;

    objects.push(
      `${pageObjId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> >> /Contents ${streamObjId} 0 R >>\nendobj\n`
    );
    objects.push(
      `${streamObjId} 0 obj\n<< /Length ${streamByteLength} >>\nstream\n${streamBody}\nendstream\nendobj\n`
    );
  });

  const header = "%PDF-1.4\n";
  const parts: string[] = [header];
  const offsets: number[] = [];
  let currentOffset = encoder.encode(header).length;

  for (const objStr of objects) {
    offsets.push(currentOffset);
    parts.push(objStr);
    currentOffset += encoder.encode(objStr).length;
  }

  const xrefStart = currentOffset;
  const totalObjects = objects.length + 1;
  const xrefLines: string[] = [
    "xref",
    `0 ${totalObjects}`,
    "0000000000 65535 f ",
  ];

  for (const offset of offsets) {
    xrefLines.push(`${String(offset).padStart(10, "0")} 00000 n `);
  }

  const trailer = [
    ...xrefLines,
    "trailer",
    `<< /Size ${totalObjects} /Root 1 0 R >>`,
    "startxref",
    String(xrefStart),
    "%%EOF",
  ].join("\n");

  parts.push(trailer);

  return encoder.encode(parts.join(""));
}

export function triggerPdfDownload(pdfBytes: Uint8Array, filename: string): void {
  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], {
    type: "application/pdf",
  });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}
