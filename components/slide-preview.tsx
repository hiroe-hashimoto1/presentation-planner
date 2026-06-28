"use client";

import type { Slide } from "@/lib/types";
import { SlideImage } from "@/components/slide-image";
import { cn } from "@/lib/utils";

interface SlidePreviewProps {
  slide: Slide;
  localPreview?: string;
  uploading?: boolean;
  className?: string;
}

export function SlidePreview({
  slide,
  localPreview,
  uploading,
  className,
}: SlidePreviewProps) {
  const base = cn(
    "w-full aspect-video rounded-lg overflow-hidden relative flex flex-col text-white p-5 sm:p-6 ring-1 ring-white/10 shadow-[0_0_40px_rgba(34,211,238,0.08)] bg-gradient-to-br from-[#0a0a12] via-[#0f1018] to-[#050508]",
    className
  );

  const imageAreaClass =
    "flex-1 rounded-md bg-white/5 flex items-center justify-center overflow-hidden ring-1 ring-white/10 min-h-0";

  const renderImage = (compact = false) => {
    const hasImage =
      slide.imageUrl || slide.imageFile || localPreview || uploading;
    if (!hasImage) {
      return (
        <span className={cn("text-slate-600", compact ? "text-xs" : "text-sm")}>
          {compact ? "画像" : "画像エリア"}
        </span>
      );
    }
    return (
      <SlideImage
        imageRef={slide.imageUrl}
        localPreview={localPreview || slide.imageFile}
        uploading={uploading}
        className="w-full h-full object-cover"
        containerClassName="w-full h-full"
      />
    );
  };

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
          <div className={imageAreaClass}>{renderImage()}</div>
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
            <div className={cn(imageAreaClass, "flex-1")}>{renderImage(true)}</div>
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
