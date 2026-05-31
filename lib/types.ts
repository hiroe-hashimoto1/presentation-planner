export type SlideTemplateType =
  | "title-only"
  | "title-text"
  | "title-image"
  | "title-text-image"
  | "bullet"
  | "two-column";

export interface Slide {
  id: string;
  templateType: SlideTemplateType;
  title: string;
  body: string;
  bulletPoints: string[];
  columnLeft: string;
  columnRight: string;
  imageUrl?: string;
  imageFile?: string; // base64
}

export interface Paragraph {
  id: string;
  content: string;
  targetSeconds: number;
  elapsedSeconds: number;
  slide: Slide;
}

export interface TocItem {
  id: string;
  title: string;
  paragraphs: Paragraph[];
}

export interface ProposalFields {
  challenge: string;
  target: string;
  overview: string;
  goal: string;
  background: string;
}

export interface Project {
  id: string;
  title: string;
  proposal: ProposalFields;
  toc: TocItem[];
  createdAt: string;
  updatedAt: string;
}

export const SLIDE_TEMPLATE_LABELS: Record<SlideTemplateType, string> = {
  "title-only": "タイトルのみ",
  "title-text": "タイトル＋テキスト",
  "title-image": "タイトル＋画像",
  "title-text-image": "タイトル＋テキスト＋画像",
  bullet: "箇条書き",
  "two-column": "2段組",
};
