"use client";
import { useState } from "react";
import { Download, RotateCcw, FileText, Table } from "lucide-react";
import type { QuoteInput, QuoteResult } from "@/lib/types";
import QuoteTable from "@/components/QuoteTable";
import { saveQuote } from "@/lib/storage";

interface Props {
  input: QuoteInput;
  result: QuoteResult;
  onBack: () => void;
  onReset: () => void;
}

const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(Math.round(n)) + "원";

const EXTERNAL_GROUPS = [
  {
    key: "planning",
    label: "기획 및 설계",
    icon: "🧭",
    categories: ["planning"] as const,
    description: () => "프로젝트 기획, 리서치 및 AI 프롬프트 설계",
  },
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
        c.label === ({ planning: "기획", image: "이미지 제작", video: "영상·모션 제작", motion: "영상·모션 제작", render: "영상·모션 제작", "ai-image": "AI 이미지 생성", "ai-video": "AI 영상 생성" } as Record<string, string>)[cat]
      ))
      .reduce((s, c) => s + c.amount, 0);

    const itemNames = result.lineItems
      .filter(i => (group.categories as readonly string[]).includes(i.category))
      .map(i => i.name);

    return { ...group, amount, itemNames };
  }).filter(g => g.amount > 0);

  return (
    <div className="space-y-6">
      {/* 기본 정보 */}
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

      {/* 견적 테이블 */}
      <div className="border border-slate-100 rounded-2xl overflow-x-auto">
        <div className="min-w-[500px]">
          <div className="grid grid-cols-[160px_1fr_1fr_120px] bg-slate-50 border-b border-slate-100">
            {["구분", "세부 항목", "산출 근거 (비고)", "예상 금액"].map(h => (
              <div key={h} className="px-4 py-4 text-[11px] font-black text-slate-400 uppercase">{h}</div>
            ))}
          </div>
          {grouped.map((group, i) => (
            <div key={group.key} className={`grid grid-cols-[160px_1fr_1fr_120px] border-b border-slate-50 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/30"}`}>
              <div className="px-4 py-5 flex items-center space-x-2">
                <span className="text-lg shrink-0">{group.icon}</span>
                <span className="text-[13px] font-black text-slate-700">{group.label}</span>
              </div>
              <div className="px-4 py-5 text-[12px] font-bold text-slate-700">
                {group.itemNames.slice(0, 3).join(", ")}
                {group.itemNames.length > 3 && ` 외 ${group.itemNames.length - 3}건`}
              </div>
              <div className="px-4 py-5 text-[12px] text-slate-400">
                {group.description(group.itemNames)}
              </div>
              <div className="px-4 py-5 text-[13px] font-black text-slate-900 font-mono">
                {fmt(group.amount)}
              </div>
            </div>
          ))}
          {result.marginAmount > 0 && (
            <div className="grid grid-cols-[160px_1fr_1fr_120px] border-b border-slate-50 bg-white">
              <div className="px-4 py-5 text-[13px] font-black text-slate-500">···</div>
              <div className="px-4 py-5 text-[12px] font-bold text-slate-700">기타</div>
              <div className="px-4 py-5 text-[12px] text-slate-400">프로젝트 관리 및 제경비</div>
              <div className="px-4 py-5 text-[13px] font-black text-slate-900 font-mono">{fmt(result.marginAmount)}</div>
            </div>
          )}
          {/* 총 합계 — 테이블 맨 하단 */}
          <div className="grid grid-cols-[160px_1fr_1fr_120px] bg-primary/5 border-t-2 border-primary/20">
            <div className="px-4 py-5 col-span-3 flex items-center justify-end pr-6 text-[13px] font-black text-slate-700">
              총 견적 합계
              <span className="text-[11px] font-medium text-slate-400 ml-2">* VAT 별도</span>
            </div>
            <div className="px-4 py-5 text-[15px] font-black text-primary font-mono">{fmt(result.totalPrice)}</div>
          </div>
        </div>
      </div>

      {/* 견적 산출 배경 */}
      <div className="bg-blue-50 rounded-2xl px-5 py-4 flex items-center space-x-3">
        <div className="w-1.5 h-8 bg-primary rounded-full shrink-0" />
        <div>
          <p className="text-[11px] font-black text-primary uppercase tracking-wider mb-0.5">견적 산출 배경</p>
          <p className="text-[12px] text-slate-600">플랜티엠 2026년도 콘텐츠 제작 표준 단가 기준 적용</p>
        </div>
      </div>
    </div>
  );
}

export default function Step6Result({ input, result, onBack, onReset }: Props) {
  const [tab, setTab] = useState<"internal" | "external">("internal");
  const [downloading, setDownloading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    saveQuote(input);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const downloadPDF = async () => {
    setDownloading(true);
    try {
      const res = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, result, type: tab }),
      });
      const { base64 } = await res.json();
      const prefix = tab === "internal" ? "내부견적서" : "외부견적서";
      const link = document.createElement("a");
      link.href = `data:application/pdf;base64,${base64}`;
      link.download = `${prefix}_${input.basicInfo.companyName}_${input.basicInfo.date}.pdf`;
      link.click();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="w-full space-y-5">
      {/* 메인 카드 */}
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        {/* 카드 헤더: 제목 + 탭 */}
        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-slate-900">
              견적 결과 ({tab === "internal" ? "내부용" : "외부용"})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {input.basicInfo.companyName} · {input.basicInfo.projectName} · {input.basicInfo.date}
            </p>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setTab("internal")}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${tab === "internal" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              <Table size={13} />
              <span>내부용</span>
            </button>
            <button
              onClick={() => setTab("external")}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${tab === "external" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              <FileText size={13} />
              <span>외부용</span>
            </button>
          </div>
        </div>

        {/* 카드 콘텐츠 */}
        {tab === "internal" ? (
          <QuoteTable result={result} input={input} />
        ) : (
          <div className="p-8">
            <ExternalQuoteView input={input} result={result} />
          </div>
        )}
      </div>

      {/* 액션 버튼 — 카드 아래 */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
          ← 마진 수정하기
        </button>
        <div className="flex space-x-3">
          <button
            onClick={handleSave}
            className="flex items-center space-x-2 px-5 py-2.5 border-2 border-slate-200 bg-white text-slate-700 rounded-xl text-sm font-bold hover:border-primary hover:text-primary transition-all"
          >
            <span>{saved ? "저장했어요 ✓" : "견적 저장"}</span>
          </button>
          <button
            onClick={downloadPDF}
            disabled={downloading}
            className="flex items-center space-x-2 px-5 py-2.5 border-2 border-slate-200 bg-white text-slate-700 rounded-xl text-sm font-bold hover:border-primary hover:text-primary disabled:opacity-40 transition-all"
          >
            <Download size={15} />
            <span>{downloading ? "생성 중..." : "PDF 다운로드"}</span>
          </button>
          <button
            onClick={onReset}
            className="flex items-center space-x-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-all"
          >
            <RotateCcw size={15} />
            <span>새 견적서 작성</span>
          </button>
        </div>
      </div>
    </div>
  );
}
