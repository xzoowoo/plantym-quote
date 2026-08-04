# 고정 단가 기반 견적 계산 개편 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 견적 항목별 금액이 다른 카테고리 구성과 무관하게 항상 고정되도록 "예상 제작일정 재조정" 로직을 제거하고, 내부 편집 화면에서 항목별 소요시간(분)과 AI 생성 시도 건수를 직접 조정할 수 있게 하며, "기획 및 리서치" 항목의 자동 포함을 없앤다.

**Architecture:** 계산 엔진(`lib/rates.ts`, `lib/calculate.ts`)이 각 `LineItem`에 `minutes`/`difficultyWeight`(일반 항목) 또는 `laborCost`/`attemptGroups`(AI 항목)를 함께 실어 보내고, 내부 편집 화면(`QuoteTable.tsx`)이 이 필드를 보고 편집 가능한 입력을 렌더링해서 `unitCost`/`totalCost`를 그 자리에서 재계산한다. 카탈로그(`lib/catalog.ts`)도 같은 필드를 실어서 "항목 추가"로 넣은 항목도 동일하게 편집 가능하다.

**Tech Stack:** Next.js, TypeScript, Jest(ts-jest), @react-pdf/renderer

## Global Constraints

- 참고 설계 문서: `docs/superpowers/specs/2026-08-04-fixed-unit-pricing-design.md` (이 계획의 모든 작업은 이 문서를 근거로 한다)
- 소요시간 기본값 갱신은 설계 문서에서 확정한 안전한 매핑(사이즈 변경, 소스 분리, 화면전환 기본)만 적용한다 — 나머지 항목은 이번 작업에서 값을 바꾸지 않는다.
- 난이도(`difficultyWeight`)는 어떤 화면에서도 사용자가 편집할 수 없다 — 참고 표시만.
- 소요시간/AI 시도건수 편집 UI는 내부용 화면·내부용 PDF에만 존재한다 — 외부용 화면(`ExternalQuoteView`)과 외부용 PDF(`PDFDocument.tsx`)는 건드리지 않는다.
- AI 이미지/영상 항목의 수량(완성물 개수) 편집 잠금은 기존 그대로 유지한다 — 이번 작업에서 건드리지 않는다.
- 커밋은 작업(Task) 단위로 나눠서 자주 한다.

---

## Task 1: `lib/types.ts` — LineItem에 소요시간/AI 시도건수 필드 추가

**Files:**
- Modify: `lib/types.ts`

**Interfaces:**
- Produces: `AttemptGroup { label: string; count: number; costPerAttempt: number }`, `LineItem`에 추가된 선택 필드 `minutes?: number; difficultyWeight?: number; laborCost?: number; attemptGroups?: AttemptGroup[];`

- [ ] **Step 1: `LineItem` 인터페이스 바로 위에 `AttemptGroup` 인터페이스를 추가하고, `LineItem`에 필드 4개를 추가한다**

`lib/types.ts`에서 아래 블록을 찾는다:

```ts
export interface LineItem {
  category: "planning" | "image" | "video" | "motion" | "render" | "ai-image" | "ai-video";
  name: string;
  unit: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}
```

다음으로 교체한다:

```ts
export interface AttemptGroup {
  label: string;
  count: number;
  costPerAttempt: number;
}

export interface LineItem {
  category: "planning" | "image" | "video" | "motion" | "render" | "ai-image" | "ai-video";
  name: string;
  unit: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  minutes?: number;          // 소요시간(분) — 시간 기반 항목만 존재, 편집 가능
  difficultyWeight?: number; // 난이도 가중치(1.0/1.5/2.0) — 고정, 참고 표시용
  laborCost?: number;        // AI 항목 전용: 완성물 1건당 작업비 (고정)
  attemptGroups?: AttemptGroup[]; // AI 항목 전용: 완성물 1건당 생성 시도 건수 (편집 가능)
}
```

- [ ] **Step 2: 타입 검사로 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음 (기존 필드는 그대로, 새 필드는 전부 optional이라 기존 코드 어디에서도 깨지지 않는다)

- [ ] **Step 3: 커밋**

```bash
git add lib/types.ts
git commit -m "feat: add minutes/difficultyWeight/attemptGroups fields to LineItem"
```

---

## Task 2: `lib/rates.ts` + `lib/calculate.ts` — 재조정 로직 제거, 소요시간/AI 시도건수 노출

**Files:**
- Modify: `lib/rates.ts`
- Modify: `lib/calculate.ts`
- Create: `__tests__/rates.test.ts`
- Modify: `__tests__/calculate.test.ts`

**Interfaces:**
- Consumes: `AttemptGroup` (Task 1, `@/lib/types`)
- Produces: `costFromMinutes(minutes: number, difficultyWeight: number): number`, `RateItem { name; unit; cost; minutes?; difficultyWeight? }`, `AIRate { name; unit; laborCost; attemptGroups: AttemptGroup[] }`, `AI_RATES: { image: AIRate; video: AIRate }` — 전부 `@/lib/rates`에서 export. `calculateQuote()`가 반환하는 `LineItem`은 이제 시간 기반 항목엔 `minutes`/`difficultyWeight`를, AI 항목엔 `laborCost`/`attemptGroups`를 채워서 반환한다. `input.expectedScheduleDays`는 더 이상 `costSubtotal`에 영향을 주지 않는다. "기획 및 리서치" 항목은 더 이상 자동으로 포함되지 않는다.

- [ ] **Step 1: 실패하는 테스트 작성 — `__tests__/rates.test.ts`**

```ts
import { costFromMinutes, RATES, AI_RATES } from "@/lib/rates";

describe("costFromMinutes", () => {
  test("60분 × 하(1.0) = 23,505원", () => {
    expect(costFromMinutes(60, 1.0)).toBe(23505);
  });
  test("240분 × 중(1.5) = 141,030원", () => {
    expect(costFromMinutes(240, 1.5)).toBe(141030);
  });
});

describe("RATES 기본값 갱신 (2026-08-04 단가표 기준)", () => {
  test("사이즈 변경: 5분(하) = 1,959원", () => {
    expect(RATES.image.resize.minutes).toBe(5);
    expect(RATES.image.resize.difficultyWeight).toBe(1.0);
    expect(RATES.image.resize.cost).toBe(1959);
  });
  test("소스 분리: 180분(중) = 105,773원", () => {
    expect(RATES.image.separate.minutes).toBe(180);
    expect(RATES.image.separate.cost).toBe(105773);
  });
  test("화면전환 기본: 5분(하) = 1,959원", () => {
    expect(RATES.motion.transitionBasic.minutes).toBe(5);
    expect(RATES.motion.transitionBasic.cost).toBe(1959);
  });
  test("기획 및 리서치는 480분(하) 기준으로 여전히 188,040원", () => {
    expect(RATES.planning.research.minutes).toBe(480);
    expect(RATES.planning.research.cost).toBe(188040);
  });
  test("프롬프트 설계는 240분(중) 기준으로 여전히 141,030원", () => {
    expect(RATES.planning.promptDesign.minutes).toBe(240);
    expect(RATES.planning.promptDesign.cost).toBe(141030);
  });
});

describe("AI_RATES", () => {
  test("AI 이미지: 작업비 15,670원 + 시도 10건×130원 = 16,970원", () => {
    const usageFee = AI_RATES.image.attemptGroups.reduce((s, g) => s + g.count * g.costPerAttempt, 0);
    expect(AI_RATES.image.laborCost + usageFee).toBe(16970);
  });
  test("AI 영상: 참고이미지 240건×130원 + 영상 480건×2,170원 = 1,072,800원 사용료", () => {
    const usageFee = AI_RATES.video.attemptGroups.reduce((s, g) => s + g.count * g.costPerAttempt, 0);
    expect(usageFee).toBe(1072800);
    expect(AI_RATES.video.laborCost + usageFee).toBe(5773800);
  });
});
```

- [ ] **Step 2: 테스트 실행해서 실패 확인**

Run: `npx jest __tests__/rates.test.ts`
Expected: FAIL (`costFromMinutes`, `AI_RATES`가 아직 없음)

- [ ] **Step 3: `lib/rates.ts` 전체를 아래 내용으로 교체**

```ts
import type { AttemptGroup } from "@/lib/types";

const DAILY_RATE = 188040;
const MIN_RATE = DAILY_RATE / 480;

type Difficulty = "low" | "mid" | "high";
const DIFFICULTY: Record<Difficulty, number> = { low: 1.0, mid: 1.5, high: 2.0 };

export function costFromMinutes(minutes: number, difficultyWeight: number): number {
  return Math.round(minutes * MIN_RATE * difficultyWeight);
}

function c(minutes: number, d: Difficulty): { cost: number; minutes: number; difficultyWeight: number } {
  return { cost: costFromMinutes(minutes, DIFFICULTY[d]), minutes, difficultyWeight: DIFFICULTY[d] };
}

export interface RateItem {
  name: string;
  unit: string;
  cost: number;
  minutes?: number;
  difficultyWeight?: number;
}

export interface AIRate {
  name: string;
  unit: string;
  laborCost: number;
  attemptGroups: AttemptGroup[];
}

export const RATES = {
  image: {
    research:      { name: "소스 리서치",        unit: "1건", ...c(60, "low") },
    resize:        { name: "사이즈 변경",         unit: "1장", ...c(5,  "low") },
    removeBg:      { name: "배경 제거(누끼)",     unit: "1장", ...c(20, "mid") },
    separate:      { name: "소스 분리",           unit: "1장", ...c(180,"mid") },
    reposition:    { name: "소스 재배치",         unit: "1장", ...c(30, "mid") },
    composite:     { name: "합성",               unit: "1장", ...c(10, "mid") },
    text:          { name: "텍스트 추가",         unit: "1장", ...c(10, "mid") },
    designElement: { name: "디자인 요소 추가",    unit: "1장", ...c(10, "mid") },
  },
  video: {
    cutEdit:  { name: "컷 편집",   unit: "1분", ...c(5,  "low") },
    subtitle: { name: "자막 삽입", unit: "1분", ...c(10, "low") },
  },
  motion: {
    rolling:            { name: "롤링",          unit: "1장", ...c(5, "low") },
    transitionBasic:    { name: "화면전환 기본",   unit: "1건", ...c(5,   "low")  },
    transitionAdvanced: { name: "화면전환 고급",   unit: "1건", ...c(30,  "mid")  },
    entranceBasic:      { name: "등장효과 기본",   unit: "1건", ...c(10,  "low")  },
    entranceAdvanced:   { name: "등장효과 고급",   unit: "1건", ...c(45,  "high") },
    emphasisBasic:      { name: "강조효과 기본",   unit: "1건", ...c(10,  "low")  },
    emphasisAdvanced:   { name: "강조효과 고급",   unit: "1건", ...c(45,  "mid")  },
    specialBasic:       { name: "특수효과 기본",   unit: "1건", ...c(5,   "mid")  },
    specialAdvanced:    { name: "특수효과 고급",   unit: "1건", ...c(150, "high") },
    animationBasic:     { name: "애니메이션 기본", unit: "1건", ...c(10,  "low")  },
    animationAdvanced:  { name: "애니메이션 고급", unit: "1건", ...c(165, "high") },
  },
  videoWall: {
    basic:    { name: "비디오월 기본", unit: "1건", ...c(5,  "low") },
    advanced: { name: "비디오월 고급", unit: "1건", ...c(30, "low") },
  },
  render: {
    fhd:        { name: "FHD 출력",  unit: "1분", ...c(2, "low") },
    k4:         { name: "4K 출력",   unit: "1분", ...c(3, "mid") },
    mp4Convert: { name: "MP4 변환",  unit: "1분", ...c(2, "low") },
    usb:        { name: "USB 변환",  unit: "1개", ...c(5, "low") },
  },
  planning: {
    // 기획 및 리서치: 480분(하) — 이제 모든 견적에 자동 포함되지 않으며, 6단계 "항목 추가"에서 수동으로 추가한다.
    research:     { name: "기획 및 리서치", unit: "1식", ...c(480, "low") },
    // 프롬프트 설계: 240분(중) — AI 이미지/영상 생성을 선택했을 때만 지금처럼 자동 포함된다.
    promptDesign: { name: "프롬프트 설계", unit: "1식", ...c(240, "mid") },
  },
} as const;

export const AI_RATES: { image: AIRate; video: AIRate } = {
  image: {
    name: "AI 이미지 생성",
    unit: "1건",
    // 플랜티엠_콘텐츠제작단가표_260701 'AI 이미지 생성 견적 예시(이미지 1장 제작)' 기준
    // 생성·선별 3,917.5(10분,하) + 후보정·합성 11,752.5(20분,중) = 15,670(작업비)
    laborCost: 15670,
    attemptGroups: [
      { label: "이미지 생성 시도", count: 10, costPerAttempt: 130 },
    ],
  },
  video: {
    name: "AI 영상 생성",
    unit: "1건",
    // 글로리서울 견적서(260702) 'AI 영상 생성(입구패널영상)' 실 청구 기준
    // 생성·선별 1,880,400 + 후보정·합성 2,820,600 = 4,701,000(작업비)
    laborCost: 4701000,
    attemptGroups: [
      // (Gemini API 월간 예산 및 비용 시뮬레이터_수정 기준, 환율 1,550원/USD, 2026-07-01)
      { label: "참고이미지 생성 시도", count: 240, costPerAttempt: 130 },
      { label: "영상 생성 시도", count: 480, costPerAttempt: 2170 },
    ],
  },
};
```

- [ ] **Step 4: 테스트 재실행해서 rates 테스트 통과 확인**

Run: `npx jest __tests__/rates.test.ts`
Expected: PASS (전부)

- [ ] **Step 5: `lib/calculate.ts` 전체를 아래 내용으로 교체**

```ts
import type { QuoteInput, QuoteResult, LineItem, CategorySummary } from "@/lib/types";
import { RATES, AI_RATES, type RateItem, type AIRate } from "@/lib/rates";

function item(
  category: LineItem["category"],
  rate: RateItem,
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
    minutes: rate.minutes,
    difficultyWeight: rate.difficultyWeight,
  };
}

function aiItem(category: "ai-image" | "ai-video", rate: AIRate, quantity: number): LineItem {
  const usageFee = rate.attemptGroups.reduce((s, g) => s + g.count * g.costPerAttempt, 0);
  const unitCost = rate.laborCost + usageFee;
  return {
    category,
    name: rate.name,
    unit: rate.unit,
    quantity,
    unitCost,
    totalCost: unitCost * quantity,
    laborCost: rate.laborCost,
    attemptGroups: rate.attemptGroups,
  };
}

export function recalcResult(lineItems: LineItem[], marginRate: number): QuoteResult {
  const costSubtotal = lineItems.reduce((s, i) => s + i.totalCost, 0);
  const marginAmount = Math.round(costSubtotal * marginRate / 100);
  const totalPrice = costSubtotal + marginAmount;
  return { lineItems, costSubtotal, marginAmount, totalPrice, categorySummary: buildSummary(lineItems) };
}

function buildSummary(items: LineItem[]): CategorySummary[] {
  const map: Record<string, number> = {};
  const labels: Record<LineItem["category"], string> = {
    planning: "기획",
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
  const push = (line: LineItem) => { items.push(line); };

  const p = input.panelInfo.count;
  const durationMin = Math.max(1, Math.ceil((input.videoDetails?.durationSeconds ?? 0) / 60));

  if (input.contentTypes.includes("ai-image") || input.contentTypes.includes("ai-video")) {
    push(item("planning", RATES.planning.promptDesign, 1, false, 1));
  }

  if (input.contentTypes.includes("image") && input.imageDetails) {
    const img = input.imageDetails;
    const n = img.imageCount;

    if (!img.hasSource) {
      push(item("image", RATES.image.research, 1, false, 1));
    }
    if (img.tasks.includes("resize") && n > 0) {
      push(item("image", RATES.image.resize, n, false, 1));
    }
    if (img.tasks.includes("remove-bg"))
      push(item("image", RATES.image.removeBg, n, false, 1));
    if (img.tasks.includes("separate"))
      push(item("image", RATES.image.separate, n, false, 1));
    if (img.tasks.includes("reposition"))
      push(item("image", RATES.image.reposition, n, false, 1));
    if (img.tasks.includes("composite"))
      push(item("image", RATES.image.composite, n, false, 1));
    if (img.tasks.includes("text"))
      push(item("image", RATES.image.text, n, false, 1));
    if (img.tasks.includes("design-element"))
      push(item("image", RATES.image.designElement, n, false, 1));
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
    push(aiItem("ai-image", AI_RATES.image, input.aiImageDetails.count));
  }

  if (input.contentTypes.includes("ai-video") && input.aiVideoDetails.count > 0) {
    push(aiItem("ai-video", AI_RATES.video, input.aiVideoDetails.count));
  }

  const filteredItems = items.filter(i => i.quantity > 0 && i.totalCost > 0);

  return recalcResult(filteredItems, input.marginRate);
}
```

이 변경으로: (a) "예상 제작일정" 배율 재조정 블록이 완전히 삭제됨, (b) "기획 및 리서치" 자동 포함 블록이 삭제됨(프롬프트 설계는 유지), (c) 일반 항목은 `minutes`/`difficultyWeight`를, AI 항목은 `laborCost`/`attemptGroups`를 갖고 반환됨.

- [ ] **Step 6: `__tests__/calculate.test.ts`를 아래 내용으로 교체**

```ts
import { calculateQuote } from "@/lib/calculate";
import type { QuoteInput } from "@/lib/types";

const baseInput: QuoteInput = {
  basicInfo: { companyName: "테스트업체", contactName: "홍길동", projectName: "테스트", date: "2026-05-14" },
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

describe("calculateQuote", () => {
  test("콘텐츠 없으면 합계 0", () => {
    const result = calculateQuote(baseInput);
    expect(result.costSubtotal).toBe(0);
    expect(result.totalPrice).toBe(0);
  });

  test("소스 없는 이미지 → 소스 리서치 23,505원 포함", () => {
    const input: QuoteInput = {
      ...baseInput,
      contentTypes: ["image"],
      imageDetails: { hasSource: false, imageCount: 1, tasks: [] },
    };
    const result = calculateQuote(input);
    const item = result.lineItems.find((i) => i.name === "소스 리서치");
    expect(item).toBeDefined();
    expect(item!.totalCost).toBe(23505);
  });

  test("배경 제거 2장 → 11,753 × 2", () => {
    const input: QuoteInput = {
      ...baseInput,
      contentTypes: ["image"],
      imageDetails: { hasSource: true, imageCount: 2, tasks: ["remove-bg"] },
    };
    const result = calculateQuote(input);
    const item = result.lineItems.find((i) => i.name === "배경 제거(누끼)");
    expect(item).toBeDefined();
    expect(item!.totalCost).toBe(11753 * 2);
  });

  test("마진 30% → totalPrice = costSubtotal × 1.3", () => {
    const input: QuoteInput = {
      ...baseInput,
      contentTypes: ["image"],
      imageDetails: { hasSource: false, imageCount: 1, tasks: [] },
      marginRate: 30,
    };
    const result = calculateQuote(input);
    expect(result.marginAmount).toBe(Math.round(result.costSubtotal * 0.3));
    expect(result.totalPrice).toBe(result.costSubtotal + result.marginAmount);
  });

  test("패널 수가 늘어도 이미지 작업 비용은 그대로 (이미지 수만 반영)", () => {
    const input: QuoteInput = {
      ...baseInput,
      panelInfo: { count: 2, size: "55인치", orientation: "horizontal", resolution: "fhd", isVideoWall: false },
      contentTypes: ["image"],
      imageDetails: { hasSource: true, imageCount: 1, tasks: ["remove-bg"] },
    };
    const result = calculateQuote(input);
    const item = result.lineItems.find((i) => i.name === "배경 제거(누끼)");
    expect(item!.totalCost).toBe(11753);
  });

  test("사이즈 변경 4장 → 1,959 × 4 (1장 단가, 2026-08-04 단가표 기준 5분)", () => {
    const input: QuoteInput = {
      ...baseInput,
      contentTypes: ["image"],
      imageDetails: { hasSource: true, imageCount: 4, tasks: ["resize"] },
    };
    const result = calculateQuote(input);
    const item = result.lineItems.find((i) => i.name === "사이즈 변경");
    expect(item!.totalCost).toBe(1959 * 4);
    expect(item!.minutes).toBe(5);
    expect(item!.difficultyWeight).toBe(1.0);
  });

  test("등장효과 기본 3건 → 3,918 × 3", () => {
    const input: QuoteInput = {
      ...baseInput,
      contentTypes: ["video"],
      videoDetails: {
        ...baseInput.videoDetails,
        durationSeconds: 60,
        entrance: "basic",
        entranceCount: 3,
        renderQuality: "fhd",
      },
    };
    const result = calculateQuote(input);
    const item = result.lineItems.find((i) => i.name === "등장효과 기본");
    expect(item!.totalCost).toBe(3918 * 3);
  });

  test("AI 이미지 2건 → 16,970 × 2, laborCost/attemptGroups 포함", () => {
    const input: QuoteInput = {
      ...baseInput,
      contentTypes: ["ai-image"],
      aiImageDetails: { count: 2 },
    };
    const result = calculateQuote(input);
    const item = result.lineItems.find((i) => i.name === "AI 이미지 생성");
    expect(item!.totalCost).toBe(16970 * 2);
    expect(item!.laborCost).toBe(15670);
    expect(item!.attemptGroups).toEqual([{ label: "이미지 생성 시도", count: 10, costPerAttempt: 130 }]);
  });

  test("AI 영상 항목은 참고이미지·영상 생성 시도 두 그룹을 모두 가짐", () => {
    const input: QuoteInput = {
      ...baseInput,
      contentTypes: ["ai-video"],
      aiVideoDetails: { count: 1 },
    };
    const result = calculateQuote(input);
    const item = result.lineItems.find((i) => i.name === "AI 영상 생성");
    expect(item!.attemptGroups).toHaveLength(2);
    expect(item!.attemptGroups!.map(g => g.label)).toEqual(["참고이미지 생성 시도", "영상 생성 시도"]);
  });

  test("categorySummary에 이미지·AI 카테고리 집계", () => {
    const input: QuoteInput = {
      ...baseInput,
      contentTypes: ["image", "ai-image"],
      imageDetails: { hasSource: false, imageCount: 1, tasks: [] },
      aiImageDetails: { count: 1 },
    };
    const result = calculateQuote(input);
    const labels = result.categorySummary.map((c) => c.label);
    expect(labels).toContain("이미지 제작");
    expect(labels).toContain("AI 이미지 생성");
  });

  test("예상 제작일정을 입력해도 costSubtotal이 변하지 않음 (재조정 로직 삭제 회귀 확인)", () => {
    const input: QuoteInput = {
      ...baseInput,
      contentTypes: ["image"],
      imageDetails: { hasSource: false, imageCount: 1, tasks: ["remove-bg"] },
    };
    const withoutSchedule = calculateQuote(input);
    const with10Days = calculateQuote({ ...input, expectedScheduleDays: 10 });
    const with1Day = calculateQuote({ ...input, expectedScheduleDays: 1 });
    expect(with10Days.costSubtotal).toBe(withoutSchedule.costSubtotal);
    expect(with1Day.costSubtotal).toBe(withoutSchedule.costSubtotal);
  });

  test("같은 항목(배경 제거)은 이미지만 있는 견적과 이미지+영상이 함께 있는 견적에서 금액이 동일함", () => {
    const imageOnly: QuoteInput = {
      ...baseInput,
      contentTypes: ["image"],
      imageDetails: { hasSource: true, imageCount: 3, tasks: ["remove-bg"] },
    };
    const imageAndVideo: QuoteInput = {
      ...imageOnly,
      contentTypes: ["image", "video"],
      videoDetails: { ...baseInput.videoDetails, durationSeconds: 120, cutEdit: true, subtitle: true },
    };
    const a = calculateQuote(imageOnly).lineItems.find(i => i.name === "배경 제거(누끼)")!.totalCost;
    const b = calculateQuote(imageAndVideo).lineItems.find(i => i.name === "배경 제거(누끼)")!.totalCost;
    expect(a).toBe(b);
  });

  test("선택된 항목 없이 일정만 입력해도 에러 없이 0원", () => {
    const result = calculateQuote({ ...baseInput, expectedScheduleDays: 20 });
    expect(result.costSubtotal).toBe(0);
    expect(result.totalPrice).toBe(0);
  });

  test("콘텐츠 유형을 선택해도 기획 및 리서치 항목은 더 이상 자동 포함되지 않음", () => {
    const input: QuoteInput = {
      ...baseInput,
      contentTypes: ["image"],
      imageDetails: { hasSource: false, imageCount: 1, tasks: [] },
    };
    const result = calculateQuote(input);
    expect(result.lineItems.find((i) => i.name === "기획 및 리서치")).toBeUndefined();
  });

  test("AI 콘텐츠를 선택하지 않으면 프롬프트 설계 항목은 없음", () => {
    const input: QuoteInput = {
      ...baseInput,
      contentTypes: ["image"],
      imageDetails: { hasSource: false, imageCount: 1, tasks: [] },
    };
    const result = calculateQuote(input);
    expect(result.lineItems.find((i) => i.name === "프롬프트 설계")).toBeUndefined();
  });

  test("AI 콘텐츠를 선택하면 프롬프트 설계 항목이 여전히 자동으로 추가됨", () => {
    const input: QuoteInput = {
      ...baseInput,
      contentTypes: ["ai-image"],
      aiImageDetails: { count: 1 },
    };
    const result = calculateQuote(input);
    const prompt = result.lineItems.find((i) => i.name === "프롬프트 설계");
    expect(prompt).toBeDefined();
    expect(prompt!.totalCost).toBe(141030);
  });
});
```

- [ ] **Step 7: 전체 테스트 실행해서 통과 확인**

Run: `npx jest __tests__/rates.test.ts __tests__/calculate.test.ts`
Expected: PASS (전부)

- [ ] **Step 8: 커밋**

```bash
git add lib/rates.ts lib/calculate.ts __tests__/rates.test.ts __tests__/calculate.test.ts
git commit -m "fix: remove schedule-based cost rescaling, expose per-item time and AI attempt counts"
```

---

## Task 3: `lib/catalog.ts` — 카탈로그 항목에도 소요시간/AI 시도건수 필드 전달

**Files:**
- Modify: `lib/catalog.ts`
- Create: `__tests__/catalog.test.ts`

**Interfaces:**
- Consumes: `RATES`, `AI_RATES`, `RateItem`, `AIRate` (Task 2, `@/lib/rates`), `AttemptGroup` (Task 1, `@/lib/types`)
- Produces: `CatalogItem { category; name; unit; unitCost; minutes?; difficultyWeight?; laborCost?; attemptGroups? }`, `getCatalog(): CatalogItem[]`

- [ ] **Step 1: 실패하는 테스트 작성 — `__tests__/catalog.test.ts`**

```ts
import { getCatalog } from "@/lib/catalog";

describe("getCatalog", () => {
  test("AI 이미지 항목은 laborCost와 attemptGroups를 포함", () => {
    const aiImage = getCatalog().find(c => c.category === "ai-image");
    expect(aiImage?.laborCost).toBe(15670);
    expect(aiImage?.attemptGroups?.[0]).toEqual({ label: "이미지 생성 시도", count: 10, costPerAttempt: 130 });
    expect(aiImage?.unitCost).toBe(16970);
  });

  test("일반 항목(사이즈 변경)은 minutes와 difficultyWeight를 포함", () => {
    const resize = getCatalog().find(c => c.category === "image" && c.name === "사이즈 변경");
    expect(resize?.minutes).toBe(5);
    expect(resize?.difficultyWeight).toBe(1.0);
    expect(resize?.unitCost).toBe(1959);
  });

  test("기획 및 리서치 항목이 카탈로그에 존재 (더 이상 자동 포함되지 않으므로 수동 추가용)", () => {
    const research = getCatalog().find(c => c.category === "planning" && c.name === "기획 및 리서치");
    expect(research).toBeDefined();
    expect(research?.unitCost).toBe(188040);
  });
});
```

- [ ] **Step 2: 테스트 실행해서 실패 확인**

Run: `npx jest __tests__/catalog.test.ts`
Expected: FAIL (`unitCost`가 기존 계산식(`cost + usageFee`)이라 AI 쪽 필드가 없어서 `laborCost`/`attemptGroups`가 `undefined`)

- [ ] **Step 3: `lib/catalog.ts` 전체를 아래 내용으로 교체**

```ts
import type { LineItem, AttemptGroup } from "@/lib/types";
import { RATES, AI_RATES, type RateItem, type AIRate } from "@/lib/rates";

export interface CatalogItem {
  category: LineItem["category"];
  name: string;
  unit: string;
  unitCost: number;
  minutes?: number;
  difficultyWeight?: number;
  laborCost?: number;
  attemptGroups?: AttemptGroup[];
}

function toCatalogItem(category: LineItem["category"], rate: RateItem): CatalogItem {
  return {
    category,
    name: rate.name,
    unit: rate.unit,
    unitCost: rate.cost,
    minutes: rate.minutes,
    difficultyWeight: rate.difficultyWeight,
  };
}

function toAICatalogItem(category: "ai-image" | "ai-video", rate: AIRate): CatalogItem {
  const usageFee = rate.attemptGroups.reduce((s, g) => s + g.count * g.costPerAttempt, 0);
  return {
    category,
    name: rate.name,
    unit: rate.unit,
    unitCost: rate.laborCost + usageFee,
    laborCost: rate.laborCost,
    attemptGroups: rate.attemptGroups,
  };
}

export function getCatalog(): CatalogItem[] {
  const list: CatalogItem[] = [];
  Object.values(RATES.planning).forEach(r => list.push(toCatalogItem("planning", r)));
  Object.values(RATES.image).forEach(r => list.push(toCatalogItem("image", r)));
  Object.values(RATES.video).forEach(r => list.push(toCatalogItem("video", r)));
  Object.values(RATES.motion).forEach(r => list.push(toCatalogItem("motion", r)));
  Object.values(RATES.videoWall).forEach(r => list.push(toCatalogItem("motion", r)));
  Object.values(RATES.render).forEach(r => list.push(toCatalogItem("render", r)));
  list.push(toAICatalogItem("ai-image", AI_RATES.image));
  list.push(toAICatalogItem("ai-video", AI_RATES.video));
  return list;
}
```

- [ ] **Step 4: 테스트 재실행해서 통과 확인**

Run: `npx jest __tests__/catalog.test.ts`
Expected: PASS (전부)

- [ ] **Step 5: 커밋**

```bash
git add lib/catalog.ts __tests__/catalog.test.ts
git commit -m "feat: carry minutes/attemptGroups through catalog items"
```

---

## Task 4: `components/steps/Step5Margin.tsx` — 안내 문구를 참고용으로 수정

**Files:**
- Modify: `components/steps/Step5Margin.tsx:58`

**Interfaces:**
- Consumes: 없음 (문구만 변경, props/로직 변경 없음)

- [ ] **Step 1: 안내 문구 교체**

`components/steps/Step5Margin.tsx`에서:

```tsx
<p className="text-[12px] text-slate-400 mt-2">입력하지 않으면 항목별 기본 단가로 자동 계산됩니다. 입력하면 선택한 항목들의 비율은 유지한 채 전체 금액이 이 일정에 맞춰 재조정됩니다.</p>
```

다음으로 교체:

```tsx
<p className="text-[12px] text-slate-400 mt-2">참고용으로만 기재되며, 항목별 금액에는 영향을 주지 않습니다.</p>
```

- [ ] **Step 2: 타입 검사로 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add components/steps/Step5Margin.tsx
git commit -m "docs: clarify expected schedule input no longer affects pricing"
```

---

## Task 5: `components/QuoteTable.tsx` — 소요시간/AI 시도건수 편집 열 추가

**Files:**
- Modify: `components/QuoteTable.tsx`

**Interfaces:**
- Consumes: `LineItem.minutes/difficultyWeight/laborCost/attemptGroups` (Task 1), `CatalogItem.minutes/...` (Task 3)
- Produces: `QuoteTable` props에 `onUpdateMinutes?: (index: number, minutes: number) => void;`, `onUpdateAttemptCount?: (index: number, groupIndex: number, count: number) => void;` 추가 — Task 6(`Step6Result.tsx`)에서 이 두 콜백을 구현해서 넘긴다.

- [ ] **Step 1: `fmt` 아래에 난이도 라벨 헬퍼 추가**

`const fmt = (n: number) => ...` 줄 바로 아래에 추가:

```tsx
const diffLabel = (w?: number) => (w === 2 ? "상 ×2.0" : w === 1.5 ? "중 ×1.5" : w === 1 ? "하 ×1.0" : "");
```

- [ ] **Step 2: `Props` 인터페이스에 콜백 2개 추가**

```tsx
interface Props {
  result: QuoteResult;
  input?: QuoteInput;
  editable?: boolean;
  catalog?: CatalogItem[];
  onUpdateQuantity?: (index: number, quantity: number) => void;
  onUpdateMinutes?: (index: number, minutes: number) => void;
  onUpdateAttemptCount?: (index: number, groupIndex: number, count: number) => void;
  onRemoveItem?: (index: number) => void;
  onAddItem?: (catalogItem: CatalogItem, quantity: number) => void;
}
```

함수 시그니처도 맞춰서 구조분해에 추가:

```tsx
export default function QuoteTable({ result, input, editable, catalog, onUpdateQuantity, onUpdateMinutes, onUpdateAttemptCount, onRemoveItem, onAddItem }: Props) {
```

- [ ] **Step 3: `colCount`를 1 늘리고, 헤더에 열 추가**

```tsx
const colCount = editable ? 7 : 6;
```

헤더 `<tr>` 안, "수량" `<th>` 다음·"단가" `<th>` 이전에 추가:

```tsx
<th className="px-4 py-4 text-[11px] font-bold text-slate-400 text-center w-[150px]">소요시간/건수</th>
```

- [ ] **Step 4: 항목 행에 소요시간/건수 셀 추가**

"수량" `<td>` 다음, "단가" `<td>` 이전에 추가:

```tsx
<td className="px-4 py-4 text-center">
  {lineItem.minutes !== undefined && lineItem.difficultyWeight !== undefined ? (
    <div className="flex flex-col items-center gap-0.5">
      {editable ? (
        <input
          type="number"
          min={0}
          value={lineItem.minutes}
          onChange={e => onUpdateMinutes?.(index, Math.max(0, Number(e.target.value)))}
          className="w-16 text-center bg-slate-50 rounded-lg py-1 outline-none focus:ring-2 focus:ring-primary/30 font-bold text-slate-800"
        />
      ) : (
        <span className="text-[12px] font-bold text-slate-800">{lineItem.minutes}분</span>
      )}
      <span className="text-[10px] text-slate-400">{diffLabel(lineItem.difficultyWeight)}</span>
    </div>
  ) : lineItem.attemptGroups ? (
    <div className="space-y-1">
      {lineItem.attemptGroups.map((g, gi) => (
        <div key={gi} className="flex items-center justify-center gap-1">
          <span className="text-[10px] text-slate-400">{g.label}</span>
          {editable ? (
            <input
              type="number"
              min={0}
              value={g.count}
              onChange={e => onUpdateAttemptCount?.(index, gi, Math.max(0, Number(e.target.value)))}
              className="w-12 text-center bg-slate-50 rounded-lg py-0.5 outline-none focus:ring-2 focus:ring-primary/30 font-bold text-slate-800 text-[12px]"
            />
          ) : (
            <span className="text-[12px] font-bold text-slate-800">{g.count}</span>
          )}
          <span className="text-[10px] text-slate-400">건</span>
        </div>
      ))}
    </div>
  ) : (
    <span className="text-slate-300">-</span>
  )}
</td>
```

- [ ] **Step 5: 하단 안내 문구를 참고용 문구로 교체**

```tsx
{input?.expectedScheduleDays ? (
  <span className="block mt-1">본 견적은 예상 제작일정 {input.expectedScheduleDays}일 기준으로 항목별 금액이 비율에 맞춰 재조정되었습니다.</span>
) : null}
```

다음으로 교체:

```tsx
{input?.expectedScheduleDays ? (
  <span className="block mt-1">예상 제작일정 {input.expectedScheduleDays}일은 참고용으로 기재된 값이며, 항목별 금액에는 반영되지 않았습니다.</span>
) : null}
```

- [ ] **Step 6: 타입 검사로 확인 (아직 Step6Result.tsx가 새 props를 넘기지 않아도 optional이라 에러 없어야 함)**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 7: 커밋**

```bash
git add components/QuoteTable.tsx
git commit -m "feat: add editable time/attempt-count column to internal quote table"
```

---

## Task 6: `components/steps/Step6Result.tsx` — 소요시간/건수 수정 핸들러 연결

**Files:**
- Modify: `components/steps/Step6Result.tsx`

**Interfaces:**
- Consumes: `costFromMinutes` (Task 2, `@/lib/rates`), `QuoteTable`의 `onUpdateMinutes`/`onUpdateAttemptCount` props (Task 5), `CatalogItem`의 확장 필드 (Task 3)

- [ ] **Step 1: import에 `costFromMinutes` 추가**

```tsx
import { recalcResult } from "@/lib/calculate";
```

다음으로 교체:

```tsx
import { recalcResult } from "@/lib/calculate";
import { costFromMinutes } from "@/lib/rates";
```

- [ ] **Step 2: `updateQuantity`와 `removeItem` 사이에 `updateMinutes`, `updateAttemptCount` 추가**

```tsx
const updateQuantity = (index: number, quantity: number) => {
  setItems(prev => prev.map((it, i) => i === index ? { ...it, quantity, totalCost: Math.round(it.unitCost * quantity) } : it));
};
const removeItem = (index: number) => {
```

다음으로 교체:

```tsx
const updateQuantity = (index: number, quantity: number) => {
  setItems(prev => prev.map((it, i) => i === index ? { ...it, quantity, totalCost: Math.round(it.unitCost * quantity) } : it));
};
const updateMinutes = (index: number, minutes: number) => {
  setItems(prev => prev.map((it, i) => {
    if (i !== index || it.difficultyWeight === undefined) return it;
    const unitCost = costFromMinutes(minutes, it.difficultyWeight);
    return { ...it, minutes, unitCost, totalCost: Math.round(unitCost * it.quantity) };
  }));
};
const updateAttemptCount = (index: number, groupIndex: number, count: number) => {
  setItems(prev => prev.map((it, i) => {
    if (i !== index || !it.attemptGroups) return it;
    const attemptGroups = it.attemptGroups.map((g, gi) => gi === groupIndex ? { ...g, count } : g);
    const usageFee = attemptGroups.reduce((s, g) => s + g.count * g.costPerAttempt, 0);
    const unitCost = (it.laborCost ?? 0) + usageFee;
    return { ...it, attemptGroups, unitCost, totalCost: Math.round(unitCost * it.quantity) };
  }));
};
const removeItem = (index: number) => {
```

- [ ] **Step 3: `addItem`이 새 필드를 함께 담도록 수정**

```tsx
const addItem = (catalogItem: CatalogItem, quantity: number) => {
  setItems(prev => [...prev, {
    category: catalogItem.category,
    name: catalogItem.name,
    unit: catalogItem.unit,
    quantity,
    unitCost: catalogItem.unitCost,
    totalCost: Math.round(catalogItem.unitCost * quantity),
  }]);
};
```

다음으로 교체:

```tsx
const addItem = (catalogItem: CatalogItem, quantity: number) => {
  setItems(prev => [...prev, {
    category: catalogItem.category,
    name: catalogItem.name,
    unit: catalogItem.unit,
    quantity,
    unitCost: catalogItem.unitCost,
    totalCost: Math.round(catalogItem.unitCost * quantity),
    minutes: catalogItem.minutes,
    difficultyWeight: catalogItem.difficultyWeight,
    laborCost: catalogItem.laborCost,
    attemptGroups: catalogItem.attemptGroups,
  }]);
};
```

- [ ] **Step 4: `<QuoteTable>` 호출에 새 콜백 2개 전달**

```tsx
<QuoteTable
  result={editableResult}
  input={input}
  editable
  catalog={catalog}
  onUpdateQuantity={updateQuantity}
  onRemoveItem={removeItem}
  onAddItem={addItem}
/>
```

다음으로 교체:

```tsx
<QuoteTable
  result={editableResult}
  input={input}
  editable
  catalog={catalog}
  onUpdateQuantity={updateQuantity}
  onUpdateMinutes={updateMinutes}
  onUpdateAttemptCount={updateAttemptCount}
  onRemoveItem={removeItem}
  onAddItem={addItem}
/>
```

- [ ] **Step 5: 타입 검사로 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 6: 커밋**

```bash
git add components/steps/Step6Result.tsx
git commit -m "feat: wire time/attempt-count edit handlers into Step6Result"
```

---

## Task 7: `components/PDFDocumentInternal.tsx` — 내부용 PDF에도 소요시간/건수 표시

**Files:**
- Modify: `components/PDFDocumentInternal.tsx`

**Interfaces:**
- Consumes: `LineItem.minutes/attemptGroups` (Task 1)

- [ ] **Step 1: 스타일에 새 열 스타일 추가**

```tsx
hName:     { flex: 1,    fontSize: 8, color: "#9ca3af" },
hUnit:     { width: 50,  fontSize: 8, color: "#9ca3af", textAlign: "center" },
hQty:      { width: 35,  fontSize: 8, color: "#9ca3af", textAlign: "center" },
hUnitCost: { width: 85,  fontSize: 8, color: "#9ca3af", textAlign: "right" },
hTotal:    { width: 85,  fontSize: 8, color: "#9ca3af", textAlign: "right" },
```

다음으로 교체:

```tsx
hName:     { flex: 1,    fontSize: 8, color: "#9ca3af" },
hUnit:     { width: 50,  fontSize: 8, color: "#9ca3af", textAlign: "center" },
hQty:      { width: 35,  fontSize: 8, color: "#9ca3af", textAlign: "center" },
hTime:     { width: 90,  fontSize: 8, color: "#9ca3af", textAlign: "center" },
hUnitCost: { width: 80,  fontSize: 8, color: "#9ca3af", textAlign: "right" },
hTotal:    { width: 80,  fontSize: 8, color: "#9ca3af", textAlign: "right" },
```

그리고:

```tsx
cName:     { flex: 1,   fontSize: 9, color: "#1f2937" },
cUnit:     { width: 50, fontSize: 9, color: "#9ca3af", textAlign: "center" },
cQty:      { width: 35, fontSize: 9, color: "#1f2937", fontWeight: "bold", textAlign: "center" },
cUnitCost: { width: 85, fontSize: 9, color: "#9ca3af", textAlign: "right" },
cTotal:    { width: 85, fontSize: 9, color: "#111827", fontWeight: "bold", textAlign: "right" },
```

다음으로 교체:

```tsx
cName:     { flex: 1,   fontSize: 9, color: "#1f2937" },
cUnit:     { width: 50, fontSize: 9, color: "#9ca3af", textAlign: "center" },
cQty:      { width: 35, fontSize: 9, color: "#1f2937", fontWeight: "bold", textAlign: "center" },
cTime:     { width: 90, fontSize: 8, color: "#1f2937", textAlign: "center" },
cUnitCost: { width: 80, fontSize: 9, color: "#9ca3af", textAlign: "right" },
cTotal:    { width: 80, fontSize: 9, color: "#111827", fontWeight: "bold", textAlign: "right" },
```

- [ ] **Step 2: `fmt` 아래에 소요시간/건수 표시 헬퍼 추가**

```tsx
const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(Math.round(n)) + "원";
```

다음으로 교체:

```tsx
const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(Math.round(n)) + "원";

const timeOrAttempts = (li: LineItem): string => {
  if (li.minutes !== undefined) return `${li.minutes}분`;
  if (li.attemptGroups) return li.attemptGroups.map(g => `${g.label} ${g.count}건`).join("\n");
  return "-";
};
```

- [ ] **Step 3: 헤더 행에 열 추가**

```tsx
<View style={s.headerRow}>
  <Text style={s.hName}>작업 항목</Text>
  <Text style={s.hUnit}>기준</Text>
  <Text style={s.hQty}>수량</Text>
  <Text style={s.hUnitCost}>단가</Text>
  <Text style={s.hTotal}>합계</Text>
</View>
```

다음으로 교체:

```tsx
<View style={s.headerRow}>
  <Text style={s.hName}>작업 항목</Text>
  <Text style={s.hUnit}>기준</Text>
  <Text style={s.hQty}>수량</Text>
  <Text style={s.hTime}>소요시간/건수</Text>
  <Text style={s.hUnitCost}>단가</Text>
  <Text style={s.hTotal}>합계</Text>
</View>
```

- [ ] **Step 4: 항목 행에 열 추가**

```tsx
<View key={i} style={s.row}>
  <Text style={s.cName}>{lineItem.name}</Text>
  <Text style={s.cUnit}>{lineItem.unit}</Text>
  <Text style={s.cQty}>{lineItem.quantity}</Text>
  <Text style={s.cUnitCost}>{fmt(lineItem.unitCost)}</Text>
  <Text style={s.cTotal}>{fmt(lineItem.totalCost)}</Text>
</View>
```

다음으로 교체:

```tsx
<View key={i} style={s.row}>
  <Text style={s.cName}>{lineItem.name}</Text>
  <Text style={s.cUnit}>{lineItem.unit}</Text>
  <Text style={s.cQty}>{lineItem.quantity}</Text>
  <Text style={s.cTime}>{timeOrAttempts(lineItem)}</Text>
  <Text style={s.cUnitCost}>{fmt(lineItem.unitCost)}</Text>
  <Text style={s.cTotal}>{fmt(lineItem.totalCost)}</Text>
</View>
```

- [ ] **Step 5: 안내 문구를 참고용 문구로 교체**

```tsx
{input.expectedScheduleDays ? `\n본 견적은 예상 제작일정 ${input.expectedScheduleDays}일 기준으로 항목별 금액이 비율에 맞춰 재조정되었습니다.` : ""}
```

다음으로 교체:

```tsx
{input.expectedScheduleDays ? `\n예상 제작일정 ${input.expectedScheduleDays}일은 참고용으로 기재된 값이며, 항목별 금액에는 반영되지 않았습니다.` : ""}
```

- [ ] **Step 6: 타입 검사로 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 7: 커밋**

```bash
git add components/PDFDocumentInternal.tsx
git commit -m "feat: show time/attempt-count column in internal PDF, clarify schedule note"
```

---

## Task 8: 최종 검증

**Files:** 없음 (검증만)

- [ ] **Step 1: 전체 테스트 스위트 실행**

Run: `npm test`
Expected: 전부 PASS

- [ ] **Step 2: 빌드 확인**

Run: `npm run build`
Expected: 에러 없이 빌드 성공

- [ ] **Step 3: 개발 서버 실행 후 브라우저에서 수동 확인**

Run: `npm run dev` (백그라운드 실행)

브라우저에서 다음을 확인한다:
1. 5단계에서 "예상 제작일정"에 숫자를 입력해도 최종 금액이 바뀌지 않는지
2. 6단계 내부용 화면에서 "소요시간(분)" 값을 바꾸면 해당 행의 단가·합계가 즉시 바뀌는지
3. AI 이미지/영상 항목이 있을 때 "○○ 생성 시도" 입력칸이 보이고, 값을 바꾸면 합계만 바뀌는지 (작업비는 고정)
4. "항목 추가"에서 "기획 및 리서치"를 검색해 추가할 수 있는지 (자동으로는 더 이상 안 들어가는지도 함께 확인)
5. 내부용 PDF 다운로드 시 소요시간/건수 열이 보이는지, 외부용 화면/PDF에는 이 열이 없는지

- [ ] **Step 4: 문제 없으면 최종 커밋 없음 (Task 1~7에서 이미 커밋 완료) — 남은 미커밋 변경 있으면 정리**

Run: `git status`
Expected: `working tree clean` (Task 1~7 커밋 외 남은 변경 없음)
