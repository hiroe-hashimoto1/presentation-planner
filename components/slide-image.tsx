"use client";

import { useEffect, useState } from "react";
import { ImageOff, Loader2 } from "lucide-react";
import { isExternalImageUrl } from "@/lib/images";
import { getSignedImageUrl } from "@/lib/supabase/storage";
import { cn } from "@/lib/utils";

interface SlideImageProps {
  imageRef?: string;
  localPreview?: string;
  uploading?: boolean;
  alt?: string;
  className?: string;
  containerClassName?: string;
}

export function SlideImage({
  imageRef,
  localPreview,
  uploading = false,
  alt = "slide image",
  className,
  containerClassName,
}: SlideImageProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (localPreview) {
      setSrc(localPreview);
      setError(false);
      setLoading(false);
      return;
    }

    if (!imageRef) {
      setSrc(null);
      setError(false);
      setLoading(false);
      return;
    }

    if (isExternalImageUrl(imageRef)) {
      setSrc(imageRef);
      setError(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(false);

    void getSignedImageUrl(imageRef).then((signedUrl) => {
      if (cancelled) return;
      if (!signedUrl) {
        setSrc(null);
        setError(true);
      } else {
        setSrc(signedUrl);
        setError(false);
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [imageRef, localPreview]);

  if (!imageRef && !localPreview && !uploading) {
    return null;
  }

  const showSpinner = uploading || (loading && !localPreview);

  if (showSpinner) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-2 text-slate-500",
          containerClassName
        )}
      >
        <Loader2 className="h-6 w-6 animate-spin text-cyan-400/80" />
        <span className="text-xs">アップロード中…</span>
      </div>
    );
  }

  if (error || !src) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-2 text-slate-500",
          containerClassName
        )}
      >
        <ImageOff className="h-6 w-6 opacity-60" />
        <span className="text-xs">画像を読み込めません</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
    />
  );
}
