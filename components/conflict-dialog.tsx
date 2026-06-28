"use client";

import { Button } from "@/components/ui/button";

interface ConflictDialogProps {
  open: boolean;
  onOverwrite: () => void;
  onReload: () => void;
}

export function ConflictDialog({
  open,
  onOverwrite,
  onReload,
}: ConflictDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="conflict-dialog-title"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative z-[201] w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg">
        <h2
          id="conflict-dialog-title"
          className="text-lg font-semibold leading-none tracking-tight"
        >
          保存の競合
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          他のタブで更新されました
        </p>
        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button type="button" variant="outline" onClick={onReload}>
            最新を読み込む
          </Button>
          <Button type="button" onClick={onOverwrite}>
            上書きする
          </Button>
        </div>
      </div>
    </div>
  );
}
