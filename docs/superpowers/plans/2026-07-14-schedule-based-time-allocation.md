# 예상 제작일정 기반 시간/금액 배분 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사용자가 프로젝트 전체의 "예상 제작일정(총 며칠)"을 5단계(마진율) 화면에서 입력하면, 선택된 모든 항목의 상대 비율은 유지한 채 전체 금액이 그 일정에 맞춰 자동 재조정되게 한다.

**Architecture:** `lib/rates.ts`의 AI 이미지/영상 단가를 "작업비"와 "AI 솔루션 사용료"로 분리하고, `lib/calculate.ts`에서 전체 항목의 작업비 합계 대비 사용자가 입력한 일정(일수 × 일당 단가)의 배율을 계산해 각 항목의 작업비에만 곱한다. 사용료는 배율과 무관하게 그대로 더한다. UI는 기존 5단계 화면에 입력 필드 하나만 추가한다.

**Tech Stack:** Next.js(App Router) + TypeScript, Jest(ts-jest, node 환경) — 컴포넌트 테스트 인프라는 없음(수동/개발서버로 UI 검증).

## Global Constraints

- 일정 미입력(undefined/0/음수/NaN) 시 기존 계산 결과와 100% 동일해야 함 (스펙: `docs/superpowers/specs/2026-07-14-schedule-based-time-allocation-design.md`)
- `LineItem`, `QuoteResult` 등 외부에 노출되는 타입 구조는 변경하지 않음
- AI 솔루션 사용료(`usageFee`)는 배율 적용 대상에서 항상 제외
- 배율 계산의 일당 단가는 `lib/rates.ts`의 `DAILY_RATE`(188,040원)를 그대로 사용

---

## Task 1: 일정 기반 배율 계산 로직

**Files:**
- Modify: `lib/types.ts` (`QuoteInput`에 필드 추가)
- Modify: `lib/rates.ts` (`DAILY_RATE` export, `RateItem`에 `usageFee` 추가, AI 단가 분리)
- Modify: `lib/calculate.ts` (배율 계산 로직)
- Modify: `__tests__/calculate.test.ts` (신규 테스트 4건 추가)

**Interfaces:**
- Consumes: 없음 (최상위 도메인 로직)
- Produces:
  - `QuoteInput.expectedScheduleDays?: number` — Task 2(UI)에서 이 필드를 읽고 씀
  - `calculateQuote(input: QuoteInput): QuoteResult` — 시그니처 변경 없음, 내부 동작만 확장

- [ ] **Step 1: 실패하는 테스트 4건을 `__tests__/calculate.test.ts`에 추가**

`describe("calculateQuote", () => { ... })` 블록의 마지막 테스트(`categorySummary에 이미지·AI 카테고리 집계`) 뒤에 아래 4개 테스트를 추가한다.

```ts
  test("일정 미입력 시 기존 계산과 동일", () => {
    const input: QuoteInput = {
      ...baseInput,
      contentTypes: ["image"],
      imageDetails: { hasSource: false, imageCount: 1, tasks: [] },
    };
    const withoutSchedule = calculateQuote(input);
    const withZeroSchedule = calculateQuote({ ...input, expectedScheduleDays: 0 });
    expect(withZeroSchedule.costSubtotal).toBe(withoutSchedule.costSubtotal);
  });

  test("예상 제작일정 입력 시 항목 비율 유지하며 총액이 일정에 맞춰짐", () => {
    const base: QuoteInput = {
      ...baseInput,
      contentTypes: ["image"],
      imageDetails: { hasSource: false, imageCount: 1, tasks: ["remove-bg"] },
    };
    const baseResult = calculateQuote(base);
    const result = calculateQuote({ ...base, expectedScheduleDays: 10 });

    const researchBase = baseResult.lineItems.find(i => i.name === "소스 리서치")!.totalCost;
    const removeBgBase = baseResult.lineItems.find(i => i.name === "배경 제거(누끼)")!.totalCost;
    const research = result.lineItems.find(i => i.name === "소스 리서치")!.totalCost;
    const removeBg = result.lineItems.find(i => i.name === "배경 제거(누끼)")!.totalCost;

    expect(research / removeBg).toBeCloseTo(researchBase / removeBgBase, 2);
    expect(result.costSubtotal).toBeCloseTo(10 * 188040, -2);
  });

  test("AI 이미지 포함 시 AI 솔루션 사용료는 일정과 무관하게 고정", () => {
    const input: QuoteInput = {
      ...baseInput,
      contentTypes: ["ai-image"],
      aiImageDetails: { count: 1 },
      expectedScheduleDays: 1,
    };
    const result = calculateQuote(input);
    const total = result.lineItems.find(i => i.name === "AI 이미지 생성")!.totalCost;
    expect(total).toBe(Math.round(1 * 188040) + 1300);
  });

  test("선택된 항목 없이 일정만 입력해도 에러 없이 0원", () => {
    const result = calculateQuote({ ...baseInput, expectedScheduleDays: 20 });
    expect(result.costSubtotal).toBe(0);
    expect(result.totalPrice).toBe(0);
  });
```

- [ ] **Step 2: 테스트 실행해서 실패 확인**

Run: `npm test -- calculate.test.ts`
Expected: 새로 추가한 4개 테스트 중 최소 2개(비율 유지, 사용료 고정 테스트)가 FAIL. (`expectedScheduleDays`가 아직 `QuoteInput`에 없어 TypeScript 컴파일 자체가 실패할 수도 있음 — 그것도 "실패 확인"으로 간주하고 다음 단계로 진행)

- [ ] **Step 3: `lib/types.ts`에 필드 추가**

`QuoteInput` 인터페이스의 `marginRate: number;` 바로 아래에 추가:

```ts
export interface QuoteInput {
  basicInfo: BasicInfo;
  panelInfo: PanelInfo;
  contentTypes: ContentType[];
  imageDetails: ImageDetails;
  videoDetails: VideoDetails;
  aiImageDetails: AIImageDetails;
  aiVideoDetails: AIVideoDetails;
  freeText: string;
  marginRate: number;
  expectedScheduleDays?: number;
}
```

- [ ] **Step 4: `lib/rates.ts`에서 `DAILY_RATE` export, `RateItem`에 `usageFee` 추가, AI 단가 분리**

`const DAILY_RATE = 188040;` → `export const DAILY_RATE = 188040;`

```ts
export interface RateItem {
  name: string;
  unit: string;
  cost: number;
  usageFee?: number;
}
```

`ai` 블록을 아래로 교체:

```ts
  ai: {
    // 플랜티엠_콘텐츠제작단가표_260701 'AI 이미지 생성 견적 예시(이미지 1장 제작)' 기준
    // 기획·리서치 11,752.5(30분,하) + 프롬프트 엔지니어링 11,752.5(20분,중) + 생성·선별 3,917.5(10분,하)
    // + 후보정·합성 11,752.5(20분,중) = 39,175(작업비) / AI 솔루션 사용료(10건×130원) = 1,300
    image: { name: "AI 이미지 생성", unit: "1건", cost: 39175, usageFee: 1300 },
    // 글로리서울 견적서(260702) 'AI 영상 생성(입구패널영상)' 실 청구 기준, 20일 프로젝트 1건 완성 기준
    // 기획·리서치 188,040 + 프롬프트 엔지니어링 141,030 + 생성·선별 1,880,400 + 후보정·합성 2,820,600 = 5,030,070(작업비)
    // AI 솔루션 사용료(참고이미지 240건×130원=31,200 + 영상 480건×2,170원=1,041,600) = 1,072,800
    // (Gemini API 월간 예산 및 비용 시뮬레이터_수정 기준, 환율 1,550원/USD, 2026-07-01)
    video: { name: "AI 영상 생성",   unit: "1건", cost: 5030070, usageFee: 1072800 },
  },
```

- [ ] **Step 5: `lib/calculate.ts`에 배율 계산 로직 구현**

파일 전체를 아래 내용으로 교체:

```ts
import type { QuoteInput, QuoteResult, LineItem, CategorySummary } from "@/lib/types";
import { RATES, DAILY_RATE } from "@/lib/rates";

function item(
  category: LineItem["category"],
  rate: { name: string; unit: string; cost: number },
  quantity: number,
  perPanel: boolean,
  panelCount: number
): LineItem {
  const effectiveQty = perPanel ? quantity * panelCount : quantity;
  return {
    category,
    name: rate.name,
    unit: rate.unit,
    quantity: effectiveQty,
    unitCost: rate.cost,
    totalCost: rate.cost * effectiveQty,
  };
}

function aiItem(
  category: "ai-image" | "ai-video",
  rate: { name: string; unit: string; cost: number; usageFee?: number },
  quantity: number
): { line: LineItem; fixedPortion: number } {
  const fee = rate.usageFee ?? 0;
  const totalCost = (rate.cost + fee) * quantity;
  return {
    line: {
      category,
      name: rate.name,
      unit: rate.unit,
      quantity,
      unitCost: rate.cost + fee,
      totalCost,
    },
    fixedPortion: fee * quantity,
  };
}

function buildSummary(items: LineItem[]): CategorySummary[] {
  const map: Record<string, number> = {};
  const labels: Record<LineItem["category"], string> = {
    image: "이미지 제작",
    video: "영상·모션 제작",
    motion: "영상·모션 제작",
    render: "영상·모션 제작",
    "ai-image": "AI 이미지 생성",
    "ai-video": "AI 영상 생성",
  };
  for (const i of items) {
    const label = labels[i.category];
    map[label] = (map[label] ?? 0) + i.totalCost;
  }
  return Object.entries(map).map(([label, amount]) => ({ label, amount }));
}

export function calculateQuote(input: QuoteInput): QuoteResult {
  const items: LineItem[] = [];
  const fixedPortions: number[] = [];
  const push = (line: LineItem, fixedPortion = 0) => {
    items.push(line);
    fixedPortions.push(fixedPortion);
  };

  const p = input.panelInfo.count;
  const durationMin = Math.max(1, Math.ceil((input.videoDetails?.durationSeconds ?? 0) / 60));

  if (input.contentTypes.includes("image") && input.imageDetails) {
    const img = input.imageDetails;
    const n = img.imageCount;

    if (!img.hasSource) {
      push(item("image", RATES.image.research, 1, true, p));
    }
    if (img.tasks.includes("resize") && n > 0) {
      const sets = Math.max(1, Math.ceil(n / 5));
      push(item("image", RATES.image.resize, sets, true, p));
    }
    if (img.tasks.includes("remove-bg"))
      push(item("image", RATES.image.removeBg, n, true, p));
    if (img.tasks.includes("separate"))
      push(item("image", RATES.image.separate, n, true, p));
    if (img.tasks.includes("reposition"))
      push(item("image", RATES.image.reposition, n, true, p));
    if (img.tasks.includes("composite"))
      push(item("image", RATES.image.composite, n, true, p));
    if (img.tasks.includes("text"))
      push(item("image", RATES.image.text, n, true, p));
    if (img.tasks.includes("design-element"))
      push(item("image", RATES.image.designElement, n, true, p));
  }

  if (input.contentTypes.includes("video") && input.videoDetails) {
    const vid = input.videoDetails;

    if (vid.cutEdit)
      push(item("video", RATES.video.cutEdit, durationMin, false, p));
    if (vid.subtitle)
      push(item("video", RATES.video.subtitle, durationMin, false, p));
    if (vid.rolling && vid.rollingCount > 0)
      push(item("motion", RATES.motion.rolling, vid.rollingCount, false, p));

    if (vid.transition !== "none") {
      const r = vid.transition === "basic" ? RATES.motion.transitionBasic : RATES.motion.transitionAdvanced;
      push(item("motion", r, vid.transitionCount, false, p));
    }
    if (vid.entrance !== "none") {
      const r = vid.entrance === "basic" ? RATES.motion.entranceBasic : RATES.motion.entranceAdvanced;
      push(item("motion", r, vid.entranceCount, false, p));
    }
    if (vid.emphasis !== "none") {
      const r = vid.emphasis === "basic" ? RATES.motion.emphasisBasic : RATES.motion.emphasisAdvanced;
      push(item("motion", r, vid.emphasisCount, false, p));
    }
    if (vid.special !== "none") {
      const r = vid.special === "basic" ? RATES.motion.specialBasic : RATES.motion.specialAdvanced;
      push(item("motion", r, vid.specialCount, false, p));
    }
    if (vid.animation !== "none") {
      const r = vid.animation === "basic" ? RATES.motion.animationBasic : RATES.motion.animationAdvanced;
      push(item("motion", r, vid.animationCount, false, p));
    }

    const renderRate = vid.renderQuality === "4k" ? RATES.render.k4 : RATES.render.fhd;
    push(item("render", renderRate, durationMin, false, 1));
    push(item("render", RATES.render.mp4Convert, durationMin, false, 1));
    if (vid.usbConvert)
      push(item("render", RATES.render.usb, 1, false, 1));
  }

  if (input.panelInfo.isVideoWall) {
    const r = p > 2 ? RATES.videoWall.advanced : RATES.videoWall.basic;
    push(item("motion", r, 1, false, 1));
  }

  if (input.contentTypes.includes("ai-image") && input.aiImageDetails.count > 0) {
    const { line, fixedPortion } = aiItem("ai-image", RATES.ai.image, input.aiImageDetails.count);
    push(line, fixedPortion);
  }

  if (input.contentTypes.includes("ai-video") && input.aiVideoDetails.count > 0) {
    const { line, fixedPortion } = aiItem("ai-video", RATES.ai.video, input.aiVideoDetails.count);
    push(line, fixedPortion);
  }

  const keepIdx = items.map((_, i) => i).filter(i => items[i].quantity > 0 && items[i].totalCost > 0);
  let filteredItems = keepIdx.map(i => items[i]);
  const filteredFixed = keepIdx.map(i => fixedPortions[i]);

  const schedule = input.expectedScheduleDays;
  if (schedule && schedule > 0) {
    const scalableSum = filteredItems.reduce((s, it, i) => s + (it.totalCost - filteredFixed[i]), 0);
    if (scalableSum > 0) {
      const targetBudget = schedule * DAILY_RATE;
      const scaleFactor = targetBudget / scalableSum;
      filteredItems = filteredItems.map((it, i) => {
        const fixed = filteredFixed[i];
        const scalable = it.totalCost - fixed;
        const totalCost = Math.round(scalable * scaleFactor + fixed);
        return { ...it, totalCost, unitCost: Math.round(totalCost / it.quantity) };
      });
    }
  }

  const costSubtotal = filteredItems.reduce((s, i) => s + i.totalCost, 0);
  const marginAmount = Math.round(costSubtotal * input.marginRate / 100);
  const totalPrice = costSubtotal + marginAmount;

  return { lineItems: filteredItems, costSubtotal, marginAmount, totalPrice, categorySummary: buildSummary(filteredItems) };
}
```

- [ ] **Step 6: 전체 테스트 실행해서 통과 확인**

Run: `npm test`
Expected: 기존 테스트 8개 + 신규 테스트 4개 모두 PASS (총 12개)

- [ ] **Step 7: 커밋**

```bash
git add lib/types.ts lib/rates.ts lib/calculate.ts __tests__/calculate.test.ts
git commit -m "feat: add schedule-based cost rescaling to quote calculation"
```

---

## Task 2: 5단계 화면에 예상 제작일정 입력 필드 추가

**Files:**
- Modify: `components/steps/Step5Margin.tsx`
- Modify: `app/page.tsx:167-174`

**Interfaces:**
- Consumes: `QuoteInput.expectedScheduleDays?: number` (Task 1에서 정의)
- Produces: 없음 (최상위 화면 컴포넌트)

- [ ] **Step 1: `Step5Margin.tsx`에 props와 입력 필드 추가**

`Props` 인터페이스를 아래로 교체:

```ts
interface Props {
  marginRate: number;
  onChange: (v: number) => void;
  expectedScheduleDays?: number;
  onChangeSchedule: (v: number | undefined) => void;
  previewSubtotal: number;
  onNext: () => void;
  onBack: () => void;
}
```

함수 시그니처를 아래로 교체:

```ts
export default function Step5Margin({ marginRate, onChange, expectedScheduleDays, onChangeSchedule, previewSubtotal, onNext, onBack }: Props) {
```

마진율 입력 블록(`<div>` ... `마진율 (%)` ... `</div>`) 바로 뒤, `{previewSubtotal > 0 && (` 블록 바로 앞에 아래 블록을 추가:

```tsx
        <div>
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 block">예상 제작일정 (선택, 워크데이 기준)</label>
          <div className="flex items-center space-x-3">
            <input
              type="number"
              min={0}
              placeholder="예: 10"
              value={expectedScheduleDays ?? ""}
              onChange={e => {
                const v = e.target.value;
                onChangeSchedule(v === "" ? undefined : Number(v));
              }}
              className="w-32 border border-slate-200 rounded-xl px-4 py-2 text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <span className="text-sm text-slate-400 font-medium">일</span>
          </div>
          <p className="text-[12px] text-slate-400 mt-2">입력하지 않으면 항목별 기본 단가로 자동 계산됩니다. 입력하면 선택한 항목들의 비율은 유지한 채 전체 금액이 이 일정에 맞춰 재조정됩니다.</p>
        </div>
```

- [ ] **Step 2: `app/page.tsx`에서 새 props 연결**

`app/page.tsx:167-174`의 `<Step5Margin ... />` 호출을 아래로 교체:

```tsx
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
```

- [ ] **Step 3: 타입 체크 및 빌드 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 4: 개발 서버로 실제 동작 확인**

Run: `npm run dev` (백그라운드 실행)

브라우저(또는 `run` 스킬)로 `http://localhost:3000` 접속 →
1. 1~4단계를 임의 값으로 채워 진행 (예: 이미지 콘텐츠 선택, 배경 제거 항목 체크)
2. 5단계에서 "예상 제작일정" 필드가 보이는지 확인
3. 값을 비워둔 상태의 미리보기 금액을 기록
4. "10"을 입력해 미리보기 금액(공급 원가)이 즉시 바뀌는지 확인
5. 값을 다시 지우면 원래 금액으로 돌아오는지 확인

Expected: 필드가 정상 렌더링되고, 입력값에 따라 미리보기 금액이 실시간으로 재계산됨

- [ ] **Step 5: 커밋**

```bash
git add components/steps/Step5Margin.tsx app/page.tsx
git commit -m "feat: add expected schedule input to margin step"
```
