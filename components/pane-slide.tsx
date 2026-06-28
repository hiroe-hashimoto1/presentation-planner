"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, RefreshCw, Trash2 } from "lucide-react";
import type { Paragraph, Slide, SlideTemplateType } from "@/lib/types";
import { SLIDE_TEMPLATE_LABELS } from "@/lib/types";
import {
  isExternalImageUrl,
  isStorageImagePath,
  validateImageFile,
} from "@/lib/images";
import {
  buildSlideImagePath,
  deleteStorageImage,
  uploadSlideImage,
} from "@/lib/supabase/storage";
import { SlidePreview } from "@/components/slide-preview";
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
  projectId: string;
  userId: string;
  selectedParagraph: Paragraph | null;
  onSlideChange: (slide: Slide) => void;
  onUploadStateChange?: (uploading: boolean) => void;
  readOnly?: boolean;
}

const TEMPLATE_TYPES: SlideTemplateType[] = [
  "title-only",
  "title-text",
  "title-image",
  "title-text-image",
  "bullet",
  "two-column",
];

export function PaneSlide({
  projectId,
  userId,
  selectedParagraph,
  onSlideChange,
  onUploadStateChange,
  readOnly = false,
}: PaneSlideProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const pendingFileRef = useRef<File | null>(null);
  const oldStoragePathRef = useRef<string | null>(null);

  useEffect(() => {
    onUploadStateChange?.(uploading);
  }, [uploading, onUploadStateChange]);

  useEffect(() => {
    return () => {
      if (localPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(localPreview);
      }
    };
  }, [localPreview]);

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

  const clearLocalPreview = () => {
    if (localPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(localPreview);
    }
    setLocalPreview(null);
  };

  const removeOldStorageImage = async (path: string | null) => {
    if (path && isStorageImagePath(path)) {
      try {
        await deleteStorageImage(path);
      } catch {
        // 古い画像削除失敗は続行
      }
    }
  };

  const performUpload = async (file: File) => {
    setUploading(true);
    setUploadError(null);
    onUploadStateChange?.(true);

    const previewUrl = URL.createObjectURL(file);
    setLocalPreview(previewUrl);

    const oldPath =
      slide.imageUrl && isStorageImagePath(slide.imageUrl)
        ? slide.imageUrl
        : null;
    oldStoragePathRef.current = oldPath;

    try {
      const path = buildSlideImagePath(
        userId,
        projectId,
        slide.id,
        file
      );
      await uploadSlideImage(path, file);

      if (oldPath) {
        await removeOldStorageImage(oldPath);
      }

      onSlideChange({
        ...slide,
        imageUrl: path,
        imageFile: undefined,
      });
    } catch (e) {
      setUploadError(
        e instanceof Error ? e.message : "画像のアップロードに失敗しました"
      );
    } finally {
      setUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
      // onSlideChange の後に保存を走らせる（同期的に ref 更新済みの状態で flush）
      onUploadStateChange?.(false);
    }
  };

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.ok) {
      setUploadError(validation.message);
      if (imageInputRef.current) imageInputRef.current.value = "";
      return;
    }

    pendingFileRef.current = file;
    void performUpload(file);
  };

  const handleRetryUpload = () => {
    if (pendingFileRef.current) {
      void performUpload(pendingFileRef.current);
    }
  };

  const handleExternalUrlChange = async (url: string) => {
    if (uploading) return;

    if (!url.trim()) {
      update({ imageUrl: undefined, imageFile: undefined });
      return;
    }

    const oldPath =
      slide.imageUrl && isStorageImagePath(slide.imageUrl)
        ? slide.imageUrl
        : null;

    if (oldPath) {
      await removeOldStorageImage(oldPath);
    }

    clearLocalPreview();
    update({ imageUrl: url, imageFile: undefined });
  };

  const handleRemoveImage = async () => {
    if (uploading) return;

    const oldPath =
      slide.imageUrl && isStorageImagePath(slide.imageUrl)
        ? slide.imageUrl
        : null;

    if (oldPath) {
      await removeOldStorageImage(oldPath);
    }

    clearLocalPreview();
    pendingFileRef.current = null;
    setUploadError(null);
    update({ imageUrl: undefined, imageFile: undefined });
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const showImageField =
    slide.templateType === "title-image" ||
    slide.templateType === "title-text-image";

  const showBodyField =
    slide.templateType === "title-text" ||
    slide.templateType === "title-text-image";

  const showBulletField = slide.templateType === "bullet";
  const showColumnField = slide.templateType === "two-column";

  const externalUrlValue =
    slide.imageUrl && isExternalImageUrl(slide.imageUrl) ? slide.imageUrl : "";

  const hasImage =
    Boolean(slide.imageUrl) ||
    Boolean(slide.imageFile) ||
    Boolean(localPreview) ||
    uploading;

  return (
    <PaneShell accent="slide" label="スライド">
      <div className="p-3 sm:p-4 space-y-4">
        <SlidePreview
          slide={slide}
          localPreview={localPreview ?? undefined}
          uploading={uploading}
        />

        <NotionBlock label="テンプレート">
          <div className="grid grid-cols-2 gap-1.5 px-1">
            {TEMPLATE_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => update({ templateType: type })}
                disabled={readOnly || uploading}
                className={cn(
                  "text-[11px] px-2 py-2 rounded-md border text-left transition-colors",
                  slide.templateType === type
                    ? "border-amber-400/50 bg-amber-500/10 text-amber-200 font-medium"
                    : "border-border text-muted-foreground hover:bg-accent/40 hover:text-foreground",
                  uploading && "opacity-50 cursor-not-allowed"
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
            disabled={readOnly || uploading}
            className="notion-input h-auto border-0 shadow-none focus-visible:ring-0"
            placeholder="スライドのタイトル"
          />
        </NotionBlock>

        {showBodyField && (
          <NotionBlock label="本文">
            <Textarea
              value={slide.body}
              onChange={(e) => update({ body: e.target.value })}
              disabled={readOnly || uploading}
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
              disabled={readOnly || uploading}
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
                disabled={readOnly || uploading}
                rows={4}
                className="notion-input min-h-0 border-0 shadow-none focus-visible:ring-0 resize-none"
                placeholder="左カラムの内容..."
              />
            </NotionBlock>
            <NotionBlock label="右カラム">
              <Textarea
                value={slide.columnRight}
                onChange={(e) => update({ columnRight: e.target.value })}
                disabled={readOnly || uploading}
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
                disabled={readOnly || uploading}
                onClick={() => imageInputRef.current?.click()}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ImagePlus className="h-4 w-4" />
                )}
                {uploading ? "アップロード中…" : "ファイルをアップロード"}
              </Button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleImageFile}
              />
              <Input
                type="url"
                value={externalUrlValue}
                onChange={(e) => void handleExternalUrlChange(e.target.value)}
                disabled={readOnly || uploading}
                className="notion-input h-8 text-xs border border-border bg-secondary/50"
                placeholder="または画像URLを入力..."
              />
              {slide.imageUrl && isStorageImagePath(slide.imageUrl) && !uploading && (
                <p className="text-[11px] text-muted-foreground">
                  画像をアップロード済みです
                </p>
              )}
              {uploadError && (
                <div className="flex items-center gap-2">
                  <p className="text-xs text-destructive flex-1">{uploadError}</p>
                  {pendingFileRef.current && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs shrink-0"
                      onClick={handleRetryUpload}
                    >
                      <RefreshCw className="h-3 w-3" />
                      再試行
                    </Button>
                  )}
                </div>
              )}
              {hasImage && (
                <button
                  type="button"
                  disabled={readOnly || uploading}
                  onClick={() => void handleRemoveImage()}
                  className="inline-flex items-center gap-1 text-xs text-destructive hover:opacity-80 disabled:opacity-50"
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
