import type { Project } from "./types";

export const MOCK_PROJECTS: Project[] = [
  {
    id: "project-1",
    title: "社内DX推進プロジェクト提案",
    proposal: {
      challenge:
        "各部署でExcelやメールによる属人的な業務が多く、情報共有の遅延や作業ミスが頻発している。",
      target: "全社員（特に管理部門・営業部門）",
      overview:
        "クラウドベースの業務管理ツールを導入し、情報の一元化と自動化を推進する。",
      goal: "業務時間を月間20%削減・ミス発生率を50%低減（6ヶ月後）",
      background:
        "競合他社がDXを推進する中、当社の生産性向上が急務となっている。",
    },
    toc: [
      {
        id: "toc-1",
        title: "現状の課題",
        paragraphs: [
          {
            id: "para-1-1",
            content:
              "現在、各部署では独自のExcelファイルを使った管理が行われており、バージョン管理が煩雑です。",
            targetSeconds: 30,
            elapsedSeconds: 0,
            slide: {
              id: "slide-1-1",
              templateType: "title-text",
              title: "現状の課題",
              body: "・Excel管理による属人化\n・情報共有の遅延\n・ダブルチェックの工数増大",
              bulletPoints: [],
              columnLeft: "",
              columnRight: "",
            },
          },
          {
            id: "para-1-2",
            content:
              "特に営業部門では、日報の作成に平均1時間を費やしており、その時間が商談活動を圧迫しています。",
            targetSeconds: 25,
            elapsedSeconds: 0,
            slide: {
              id: "slide-1-2",
              templateType: "bullet",
              title: "課題の影響",
              body: "",
              bulletPoints: [
                "日報作成：平均1時間/日",
                "情報共有遅延：平均2.3時間",
                "ミス対応コスト：月間40時間",
              ],
              columnLeft: "",
              columnRight: "",
            },
          },
        ],
      },
      {
        id: "toc-2",
        title: "企画内容",
        paragraphs: [
          {
            id: "para-2-1",
            content:
              "クラウド型プロジェクト管理ツールを導入し、全部署の情報を一元管理します。",
            targetSeconds: 40,
            elapsedSeconds: 0,
            slide: {
              id: "slide-2-1",
              templateType: "title-text-image",
              title: "導入するツール",
              body: "クラウド型業務管理プラットフォームの導入により、リアルタイムな情報共有を実現します。",
              bulletPoints: [],
              columnLeft: "",
              columnRight: "",
            },
          },
        ],
      },
      {
        id: "toc-3",
        title: "期待効果",
        paragraphs: [
          {
            id: "para-3-1",
            content:
              "導入後6ヶ月で業務時間20%削減、ミス発生率50%低減を目指します。",
            targetSeconds: 35,
            elapsedSeconds: 0,
            slide: {
              id: "slide-3-1",
              templateType: "two-column",
              title: "期待される効果",
              body: "",
              bulletPoints: [],
              columnLeft: "【定量効果】\n・業務時間 -20%\n・ミス率 -50%\n・コスト削減 年間200万円",
              columnRight: "【定性効果】\n・情報透明性の向上\n・従業員満足度UP\n・意思決定の迅速化",
            },
          },
        ],
      },
    ],
    createdAt: "2026-05-10T09:00:00Z",
    updatedAt: "2026-05-17T08:00:00Z",
  },
  {
    id: "project-2",
    title: "新サービス「HealthSync」企画提案",
    proposal: {
      challenge: "健康意識の高まりにも関わらず、継続的な健康管理ができていない人が多い。",
      target: "30〜50代のビジネスパーソン",
      overview: "AIを活用した個人最適化された健康管理アプリの開発・提供",
      goal: "リリース後1年でMAU10万人達成、継続率70%以上",
      background: "ヘルスケア市場は年率15%成長中。競合優位性を確立できる機会がある。",
    },
    toc: [
      {
        id: "toc-a",
        title: "市場機会",
        paragraphs: [
          {
            id: "para-a-1",
            content: "国内ヘルスケアアプリ市場は2026年に3,000億円規模に達する見込みです。",
            targetSeconds: 30,
            elapsedSeconds: 0,
            slide: {
              id: "slide-a-1",
              templateType: "title-text",
              title: "市場規模",
              body: "2026年：国内ヘルスケアアプリ市場 3,000億円\n年率成長率：15%",
              bulletPoints: [],
              columnLeft: "",
              columnRight: "",
            },
          },
        ],
      },
    ],
    createdAt: "2026-05-15T14:00:00Z",
    updatedAt: "2026-05-16T11:00:00Z",
  },
];
