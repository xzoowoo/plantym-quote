"use client";
import { Monitor } from "lucide-react";
import type { PanelInfo } from "@/lib/types";

const InputField = ({ label, type = "text", placeholder, value, onChange }: {
  label: string; type?: string; placeholder?: string; value: string; onChange: (v: string) => void;
}) => (
  <div className="space-y-2">
    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">{label}</label>
    <input type={type} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)}
      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 px-5 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/10 focus:border-primary/30 focus:bg-white transition-all outline-none" />
  </div>
);

interface Props {
  value: PanelInfo;
  onChange: (v: PanelInfo) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step2Panel({ value, onChange, onNext, onBack }: Props) {
  const valid = value.count > 0 && value.size.trim();

  return (
    <div className="w-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
      <div className="p-8 border-b border-slate-50 bg-slate-50/30">
        <h3 className="text-xl font-black text-slate-900 mb-1 tracking-tight">패널 정보</h3>
        <p className="text-sm text-slate-400 font-medium">제작 대상 패널의 상세 정보를 입력해주세요.</p>
      </div>
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <InputField label="패널 수" type="number" placeholder="예: 3" value={value.count ? String(value.count) : ""} onChange={v => onChange({ ...value, count: Number(v) })} />
          <InputField label="패널 사이즈 / 규격" placeholder="예: 55인치 / 1920×1080" value={value.size} onChange={v => onChange({ ...value, size: v })} />
        </div>
        <label className="flex items-center space-x-4 p-5 bg-slate-50 rounded-2xl cursor-pointer hover:bg-slate-100 transition-colors">
          <input type="checkbox" className="w-5 h-5 rounded accent-primary" checked={value.isVideoWall} onChange={e => onChange({ ...value, isVideoWall: e.target.checked })} />
          <div className="flex items-center space-x-3">
            <Monitor size={20} className="text-primary" />
            <div>
              <span className="text-sm font-bold text-slate-700 block">비디오월 (Video Wall)</span>
              <span className="text-[11px] text-slate-400">여러 패널을 하나처럼 동기화해서 보여주는 경우</span>
            </div>
          </div>
        </label>
      </div>
      <div className="flex border-t border-slate-100 divide-x divide-slate-100">
        <button onClick={onBack} className="flex-1 py-5 bg-slate-50 text-slate-500 font-bold text-sm hover:bg-slate-100 transition-all">← 이전</button>
        <button onClick={onNext} disabled={!valid} className="flex-1 py-5 bg-primary text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-40 transition-all">다음 →</button>
      </div>
    </div>
  );
}
