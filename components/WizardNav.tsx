"use client";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

const STEPS = ["기본 정보", "패널 정보", "콘텐츠 유형", "세부 요청", "마진 설정", "견적 결과"];

export default function WizardNav({ current }: { current: number }) {
  return (
    <div className="w-full flex justify-between items-start relative px-4 py-6 mb-8">
      {/* 배경 라인 */}
      <div className="absolute top-[1.9rem] left-8 right-8 h-[2px] bg-slate-200 -z-10" />
      {/* 진행 라인 */}
      <motion.div
        className="absolute top-[1.9rem] left-8 h-[2px] bg-primary -z-10"
        initial={false}
        animate={{
          width: `${((current - 1) / (STEPS.length - 1)) * (100 - 8)}%`,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      />
      {STEPS.map((label, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;
        return (
          <div key={step} className="flex flex-col items-center relative z-10">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300
                ${done ? "bg-primary border-primary text-white" : active ? "bg-white border-primary text-primary shadow-lg shadow-blue-100 scale-110" : "bg-white border-slate-200 text-slate-400"}`}
            >
              {done ? <Check size={16} strokeWidth={3} /> : step}
            </div>
            <span className={`text-[11px] font-black mt-2 tracking-tight whitespace-nowrap ${active ? "text-primary" : "text-slate-400"}`}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
