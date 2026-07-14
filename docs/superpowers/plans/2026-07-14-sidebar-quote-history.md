# 해상도 커스텀 입력 + 사이드바/견적 저장·불러오기 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** (1) 패널 해상도 "기타" 선택 시 실제 입력칸이 뜨게 고치고, (2) 브라우저 localStorage에 견적을 저장/불러오기 할 수 있게 하고, (3) 이미 만들어져 있던 `Sidebar` 컴포넌트를 레이아웃에 연결해 "견적 작성"/"견적 내역" 화면을 오갈 수 있게 한다.

**Architecture:** 저장은 서버 없이 브라우저 `localStorage`에 `QuoteInput`만 저장하고, 불러올 때 `calculateQuote()`로 다시 계산한다. `/quotes`라는 새 라우트를 만들어 목록을 보여주고, `/`(위저드) 페이지는 마운트 시 "불러올 항목"이 있는지 확인해서 있으면 상태를 복원한다.

**Tech Stack:** Next.js(App Router) + TypeScript, 브라우저 `localStorage` (서버/DB 없음).

## Global Constraints

- 저장 데이터는 `QuoteInput`만 (계산 결과는 저장하지 않고 항상 다시 계산)
- localStorage 키: `quotegen:savedQuotes` (목록), `quotegen:pendingLoad` (불러오기 임시 전달)
- 사이드바의 "업체 관리"/"설정"은 이번 범위에서 제외, 비활성 표시만
- 기존 계산 로직(`lib/calculate.ts`)은 변경하지 않음

---

## Task 1: 패널 해상도 "기타" 커스텀 입력

**Files:**
- Modify: `components/steps/Step2Panel.tsx`

- [ ] **Step 1: 프리셋 해상도 목록 상수 추가**

`RESOLUTION_OPTIONS` 배열 바로 아래에 추가:

```ts
const PRESET_RESOLUTIONS = RESOLUTION_OPTIONS.filter(o => o.value !== "custom").map(o => o.value);
```

- [ ] **Step 2: 커스텀 해상도 판별 및 입력칸 추가**

`const isCustomSize = value.size !== "" && !PRESET_SIZES.includes(value.size);` 바로 아래에 추가:

```ts
  const isCustomResolution = value.resolution !== "" && !PRESET_RESOLUTIONS.includes(value.resolution);
```

`<SelectField label="패널 해상도 (규격)" ... />` 호출을 아래로 교체:

```tsx
          <div className="space-y-2">
            <SelectField
              label="패널 해상도 (규격)"
              value={isCustomResolution ? "custom" : value.resolution}
              onChange={v => onChange({ ...value, resolution: v === "custom" ? "" : v })}
              options={RESOLUTION_OPTIONS}
            />
            {isCustomResolution && (
              <input
                type="text"
                placeholder="예: 2560×1440"
                value={value.resolution}
                onChange={e => onChange({ ...value, resolution: e.target.value })}
                className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-3 px-4 text-sm font-bold text-slate-700 outline-none focus:border-primary/30 focus:bg-white transition-all"
              />
            )}
          </div>
```

- [ ] **Step 3: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 4: 커밋**

```bash
git add components/steps/Step2Panel.tsx
git commit -m "feat: add working custom panel resolution input"
```

---

## Task 2: 견적 저장/불러오기 (localStorage)

**Files:**
- Create: `lib/storage.ts`
- Modify: `components/steps/Step6Result.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Produces: `listSavedQuotes(): SavedQuote[]`, `saveQuote(input: QuoteInput): SavedQuote`, `deleteSavedQuote(id: string): void`, `setPendingLoad(input: QuoteInput): void`, `consumePendingLoad(): QuoteInput | null`, `SavedQuote { id, savedAt, input }` — Task 3의 `/quotes` 페이지가 이 함수들을 그대로 사용

- [ ] **Step 1: `lib/storage.ts` 작성**

```ts
import type { QuoteInput } from "@/lib/types";

export interface SavedQuote {
  id: string;
  savedAt: string;
  input: QuoteInput;
}

const SAVED_KEY = "quotegen:savedQuotes";
const PENDING_LOAD_KEY = "quotegen:pendingLoad";

export function listSavedQuotes(): SavedQuote[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SAVED_KEY);
    return raw ? (JSON.parse(raw) as SavedQuote[]) : [];
  } catch {
    return [];
  }
}

export function saveQuote(input: QuoteInput): SavedQuote {
  const quotes = listSavedQuotes();
  const entry: SavedQuote = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    savedAt: new Date().toISOString(),
    input,
  };
  quotes.unshift(entry);
  window.localStorage.setItem(SAVED_KEY, JSON.stringify(quotes));
  return entry;
}

export function deleteSavedQuote(id: string): void {
  const quotes = listSavedQuotes().filter((q) => q.id !== id);
  window.localStorage.setItem(SAVED_KEY, JSON.stringify(quotes));
}

export function setPendingLoad(input: QuoteInput): void {
  window.localStorage.setItem(PENDING_LOAD_KEY, JSON.stringify(input));
}

export function consumePendingLoad(): QuoteInput | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(PENDING_LOAD_KEY);
  if (!raw) return null;
  window.localStorage.removeItem(PENDING_LOAD_KEY);
  try {
    return JSON.parse(raw) as QuoteInput;
  } catch {
    return null;
  }
}
```

- [ ] **Step 2: `Step6Result.tsx`에 "견적 저장" 버튼 추가**

파일 상단 import에 추가:

```ts
import { saveQuote } from "@/lib/storage";
```

`export default function Step6Result({ input, result, onBack, onReset }: Props) {` 함수 본문, `const [downloading, setDownloading] = useState(false);` 바로 아래에 추가:

```ts
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    saveQuote(input);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };
```

"PDF 다운로드" 버튼(`<button onClick={downloadPDF} ...>`) 바로 앞에 저장 버튼을 추가:

```tsx
          <button
            onClick={handleSave}
            className="flex items-center space-x-2 px-5 py-2.5 border-2 border-slate-200 bg-white text-slate-700 rounded-xl text-sm font-bold hover:border-primary hover:text-primary transition-all"
          >
            <span>{saved ? "저장했어요 ✓" : "견적 저장"}</span>
          </button>
```

- [ ] **Step 3: `app/page.tsx`에서 마운트 시 불러올 견적 복원**

파일 상단 import에 `useEffect`와 `consumePendingLoad`를 추가:

```ts
import { useState, useEffect } from "react";
```

```ts
import { consumePendingLoad } from "@/lib/storage";
```

`export default function Page() {` 함수 본문, `const [aiLoading, setAiLoading] = useState(false);` 바로 아래에 추가:

```ts
  useEffect(() => {
    const pending = consumePendingLoad();
    if (pending) {
      setInput(pending);
      setResult(calculateQuote(pending));
      setStep(6);
    }
  }, []);
```

- [ ] **Step 4: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 5: 커밋**

```bash
git add lib/storage.ts components/steps/Step6Result.tsx app/page.tsx
git commit -m "feat: add localStorage-based quote save and load-on-mount"
```

---

## Task 3: 사이드바 연결 + 견적 내역(`/quotes`) 페이지

**Files:**
- Modify: `components/Sidebar.tsx`
- Modify: `app/layout.tsx`
- Create: `app/quotes/page.tsx`

**Interfaces:**
- Consumes: `listSavedQuotes`, `deleteSavedQuote`, `setPendingLoad`, `SavedQuote` (Task 2에서 정의)

- [ ] **Step 1: `components/Sidebar.tsx`를 실제 라우팅에 연결**

파일 전체를 아래로 교체:

```tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReceiptText, LayoutDashboard, Quote, Users, Settings } from "lucide-react";

const NavItem = ({ icon, label, href, active, disabled }: {
  icon: React.ReactNode; label: string; href: string; active?: boolean; disabled?: boolean;
}) => (
  <Link
    href={disabled ? "#" : href}
    aria-disabled={disabled}
    onClick={(e) => { if (disabled) e.preventDefault(); }}
    className={`flex items-center space-x-3 px-3 py-3 rounded-xl transition-all group ${
      disabled ? "text-slate-300 cursor-not-allowed" :
      active ? "bg-blue-50 text-primary font-semibold" : "text-slate-500 hover:bg-slate-100"
    }`}
  >
    <span className={active && !disabled ? "text-primary" : disabled ? "" : "group-hover:text-primary transition-colors"}>{icon}</span>
    <span className="text-sm">{label}</span>
    {disabled && <span className="text-[9px] font-bold text-slate-300 ml-auto">준비중</span>}
  </Link>
);

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="fixed left-0 top-0 h-full w-[240px] bg-slate-50 border-r border-slate-200 flex flex-col py-6 px-4 z-50">
      <div className="flex items-center space-x-3 mb-8 px-2">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200/50">
          <ReceiptText size={22} />
        </div>
        <div>
          <h1 className="text-base font-black text-primary tracking-tight">플랜티엠</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">견적 생성기</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1">
        <NavItem icon={<LayoutDashboard size={18} />} label="견적 작성" href="/" active={pathname === "/"} />
        <NavItem icon={<Quote size={18} />} label="견적 내역" href="/quotes" active={pathname === "/quotes"} />
        <NavItem icon={<Users size={18} />} label="업체 관리" href="#" disabled />
        <NavItem icon={<Settings size={18} />} label="설정" href="#" disabled />
      </nav>
    </aside>
  );
}
```

- [ ] **Step 2: `app/layout.tsx`에 `Sidebar` 배치**

파일 전체를 아래로 교체:

```tsx
import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "BillFlow — 영상 제작 견적 생성기",
  description: "플랜티엠 콘텐츠 제작 단가 기준 견적 생성기",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen">
        <div className="min-h-screen flex bg-slate-50">
          <Sidebar />
          <div className="flex-1 flex flex-col pl-[240px]">
            <Header />
            <main className="flex-1 flex flex-col">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: `app/quotes/page.tsx` 작성**

```tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Trash2, Upload } from "lucide-react";
import { listSavedQuotes, deleteSavedQuote, setPendingLoad, type SavedQuote } from "@/lib/storage";
import { calculateQuote } from "@/lib/calculate";

const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(Math.round(n)) + "원";

export default function QuotesPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<SavedQuote[]>([]);

  useEffect(() => {
    setQuotes(listSavedQuotes());
  }, []);

  const handleLoad = (quote: SavedQuote) => {
    setPendingLoad(quote.input);
    router.push("/");
  };

  const handleDelete = (id: string) => {
    deleteSavedQuote(id);
    setQuotes(listSavedQuotes());
  };

  return (
    <div className="flex-1 p-12 flex flex-col items-center">
      <div className="w-full max-w-[900px]">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">견적 내역</h2>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">이 브라우저에 저장된 견적 목록</p>
        </div>

        {quotes.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-16 text-center text-sm text-slate-400">
            아직 저장된 견적이 없어요. 견적 결과 화면에서 &quot;견적 저장&quot;을 눌러보세요.
          </div>
        ) : (
          <div className="space-y-3">
            {quotes.map((quote) => {
              const result = calculateQuote(quote.input);
              return (
                <div key={quote.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-primary flex items-center justify-center shrink-0">
                      <FileText size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{quote.input.basicInfo.companyName || "업체명 미입력"} · {quote.input.basicInfo.projectName || "프로젝트명 미입력"}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {quote.input.basicInfo.date} 견적일 · {new Date(quote.savedAt).toLocaleString("ko-KR")} 저장
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <p className="text-sm font-black text-primary font-mono">{fmt(result.totalPrice)}</p>
                    <button onClick={() => handleLoad(quote)} className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-black transition-all">
                      <Upload size={13} />
                      <span>불러오기</span>
                    </button>
                    <button onClick={() => handleDelete(quote.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors" aria-label="삭제">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 5: 개발 서버로 확인**

`npm run dev`가 이미 실행 중이면 그대로 사용. 브라우저(또는 `run` 스킬)로:
1. `http://localhost:3000` 접속 → 왼쪽에 사이드바가 보이는지, 헤더와 겹치지 않는지 확인
2. 견적 하나를 6단계까지 작성 → "견적 저장" 클릭 → "저장했어요 ✓" 표시 확인
3. 사이드바 "견적 내역" 클릭 → `/quotes`에서 방금 저장한 카드가 보이는지 확인
4. "불러오기" 클릭 → `/`로 이동해서 6단계 결과 화면에 저장했던 값이 그대로 나오는지 확인
5. "삭제" 클릭 → 목록에서 사라지는지 확인

Expected: 위 5개 동작이 에러 없이 모두 확인됨

- [ ] **Step 6: 커밋**

```bash
git add components/Sidebar.tsx app/layout.tsx app/quotes/page.tsx
git commit -m "feat: wire up sidebar navigation and add saved-quotes history page"
```
