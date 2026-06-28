"use client";

import { useState, useCallback } from "react";
import { ArrowLeft, FileDown, Play, RefreshCw, Save } from "lucide-react";
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from "react-resizable-panels";
import type { Project, TocItem, Slide } from "@/lib/types";
import { PaneProposal } from "./pane-proposal";
import { PaneToc } from "./pane-toc";
import { PaneScript } from "./pane-script";
import { PaneSlide } from "./pane-slide";
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
    onProjectChange({ ...project, toc });
  };

  const handleTocItemChange = (updated: TocItem) => {
    onProjectChange({
      ...project,
      toc: project.toc.map((t) => (t.id === updated.id ? updated : t)),
    });
  };

  const handleSlideChange = (slide: Slide) => {
    if (!selectedTocItem || !selectedParaId) return;
    handleTocItemChange({
      ...selectedTocItem,
      paragraphs: selectedTocItem.paragraphs.map((p) =>
        p.id === selectedParaId ? { ...p, slide } : p
      ),
    });
  };

  return (
    <div className="editor-shell flex flex-col h-screen">
      <header className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0 bg-card/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="sm" onClick={onBack} title="一覧へ戻る">
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
          {saveError && (
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
            disabled
            className="hidden md:inline-flex opacity-50 border-dashed"
            title="フェーズ3で実装予定"
          >
            <Play className="h-3.5 w-3.5" />
            リハーサル
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled
            className="hidden md:inline-flex opacity-50 border-dashed"
            title="フェーズ4で実装予定"
          >
            <FileDown className="h-3.5 w-3.5" />
            PDF
          </Button>
          <Button
            size="sm"
            onClick={() => void onSave?.()}
            disabled={saving || !onSave}
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
                onProjectChange({ ...project, proposal })
              }
              onTitleChange={(title) => onProjectChange({ ...project, title })}
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
            />
          </Panel>

          <PanelResizeHandle className="w-px mx-1 bg-border hover:bg-primary transition-colors cursor-col-resize" />

          <Panel defaultSize={30} minSize={18} className="overflow-hidden">
            <PaneScript
              selectedTocItem={selectedTocItem}
              selectedParaId={selectedParaId}
              onSelectParagraph={(paraId) =>
                handleSelectParagraph(null, paraId)
              }
              onTocItemChange={handleTocItemChange}
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
            />
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}
