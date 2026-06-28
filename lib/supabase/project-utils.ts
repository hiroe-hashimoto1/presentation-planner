import type { Project, Slide, TocItem } from "@/lib/types";

export class ProjectConflictError extends Error {
  constructor() {
    super("他のタブで更新されました");
    this.name = "ProjectConflictError";
  }
}

function sanitizeSlideForSave(slide: Slide): Slide {
  const { imageFile: _imageFile, ...rest } = slide;
  return rest;
}

export function sanitizeProjectForSave(project: Project): Project {
  return {
    ...project,
    toc: project.toc.map((tocItem) => ({
      ...tocItem,
      paragraphs: tocItem.paragraphs.map((paragraph) => ({
        ...paragraph,
        slide: sanitizeSlideForSave(paragraph.slide),
      })),
    })),
  };
}

export function collectStorageImagePaths(toc: TocItem[]): string[] {
  const paths: string[] = [];
  for (const item of toc) {
    for (const paragraph of item.paragraphs) {
      const { imageUrl } = paragraph.slide;
      if (imageUrl && !/^https?:\/\//i.test(imageUrl)) {
        paths.push(imageUrl);
      }
    }
  }
  return paths;
}
