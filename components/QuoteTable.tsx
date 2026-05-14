import type { QuoteResult } from "@/lib/types";

const CATEGORY_LABEL: Record<string, string> = {
  image:      "이미지",
  video:      "영상",
  motion:     "모션",
  render:     "렌더·인코딩",
  "ai-image": "AI 이미지",
  "ai-video": "AI 영상",
};

export default function QuoteTable({ result }: { result: QuoteResult }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="text-left px-3 py-2 border border-gray-200">구분</th>
            <th className="text-left px-3 py-2 border border-gray-200">작업 항목</th>
            <th className="text-center px-3 py-2 border border-gray-200">기준</th>
            <th className="text-right px-3 py-2 border border-gray-200">수량</th>
            <th className="text-right px-3 py-2 border border-gray-200">단가</th>
            <th className="text-right px-3 py-2 border border-gray-200">합계</th>
          </tr>
        </thead>
        <tbody>
          {result.lineItems.map((item, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
              <td className="px-3 py-2 border border-gray-200 text-gray-500">{CATEGORY_LABEL[item.category]}</td>
              <td className="px-3 py-2 border border-gray-200">{item.name}</td>
              <td className="px-3 py-2 border border-gray-200 text-center text-gray-500">{item.unit}</td>
              <td className="px-3 py-2 border border-gray-200 text-right">{item.quantity}</td>
              <td className="px-3 py-2 border border-gray-200 text-right">{item.unitCost.toLocaleString()}원</td>
              <td className="px-3 py-2 border border-gray-200 text-right font-medium">{item.totalCost.toLocaleString()}원</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-100">
            <td colSpan={5} className="px-3 py-2 border border-gray-200 text-right font-semibold">원가 소계</td>
            <td className="px-3 py-2 border border-gray-200 text-right font-semibold">{result.costSubtotal.toLocaleString()}원</td>
          </tr>
          {result.marginAmount > 0 && (
            <tr className="bg-gray-100">
              <td colSpan={5} className="px-3 py-2 border border-gray-200 text-right text-gray-600">마진</td>
              <td className="px-3 py-2 border border-gray-200 text-right text-gray-600">+ {result.marginAmount.toLocaleString()}원</td>
            </tr>
          )}
          <tr className="bg-blue-50">
            <td colSpan={5} className="px-3 py-2 border border-blue-200 text-right font-bold text-blue-700 text-base">최종 견적가 (VAT 별도)</td>
            <td className="px-3 py-2 border border-blue-200 text-right font-bold text-blue-700 text-base">{result.totalPrice.toLocaleString()}원</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
