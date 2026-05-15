import type { QuoteResult, LineItem } from "@/lib/types";

const CATEGORY_INFO: Record<LineItem["category"], { label: string; english: string }> = {
  image:      { label: "이미지 제작",  english: "Image Production" },
  video:      { label: "영상 제작",    english: "Video Production" },
  motion:     { label: "모션그래픽",   english: "Motion Graphic" },
  render:     { label: "렌더.인코딩", english: "Rendering" },
  "ai-image": { label: "AI 이미지",   english: "AI Image" },
  "ai-video": { label: "AI 영상",     english: "AI Video" },
};

const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(Math.round(n)) + "원";

export default function QuoteTable({ result }: { result: QuoteResult }) {
  // 카테고리별로 항목 그룹화 (순서 유지)
  const grouped: { category: LineItem["category"]; items: typeof result.lineItems }[] = [];
  for (const item of result.lineItems) {
    const last = grouped[grouped.length - 1];
    if (last && last.category === item.category) {
      last.items.push(item);
    } else {
      grouped.push({ category: item.category, items: [item] });
    }
  }

  const marginRate = result.costSubtotal > 0
    ? Math.round(result.marginAmount / result.costSubtotal * 100)
    : 0;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="px-6 py-4 text-[11px] font-bold text-slate-400 w-[110px]">구분</th>
            <th className="px-4 py-4 text-[11px] font-bold text-slate-400">작업 항목</th>
            <th className="px-4 py-4 text-[11px] font-bold text-slate-400 text-center w-[80px]">기준</th>
            <th className="px-4 py-4 text-[11px] font-bold text-slate-400 text-center w-[60px]">수량</th>
            <th className="px-4 py-4 text-[11px] font-bold text-slate-400 text-right w-[110px]">단가</th>
            <th className="px-4 py-4 text-[11px] font-bold text-slate-400 text-right w-[120px]">합계</th>
          </tr>
        </thead>
        <tbody>
          {grouped.map(({ category, items }) => {
            const info = CATEGORY_INFO[category];
            return (
              <>
                {/* 카테고리 헤더 행 */}
                <tr key={`cat-${category}`}>
                  <td colSpan={6} className="px-6 pt-7 pb-0">
                    <div className="text-[13px] font-semibold text-slate-600">
                      {info.label}
                      <span className="text-slate-400 font-normal ml-1.5">({info.english})</span>
                    </div>
                    <div className="mt-2.5 border-b border-slate-200" />
                  </td>
                </tr>
                {/* 항목 행 */}
                {items.map((item, i) => (
                  <tr key={`${category}-${i}`} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-6 py-4" />
                    <td className="px-4 py-4 text-[13px] font-medium text-slate-800">{item.name}</td>
                    <td className="px-4 py-4 text-[12px] text-slate-400 text-center">{item.unit}</td>
                    <td className="px-4 py-4 text-[13px] font-bold text-slate-800 text-center">{item.quantity}</td>
                    <td className="px-4 py-4 text-[12px] text-slate-400 text-right font-mono">{fmt(item.unitCost)}</td>
                    <td className="px-4 py-4 text-[13px] font-bold text-slate-900 text-right font-mono">{fmt(item.totalCost)}</td>
                  </tr>
                ))}
              </>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-slate-100">
            <td colSpan={5} className="px-6 py-5 text-right text-[13px] text-slate-500 font-medium">원가 소계</td>
            <td className="px-4 py-5 text-right font-mono font-black text-slate-900 text-[15px] pr-6">{fmt(result.costSubtotal)}</td>
          </tr>
          {result.marginAmount > 0 && (
            <tr>
              <td colSpan={5} className="px-6 py-3 text-right text-[13px] text-primary font-medium">마진 ({marginRate}%)</td>
              <td className="px-4 py-3 text-right font-mono font-bold text-primary text-[14px] pr-6">+ {fmt(result.marginAmount)}</td>
            </tr>
          )}
          <tr className="bg-primary/5">
            <td colSpan={5} className="px-6 py-5 text-right font-black text-slate-900 text-[14px]">최종 견적가 (VAT 별도)</td>
            <td className="px-4 py-5 text-right font-mono font-black text-primary text-[15px] pr-6">{fmt(result.totalPrice)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
