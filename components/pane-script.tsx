"use client";

import { AlertTriangle, Plus, X } from "lucide-react";
import type { TocItem, Paragraph, Slide } from "@/lib/types";
import {
  formatTime,
  formatTimeShort,
  getProjectTiming,
  getTimerStatus,
} from "@/lib/rehearsal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  AddRowButton,
  EditorEmpty,
  PaneShell,
} from "@/components/editor/pane-shell";
import { cn } from "@/lib/utils";

interface PaneScriptProps {
  projectToc: TocItem[];
  selectedTocItem: TocItem | null;
  selectedParaId: string | null;
  onSelectParagraph: (paraId: string) => void;
  onTocItemChange: (updated: TocItem) => void;
  readOnly?: boolean;
}

function createParagraph(): Paragraph {
  return {
    id: `para-${Date.now()}-${Math.random()}`,
    content: "",
    targetSeconds: 60,
    elapsedSeconds: 0,
    slide: {
      id: `slide-${Date.now()}`,
      templateType: "title-text",
      title: "",
      body: "",
      bulletPoints: [],
      columnLeft: "",
      columnRight: "",
    },
  };
}

export function PaneScript({
  projectToc,
  selectedTocItem,
  selectedParaId,
  onSelectParagraph,
  onTocItemChange,
  readOnly = false,
}: PaneScriptProps) {
  const projectTiming = getProjectTiming(projectToc);

  const tocElapsed = selectedTocItem
    ? selectedTocItem.paragraphs.reduce((s, p) => s + p.elapsedSeconds, 0)
    : 0;
  const tocTarget = selectedTocItem
    ? selectedTocItem.paragraphs.reduce((s, p) => s + p.targetSeconds, 0)
    : 0;

  const updateParagraphContent = (paraId: string, content: string) => {
    if (!selectedTocItem || readOnly) return;
    onTocItemChange({
      ...selectedTocItem,
      paragraphs: selectedTocItem.paragraphs.map((p) =>
        p.id === paraId ? { ...p, content } : p
      ),
    });
  };

  const updateTargetSeconds = (paraId: string, seconds: number) => {
    if (!selectedTocItem || readOnly) return;
    onTocItemChange({
      ...selectedTocItem,
      paragraphs: selectedTocItem.paragraphs.map((p) =>
        p.id === paraId ? { ...p, targetSeconds: seconds } : p
      ),
    });
  };

  const addParagraph = (afterId?: string) => {
    if (!selectedTocItem || readOnly) return;
    const newPara = createParagraph();
    let paragraphs: Paragraph[];
    if (afterId) {
      const idx = selectedTocItem.paragraphs.findIndex((p) => p.id === afterId);
      paragraphs = [
        ...selectedTocItem.paragraphs.slice(0, idx + 1),
        newPara,
        ...selectedTocItem.paragraphs.slice(idx + 1),
      ];
    } else {
      paragraphs = [...selectedTocItem.paragraphs, newPara];
    }
    onTocItemChange({ ...selectedTocItem, paragraphs });
    setTimeout(() => onSelectParagraph(newPara.id), 50);
  };

  const removeParagraph = (paraId: string) => {
    if (!selectedTocItem || selectedTocItem.paragraphs.length <= 1 || readOnly)
      return;
    onTocItemChange({
      ...selectedTocItem,
      paragraphs: selectedTocItem.paragraphs.filter((p) => p.id !== paraId),
    });
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    paraId: string
  ) => {
    if (readOnly) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      addParagraph(paraId);
    }
  };

  const timingMeta = (
    <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground tabular-nums">
      <span title="企画全体の実績 / 目標">
        全体 {formatTime(projectTiming.totalElapsed)}
        {projectTiming.totalTarget > 0 && (
          <span className="opacity-60">
            {" "}
            / {formatTime(projectTiming.totalTarget)}
          </span>
        )}
      </span>
      {selectedTocItem && (
        <span className="opacity-60" title="目次項目の実績 / 目標">
          ｜{formatTime(tocElapsed)}
          {tocTarget > 0 && ` / ${formatTime(tocTarget)}`}
        </span>
      )}
    </div>
  );

  if (!selectedTocItem) {
    return (
      <PaneShell accent="script" label="説明原稿" meta={timingMeta}>
        <EditorEmpty>左の目次から項目を選択してください</EditorEmpty>
      </PaneShell>
    );
  }

  return (
    <PaneShell
      accent="script"
      label={selectedTocItem.title}
      meta={timingMeta}
    >
      <div className="p-2 sm:p-3 space-y-2">
        {selectedTocItem.paragraphs.map((para, idx) => {
          const isSelected = selectedParaId === para.id;
          const elapsed = para.elapsedSeconds;
          const status = getTimerStatus(elapsed, para.targetSeconds);
          const isOverTarget =
            para.targetSeconds > 0 && elapsed > para.targetSeconds;
          const isNearTarget =
            para.targetSeconds > 0 &&
            elapsed > para.targetSeconds * 0.8 &&
            elapsed <= para.targetSeconds;

          return (
            <div
              key={para.id}
              className={cn(
                "group rounded-lg border transition-all",
                isSelected
                  ? "border-emerald-500/40 bg-accent/20"
                  : "border-border hover:border-border/80 hover:bg-accent/10"
              )}
              onClick={() => onSelectParagraph(para.id)}
            >
              <div className="flex items-center gap-2 px-3 pt-2 pb-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  {String(idx + 1).padStart(2, "0")}
                </span>

                <Badge
                  variant={status}
                  className="font-mono tabular-nums gap-1"
                >
                  {formatTime(elapsed)}
                  {para.targetSeconds > 0 && (
                    <span className="opacity-50">
                      / {formatTime(para.targetSeconds)}
                    </span>
                  )}
                </Badge>

                {!readOnly && (
                  <div className="ml-auto flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <Input
                      type="number"
                      value={para.targetSeconds}
                      onChange={(e) =>
                        updateTargetSeconds(para.id, Number(e.target.value))
                      }
                      onClick={(e) => e.stopPropagation()}
                      className="w-12 h-6 text-[10px] text-center px-1 border-border bg-secondary"
                      title="目標秒数"
                      min={0}
                    />
                    <span className="text-[10px] text-muted-foreground">
                      秒
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeParagraph(para.id);
                      }}
                      className="p-0.5 rounded text-muted-foreground hover:text-destructive"
                      title="段落を削除"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
                {readOnly && para.targetSeconds > 0 && (
                  <span className="ml-auto text-[10px] text-muted-foreground">
                    目標 {formatTimeShort(para.targetSeconds)}
                  </span>
                )}
              </div>

              <div className="px-2 pb-2">
                <Textarea
                  value={para.content}
                  onChange={(e) =>
                    updateParagraphContent(para.id, e.target.value)
                  }
                  onKeyDown={(e) => handleKeyDown(e, para.id)}
                  onClick={(e) => e.stopPropagation()}
                  readOnly={readOnly}
                  rows={3}
                  className={cn(
                    "notion-input min-h-0 border-0 shadow-none focus-visible:ring-0 resize-none leading-relaxed",
                    readOnly && "cursor-default opacity-90"
                  )}
                  placeholder="話す内容を入力... (Enterで新段落、Shift+Enterで改行)"
                />
              </div>

              {isOverTarget && (
                <div className="px-3 pb-2 flex items-center gap-1 text-xs text-destructive">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  目標時間を超過
                </div>
              )}
              {isNearTarget && (
                <div className="px-3 pb-2 flex items-center gap-1 text-xs text-amber-400">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  目標の80%を超えています
                </div>
              )}
            </div>
          );
        })}

        {!readOnly && (
          <AddRowButton onClick={() => addParagraph()}>
            <Plus className="h-4 w-4" />
            段落を追加
          </AddRowButton>
        )}
      </div>
    </PaneShell>
  );
}
