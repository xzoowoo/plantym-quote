"use client";

interface Props {
  marginRate: number;
  onChange: (v: number) => void;
  expectedScheduleDays?: number;
  onChangeSchedule: (v: number | undefined) => void;
  previewSubtotal: number;
  onNext: () => void;
  onBack: () => void;
}

const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(Math.round(n)) + "원";

export default function Step5Margin({ marginRate, onChange, expectedScheduleDays, onChangeSchedule, previewSubtotal, onNext, onBack }: Props) {
  const marginAmount = Math.round(previewSubtotal * marginRate / 100);
  const total = previewSubtotal + marginAmount;

  return (
    <div className="w-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
      <div className="p-10 border-b border-slate-50 bg-slate-50/30">
        <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">마진 설정</h3>
        <p className="text-sm text-slate-400 font-medium">프로젝트의 마진율을 설정하여 최종 견적가를 산출합니다.</p>
      </div>
      <div className="p-10 space-y-8">
        <div>
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 block">마진율 (%)</label>
          <div className="flex items-center space-x-6">
            <input type="range" min={0} max={100} step={5} value={marginRate} onChange={e => onChange(Number(e.target.value))} className="flex-1 accent-primary" />
            <div className="w-20 bg-blue-50 text-primary text-center py-2 rounded-xl font-black text-xl ring-2 ring-blue-100">{marginRate}%</div>
          </div>
          <div className="flex space-x-2 mt-4">
            {[0, 10, 20, 30, 50].map(m => (
              <button key={m} onClick={() => onChange(m)}
                className={`px-4 py-1.5 rounded-lg text-[12px] font-bold transition-all ${marginRate === m ? "bg-primary text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                {m}%
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 block">예상 제작일정 (선택, 워크데이 기준)</label>
          <div className="flex items-center space-x-3">
            <input
              type="number"
              min={0}
              placeholder="예: 10"
              value={expectedScheduleDays ?? ""}
              onChange={e => {
                const v = e.target.value;
                onChangeSchedule(v === "" ? undefined : Number(v));
              }}
              className="w-32 border border-slate-200 rounded-xl px-4 py-2 text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <span className="text-sm text-slate-400 font-medium">일</span>
          </div>
          <p className="text-[12px] text-slate-400 mt-2">참고용으로만 기재되며, 항목별 금액에는 영향을 주지 않습니다.</p>
        </div>

        {previewSubtotal > 0 && (
          <div className="bg-slate-900 rounded-2xl p-8 text-white space-y-4">
            <div className="flex justify-between text-slate-400 text-sm">
              <span>공급 원가 (Subtotal)</span>
              <span className="font-mono">{fmt(previewSubtotal)}</span>
            </div>
            <div className="flex justify-between text-blue-400 text-sm font-bold">
              <span>마진 ({marginRate}%)</span>
              <span className="font-mono">+ {fmt(marginAmount)}</span>
            </div>
            <div className="h-px bg-slate-800" />
            <div className="flex justify-between items-end">
              <span className="text-lg font-bold">최종 제작가</span>
              <div className="text-right">
                <p className="text-3xl font-black font-mono leading-none">{fmt(total)}</p>
                <p className="text-[11px] text-slate-500 mt-1">※ VAT 별도</p>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="flex border-t border-slate-100 divide-x divide-slate-100">
        <button onClick={onBack} className="flex-1 py-6 bg-slate-50 text-slate-500 font-bold text-sm tracking-tighter uppercase hover:bg-slate-100 transition-all">← 이전</button>
        <button onClick={onNext} className="flex-1 py-6 bg-primary text-white font-bold text-sm tracking-tighter uppercase hover:bg-blue-700 transition-all">견적 확인 →</button>
      </div>
    </div>
  );
}
