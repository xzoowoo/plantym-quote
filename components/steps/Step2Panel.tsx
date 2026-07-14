"use client";
import { ChevronRight, Monitor } from "lucide-react";
import type { PanelInfo } from "@/lib/types";

const SelectField = ({ label, value, onChange, options }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) => (
  <div className="space-y-2">
    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">{label}</label>
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-3.5 px-5 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/5 focus:border-primary/20 focus:bg-white transition-all outline-none appearance-none cursor-pointer"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" />
    </div>
  </div>
);

interface Props {
  value: PanelInfo;
  onChange: (v: PanelInfo) => void;
  onNext: () => void;
  onBack: () => void;
}

const SIZE_OPTIONS = [
  { value: "32인치", label: "32인치" },
  { value: "43인치", label: "43인치" },
  { value: "49인치", label: "49인치" },
  { value: "55인치", label: "55인치" },
  { value: "65인치", label: "65인치" },
  { value: "75인치", label: "75인치" },
  { value: "86인치", label: "86인치" },
  { value: "custom", label: "기타 사이즈" },
];

const PRESET_SIZES = SIZE_OPTIONS.filter(o => o.value !== "custom").map(o => o.value);

const RESOLUTION_OPTIONS = [
  { value: "hd", label: "1280×720 (HD)" },
  { value: "fhd", label: "1920×1080 (FHD)" },
  { value: "uhd", label: "3840×2160 (UHD/4K)" },
  { value: "custom", label: "기타 해상도" },
];

const PRESET_RESOLUTIONS = RESOLUTION_OPTIONS.filter(o => o.value !== "custom").map(o => o.value);

export default function Step2Panel({ value, onChange, onNext, onBack }: Props) {
  const valid = value.count > 0 && value.size.trim();
  const isCustomSize = value.size !== "" && !PRESET_SIZES.includes(value.size);
  const isCustomResolution = value.resolution !== "" && !PRESET_RESOLUTIONS.includes(value.resolution);

  return (
    <div className="w-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
      <div className="p-10 border-b border-slate-50 bg-slate-50/30">
        <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">패널 정보</h3>
        <p className="text-sm text-slate-400 font-medium">제작 대상 패널의 상세 정보를 입력해주세요.</p>
      </div>
      <div className="p-10 space-y-8">
        {/* 패널 수 + 사이즈 */}
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">패널 수</label>
            <input
              type="number"
              value={value.count || ""}
              onChange={e => onChange({ ...value, count: Number(e.target.value) })}
              className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-3.5 px-5 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/5 focus:border-primary/20 focus:bg-white transition-all outline-none"
            />
          </div>
          <div className="space-y-2">
            <SelectField
              label="패널 사이즈 (인치)"
              value={isCustomSize ? "custom" : value.size}
              onChange={v => onChange({ ...value, size: v === "custom" ? "" : v })}
              options={SIZE_OPTIONS}
            />
            {isCustomSize && (
              <input
                type="text"
                placeholder="예: 70인치"
                value={value.size}
                onChange={e => onChange({ ...value, size: e.target.value })}
                className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-3 px-4 text-sm font-bold text-slate-700 outline-none focus:border-primary/30 focus:bg-white transition-all"
              />
            )}
          </div>
        </div>

        {/* 방향 + 해상도 */}
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">패널 형태 (방향)</label>
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-2 rounded-2xl">
              {[
                { v: "horizontal", label: "가로형 (Landscape)" },
                { v: "vertical",   label: "세로형 (Portrait)" },
              ].map(({ v, label }) => (
                <button
                  key={v}
                  onClick={() => onChange({ ...value, orientation: v as "horizontal" | "vertical" })}
                  className={`py-3 rounded-xl text-[13px] font-bold border transition-all ${value.orientation === v ? "bg-white border-primary text-primary shadow-sm" : "bg-transparent border-transparent text-slate-500"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <SelectField
              label="패널 해상도 (규격)"
              value={isCustomResolution ? "custom" : value.resolution}
              onChange={v => onChange({ ...value, resolution: v === "custom" ? "" : v })}
              options={RESOLUTION_OPTIONS}
            />
            {isCustomResolution && (
              <input
                type="text"
                placeholder="예: 2560×1440"
                value={value.resolution}
                onChange={e => onChange({ ...value, resolution: e.target.value })}
                className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-3 px-4 text-sm font-bold text-slate-700 outline-none focus:border-primary/30 focus:bg-white transition-all"
              />
            )}
          </div>
        </div>

        {/* 비디오월 */}
        <label className="flex items-center space-x-4 p-5 bg-slate-50 rounded-2xl cursor-pointer hover:bg-slate-100 transition-colors">
          <input
            type="checkbox"
            className="w-5 h-5 rounded accent-primary"
            checked={value.isVideoWall}
            onChange={e => onChange({ ...value, isVideoWall: e.target.checked })}
          />
          <div className="flex items-center space-x-3">
            <Monitor size={20} className="text-primary" />
            <div>
              <span className="text-sm font-bold text-slate-700 block">비디오월 (Video Wall)</span>
              <span className="text-[11px] text-slate-400 font-medium">여러 패널을 하나처럼 동기화해서 보여주는 경우</span>
            </div>
          </div>
        </label>
      </div>
      <div className="flex border-t border-slate-100 divide-x divide-slate-100">
        <button onClick={onBack} className="flex-1 py-6 bg-slate-50 text-slate-500 font-bold text-sm flex items-center justify-center space-x-2 hover:bg-slate-100 transition-all">
          <span className="tracking-tighter uppercase">← 이전</span>
        </button>
        <button onClick={onNext} disabled={!valid} className="flex-1 py-6 bg-primary text-white font-bold text-sm flex items-center justify-center space-x-2 hover:bg-blue-700 disabled:opacity-40 transition-all">
          <span className="tracking-tighter uppercase">다음 →</span>
        </button>
      </div>
    </div>
  );
}
