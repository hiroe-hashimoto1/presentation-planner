"use client";

import { useRef } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import type { Paragraph, Slide, SlideTemplateType } from "@/lib/types";
import { SLIDE_TEMPLATE_LABELS } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  EditorEmpty,
  NotionBlock,
  PaneShell,
} from "@/components/editor/pane-shell";
import { cn } from "@/lib/utils";

interface PaneSlideProps {
  selectedParagraph: Paragraph | null;
  onSlideChange: (slide: Slide) => void;
}

const TEMPLATE_TYPES: SlideTemplateType[] = [
  "title-only",
  "title-text",
  "title-image",
  "title-text-image",
  "bullet",
  "two-column",
];

function SlidePreview({ slide }: { slide: Slide }) {
  const base =
    "w-full aspect-video rounded-lg overflow-hidden relative flex flex-col text-white p-5 sm:p-6 ring-1 ring-white/10 shadow-[0_0_40px_rgba(34,211,238,0.08)] bg-gradient-to-br from-[#0a0a12] via-[#0f1018] to-[#050508]";

  switch (slide.templateType) {
    case "title-only":
      return (
        <div className={base}>
          <div className="m-auto text-center">
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">
              {slide.title || "タイトル"}
            </h2>
          </div>
        </div>
      );

    case "title-text":
      return (
        <div className={base}>
          <h2 className="text-lg font-semibold mb-3 border-b border-cyan-500/20 pb-2 tracking-tight">
            {slide.title || "タイトル"}
          </h2>
          <p className="text-sm leading-relaxed text-slate-400 whitespace-pre-line flex-1">
            {slide.body || "テキスト内容"}
          </p>
        </div>
      );

    case "title-image":
      return (
        <div className={base}>
          <h2 className="text-lg font-semibold mb-3 tracking-tight">
            {slide.title || "タイトル"}
          </h2>
          <div className="flex-1 rounded-md bg-white/5 flex items-center justify-center overflow-hidden ring-1 ring-white/10">
            {slide.imageUrl || slide.imageFile ? (
              <img
                src={slide.imageFile || slide.imageUrl}
                alt="slide image"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-slate-600 text-sm">画像エリア</span>
            )}
          </div>
        </div>
      );

    case "title-text-image":
      return (
        <div className={base}>
          <h2 className="text-base font-semibold mb-3 border-b border-cyan-500/20 pb-2">
            {slide.title || "タイトル"}
          </h2>
          <div className="flex-1 flex gap-3 min-h-0">
            <p className="flex-1 text-sm leading-relaxed text-slate-400 whitespace-pre-line overflow-hidden">
              {slide.body || "テキスト内容"}
            </p>
            <div className="flex-1 rounded-md bg-white/5 flex items-center justify-center overflow-hidden ring-1 ring-white/10">
              {slide.imageUrl || slide.imageFile ? (
                <img
                  src={slide.imageFile || slide.imageUrl}
                  alt="slide image"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-slate-600 text-xs">画像</span>
              )}
            </div>
          </div>
        </div>
      );

    case "bullet":
      return (
        <div className={base}>
          <h2 className="text-lg font-semibold mb-3 border-b border-cyan-500/20 pb-2">
            {slide.title || "タイトル"}
          </h2>
          <ul className="space-y-2 flex-1">
            {(slide.bulletPoints.length > 0
              ? slide.bulletPoints
              : ["箇条書き 1", "箇条書き 2", "箇条書き 3"]
            ).map((point, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-slate-400"
              >
                <span className="text-cyan-400 mt-0.5 shrink-0">▸</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      );

    case "two-column":
      return (
        <div className={base}>
          <h2 className="text-lg font-semibold mb-3 border-b border-cyan-500/20 pb-2">
            {slide.title || "タイトル"}
          </h2>
          <div className="flex-1 flex gap-3 min-h-0">
            <div className="flex-1 bg-white/5 rounded-md p-3 text-sm text-slate-400 whitespace-pre-line ring-1 ring-white/5">
              {slide.columnLeft || "左カラム"}
            </div>
            <div className="flex-1 bg-white/5 rounded-md p-3 text-sm text-slate-400 whitespace-pre-line ring-1 ring-white/5">
              {slide.columnRight || "右カラム"}
            </div>
          </div>
        </div>
      );

    default:
      return <div className={base} />;
  }
}

export function PaneSlide({ selectedParagraph, onSlideChange }: PaneSlideProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);

  if (!selectedParagraph) {
    return (
      <PaneShell accent="slide" label="スライド">
        <EditorEmpty>目次から段落を選択してください</EditorEmpty>
      </PaneShell>
    );
  }

  const slide = selectedParagraph.slide;

  const update = (partial: Partial<Slide>) => {
    onSlideChange({ ...slide, ...partial });
  };

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      update({ imageFile: ev.target?.result as string, imageUrl: undefined });
    };
    reader.readAsDataURL(file);
  };

  const showImageField =
    slide.templateType === "title-image" ||
    slide.templateType === "title-text-image";

  const showBodyField =
    slide.templateType === "title-text" ||
    slide.templateType === "title-text-image";

  const showBulletField = slide.templateType === "bullet";
  const showColumnField = slide.templateType === "two-column";

  return (
    <PaneShell accent="slide" label="スライド">
      <div className="p-3 sm:p-4 space-y-4">
        <SlidePreview slide={slide} />

        <NotionBlock label="テンプレート">
          <div className="grid grid-cols-2 gap-1.5 px-1">
            {TEMPLATE_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => update({ templateType: type })}
                className={cn(
                  "text-[11px] px-2 py-2 rounded-md border text-left transition-colors",
                  slide.templateType === type
                    ? "border-amber-400/50 bg-amber-500/10 text-amber-200 font-medium"
                    : "border-border text-muted-foreground hover:bg-accent/40 hover:text-foreground"
                )}
              >
                {SLIDE_TEMPLATE_LABELS[type]}
              </button>
            ))}
          </div>
        </NotionBlock>

        <NotionBlock label="スライドタイトル">
          <Input
            type="text"
            value={slide.title}
            onChange={(e) => update({ title: e.target.value })}
            className="notion-input h-auto border-0 shadow-none focus-visible:ring-0"
            placeholder="スライドのタイトル"
          />
        </NotionBlock>

        {showBodyField && (
          <NotionBlock label="本文">
            <Textarea
              value={slide.body}
              onChange={(e) => update({ body: e.target.value })}
              rows={4}
              className="notion-input min-h-0 border-0 shadow-none focus-visible:ring-0 resize-none"
              placeholder="本文テキストを入力..."
            />
          </NotionBlock>
        )}

        {showBulletField && (
          <NotionBlock label="箇条書き">
            <Textarea
              value={slide.bulletPoints.join("\n")}
              onChange={(e) =>
                update({ bulletPoints: e.target.value.split("\n") })
              }
              rows={5}
              className="notion-input min-h-0 border-0 shadow-none focus-visible:ring-0 resize-none"
              placeholder={"項目1\n項目2\n項目3"}
            />
          </NotionBlock>
        )}

        {showColumnField && (
          <>
            <NotionBlock label="左カラム">
              <Textarea
                value={slide.columnLeft}
                onChange={(e) => update({ columnLeft: e.target.value })}
                rows={4}
                className="notion-input min-h-0 border-0 shadow-none focus-visible:ring-0 resize-none"
                placeholder="左カラムの内容..."
              />
            </NotionBlock>
            <NotionBlock label="右カラム">
              <Textarea
                value={slide.columnRight}
                onChange={(e) => update({ columnRight: e.target.value })}
                rows={4}
                className="notion-input min-h-0 border-0 shadow-none focus-visible:ring-0 resize-none"
                placeholder="右カラムの内容..."
              />
            </NotionBlock>
          </>
        )}

        {showImageField && (
          <NotionBlock label="画像">
            <div className="space-y-2 px-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => imageInputRef.current?.click()}
              >
                <ImagePlus className="h-4 w-4" />
                ファイルをアップロード
              </Button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageFile}
              />
              <Input
                type="url"
                value={slide.imageUrl ?? ""}
                onChange={(e) =>
                  update({ imageUrl: e.target.value, imageFile: undefined })
                }
                className="notion-input h-8 text-xs border border-border bg-secondary/50"
                placeholder="または画像URLを入力..."
              />
              {(slide.imageFile || slide.imageUrl) && (
                <button
                  type="button"
                  onClick={() =>
                    update({ imageFile: undefined, imageUrl: undefined })
                  }
                  className="inline-flex items-center gap-1 text-xs text-destructive hover:opacity-80"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  画像を削除
                </button>
              )}
            </div>
          </NotionBlock>
        )}
      </div>
    </PaneShell>
  );
}
