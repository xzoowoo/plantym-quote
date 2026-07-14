export const DAILY_RATE = 188040;
const MIN_RATE = DAILY_RATE / 480;

type Difficulty = "low" | "mid" | "high";
const DIFFICULTY: Record<Difficulty, number> = { low: 1.0, mid: 1.5, high: 2.0 };

function c(minutes: number, d: Difficulty, baseQty: number = 1): number {
  return Math.round(minutes * MIN_RATE * DIFFICULTY[d] * baseQty);
}

export interface RateItem {
  name: string;
  unit: string;
  cost: number;
  usageFee?: number;
}

export const RATES = {
  image: {
    research:      { name: "소스 리서치",        unit: "1건", cost: c(60, "low") },
    resize:        { name: "사이즈 변경",         unit: "1장", cost: c(1,  "low") },
    removeBg:      { name: "배경 제거(누끼)",     unit: "1장", cost: c(20, "mid") },
    separate:      { name: "소스 분리",           unit: "1장", cost: c(30, "mid") },
    reposition:    { name: "소스 재배치",         unit: "1장", cost: c(30, "mid") },
    composite:     { name: "합성",               unit: "1장", cost: c(10, "mid") },
    text:          { name: "텍스트 추가",         unit: "1장", cost: c(10, "mid") },
    designElement: { name: "디자인 요소 추가",    unit: "1장", cost: c(10, "mid") },
  },
  video: {
    cutEdit:  { name: "컷 편집",   unit: "1분", cost: c(5,  "low") },
    subtitle: { name: "자막 삽입", unit: "1분", cost: c(10, "low") },
  },
  motion: {
    rolling:            { name: "롤링",        unit: "1장", cost: c(5, "low") },
    transitionBasic:    { name: "화면전환 기본",   unit: "1건", cost: c(1,   "low")  },
    transitionAdvanced: { name: "화면전환 고급",   unit: "1건", cost: c(30,  "mid")  },
    entranceBasic:      { name: "등장효과 기본",   unit: "1건", cost: c(10,  "low")  },
    entranceAdvanced:   { name: "등장효과 고급",   unit: "1건", cost: c(45,  "high") },
    emphasisBasic:      { name: "강조효과 기본",   unit: "1건", cost: c(10,  "low")  },
    emphasisAdvanced:   { name: "강조효과 고급",   unit: "1건", cost: c(45,  "mid")  },
    specialBasic:       { name: "특수효과 기본",   unit: "1건", cost: c(5,   "mid")  },
    specialAdvanced:    { name: "특수효과 고급",   unit: "1건", cost: c(150, "high") },
    animationBasic:     { name: "애니메이션 기본", unit: "1건", cost: c(10,  "low")  },
    animationAdvanced:  { name: "애니메이션 고급", unit: "1건", cost: c(165, "high") },
  },
  videoWall: {
    basic:    { name: "비디오월 기본", unit: "1건", cost: c(5,  "low") },
    advanced: { name: "비디오월 고급", unit: "1건", cost: c(30, "low") },
  },
  render: {
    fhd:        { name: "FHD 출력",  unit: "1분", cost: c(2, "low") },
    k4:         { name: "4K 출력",   unit: "1분", cost: c(3, "mid") },
    mp4Convert: { name: "MP4 변환",  unit: "1분", cost: c(2, "low") },
    usb:        { name: "USB 변환",  unit: "1개", cost: c(5, "low") },
  },
  planning: {
    // 기획 및 리서치: 480분(하) — AI 사용 여부와 무관하게 모든 견적에 항상 1식 포함
    research: { name: "기획 및 리서치", unit: "1식", cost: 188040 },
    // 프롬프트 설계: 240분(중) — AI 이미지/영상 생성을 선택했을 때만 1식 포함
    promptDesign: { name: "프롬프트 설계", unit: "1식", cost: 141030 },
  },
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
} as const;
