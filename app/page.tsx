"use client";
import { useState } from "react";
import WizardNav from "@/components/WizardNav";
import Step1BasicInfo from "@/components/steps/Step1BasicInfo";
import Step2Panel from "@/components/steps/Step2Panel";
import Step3ContentType from "@/components/steps/Step3ContentType";
import Step4Details from "@/components/steps/Step4Details";
import Step5Margin from "@/components/steps/Step5Margin";
import Step6Result from "@/components/steps/Step6Result";
import { calculateQuote } from "@/lib/calculate";
import type { QuoteInput, QuoteResult } from "@/lib/types";

const INITIAL_INPUT: QuoteInput = {
  basicInfo: { companyName: "", contactName: "", projectName: "", date: new Date().toISOString().slice(0, 10) },
  panelInfo: { count: 1, size: "", isVideoWall: false },
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

export default function Page() {
  const [step, setStep] = useState(1);
  const [input, setInput] = useState<QuoteInput>(INITIAL_INPUT);
  const [result, setResult] = useState<QuoteResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

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

  return (
    <main className="min-h-screen flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">영상 제작 견적 생성기</h1>
          <p className="text-sm text-gray-500 mt-1">플랜티엠 콘텐츠 제작 단가 기준</p>
        </div>
        <WizardNav current={step} />
        <div className="bg-white rounded-2xl shadow-sm border p-6">
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
      </div>
    </main>
  );
}
