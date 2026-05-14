import type { QuoteResult } from "@/lib/types";

const CATEGORY_LABEL: Record<string, string> = {
  image:      "이미지",
  video:      "영상",
  motion:     "모션",
  render:     "렌더·인코딩",
  "ai-image": "AI 이미지",
  "ai-video": "AI 영상",
};

const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(Math.round(n)) + "원";

export default function QuoteTable({ result }: { result: QuoteResult }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-y border-slate-100">
            <th className="px-5 py-4 text-[11px] font-black text-slate-400 uppercase">구분</th>
            <th className="px-5 py-4 text-[11px] font-black text-slate-400 uppercase">작업 항목</th>
            <th className="px-5 py-4 text-[11px] font-black text-slate-400 uppercase">기준</th>
            <th className="px-5 py-4 text-[11px] font-black text-slate-400 uppercase text-center">수량</th>
            <th className="px-5 py-4 text-[11px] font-black text-slate-400 uppercase text-right">단가</th>
            <th className="px-5 py-4 text-[11px] font-black text-slate-400 uppercase text-right">합계</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {result.lineItems.map((item, i) => (
            <tr key={i} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-5 py-4 text-[12px] font-bold text-slate-400">{CATEGORY_LABEL[item.category]}</td>
              <td className="px-5 py-4 text-[13px] font-bold text-slate-900">{item.name}</td>
              <td className="px-5 py-4 text-[12px] text-slate-400">{item.unit}</td>
              <td className="px-5 py-4 text-[13px] font-black text-slate-700 text-center font-mono">{item.quantity}</td>
              <td className="px-5 py-4 text-[13px] text-slate-500 text-right font-mono">{fmt(item.unitCost)}</td>
              <td className="px-5 py-4 text-[13px] font-black text-slate-900 text-right font-mono">{fmt(item.totalCost)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-slate-50/80">
            <td colSpan={5} className="px-5 py-4 text-right text-slate-500 text-sm font-semibold">원가 소계</td>
            <td className="px-5 py-4 text-right font-mono font-bold text-slate-900">{fmt(result.costSubtotal)}</td>
          </tr>
          {result.marginAmount > 0 && (
            <tr className="bg-blue-50/30">
              <td colSpan={5} className="px-5 py-4 text-right text-primary text-sm font-semibold">마진</td>
              <td className="px-5 py-4 text-right font-mono font-bold text-primary">+ {fmt(result.marginAmount)}</td>
            </tr>
          )}
          <tr className="bg-primary/5">
            <td colSpan={5} className="px-5 py-5 text-right text-slate-900 font-black text-base">최종 견적가 (VAT 별도)</td>
            <td className="px-5 py-5 text-right font-mono font-black text-primary text-base">{fmt(result.totalPrice)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
