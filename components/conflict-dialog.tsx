"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>保存の競合</DialogTitle>
          <DialogDescription>他のタブで更新されました</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onReload}>
            最新を読み込む
          </Button>
          <Button onClick={onOverwrite}>上書きする</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
