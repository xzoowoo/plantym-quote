"use client";
import { useState } from "react";
import type { QuoteInput, QuoteResult } from "@/lib/types";
import QuoteTable from "@/components/QuoteTable";

interface Props {
  input: QuoteInput;
  result: QuoteResult;
  onBack: () => void;
  onReset: () => void;
}

export default function Step6Result({ input, result, onBack, onReset }: Props) {
  const [downloading, setDownloading] = useState(false);

  const downloadPDF = async () => {
    setDownloading(true);
    try {
      const res = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, result }),
      });
      const { base64 } = await res.json();
      const link = document.createElement("a");
      link.href = `data:application/pdf;base64,${base64}`;
      link.download = `견적서_${input.basicInfo.companyName}_${input.basicInfo.date}.pdf`;
      link.click();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">견적 결과 (내부용)</h2>
          <p className="text-sm text-gray-500">{input.basicInfo.companyName} · {input.basicInfo.projectName} · {input.basicInfo.date}</p>
        </div>
        <button
          onClick={downloadPDF}
          disabled={downloading}
          className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold disabled:opacity-40 hover:bg-green-700"
        >
          {downloading ? "생성 중..." : "📄 PDF 다운로드 (업체용)"}
        </button>
      </div>

      <QuoteTable result={result} />

      <div className="flex gap-3 pt-2">
        <button onClick={onBack} className="flex-1 py-3 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">
          ← 마진 수정
        </button>
        <button onClick={onReset} className="flex-1 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700">
          새 견적 작성
        </button>
      </div>
    </div>
  );
}
