# 해상도 커스텀 입력 + 사이드바/견적 저장·불러오기 설계

## 1. 해상도 "기타" 커스텀 입력

패널 사이즈와 동일한 버그: `Step2Panel.tsx`의 `RESOLUTION_OPTIONS`에 `custom`("기타 해상도")이 있지만 실제 입력칸이 없다. 사이즈 때와 같은 패턴(프리셋 목록에 없는 값이면 직접입력 칸 노출)으로 고친다.

## 2. 사이드바 + 견적 저장/불러오기 (MVP)

### 결정 사항
- 저장 위치: **브라우저 localStorage** (서버/로그인 없음, 샘플 단계이므로 충분)
- 사이드바(`components/Sidebar.tsx`)를 레이아웃에 실제로 연결. "견적 작성"(`/`), "견적 내역"(`/quotes`)만 동작, "업체 관리"/"설정"은 이번 범위에서 제외하고 비활성 표시만 한다.
- 저장 트리거: 6단계(견적 결과) 화면에 "견적 저장" 버튼 추가. 자동저장은 하지 않는다(사용자가 명시적으로 저장).
- 목록/불러오기: `/quotes` 페이지에서 저장된 견적을 최신순으로 나열(업체명·프로젝트명·견적일·최종금액), "불러오기" 클릭 시 `/`로 이동해 해당 입력값을 복원하고 6단계(견적 결과)로 바로 진입. "삭제"도 지원.
- 저장 데이터는 `QuoteInput`만 저장하고 `QuoteResult`는 저장하지 않는다 — 불러올 때 `calculateQuote()`로 다시 계산해서 항상 최신 계산 로직을 반영한다.

### 데이터 모델 (`lib/storage.ts`, 신규)

```ts
export interface SavedQuote {
  id: string;
  savedAt: string; // ISO 문자열
  input: QuoteInput;
}
```

localStorage 키:
- `quotegen:savedQuotes` — `SavedQuote[]` (최신이 배열 앞쪽)
- `quotegen:pendingLoad` — `/quotes`에서 불러오기를 누른 순간 담아뒀다가, `/` 페이지가 마운트될 때 한 번 읽고 지우는 임시 전달용 값(`QuoteInput`)

### 화면 흐름
1. `/`에서 견적 작성 → 6단계에서 "견적 저장" 클릭 → `saveQuote(input)` → localStorage에 추가
2. 사이드바 "견적 내역" 클릭 → `/quotes`로 이동 → `listSavedQuotes()`로 카드 목록 렌더
3. 카드의 "불러오기" 클릭 → `setPendingLoad(input)` → `/`로 이동
4. `/` 마운트 시 `consumePendingLoad()` 확인 → 값이 있으면 `input`/`result` 상태를 복원하고 `step`을 6으로 설정

### 레이아웃 변경
`app/layout.tsx`에 `<Sidebar />`를 추가하고, 본문 영역에 사이드바 너비(240px)만큼 왼쪽 여백을 준다. `Sidebar.tsx`는 `usePathname()`으로 현재 경로에 맞는 항목을 활성 표시하고, `NavItem`을 실제 `<Link>`로 바꾼다. "업체 관리"/"설정"은 클릭해도 이동하지 않는 비활성 스타일로 표시한다.

## 영향받는 파일
- `components/steps/Step2Panel.tsx` (1번)
- `lib/storage.ts`(신규), `components/Sidebar.tsx`, `app/layout.tsx`, `app/page.tsx`, `app/quotes/page.tsx`(신규), `components/steps/Step6Result.tsx` (2번)

## 비목표
- 서버/DB 저장, 로그인, 여러 기기 간 동기화
- "업체 관리"(클라이언트별 보기), "설정" 화면 — 다음 단계에서 별도로 다룸
- 저장된 견적의 자동 정리(만료/최대 개수 제한) — 필요해지면 추후 추가
