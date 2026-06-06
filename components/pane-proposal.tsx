"use client";

import type { ProposalFields } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NotionBlock, PaneShell } from "@/components/editor/pane-shell";

interface PaneProposalProps {
  proposal: ProposalFields;
  projectTitle: string;
  onProposalChange: (fields: ProposalFields) => void;
  onTitleChange: (title: string) => void;
}

const FIELDS: { key: keyof ProposalFields; label: string; rows: number }[] = [
  { key: "challenge", label: "課題", rows: 4 },
  { key: "target", label: "ターゲット", rows: 2 },
  { key: "overview", label: "企画概要", rows: 4 },
  { key: "goal", label: "目標 / KPI", rows: 3 },
  { key: "background", label: "背景・補足", rows: 3 },
];

export function PaneProposal({
  proposal,
  projectTitle,
  onProposalChange,
  onTitleChange,
}: PaneProposalProps) {
  const handleChange = (key: keyof ProposalFields, value: string) => {
    onProposalChange({ ...proposal, [key]: value });
  };

  return (
    <PaneShell accent="proposal" label="課題・企画">
      <div className="p-3 sm:p-4 space-y-1">
        <NotionBlock label="企画タイトル">
          <Input
            type="text"
            value={projectTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            className="notion-input text-base font-medium h-auto border-0 shadow-none focus-visible:ring-0"
            placeholder="企画タイトルを入力..."
          />
        </NotionBlock>

        <div className="h-px bg-border my-3" />

        {FIELDS.map(({ key, label, rows }) => (
          <NotionBlock key={key} label={label}>
            <Textarea
              value={proposal[key]}
              onChange={(e) => handleChange(key, e.target.value)}
              rows={rows}
              className="notion-input min-h-0 border-0 shadow-none focus-visible:ring-0 resize-none leading-relaxed"
              placeholder={`${label}を入力...`}
            />
          </NotionBlock>
        ))}
      </div>
    </PaneShell>
  );
}
