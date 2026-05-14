"use client";
import type { BasicInfo } from "@/lib/types";

interface Props {
  value: BasicInfo;
  onChange: (v: BasicInfo) => void;
  onNext: () => void;
}

export default function Step1BasicInfo({ value, onChange, onNext }: Props) {
  const set = (k: keyof BasicInfo) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, [k]: e.target.value });

  const valid = value.companyName && value.contactName && value.projectName && value.date;

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-gray-800">기본 정보</h2>
      {(
        [
          { key: "companyName" as keyof BasicInfo, label: "업체명", placeholder: "예: (주)플랜티엠", type: "text" },
          { key: "contactName" as keyof BasicInfo, label: "담당자명", placeholder: "예: 홍길동", type: "text" },
          { key: "projectName" as keyof BasicInfo, label: "프로젝트명", placeholder: "예: 매장 디지털 사이니지", type: "text" },
          { key: "date" as keyof BasicInfo, label: "견적일", placeholder: "", type: "date" },
        ]
      ).map(({ key, label, placeholder, type }) => (
        <div key={key}>
          <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
          <input
            type={type}
            value={value[key]}
            onChange={set(key)}
            placeholder={placeholder}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      ))}
      <button
        onClick={onNext}
        disabled={!valid}
        className="w-full py-3 rounded-lg bg-blue-600 text-white font-semibold disabled:opacity-40 hover:bg-blue-700"
      >
        다음 →
      </button>
    </div>
  );
}
