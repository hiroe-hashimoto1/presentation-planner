"use client";

import { useState, useCallback } from "react";
import { ArrowLeft, FileDown, Loader2, Play, Presentation, RefreshCw, Save } from "lucide-react";
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from "react-resizable-panels";
import type { Project, TocItem, Slide } from "@/lib/types";
import { resetAllElapsed } from "@/lib/rehearsal";
import { exportProject, type ExportFormat } from "@/lib/export";
import { PaneProposal } from "./pane-proposal";
import { PaneToc } from "./pane-toc";
import { PaneScript } from "./pane-script";
import { PaneSlide } from "./pane-slide";
import { RehearsalOverlay } from "./rehearsal-overlay";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface FourPaneEditorProps {
  project: Project;
  userId: string;
  onProjectChange: (project: Project) => void;
  onBack: () => void;
  onSave?: () => void | Promise<void>;
  onRetrySave?: () => void | Promise<void>;
  onPersistNow?: (project: Project) => Promise<void>;
  onRehearsalActiveChange?: (active: boolean) => void;
  saving?: boolean;
  saveError?: string | null;
  lastSavedAt?: Date | null;
  onUploadStateChange?: (uploading: boolean) => void;
}

function formatSavedAt(date: Date) {
  return date.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function FourPaneEditor({
  project,
  userId,
  onProjectChange,
  onBack,
  onSave,
  onRetrySave,
  onPersistNow,
  onRehearsalActiveChange,
  saving = false,
  saveError = null,
  lastSavedAt = null,
  onUploadStateChange,
}: FourPaneEditorProps) {
  const [selectedTocId, setSelectedTocId] = useState<string | null>(
    project.toc[0]?.id ?? null
  );
  const [selectedParaId, setSelectedParaId] = useState<string | null>(
    project.toc[0]?.paragraphs[0]?.id ?? null
  );
  const [rehearsalActive, setRehearsalActive] = useState(false);
  const [startingRehearsal, setStartingRehearsal] = useState(false);
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const selectedTocItem = project.toc.find((t) => t.id === selectedTocId) ?? null;
  const selectedParagraph =
    selectedTocItem?.paragraphs.find((p) => p.id === selectedParaId) ?? null;

  const handleSelectToc = (tocId: string) => {
    setSelectedTocId(tocId);
    const toc = project.toc.find((t) => t.id === tocId);
    if (toc?.paragraphs[0]) {
      setSelectedParaId(toc.paragraphs[0].id);
    }
  };

  const handleSelectParagraph = useCallback(
    (tocId: string | null, paraId: string) => {
      if (tocId) setSelectedTocId(tocId);
      setSelectedParaId(paraId);
    },
    []
  );

  const handleTocChange = (toc: TocItem[]) => {
    if (rehearsalActive) return;
    onProjectChange({ ...project, toc });
  };

  const handleTocItemChange = (updated: TocItem) => {
    if (rehearsalActive) return;
    onProjectChange({
      ...project,
      toc: project.toc.map((t) => (t.id === updated.id ? updated : t)),
    });
  };

  const handleSlideChange = (slide: Slide) => {
    if (rehearsalActive || !selectedTocItem || !selectedParaId) return;
    handleTocItemChange({
      ...selectedTocItem,
      paragraphs: selectedTocItem.paragraphs.map((p) =>
        p.id === selectedParaId ? { ...p, slide } : p
      ),
    });
  };

  const handleStartRehearsal = useCallback(async () => {
    if (!onPersistNow || rehearsalActive || startingRehearsal) return;
    const flat = project.toc.flatMap((t) => t.paragraphs);
    if (flat.length === 0) return;

    setStartingRehearsal(true);
    try {
      const reset = resetAllElapsed(project);
      onProjectChange(reset);
      await onPersistNow(reset);
      setRehearsalActive(true);
      onRehearsalActiveChange?.(true);
    } finally {
      setStartingRehearsal(false);
    }
  }, [onPersistNow, rehearsalActive, startingRehearsal, project, onProjectChange]);

  const handleRehearsalPersist = useCallback(
    async (updated: Project) => {
      if (onPersistNow) {
        await onPersistNow(updated);
      }
    },
    [onPersistNow]
  );

  const handleRehearsalEnd = useCallback(() => {
    setRehearsalActive(false);
    onRehearsalActiveChange?.(false);
  }, [onRehearsalActiveChange]);

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      if (exporting || rehearsalActive) return;
      setExportError(null);
      setExporting(format);
      try {
        await exportProject(project, format);
      } catch (e) {
        setExportError(
          e instanceof Error ? e.message : "エクスポートに失敗しました"
        );
      } finally {
        setExporting(null);
      }
    },
    [exporting, rehearsalActive, project]
  );

  const readOnly = rehearsalActive;

  return (
    <div className="editor-shell flex flex-col h-screen">
      <header className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0 bg-card/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-2 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            title="一覧へ戻る"
            disabled={rehearsalActive}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">一覧</span>
          </Button>
          <Separator orientation="vertical" className="h-5 hidden sm:block" />
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground leading-none mb-0.5">
              RE:FRAME
            </p>
            <h1 className="text-sm font-medium text-foreground truncate max-w-[10rem] sm:max-w-md">
              {project.title}
            </h1>
          </div>
          <Badge variant={saving ? "warning" : lastSavedAt ? "success" : "muted"}>
            {saving
              ? "保存中..."
              : lastSavedAt
              ? `保存済 ${formatSavedAt(lastSavedAt)}`
              : "未保存"}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {saveError && !rehearsalActive && (
            <div className="flex items-center gap-1.5">
              <span
                className="text-xs text-destructive max-w-[140px] truncate hidden lg:inline"
                title={saveError}
              >
                {saveError}
              </span>
              {onRetrySave && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => void onRetrySave()}
                  disabled={saving}
                >
                  <RefreshCw className="h-3 w-3" />
                  再試行
                </Button>
              )}
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            className="hidden md:inline-flex"
            onClick={() => void handleStartRehearsal()}
            disabled={rehearsalActive || startingRehearsal || saving}
          >
            <Play className="h-3.5 w-3.5" />
            {startingRehearsal ? "準備中…" : "リハーサル"}
          </Button>
          {exportError && !rehearsalActive && (
            <span
              className="text-xs text-destructive max-w-[120px] truncate hidden lg:inline"
              title={exportError}
            >
              {exportError}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            className="hidden md:inline-flex"
            onClick={() => void handleExport("pdf")}
            disabled={Boolean(exporting) || rehearsalActive || saving}
            title="PDFをダウンロード"
          >
            {exporting === "pdf" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <FileDown className="h-3.5 w-3.5" />
            )}
            PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="hidden md:inline-flex"
            onClick={() => void handleExport("pptx")}
            disabled={Boolean(exporting) || rehearsalActive || saving}
            title="PowerPointをダウンロード"
          >
            {exporting === "pptx" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Presentation className="h-3.5 w-3.5" />
            )}
            PPT
          </Button>
          <Button
            size="sm"
            onClick={() => void onSave?.()}
            disabled={saving || !onSave || rehearsalActive}
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "保存中" : "保存"}
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden p-2 sm:p-3">
        <PanelGroup orientation="horizontal" className="h-full">
          <Panel defaultSize={22} minSize={15} className="rounded-l-lg overflow-hidden">
            <PaneProposal
              proposal={project.proposal}
              projectTitle={project.title}
              onProposalChange={(proposal) =>
                !readOnly && onProjectChange({ ...project, proposal })
              }
              onTitleChange={(title) =>
                !readOnly && onProjectChange({ ...project, title })
              }
              readOnly={readOnly}
            />
          </Panel>

          <PanelResizeHandle className="w-px mx-1 bg-border hover:bg-primary transition-colors cursor-col-resize" />

          <Panel defaultSize={20} minSize={14} className="overflow-hidden">
            <PaneToc
              toc={project.toc}
              selectedTocId={selectedTocId}
              selectedParaId={selectedParaId}
              onSelectToc={handleSelectToc}
              onSelectParagraph={(tocId, paraId) =>
                handleSelectParagraph(tocId, paraId)
              }
              onTocChange={handleTocChange}
              readOnly={readOnly}
            />
          </Panel>

          <PanelResizeHandle className="w-px mx-1 bg-border hover:bg-primary transition-colors cursor-col-resize" />

          <Panel defaultSize={30} minSize={18} className="overflow-hidden">
            <PaneScript
              projectToc={project.toc}
              selectedTocItem={selectedTocItem}
              selectedParaId={selectedParaId}
              onSelectParagraph={(paraId) =>
                handleSelectParagraph(null, paraId)
              }
              onTocItemChange={handleTocItemChange}
              readOnly={readOnly}
            />
          </Panel>

          <PanelResizeHandle className="w-px mx-1 bg-border hover:bg-primary transition-colors cursor-col-resize" />

          <Panel defaultSize={28} minSize={18} className="rounded-r-lg overflow-hidden">
            <PaneSlide
              projectId={project.id}
              userId={userId}
              selectedParagraph={selectedParagraph}
              onSlideChange={handleSlideChange}
              onUploadStateChange={onUploadStateChange}
              readOnly={readOnly}
            />
          </Panel>
        </PanelGroup>
      </div>

      {rehearsalActive && (
        <RehearsalOverlay
          project={project}
          onProjectChange={onProjectChange}
          onPersistNow={handleRehearsalPersist}
          onEnd={handleRehearsalEnd}
        />
      )}
    </div>
  );
}
