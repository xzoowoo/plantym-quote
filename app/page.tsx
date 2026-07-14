"use client";
import { useState, useEffect } from "react";
import { Info, ShieldCheck } from "lucide-react";
import WizardNav from "@/components/WizardNav";
import Step1BasicInfo from "@/components/steps/Step1BasicInfo";
import Step2Panel from "@/components/steps/Step2Panel";
import Step3ContentType from "@/components/steps/Step3ContentType";
import Step4Details from "@/components/steps/Step4Details";
import Step5Margin from "@/components/steps/Step5Margin";
import Step6Result from "@/components/steps/Step6Result";
import { calculateQuote } from "@/lib/calculate";
import { consumePendingLoad } from "@/lib/storage";
import type { QuoteInput, QuoteResult } from "@/lib/types";

const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(Math.round(n)) + "원";

const INITIAL_INPUT: QuoteInput = {
  basicInfo: { companyName: "", contactName: "", projectName: "", date: new Date().toISOString().slice(0, 10) },
  panelInfo: { count: 1, size: "55인치", orientation: "horizontal", resolution: "fhd", isVideoWall: false },
  contentTypes: [],
  imageDetails: { hasSource: true, imageCount: 0, tasks: [] },
  videoDetails: {
    durationSeconds: 0, cutEdit: false, subtitle: false,
    rolling: false, rollingCount: 0,
    transition: "none", transitionCount: 0,
    entrance: "none", entranceCount: 0,
    emphasis: "none", emphasisCount: 0,
    special: "none", specialCount: 0,
    animation: "none", animationCount: 0,
    renderQuality: "fhd", usbConvert: false,
  },
  aiImageDetails: { count: 0 },
  aiVideoDetails: { count: 0 },
  freeText: "",
  marginRate: 0,
};

const InfoCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-start space-x-4">
    <div className="shrink-0 p-3 bg-blue-50 rounded-xl text-primary">{icon}</div>
    <div>
      <h4 className="text-sm font-bold text-slate-900 mb-1">{title}</h4>
      <p className="text-[12px] leading-relaxed text-slate-500">{description}</p>
    </div>
  </div>
);

export default function Page() {
  const [step, setStep] = useState(1);
  const [input, setInput] = useState<QuoteInput>(INITIAL_INPUT);
  const [result, setResult] = useState<QuoteResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const pending = consumePendingLoad();
    if (pending) {
      setInput(pending);
      setResult(calculateQuote(pending));
      setStep(6);
    }
  }, []);

  const handleNext = () => {
    if (step === 5) {
      setResult(calculateQuote(input));
    }
    setStep((s) => s + 1);
  };

  const handleAIAnalyze = async () => {
    if (!input.freeText.trim()) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input.freeText, contentTypes: input.contentTypes }),
      });
      const data = await res.json();
      if (data.updates) {
        setInput((prev) => ({ ...prev, ...data.updates }));
      }
    } finally {
      setAiLoading(false);
    }
  };

  const previewSubtotal = calculateQuote(input).costSubtotal;

  const resolutionLabel: Record<string, string> = {
    hd: "HD", fhd: "FHD", uhd: "4K/UHD",
  };

  return (
    <div className="flex-1 p-12 flex flex-col items-center">
      {/* 제목 */}
      <div className="text-center mb-10">
        <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">영상 제작 견적 생성기</h2>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">플랜티엠 콘텐츠 제작 단가 기준</p>
      </div>

      {/* 진행 바 */}
      <div className="w-full max-w-4xl mb-10">
        <WizardNav current={step} />
      </div>

      {/* 다크 요약 바 (스텝 6) */}
      {step === 6 && result && (
        <div className="w-full max-w-[900px] mb-6">
          <div className="bg-slate-900 rounded-2xl p-6 text-white flex justify-between items-center shadow-lg">
            <div className="flex items-center space-x-6 divide-x divide-slate-800">
              <div className="px-4 first:pl-0">
                <p className="text-[10px] text-slate-500 uppercase font-black mb-1">패널 규모</p>
                <p className="text-sm font-bold">{input.panelInfo.count}대 / {input.panelInfo.size}</p>
              </div>
              <div className="px-4">
                <p className="text-[10px] text-slate-500 uppercase font-black mb-1">해상도 / 방향</p>
                <p className="text-sm font-bold uppercase">{resolutionLabel[input.panelInfo.resolution] ?? input.panelInfo.resolution} / {input.panelInfo.orientation === "horizontal" ? "가로" : "세로"}</p>
              </div>
              <div className="px-4">
                <p className="text-[10px] text-slate-500 uppercase font-black mb-1">콘텐츠</p>
                <p className="text-sm font-bold">{input.contentTypes.length}개 유형 선택됨</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-blue-400 uppercase font-black mb-1">최종 제작가 (VAT 별도)</p>
              <p className="text-2xl font-black font-mono text-white">{fmt(result.totalPrice)}</p>
            </div>
          </div>
        </div>
      )}

      {/* 스텝 콘텐츠 */}
      <div className="w-full max-w-[900px] mb-12">
        {step === 1 && (
          <Step1BasicInfo
            value={input.basicInfo}
            onChange={(v) => setInput({ ...input, basicInfo: v })}
            onNext={handleNext}
          />
        )}
        {step === 2 && (
          <Step2Panel
            value={input.panelInfo}
            onChange={(v) => setInput({ ...input, panelInfo: v })}
            onNext={handleNext}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <Step3ContentType
            value={input.contentTypes}
            onChange={(v) => setInput({ ...input, contentTypes: v })}
            onNext={handleNext}
            onBack={() => setStep(2)}
          />
        )}
        {step === 4 && (
          <Step4Details
            contentTypes={input.contentTypes}
            imageDetails={input.imageDetails}
            videoDetails={input.videoDetails}
            aiImageDetails={input.aiImageDetails}
            aiVideoDetails={input.aiVideoDetails}
            freeText={input.freeText}
            onChangeImage={(v) => setInput({ ...input, imageDetails: v })}
            onChangeVideo={(v) => setInput({ ...input, videoDetails: v })}
            onChangeAIImage={(v) => setInput({ ...input, aiImageDetails: v })}
            onChangeAIVideo={(v) => setInput({ ...input, aiVideoDetails: v })}
            onChangeFreeText={(v) => setInput({ ...input, freeText: v })}
            onAIAnalyze={handleAIAnalyze}
            aiLoading={aiLoading}
            onNext={handleNext}
            onBack={() => setStep(3)}
          />
        )}
        {step === 5 && (
          <Step5Margin
            marginRate={input.marginRate}
            onChange={(v) => setInput({ ...input, marginRate: v })}
            expectedScheduleDays={input.expectedScheduleDays}
            onChangeSchedule={(v) => setInput({ ...input, expectedScheduleDays: v })}
            previewSubtotal={previewSubtotal}
            onNext={handleNext}
            onBack={() => setStep(4)}
          />
        )}
        {step === 6 && result && (
          <Step6Result
            input={input}
            result={result}
            onBack={() => setStep(5)}
            onReset={() => { setStep(1); setInput(INITIAL_INPUT); setResult(null); }}
          />
        )}
      </div>

      {/* 안내 카드 (스텝 1~5) */}
      {step < 6 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-[860px] mb-16">
          <InfoCard
            icon={<Info size={22} />}
            title="다중 선택 안내"
            description="서로 다른 유형의 작업을 결합하여 한 번에 견적을 낼 수 있습니다. 다음 단계에서 세부 항목을 설정합니다."
          />
          <InfoCard
            icon={<ShieldCheck size={22} />}
            title="표준 단가 준수"
            description="본 시스템은 2026년도 플랜티엠 콘텐츠 제작 표준 단가표를 기준으로 투명한 견적을 제공합니다."
          />
        </div>
      )}

    </div>
  );
}
