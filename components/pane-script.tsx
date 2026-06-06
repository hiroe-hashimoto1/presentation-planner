"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { AlertTriangle, Play, Plus, SkipForward, X } from "lucide-react";
import type { TocItem, Paragraph, Slide } from "@/lib/types";
import { Button } from "@/components/ui/button";
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
  selectedTocItem: TocItem | null;
  selectedParaId: string | null;
  onSelectParagraph: (paraId: string) => void;
  onTocItemChange: (updated: TocItem) => void;
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

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

interface TimerState {
  running: boolean;
  elapsed: number;
  paraId: string | null;
}

export function PaneScript({
  selectedTocItem,
  selectedParaId,
  onSelectParagraph,
  onTocItemChange,
}: PaneScriptProps) {
  const [timer, setTimer] = useState<TimerState>({
    running: false,
    elapsed: 0,
    paraId: null,
  });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  const totalElapsed = selectedTocItem
    ? selectedTocItem.paragraphs.reduce((s, p) => s + p.elapsedSeconds, 0)
    : 0;

  const stopTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimer((t) => ({ ...t, running: false }));
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startTimer = (paraId: string) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimer({ running: true, elapsed: 0, paraId });
    intervalRef.current = setInterval(() => {
      setTimer((t) => ({ ...t, elapsed: t.elapsed + 1 }));
    }, 1000);
  };

  const saveTimerToParaAndNext = () => {
    if (!selectedTocItem || !timer.paraId) return;
    stopTimer();
    const paraIndex = selectedTocItem.paragraphs.findIndex(
      (p) => p.id === timer.paraId
    );
    const updatedParagraphs = selectedTocItem.paragraphs.map((p) =>
      p.id === timer.paraId
        ? { ...p, elapsedSeconds: p.elapsedSeconds + timer.elapsed }
        : p
    );
    onTocItemChange({ ...selectedTocItem, paragraphs: updatedParagraphs });

    const next = selectedTocItem.paragraphs[paraIndex + 1];
    if (next) {
      onSelectParagraph(next.id);
      startTimer(next.id);
    }
  };

  const updateParagraphContent = (paraId: string, content: string) => {
    if (!selectedTocItem) return;
    onTocItemChange({
      ...selectedTocItem,
      paragraphs: selectedTocItem.paragraphs.map((p) =>
        p.id === paraId ? { ...p, content } : p
      ),
    });
  };

  const updateTargetSeconds = (paraId: string, seconds: number) => {
    if (!selectedTocItem) return;
    onTocItemChange({
      ...selectedTocItem,
      paragraphs: selectedTocItem.paragraphs.map((p) =>
        p.id === paraId ? { ...p, targetSeconds: seconds } : p
      ),
    });
  };

  const addParagraph = (afterId?: string) => {
    if (!selectedTocItem) return;
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
    if (!selectedTocItem || selectedTocItem.paragraphs.length <= 1) return;
    onTocItemChange({
      ...selectedTocItem,
      paragraphs: selectedTocItem.paragraphs.filter((p) => p.id !== paraId),
    });
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    paraId: string
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      addParagraph(paraId);
    }
  };

  const timerActions = selectedTocItem ? (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
        {formatTime(totalElapsed)}
      </span>
      {timer.running ? (
        <Button size="sm" className="h-7 text-xs" onClick={saveTimerToParaAndNext}>
          <SkipForward className="h-3 w-3" />
          次へ
        </Button>
      ) : (
        <Button
          variant="secondary"
          size="sm"
          className="h-7 text-xs"
          onClick={() => {
            const firstPara = selectedTocItem.paragraphs[0];
            if (firstPara) {
              onSelectParagraph(firstPara.id);
              startTimer(firstPara.id);
            }
          }}
        >
          <Play className="h-3 w-3" />
          計測
        </Button>
      )}
    </div>
  ) : null;

  if (!selectedTocItem) {
    return (
      <PaneShell accent="script" label="説明原稿">
        <EditorEmpty>左の目次から項目を選択してください</EditorEmpty>
      </PaneShell>
    );
  }

  return (
    <PaneShell
      accent="script"
      label={selectedTocItem.title}
      actions={timerActions}
    >
      <div className="p-2 sm:p-3 space-y-2">
        {selectedTocItem.paragraphs.map((para, idx) => {
          const isSelected = selectedParaId === para.id;
          const isTimerActive = timer.running && timer.paraId === para.id;
          const elapsed = isTimerActive ? timer.elapsed : para.elapsedSeconds;
          const isOverTarget =
            para.targetSeconds > 0 && elapsed > para.targetSeconds;

          return (
            <div
              key={para.id}
              className={cn(
                "group rounded-lg border transition-all",
                isSelected
                  ? "border-emerald-500/40 bg-accent/20"
                  : "border-border hover:border-border/80 hover:bg-accent/10",
                isTimerActive && "ring-1 ring-emerald-400/50"
              )}
              onClick={() => onSelectParagraph(para.id)}
            >
              <div className="flex items-center gap-2 px-3 pt-2 pb-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  {String(idx + 1).padStart(2, "0")}
                </span>

                <Badge
                  variant={
                    isTimerActive && isOverTarget
                      ? "destructive"
                      : isTimerActive
                      ? "success"
                      : isOverTarget
                      ? "destructive"
                      : "muted"
                  }
                  className="font-mono tabular-nums gap-1"
                >
                  {isTimerActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                  {formatTime(elapsed)}
                  {para.targetSeconds > 0 && (
                    <span className="opacity-50">
                      / {formatTime(para.targetSeconds)}
                    </span>
                  )}
                </Badge>

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
                  <span className="text-[10px] text-muted-foreground">秒</span>
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
              </div>

              <div className="px-2 pb-2">
                <Textarea
                  ref={(el) => {
                    textareaRefs.current[para.id] = el;
                  }}
                  value={para.content}
                  onChange={(e) => updateParagraphContent(para.id, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, para.id)}
                  onClick={(e) => e.stopPropagation()}
                  rows={3}
                  className="notion-input min-h-0 border-0 shadow-none focus-visible:ring-0 resize-none leading-relaxed"
                  placeholder="話す内容を入力... (Enterで新段落、Shift+Enterで改行)"
                />
              </div>

              {isOverTarget && (
                <div className="px-3 pb-2 flex items-center gap-1 text-xs text-destructive">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  目標時間を超過
                </div>
              )}
            </div>
          );
        })}

        <AddRowButton onClick={() => addParagraph()}>
          <Plus className="h-4 w-4" />
          段落を追加
        </AddRowButton>
      </div>
    </PaneShell>
  );
}
