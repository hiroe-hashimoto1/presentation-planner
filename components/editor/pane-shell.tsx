import { cn } from "@/lib/utils";

const ACCENT = {
  proposal: "border-l-cyan-400/80",
  toc: "border-l-violet-400/80",
  script: "border-l-emerald-400/80",
  slide: "border-l-amber-400/80",
} as const;

type PaneAccent = keyof typeof ACCENT;

interface PaneShellProps {
  accent: PaneAccent;
  label: string;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function PaneShell({
  accent,
  label,
  meta,
  actions,
  children,
  className,
}: PaneShellProps) {
  return (
    <div className={cn("flex flex-col h-full bg-card", className)}>
      <div
        className={cn(
          "flex items-center justify-between gap-2 px-4 py-2.5 border-b border-border shrink-0 border-l-2",
          ACCENT[accent]
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {label}
          </span>
          {meta}
        </div>
        {actions}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto editor-scroll flex flex-col">
        {children}
      </div>
    </div>
  );
}

export function EditorEmpty({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex items-center justify-center p-6 text-sm text-muted-foreground text-center leading-relaxed min-h-[8rem]">
      {children}
    </div>
  );
}

export function NotionBlock({
  label,
  children,
  className,
}: {
  label?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group rounded-md px-2 py-1.5 -mx-2 transition-colors hover:bg-accent/50 focus-within:bg-accent/50",
        className
      )}
    >
      {label && (
        <div className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground mb-1 px-1">
          {label}
        </div>
      )}
      {children}
    </div>
  );
}

export function AddRowButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-primary rounded-md border border-dashed border-border hover:border-primary/40 hover:bg-accent/30 transition-colors"
    >
      {children}
    </button>
  );
}
