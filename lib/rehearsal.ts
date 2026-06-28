import type { Project, TocItem, Paragraph } from "@/lib/types";

export interface ParagraphRef {
  tocId: string;
  tocTitle: string;
  paragraph: Paragraph;
  globalIndex: number;
}

export function flattenParagraphs(toc: TocItem[]): ParagraphRef[] {
  const result: ParagraphRef[] = [];
  let globalIndex = 0;
  for (const item of toc) {
    for (const paragraph of item.paragraphs) {
      result.push({
        tocId: item.id,
        tocTitle: item.title,
        paragraph,
        globalIndex: globalIndex++,
      });
    }
  }
  return result;
}

export function resetAllElapsed(project: Project): Project {
  return {
    ...project,
    toc: project.toc.map((item) => ({
      ...item,
      paragraphs: item.paragraphs.map((p) => ({ ...p, elapsedSeconds: 0 })),
    })),
  };
}

export function setParagraphElapsed(
  project: Project,
  tocId: string,
  paraId: string,
  elapsedSeconds: number
): Project {
  return {
    ...project,
    toc: project.toc.map((item) =>
      item.id !== tocId
        ? item
        : {
            ...item,
            paragraphs: item.paragraphs.map((p) =>
              p.id !== paraId ? p : { ...p, elapsedSeconds }
            ),
          }
    ),
  };
}

export function getProjectTiming(toc: TocItem[]) {
  const paragraphs = toc.flatMap((t) => t.paragraphs);
  return {
    totalTarget: paragraphs.reduce((s, p) => s + p.targetSeconds, 0),
    totalElapsed: paragraphs.reduce((s, p) => s + p.elapsedSeconds, 0),
    paragraphCount: paragraphs.length,
  };
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function formatTimeShort(seconds: number): string {
  if (seconds < 60) return `${seconds}秒`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}分${s}秒` : `${m}分`;
}

export type TimerStatus = "muted" | "success" | "warning" | "destructive";

export function getTimerStatus(
  elapsed: number,
  targetSeconds: number,
  active = false
): TimerStatus {
  if (targetSeconds <= 0) {
    return active && elapsed > 0 ? "success" : "muted";
  }
  if (elapsed > targetSeconds) return "destructive";
  if (elapsed > targetSeconds * 0.8) return "warning";
  return active ? "success" : "muted";
}

export function findParagraphRef(
  toc: TocItem[],
  tocId: string,
  paraId: string
): ParagraphRef | null {
  const flat = flattenParagraphs(toc);
  return (
    flat.find((r) => r.tocId === tocId && r.paragraph.id === paraId) ?? null
  );
}
