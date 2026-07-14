# 예상 제작일정 기반 시간/금액 배분 기능 설계

## 배경 및 문제

지금 견적 계산기(`lib/calculate.ts`, `lib/rates.ts`)는 모든 단가가 "항목별 소요분(分) × 난이도 가중치 × 분당단가(188,040원/일 ÷ 480분)" 방식의 바텀업(bottom-up) 계산으로 고정돼 있다. 사용자는 작업 시작 전에 각 항목이 정확히 몇 분 걸릴지 알 수 없는 경우가 많아, 실제로는 "이 프로젝트는 대략 며칠짜리다"라는 톱다운(top-down) 감각으로 견적을 잡고 싶어한다.

다행히 참고 단가표 두 개(`단가표/글로리서울_영상견적서_260702_수정.xlsx`의 `AI이미지_영상_생성_세부견적내역` 시트와 `터널_모션그래픽_세부견적내역` 시트)가 **동일한 기준 단가(188,040원/일, 23,505원/시간)와 동일한 난이도 가중치(하 1.0 / 중 1.5 / 상 2.0)** 를 쓰고 있어서, AI 생성 항목과 툴 기반(비-AI) 항목을 같은 저울 위에서 비율대로 합산할 수 있다. `lib/rates.ts`의 기존 단가도 이미 이 방식(`c(분, 난이도)`)으로 만들어져 있어 대부분 그대로 재사용 가능하다.

## 목표

사용자가 프로젝트 전체의 "예상 제작일정(총 며칠)"을 한 번 입력하면, 선택된 모든 항목(이미지/영상/모션/렌더/AI 이미지/AI 영상 생성)의 상대적 비율은 유지한 채, 전체 금액이 그 일정에 맞춰 재조정된다.

## 비목표 (Out of scope)

- 카테고리별로 일정을 따로 입력하는 UI (전체 프로젝트에 대해 값 1개만 입력)
- 일/시간 단위를 넘어선 캘린더(달력) 기반 일정 관리, 공휴일/주말 계산
- 배율에 대한 상한/하한 클램핑, 비현실적 일정에 대한 경고 문구 (MVP 범위 밖, 추후 필요시 별도 논의)

## 데이터 모델 변경

`lib/types.ts`의 `QuoteInput`에 필드 추가:

```ts
expectedScheduleDays?: number; // 미입력(undefined) 또는 0이면 기존 방식 그대로 계산
```

## 단가 데이터 변경 (`lib/rates.ts`)

`RATES.ai.image`, `RATES.ai.video`는 현재 "작업비 + AI 솔루션 사용료"가 하나의 `cost`로 합산돼 있다. 이를 참고 시트의 항목별 금액 그대로 분리한다:

- `RATES.ai.image`: `labor: 39175` (기획리서치+프롬프트엔지니어링+생성선별+후보정합성 합), `usageFee: 1300`
- `RATES.ai.video`: `labor: 5030070`, `usageFee: 1072800`

화면에 노출되는 줄 항목(LineItem) 개수는 지금과 동일하게 AI 이미지/AI 영상 각 1행을 유지한다 — `labor`와 `usageFee`는 내부 계산용으로만 쓰고, 최종적으로 하나의 `totalCost`로 합쳐서 기존 `LineItem` 구조에 담는다. `LineItem`, `QuoteResult` 등 노출 타입은 변경하지 않는다.

`DAILY_RATE`(188,040원)는 현재 `lib/rates.ts` 내부 비공개 상수라 `lib/calculate.ts`에서 배율 계산에 쓰려면 `export`로 바꿔야 한다.

## 계산 로직 변경 (`lib/calculate.ts`)

1. 지금처럼 선택된 항목들의 원래 단가 기준 `totalCost`를 계산한다. 단, AI 이미지/AI 영상 항목은 `labor × 수량`과 `usageFee × 수량`을 별도로 들고 있는다.
2. "배율 대상 합계"(scalableSum) = 모든 항목의 `totalCost` 합, 단 AI 항목은 `labor` 부분만 포함 (`usageFee`는 제외).
3. `input.expectedScheduleDays`가 유효한 양수이고 `scalableSum > 0`인 경우에만:
   - `targetBudget = expectedScheduleDays * DAILY_RATE` (188,040원/일)
   - `scaleFactor = targetBudget / scalableSum`
   - 배율 대상 부분(일반 항목의 `totalCost`, AI 항목의 `labor` 부분)에 `scaleFactor`를 곱한다.
   - AI 항목은 배율 적용된 `labor` + 원래 `usageFee`를 더해 최종 `totalCost`로 만든다.
   - 그 외 조건(일정 미입력, 0, 선택 항목 없음)에서는 배율을 적용하지 않고 기존 계산 그대로 사용한다 (하위 호환).
4. 각 항목의 `unitCost`는 최종 `totalCost / quantity`로 재계산해 표시 일관성을 유지한다.
5. 이후 `costSubtotal`, `marginAmount`, `totalPrice`, `categorySummary` 산출 로직은 기존과 동일 (최종 `totalCost` 기준으로 그대로 합산).

## UI 변경

- 마법사 5단계(`Step5Margin`, 마진율 입력 화면)에 "예상 제작일정(선택, 워크데이 기준)" 숫자 입력 필드를 추가한다. 비워두면 힌트 문구로 "입력하지 않으면 항목별 기본 단가로 자동 계산됩니다" 안내.
- `app/page.tsx`의 `previewSubtotal` 계산은 이미 `calculateQuote(input)`을 호출하므로, `input.expectedScheduleDays`가 채워지면 별도 배선 없이 자동으로 미리보기에 반영된다.
- 결과 화면(`Step6Result`, PDF)의 줄 항목/카테고리 요약 표시 방식은 변경하지 않는다 (금액만 배율 반영되어 달라짐).

## 에러 처리 / 경계값

- `expectedScheduleDays`가 `undefined`, `0`, 음수, `NaN` → 배율 미적용
- 선택된 항목이 없어 `scalableSum === 0` → 배율 미적용 (0으로 나누기 방지)
- 그 외 별도 유효성 검사 없음 (비현실적으로 짧거나 긴 일정도 그대로 계산에 반영 — 사용자 책임)

## 테스트 계획

- `__tests__/calculate.test.ts`에 케이스 추가:
  - 일정 미입력 시 기존 결과와 동일한지 (회귀 방지)
  - 이미지+영상 항목만 있을 때 일정 입력 시 비율 유지되며 합계가 목표 일정에 맞춰지는지
  - AI 이미지/AI 영상 포함 시 `usageFee`가 배율과 무관하게 고정 유지되는지
  - 선택 항목 없이 일정만 입력했을 때 에러 없이 기존 동작(빈 견적)과 동일한지
