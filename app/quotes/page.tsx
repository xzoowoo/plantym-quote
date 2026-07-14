"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Trash2, Upload } from "lucide-react";
import { listSavedQuotes, deleteSavedQuote, setPendingLoad, type SavedQuote } from "@/lib/storage";
import { calculateQuote } from "@/lib/calculate";

const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(Math.round(n)) + "원";

export default function QuotesPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<SavedQuote[]>([]);

  useEffect(() => {
    setQuotes(listSavedQuotes());
  }, []);

  const handleLoad = (quote: SavedQuote) => {
    setPendingLoad(quote.input);
    router.push("/");
  };

  const handleDelete = (id: string) => {
    deleteSavedQuote(id);
    setQuotes(listSavedQuotes());
  };

  return (
    <div className="flex-1 p-12 flex flex-col items-center">
      <div className="w-full max-w-[900px]">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">견적 내역</h2>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">이 브라우저에 저장된 견적 목록</p>
        </div>

        {quotes.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-16 text-center text-sm text-slate-400">
            아직 저장된 견적이 없어요. 견적 결과 화면에서 &quot;견적 저장&quot;을 눌러보세요.
          </div>
        ) : (
          <div className="space-y-3">
            {quotes.map((quote) => {
              const result = calculateQuote(quote.input);
              return (
                <div key={quote.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-primary flex items-center justify-center shrink-0">
                      <FileText size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{quote.input.basicInfo.companyName || "업체명 미입력"} · {quote.input.basicInfo.projectName || "프로젝트명 미입력"}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {quote.input.basicInfo.date} 견적일 · {new Date(quote.savedAt).toLocaleString("ko-KR")} 저장
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <p className="text-sm font-black text-primary font-mono">{fmt(result.totalPrice)}</p>
                    <button onClick={() => handleLoad(quote)} className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-black transition-all">
                      <Upload size={13} />
                      <span>불러오기</span>
                    </button>
                    <button onClick={() => handleDelete(quote.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors" aria-label="삭제">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
