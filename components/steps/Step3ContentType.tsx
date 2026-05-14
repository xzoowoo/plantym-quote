"use client";
import type { ContentType } from "@/lib/types";

const OPTIONS: { value: ContentType; label: string; desc: string }[] = [
  { value: "image",    label: "이미지 제작",    desc: "기존 사진·이미지 편집 및 합성" },
  { value: "video",    label: "영상·모션 제작", desc: "컷 편집, 모션그래픽, 특수효과" },
  { value: "ai-image", label: "AI 이미지 생성", desc: "Midjourney·Gemini로 이미지 생성" },
  { value: "ai-video", label: "AI 영상 생성",   desc: "AI 영상 생성 및 후보정" },
];

interface Props {
  value: ContentType[];
  onChange: (v: ContentType[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step3ContentType({ value, onChange, onNext, onBack }: Props) {
  const toggle = (t: ContentType) =>
    onChange(value.includes(t) ? value.filter((x) => x !== t) : [...value, t]);

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-gray-800">콘텐츠 유형</h2>
      <p className="text-sm text-gray-500">필요한 작업을 모두 선택해주세요 (복수 선택 가능)</p>
      <div className="space-y-3">
        {OPTIONS.map((opt) => {
          const selected = value.includes(opt.value);
          return (
            <button
              key={opt.value}
              onClick={() => toggle(opt.value)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all
                ${selected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center
                  ${selected ? "border-blue-500 bg-blue-500" : "border-gray-300"}`}>
                  {selected && <span className="text-white text-xs font-bold">✓</span>}
                </div>
                <div>
                  <div className="font-semibold text-gray-800">{opt.label}</div>
                  <div className="text-xs text-gray-500">{opt.desc}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 py-3 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">
          ← 이전
        </button>
        <button
          onClick={onNext}
          disabled={value.length === 0}
          className="flex-1 py-3 rounded-lg bg-blue-600 text-white font-semibold disabled:opacity-40 hover:bg-blue-700"
        >
          다음 →
        </button>
      </div>
    </div>
  );
}
