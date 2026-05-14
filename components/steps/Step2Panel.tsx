"use client";
import type { PanelInfo } from "@/lib/types";

interface Props {
  value: PanelInfo;
  onChange: (v: PanelInfo) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step2Panel({ value, onChange, onNext, onBack }: Props) {
  const valid = value.count > 0 && value.size.trim();
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-gray-800">패널 정보</h2>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">패널 수</label>
        <input
          type="number"
          min={1}
          value={value.count || ""}
          onChange={(e) => onChange({ ...value, count: Number(e.target.value) })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="예: 3"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">패널 사이즈 / 규격</label>
        <input
          type="text"
          value={value.size}
          onChange={(e) => onChange({ ...value, size: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="예: 55인치 / 1920×1080"
        />
      </div>
      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border">
        <input
          type="checkbox"
          id="videowall"
          checked={value.isVideoWall}
          onChange={(e) => onChange({ ...value, isVideoWall: e.target.checked })}
          className="w-4 h-4 accent-blue-600"
        />
        <label htmlFor="videowall" className="text-sm text-gray-700">
          <span className="font-semibold">비디오월</span> — 여러 패널을 하나처럼 동기화해서 보여주는 경우
        </label>
      </div>
      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 py-3 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">
          ← 이전
        </button>
        <button
          onClick={onNext}
          disabled={!valid}
          className="flex-1 py-3 rounded-lg bg-blue-600 text-white font-semibold disabled:opacity-40 hover:bg-blue-700"
        >
          다음 →
        </button>
      </div>
    </div>
  );
}
