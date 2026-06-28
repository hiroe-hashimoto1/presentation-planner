import { jsPDF } from "jspdf";
import type { Project, Slide } from "@/lib/types";
import { flattenParagraphs } from "@/lib/rehearsal";
import { loadSlideImageData, safeExportFilename } from "./images";

/** 16:9 ランドスケープ（mm） */
const PAGE_W = 297;
const PAGE_H = 167;
const MARGIN = 14;

const COLORS = {
  bg: [10, 10, 18] as [number, number, number],
  title: [255, 255, 255] as [number, number, number],
  body: [148, 163, 184] as [number, number, number],
  accent: [34, 211, 238] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
  panel: [17, 24, 39] as [number, number, number],
};

function drawBackground(pdf: jsPDF) {
  pdf.setFillColor(...COLORS.bg);
  pdf.rect(0, 0, PAGE_W, PAGE_H, "F");
}

function drawTitle(pdf: jsPDF, title: string, y: number, size = 22) {
  pdf.setTextColor(...COLORS.title);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(size);
  pdf.text(title || "タイトル", MARGIN, y, { maxWidth: PAGE_W - MARGIN * 2 });
}

function drawSectionLabel(pdf: jsPDF, label: string) {
  pdf.setTextColor(...COLORS.accent);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.text(label, MARGIN, 10);
}

function drawBodyText(
  pdf: jsPDF,
  text: string,
  x: number,
  y: number,
  w: number,
  h: number,
  size = 12
) {
  pdf.setTextColor(...COLORS.body);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(size);
  const lines = pdf.splitTextToSize(text || "", w);
  pdf.text(lines, x, y, { maxWidth: w, baseline: "top" });
}

async function drawImage(
  pdf: jsPDF,
  s: Slide,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const data = await loadSlideImageData(s.imageUrl);
  pdf.setFillColor(...COLORS.panel);
  pdf.setDrawColor(...COLORS.muted);
  pdf.rect(x, y, w, h, "FD");

  if (!data) {
    pdf.setTextColor(...COLORS.muted);
    pdf.setFontSize(11);
    pdf.text("画像", x + w / 2, y + h / 2, { align: "center" });
    return;
  }

  const format = data.includes("image/png")
    ? "PNG"
    : data.includes("image/webp")
    ? "WEBP"
    : "JPEG";
  try {
    pdf.addImage(data, format, x, y, w, h);
  } catch {
    pdf.setTextColor(...COLORS.muted);
    pdf.setFontSize(11);
    pdf.text("画像を読み込めません", x + w / 2, y + h / 2, { align: "center" });
  }
}

async function addContentPage(
  pdf: jsPDF,
  sectionTitle: string,
  s: Slide
) {
  pdf.addPage([PAGE_W, PAGE_H], "landscape");
  drawBackground(pdf);
  drawSectionLabel(pdf, sectionTitle);

  const contentTop = 22;
  const contentH = PAGE_H - contentTop - MARGIN;
  const contentW = PAGE_W - MARGIN * 2;

  switch (s.templateType) {
    case "title-only":
      drawTitle(pdf, s.title, PAGE_H / 2 - 6, 30);
      break;

    case "title-text":
      drawTitle(pdf, s.title, contentTop, 20);
      pdf.setDrawColor(...COLORS.accent);
      pdf.line(MARGIN, contentTop + 4, PAGE_W - MARGIN, contentTop + 4);
      drawBodyText(pdf, s.body, MARGIN, contentTop + 10, contentW, contentH - 10);
      break;

    case "title-image":
      drawTitle(pdf, s.title, contentTop, 20);
      await drawImage(pdf, s, MARGIN, contentTop + 10, contentW, contentH - 10);
      break;

    case "title-text-image": {
      drawTitle(pdf, s.title, contentTop, 18);
      const halfW = (contentW - 6) / 2;
      drawBodyText(pdf, s.body, MARGIN, contentTop + 10, halfW, contentH - 10, 11);
      await drawImage(
        pdf,
        s,
        MARGIN + halfW + 6,
        contentTop + 10,
        halfW,
        contentH - 10
      );
      break;
    }

    case "bullet": {
      drawTitle(pdf, s.title, contentTop, 20);
      const points =
        s.bulletPoints.filter(Boolean).length > 0
          ? s.bulletPoints.filter(Boolean)
          : ["箇条書き 1", "箇条書き 2"];
      let y = contentTop + 12;
      pdf.setFontSize(12);
      for (const point of points) {
        pdf.setTextColor(...COLORS.accent);
        pdf.text("▸", MARGIN, y);
        pdf.setTextColor(...COLORS.body);
        const lines = pdf.splitTextToSize(point, contentW - 8);
        pdf.text(lines, MARGIN + 6, y);
        y += lines.length * 6 + 4;
      }
      break;
    }

    case "two-column": {
      drawTitle(pdf, s.title, contentTop, 20);
      const halfW = (contentW - 6) / 2;
      pdf.setFillColor(...COLORS.panel);
      pdf.rect(MARGIN, contentTop + 10, halfW, contentH - 10, "F");
      pdf.rect(MARGIN + halfW + 6, contentTop + 10, halfW, contentH - 10, "F");
      drawBodyText(
        pdf,
        s.columnLeft,
        MARGIN + 3,
        contentTop + 14,
        halfW - 6,
        contentH - 18,
        11
      );
      drawBodyText(
        pdf,
        s.columnRight,
        MARGIN + halfW + 9,
        contentTop + 14,
        halfW - 6,
        contentH - 18,
        11
      );
      break;
    }
  }
}

export async function exportProjectToPdf(project: Project): Promise<void> {
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [PAGE_W, PAGE_H],
  });

  drawBackground(pdf);
  pdf.setTextColor(...COLORS.title);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(32);
  pdf.text(project.title || "企画提案", PAGE_W / 2, PAGE_H / 2 - 8, {
    align: "center",
    maxWidth: PAGE_W - MARGIN * 4,
  });
  if (project.proposal.challenge) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(12);
    pdf.setTextColor(...COLORS.body);
    pdf.text(project.proposal.challenge, PAGE_W / 2, PAGE_H / 2 + 8, {
      align: "center",
      maxWidth: PAGE_W - MARGIN * 4,
    });
  }

  const refs = flattenParagraphs(project.toc);
  for (const ref of refs) {
    await addContentPage(pdf, ref.tocTitle, ref.paragraph.slide);
  }

  pdf.save(safeExportFilename(project.title, "pdf"));
}
