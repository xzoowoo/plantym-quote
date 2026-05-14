"use client";
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

function EffectRow({
  label, value, count, onChange, onCountChange,
}: {
  label: string; value: EffectLevel; count: number;
  onChange: (v: EffectLevel) => void; onCountChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-24 text-gray-700 shrink-0">{label}</span>
      {(["none", "basic", "advanced"] as EffectLevel[]).map((lvl) => (
        <button
          key={lvl}
          onClick={() => onChange(lvl)}
          className={`px-2 py-1 rounded text-xs border ${value === lvl ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 text-gray-600 hover:border-blue-400"}`}
        >
          {lvl === "none" ? "없음" : lvl === "basic" ? "기본" : "고급"}
        </button>
      ))}
      {value !== "none" && (
        <input
          type="number"
          min={1}
          value={count || ""}
          onChange={(e) => onCountChange(Number(e.target.value))}
          className="w-16 border border-gray-300 rounded px-2 py-1 text-xs"
          placeholder="건수"
        />
      )}
    </div>
  );
}

export default function Step4Details({
  contentTypes, imageDetails, videoDetails, aiImageDetails, aiVideoDetails,
  freeText, onChangeImage, onChangeVideo, onChangeAIImage, onChangeAIVideo,
  onChangeFreeText, onAIAnalyze, aiLoading, onNext, onBack,
}: Props) {
  const IMAGE_TASKS: { value: ImageTask; label: string }[] = [
    { value: "resize",         label: "사이즈/비율 변경" },
    { value: "remove-bg",      label: "배경 제거(누끼)" },
    { value: "separate",       label: "소스 분리(레이어)" },
    { value: "reposition",     label: "비율 재배치(가로↔세로)" },
    { value: "composite",      label: "합성" },
    { value: "text",           label: "텍스트 추가" },
    { value: "design-element", label: "디자인 요소 추가" },
  ];

  const toggleImageTask = (t: ImageTask) => {
    const tasks = imageDetails.tasks.includes(t)
      ? imageDetails.tasks.filter((x) => x !== t)
      : [...imageDetails.tasks, t];
    onChangeImage({ ...imageDetails, tasks });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">세부 요청사항</h2>

      {contentTypes.includes("image") && (
        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 space-y-4">
          <h3 className="font-semibold text-blue-800">이미지 제작</h3>
          <div className="flex gap-3">
            {[
              { v: true,  label: "이미지 보유 있음" },
              { v: false, label: "이미지 제작 필요 (리서치 포함)" },
            ].map(({ v, label }) => (
              <button
                key={String(v)}
                onClick={() => onChangeImage({ ...imageDetails, hasSource: v })}
                className={`flex-1 py-2 rounded-lg text-sm border-2 ${imageDetails.hasSource === v ? "border-blue-500 bg-white font-semibold" : "border-gray-200 text-gray-500"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">총 이미지 수</label>
            <input
              type="number"
              min={1}
              value={imageDetails.imageCount || ""}
              onChange={(e) => onChangeImage({ ...imageDetails, imageCount: Number(e.target.value) })}
              className="w-32 border border-gray-300 rounded px-3 py-1.5 text-sm"
              placeholder="예: 5"
            />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">필요한 편집 작업 (복수 선택)</div>
            <div className="grid grid-cols-2 gap-2">
              {IMAGE_TASKS.map(({ value: t, label }) => (
                <button
                  key={t}
                  onClick={() => toggleImageTask(t)}
                  className={`text-left px-3 py-2 rounded-lg text-sm border ${imageDetails.tasks.includes(t) ? "border-blue-500 bg-blue-50 font-medium" : "border-gray-200 text-gray-600"}`}
                >
                  {imageDetails.tasks.includes(t) ? "✓ " : ""}{label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {contentTypes.includes("video") && (
        <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 space-y-4">
          <h3 className="font-semibold text-orange-800">영상·모션 제작</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">영상 길이 (초)</label>
            <input
              type="number"
              min={1}
              value={videoDetails.durationSeconds || ""}
              onChange={(e) => onChangeVideo({ ...videoDetails, durationSeconds: Number(e.target.value) })}
              className="w-32 border border-gray-300 rounded px-3 py-1.5 text-sm"
              placeholder="예: 30"
            />
          </div>
          <div className="space-y-2">
            {[
              { key: "cutEdit",    label: "컷 편집" },
              { key: "subtitle",   label: "자막 삽입" },
              { key: "usbConvert", label: "USB 변환 필요 (LG 패널용)" },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={videoDetails[key as keyof VideoDetails] as boolean}
                  onChange={(e) => onChangeVideo({ ...videoDetails, [key]: e.target.checked })}
                  className="w-4 h-4 accent-blue-600"
                />
                {label}
              </label>
            ))}
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={videoDetails.rolling}
                onChange={(e) => onChangeVideo({ ...videoDetails, rolling: e.target.checked })}
                className="w-4 h-4 accent-blue-600"
              />
              이미지/영상 롤링 (순서대로 넘기기)
              {videoDetails.rolling && (
                <input
                  type="number"
                  min={1}
                  value={videoDetails.rollingCount || ""}
                  onChange={(e) => onChangeVideo({ ...videoDetails, rollingCount: Number(e.target.value) })}
                  className="w-16 border border-gray-300 rounded px-2 py-0.5 text-xs ml-1"
                  placeholder="장수"
                />
              )}
            </label>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">모션 효과</div>
            {[
              { label: "화면전환", key: "transition", countKey: "transitionCount" },
              { label: "등장효과", key: "entrance",   countKey: "entranceCount" },
              { label: "강조효과", key: "emphasis",   countKey: "emphasisCount" },
              { label: "특수효과", key: "special",    countKey: "specialCount" },
              { label: "애니메이션", key: "animation", countKey: "animationCount" },
            ].map(({ label, key, countKey }) => (
              <EffectRow
                key={key}
                label={label}
                value={videoDetails[key as keyof VideoDetails] as EffectLevel}
                count={videoDetails[countKey as keyof VideoDetails] as number}
                onChange={(v) => onChangeVideo({ ...videoDetails, [key]: v })}
                onCountChange={(n) => onChangeVideo({ ...videoDetails, [countKey]: n })}
              />
            ))}
          </div>
          <div>
            <div className="text-sm font-medium text-gray-700 mb-1">출력 품질</div>
            <div className="flex gap-2">
              {[
                { v: "fhd", label: "Full HD" },
                { v: "4k",  label: "4K 이상" },
              ].map(({ v, label }) => (
                <button
                  key={v}
                  onClick={() => onChangeVideo({ ...videoDetails, renderQuality: v as "fhd" | "4k" })}
                  className={`px-4 py-1.5 rounded-lg text-sm border-2 ${videoDetails.renderQuality === v ? "border-blue-500 bg-blue-50 font-semibold" : "border-gray-200 text-gray-500"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {contentTypes.includes("ai-image") && (
        <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 space-y-3">
          <h3 className="font-semibold text-purple-800">AI 이미지 생성</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">생성 건수</label>
            <input
              type="number"
              min={1}
              value={aiImageDetails.count || ""}
              onChange={(e) => onChangeAIImage({ count: Number(e.target.value) })}
              className="w-32 border border-gray-300 rounded px-3 py-1.5 text-sm"
              placeholder="예: 3"
            />
          </div>
        </div>
      )}

      {contentTypes.includes("ai-video") && (
        <div className="p-4 bg-pink-50 rounded-xl border border-pink-100 space-y-3">
          <h3 className="font-semibold text-pink-800">AI 영상 생성</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">생성 건수</label>
            <input
              type="number"
              min={1}
              value={aiVideoDetails.count || ""}
              onChange={(e) => onChangeAIVideo({ count: Number(e.target.value) })}
              className="w-32 border border-gray-300 rounded px-3 py-1.5 text-sm"
              placeholder="예: 2"
            />
          </div>
        </div>
      )}

      <div className="p-4 bg-gray-50 rounded-xl border space-y-3">
        <h3 className="font-semibold text-gray-800">추가 요청사항 <span className="text-sm font-normal text-gray-500">(자유 입력 → AI가 항목 자동 분석)</span></h3>
        <textarea
          value={freeText}
          onChange={(e) => onChangeFreeText(e.target.value)}
          rows={4}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="예: 제품 등장할 때 빛 번지는 효과 넣고 싶고, 배경은 자연스럽게 바뀌었으면 해요. 영상 끝에 로고 애니메이션도 넣어주세요."
        />
        <button
          onClick={onAIAnalyze}
          disabled={!freeText.trim() || aiLoading}
          className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-semibold disabled:opacity-40 hover:bg-purple-700"
        >
          {aiLoading ? "AI 분석 중..." : "🤖 AI로 항목 분석하기"}
        </button>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 py-3 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">
          ← 이전
        </button>
        <button onClick={onNext} className="flex-1 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700">
          다음 →
        </button>
      </div>
    </div>
  );
}
