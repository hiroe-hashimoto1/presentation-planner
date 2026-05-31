"use client";

import { useState, useCallback } from "react";
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from "react-resizable-panels";
import type { Project, TocItem, Slide } from "@/lib/types";
import { PaneProposal } from "./pane-proposal";
import { PaneToc } from "./pane-toc";
import { PaneScript } from "./pane-script";
import { PaneSlide } from "./pane-slide";

interface FourPaneEditorProps {
  project: Project;
  onProjectChange: (project: Project) => void;
  onBack: () => void;
  onSave?: () => void | Promise<void>;
  saving?: boolean;
  saveError?: string | null;
  lastSavedAt?: Date | null;
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
  onProjectChange,
  onBack,
  onSave,
  saving = false,
  saveError = null,
  lastSavedAt = null,
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
    <div className="flex flex-col h-screen bg-gray-100">
      {/* top bar */}
      <header className="flex items-center justify-between px-5 py-2.5 bg-white border-b border-gray-200 shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="一覧へ戻る"
          >
            ←
          </button>
          <div className="w-px h-5 bg-gray-200" />
          <h1 className="text-base font-semibold text-gray-800 truncate max-w-md">
            {project.title}
          </h1>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              saving
                ? "bg-amber-100 text-amber-700"
                : lastSavedAt
                ? "bg-emerald-100 text-emerald-700"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            {saving
              ? "保存中..."
              : lastSavedAt
              ? `保存済 ${formatSavedAt(lastSavedAt)}`
              : "未保存"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {saveError && (
            <span className="text-xs text-red-500 max-w-[200px] truncate" title={saveError}>
              {saveError}
            </span>
          )}
          <button className="text-sm px-4 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors opacity-50 cursor-not-allowed" disabled title="フェーズ4で実装予定">
            リハーサル ▶
          </button>
          <button className="text-sm px-4 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors opacity-50 cursor-not-allowed" disabled title="フェーズ4で実装予定">
            PDF出力
          </button>
          <button
            onClick={() => void onSave?.()}
            disabled={saving || !onSave}
            className="text-sm px-4 py-1.5 border border-indigo-200 bg-indigo-50 rounded-lg text-indigo-600 hover:bg-indigo-100 transition-colors disabled:opacity-50"
          >
            {saving ? "保存中..." : "保存"}
          </button>
        </div>
      </header>

      {/* 4-pane area */}
      <div className="flex-1 overflow-hidden p-2">
        <PanelGroup orientation="horizontal" className="h-full rounded-xl overflow-hidden">
          {/* Pane 1: Proposal */}
          <Panel defaultSize={22} minSize={15} className="rounded-l-xl overflow-hidden border border-gray-200 shadow-sm">
            <PaneProposal
              proposal={project.proposal}
              projectTitle={project.title}
              onProposalChange={(proposal) =>
                onProjectChange({ ...project, proposal })
              }
              onTitleChange={(title) => onProjectChange({ ...project, title })}
            />
          </Panel>

          <PanelResizeHandle className="w-1 bg-gray-200 hover:bg-indigo-400 transition-colors cursor-col-resize mx-0.5" />

          {/* Pane 2: TOC */}
          <Panel defaultSize={20} minSize={14} className="overflow-hidden border border-gray-200 shadow-sm">
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

          <PanelResizeHandle className="w-1 bg-gray-200 hover:bg-indigo-400 transition-colors cursor-col-resize mx-0.5" />

          {/* Pane 3: Script */}
          <Panel defaultSize={30} minSize={18} className="overflow-hidden border border-gray-200 shadow-sm">
            <PaneScript
              selectedTocItem={selectedTocItem}
              selectedParaId={selectedParaId}
              onSelectParagraph={(paraId) =>
                handleSelectParagraph(null, paraId)
              }
              onTocItemChange={handleTocItemChange}
            />
          </Panel>

          <PanelResizeHandle className="w-1 bg-gray-200 hover:bg-indigo-400 transition-colors cursor-col-resize mx-0.5" />

          {/* Pane 4: Slide */}
          <Panel defaultSize={28} minSize={18} className="rounded-r-xl overflow-hidden border border-gray-200 shadow-sm">
            <PaneSlide
              selectedParagraph={selectedParagraph}
              onSlideChange={handleSlideChange}
            />
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}
