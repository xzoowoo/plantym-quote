"use client";
import { RATES, AI_RATES, costFromMinutes, type RateItem } from "@/lib/rates";

const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(Math.round(n)) + "원";
const diffLabel = (w: number) => (w === 2 ? "상 (×2.0)" : w === 1.5 ? "중 (×1.5)" : "하 (×1.0)");

const CATEGORY_GROUPS: { key: keyof typeof RATES; label: string; english: string }[] = [
  { key: "planning", label: "기획", english: "Planning" },
  { key: "image", label: "이미지 제작", english: "Image Production" },
  { key: "video", label: "영상 편집", english: "Video Editing" },
  { key: "motion", label: "모션그래픽", english: "Motion Graphic" },
  { key: "videoWall", label: "비디오월", english: "Video Wall" },
  { key: "render", label: "렌더링·인코딩", english: "Rendering" },
];

const AI_IMAGE_BREAKDOWN = [
  { label: "기획 및 리서치", minutes: 60, difficulty: 1.0 },
  { label: "프롬프트 엔지니어링", minutes: 30, difficulty: 1.5 },
  { label: "이미지 생성 및 선별", minutes: 180, difficulty: 1.0 },
  { label: "후보정 및 합성", minutes: 480, difficulty: 1.5 },
];

const AI_VIDEO_BREAKDOWN = [
  { label: "기획 및 리서치", minutes: 180, difficulty: 1.0 },
  { label: "프롬프트 엔지니어링", minutes: 60, difficulty: 1.5 },
  { label: "영상 생성 및 선별", minutes: 480, difficulty: 1.0 },
  { label: "후보정 및 합성", minutes: 600, difficulty: 1.5 },
];

function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden mb-6">
      <div className="p-8 border-b border-slate-50 bg-slate-50/30">
        <h3 className="text-lg font-black text-slate-900 tracking-tight">{title}</h3>
        {subtitle && <p className="text-[12px] text-slate-400 mt-1">{subtitle}</p>}
      </div>
      <div className="p-8">{children}</div>
    </div>
  );
}

function ItemTable({ items }: { items: [string, RateItem][] }) {
  return (
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="border-b border-slate-100">
          <th className="py-2.5 text-[11px] font-bold text-slate-400">작업 항목</th>
          <th className="py-2.5 text-[11px] font-bold text-slate-400 text-center w-[70px]">단위</th>
          <th className="py-2.5 text-[11px] font-bold text-slate-400 text-center w-[90px]">소요시간</th>
          <th className="py-2.5 text-[11px] font-bold text-slate-400 text-center w-[100px]">난이도</th>
          <th className="py-2.5 text-[11px] font-bold text-slate-400 text-right w-[120px]">단가</th>
        </tr>
      </thead>
      <tbody>
        {items.map(([key, rate]) => (
          <tr key={key} className="border-b border-slate-50 last:border-0">
            <td className="py-2.5 text-[13px] font-medium text-slate-800">{rate.name}</td>
            <td className="py-2.5 text-[12px] text-slate-400 text-center">{rate.unit}</td>
            <td className="py-2.5 text-[12px] text-slate-500 text-center">{rate.minutes}분</td>
            <td className="py-2.5 text-[12px] text-slate-500 text-center">{diffLabel(rate.difficultyWeight ?? 1)}</td>
            <td className="py-2.5 text-[13px] font-bold text-slate-900 text-right font-mono whitespace-nowrap">{fmt(rate.cost)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function AIBreakdownTable({ breakdown, attemptLabel, attemptCount, costPerAttempt, laborCost }: {
  breakdown: { label: string; minutes: number; difficulty: number }[];
  attemptLabel: string;
  attemptCount: number;
  costPerAttempt: number;
  laborCost: number;
}) {
  const usageFee = attemptCount * costPerAttempt;
  return (
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="border-b border-slate-100">
          <th className="py-2.5 text-[11px] font-bold text-slate-400">작업 분류</th>
          <th className="py-2.5 text-[11px] font-bold text-slate-400 text-center w-[90px]">소요시간</th>
          <th className="py-2.5 text-[11px] font-bold text-slate-400 text-center w-[100px]">난이도</th>
          <th className="py-2.5 text-[11px] font-bold text-slate-400 text-right w-[120px]">금액</th>
        </tr>
      </thead>
      <tbody>
        {breakdown.map((b) => (
          <tr key={b.label} className="border-b border-slate-50">
            <td className="py-2.5 text-[13px] font-medium text-slate-800">{b.label}</td>
            <td className="py-2.5 text-[12px] text-slate-500 text-center">{b.minutes}분</td>
            <td className="py-2.5 text-[12px] text-slate-500 text-center">{diffLabel(b.difficulty)}</td>
            <td className="py-2.5 text-[13px] font-bold text-slate-900 text-right font-mono whitespace-nowrap">{fmt(costFromMinutes(b.minutes, b.difficulty))}</td>
          </tr>
        ))}
        <tr className="border-b border-slate-100">
          <td colSpan={3} className="py-2.5 text-right text-[12px] text-slate-500 font-medium">작업비 소계</td>
          <td className="py-2.5 text-right font-mono font-bold text-slate-900 text-[13px] whitespace-nowrap">{fmt(laborCost)}</td>
        </tr>
        <tr className="border-b border-slate-100">
          <td colSpan={3} className="py-2.5 text-right text-[12px] text-slate-500 font-medium">
            AI 솔루션 사용료 (예: {attemptLabel} {attemptCount}건 × {fmt(costPerAttempt)})
          </td>
          <td className="py-2.5 text-right font-mono font-bold text-slate-900 text-[13px] whitespace-nowrap">{fmt(usageFee)}</td>
        </tr>
        <tr className="bg-primary/5">
          <td colSpan={3} className="py-3 text-right font-black text-slate-900 text-[13px]">예시 합계 (완성물 1건)</td>
          <td className="py-3 text-right font-mono font-black text-primary text-[14px] whitespace-nowrap">{fmt(laborCost + usageFee)}</td>
        </tr>
      </tbody>
    </table>
  );
}

export default function PricingGuidePage() {
  return (
    <div className="flex-1 p-12 flex flex-col items-center">
      <div className="w-full max-w-[900px]">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">단가 산출 기준</h2>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">플랜티엠 2026년도 콘텐츠 제작 표준 단가 (2026-08-04 기준)</p>
        </div>

        <SectionCard title="1. 기준 단가 및 계산 방식">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-50 rounded-2xl p-5">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">일 단가 (8시간 기준)</p>
              <p className="text-lg font-black text-slate-900 font-mono">188,040원</p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-5">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">시간 단가</p>
              <p className="text-lg font-black text-slate-900 font-mono">23,505원</p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-5">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">분 단가</p>
              <p className="text-lg font-black text-slate-900 font-mono">391.75원</p>
            </div>
          </div>
          <div className="bg-blue-50 rounded-2xl px-5 py-4 mb-6">
            <p className="text-[12px] font-bold text-primary mb-1">계산식</p>
            <p className="text-[13px] text-slate-700 font-mono">금액 = 소요시간(분) × 난이도 가중치 × 391.75원</p>
          </div>
          <p className="text-[12px] text-slate-500 mb-4">근거: 한국디자인산업연합회(KODIA) 2025년 산업별 노임단가표 (시각디자이너 중급 기준)</p>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="py-2.5 text-[11px] font-bold text-slate-400 w-[100px]">난이도</th>
                <th className="py-2.5 text-[11px] font-bold text-slate-400">설명</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-50">
                <td className="py-2.5 text-[13px] font-bold text-slate-800">하 (×1.0)</td>
                <td className="py-2.5 text-[12px] text-slate-600">단순 편집, 반복 작업 등 기본 수준의 작업</td>
              </tr>
              <tr className="border-b border-slate-50">
                <td className="py-2.5 text-[13px] font-bold text-slate-800">중 (×1.5)</td>
                <td className="py-2.5 text-[12px] text-slate-600">디자인 요소 추가, 텍스트 추가, 합성 등 중간 수준 작업</td>
              </tr>
              <tr>
                <td className="py-2.5 text-[13px] font-bold text-slate-800">상 (×2.0)</td>
                <td className="py-2.5 text-[12px] text-slate-600">모션그래픽, 특수효과, 복잡한 디자인 작업 및 복합적인 기술을 요하는 작업</td>
              </tr>
            </tbody>
          </table>
        </SectionCard>

        <SectionCard title="2. 항목별 단가표" subtitle="아래 표는 실제 견적 계산 로직의 값과 항상 동일합니다.">
          <div className="space-y-8">
            {CATEGORY_GROUPS.map(({ key, label, english }) => (
              <div key={key}>
                <div className="text-[13px] font-semibold text-slate-600 mb-2">
                  {label}
                  <span className="text-slate-400 font-normal ml-1.5">({english})</span>
                </div>
                <ItemTable items={Object.entries(RATES[key]) as [string, RateItem][]} />
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="3. AI 이미지·영상 생성 비용 산출" subtitle="작업비(기획·프롬프트·생성·후보정) + AI 솔루션 사용료(생성 시도 건수 × 건당 비용)로 구성됩니다.">
          <div className="space-y-8">
            <div>
              <div className="text-[13px] font-semibold text-slate-600 mb-2">AI 이미지 생성</div>
              <AIBreakdownTable
                breakdown={AI_IMAGE_BREAKDOWN}
                attemptLabel={AI_RATES.image.attemptGroups[0].label}
                attemptCount={AI_RATES.image.attemptGroups[0].count}
                costPerAttempt={AI_RATES.image.attemptGroups[0].costPerAttempt}
                laborCost={AI_RATES.image.laborCost}
              />
            </div>
            <div>
              <div className="text-[13px] font-semibold text-slate-600 mb-2">AI 영상 생성</div>
              <AIBreakdownTable
                breakdown={AI_VIDEO_BREAKDOWN}
                attemptLabel={AI_RATES.video.attemptGroups[0].label}
                attemptCount={AI_RATES.video.attemptGroups[0].count}
                costPerAttempt={AI_RATES.video.attemptGroups[0].costPerAttempt}
                laborCost={AI_RATES.video.laborCost}
              />
            </div>
          </div>
          <div className="mt-6 bg-slate-50 rounded-2xl px-5 py-4 text-[12px] text-slate-500 leading-relaxed">
            <p className="font-bold text-slate-600 mb-1">AI 솔루션 사용료 산출 기준</p>
            <p>적용 툴: Midjourney Mega Plan, Gemini Ultra Plan (전문가 전용 유료 플랜)</p>
            <p>이미지 생성 1920×1080px (Gemini 3.1 Flash Image - Nano Banana 2): 130원/건</p>
            <p>영상 생성 1920×1080px (Gemini Omni Flash &amp; Veo 3.1): 2,170원/건</p>
            <p>상기 단가는 Google Gemini API 가격 정책 기준이며, 환율(1,550원/USD, 2026-07-01 기준)에 따라 조정될 수 있습니다.</p>
          </div>
        </SectionCard>

        <SectionCard title="4. 적용 범위">
          <ul className="space-y-2 text-[13px] text-slate-600 list-disc pl-5">
            <li>본 단가의 인건비는 디지털 메뉴보드용 콘텐츠(모션그래픽, 이미지 및 영상 편집 디자인) 등의 업무 수행에 대한 비용을 포함합니다.</li>
            <li>기본 디자인 작업 외 기획, 콘셉트 시안, 스토리보드 작성 등 추가적인 업무가 포함될 경우 별도 협의 후 조정될 수 있습니다.</li>
            <li>AI 솔루션 사용료는 실제 생성 건수에 따라 정산되며, 예상 건수를 초과할 경우 추가 청구됩니다.</li>
          </ul>
        </SectionCard>

        <SectionCard title="5. 제작 일정 안내">
          <ul className="space-y-2 text-[13px] text-slate-600 list-disc pl-5">
            <li>위 표의 소요시간(분)은 내부 원가 산출 기준이며, 실제 제작 일정 산정 시에는 &apos;작업 소요일(Day)&apos; 기준으로 산정됩니다.</li>
            <li>작업은 프로젝트 단위로 병행 진행되므로, 동일 작업 시간이라도 실제 납품일정은 다를 수 있습니다.</li>
            <li>난이도(하) 수준의 단순 디자인 및 영상 작업: 1~3일 권장</li>
            <li>난이도(중) 수준의 디자인 및 영상 작업: 3~7일 권장</li>
            <li>난이도(상) 수준의 디자인 및 영상 작업: 7~20일 권장</li>
            <li>정확한 일정은 작업량, 수정 횟수, 검수 일정에 따라 별도 협의 후 확정됩니다.</li>
            <li>상기 제작 일정은 워크데이(주말·공휴일 제외 기준) 기준으로 산정됩니다.</li>
          </ul>
          <p className="mt-4 text-[11px] text-slate-400">
            참고: 견적 작성 5단계의 &quot;예상 제작일정&quot; 입력은 참고용으로만 기재되며, 항목별 금액에는 영향을 주지 않습니다.
          </p>
        </SectionCard>
      </div>
    </div>
  );
}
