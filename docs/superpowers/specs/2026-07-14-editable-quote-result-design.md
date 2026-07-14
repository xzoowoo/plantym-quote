# 견적 결과 화면 수량 수정/항목 추가·삭제 + 외부용 수량 표시 설계

## 배경

견적 결과(6단계) 화면은 지금까지 `calculateQuote(input)`으로 계산된 값을 그대로 보여주기만 했다. 사용자가 결과를 보면서 수량을 미세조정하거나, 단가표에 없는 조합을 항목으로 추가/삭제하고 싶어한다. 또한 외부용 화면은 카테고리 묶음 합계만 보여줘서 항목별 수량이 전혀 안 보였는데, 세부 수량 노출 없이 "이름(수량)" 형태로만 간단히 보여주면 된다는 방향으로 확정했다.

## 결정 사항

- 수정 대상은 **6단계에 진입한 이번 견적 인스턴스**에 한정된다. 5단계로 돌아갔다가 다시 6단계로 오면(컴포넌트 재마운트) 수정 내용은 초기화되고 `calculateQuote(input)` 기준으로 다시 계산된다. 다시 계산하는 근본적인 항목 구성 변경은 4단계로 돌아가서 해야 한다.
- "견적 저장", "PDF 다운로드"는 그 시점의 **수정된 값**을 기준으로 동작한다(초기 계산값이 아님).
- 항목 추가는 **기존 단가표(RATES)에서 골라서** 수량을 지정하는 방식. 이름/단가를 자유 입력하는 커스텀 항목은 이번 범위에서 제외.
- 수정 가능한 값은 **수량만**(단가는 단가표 고정값 사용). 단가 자체를 고치는 기능은 이번 범위에서 제외.
- 편집 UI는 **내부용(QuoteTable) 화면에만** 노출. 외부용 화면은 내부에서 편집된 `lineItems`를 그대로 반영해서 자동으로 다시 그룹핑된다(별도 편집 UI 없음).
- 외부용 화면의 "산출 근거 (비고)" 칸은 지금의 고정 문구 대신, 그 카테고리에 실제로 포함된 항목들을 `이름(수량)` 형태로 나열한다. (예: "사이즈 변경(4), 소스 분리(4), 합성(4), 디자인 요소 추가(4)")

## 데이터 흐름

- `lib/calculate.ts`에 `buildSummary`를 재사용하는 `recalcResult(lineItems, marginRate): QuoteResult` 함수를 새로 export해서, `calculateQuote`의 마지막 집계 단계와 편집 후 재계산 로직이 같은 코드를 쓰도록 한다.
- `lib/catalog.ts`(신규)에 `RATES` 전체를 평탄화한 `CatalogItem[]`(`category`, `name`, `unit`, `unitCost`)을 만드는 `getCatalog()`를 추가한다. AI 항목은 작업비+사용료를 합친 값을 `unitCost`로 노출한다(추가 시점엔 예상 일정 배율 적용 대상 여부를 구분하지 않음 — 이번 범위 밖).
- `Step6Result.tsx`가 `result.lineItems`를 초기값으로 하는 로컬 상태(`items`)를 갖고, `recalcResult(items, input.marginRate)`로 파생된 `editableResult`를 계산해 `QuoteTable`/`ExternalQuoteView`/PDF 다운로드에 전달한다.
- `QuoteTable.tsx`에 `editable`, `onUpdateQuantity`, `onRemoveItem`, `catalog`, `onAddItem` props를 추가해서 수량 입력·삭제 버튼·항목 추가 폼을 노출한다(내부용 탭에서만 `editable=true`로 전달).

## 영향받는 파일

- `lib/calculate.ts` (`recalcResult` export)
- `lib/catalog.ts` (신규)
- `components/QuoteTable.tsx` (편집 UI)
- `components/steps/Step6Result.tsx` (편집 상태 관리, ExternalQuoteView 수량 표시)

## 비목표

- 단가 자체를 고치는 기능
- 완전 자유 입력(이름/단가 직접 입력) 커스텀 항목
- 수정 내용을 "견적 저장"에 영구 반영(저장된 견적을 다시 불러오면 자동 계산값으로 리셋됨 — 필요해지면 후속 작업)
