"use client";

import PptxGenJS from "pptxgenjs";
import type { Project, Slide } from "@/lib/types";
import { flattenParagraphs } from "@/lib/rehearsal";
import { loadSlideImageData, safeExportFilename } from "./images";

const BG = "0A0A12";
const TITLE = "FFFFFF";
const BODY = "94A3B8";
const ACCENT = "22D3EE";
const MUTED = "64748B";

type PptxSlide = ReturnType<PptxGenJS["addSlide"]>;

function applyDarkBackground(slide: PptxSlide) {
  slide.background = { color: BG };
}

function addSlideTitle(
  slide: PptxSlide,
  title: string,
  y = 0.4,
  fontSize = 28
) {
  slide.addText(title || "タイトル", {
    x: 0.6,
    y,
    w: 12.1,
    h: 0.8,
    fontSize,
    bold: true,
    color: TITLE,
    fontFace: "Arial",
  });
}

function addSectionLabel(slide: PptxSlide, label: string) {
  slide.addText(label, {
    x: 0.6,
    y: 0.15,
    w: 12.1,
    h: 0.3,
    fontSize: 10,
    color: ACCENT,
    fontFace: "Arial",
  });
}

async function addSlideImage(
  slide: PptxSlide,
  s: Slide,
  opts: { x: number; y: number; w: number; h: number }
) {
  const data = await loadSlideImageData(s.imageUrl);
  if (!data) {
    slide.addShape("rect", {
      x: opts.x,
      y: opts.y,
      w: opts.w,
      h: opts.h,
      fill: { color: "1E293B" },
      line: { color: "334155", width: 1 },
    });
    slide.addText("画像", {
      x: opts.x,
      y: opts.y + opts.h / 2 - 0.15,
      w: opts.w,
      h: 0.3,
      fontSize: 12,
      color: MUTED,
      align: "center",
    });
    return;
  }
  slide.addImage({ data, x: opts.x, y: opts.y, w: opts.w, h: opts.h });
}

async function addContentSlide(
  pptx: PptxGenJS,
  sectionTitle: string,
  s: Slide
) {
  const slide = pptx.addSlide();
  applyDarkBackground(slide);
  addSectionLabel(slide, sectionTitle);

  switch (s.templateType) {
    case "title-only":
      addSlideTitle(slide, s.title, 2.8, 36);
      break;

    case "title-text":
      addSlideTitle(slide, s.title, 0.55, 24);
      slide.addShape("line", {
        x: 0.6,
        y: 1.35,
        w: 12.1,
        h: 0,
        line: { color: "22D3EE", width: 1 },
      });
      slide.addText(s.body || "", {
        x: 0.6,
        y: 1.55,
        w: 12.1,
        h: 5.2,
        fontSize: 16,
        color: BODY,
        fontFace: "Arial",
        valign: "top",
      });
      break;

    case "title-image":
      addSlideTitle(slide, s.title, 0.55, 24);
      await addSlideImage(slide, s, { x: 0.6, y: 1.5, w: 12.1, h: 5.3 });
      break;

    case "title-text-image":
      addSlideTitle(slide, s.title, 0.55, 22);
      slide.addText(s.body || "", {
        x: 0.6,
        y: 1.45,
        w: 5.8,
        h: 5.4,
        fontSize: 14,
        color: BODY,
        fontFace: "Arial",
        valign: "top",
      });
      await addSlideImage(slide, s, { x: 6.6, y: 1.45, w: 6.1, h: 5.4 });
      break;

    case "bullet": {
      addSlideTitle(slide, s.title, 0.55, 24);
      const points =
        s.bulletPoints.filter(Boolean).length > 0
          ? s.bulletPoints.filter(Boolean)
          : ["箇条書き 1", "箇条書き 2"];
      slide.addText(
        points.map((p) => ({
          text: p,
          options: { bullet: true, breakLine: true },
        })),
        {
          x: 0.8,
          y: 1.5,
          w: 11.8,
          h: 5.2,
          fontSize: 16,
          color: BODY,
          fontFace: "Arial",
        }
      );
      break;
    }

    case "two-column":
      addSlideTitle(slide, s.title, 0.55, 24);
      slide.addText(s.columnLeft || "", {
        x: 0.6,
        y: 1.5,
        w: 5.8,
        h: 5.3,
        fontSize: 14,
        color: BODY,
        fontFace: "Arial",
        valign: "top",
        fill: { color: "111827" },
      });
      slide.addText(s.columnRight || "", {
        x: 6.6,
        y: 1.5,
        w: 6.1,
        h: 5.3,
        fontSize: 14,
        color: BODY,
        fontFace: "Arial",
        valign: "top",
        fill: { color: "111827" },
      });
      break;
  }
}

export async function exportProjectToPptx(project: Project): Promise<void> {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "企画提案プランナー";

  const titleSlide = pptx.addSlide();
  applyDarkBackground(titleSlide);
  titleSlide.addText(project.title || "企画提案", {
    x: 0.8,
    y: 2.4,
    w: 11.7,
    h: 1.2,
    fontSize: 40,
    bold: true,
    color: TITLE,
    align: "center",
    fontFace: "Arial",
  });
  if (project.proposal.challenge) {
    titleSlide.addText(project.proposal.challenge, {
      x: 1.2,
      y: 3.8,
      w: 10.9,
      h: 1.5,
      fontSize: 14,
      color: BODY,
      align: "center",
      fontFace: "Arial",
    });
  }

  for (const ref of flattenParagraphs(project.toc)) {
    await addContentSlide(pptx, ref.tocTitle, ref.paragraph.slide);
  }

  const filename = safeExportFilename(project.title, "pptx");
  await pptx.writeFile({ fileName: filename });
}
