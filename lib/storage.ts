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
