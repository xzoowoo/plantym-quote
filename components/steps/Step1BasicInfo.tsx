"use client";
import type { BasicInfo } from "@/lib/types";

const InputField = ({ label, type = "text", placeholder, value, onChange }: {
  label: string; type?: string; placeholder?: string; value: string; onChange: (v: string) => void;
}) => (
  <div className="space-y-2">
    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">{label}</label>
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-3.5 px-5 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/10 focus:border-primary/30 focus:bg-white transition-all outline-none"
    />
  </div>
);

interface Props {
  value: BasicInfo;
  onChange: (v: BasicInfo) => void;
  onNext: () => void;
}

export default function Step1BasicInfo({ value, onChange, onNext }: Props) {
  const valid = value.companyName && value.contactName && value.projectName && value.date;

  return (
    <div className="w-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
      <div className="p-10 border-b border-slate-50 bg-slate-50/30">
        <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">기본 정보</h3>
        <p className="text-sm text-slate-400 font-medium">견적서에 표시될 기본 정보를 입력해주세요.</p>
      </div>
      <div className="p-10">
        <div className="grid grid-cols-2 gap-8">
          <InputField label="업체명" placeholder="예: (주)플랜티엠" value={value.companyName} onChange={v => onChange({ ...value, companyName: v })} />
          <InputField label="담당자명" placeholder="예: 홍길동" value={value.contactName} onChange={v => onChange({ ...value, contactName: v })} />
          <InputField label="프로젝트명" placeholder="예: 매장 디지털 사이니지" value={value.projectName} onChange={v => onChange({ ...value, projectName: v })} />
          <InputField label="견적일" type="date" value={value.date} onChange={v => onChange({ ...value, date: v })} />
        </div>
      </div>
      <div className="border-t border-slate-100">
        <button
          onClick={onNext}
          disabled={!valid}
          className="w-full py-6 bg-primary text-white font-bold text-sm tracking-tighter uppercase hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          다음 →
        </button>
      </div>
    </div>
  );
}
