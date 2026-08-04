# 2026-08-04 고정 단가 기반 견적 계산 개편 설계

## 배경 및 문제

지금 견적 계산기는 각 항목의 원가를 "소요시간(분) × 난이도 가중치 × 분당단가"로 계산하지만, 5단계 "예상 제작일정"을 입력하면 선택된 모든 항목의 총합을 그 일정에 맞춰 **전체 배율로 재조정**한다 (`lib/calculate.ts`, 2026-07-14 설계·구현).

이 재조정 때문에, 완전히 동일한 작업 항목(예: "이미지 사이즈 변경")이라도 같은 견적에 다른 카테고리(예: 영상 작업)가 함께 들어있느냐에 따라 전체 합계가 달라지고, 그 결과 배율도 달라져서 **최종 금액이 견적마다 달라지는 문제**가 있다. 이미 한 차례(2026-07-15, `docs/history/2026-07-15-quote-quantity-fixes.md`) "의도된 설계"로 결론짓고 AI 수량 편집만 잠그는 우회 조치를 했으나, 실사용 결과 이 재조정 방식 자체가 "받는 사람이 항목별 정확한 단가를 확인할 수 없다"는 근본 문제를 낳는다는 게 재확인됐다.

사용자가 2026-08-04에 새로 만든 참고 단가표(`단가표/영상 제작 견적서_260804.xlsx`)는 재조정 없이, 항목별 소요시간 × 난이도 × 분당단가만으로 계산해서 **같은 작업이 어느 견적에 들어가든 항상 같은 금액**이 되는 방식을 보여준다. 이 설계는 계산기를 그 방식으로 맞추는 작업이다.

## 목표

1. "예상 제작일정에 맞춰 전체 항목 재조정"하는 로직을 제거하고, 항목별 금액이 다른 카테고리 구성과 무관하게 항상 고정되도록 한다.
2. 지금 코드에 숨겨진 "소요시간(분)"을 내부 편집 화면에서 프로젝트별로 직접 조정할 수 있는 입력값으로 노출한다.
3. AI 이미지/영상 항목의 "AI 솔루션 사용료"를 "생성 시도 건수" 입력으로 조정할 수 있게 한다 (작업비는 지금처럼 고정).
4. "기획 및 리서치" 항목이 모든 견적에 자동으로 들어가는 것을 멈추고, 필요할 때만 수동으로 추가하게 한다.

## 비목표 (Out of scope)

- 이미지 작업류(리사이즈, 배경제거 등)의 난이도를 사용자가 직접 선택하게 하는 것 (난이도는 지금처럼 항목별 고정)
- "프롬프트 설계" 항목의 자동 포함 조건 변경 (AI 이미지/영상 선택 시 자동 포함 유지)
- 소요시간 기본값을 모든 항목에 대해 최신 단가표와 전수 대조하는 작업 — 오늘 올려준 엑셀에 명시된 항목만 갱신하고, 대응 항목이 없는 나머지는 기존 코드값 유지 (담당자가 편집 화면에서 필요시 직접 수정)
- 소요시간/생성건수 입력을 외부용 견적서·PDF에 노출하는 것 (지금처럼 내부용에만)

## 1. 예상 제작일정 재조정 제거

`lib/calculate.ts`에서 `scalableSum` / `scaleFactor` / `targetBudget` 재조정 블록을 삭제한다. 항목은 원래의 "소요시간 × 난이도 × 분당단가" 계산 결과를 그대로 사용한다.

- `input.expectedScheduleDays` 필드(`lib/types.ts`)는 그대로 유지한다 (입력창도 유지).
- `components/steps/Step5Margin.tsx`의 안내 문구를 "입력하면 선택한 항목들의 비율은 유지한 채 전체 금액이 이 일정에 맞춰 재조정됩니다" → "참고용으로만 기재되며, 항목별 금액에는 영향을 주지 않습니다"로 변경.
- `components/QuoteTable.tsx`(내부용 화면)와 `components/PDFDocumentInternal.tsx`(내부용 PDF)의 안내 문구를 "본 견적은 예상 제작일정 N일 기준으로 항목별 금액이 비율에 맞춰 재조정되었습니다" → "예상 제작일정 N일은 참고용으로 기재된 값이며, 항목별 금액에는 반영되지 않았습니다"로 변경.
- 외부용 화면/PDF는 원래도 이 문구를 노출하지 않았고, 앞으로도 노출하지 않는다 (변경 없음).
- `lib/rates.ts`의 `DAILY_RATE`는 재조정 계산에만 쓰였던 `export`를 다시 비공개로 되돌린다. 대신 아래 2번 항목에서 쓸 `costFromMinutes` 헬퍼를 새로 export한다.

## 2. 항목별 "소요시간(분)" 편집 기능

### 데이터 모델

`lib/rates.ts`의 `RateItem`에 `minutes`, `difficultyWeight`를 추가해서 `cost`뿐 아니라 계산 근거도 함께 노출한다:

```ts
export interface RateItem {
  name: string;
  unit: string;
  cost: number;
  usageFee?: number;
  minutes?: number;          // 소요시간 기반 항목만 존재 (AI 항목은 없음 — 3번 참고)
  difficultyWeight?: number; // 1.0 / 1.5 / 2.0, 고정값
}
```

`c(minutes, difficulty)` 헬퍼가 `{ cost, minutes, difficultyWeight }`를 함께 반환하도록 바꾸고, `RATES.planning.research`/`promptDesign`(지금은 리터럴 숫자)도 `c(480, "low")`/`c(240, "mid")`로 바꿔 동일하게 minutes/difficulty를 갖도록 통일한다 (계산 결과값은 지금과 동일, 188,040원/141,030원 그대로).

`export function costFromMinutes(minutes: number, difficultyWeight: number): number`를 추가해서, 초기 계산과 편집 화면 재계산에서 같은 공식을 재사용한다.

`lib/types.ts`의 `LineItem`에 필드 추가:

```ts
minutes?: number;
difficultyWeight?: number;
```

`planning` / `image` / `video` / `motion` / `render` 카테고리 항목은 이 값을 채워서 생성한다. `ai-image` / `ai-video`는 채우지 않는다 (3번 항목의 별도 필드 사용).

### 계산 로직

`lib/calculate.ts`의 `item()` 헬퍼가 `rate.minutes`/`rate.difficultyWeight`를 그대로 `LineItem`에 옮겨 담는다. `unitCost`/`totalCost` 산출 공식 자체는 지금과 동일(`costFromMinutes` 사용).

### UI — 내부용 편집 화면 (`components/QuoteTable.tsx`)

- "소요시간(분)" 열을 추가한다. `minutes`가 있는 행은 편집 가능한 숫자 입력으로 렌더링.
- 값이 바뀌면: `unitCost = costFromMinutes(minutes, difficultyWeight)`, `totalCost = unitCost × quantity`로 즉시 재계산 (지금 수량 편집(`updateQuantity`)과 동일한 패턴).
- 난이도(`difficultyWeight`)는 편집 불가, 참고용으로 작게 표시(예: "중 ×1.5") — 비목표에 명시한 대로 고정.
- 처음 항목이 만들어질 때는 `RATES`의 기본 소요시간이 미리 채워져 있다.
- 외부용 화면(`ExternalQuoteView`)과 외부용 PDF(`PDFDocument.tsx`)는 변경하지 않는다 — 이 열은 내부용에만 존재.

### 기본값 데이터 갱신 (`lib/rates.ts`)

오늘 올려준 `단가표/영상 제작 견적서_260804.xlsx`의 "세부 견적 내역서" 시트에 명시된 항목은 그 소요시간으로 갱신한다:

| RATES 키 | 기존 | 갱신값 |
|---|---|---|
| `image.resize` | 1분 | 5분 |
| `image.separate` | 30분 | 180분 |
| `motion.entranceAdvanced`(또는 매칭되는 등장효과) | 45분 | 240분 |
| `motion.emphasisAdvanced` | 45분 | 480분 |
| `motion.specialAdvanced` | 150분 | 60분 |
| `videoWall.basic`/관련 항목 | — | 10분, 패널수 반영 |
| `render.fhd`/`mp4Convert` | 2분 | 5분 |

(정확한 1:1 매핑과 나머지 갱신 대상 항목은 구현 단계에서 엑셀 원본과 다시 대조해 확정한다. 엑셀에 대응 항목이 없는 나머지 RATES 항목(배경제거, 소스재배치, 합성, 텍스트추가, 디자인요소추가, 롤링, 기본 난이도 모션효과 등)은 이번 작업에서 값을 바꾸지 않는다.)

## 3. AI 항목 "생성 시도 건수" 편집

AI 이미지/영상 항목은 "작업비(사람이 하는 기획·생성·후보정, 완성물 1건 기준 고정)"와 "AI 솔루션 사용료(생성 시도 건수 × 건당 API 비용)"를 분리해서, 사용료 부분만 편집 가능하게 한다. 작업비는 지금처럼 고정 — AI 수량(완성물 개수) 자체를 6단계에서 잠근 기존 결정과 일관성 유지.

### 데이터 모델

AI 이미지와 AI 영상은 사용료 구성이 다르다 — 이미지는 "이미지 생성 시도"(130원/건) 한 종류뿐이지만, 영상은 "참고이미지 생성 시도"(130원/건)와 "영상 생성 시도"(2,170원/건) 두 종류가 섞여 있다(`RATES.ai.video.usageFee = 1,072,800원` = 참고이미지 240건×130원 + 영상 480건×2,170원). 그래서 단일 `attemptCount`/`costPerAttempt` 한 쌍으로는 영상 항목을 정확히 표현할 수 없다.

`lib/types.ts`의 `LineItem`에 필드 추가 (AI 항목 전용):

```ts
laborCost?: number;       // 완성물 1건당 작업비 (고정, 편집 불가)
attemptGroups?: {
  label: string;          // 예: "이미지 생성 시도", "참고이미지 생성 시도", "영상 생성 시도"
  count: number;          // 완성물 1건당 시도 건수 (편집 가능)
  costPerAttempt: number; // 시도 1건당 API 비용 (고정)
}[];
```

`RATES.ai.image`는 `attemptGroups` 1개(이미지 생성, 130원/건, 기본 10건), `RATES.ai.video`는 2개(참고이미지 생성 130원/건 기본 240건 + 영상 생성 2,170원/건 기본 480건)를 갖는다.

### 계산 로직

`usageFee = attemptGroups.reduce((s, g) => s + g.count * g.costPerAttempt, 0)`, `totalCost = (laborCost + usageFee) × quantity`. `quantity`는 완성물 개수(지금처럼 4단계에서만 조정 가능, 6단계에서는 잠김 — 기존 동작 유지).

### UI

`QuoteTable.tsx`에서 AI 카테고리 행은 "소요시간" 대신, `attemptGroups` 각각에 대해 "○○ 시도 건수" 편집 입력을 보여준다(이미지 항목은 입력 1개, 영상 항목은 입력 2개). 값이 바뀌면 사용료만 재계산되고 작업비(`laborCost`)는 그대로 더해진다.

## 4. "기획 및 리서치" 자동 포함 제거

`lib/calculate.ts`에서 `if (input.contentTypes.length > 0) { push(item("planning", RATES.planning.research, 1, false, 1)); }` 블록을 삭제한다. "프롬프트 설계"(AI 선택 시 자동 포함)는 변경하지 않는다.

`lib/catalog.ts`의 `getCatalog()`는 이미 `RATES.planning`의 모든 항목(연구, 프롬프트 설계)을 카탈로그에 포함하고 있어서, 6단계 "항목 추가" 드롭다운으로 필요할 때 수동으로 추가할 수 있다 — 별도 코드 변경 불필요.

## 테스트 계획

`__tests__/calculate.test.ts`:

- 기존 "일정 입력 시 재조정됨" 관련 테스트를 "일정을 입력해도 `costSubtotal`/`totalPrice`가 변하지 않음"으로 교체 (회귀 확인).
- 동일한 항목(예: 이미지 사이즈 변경)이 (a) 이미지만 있는 견적과 (b) 이미지+영상이 함께 있는 견적에서 같은 `totalCost`를 갖는지 확인 (이번 작업의 핵심 목적 검증).
- `costFromMinutes()` 단위 테스트 (분×난이도×분당단가 공식 검증).
- 콘텐츠 유형을 선택해도 "기획 및 리서치" 항목이 자동으로 포함되지 않는지 확인.
- AI 이미지/영상 선택 시 "프롬프트 설계"는 여전히 자동 포함되는지 확인 (회귀 방지).
- AI 항목의 `attemptGroups` 중 하나를 바꿔도 `laborCost`는 고정이고 사용료만 변하는지, AI 영상 항목이 참고이미지/영상 두 그룹을 모두 갖는지 확인하는 헬퍼 함수 테스트 (계산 함수 레벨에서 가능한 범위까지).

컴포넌트 레벨(소요시간/건수 편집 UI)은 기존 수량 편집 테스트가 있다면 그 패턴을 따라 추가하되, 필수는 아님 — 계산 로직 테스트가 핵심.

## 작업 전 확인 사항

로컬 브랜치가 원격(GitHub)보다 6개 커밋 뒤처져 있고, 그 커밋들이 이번에 건드릴 파일(`lib/calculate.ts`, `components/QuoteTable.tsx`, `components/PDFDocumentInternal.tsx` 등)과 겹친다. 구현 시작 전에 `git pull`로 최신 상태를 받아온 뒤 작업한다.
