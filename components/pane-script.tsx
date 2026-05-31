"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { TocItem, Paragraph, Slide } from "@/lib/types";

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

    // auto-advance to next paragraph
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

  if (!selectedTocItem) {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 bg-emerald-50 shrink-0">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-sm font-semibold text-emerald-700">説明原稿</span>
        </div>
        <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
          目次項目を選択してください
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* pane header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-emerald-50 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          <span className="text-sm font-semibold text-emerald-700 truncate">
            {selectedTocItem.title}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-gray-500">
            合計 {formatTime(totalElapsed)}
          </span>
          {timer.running ? (
            <button
              onClick={saveTimerToParaAndNext}
              className="text-xs px-3 py-1 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-colors"
            >
              次へ ▶
            </button>
          ) : (
            <button
              onClick={() => {
                const firstPara = selectedTocItem.paragraphs[0];
                if (firstPara) {
                  onSelectParagraph(firstPara.id);
                  startTimer(firstPara.id);
                }
              }}
              className="text-xs px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full hover:bg-emerald-200 transition-colors"
            >
              ▶ 計測開始
            </button>
          )}
        </div>
      </div>

      {/* paragraphs */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {selectedTocItem.paragraphs.map((para, idx) => {
          const isSelected = selectedParaId === para.id;
          const isTimerActive = timer.running && timer.paraId === para.id;
          const elapsed = isTimerActive ? timer.elapsed : para.elapsedSeconds;
          const isOverTarget = para.targetSeconds > 0 && elapsed > para.targetSeconds;

          return (
            <div
              key={para.id}
              className={`group rounded-xl border transition-all ${
                isSelected
                  ? "border-emerald-400 shadow-sm"
                  : "border-gray-100 hover:border-gray-200"
              } ${isTimerActive ? "ring-2 ring-emerald-300" : ""}`}
              onClick={() => onSelectParagraph(para.id)}
            >
              {/* paragraph header */}
              <div className="flex items-center gap-2 px-3 pt-2.5 pb-1">
                <span className="text-xs font-bold text-gray-400">
                  段落 {idx + 1}
                </span>

                {/* timer display */}
                <div
                  className={`flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded-full ${
                    isTimerActive
                      ? isOverTarget
                        ? "bg-red-100 text-red-600"
                        : "bg-emerald-100 text-emerald-700"
                      : para.elapsedSeconds > 0
                      ? isOverTarget
                        ? "bg-red-50 text-red-400"
                        : "bg-gray-100 text-gray-500"
                      : "bg-gray-50 text-gray-400"
                  }`}
                >
                  {isTimerActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                  {formatTime(elapsed)}
                  {para.targetSeconds > 0 && (
                    <span className="text-gray-400">/ {formatTime(para.targetSeconds)}</span>
                  )}
                </div>

                <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* target time input */}
                  <input
                    type="number"
                    value={para.targetSeconds}
                    onChange={(e) =>
                      updateTargetSeconds(para.id, Number(e.target.value))
                    }
                    onClick={(e) => e.stopPropagation()}
                    className="w-14 text-xs text-center border border-gray-200 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    title="目標秒数"
                    min={0}
                  />
                  <span className="text-xs text-gray-400">秒</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeParagraph(para.id);
                    }}
                    className="text-gray-300 hover:text-red-500 text-xs ml-1"
                    title="段落を削除"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* textarea */}
              <div className="px-3 pb-2.5">
                <textarea
                  ref={(el) => {
                    textareaRefs.current[para.id] = el;
                  }}
                  value={para.content}
                  onChange={(e) => updateParagraphContent(para.id, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, para.id)}
                  onClick={(e) => e.stopPropagation()}
                  rows={3}
                  className="w-full text-sm resize-none focus:outline-none text-gray-700 leading-relaxed placeholder-gray-300 bg-transparent"
                  placeholder="話す内容を入力... (Enterで新段落、Shift+Enterで改行)"
                />
              </div>

              {isOverTarget && (
                <div className="px-3 pb-2 text-xs text-red-500 font-medium">
                  ⚠ 目標時間を超過しています
                </div>
              )}
            </div>
          );
        })}

        {/* add paragraph */}
        <button
          onClick={() => addParagraph()}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg border border-dashed border-gray-200 hover:border-emerald-300 transition-colors"
        >
          <span className="text-base leading-none">+</span>
          <span>段落を追加</span>
        </button>
      </div>
    </div>
  );
}
