import {
  MARGIN_X,
  CONTENT_WIDTH,
  TABLE_RIGHT_X,
  COLOR_SLATE_900,
  COLOR_SLATE_700,
  COLOR_SLATE_500,
  COLOR_WHITE,
  drawRect,
  drawLine,
  drawText,
  assemblePdf14Document,
} from "@/lib/pdf-canvas";

export * from "@/lib/pdf-canvas";

export interface PdfColumnDef {
  header: string;
  x: number;
  maxChars: number;
  font: "F1" | "F2" | "F3";
  fontSize: number;
  color: [number, number, number];
}

export interface TabularReportConfig {
  subtitle: string;
  filterSummaryLine: string;
  exportedAt: Date;
  summaryCards: {
    title: string;
    value: string;
    accent: [number, number, number];
  }[];
  columns: PdfColumnDef[];
  rows: string[][];
  emptyMessage: string;
}

export function wrapColumnText(text: string, maxChars: number): string[] {
  const clean = text.trim().replace(/\s+/g, " ");
  if (!clean) return ["-"];

  const words = clean.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if (word.length > maxChars) {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = "";
      }
      for (let i = 0; i < word.length; i += maxChars) {
        const chunk = word.slice(i, i + maxChars);
        if (chunk.length === maxChars && i + maxChars < word.length) {
          lines.push(chunk);
        } else {
          currentLine = chunk;
        }
      }
      continue;
    }

    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (candidate.length <= maxChars) {
      currentLine = candidate;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : ["-"];
}

export function buildTabularReportPdfBytes(config: TabularReportConfig): Uint8Array {
  const formattedDate = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(config.exportedAt);

  const pagesCommands: string[][] = [];
  let currentCommands: string[] = [];

  const renderPageHeader = (cmds: string[]) => {
    cmds.push("0.098 0.216 0.427 rg");
    cmds.push(drawRect(MARGIN_X, 34, 28, 28, "f"));
    cmds.push(drawText("A", MARGIN_X + 9.5, 53, "F2", 14, COLOR_WHITE));

    cmds.push(
      drawText("ARAYA BUSINESS HUB", MARGIN_X + 36, 46, "F2", 13, COLOR_SLATE_900)
    );
    cmds.push(
      drawText(config.subtitle, MARGIN_X + 36, 59, "F1", 8.5, COLOR_SLATE_500)
    );
    cmds.push(
      drawText(`Dicetak: ${formattedDate}`, 355, 45, "F1", 8, COLOR_SLATE_700)
    );
    cmds.push(
      drawText(config.filterSummaryLine, 355, 58, "F1", 7.5, COLOR_SLATE_500)
    );

    cmds.push("0.85 0.88 0.92 RG");
    cmds.push("1 w");
    cmds.push(drawLine(MARGIN_X, 72, TABLE_RIGHT_X, 72));
  };

  const startNewPage = () => {
    currentCommands = [];
    pagesCommands.push(currentCommands);
    renderPageHeader(currentCommands);
  };

  startNewPage();

  const cardWidth = (CONTENT_WIDTH - 24) / 3;
  const cardY = 84;
  const cardH = 46;

  config.summaryCards.forEach((card, idx) => {
    const cardX = MARGIN_X + idx * (cardWidth + 12);
    currentCommands.push("0.97 0.98 0.99 rg");
    currentCommands.push(drawRect(cardX, cardY, cardWidth, cardH, "f"));
    currentCommands.push("0.88 0.91 0.94 RG");
    currentCommands.push("0.8 w");
    currentCommands.push(drawRect(cardX, cardY, cardWidth, cardH, "S"));

    const [ar, ag, ab] = card.accent;
    currentCommands.push(`${ar.toFixed(3)} ${ag.toFixed(3)} ${ab.toFixed(3)} rg`);
    currentCommands.push(drawRect(cardX, cardY, 3, cardH, "f"));

    currentCommands.push(
      drawText(card.title, cardX + 10, cardY + 16, "F2", 6.5, COLOR_SLATE_500)
    );
    currentCommands.push(
      drawText(card.value, cardX + 10, cardY + 34, "F2", 11, COLOR_SLATE_900)
    );
  });

  let cursorY = 144;
  const renderTableHeader = (cmds: string[], topY: number) => {
    cmds.push("0.94 0.96 0.98 rg");
    cmds.push(drawRect(MARGIN_X, topY, CONTENT_WIDTH, 22, "f"));
    cmds.push("0.82 0.86 0.90 RG");
    cmds.push("0.8 w");
    cmds.push(drawRect(MARGIN_X, topY, CONTENT_WIDTH, 22, "S"));

    config.columns.forEach((col) => {
      cmds.push(
        drawText(
          col.header.toUpperCase(),
          col.x,
          topY + 14,
          "F2",
          7.5,
          COLOR_SLATE_700
        )
      );
    });
  };

  renderTableHeader(currentCommands, cursorY);
  cursorY += 22;

  if (config.rows.length === 0) {
    currentCommands.push("0.98 0.98 0.99 rg");
    currentCommands.push(drawRect(MARGIN_X, cursorY, CONTENT_WIDTH, 50, "f"));
    currentCommands.push("0.88 0.90 0.93 RG");
    currentCommands.push("0.8 w");
    currentCommands.push(drawRect(MARGIN_X, cursorY, CONTENT_WIDTH, 50, "S"));
    currentCommands.push(
      drawText(
        config.emptyMessage,
        MARGIN_X + 140,
        cursorY + 28,
        "F1",
        8.5,
        COLOR_SLATE_500
      )
    );
  } else {
    config.rows.forEach((row, rowIdx) => {
      const cellLines = row.map((val, cIdx) =>
        wrapColumnText(val, config.columns[cIdx].maxChars)
      );
      const maxLinesInRow = Math.max(...cellLines.map((l) => l.length), 1);
      const rowHeight = Math.max(20, maxLinesInRow * 11 + 7);

      if (cursorY + rowHeight > 780) {
        startNewPage();
        cursorY = 88;
        renderTableHeader(currentCommands, cursorY);
        cursorY += 22;
      }

      if (rowIdx % 2 === 1) {
        currentCommands.push("0.985 0.99 0.995 rg");
        currentCommands.push(drawRect(MARGIN_X, cursorY, CONTENT_WIDTH, rowHeight, "f"));
      }

      currentCommands.push("0.90 0.92 0.94 RG");
      currentCommands.push("0.5 w");
      currentCommands.push(
        drawLine(
          MARGIN_X,
          cursorY + rowHeight,
          TABLE_RIGHT_X,
          cursorY + rowHeight
        )
      );

      config.columns.forEach((col, cIdx) => {
        const lines = cellLines[cIdx];
        lines.forEach((lineText, lIdx) => {
          currentCommands.push(
            drawText(
              lineText,
              col.x,
              cursorY + 12 + lIdx * 10,
              col.font,
              col.fontSize,
              col.color
            )
          );
        });
      });

      cursorY += rowHeight;
    });
  }

  const totalPages = pagesCommands.length;
  pagesCommands.forEach((cmds, pageIdx) => {
    cmds.push("0.88 0.90 0.93 RG");
    cmds.push("0.8 w");
    cmds.push(drawLine(MARGIN_X, 800, TABLE_RIGHT_X, 800));

    cmds.push(
      drawText(
        "Araya Business Hub Platform - Dokumen resmi digenerate secara otomatis oleh sistem.",
        MARGIN_X,
        812,
        "F1",
        7.5,
        COLOR_SLATE_500
      )
    );
    cmds.push(
      drawText(
        `Halaman ${pageIdx + 1} dari ${totalPages}`,
        492,
        812,
        "F2",
        7.5,
        COLOR_SLATE_700
      )
    );
  });

  return assemblePdf14Document(pagesCommands);
}
