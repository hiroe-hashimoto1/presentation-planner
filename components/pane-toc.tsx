"use client";

import { useState } from "react";
import type { TocItem, Paragraph, Slide } from "@/lib/types";

interface PaneTocProps {
  toc: TocItem[];
  selectedTocId: string | null;
  selectedParaId: string | null;
  onSelectToc: (tocId: string) => void;
  onSelectParagraph: (tocId: string, paraId: string) => void;
  onTocChange: (toc: TocItem[]) => void;
}

function createParagraph(): Paragraph {
  const id = `para-${Date.now()}`;
  const slide: Slide = {
    id: `slide-${Date.now()}`,
    templateType: "title-text",
    title: "",
    body: "",
    bulletPoints: [],
    columnLeft: "",
    columnRight: "",
  };
  return { id, content: "", targetSeconds: 60, elapsedSeconds: 0, slide };
}

function createTocItem(): TocItem {
  return {
    id: `toc-${Date.now()}`,
    title: "新しい項目",
    paragraphs: [createParagraph()],
  };
}

export function PaneToc({
  toc,
  selectedTocId,
  selectedParaId,
  onSelectToc,
  onSelectParagraph,
  onTocChange,
}: PaneTocProps) {
  const [editingTocId, setEditingTocId] = useState<string | null>(null);

  const addTocItem = () => {
    onTocChange([...toc, createTocItem()]);
  };

  const removeTocItem = (tocId: string) => {
    onTocChange(toc.filter((t) => t.id !== tocId));
  };

  const updateTocTitle = (tocId: string, title: string) => {
    onTocChange(toc.map((t) => (t.id === tocId ? { ...t, title } : t)));
  };

  const totalParagraphs = toc.reduce((sum, t) => sum + t.paragraphs.length, 0);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* pane header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-violet-50 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-violet-500" />
          <span className="text-sm font-semibold text-violet-700">目次</span>
        </div>
        <span className="text-xs text-gray-400">{totalParagraphs}段落</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {toc.map((item, index) => (
          <div key={item.id}>
            {/* toc item */}
            <div
              className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                selectedTocId === item.id
                  ? "bg-violet-100 border border-violet-300"
                  : "hover:bg-gray-50 border border-transparent"
              }`}
              onClick={() => onSelectToc(item.id)}
            >
              <span className="text-xs font-bold text-gray-400 w-5 shrink-0">
                {index + 1}
              </span>

              {editingTocId === item.id ? (
                <input
                  autoFocus
                  className="flex-1 text-sm font-medium bg-white border border-violet-300 rounded px-2 py-0.5 focus:outline-none"
                  value={item.title}
                  onChange={(e) => updateTocTitle(item.id, e.target.value)}
                  onBlur={() => setEditingTocId(null)}
                  onKeyDown={(e) => e.key === "Enter" && setEditingTocId(null)}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span
                  className="flex-1 text-sm font-medium text-gray-800 truncate"
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setEditingTocId(item.id);
                  }}
                >
                  {item.title}
                </span>
              )}

              <span className="text-xs text-gray-400 shrink-0">
                {item.paragraphs.length}
              </span>
              <button
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity shrink-0 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTocItem(item.id);
                }}
                title="削除"
              >
                ✕
              </button>
            </div>

            {/* paragraphs under this toc */}
            {selectedTocId === item.id && (
              <div className="ml-7 mt-1 space-y-1">
                {item.paragraphs.map((para, pIdx) => (
                  <div
                    key={para.id}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer text-xs transition-colors ${
                      selectedParaId === para.id
                        ? "bg-violet-200 text-violet-900"
                        : "text-gray-600 hover:bg-violet-50"
                    }`}
                    onClick={() => onSelectParagraph(item.id, para.id)}
                  >
                    <span className="font-mono text-gray-400">{pIdx + 1}</span>
                    <span className="truncate">
                      {para.content
                        ? para.content.slice(0, 30) + (para.content.length > 30 ? "…" : "")
                        : "（未入力）"}
                    </span>
                    {para.targetSeconds > 0 && (
                      <span className="ml-auto shrink-0 text-gray-400">
                        {para.targetSeconds}s
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* add toc item */}
        <button
          onClick={addTocItem}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg border border-dashed border-gray-200 hover:border-violet-300 transition-colors"
        >
          <span className="text-base leading-none">+</span>
          <span>目次項目を追加</span>
        </button>
      </div>
    </div>
  );
}
