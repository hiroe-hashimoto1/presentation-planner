import type { Project } from "@/lib/types";

export type ExportFormat = "pdf" | "pptx";

export async function exportProject(
  project: Project,
  format: ExportFormat
): Promise<void> {
  if (format === "pdf") {
    const { exportProjectToPdf } = await import("./pdf");
    await exportProjectToPdf(project);
    return;
  }
  const { exportProjectToPptx } = await import("./pptx");
  await exportProjectToPptx(project);
}

export { safeExportFilename } from "./images";
