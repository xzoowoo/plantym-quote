import { costFromMinutes, RATES, AI_RATES } from "@/lib/rates";

describe("costFromMinutes", () => {
  test("60분 × 하(1.0) = 23,505원", () => {
    expect(costFromMinutes(60, 1.0)).toBe(23505);
  });
  test("240분 × 중(1.5) = 141,030원", () => {
    expect(costFromMinutes(240, 1.5)).toBe(141030);
  });
});

describe("RATES 기본값 갱신 (2026-08-04 단가표 기준)", () => {
  test("사이즈 변경: 5분(하) = 1,959원", () => {
    expect(RATES.image.resize.minutes).toBe(5);
    expect(RATES.image.resize.difficultyWeight).toBe(1.0);
    expect(RATES.image.resize.cost).toBe(1959);
  });
  test("소스 분리: 1장당 36분(중) = 21,155원 (엑셀의 '5장에 180분'을 1장 기준으로 환산)", () => {
    expect(RATES.image.separate.minutes).toBe(36);
    expect(RATES.image.separate.cost).toBe(21155);
  });
  test("화면전환 기본: 5분(하) = 1,959원", () => {
    expect(RATES.motion.transitionBasic.minutes).toBe(5);
    expect(RATES.motion.transitionBasic.cost).toBe(1959);
  });
  test("기획 및 리서치는 480분(하) 기준으로 여전히 188,040원", () => {
    expect(RATES.planning.research.minutes).toBe(480);
    expect(RATES.planning.research.cost).toBe(188040);
  });
  test("프롬프트 설계는 240분(중) 기준으로 여전히 141,030원", () => {
    expect(RATES.planning.promptDesign.minutes).toBe(240);
    expect(RATES.planning.promptDesign.cost).toBe(141030);
  });
});

describe("AI_RATES", () => {
  test("AI 이미지: 작업비 393,709원(260804 단가표 기준) + 시도 10건×130원 = 395,009원", () => {
    expect(AI_RATES.image.laborCost).toBe(393709);
    const usageFee = AI_RATES.image.attemptGroups.reduce((s, g) => s + g.count * g.costPerAttempt, 0);
    expect(AI_RATES.image.laborCost + usageFee).toBe(395009);
  });
  test("AI 영상: 작업비 646,388원(260804 단가표 기준) + 영상 생성 10건×2,170원 = 668,088원 (참고이미지 생성 비용은 AI 이미지 항목과 중복이라 제외)", () => {
    expect(AI_RATES.video.laborCost).toBe(646388);
    const usageFee = AI_RATES.video.attemptGroups.reduce((s, g) => s + g.count * g.costPerAttempt, 0);
    expect(usageFee).toBe(21700);
    expect(AI_RATES.video.laborCost + usageFee).toBe(668088);
  });
});
