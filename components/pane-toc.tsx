"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import type { TocItem, Paragraph, Slide } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AddRowButton, PaneShell } from "@/components/editor/pane-shell";
import { cn } from "@/lib/utils";

interface PaneTocProps {
  toc: TocItem[];
  selectedTocId: string | null;
  selectedParaId: string | null;
  onSelectToc: (tocId: string) => void;
  onSelectParagraph: (tocId: string, paraId: string) => void;
  onTocChange: (toc: TocItem[]) => void;
  readOnly?: boolean;
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
  readOnly = false,
}: PaneTocProps) {
  const [editingTocId, setEditingTocId] = useState<string | null>(null);

  const addTocItem = () => {
    if (readOnly) return;
    onTocChange([...toc, createTocItem()]);
  };

  const removeTocItem = (tocId: string) => {
    if (readOnly) return;
    onTocChange(toc.filter((t) => t.id !== tocId));
  };

  const updateTocTitle = (tocId: string, title: string) => {
    if (readOnly) return;
    onTocChange(toc.map((t) => (t.id === tocId ? { ...t, title } : t)));
  };

  const totalParagraphs = toc.reduce((sum, t) => sum + t.paragraphs.length, 0);

  return (
    <PaneShell
      accent="toc"
      label="目次"
      meta={
        <Badge variant="muted" className="text-[10px] py-0">
          {totalParagraphs}
        </Badge>
      }
    >
      <div className="p-2 sm:p-3 space-y-1">
        {toc.map((item, index) => (
          <div key={item.id}>
            <div
              className={cn(
                "group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors",
                selectedTocId === item.id
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/40"
              )}
              onClick={() => onSelectToc(item.id)}
            >
              <span className="text-[10px] font-mono text-muted-foreground w-4 shrink-0 tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>

              {editingTocId === item.id && !readOnly ? (
                <Input
                  autoFocus
                  className="flex-1 h-7 text-sm border-0 bg-secondary shadow-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={item.title}
                  onChange={(e) => updateTocTitle(item.id, e.target.value)}
                  onBlur={() => setEditingTocId(null)}
                  onKeyDown={(e) => e.key === "Enter" && setEditingTocId(null)}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span
                  className="flex-1 text-sm truncate"
                  onDoubleClick={(e) => {
                    if (readOnly) return;
                    e.stopPropagation();
                    setEditingTocId(item.id);
                  }}
                >
                  {item.title}
                </span>
              )}

              <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                {item.paragraphs.length}
              </span>
              {!readOnly && (
              <button
                type="button"
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-muted-foreground hover:text-destructive transition-all shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTocItem(item.id);
                }}
                title="削除"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              )}
            </div>

            {selectedTocId === item.id && (
              <div className="ml-6 mt-0.5 space-y-0.5 border-l border-border pl-2">
                {item.paragraphs.map((para, pIdx) => (
                  <div
                    key={para.id}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1 rounded cursor-pointer text-xs transition-colors",
                      selectedParaId === para.id
                        ? "bg-violet-500/15 text-violet-200"
                        : "text-muted-foreground hover:bg-accent/30 hover:text-foreground"
                    )}
                    onClick={() => onSelectParagraph(item.id, para.id)}
                  >
                    <span className="font-mono opacity-60 tabular-nums">
                      {pIdx + 1}
                    </span>
                    <span className="truncate">
                      {para.content
                        ? para.content.slice(0, 28) +
                          (para.content.length > 28 ? "…" : "")
                        : "（未入力）"}
                    </span>
                    {para.targetSeconds > 0 && (
                      <span className="ml-auto shrink-0 font-mono opacity-60">
                        {para.targetSeconds}s
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {!readOnly && (
        <AddRowButton onClick={addTocItem}>
          <Plus className="h-4 w-4" />
          目次項目を追加
        </AddRowButton>
        )}
      </div>
    </PaneShell>
  );
}
