import type { Project } from "./types";

function newUuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function newId(prefix: string): string {
  return `${prefix}-${newUuid()}`;
}

export function createNewProject(): Project {
  const tocId = newId("toc");
  const paraId = newId("para");
  const slideId = newId("slide");
  const now = new Date().toISOString();

  return {
    id: newUuid(),
    title: "新しい企画",
    proposal: {
      challenge: "",
      target: "",
      overview: "",
      goal: "",
      background: "",
    },
    toc: [
      {
        id: tocId,
        title: "はじめに",
        paragraphs: [
          {
            id: paraId,
            content: "",
            targetSeconds: 60,
            elapsedSeconds: 0,
            slide: {
              id: slideId,
              templateType: "title-only",
              title: "",
              body: "",
              bulletPoints: [],
              columnLeft: "",
              columnRight: "",
            },
          },
        ],
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
}
