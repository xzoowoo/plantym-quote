# 영상 제작 견적 생성기 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 6단계 위저드 폼으로 영상 제작 요구사항을 입력하면 내부 단가표 기반 견적을 자동 산출하고, 내부용 세부 내역 + 외부용 PDF를 생성하는 Next.js 웹앱을 Vercel에 배포한다.

**Architecture:** Next.js 14 App Router 기반 SPA. 단가 계산은 순수 함수(`lib/calculate.ts`)로 처리하고, AI 분석과 PDF 생성은 Vercel Serverless API Route로 처리해 API 키를 클라이언트에 노출하지 않는다. 6단계 위저드 상태는 `app/page.tsx`의 단일 `useState`로 관리한다.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Claude API (claude-haiku-4-5-20251001), @react-pdf/renderer, Vercel

---

## 파일 구조

```
C:\Users\zoowoo\Documents\Claude\QuoteGenerator\
├── app/
│   ├── layout.tsx              # 루트 레이아웃
│   ├── globals.css             # Tailwind 임포트
│   ├── page.tsx                # 위저드 메인 (6단계 상태 관리)
│   └── api/
│       ├── analyze/route.ts    # POST: Claude AI 자유 텍스트 분석
│       └── pdf/route.ts        # POST: PDF base64 반환
├── components/
│   ├── WizardNav.tsx           # 상단 단계 진행 표시줄
│   ├── steps/
│   │   ├── Step1BasicInfo.tsx  # 업체명·담당자·프로젝트명·날짜
│   │   ├── Step2Panel.tsx      # 패널 수·사이즈·비디오월
│   │   ├── Step3ContentType.tsx# 콘텐츠 유형 체크박스
│   │   ├── Step4Details.tsx    # 유형별 세부 항목 + AI 자유 입력
│   │   ├── Step5Margin.tsx     # 마진율 입력
│   │   └── Step6Result.tsx     # 내부 세부 내역 + PDF 다운로드
│   └── QuoteTable.tsx          # 내부용 항목별 견적 테이블
├── lib/
│   ├── types.ts                # 모든 타입 정의
│   ├── rates.ts                # 단가 데이터 (엑셀 → TS)
│   └── calculate.ts            # 견적 계산 순수 함수
├── __tests__/
│   └── calculate.test.ts       # 계산 로직 단위 테스트
├── .env.local                  # ANTHROPIC_API_KEY (Vercel 환경변수)
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## Task 1: 프로젝트 초기 세팅

**Files:**
- Create: `package.json`, `next.config.ts`, `tailwind.config.ts`, `app/globals.css`, `app/layout.tsx`, `.env.local`

- [ ] **Step 1: 현재 디렉터리 확인**

```powershell
ls "C:\Users\zoowoo\Documents\Claude\QuoteGenerator"
```

Expected: `플랜티엠_콘텐츠제작단가표_260126.xlsx` 파일 보임

- [ ] **Step 2: Next.js 프로젝트 초기화**

```powershell
cd "C:\Users\zoowoo\Documents\Claude\QuoteGenerator"
npx create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"
```

프롬프트가 나오면 모두 기본값(Enter) 선택.

- [ ] **Step 3: 추가 패키지 설치**

```powershell
npm install @react-pdf/renderer @anthropic-ai/sdk
npm install -D jest @types/jest ts-jest jest-environment-node
```

- [ ] **Step 4: Jest 설정 추가**

`package.json`의 `scripts` 안에 다음을 추가한다:

```json
"test": "jest",
"test:watch": "jest --watch"
```

`package.json`에 다음 블록을 최상위에 추가한다:

```json
"jest": {
  "preset": "ts-jest",
  "testEnvironment": "node",
  "testMatch": ["**/__tests__/**/*.test.ts"],
  "moduleNameMapper": {
    "^@/(.*)$": "<rootDir>/$1"
  }
}
```

- [ ] **Step 5: `.env.local` 생성**

```
ANTHROPIC_API_KEY=여기에_실제_API_키_입력
```

실제 API 키는 https://console.anthropic.com 에서 발급.

- [ ] **Step 6: `next.config.ts` 설정**

`next.config.ts` 파일을 다음으로 교체한다:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@react-pdf/renderer"],
  },
};

export default nextConfig;
```

- [ ] **Step 7: 개발 서버 실행 확인**

```powershell
npm run dev
```

브라우저에서 `http://localhost:3000` 접속 — Next.js 기본 화면이 보이면 성공.
확인 후 터미널에서 `Ctrl+C`로 종료.

---

## Task 2: 타입 정의 (`lib/types.ts`)

**Files:**
- Create: `lib/types.ts`

- [ ] **Step 1: 타입 파일 생성**

`lib/types.ts`를 다음 내용으로 생성한다:

```typescript
export interface BasicInfo {
  companyName: string;
  contactName: string;
  projectName: string;
  date: string;
}

export interface PanelInfo {
  count: number;
  size: string;
  isVideoWall: boolean;
}

export type ContentType = "image" | "video" | "ai-image" | "ai-video";

export type ImageTask =
  | "resize"
  | "remove-bg"
  | "separate"
  | "reposition"
  | "composite"
  | "text"
  | "design-element";

export interface ImageDetails {
  hasSource: boolean;
  imageCount: number;
  tasks: ImageTask[];
}

export type EffectLevel = "none" | "basic" | "advanced";

export interface VideoDetails {
  durationSeconds: number;
  cutEdit: boolean;
  subtitle: boolean;
  rolling: boolean;
  rollingCount: number;
  transition: EffectLevel;
  transitionCount: number;
  entrance: EffectLevel;
  entranceCount: number;
  emphasis: EffectLevel;
  emphasisCount: number;
  special: EffectLevel;
  specialCount: number;
  animation: EffectLevel;
  animationCount: number;
  renderQuality: "fhd" | "4k";
  usbConvert: boolean;
}

export interface AIImageDetails {
  count: number;
}

export interface AIVideoDetails {
  count: number;
}

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
}

export interface LineItem {
  category: "image" | "video" | "motion" | "render" | "ai-image" | "ai-video";
  name: string;
  unit: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface CategorySummary {
  label: string;
  amount: number;
}

export interface QuoteResult {
  lineItems: LineItem[];
  costSubtotal: number;
  marginAmount: number;
  totalPrice: number;
  categorySummary: CategorySummary[];
}

export interface WizardState {
  step: number;
  input: QuoteInput;
  result: QuoteResult | null;
}
```

---

## Task 3: 단가 데이터 (`lib/rates.ts`)

**Files:**
- Create: `lib/rates.ts`

- [ ] **Step 1: 단가 파일 생성**

`lib/rates.ts`를 다음 내용으로 생성한다:

```typescript
const DAILY_RATE = 188040;
const MIN_RATE = DAILY_RATE / 480; // 391.75원/분

type Difficulty = "low" | "mid" | "high";
const DIFFICULTY: Record<Difficulty, number> = { low: 1.0, mid: 1.5, high: 2.0 };

function c(minutes: number, d: Difficulty): number {
  return Math.round(minutes * MIN_RATE * DIFFICULTY[d]);
}

export interface RateItem {
  name: string;
  unit: string;
  cost: number;
}

export const RATES = {
  image: {
    research:      { name: "소스 리서치",        unit: "1건", cost: c(60, "low") },  // 23,505
    resize:        { name: "사이즈 변경",         unit: "5장", cost: c(1,  "low") },  // 392 per장 → 1,959/5장
    removeBg:      { name: "배경 제거(누끼)",     unit: "1장", cost: c(20, "mid") },  // 11,753
    separate:      { name: "소스 분리",           unit: "1장", cost: c(30, "mid") },  // 17,629
    reposition:    { name: "소스 재배치",         unit: "1장", cost: c(30, "mid") },  // 17,629
    composite:     { name: "합성",               unit: "1장", cost: c(10, "mid") },  // 5,876
    text:          { name: "텍스트 추가",         unit: "1장", cost: c(10, "mid") },  // 5,876
    designElement: { name: "디자인 요소 추가",    unit: "1장", cost: c(10, "mid") },  // 5,876
  },
  video: {
    cutEdit:  { name: "컷 편집",      unit: "1분", cost: c(5,  "low") }, // 1,959
    subtitle: { name: "자막 삽입",    unit: "1분", cost: c(10, "low") }, // 3,918
    rolling:  { name: "롤링",         unit: "1장", cost: c(5,  "low") / 10 }, // 196 per장 (19,588/10장)
  },
  motion: {
    transitionBasic:    { name: "화면전환 기본",  unit: "1건", cost: c(1,   "low")  }, // 392
    transitionAdvanced: { name: "화면전환 고급",  unit: "1건", cost: c(30,  "mid")  }, // 17,629
    entranceBasic:      { name: "등장효과 기본",  unit: "1건", cost: c(10,  "low")  }, // 3,918
    entranceAdvanced:   { name: "등장효과 고급",  unit: "1건", cost: c(45,  "high") }, // 35,258
    emphasisBasic:      { name: "강조효과 기본",  unit: "1건", cost: c(10,  "low")  }, // 3,918
    emphasisAdvanced:   { name: "강조효과 고급",  unit: "1건", cost: c(45,  "mid")  }, // 26,443
    specialBasic:       { name: "특수효과 기본",  unit: "1건", cost: c(5,   "mid")  }, // 2,938
    specialAdvanced:    { name: "특수효과 고급",  unit: "1장", cost: c(150, "high") }, // 117,525
    animationBasic:     { name: "애니메이션 기본", unit: "1건", cost: c(10, "low")  }, // 3,918
    animationAdvanced:  { name: "애니메이션 고급", unit: "1건", cost: c(165,"high") }, // 129,278
  },
  videoWall: {
    basic:    { name: "비디오월 기본", unit: "1건", cost: c(5,  "low") }, // 1,959
    advanced: { name: "비디오월 고급", unit: "1건", cost: c(30, "low") }, // 11,753
  },
  render: {
    fhd:        { name: "FHD 출력",    unit: "1분", cost: c(2, "low") }, // 784
    k4:         { name: "4K 출력",     unit: "1분", cost: c(3, "mid") }, // 1,763
    mp4Convert: { name: "MP4 변환",    unit: "1분", cost: c(2, "low") }, // 784
    usb:        { name: "USB 변환",    unit: "1개", cost: c(5, "low") }, // 1,959
  },
  ai: {
    image: { name: "AI 이미지 생성", unit: "1건", cost: 43675 },
    video: { name: "AI 영상 생성",   unit: "1건", cost: 100503 },
  },
} as const;
```

---

## Task 4: 견적 계산 로직 (TDD)

**Files:**
- Create: `lib/calculate.ts`
- Create: `__tests__/calculate.test.ts`

- [ ] **Step 1: 테스트 파일 작성**

`__tests__/calculate.test.ts`를 다음 내용으로 생성한다:

```typescript
import { calculateQuote } from "@/lib/calculate";
import type { QuoteInput } from "@/lib/types";

const baseInput: QuoteInput = {
  basicInfo: { companyName: "테스트업체", contactName: "홍길동", projectName: "테스트", date: "2026-05-14" },
  panelInfo: { count: 1, size: "55인치", isVideoWall: false },
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

  test("배경 제거 2장 → 11,753 × 2 = 23,506원", () => {
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

  test("패널 2개 → 이미지 항목 비용 × 2", () => {
    const input: QuoteInput = {
      ...baseInput,
      panelInfo: { count: 2, size: "55인치", isVideoWall: false },
      contentTypes: ["image"],
      imageDetails: { hasSource: true, imageCount: 1, tasks: ["remove-bg"] },
    };
    const result = calculateQuote(input);
    const item = result.lineItems.find((i) => i.name === "배경 제거(누끼)");
    expect(item!.totalCost).toBe(11753 * 2);
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

  test("AI 이미지 2건 → 43,675 × 2", () => {
    const input: QuoteInput = {
      ...baseInput,
      contentTypes: ["ai-image"],
      aiImageDetails: { count: 2 },
    };
    const result = calculateQuote(input);
    const item = result.lineItems.find((i) => i.name === "AI 이미지 생성");
    expect(item!.totalCost).toBe(43675 * 2);
  });

  test("categorySummary에 이미지·영상·AI 카테고리 집계", () => {
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
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```powershell
npx jest --testPathPattern="calculate" --no-coverage 2>&1 | head -20
```

Expected: `Cannot find module '@/lib/calculate'` 에러

- [ ] **Step 3: `lib/calculate.ts` 구현**

`lib/calculate.ts`를 다음 내용으로 생성한다:

```typescript
import type { QuoteInput, QuoteResult, LineItem, CategorySummary } from "@/lib/types";
import { RATES } from "@/lib/rates";

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
  const p = input.panelInfo.count;
  const durationMin = Math.max(1, Math.ceil((input.videoDetails?.durationSeconds ?? 0) / 60));

  // ── 이미지 ──────────────────────────────────────────
  if (input.contentTypes.includes("image") && input.imageDetails) {
    const img = input.imageDetails;
    const n = img.imageCount;

    if (!img.hasSource) {
      items.push(item("image", RATES.image.research, 1, true, p));
    }
    if (img.tasks.includes("resize")) {
      const sets = Math.max(1, Math.ceil(n / 5));
      items.push(item("image", RATES.image.resize, sets, true, p));
    }
    if (img.tasks.includes("remove-bg"))
      items.push(item("image", RATES.image.removeBg, n, true, p));
    if (img.tasks.includes("separate"))
      items.push(item("image", RATES.image.separate, n, true, p));
    if (img.tasks.includes("reposition"))
      items.push(item("image", RATES.image.reposition, n, true, p));
    if (img.tasks.includes("composite"))
      items.push(item("image", RATES.image.composite, n, true, p));
    if (img.tasks.includes("text"))
      items.push(item("image", RATES.image.text, n, true, p));
    if (img.tasks.includes("design-element"))
      items.push(item("image", RATES.image.designElement, n, true, p));
  }

  // ── 영상·모션 ──────────────────────────────────────
  if (input.contentTypes.includes("video") && input.videoDetails) {
    const vid = input.videoDetails;

    if (vid.cutEdit)
      items.push(item("video", RATES.video.cutEdit, durationMin, false, p));
    if (vid.subtitle)
      items.push(item("video", RATES.video.subtitle, durationMin, false, p));
    if (vid.rolling && vid.rollingCount > 0)
      items.push(item("video", RATES.video.rolling, vid.rollingCount, false, p));

    if (vid.transition !== "none") {
      const r = vid.transition === "basic" ? RATES.motion.transitionBasic : RATES.motion.transitionAdvanced;
      items.push(item("motion", r, vid.transitionCount, false, p));
    }
    if (vid.entrance !== "none") {
      const r = vid.entrance === "basic" ? RATES.motion.entranceBasic : RATES.motion.entranceAdvanced;
      items.push(item("motion", r, vid.entranceCount, false, p));
    }
    if (vid.emphasis !== "none") {
      const r = vid.emphasis === "basic" ? RATES.motion.emphasisBasic : RATES.motion.emphasisAdvanced;
      items.push(item("motion", r, vid.emphasisCount, false, p));
    }
    if (vid.special !== "none") {
      const r = vid.special === "basic" ? RATES.motion.specialBasic : RATES.motion.specialAdvanced;
      items.push(item("motion", r, vid.specialCount, false, p));
    }
    if (vid.animation !== "none") {
      const r = vid.animation === "basic" ? RATES.motion.animationBasic : RATES.motion.animationAdvanced;
      items.push(item("motion", r, vid.animationCount, false, p));
    }

    // 렌더
    const renderRate = vid.renderQuality === "4k" ? RATES.render.k4 : RATES.render.fhd;
    items.push(item("render", renderRate, durationMin, false, 1));
    items.push(item("render", RATES.render.mp4Convert, durationMin, false, 1));
    if (vid.usbConvert)
      items.push(item("render", RATES.render.usb, 1, false, 1));
  }

  // ── 비디오월 ──────────────────────────────────────
  if (input.panelInfo.isVideoWall) {
    const r = p > 2 ? RATES.videoWall.advanced : RATES.videoWall.basic;
    items.push(item("motion", r, 1, false, 1));
  }

  // ── AI 이미지 ─────────────────────────────────────
  if (input.contentTypes.includes("ai-image") && input.aiImageDetails.count > 0) {
    items.push(item("ai-image", RATES.ai.image, input.aiImageDetails.count, false, 1));
  }

  // ── AI 영상 ──────────────────────────────────────
  if (input.contentTypes.includes("ai-video") && input.aiVideoDetails.count > 0) {
    items.push(item("ai-video", RATES.ai.video, input.aiVideoDetails.count, false, 1));
  }

  const costSubtotal = items.reduce((s, i) => s + i.totalCost, 0);
  const marginAmount = Math.round(costSubtotal * input.marginRate / 100);
  const totalPrice = costSubtotal + marginAmount;

  return { lineItems: items, costSubtotal, marginAmount, totalPrice, categorySummary: buildSummary(items) };
}
```

- [ ] **Step 4: 테스트 실행 — 전체 통과 확인**

```powershell
npx jest --testPathPattern="calculate" --no-coverage
```

Expected: `7 passed, 0 failed`

- [ ] **Step 5: 커밋**

```powershell
git init
git add lib/types.ts lib/rates.ts lib/calculate.ts __tests__/calculate.test.ts package.json
git commit -m "feat: add rate data, types, and quote calculation logic"
```

---

## Task 5: 위저드 공통 컴포넌트 (`WizardNav.tsx`)

**Files:**
- Create: `components/WizardNav.tsx`

- [ ] **Step 1: `WizardNav.tsx` 생성**

```tsx
// components/WizardNav.tsx
const STEPS = ["기본 정보", "패널 정보", "콘텐츠 유형", "세부 요청", "마진 설정", "견적 결과"];

export default function WizardNav({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-between mb-8">
      {STEPS.map((label, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;
        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                  ${done ? "bg-green-500 text-white" : active ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"}`}
              >
                {done ? "✓" : step}
              </div>
              <span className={`text-xs mt-1 text-center ${active ? "text-blue-600 font-semibold" : "text-gray-400"}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 mx-1 mb-4 ${done ? "bg-green-400" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
```

---

## Task 6: Step 1–3 컴포넌트

**Files:**
- Create: `components/steps/Step1BasicInfo.tsx`
- Create: `components/steps/Step2Panel.tsx`
- Create: `components/steps/Step3ContentType.tsx`

- [ ] **Step 1: `Step1BasicInfo.tsx` 생성**

```tsx
// components/steps/Step1BasicInfo.tsx
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
          { key: "companyName", label: "업체명", placeholder: "예: (주)플랜티엠" },
          { key: "contactName", label: "담당자명", placeholder: "예: 홍길동" },
          { key: "projectName", label: "프로젝트명", placeholder: "예: 매장 디지털 사이니지" },
          { key: "date", label: "견적일", placeholder: "", type: "date" },
        ] as const
      ).map(({ key, label, placeholder, type }) => (
        <div key={key}>
          <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
          <input
            type={type ?? "text"}
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
```

- [ ] **Step 2: `Step2Panel.tsx` 생성**

```tsx
// components/steps/Step2Panel.tsx
"use client";
import type { PanelInfo } from "@/lib/types";

interface Props {
  value: PanelInfo;
  onChange: (v: PanelInfo) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step2Panel({ value, onChange, onNext, onBack }: Props) {
  const valid = value.count > 0 && value.size.trim();
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-gray-800">패널 정보</h2>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">패널 수</label>
        <input
          type="number"
          min={1}
          value={value.count || ""}
          onChange={(e) => onChange({ ...value, count: Number(e.target.value) })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="예: 3"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">패널 사이즈 / 규격</label>
        <input
          type="text"
          value={value.size}
          onChange={(e) => onChange({ ...value, size: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="예: 55인치 / 1920×1080"
        />
      </div>
      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border">
        <input
          type="checkbox"
          id="videowall"
          checked={value.isVideoWall}
          onChange={(e) => onChange({ ...value, isVideoWall: e.target.checked })}
          className="w-4 h-4 accent-blue-600"
        />
        <label htmlFor="videowall" className="text-sm text-gray-700">
          <span className="font-semibold">비디오월</span> — 여러 패널을 하나처럼 동기화해서 보여주는 경우
        </label>
      </div>
      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 py-3 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">
          ← 이전
        </button>
        <button
          onClick={onNext}
          disabled={!valid}
          className="flex-1 py-3 rounded-lg bg-blue-600 text-white font-semibold disabled:opacity-40 hover:bg-blue-700"
        >
          다음 →
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: `Step3ContentType.tsx` 생성**

```tsx
// components/steps/Step3ContentType.tsx
"use client";
import type { ContentType } from "@/lib/types";

const OPTIONS: { value: ContentType; label: string; desc: string }[] = [
  { value: "image",    label: "이미지 제작",    desc: "기존 사진·이미지 편집 및 합성" },
  { value: "video",    label: "영상·모션 제작", desc: "컷 편집, 모션그래픽, 특수효과" },
  { value: "ai-image", label: "AI 이미지 생성", desc: "Midjourney·Gemini로 이미지 생성" },
  { value: "ai-video", label: "AI 영상 생성",   desc: "AI 영상 생성 및 후보정" },
];

interface Props {
  value: ContentType[];
  onChange: (v: ContentType[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step3ContentType({ value, onChange, onNext, onBack }: Props) {
  const toggle = (t: ContentType) =>
    onChange(value.includes(t) ? value.filter((x) => x !== t) : [...value, t]);

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-gray-800">콘텐츠 유형</h2>
      <p className="text-sm text-gray-500">필요한 작업을 모두 선택해주세요 (복수 선택 가능)</p>
      <div className="space-y-3">
        {OPTIONS.map((opt) => {
          const selected = value.includes(opt.value);
          return (
            <button
              key={opt.value}
              onClick={() => toggle(opt.value)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all
                ${selected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center
                  ${selected ? "border-blue-500 bg-blue-500" : "border-gray-300"}`}>
                  {selected && <span className="text-white text-xs font-bold">✓</span>}
                </div>
                <div>
                  <div className="font-semibold text-gray-800">{opt.label}</div>
                  <div className="text-xs text-gray-500">{opt.desc}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 py-3 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">
          ← 이전
        </button>
        <button
          onClick={onNext}
          disabled={value.length === 0}
          className="flex-1 py-3 rounded-lg bg-blue-600 text-white font-semibold disabled:opacity-40 hover:bg-blue-700"
        >
          다음 →
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 커밋**

```powershell
git add components/
git commit -m "feat: add wizard nav and steps 1-3 components"
```

---

## Task 7: Step 4 세부 요청 컴포넌트

**Files:**
- Create: `components/steps/Step4Details.tsx`

- [ ] **Step 1: `Step4Details.tsx` 생성**

```tsx
// components/steps/Step4Details.tsx
"use client";
import { useState } from "react";
import type { ImageDetails, VideoDetails, AIImageDetails, AIVideoDetails, ContentType, EffectLevel, ImageTask } from "@/lib/types";

interface Props {
  contentTypes: ContentType[];
  imageDetails: ImageDetails;
  videoDetails: VideoDetails;
  aiImageDetails: AIImageDetails;
  aiVideoDetails: AIVideoDetails;
  freeText: string;
  onChangeImage: (v: ImageDetails) => void;
  onChangeVideo: (v: VideoDetails) => void;
  onChangeAIImage: (v: AIImageDetails) => void;
  onChangeAIVideo: (v: AIVideoDetails) => void;
  onChangeFreeText: (v: string) => void;
  onAIAnalyze: () => void;
  aiLoading: boolean;
  onNext: () => void;
  onBack: () => void;
}

function EffectRow({
  label, value, count, onChange, onCountChange,
}: {
  label: string; value: EffectLevel; count: number;
  onChange: (v: EffectLevel) => void; onCountChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-24 text-gray-700 shrink-0">{label}</span>
      {(["none", "basic", "advanced"] as EffectLevel[]).map((lvl) => (
        <button
          key={lvl}
          onClick={() => onChange(lvl)}
          className={`px-2 py-1 rounded text-xs border ${value === lvl ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 text-gray-600 hover:border-blue-400"}`}
        >
          {lvl === "none" ? "없음" : lvl === "basic" ? "기본" : "고급"}
        </button>
      ))}
      {value !== "none" && (
        <input
          type="number"
          min={1}
          value={count || ""}
          onChange={(e) => onCountChange(Number(e.target.value))}
          className="w-16 border border-gray-300 rounded px-2 py-1 text-xs"
          placeholder="건수"
        />
      )}
    </div>
  );
}

export default function Step4Details({
  contentTypes, imageDetails, videoDetails, aiImageDetails, aiVideoDetails,
  freeText, onChangeImage, onChangeVideo, onChangeAIImage, onChangeAIVideo,
  onChangeFreeText, onAIAnalyze, aiLoading, onNext, onBack,
}: Props) {
  const IMAGE_TASKS: { value: ImageTask; label: string }[] = [
    { value: "resize",         label: "사이즈/비율 변경" },
    { value: "remove-bg",      label: "배경 제거(누끼)" },
    { value: "separate",       label: "소스 분리(레이어)" },
    { value: "reposition",     label: "비율 재배치(가로↔세로)" },
    { value: "composite",      label: "합성" },
    { value: "text",           label: "텍스트 추가" },
    { value: "design-element", label: "디자인 요소 추가" },
  ];

  const toggleImageTask = (t: ImageTask) => {
    const tasks = imageDetails.tasks.includes(t)
      ? imageDetails.tasks.filter((x) => x !== t)
      : [...imageDetails.tasks, t];
    onChangeImage({ ...imageDetails, tasks });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">세부 요청사항</h2>

      {/* 이미지 제작 */}
      {contentTypes.includes("image") && (
        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 space-y-4">
          <h3 className="font-semibold text-blue-800">이미지 제작</h3>
          <div className="flex gap-3">
            {[
              { v: true,  label: "이미지 보유 있음" },
              { v: false, label: "이미지 제작 필요 (리서치 포함)" },
            ].map(({ v, label }) => (
              <button
                key={String(v)}
                onClick={() => onChangeImage({ ...imageDetails, hasSource: v })}
                className={`flex-1 py-2 rounded-lg text-sm border-2 ${imageDetails.hasSource === v ? "border-blue-500 bg-white font-semibold" : "border-gray-200 text-gray-500"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">총 이미지 수</label>
            <input
              type="number"
              min={1}
              value={imageDetails.imageCount || ""}
              onChange={(e) => onChangeImage({ ...imageDetails, imageCount: Number(e.target.value) })}
              className="w-32 border border-gray-300 rounded px-3 py-1.5 text-sm"
              placeholder="예: 5"
            />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">필요한 편집 작업 (복수 선택)</div>
            <div className="grid grid-cols-2 gap-2">
              {IMAGE_TASKS.map(({ value: t, label }) => (
                <button
                  key={t}
                  onClick={() => toggleImageTask(t)}
                  className={`text-left px-3 py-2 rounded-lg text-sm border ${imageDetails.tasks.includes(t) ? "border-blue-500 bg-blue-50 font-medium" : "border-gray-200 text-gray-600"}`}
                >
                  {imageDetails.tasks.includes(t) ? "✓ " : ""}{label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 영상·모션 */}
      {contentTypes.includes("video") && (
        <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 space-y-4">
          <h3 className="font-semibold text-orange-800">영상·모션 제작</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">영상 길이 (초)</label>
            <input
              type="number"
              min={1}
              value={videoDetails.durationSeconds || ""}
              onChange={(e) => onChangeVideo({ ...videoDetails, durationSeconds: Number(e.target.value) })}
              className="w-32 border border-gray-300 rounded px-3 py-1.5 text-sm"
              placeholder="예: 30"
            />
          </div>
          <div className="space-y-2">
            {[
              { key: "cutEdit",   label: "컷 편집" },
              { key: "subtitle",  label: "자막 삽입" },
              { key: "usbConvert", label: "USB 변환 필요 (LG 패널용)" },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={videoDetails[key as keyof VideoDetails] as boolean}
                  onChange={(e) => onChangeVideo({ ...videoDetails, [key]: e.target.checked })}
                  className="w-4 h-4 accent-blue-600"
                />
                {label}
              </label>
            ))}
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={videoDetails.rolling}
                onChange={(e) => onChangeVideo({ ...videoDetails, rolling: e.target.checked })}
                className="w-4 h-4 accent-blue-600"
              />
              이미지/영상 롤링 (순서대로 넘기기)
              {videoDetails.rolling && (
                <input
                  type="number"
                  min={1}
                  value={videoDetails.rollingCount || ""}
                  onChange={(e) => onChangeVideo({ ...videoDetails, rollingCount: Number(e.target.value) })}
                  className="w-16 border border-gray-300 rounded px-2 py-0.5 text-xs ml-1"
                  placeholder="장수"
                />
              )}
            </label>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">모션 효과</div>
            {[
              { label: "화면전환", key: "transition", countKey: "transitionCount" },
              { label: "등장효과", key: "entrance",   countKey: "entranceCount" },
              { label: "강조효과", key: "emphasis",   countKey: "emphasisCount" },
              { label: "특수효과", key: "special",    countKey: "specialCount" },
              { label: "애니메이션", key: "animation", countKey: "animationCount" },
            ].map(({ label, key, countKey }) => (
              <EffectRow
                key={key}
                label={label}
                value={videoDetails[key as keyof VideoDetails] as EffectLevel}
                count={videoDetails[countKey as keyof VideoDetails] as number}
                onChange={(v) => onChangeVideo({ ...videoDetails, [key]: v })}
                onCountChange={(n) => onChangeVideo({ ...videoDetails, [countKey]: n })}
              />
            ))}
          </div>
          <div>
            <div className="text-sm font-medium text-gray-700 mb-1">출력 품질</div>
            <div className="flex gap-2">
              {[
                { v: "fhd", label: "Full HD" },
                { v: "4k",  label: "4K 이상" },
              ].map(({ v, label }) => (
                <button
                  key={v}
                  onClick={() => onChangeVideo({ ...videoDetails, renderQuality: v as "fhd" | "4k" })}
                  className={`px-4 py-1.5 rounded-lg text-sm border-2 ${videoDetails.renderQuality === v ? "border-blue-500 bg-blue-50 font-semibold" : "border-gray-200 text-gray-500"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI 이미지 */}
      {contentTypes.includes("ai-image") && (
        <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 space-y-3">
          <h3 className="font-semibold text-purple-800">AI 이미지 생성</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">생성 건수</label>
            <input
              type="number"
              min={1}
              value={aiImageDetails.count || ""}
              onChange={(e) => onChangeAIImage({ count: Number(e.target.value) })}
              className="w-32 border border-gray-300 rounded px-3 py-1.5 text-sm"
              placeholder="예: 3"
            />
          </div>
        </div>
      )}

      {/* AI 영상 */}
      {contentTypes.includes("ai-video") && (
        <div className="p-4 bg-pink-50 rounded-xl border border-pink-100 space-y-3">
          <h3 className="font-semibold text-pink-800">AI 영상 생성</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">생성 건수</label>
            <input
              type="number"
              min={1}
              value={aiVideoDetails.count || ""}
              onChange={(e) => onChangeAIVideo({ count: Number(e.target.value) })}
              className="w-32 border border-gray-300 rounded px-3 py-1.5 text-sm"
              placeholder="예: 2"
            />
          </div>
        </div>
      )}

      {/* 자유 입력 + AI 분석 */}
      <div className="p-4 bg-gray-50 rounded-xl border space-y-3">
        <h3 className="font-semibold text-gray-800">추가 요청사항 <span className="text-sm font-normal text-gray-500">(자유 입력 → AI가 항목 자동 분석)</span></h3>
        <textarea
          value={freeText}
          onChange={(e) => onChangeFreeText(e.target.value)}
          rows={4}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="예: 제품 등장할 때 빛 번지는 효과 넣고 싶고, 배경은 자연스럽게 바뀌었으면 해요. 영상 끝에 로고 애니메이션도 넣어주세요."
        />
        <button
          onClick={onAIAnalyze}
          disabled={!freeText.trim() || aiLoading}
          className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-semibold disabled:opacity-40 hover:bg-purple-700"
        >
          {aiLoading ? "AI 분석 중..." : "🤖 AI로 항목 분석하기"}
        </button>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 py-3 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">
          ← 이전
        </button>
        <button onClick={onNext} className="flex-1 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700">
          다음 →
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 커밋**

```powershell
git add components/steps/Step4Details.tsx
git commit -m "feat: add step 4 detailed requirements component"
```

---

## Task 8: Step 5–6 + QuoteTable 컴포넌트

**Files:**
- Create: `components/steps/Step5Margin.tsx`
- Create: `components/QuoteTable.tsx`
- Create: `components/steps/Step6Result.tsx`

- [ ] **Step 1: `Step5Margin.tsx` 생성**

```tsx
// components/steps/Step5Margin.tsx
"use client";
interface Props {
  marginRate: number;
  onChange: (v: number) => void;
  previewSubtotal: number;
  onNext: () => void;
  onBack: () => void;
}

export default function Step5Margin({ marginRate, onChange, previewSubtotal, onNext, onBack }: Props) {
  const marginAmount = Math.round(previewSubtotal * marginRate / 100);
  const total = previewSubtotal + marginAmount;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">마진 설정</h2>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">마진율 (%)</label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={0}
            max={200}
            value={marginRate}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-28 border border-gray-300 rounded-lg px-3 py-2 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-500">%</span>
        </div>
        <div className="flex gap-2 mt-2">
          {[0, 10, 20, 30, 50].map((v) => (
            <button
              key={v}
              onClick={() => onChange(v)}
              className={`px-3 py-1 rounded text-sm border ${marginRate === v ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 text-gray-600 hover:border-blue-400"}`}
            >
              {v}%
            </button>
          ))}
        </div>
      </div>
      {previewSubtotal > 0 && (
        <div className="p-4 bg-gray-50 rounded-xl border space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>원가 소계</span>
            <span>{previewSubtotal.toLocaleString()}원</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>마진 ({marginRate}%)</span>
            <span>+ {marginAmount.toLocaleString()}원</span>
          </div>
          <div className="flex justify-between font-bold text-lg text-blue-700 border-t pt-2">
            <span>최종 견적가</span>
            <span>{total.toLocaleString()}원</span>
          </div>
          <p className="text-xs text-gray-400">※ VAT 별도</p>
        </div>
      )}
      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 py-3 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">
          ← 이전
        </button>
        <button onClick={onNext} className="flex-1 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700">
          견적 확인 →
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: `QuoteTable.tsx` 생성**

```tsx
// components/QuoteTable.tsx
import type { QuoteResult } from "@/lib/types";

const CATEGORY_LABEL: Record<string, string> = {
  image:     "이미지",
  video:     "영상",
  motion:    "모션",
  render:    "렌더·인코딩",
  "ai-image": "AI 이미지",
  "ai-video": "AI 영상",
};

export default function QuoteTable({ result }: { result: QuoteResult }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="text-left px-3 py-2 border border-gray-200">구분</th>
            <th className="text-left px-3 py-2 border border-gray-200">작업 항목</th>
            <th className="text-center px-3 py-2 border border-gray-200">기준</th>
            <th className="text-right px-3 py-2 border border-gray-200">수량</th>
            <th className="text-right px-3 py-2 border border-gray-200">단가</th>
            <th className="text-right px-3 py-2 border border-gray-200">합계</th>
          </tr>
        </thead>
        <tbody>
          {result.lineItems.map((item, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
              <td className="px-3 py-2 border border-gray-200 text-gray-500">{CATEGORY_LABEL[item.category]}</td>
              <td className="px-3 py-2 border border-gray-200">{item.name}</td>
              <td className="px-3 py-2 border border-gray-200 text-center text-gray-500">{item.unit}</td>
              <td className="px-3 py-2 border border-gray-200 text-right">{item.quantity}</td>
              <td className="px-3 py-2 border border-gray-200 text-right">{item.unitCost.toLocaleString()}원</td>
              <td className="px-3 py-2 border border-gray-200 text-right font-medium">{item.totalCost.toLocaleString()}원</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-100">
            <td colSpan={5} className="px-3 py-2 border border-gray-200 text-right font-semibold">원가 소계</td>
            <td className="px-3 py-2 border border-gray-200 text-right font-semibold">{result.costSubtotal.toLocaleString()}원</td>
          </tr>
          {result.marginAmount > 0 && (
            <tr className="bg-gray-100">
              <td colSpan={5} className="px-3 py-2 border border-gray-200 text-right text-gray-600">마진</td>
              <td className="px-3 py-2 border border-gray-200 text-right text-gray-600">+ {result.marginAmount.toLocaleString()}원</td>
            </tr>
          )}
          <tr className="bg-blue-50">
            <td colSpan={5} className="px-3 py-2 border border-blue-200 text-right font-bold text-blue-700 text-base">최종 견적가 (VAT 별도)</td>
            <td className="px-3 py-2 border border-blue-200 text-right font-bold text-blue-700 text-base">{result.totalPrice.toLocaleString()}원</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
```

- [ ] **Step 3: `Step6Result.tsx` 생성**

```tsx
// components/steps/Step6Result.tsx
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
        <div className="flex gap-2">
          <button
            onClick={downloadPDF}
            disabled={downloading}
            className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold disabled:opacity-40 hover:bg-green-700"
          >
            {downloading ? "생성 중..." : "📄 PDF 다운로드 (업체용)"}
          </button>
        </div>
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
```

- [ ] **Step 4: 커밋**

```powershell
git add components/
git commit -m "feat: add steps 5-6, quote table component"
```

---

## Task 9: 메인 위저드 페이지 (`app/page.tsx`)

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: `app/globals.css` 정리**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 2: `app/layout.tsx` 수정**

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "견적 생성기 | 플랜티엠",
  description: "영상 제작 견적 자동 산출",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: `app/page.tsx` 구현**

```tsx
// app/page.tsx
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
```

- [ ] **Step 4: 개발 서버로 동작 확인**

```powershell
npm run dev
```

`http://localhost:3000` 에서 6단계 위저드가 작동하는지 확인. 1~6단계 모두 클릭해서 결과 테이블이 나오는지 확인.

- [ ] **Step 5: 커밋**

```powershell
git add app/
git commit -m "feat: main wizard page wiring all 6 steps"
```

---

## Task 10: AI 분석 API (`app/api/analyze/route.ts`)

**Files:**
- Create: `app/api/analyze/route.ts`

- [ ] **Step 1: API Route 생성**

```typescript
// app/api/analyze/route.ts
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const ITEM_LIST = `
이미지 작업: resize(사이즈변경), remove-bg(배경제거), separate(소스분리), reposition(비율재배치), composite(합성), text(텍스트추가), design-element(디자인요소추가)
영상·모션 작업: cutEdit(컷편집), subtitle(자막), rolling(롤링), transition-basic/advanced(화면전환), entrance-basic/advanced(등장효과), emphasis-basic/advanced(강조효과), special-basic/advanced(특수효과), animation-basic/advanced(애니메이션)
`;

export async function POST(req: NextRequest) {
  const { text, contentTypes } = await req.json();

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `다음 작업 항목 목록을 참고해서, 사용자의 요청 텍스트에서 필요한 작업 항목과 수량을 추출해줘.

작업 항목 목록:
${ITEM_LIST}

사용자 요청: "${text}"
선택된 콘텐츠 유형: ${JSON.stringify(contentTypes)}

반드시 아래 JSON 형식으로만 답해줘. 추출된 항목이 없으면 빈 배열로:
{
  "detected": [
    { "type": "image_task", "key": "remove-bg", "count": 2, "note": "배경 제거" },
    { "type": "motion", "key": "entrance-advanced", "count": 3, "note": "빛 번지는 효과" }
  ],
  "summary": "감지된 항목 한 줄 설명"
}

type은 image_task, video_task, motion 중 하나.`,
      },
    ],
  });

  const text_content = message.content[0].type === "text" ? message.content[0].text : "{}";
  const jsonMatch = text_content.match(/\{[\s\S]*\}/);
  const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { detected: [], summary: "" };

  return NextResponse.json({ detected: parsed.detected, summary: parsed.summary });
}
```

- [ ] **Step 2: 커밋**

```powershell
git add app/api/analyze/route.ts
git commit -m "feat: add Claude AI text analysis API route"
```

---

## Task 11: PDF 생성 API + PDF 문서 컴포넌트

**Files:**
- Create: `components/PDFDocument.tsx`
- Create: `app/api/pdf/route.ts`

- [ ] **Step 1: `components/PDFDocument.tsx` 생성**

```tsx
// components/PDFDocument.tsx
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { QuoteInput, QuoteResult } from "@/lib/types";

const s = StyleSheet.create({
  page: { padding: 48, fontFamily: "Helvetica", fontSize: 10, color: "#333" },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 4 },
  subtitle: { fontSize: 11, color: "#666", marginBottom: 24 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: "bold", marginBottom: 8, color: "#1a56db" },
  row: { flexDirection: "row", borderBottom: "1pt solid #e5e7eb", paddingVertical: 5 },
  headerRow: { flexDirection: "row", backgroundColor: "#f3f4f6", paddingVertical: 6, marginBottom: 2 },
  col1: { flex: 3 },
  col2: { flex: 1, textAlign: "right" },
  totalRow: { flexDirection: "row", paddingVertical: 8, borderTop: "2pt solid #1a56db", marginTop: 4 },
  totalLabel: { flex: 3, fontSize: 12, fontWeight: "bold", color: "#1a56db" },
  totalValue: { flex: 1, fontSize: 12, fontWeight: "bold", color: "#1a56db", textAlign: "right" },
  note: { fontSize: 8, color: "#9ca3af", marginTop: 24 },
  infoGrid: { flexDirection: "row", gap: 16, marginBottom: 24 },
  infoItem: { flex: 1 },
  infoLabel: { fontSize: 8, color: "#9ca3af", marginBottom: 2 },
  infoValue: { fontSize: 10, fontWeight: "bold" },
});

export function PDFDocument({ input, result }: { input: QuoteInput; result: QuoteResult }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.title}>견 적 서</Text>
        <Text style={s.subtitle}>플랜티엠 콘텐츠 제작 견적</Text>

        <View style={s.infoGrid}>
          {[
            { label: "업체명", value: input.basicInfo.companyName },
            { label: "담당자", value: input.basicInfo.contactName },
            { label: "프로젝트", value: input.basicInfo.projectName },
            { label: "견적일", value: input.basicInfo.date },
            { label: "패널", value: `${input.panelInfo.count}개 · ${input.panelInfo.size}` },
          ].map(({ label, value }) => (
            <View key={label} style={s.infoItem}>
              <Text style={s.infoLabel}>{label}</Text>
              <Text style={s.infoValue}>{value}</Text>
            </View>
          ))}
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>작업 내역</Text>
          <View style={s.headerRow}>
            <Text style={s.col1}>구분</Text>
            <Text style={s.col2}>금액</Text>
          </View>
          {result.categorySummary.map((cat) => (
            <View key={cat.label} style={s.row}>
              <Text style={s.col1}>{cat.label}</Text>
              <Text style={s.col2}>{cat.amount.toLocaleString()}원</Text>
            </View>
          ))}
          {result.marginAmount > 0 && (
            <View style={s.row}>
              <Text style={s.col1}>기타</Text>
              <Text style={s.col2}>{result.marginAmount.toLocaleString()}원</Text>
            </View>
          )}
        </View>

        <View style={s.totalRow}>
          <Text style={s.totalLabel}>합계 (VAT 별도)</Text>
          <Text style={s.totalValue}>{result.totalPrice.toLocaleString()}원</Text>
        </View>

        <Text style={s.note}>
          본 견적서는 작업 범위 및 난이도에 따라 변경될 수 있습니다. 문의: 플랜티엠
        </Text>
      </Page>
    </Document>
  );
}
```

- [ ] **Step 2: `app/api/pdf/route.ts` 생성**

```typescript
// app/api/pdf/route.ts
import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { PDFDocument } from "@/components/PDFDocument";
import React from "react";

export async function POST(req: NextRequest) {
  const { input, result } = await req.json();
  const buffer = await renderToBuffer(
    React.createElement(PDFDocument, { input, result })
  );
  const base64 = Buffer.from(buffer).toString("base64");
  return NextResponse.json({ base64 });
}
```

- [ ] **Step 3: 개발 서버에서 PDF 다운로드 테스트**

```powershell
npm run dev
```

6단계까지 진행 후 "PDF 다운로드" 버튼 클릭 → PDF 파일이 다운로드되고 내용이 올바른지 확인.

- [ ] **Step 4: 커밋**

```powershell
git add components/PDFDocument.tsx app/api/pdf/route.ts
git commit -m "feat: add PDF generation API and document template"
```

---

## Task 12: Vercel 배포

**Files:**
- Create: `.gitignore` (`.env.local` 포함 확인)

- [ ] **Step 1: `.gitignore` 확인**

`create-next-app`이 자동 생성한 `.gitignore`에 `.env.local`이 포함되어 있는지 확인:

```powershell
cat .gitignore | Select-String "env"
```

Expected: `.env.local` 줄이 보임. 없으면 `.gitignore`에 `.env.local` 추가.

- [ ] **Step 2: GitHub 리포지토리 생성 및 푸시**

GitHub(https://github.com)에서 새 리포지토리 생성 (예: `plantem-quote`), 그 후:

```powershell
git remote add origin https://github.com/[본인계정]/plantem-quote.git
git branch -M main
git push -u origin main
```

- [ ] **Step 3: Vercel 연결 및 환경변수 설정**

1. https://vercel.com 접속 → "Add New Project"
2. GitHub 리포지토리 선택
3. **Environment Variables** 섹션에서:
   - Name: `ANTHROPIC_API_KEY`
   - Value: 실제 API 키 입력
4. "Deploy" 클릭

- [ ] **Step 4: 배포 확인**

Vercel이 제공한 URL(예: `https://plantem-quote.vercel.app`)에서 전체 플로우 테스트:
- 1~6단계 입력
- 견적 결과 확인
- PDF 다운로드 확인
- AI 분석 버튼 (자유 입력 → 분석) 확인

---

## 자체 검토 (Spec Coverage)

| 스펙 요구사항 | 구현 태스크 |
|-------------|-----------|
| 6단계 위저드 | Task 5, 6, 7, 8, 9 |
| 기본 정보 입력 | Task 6 (Step1BasicInfo) |
| 패널 수·사이즈·비디오월 | Task 6 (Step2Panel) |
| 콘텐츠 유형 선택 | Task 6 (Step3ContentType) |
| 이미지 세부 항목 | Task 7 (Step4Details) |
| 영상·모션 세부 항목 | Task 7 (Step4Details) |
| AI 이미지·영상 건수 | Task 7 (Step4Details) |
| 자유 텍스트 + AI 분석 | Task 7, Task 10 |
| 마진율 설정 | Task 8 (Step5Margin) |
| 내부 세부 내역 테이블 | Task 8 (QuoteTable) |
| 외부 카테고리 요약 PDF | Task 11 (PDFDocument) |
| 단가 계산 로직 | Task 3, Task 4 |
| Vercel 배포 | Task 12 |
| API 키 서버 보관 | Task 10, Task 11 (API Route) |
