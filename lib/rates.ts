const DAILY_RATE = 188040;
const MIN_RATE = DAILY_RATE / 480;

type Difficulty = "low" | "mid" | "high";
const DIFFICULTY: Record<Difficulty, number> = { low: 1.0, mid: 1.5, high: 2.0 };

function c(minutes: number, d: Difficulty): number {
  return Math.round(minutes * MIN_RATE * DIFFICULTY[d]);
}

export interface RateItem {
  name: string;
  unit: string;
  cost: number;
}

export const RATES = {
  image: {
    research:      { name: "소스 리서치",        unit: "1건", cost: c(60, "low") },
    resize:        { name: "사이즈 변경",         unit: "5장", cost: c(1,  "low") },
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
    rolling:  { name: "롤링",      unit: "1장", cost: Math.round(c(5, "low") / 10) },
  },
  motion: {
    transitionBasic:    { name: "화면전환 기본",   unit: "1건", cost: c(1,   "low")  },
    transitionAdvanced: { name: "화면전환 고급",   unit: "1건", cost: c(30,  "mid")  },
    entranceBasic:      { name: "등장효과 기본",   unit: "1건", cost: c(10,  "low")  },
    entranceAdvanced:   { name: "등장효과 고급",   unit: "1건", cost: c(45,  "high") },
    emphasisBasic:      { name: "강조효과 기본",   unit: "1건", cost: c(10,  "low")  },
    emphasisAdvanced:   { name: "강조효과 고급",   unit: "1건", cost: c(45,  "mid")  },
    specialBasic:       { name: "특수효과 기본",   unit: "1건", cost: c(5,   "mid")  },
    specialAdvanced:    { name: "특수효과 고급",   unit: "1장", cost: c(150, "high") },
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
  ai: {
    image: { name: "AI 이미지 생성", unit: "1건", cost: 43675 },
    video: { name: "AI 영상 생성",   unit: "1건", cost: 100503 },
  },
} as const;
