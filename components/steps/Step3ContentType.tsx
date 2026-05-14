"use client";
import { ImageIcon, Video, Sparkles, Bot } from "lucide-react";
import type { ContentType } from "@/lib/types";

const OPTIONS: { value: ContentType; title: string; description: string; icon: React.ReactNode }[] = [
  { value: "image",    title: "이미지 제작",    description: "기존 사진·이미지 편집 및 합성",    icon: <ImageIcon size={22} /> },
  { value: "video",    title: "영상·모션 제작", description: "컷 편집, 모션그래픽, 특수효과",    icon: <Video size={22} /> },
  { value: "ai-image", title: "AI 이미지 생성", description: "Midjourney·Gemini로 이미지 생성", icon: <Sparkles size={22} /> },
  { value: "ai-video", title: "AI 영상 생성",   description: "AI 영상 생성 및 후보정",           icon: <Bot size={22} /> },
];

interface Props {
  value: ContentType[];
  onChange: (v: ContentType[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step3ContentType({ value, onChange, onNext, onBack }: Props) {
  const toggle = (t: ContentType) =>
    onChange(value.includes(t) ? value.filter(x => x !== t) : [...value, t]);

  return (
    <div className="w-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
      <div className="p-8 border-b border-slate-50 bg-slate-50/30">
        <h3 className="text-xl font-black text-slate-900 mb-1 tracking-tight">콘텐츠 유형</h3>
        <p className="text-sm text-slate-400 font-medium">필요한 작업을 모두 선택해주세요 (복수 선택 가능)</p>
      </div>
      <div className="p-8">
        <div className="divide-y divide-slate-50 border border-slate-100 rounded-2xl overflow-hidden">
          {OPTIONS.map(opt => {
            const selected = value.includes(opt.value);
            return (
              <label key={opt.value} className={`flex items-center p-5 transition-all hover:bg-slate-50 cursor-pointer ${selected ? "bg-blue-50/30" : ""}`}>
                <input type="checkbox" className="w-5 h-5 rounded accent-primary" checked={selected} onChange={() => toggle(opt.value)} />
                <div className="ml-5 flex items-center">
                  <div className="p-2 bg-blue-50 rounded-xl text-primary mr-4">{opt.icon}</div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{opt.title}</p>
                    <p className="text-[12px] text-slate-400">{opt.description}</p>
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </div>
      <div className="flex border-t border-slate-100 divide-x divide-slate-100">
        <button onClick={onBack} className="flex-1 py-5 bg-slate-50 text-slate-500 font-bold text-sm hover:bg-slate-100 transition-all">← 이전</button>
        <button onClick={onNext} disabled={value.length === 0} className="flex-1 py-5 bg-primary text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-40 transition-all">다음 →</button>
      </div>
    </div>
  );
}
