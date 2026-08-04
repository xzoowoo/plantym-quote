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
