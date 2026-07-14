"use client";
import { useState } from "react";
import { HelpCircle } from "lucide-react";

export default function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex items-center align-middle">
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(o => !o); }}
        className="ml-1 text-slate-300 hover:text-primary transition-colors"
        aria-label="설명 보기"
      >
        <HelpCircle size={13} />
      </button>
      {open && (
        <span className="absolute left-0 top-full mt-1 w-56 z-20 bg-slate-800 text-white text-[11px] leading-relaxed rounded-lg px-3 py-2 shadow-lg whitespace-normal">
          {text}
        </span>
      )}
    </span>
  );
}
