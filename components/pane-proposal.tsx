"use client";

import type { ProposalFields } from "@/lib/types";

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
    <div className="flex flex-col h-full bg-white">
      {/* pane header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 bg-indigo-50 shrink-0">
        <div className="w-2 h-2 rounded-full bg-indigo-500" />
        <span className="text-sm font-semibold text-indigo-700">課題・企画</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* project title */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            企画タイトル
          </label>
          <input
            type="text"
            value={projectTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            className="w-full px-3 py-2 text-base font-semibold border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50"
            placeholder="企画タイトルを入力..."
          />
        </div>

        <div className="border-t border-gray-100" />

        {FIELDS.map(({ key, label, rows }) => (
          <div key={key}>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              {label}
            </label>
            <textarea
              value={proposal[key]}
              onChange={(e) => handleChange(key, e.target.value)}
              rows={rows}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none bg-gray-50 leading-relaxed"
              placeholder={`${label}を入力...`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
