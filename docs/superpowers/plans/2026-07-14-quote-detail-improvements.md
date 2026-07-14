# 견적 화면 개선 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** (1) 기획/프롬프트 설계 비용을 별도 항목으로 항상/조건부 포함, (2) 내부용 화면에 산출근거 문구 표시, (3) 세부 요청 화면 항목마다 설명 툴팁 추가, (4) 패널 사이즈 "기타" 라벨 변경 + 실제 커스텀 입력 추가.

**Architecture:** `lib/calculate.ts`에 두 개의 새 무조건/조건부 라인아이템(category: `planning`)을 추가하고, 그만큼 AI 항목의 기존 작업비를 줄여 중복을 없앤다. UI 쪽은 각 화면에 독립적으로 작은 컴포넌트/문구/입력칸을 추가하는 국소 변경이다.

**Tech Stack:** Next.js(App Router) + TypeScript, Jest(ts-jest).

## Global Constraints

- 기획 항목(188,040원)은 `contentTypes.length > 0`일 때 항상 1개 포함
- 프롬프트 설계 항목(141,030원)은 `contentTypes`에 `ai-image` 또는 `ai-video`가 있을 때만 1개 포함
- `RATES.ai.image.cost` = 15,670 / `RATES.ai.video.cost` = 4,701,000 (기존 값에서 기획·프롬프트 단계 제외)
- 새 라인아이템은 예상 제작일정 배율 계산의 배율 적용 대상(scalable)
- `LineItem`, `QuoteResult` 등 외부 노출 타입 구조 변경 최소화(카테고리 유니온에 `"planning"` 추가만)

---

## Task 1: 기획/프롬프트 설계 라인아이템 추가

**Files:**
- Modify: `lib/types.ts`
- Modify: `lib/rates.ts`
- Modify: `lib/calculate.ts`
- Modify: `__tests__/calculate.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces: `LineItem["category"]`에 `"planning"` 추가 — Task 2(QuoteTable/PDFDocumentInternal)와 Task 2의 Step6Result EXTERNAL_GROUPS가 이 값을 소비함

- [ ] **Step 1: 실패하는 테스트 추가 및 기존 테스트 값 수정**

`__tests__/calculate.test.ts`에서 `"AI 이미지 2건 → 40,475 × 2"` 테스트를 찾아 아래로 교체:

```ts
  test("AI 이미지 2건 → 16,970 × 2", () => {
    const input: QuoteInput = {
      ...baseInput,
      contentTypes: ["ai-image"],
      aiImageDetails: { count: 2 },
    };
    const result = calculateQuote(input);
    const item = result.lineItems.find((i) => i.name === "AI 이미지 생성");
    expect(item!.totalCost).toBe(16970 * 2);
  });
```

파일 맨 끝(`});` 직전, 이전 작업에서 추가한 4개 테스트 뒤)에 아래 3개 테스트를 추가:

```ts

  test("콘텐츠 유형 선택 시 기획 및 리서치 항목이 항상 포함됨", () => {
    const input: QuoteInput = {
      ...baseInput,
      contentTypes: ["image"],
      imageDetails: { hasSource: false, imageCount: 1, tasks: [] },
    };
    const result = calculateQuote(input);
    const planning = result.lineItems.find((i) => i.name === "기획 및 리서치");
    expect(planning).toBeDefined();
    expect(planning!.totalCost).toBe(188040);
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

  test("AI 콘텐츠를 선택하면 프롬프트 설계 항목이 추가됨", () => {
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
```

- [ ] **Step 2: 테스트 실행해서 실패 확인**

Run: `npm test -- calculate.test.ts`
Expected: "AI 이미지 2건" 테스트는 40,475×2로 계산되어 FAIL, "기획 및 리서치"/"프롬프트 설계" 관련 3개 테스트는 해당 이름의 항목을 못 찾아 FAIL

- [ ] **Step 3: `lib/types.ts`에 `"planning"` 카테고리 추가**

`LineItem` 인터페이스의 `category` 유니온을 아래로 교체:

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

- [ ] **Step 4: `lib/rates.ts`에 `planning` 단가 추가 및 AI 단가 축소**

`ai` 블록 바로 앞에 새 블록 추가:

```ts
  planning: {
    // 기획 및 리서치: 480분(하) — AI 사용 여부와 무관하게 모든 견적에 항상 1식 포함
    research: { name: "기획 및 리서치", unit: "1식", cost: 188040 },
    // 프롬프트 설계: 240분(중) — AI 이미지/영상 생성을 선택했을 때만 1식 포함
    promptDesign: { name: "프롬프트 설계", unit: "1식", cost: 141030 },
  },
```

`ai` 블록을 아래로 교체 (기획·프롬프트 단계는 `planning` 블록으로 분리했으므로 작업비에서 제외):

```ts
  ai: {
    // 플랜티엠_콘텐츠제작단가표_260701 'AI 이미지 생성 견적 예시(이미지 1장 제작)' 기준
    // 생성·선별 3,917.5(10분,하) + 후보정·합성 11,752.5(20분,중) = 15,670(작업비)
    // (기획·리서치 11,752.5 + 프롬프트 엔지니어링 11,752.5는 planning 항목으로 분리)
    // AI 솔루션 사용료(10건×130원) = 1,300
    image: { name: "AI 이미지 생성", unit: "1건", cost: 15670, usageFee: 1300 },
    // 글로리서울 견적서(260702) 'AI 영상 생성(입구패널영상)' 실 청구 기준
    // 생성·선별 1,880,400 + 후보정·합성 2,820,600 = 4,701,000(작업비)
    // (기획·리서치 188,040 + 프롬프트 엔지니어링 141,030은 planning 항목으로 분리)
    // AI 솔루션 사용료(참고이미지 240건×130원=31,200 + 영상 480건×2,170원=1,041,600) = 1,072,800
    // (Gemini API 월간 예산 및 비용 시뮬레이터_수정 기준, 환율 1,550원/USD, 2026-07-01)
    video: { name: "AI 영상 생성",   unit: "1건", cost: 4701000, usageFee: 1072800 },
  },
```

- [ ] **Step 5: `lib/calculate.ts`에 기획/프롬프트 설계 라인아이템 추가**

`export function calculateQuote(input: QuoteInput): QuoteResult {` 함수 본문에서, `push` 헬퍼 정의 직후 / `if (input.contentTypes.includes("image") ...` 블록 바로 앞에 아래 코드를 삽입:

```ts
  if (input.contentTypes.length > 0) {
    push(item("planning", RATES.planning.research, 1, false, 1));
  }
  if (input.contentTypes.includes("ai-image") || input.contentTypes.includes("ai-video")) {
    push(item("planning", RATES.planning.promptDesign, 1, false, 1));
  }

```

`buildSummary` 함수의 `labels` 레코드에 `planning` 항목을 추가:

```ts
  const labels: Record<LineItem["category"], string> = {
    planning: "기획",
    image: "이미지 제작",
    video: "영상·모션 제작",
    motion: "영상·모션 제작",
    render: "영상·모션 제작",
    "ai-image": "AI 이미지 생성",
    "ai-video": "AI 영상 생성",
  };
```

- [ ] **Step 6: 전체 테스트 실행해서 통과 확인**

Run: `npm test`
Expected: 전체 PASS (기존 12개 중 1개 값 수정 + 신규 3개 = 15개)

- [ ] **Step 7: 커밋**

```bash
git add lib/types.ts lib/rates.ts lib/calculate.ts __tests__/calculate.test.ts
git commit -m "feat: add planning and prompt-design line items to every quote"
```

---

## Task 2: 내부용 화면 카테고리 라벨 + 산출근거 문구

**Files:**
- Modify: `components/QuoteTable.tsx`
- Modify: `components/PDFDocumentInternal.tsx`
- Modify: `components/steps/Step6Result.tsx`

**Interfaces:**
- Consumes: `LineItem["category"] === "planning"` (Task 1에서 정의)
- Produces: 없음

- [ ] **Step 1: `components/QuoteTable.tsx`에 `planning` 카테고리 라벨과 산출근거 문구 추가**

`CATEGORY_INFO` 레코드를 아래로 교체:

```ts
const CATEGORY_INFO: Record<LineItem["category"], { label: string; english: string }> = {
  planning:   { label: "기획",        english: "Planning" },
  image:      { label: "이미지 제작",  english: "Image Production" },
  video:      { label: "영상 제작",    english: "Video Production" },
  motion:     { label: "모션그래픽",   english: "Motion Graphic" },
  render:     { label: "렌더.인코딩", english: "Rendering" },
  "ai-image": { label: "AI 이미지",   english: "AI Image" },
  "ai-video": { label: "AI 영상",     english: "AI Video" },
};
```

함수 시그니처를 `export default function QuoteTable({ result, input }: { result: QuoteResult; input?: QuoteInput })`로 바꾸고(파일 상단 import에 `QuoteInput` 추가), `</table>` 다음 최상위 `</div>` 앞(테이블 바로 아래)에 산출근거 블록을 추가:

```tsx
      <div className="px-6 py-4 text-[11px] text-slate-400 leading-relaxed border-t border-slate-100">
        산출 근거: 기준 단가 188,040원/일(8시간 기준), 23,505원/시간 · 난이도 가중치 하 1.0 / 중 1.5 / 상 2.0 · 근거: 한국디자인산업연합회(KODIA) 2025년 산업별 노임단가표
        {input?.expectedScheduleDays ? (
          <span className="block mt-1">본 견적은 예상 제작일정 {input.expectedScheduleDays}일 기준으로 항목별 금액이 비율에 맞춰 재조정되었습니다.</span>
        ) : null}
      </div>
```

- [ ] **Step 2: `components/PDFDocumentInternal.tsx`에 동일 정보 추가**

`CATEGORY_INFO` 레코드에 `planning: { label: "기획", english: "Planning" },`를 맨 앞에 추가.

`<Text style={s.note}>본 문서는...` 줄 바로 앞에 산출근거 텍스트를 추가:

```tsx
        <Text style={s.note}>
          산출 근거: 기준 단가 188,040원/일(8시간 기준), 23,505원/시간 · 난이도 가중치 하 1.0 / 중 1.5 / 상 2.0 · 근거: 한국디자인산업연합회(KODIA) 2025년 산업별 노임단가표
          {input.expectedScheduleDays ? `\n본 견적은 예상 제작일정 ${input.expectedScheduleDays}일 기준으로 항목별 금액이 비율에 맞춰 재조정되었습니다.` : ""}
        </Text>
```

- [ ] **Step 3: `components/steps/Step6Result.tsx`에서 `QuoteTable`에 `input` 전달, EXTERNAL_GROUPS/카테고리 매핑에 `planning` 반영**

`<QuoteTable result={result} />` 호출을 `<QuoteTable result={result} input={input} />`로 교체.

`EXTERNAL_GROUPS` 배열의 첫 번째 원소로 아래를 추가:

```ts
  {
    key: "planning",
    label: "기획 및 설계",
    icon: "🧭",
    categories: ["planning"] as const,
    description: () => "프로젝트 기획, 리서치 및 AI 프롬프트 설계",
  },
```

`ExternalQuoteView` 내부의 카테고리→라벨 인라인 맵(`{ image: "이미지 제작", video: ... }`)에 `planning: "기획",`을 추가.

- [ ] **Step 4: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 5: 커밋**

```bash
git add components/QuoteTable.tsx components/PDFDocumentInternal.tsx components/steps/Step6Result.tsx
git commit -m "feat: show planning category and calculation-basis note in internal quote view"
```

---

## Task 3: 항목별 설명 툴팁

**Files:**
- Create: `components/InfoTooltip.tsx`
- Modify: `components/steps/Step4Details.tsx`

**Interfaces:**
- Consumes: 없음
- Produces: `InfoTooltip({ text: string })` — 이후 다른 화면에서도 재사용 가능

- [ ] **Step 1: `components/InfoTooltip.tsx` 생성**

```tsx
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
```

- [ ] **Step 2: `components/steps/Step4Details.tsx`에 설명 데이터와 툴팁 삽입**

파일 상단 import에 `InfoTooltip`을 추가:

```ts
import InfoTooltip from "@/components/InfoTooltip";
```

`IMAGE_TASKS` 배열 위에 이미지 작업 설명 맵을 추가:

```ts
const IMAGE_TASK_HELP: Record<ImageTask, string> = {
  resize: "이미지의 가로세로 비율이나 크기를 패널 화면에 맞게 조정하는 작업",
  "remove-bg": "이미지에서 배경을 지우고 피사체만 남기는 작업",
  separate: "이미지 안의 요소들을 레이어별로 분리해서 따로 편집할 수 있게 만드는 작업",
  reposition: "가로형 이미지를 세로형으로(또는 반대로) 배치를 다시 잡는 작업",
  composite: "여러 이미지 요소를 하나의 장면으로 합치는 작업",
  text: "이미지에 문구나 타이틀 텍스트를 삽입하는 작업",
  "design-element": "아이콘, 도형, 장식 그래픽 등을 추가하는 작업",
};

const VIDEO_TOGGLE_HELP: Record<string, string> = {
  cutEdit: "촬영/소스 영상을 필요한 구간만 잘라 이어붙이는 기본 편집",
  subtitle: "영상에 자막이나 캡션 텍스트를 넣는 작업",
  usbConvert: "LG 패널 등에서 재생 가능한 형식으로 파일을 변환하는 작업",
};

const MOTION_HELP: Record<string, string> = {
  transition: "장면과 장면 사이를 자연스럽게 이어주는 전환 효과",
  entrance: "요소(글자, 이미지 등)가 화면에 처음 나타날 때 주는 움직임 효과",
  emphasis: "특정 요소를 부각시키기 위한 강조 움직임(반짝임, 확대 등)",
  special: "연기, 물방울, 빛 번짐 등 시각적으로 특별한 연출 효과",
  animation: "요소가 움직이며 이야기를 전달하는 모션그래픽 애니메이션",
};
```

이미지 작업 체크박스 목록(`IMAGE_TASKS.map(...)`) 내부의 `<span>{label}</span>`을 아래로 교체:

```tsx
                    <span className="flex items-center">{label}<InfoTooltip text={IMAGE_TASK_HELP[t]} /></span>
```

영상 체크박스 목록(`cutEdit`/`subtitle`/`usbConvert`)의 `<span>{label}</span>`을 아래로 교체:

```tsx
                  <span className="flex items-center">{label}<InfoTooltip text={VIDEO_TOGGLE_HELP[key]} /></span>
```

롤링 체크박스의 `<span>이미지/영상 롤링</span>`을 아래로 교체:

```tsx
                <span className="flex items-center">이미지/영상 롤링<InfoTooltip text="여러 장의 이미지나 영상을 순서대로 자동 전환하며 보여주는 롤링 연출" /></span>
```

`EffectRow` 함수 컴포넌트의 props 타입에 `help: string`을 추가하고, 라벨 렌더링 부분을 교체:

```ts
function EffectRow({ label, value, count, help, onChange, onCountChange }: {
  label: string; value: EffectLevel; count: number; help: string;
  onChange: (v: EffectLevel) => void; onCountChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl">
      <span className="text-[13px] text-slate-700 font-bold w-20 shrink-0 flex items-center">{label}<InfoTooltip text={help} /></span>
```

(이 다음 줄부터는 기존 `EffectRow` 코드를 그대로 유지한다.)

`EffectRow` 호출부(`{ label: "화면전환", key: "transition", countKey: "transitionCount" }` 등 배열의 `.map`)를 아래로 교체:

```tsx
              {[
                { label: "화면전환", key: "transition", countKey: "transitionCount" },
                { label: "등장효과", key: "entrance",   countKey: "entranceCount" },
                { label: "강조효과", key: "emphasis",   countKey: "emphasisCount" },
                { label: "특수효과", key: "special",    countKey: "specialCount" },
                { label: "애니메이션", key: "animation", countKey: "animationCount" },
              ].map(({ label, key, countKey }) => (
                <EffectRow key={key} label={label}
                  value={videoDetails[key as keyof VideoDetails] as EffectLevel}
                  count={videoDetails[countKey as keyof VideoDetails] as number}
                  help={MOTION_HELP[key]}
                  onChange={v => onChangeVideo({ ...videoDetails, [key]: v })}
                  onCountChange={n => onChangeVideo({ ...videoDetails, [countKey]: n })}
                />
              ))}
```

출력 품질 섹션의 `<p className="text-[11px] font-black text-slate-400 uppercase mb-2">출력 품질</p>`를 아래로 교체:

```tsx
              <p className="text-[11px] font-black text-slate-400 uppercase mb-2 flex items-center">출력 품질<InfoTooltip text="최종 영상 파일의 해상도 기준 (Full HD 또는 4K)" /></p>
```

- [ ] **Step 3: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 4: 커밋**

```bash
git add components/InfoTooltip.tsx components/steps/Step4Details.tsx
git commit -m "feat: add click-to-show help tooltips for step 4 work items"
```

---

## Task 4: 패널 사이즈 "기타" 라벨 변경 + 실제 커스텀 입력

**Files:**
- Modify: `components/steps/Step2Panel.tsx`

**Interfaces:**
- Consumes: 없음
- Produces: 없음

- [ ] **Step 1: `SIZE_OPTIONS` 라벨 변경 및 프리셋 목록 상수 추가**

`SIZE_OPTIONS` 배열의 마지막 원소를 교체:

```ts
const SIZE_OPTIONS = [
  { value: "32인치", label: "32인치" },
  { value: "43인치", label: "43인치" },
  { value: "49인치", label: "49인치" },
  { value: "55인치", label: "55인치" },
  { value: "65인치", label: "65인치" },
  { value: "75인치", label: "75인치" },
  { value: "86인치", label: "86인치" },
  { value: "custom", label: "기타 사이즈" },
];

const PRESET_SIZES = SIZE_OPTIONS.filter(o => o.value !== "custom").map(o => o.value);
```

- [ ] **Step 2: `Step2Panel` 컴포넌트에서 커스텀 사이즈 입력 처리**

`export default function Step2Panel({ value, onChange, onNext, onBack }: Props) {` 함수 본문 시작 부분(`const valid = ...` 다음)에 아래를 추가:

```ts
  const isCustomSize = value.size !== "" && !PRESET_SIZES.includes(value.size);
```

`<SelectField label="패널 사이즈 (인치)" ... />` 호출을 아래로 교체:

```tsx
          <div className="space-y-2">
            <SelectField
              label="패널 사이즈 (인치)"
              value={isCustomSize ? "custom" : value.size}
              onChange={v => onChange({ ...value, size: v === "custom" ? "" : v })}
              options={SIZE_OPTIONS}
            />
            {isCustomSize && (
              <input
                type="text"
                placeholder="예: 70인치"
                value={value.size}
                onChange={e => onChange({ ...value, size: e.target.value })}
                className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-3 px-4 text-sm font-bold text-slate-700 outline-none focus:border-primary/30 focus:bg-white transition-all"
              />
            )}
          </div>
```

- [ ] **Step 3: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 4: 개발 서버로 확인**

`npm run dev`가 이미 실행 중이면 그대로, 아니면 백그라운드로 실행 후 2단계 화면에서 "기타 사이즈" 선택 → 직접입력 칸이 나타나는지, 값을 입력하면 "다음" 버튼이 활성화되는지 확인.

- [ ] **Step 5: 커밋**

```bash
git add components/steps/Step2Panel.tsx
git commit -m "feat: add working custom panel size input"
```
