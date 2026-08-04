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
    // 단가표/영상 제작 견적서_260804.xlsx '세부 견적 내역서' 시트 '3. AI 이미지 생성' 기준
    // 기획및리서치 23,505(60분,하) + 프롬프트엔지니어링 17,628.75(30분,중)
    // + 이미지생성및선별 70,515(180분,하) + 후보정및합성 282,060(480분,중) = 393,708.75 → 393,709(작업비)
    laborCost: 393709,
    attemptGroups: [
      { label: "이미지 생성 횟수", count: 10, costPerAttempt: 130 },
    ],
  },
  video: {
    name: "AI 영상 생성",
    unit: "1건",
    // 단가표/영상 제작 견적서_260804.xlsx '세부 견적 내역서' 시트 '4. AI 이미지 및 영상 생성' 기준
    // 기획및리서치 70,515(180분,하) + 프롬프트엔지니어링 35,257.5(60분,중)
    // + 영상생성및선별 188,040(480분,하) + 후보정및합성 352,575(600분,중) = 646,387.5 → 646,388(작업비)
    laborCost: 646388,
    // AI 이미지 생성 항목이 별도로 있으므로, 참고이미지 생성 시도 비용은 여기서 제외하고 영상 생성 시도만 반영한다.
    // (영상 생성 2,170원/건, Gemini Veo 기준, 환율 1,550원/USD, 2026-07-01 기준)
    attemptGroups: [
      { label: "영상 생성 횟수", count: 10, costPerAttempt: 2170 },
    ],
  },
};
