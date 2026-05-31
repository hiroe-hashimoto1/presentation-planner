"use client";

import { useRef } from "react";
import type { Paragraph, Slide, SlideTemplateType } from "@/lib/types";
import { SLIDE_TEMPLATE_LABELS } from "@/lib/types";

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
  const base = "w-full aspect-video bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg overflow-hidden relative flex flex-col text-white p-6";

  switch (slide.templateType) {
    case "title-only":
      return (
        <div className={base}>
          <div className="m-auto text-center">
            <h2 className="text-2xl font-bold">
              {slide.title || "タイトル"}
            </h2>
          </div>
        </div>
      );

    case "title-text":
      return (
        <div className={base}>
          <h2 className="text-xl font-bold mb-4 border-b border-white/20 pb-2">
            {slide.title || "タイトル"}
          </h2>
          <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-line flex-1">
            {slide.body || "テキスト内容"}
          </p>
        </div>
      );

    case "title-image":
      return (
        <div className={base}>
          <h2 className="text-xl font-bold mb-3">
            {slide.title || "タイトル"}
          </h2>
          <div className="flex-1 rounded-md bg-slate-700 flex items-center justify-center overflow-hidden">
            {slide.imageUrl || slide.imageFile ? (
              <img
                src={slide.imageFile || slide.imageUrl}
                alt="slide image"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-slate-500 text-sm">画像エリア</span>
            )}
          </div>
        </div>
      );

    case "title-text-image":
      return (
        <div className={base}>
          <h2 className="text-lg font-bold mb-3 border-b border-white/20 pb-2">
            {slide.title || "タイトル"}
          </h2>
          <div className="flex-1 flex gap-4">
            <p className="flex-1 text-sm leading-relaxed text-slate-300 whitespace-pre-line">
              {slide.body || "テキスト内容"}
            </p>
            <div className="flex-1 rounded-md bg-slate-700 flex items-center justify-center overflow-hidden">
              {slide.imageUrl || slide.imageFile ? (
                <img
                  src={slide.imageFile || slide.imageUrl}
                  alt="slide image"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-slate-500 text-xs">画像エリア</span>
              )}
            </div>
          </div>
        </div>
      );

    case "bullet":
      return (
        <div className={base}>
          <h2 className="text-xl font-bold mb-4 border-b border-white/20 pb-2">
            {slide.title || "タイトル"}
          </h2>
          <ul className="space-y-2 flex-1">
            {(slide.bulletPoints.length > 0
              ? slide.bulletPoints
              : ["箇条書き 1", "箇条書き 2", "箇条書き 3"]
            ).map((point, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="text-indigo-400 mt-0.5">▸</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      );

    case "two-column":
      return (
        <div className={base}>
          <h2 className="text-xl font-bold mb-4 border-b border-white/20 pb-2">
            {slide.title || "タイトル"}
          </h2>
          <div className="flex-1 flex gap-4">
            <div className="flex-1 bg-slate-700/50 rounded-md p-3 text-sm text-slate-300 whitespace-pre-line">
              {slide.columnLeft || "左カラム"}
            </div>
            <div className="flex-1 bg-slate-700/50 rounded-md p-3 text-sm text-slate-300 whitespace-pre-line">
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
      <div className="flex flex-col h-full bg-white">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 bg-amber-50 shrink-0">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-sm font-semibold text-amber-700">スライド</span>
        </div>
        <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
          段落を選択してください
        </div>
      </div>
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
    slide.templateType === "title-image" || slide.templateType === "title-text-image";

  const showBodyField =
    slide.templateType === "title-text" || slide.templateType === "title-text-image";

  const showBulletField = slide.templateType === "bullet";

  const showColumnField = slide.templateType === "two-column";

  return (
    <div className="flex flex-col h-full bg-white">
      {/* pane header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 bg-amber-50 shrink-0">
        <div className="w-2 h-2 rounded-full bg-amber-500" />
        <span className="text-sm font-semibold text-amber-700">スライド</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* preview */}
        <SlidePreview slide={slide} />

        {/* template selector */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            テンプレート
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {TEMPLATE_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => update({ templateType: type })}
                className={`text-xs px-2 py-1.5 rounded-md border text-left transition-colors ${
                  slide.templateType === type
                    ? "border-amber-400 bg-amber-50 text-amber-700 font-semibold"
                    : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                {SLIDE_TEMPLATE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>

        {/* title */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            スライドタイトル
          </label>
          <input
            type="text"
            value={slide.title}
            onChange={(e) => update({ title: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-gray-50"
            placeholder="スライドのタイトル"
          />
        </div>

        {/* body text */}
        {showBodyField && (
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              本文テキスト
            </label>
            <textarea
              value={slide.body}
              onChange={(e) => update({ body: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none bg-gray-50 leading-relaxed"
              placeholder="本文テキストを入力..."
            />
          </div>
        )}

        {/* bullet points */}
        {showBulletField && (
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              箇条書き（1行1項目）
            </label>
            <textarea
              value={slide.bulletPoints.join("\n")}
              onChange={(e) =>
                update({ bulletPoints: e.target.value.split("\n") })
              }
              rows={5}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none bg-gray-50 leading-relaxed"
              placeholder={"項目1\n項目2\n項目3"}
            />
          </div>
        )}

        {/* two-column */}
        {showColumnField && (
          <>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                左カラム
              </label>
              <textarea
                value={slide.columnLeft}
                onChange={(e) => update({ columnLeft: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none bg-gray-50 leading-relaxed"
                placeholder="左カラムの内容..."
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                右カラム
              </label>
              <textarea
                value={slide.columnRight}
                onChange={(e) => update({ columnRight: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none bg-gray-50 leading-relaxed"
                placeholder="右カラムの内容..."
              />
            </div>
          </>
        )}

        {/* image */}
        {showImageField && (
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              画像
            </label>
            <div className="space-y-2">
              <button
                onClick={() => imageInputRef.current?.click()}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg hover:border-amber-300 hover:bg-amber-50 text-gray-600 text-left transition-colors"
              >
                📁 ファイルをアップロード
              </button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageFile}
              />
              <input
                type="url"
                value={slide.imageUrl ?? ""}
                onChange={(e) =>
                  update({ imageUrl: e.target.value, imageFile: undefined })
                }
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-gray-50"
                placeholder="または画像URLを入力..."
              />
              {(slide.imageFile || slide.imageUrl) && (
                <button
                  onClick={() =>
                    update({ imageFile: undefined, imageUrl: undefined })
                  }
                  className="text-xs text-red-400 hover:text-red-600"
                >
                  画像を削除
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
