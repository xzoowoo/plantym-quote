"use client";
interface Props {
  marginRate: number;
  onChange: (v: number) => void;
  previewSubtotal: number;
  onNext: () => void;
  onBack: () => void;
}

export default function Step5Margin({ marginRate, onChange, previewSubtotal, onNext, onBack }: Props) {
  const marginAmount = Math.round(previewSubtotal * marginRate / 100);
  const total = previewSubtotal + marginAmount;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">마진 설정</h2>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">마진율 (%)</label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={0}
            max={200}
            value={marginRate}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-28 border border-gray-300 rounded-lg px-3 py-2 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-500">%</span>
        </div>
        <div className="flex gap-2 mt-2">
          {[0, 10, 20, 30, 50].map((v) => (
            <button
              key={v}
              onClick={() => onChange(v)}
              className={`px-3 py-1 rounded text-sm border ${marginRate === v ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 text-gray-600 hover:border-blue-400"}`}
            >
              {v}%
            </button>
          ))}
        </div>
      </div>
      {previewSubtotal > 0 && (
        <div className="p-4 bg-gray-50 rounded-xl border space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>원가 소계</span>
            <span>{previewSubtotal.toLocaleString()}원</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>마진 ({marginRate}%)</span>
            <span>+ {marginAmount.toLocaleString()}원</span>
          </div>
          <div className="flex justify-between font-bold text-lg text-blue-700 border-t pt-2">
            <span>최종 견적가</span>
            <span>{total.toLocaleString()}원</span>
          </div>
          <p className="text-xs text-gray-400">※ VAT 별도</p>
        </div>
      )}
      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 py-3 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">
          ← 이전
        </button>
        <button onClick={onNext} className="flex-1 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700">
          견적 확인 →
        </button>
      </div>
    </div>
  );
}
