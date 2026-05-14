"use client";
import { useState } from "react";
import { Download, RotateCcw, FileText, Table } from "lucide-react";
import type { QuoteInput, QuoteResult } from "@/lib/types";
import QuoteTable from "@/components/QuoteTable";

interface Props {
  input: QuoteInput;
  result: QuoteResult;
  onBack: () => void;
  onReset: () => void;
}

const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(Math.round(n)) + "원";

// 외부용 카테고리 정의 (슬라이드4 형식)
const EXTERNAL_GROUPS = [
  {
    key: "image",
    label: "이미지 편집",
    icon: "🖼",
    categories: ["image"] as const,
    description: (items: string[]) => items.length > 0 ? items.join(", ") : "이미지 소스 편집 및 합성",
  },
  {
    key: "video",
    label: "영상·모션그래픽",
    icon: "🎬",
    categories: ["video", "motion"] as const,
    description: () => "컷 편집, 모션그래픽, 화면전환 및 효과",
  },
  {
    key: "render",
    label: "렌더링·인코딩",
    icon: "💾",
    categories: ["render"] as const,
    description: () => "출력 렌더링 및 파일 변환",
  },
  {
    key: "ai-image",
    label: "AI 이미지 생성",
    icon: "✨",
    categories: ["ai-image"] as const,
    description: () => "AI 이미지 생성 일체",
  },
  {
    key: "ai-video",
    label: "AI 영상 생성",
    icon: "🤖",
    categories: ["ai-video"] as const,
    description: () => "AI 영상 생성 일체",
  },
];

function ExternalQuoteView({ input, result }: { input: QuoteInput; result: QuoteResult }) {
  const grouped = EXTERNAL_GROUPS.map(group => {
    const amount = result.categorySummary
      .filter(c => (group.categories as readonly string[]).some(cat =>
        c.label === ({ image: "이미지 제작", video: "영상·모션 제작", motion: "영상·모션 제작", render: "영상·모션 제작", "ai-image": "AI 이미지 생성", "ai-video": "AI 영상 생성" } as Record<string, string>)[cat]
      ))
      .reduce((s, c) => s + c.amount, 0);

    // 해당 카테고리 아이템 이름 목록
    const itemNames = result.lineItems
      .filter(i => (group.categories as readonly string[]).includes(i.category))
      .map(i => i.name);

    return { ...group, amount, itemNames };
  }).filter(g => g.amount > 0);

  return (
    <div className="space-y-6">
      {/* 헤더 정보 */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "업체명", value: input.basicInfo.companyName },
          { label: "담당자", value: input.basicInfo.contactName },
          { label: "프로젝트", value: input.basicInfo.projectName },
          { label: "견적일", value: input.basicInfo.date },
        ].map(({ label, value }) => (
          <div key={label} className="bg-slate-50 rounded-2xl p-4">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{label}</p>
            <p className="text-sm font-bold text-slate-800">{value}</p>
          </div>
        ))}
      </div>

      {/* 견적 테이블 + 합계 사이드 */}
      <div className="flex gap-6">
        {/* 좌측: 작업 항목 테이블 */}
        <div className="flex-1 border border-slate-100 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[1fr_2fr_2fr_1fr] bg-slate-50 border-b border-slate-100">
            {["구분", "세부 항목", "산출 근거 (비고)", "예상 금액"].map(h => (
              <div key={h} className="px-5 py-4 text-[11px] font-black text-slate-400 uppercase">{h}</div>
            ))}
          </div>
          {grouped.map((group, i) => (
            <div key={group.key} className={`grid grid-cols-[1fr_2fr_2fr_1fr] border-b border-slate-50 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/30"}`}>
              <div className="px-5 py-5 flex items-center space-x-2">
                <span className="text-lg">{group.icon}</span>
                <span className="text-[13px] font-black text-slate-700">{group.label}</span>
              </div>
              <div className="px-5 py-5 text-[12px] font-bold text-slate-700">
                {group.itemNames.slice(0, 3).join(", ")}
                {group.itemNames.length > 3 && ` 외 ${group.itemNames.length - 3}건`}
              </div>
              <div className="px-5 py-5 text-[12px] text-slate-400">
                {group.description(group.itemNames)}
              </div>
              <div className="px-5 py-5 text-[13px] font-black text-slate-900 font-mono">
                {fmt(group.amount)}
              </div>
            </div>
          ))}
          {result.marginAmount > 0 && (
            <div className="grid grid-cols-[1fr_2fr_2fr_1fr] border-b border-slate-50 bg-white">
              <div className="px-5 py-5 text-[13px] font-black text-slate-500">···</div>
              <div className="px-5 py-5 text-[12px] font-bold text-slate-700">기타</div>
              <div className="px-5 py-5 text-[12px] text-slate-400">프로젝트 관리 및 제경비</div>
              <div className="px-5 py-5 text-[13px] font-black text-slate-900 font-mono">{fmt(result.marginAmount)}</div>
            </div>
          )}
        </div>

        {/* 우측: 총 합계 박스 */}
        <div className="w-48 shrink-0 space-y-4">
          <div className="bg-slate-900 rounded-2xl p-6 text-white">
            <p className="text-[10px] text-slate-400 uppercase font-black mb-2">총 견적 합계</p>
            <p className="text-2xl font-black font-mono leading-none">{fmt(result.totalPrice)}</p>
            <p className="text-[10px] text-slate-500 mt-2">* VAT 별도</p>
          </div>
          <div className="bg-blue-50 rounded-2xl p-4 text-xs text-slate-500 leading-relaxed">
            <p className="font-bold text-slate-700 mb-1">견적 산출 배경</p>
            <p>플랜티엠 2026년도 콘텐츠 제작 표준 단가 기준 적용</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Step6Result({ input, result, onBack, onReset }: Props) {
  const [tab, setTab] = useState<"internal" | "external">("internal");
  const [downloading, setDownloading] = useState(false);

  const downloadPDF = async () => {
    setDownloading(true);
    try {
      const res = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, result }),
      });
      const { base64 } = await res.json();
      const link = document.createElement("a");
      link.href = `data:application/pdf;base64,${base64}`;
      link.download = `견적서_${input.basicInfo.companyName}_${input.basicInfo.date}.pdf`;
      link.click();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* 상단 요약 바 */}
      <div className="bg-slate-900 rounded-2xl p-5 text-white flex justify-between items-center">
        <div className="flex items-center space-x-6 divide-x divide-slate-800">
          <div className="px-4 first:pl-0">
            <p className="text-[10px] text-slate-500 uppercase font-black mb-1">업체</p>
            <p className="text-sm font-bold">{input.basicInfo.companyName}</p>
          </div>
          <div className="px-4">
            <p className="text-[10px] text-slate-500 uppercase font-black mb-1">프로젝트</p>
            <p className="text-sm font-bold">{input.basicInfo.projectName}</p>
          </div>
          <div className="px-4">
            <p className="text-[10px] text-slate-500 uppercase font-black mb-1">패널</p>
            <p className="text-sm font-bold">{input.panelInfo.count}개 · {input.panelInfo.size}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-blue-400 uppercase font-black mb-1">최종 제작가 (VAT 별도)</p>
          <p className="text-2xl font-black font-mono">{fmt(result.totalPrice)}</p>
        </div>
      </div>

      {/* 탭 + 액션 버튼 */}
      <div className="flex items-center justify-between">
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setTab("internal")}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${tab === "internal" ? "bg-white text-primary shadow-sm" : "text-slate-500"}`}
          >
            <Table size={16} />
            <span>내부용 세부 내역</span>
          </button>
          <button
            onClick={() => setTab("external")}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${tab === "external" ? "bg-white text-primary shadow-sm" : "text-slate-500"}`}
          >
            <FileText size={16} />
            <span>외부용 견적서</span>
          </button>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={downloadPDF}
            disabled={downloading}
            className="flex items-center space-x-2 px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 disabled:opacity-40 transition-all"
          >
            <Download size={16} />
            <span>{downloading ? "생성 중..." : "PDF 다운로드"}</span>
          </button>
          <button
            onClick={onReset}
            className="flex items-center space-x-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-all"
          >
            <RotateCcw size={16} />
            <span>새 견적 작성</span>
          </button>
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        {tab === "internal" ? (
          <div>
            <div className="p-6 border-b border-slate-50 bg-slate-50/30">
              <p className="text-[11px] font-black text-slate-400 uppercase">내부용 — 작업 항목별 원가 세부 내역 (외부 공개 금지)</p>
            </div>
            <div className="p-4">
              <QuoteTable result={result} />
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="mb-6 border-b border-slate-50 pb-4">
              <p className="text-[11px] font-black text-slate-400 uppercase">외부용 — 업체 제출용 견적서 (단가 비공개)</p>
            </div>
            <ExternalQuoteView input={input} result={result} />
          </div>
        )}
      </div>

      <button onClick={onBack} className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
        ← 마진 수정하기
      </button>
    </div>
  );
}
