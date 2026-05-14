"use client";
import { Minus, Plus } from "lucide-react";
import type { ImageDetails, VideoDetails, AIImageDetails, AIVideoDetails, ContentType, EffectLevel, ImageTask } from "@/lib/types";

interface Props {
  contentTypes: ContentType[];
  imageDetails: ImageDetails;
  videoDetails: VideoDetails;
  aiImageDetails: AIImageDetails;
  aiVideoDetails: AIVideoDetails;
  freeText: string;
  onChangeImage: (v: ImageDetails) => void;
  onChangeVideo: (v: VideoDetails) => void;
  onChangeAIImage: (v: AIImageDetails) => void;
  onChangeAIVideo: (v: AIVideoDetails) => void;
  onChangeFreeText: (v: string) => void;
  onAIAnalyze: () => void;
  aiLoading: boolean;
  onNext: () => void;
  onBack: () => void;
}

function CounterRow({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl">
      <span className="text-[13px] text-slate-700 font-bold">{label}</span>
      <div className="flex items-center space-x-2">
        <button onClick={() => onChange(Math.max(0, value - 1))} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-400 hover:text-primary transition-all">
          <Minus size={12} strokeWidth={4} />
        </button>
        <div className="flex items-center space-x-1 min-w-[3rem] justify-center bg-slate-100 rounded-lg px-2 py-1">
          <input
            type="number"
            className="w-8 bg-transparent text-[14px] font-black text-slate-700 text-center outline-none border-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            value={value}
            onChange={e => onChange(Math.max(0, Number(e.target.value)))}
          />
        </div>
        <button onClick={() => onChange(value + 1)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-400 hover:text-primary transition-all">
          <Plus size={12} strokeWidth={4} />
        </button>
      </div>
    </div>
  );
}

function EffectRow({ label, value, count, onChange, onCountChange }: {
  label: string; value: EffectLevel; count: number;
  onChange: (v: EffectLevel) => void; onCountChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl">
      <span className="text-[13px] text-slate-700 font-bold w-20 shrink-0">{label}</span>
      <div className="flex items-center space-x-4">
        {value !== "none" && (
          <div className="flex items-center space-x-1">
            <button onClick={() => onCountChange(Math.max(0, count - 1))} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-400 hover:text-primary transition-all">
              <Minus size={10} strokeWidth={4} />
            </button>
            <div className="flex items-center min-w-[2.5rem] justify-center bg-slate-100 rounded-lg px-1 py-0.5">
              <input type="number" className="w-7 bg-transparent text-[12px] font-black text-slate-700 text-center outline-none border-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                value={count} onChange={e => onCountChange(Math.max(0, Number(e.target.value)))} />
              <span className="text-[10px] font-bold text-slate-300 ml-0.5">건</span>
            </div>
            <button onClick={() => onCountChange(count + 1)} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-400 hover:text-primary transition-all">
              <Plus size={10} strokeWidth={4} />
            </button>
          </div>
        )}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          {(["none", "basic", "advanced"] as EffectLevel[]).map(lv => (
            <button key={lv}
              className={`px-4 py-1.5 rounded-lg text-[11px] font-black transition-all ${value === lv ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-500"}`}
              onClick={() => onChange(lv)}
            >
              {lv === "none" ? "없음" : lv === "basic" ? "기본" : "고급"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const IMAGE_TASKS: { value: ImageTask; label: string }[] = [
  { value: "resize",         label: "사이즈/비율 변경" },
  { value: "remove-bg",      label: "배경 제거(누끼)" },
  { value: "separate",       label: "소스 분리(레이어)" },
  { value: "reposition",     label: "비율 재배치(가로↔세로)" },
  { value: "composite",      label: "합성" },
  { value: "text",           label: "텍스트 추가" },
  { value: "design-element", label: "디자인 요소 추가" },
];

export default function Step4Details({
  contentTypes, imageDetails, videoDetails, aiImageDetails, aiVideoDetails,
  freeText, onChangeImage, onChangeVideo, onChangeAIImage, onChangeAIVideo,
  onChangeFreeText, onAIAnalyze, aiLoading, onNext, onBack,
}: Props) {
  const toggleImageTask = (t: ImageTask) => {
    const tasks = imageDetails.tasks.includes(t) ? imageDetails.tasks.filter(x => x !== t) : [...imageDetails.tasks, t];
    onChangeImage({ ...imageDetails, tasks });
  };

  return (
    <div className="w-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
      <div className="p-8 border-b border-slate-50 bg-slate-50/30">
        <h3 className="text-xl font-black text-slate-900 mb-1 tracking-tight">세부 요청사항</h3>
        <p className="text-sm text-slate-400 font-medium">선택한 유형별로 구체적인 작업 내용을 설정합니다.</p>
      </div>
      <div className="p-8 space-y-8">

        {/* 이미지 제작 */}
        {contentTypes.includes("image") && (
          <div className="space-y-5">
            <h4 className="text-sm font-black text-primary border-b-2 border-primary w-fit pb-1">이미지 제작</h4>
            <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
              {[
                { v: true,  label: "이미지 보유 있음" },
                { v: false, label: "이미지 제작 필요 (리서치 포함)" },
              ].map(({ v, label }) => (
                <button key={String(v)} onClick={() => onChangeImage({ ...imageDetails, hasSource: v })}
                  className={`flex-1 py-2.5 rounded-xl text-[12px] font-bold transition-all ${imageDetails.hasSource === v ? "bg-white text-primary shadow-sm" : "text-slate-400"}`}>
                  {label}
                </button>
              ))}
            </div>
            <CounterRow label="총 이미지 수 (장)" value={imageDetails.imageCount} onChange={n => onChangeImage({ ...imageDetails, imageCount: n })} />
            <div>
              <p className="text-[11px] font-black text-slate-400 uppercase mb-3">필요한 편집 작업 (복수 선택)</p>
              <div className="grid grid-cols-2 gap-2">
                {IMAGE_TASKS.map(({ value: t, label }) => (
                  <label key={t} className="flex items-center space-x-2 text-[13px] text-slate-600 cursor-pointer p-2 hover:bg-slate-50 rounded-xl">
                    <input type="checkbox" className="w-4 h-4 rounded accent-primary" checked={imageDetails.tasks.includes(t)} onChange={() => toggleImageTask(t)} />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 영상·모션 */}
        {contentTypes.includes("video") && (
          <div className="space-y-5 pt-6 border-t border-slate-100">
            <h4 className="text-sm font-black text-primary border-b-2 border-primary w-fit pb-1">영상·모션 제작</h4>
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">영상 길이 (초)</label>
              <input type="number" placeholder="예: 30" value={videoDetails.durationSeconds || ""}
                onChange={e => onChangeVideo({ ...videoDetails, durationSeconds: Number(e.target.value) })}
                className="w-40 bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-4 text-sm font-bold text-slate-700 outline-none focus:border-primary/30 focus:bg-white transition-all" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: "cutEdit",    label: "컷 편집" },
                { key: "subtitle",   label: "자막 삽입" },
                { key: "usbConvert", label: "USB 변환 (LG 패널용)" },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center space-x-2 text-[13px] text-slate-600 cursor-pointer p-2 hover:bg-slate-50 rounded-xl">
                  <input type="checkbox" className="w-4 h-4 rounded accent-primary"
                    checked={videoDetails[key as keyof VideoDetails] as boolean}
                    onChange={e => onChangeVideo({ ...videoDetails, [key]: e.target.checked })} />
                  <span>{label}</span>
                </label>
              ))}
              <label className="flex items-center space-x-2 text-[13px] text-slate-600 cursor-pointer p-2 hover:bg-slate-50 rounded-xl col-span-2">
                <input type="checkbox" className="w-4 h-4 rounded accent-primary" checked={videoDetails.rolling}
                  onChange={e => onChangeVideo({ ...videoDetails, rolling: e.target.checked })} />
                <span>이미지/영상 롤링</span>
                {videoDetails.rolling && (
                  <input type="number" placeholder="장수" value={videoDetails.rollingCount || ""}
                    onChange={e => onChangeVideo({ ...videoDetails, rollingCount: Number(e.target.value) })}
                    className="w-16 bg-slate-100 rounded-lg px-2 py-1 text-xs font-bold outline-none ml-2" />
                )}
              </label>
            </div>
            <div className="space-y-2">
              <p className="text-[11px] font-black text-slate-400 uppercase">모션 효과</p>
              {[
                { label: "화면전환", key: "transition", countKey: "transitionCount" },
                { label: "등장효과", key: "entrance",   countKey: "entranceCount" },
                { label: "강조효과", key: "emphasis",   countKey: "emphasisCount" },
                { label: "특수효과", key: "special",    countKey: "specialCount" },
                { label: "애니메이션", key: "animation", countKey: "animationCount" },
              ].map(({ label, key, countKey }) => (
                <EffectRow key={key} label={label}
                  value={videoDetails[key as keyof VideoDetails] as EffectLevel}
                  count={videoDetails[countKey as keyof VideoDetails] as number}
                  onChange={v => onChangeVideo({ ...videoDetails, [key]: v })}
                  onCountChange={n => onChangeVideo({ ...videoDetails, [countKey]: n })}
                />
              ))}
            </div>
            <div>
              <p className="text-[11px] font-black text-slate-400 uppercase mb-2">출력 품질</p>
              <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
                {[{ v: "fhd", label: "Full HD" }, { v: "4k", label: "4K 이상" }].map(({ v, label }) => (
                  <button key={v} onClick={() => onChangeVideo({ ...videoDetails, renderQuality: v as "fhd" | "4k" })}
                    className={`px-6 py-2 rounded-lg text-[12px] font-black transition-all ${videoDetails.renderQuality === v ? "bg-white text-primary shadow-sm" : "text-slate-400"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* AI 이미지 */}
        {contentTypes.includes("ai-image") && (
          <div className="space-y-5 pt-6 border-t border-slate-100">
            <h4 className="text-sm font-black text-primary border-b-2 border-primary w-fit pb-1">AI 이미지 생성</h4>
            <CounterRow label="생성 건수" value={aiImageDetails.count} onChange={n => onChangeAIImage({ count: n })} />
          </div>
        )}

        {/* AI 영상 */}
        {contentTypes.includes("ai-video") && (
          <div className="space-y-5 pt-6 border-t border-slate-100">
            <h4 className="text-sm font-black text-primary border-b-2 border-primary w-fit pb-1">AI 영상 생성</h4>
            <CounterRow label="생성 건수" value={aiVideoDetails.count} onChange={n => onChangeAIVideo({ count: n })} />
          </div>
        )}

        {/* 자유 입력 + AI 분석 */}
        <div className="space-y-4 pt-6 border-t border-slate-100">
          <div>
            <p className="text-[11px] font-black text-slate-400 uppercase mb-1">추가 요청사항 (자유 입력)</p>
            <p className="text-[11px] text-slate-400 mb-3">입력 후 AI 분석 버튼을 누르면 항목이 자동으로 추가됩니다.</p>
          </div>
          <textarea value={freeText} onChange={e => onChangeFreeText(e.target.value)} rows={3}
            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:border-primary/30 focus:bg-white transition-all resize-none"
            placeholder="예: 제품 등장할 때 빛 번지는 효과, 배경 자연스럽게 바뀌는 효과, 로고 애니메이션..." />
          <button onClick={onAIAnalyze} disabled={!freeText.trim() || aiLoading}
            className="px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold disabled:opacity-40 hover:bg-violet-700 transition-all">
            {aiLoading ? "AI 분석 중..." : "🤖 AI로 항목 분석하기"}
          </button>
        </div>
      </div>
      <div className="flex border-t border-slate-100 divide-x divide-slate-100">
        <button onClick={onBack} className="flex-1 py-5 bg-slate-50 text-slate-500 font-bold text-sm hover:bg-slate-100 transition-all">← 이전</button>
        <button onClick={onNext} className="flex-1 py-5 bg-primary text-white font-bold text-sm hover:bg-blue-700 transition-all">다음 →</button>
      </div>
    </div>
  );
}
