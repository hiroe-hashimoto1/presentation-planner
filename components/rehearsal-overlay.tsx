"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SkipForward, Square } from "lucide-react";
import type { Project } from "@/lib/types";
import {
  flattenParagraphs,
  formatTime,
  getProjectTiming,
  getTimerStatus,
  setParagraphElapsed,
} from "@/lib/rehearsal";
import { SlidePreview } from "@/components/slide-preview";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RehearsalOverlayProps {
  project: Project;
  onProjectChange: (project: Project) => void;
  onPersistNow: (project: Project) => Promise<void>;
  onEnd: () => void;
}

export function RehearsalOverlay({
  project,
  onProjectChange,
  onPersistNow,
  onEnd,
}: RehearsalOverlayProps) {
  const flat = flattenParagraphs(project.toc);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [liveElapsed, setLiveElapsed] = useState(0);
  const [saving, setSaving] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const projectRef = useRef(project);

  useEffect(() => {
    projectRef.current = project;
  }, [project]);

  const current = flat[currentIndex] ?? null;

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startInterval = useCallback(() => {
    stopInterval();
    intervalRef.current = setInterval(() => {
      setLiveElapsed((e) => e + 1);
    }, 1000);
  }, [stopInterval]);

  useEffect(() => {
    startInterval();
    return () => stopInterval();
  }, [startInterval]);

  const applyAndPersist = useCallback(
    async (updated: Project) => {
      setSaving(true);
      projectRef.current = updated;
      onProjectChange(updated);
      try {
        await onPersistNow(updated);
      } finally {
        setSaving(false);
      }
    },
    [onProjectChange, onPersistNow]
  );

  const finalizeCurrent = useCallback(
    (base: Project, elapsed: number): Project => {
      if (!current) return base;
      return setParagraphElapsed(
        base,
        current.tocId,
        current.paragraph.id,
        elapsed
      );
    },
    [current]
  );

  const handleNext = useCallback(async () => {
    if (!current || saving) return;
    stopInterval();

    const updated = finalizeCurrent(projectRef.current, liveElapsed);
    const nextIndex = currentIndex + 1;

    if (nextIndex >= flat.length) {
      await applyAndPersist(updated);
      onEnd();
      return;
    }

    await applyAndPersist(updated);
    setCurrentIndex(nextIndex);
    setLiveElapsed(0);
    startInterval();
  }, [
    current,
    saving,
    stopInterval,
    finalizeCurrent,
    currentIndex,
    flat.length,
    applyAndPersist,
    onEnd,
    liveElapsed,
    startInterval,
  ]);

  const handleJump = useCallback(
    async (tocId: string, paraId: string) => {
      if (saving) return;
      const targetIndex = flat.findIndex(
        (r) => r.tocId === tocId && r.paragraph.id === paraId
      );
      if (targetIndex < 0 || targetIndex === currentIndex) return;

      stopInterval();
      const updated = finalizeCurrent(projectRef.current, liveElapsed);
      await applyAndPersist(updated);
      setCurrentIndex(targetIndex);
      setLiveElapsed(0);
      startInterval();
    },
    [
      saving,
      flat,
      currentIndex,
      stopInterval,
      finalizeCurrent,
      liveElapsed,
      applyAndPersist,
      startInterval,
    ]
  );

  const handleEnd = useCallback(async () => {
    if (saving) return;
    stopInterval();
    const updated = current
      ? finalizeCurrent(projectRef.current, liveElapsed)
      : projectRef.current;
    await applyAndPersist(updated);
    onEnd();
  }, [
    saving,
    stopInterval,
    current,
    finalizeCurrent,
    liveElapsed,
    applyAndPersist,
    onEnd,
  ]);

  if (flat.length === 0) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90">
        <p className="text-muted-foreground">段落がありません</p>
        <Button className="ml-4" onClick={onEnd}>
          閉じる
        </Button>
      </div>
    );
  }

  const { totalTarget, totalElapsed } = getProjectTiming(project.toc);
  const measuredTotal =
    totalElapsed -
    (current?.paragraph.elapsedSeconds ?? 0) +
    liveElapsed;
  const targetSeconds = current?.paragraph.targetSeconds ?? 0;
  const timerStatus = getTimerStatus(liveElapsed, targetSeconds, true);
  const isLast = currentIndex >= flat.length - 1;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-[#050508] text-foreground">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0 bg-card/80 backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          <Badge variant="warning">リハーサル中</Badge>
          <span className="text-sm text-muted-foreground truncate">
            {current?.tocTitle} — 段落 {currentIndex + 1}/{flat.length}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-muted-foreground tabular-nums hidden sm:inline">
            合計 {formatTime(measuredTotal)}
            {totalTarget > 0 && (
              <span className="opacity-60"> / {formatTime(totalTarget)}</span>
            )}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleEnd()}
            disabled={saving}
          >
            <Square className="h-3.5 w-3.5" />
            リハーサル終了
          </Button>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        <aside className="w-48 sm:w-56 border-r border-border overflow-y-auto shrink-0 bg-card/40">
          <div className="p-2 space-y-3">
            {project.toc.map((item) => (
              <div key={item.id}>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 py-1 truncate">
                  {item.title}
                </p>
                <div className="space-y-0.5">
                  {item.paragraphs.map((para, pIdx) => {
                    const isActive =
                      current?.tocId === item.id &&
                      current?.paragraph.id === para.id;
                    const displayElapsed = isActive
                      ? liveElapsed
                      : para.elapsedSeconds;
                    const status = getTimerStatus(
                      displayElapsed,
                      para.targetSeconds,
                      isActive
                    );

                    return (
                      <button
                        key={para.id}
                        type="button"
                        disabled={saving}
                        onClick={() => void handleJump(item.id, para.id)}
                        className={cn(
                          "w-full text-left px-2 py-1.5 rounded text-xs transition-colors",
                          isActive
                            ? "bg-violet-500/20 text-violet-200 ring-1 ring-violet-500/30"
                            : "text-muted-foreground hover:bg-accent/30 hover:text-foreground"
                        )}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono opacity-60 tabular-nums w-4">
                            {pIdx + 1}
                          </span>
                          <span className="truncate flex-1">
                            {para.content
                              ? para.content.slice(0, 20) +
                                (para.content.length > 20 ? "…" : "")
                              : "（未入力）"}
                          </span>
                          <Badge
                            variant={status}
                            className="text-[9px] py-0 px-1.5 font-mono tabular-nums shrink-0"
                          >
                            {formatTime(displayElapsed)}
                          </Badge>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 p-4 sm:p-6 gap-4 overflow-y-auto">
          <div className="max-w-3xl mx-auto w-full">
            <SlidePreview slide={current.paragraph.slide} />
          </div>

          <div className="max-w-3xl mx-auto w-full flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-line">
                {current.paragraph.content || "（原稿未入力）"}
              </p>
            </div>

            <div className="flex flex-col items-center gap-2 shrink-0">
              <Badge
                variant={timerStatus}
                className="text-2xl font-mono tabular-nums px-4 py-2 gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                {formatTime(liveElapsed)}
                {targetSeconds > 0 && (
                  <span className="text-sm opacity-60">
                    / {formatTime(targetSeconds)}
                  </span>
                )}
              </Badge>
              {targetSeconds > 0 && liveElapsed > targetSeconds && (
                <p className="text-xs text-destructive">目標時間を超過</p>
              )}
              {targetSeconds > 0 &&
                liveElapsed > targetSeconds * 0.8 &&
                liveElapsed <= targetSeconds && (
                  <p className="text-xs text-amber-400">目標の80%を超えています</p>
                )}
              <Button
                size="lg"
                onClick={() => void handleNext()}
                disabled={saving}
                className="min-w-[120px]"
              >
                <SkipForward className="h-4 w-4" />
                {saving ? "保存中…" : isLast ? "終了" : "次へ"}
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
