import { calculateQuote } from "@/lib/calculate";
import type { QuoteInput } from "@/lib/types";

const baseInput: QuoteInput = {
  basicInfo: { companyName: "테스트업체", contactName: "홍길동", projectName: "테스트", date: "2026-05-14" },
  panelInfo: { count: 1, size: "55인치", orientation: "horizontal", resolution: "fhd", isVideoWall: false },
  contentTypes: [],
  imageDetails: { hasSource: true, imageCount: 0, tasks: [] },
  videoDetails: {
    durationSeconds: 0, cutEdit: false, subtitle: false,
    rolling: false, rollingCount: 0,
    transition: "none", transitionCount: 0,
    entrance: "none", entranceCount: 0,
    emphasis: "none", emphasisCount: 0,
    special: "none", specialCount: 0,
    animation: "none", animationCount: 0,
    renderQuality: "fhd", usbConvert: false,
  },
  aiImageDetails: { count: 0 },
  aiVideoDetails: { count: 0 },
  freeText: "",
  marginRate: 0,
};

describe("calculateQuote", () => {
  test("콘텐츠 없으면 합계 0", () => {
    const result = calculateQuote(baseInput);
    expect(result.costSubtotal).toBe(0);
    expect(result.totalPrice).toBe(0);
  });

  test("소스 없는 이미지 → 소스 리서치 23,505원 포함", () => {
    const input: QuoteInput = {
      ...baseInput,
      contentTypes: ["image"],
      imageDetails: { hasSource: false, imageCount: 1, tasks: [] },
    };
    const result = calculateQuote(input);
    const item = result.lineItems.find((i) => i.name === "소스 리서치");
    expect(item).toBeDefined();
    expect(item!.totalCost).toBe(23505);
  });

  test("배경 제거 2장 → 11,753 × 2", () => {
    const input: QuoteInput = {
      ...baseInput,
      contentTypes: ["image"],
      imageDetails: { hasSource: true, imageCount: 2, tasks: ["remove-bg"] },
    };
    const result = calculateQuote(input);
    const item = result.lineItems.find((i) => i.name === "배경 제거(누끼)");
    expect(item).toBeDefined();
    expect(item!.totalCost).toBe(11753 * 2);
  });

  test("마진 30% → totalPrice = costSubtotal × 1.3", () => {
    const input: QuoteInput = {
      ...baseInput,
      contentTypes: ["image"],
      imageDetails: { hasSource: false, imageCount: 1, tasks: [] },
      marginRate: 30,
    };
    const result = calculateQuote(input);
    expect(result.marginAmount).toBe(Math.round(result.costSubtotal * 0.3));
    expect(result.totalPrice).toBe(result.costSubtotal + result.marginAmount);
  });

  test("패널 수가 늘어도 이미지 작업 비용은 그대로 (이미지 수만 반영)", () => {
    const input: QuoteInput = {
      ...baseInput,
      panelInfo: { count: 2, size: "55인치", orientation: "horizontal", resolution: "fhd", isVideoWall: false },
      contentTypes: ["image"],
      imageDetails: { hasSource: true, imageCount: 1, tasks: ["remove-bg"] },
    };
    const result = calculateQuote(input);
    const item = result.lineItems.find((i) => i.name === "배경 제거(누끼)");
    expect(item!.totalCost).toBe(11753);
  });

  test("사이즈 변경 4장 → 1,959 × 4 (1장 단가, 2026-08-04 단가표 기준 5분)", () => {
    const input: QuoteInput = {
      ...baseInput,
      contentTypes: ["image"],
      imageDetails: { hasSource: true, imageCount: 4, tasks: ["resize"] },
    };
    const result = calculateQuote(input);
    const item = result.lineItems.find((i) => i.name === "사이즈 변경");
    expect(item!.totalCost).toBe(1959 * 4);
    expect(item!.minutes).toBe(5);
    expect(item!.difficultyWeight).toBe(1.0);
  });

  test("등장효과 기본 3건 → 3,918 × 3", () => {
    const input: QuoteInput = {
      ...baseInput,
      contentTypes: ["video"],
      videoDetails: {
        ...baseInput.videoDetails,
        durationSeconds: 60,
        entrance: "basic",
        entranceCount: 3,
        renderQuality: "fhd",
      },
    };
    const result = calculateQuote(input);
    const item = result.lineItems.find((i) => i.name === "등장효과 기본");
    expect(item!.totalCost).toBe(3918 * 3);
  });

  test("AI 이미지 2건 → 16,970 × 2, laborCost/attemptGroups 포함", () => {
    const input: QuoteInput = {
      ...baseInput,
      contentTypes: ["ai-image"],
      aiImageDetails: { count: 2 },
    };
    const result = calculateQuote(input);
    const item = result.lineItems.find((i) => i.name === "AI 이미지 생성");
    expect(item!.totalCost).toBe(16970 * 2);
    expect(item!.laborCost).toBe(15670);
    expect(item!.attemptGroups).toEqual([{ label: "이미지 생성 횟수", count: 10, costPerAttempt: 130 }]);
  });

  test("AI 영상 항목은 영상 생성 횟수 그룹 하나만 가짐 (참고이미지 비용은 AI 이미지 항목과 중복이라 제외)", () => {
    const input: QuoteInput = {
      ...baseInput,
      contentTypes: ["ai-video"],
      aiVideoDetails: { count: 1 },
    };
    const result = calculateQuote(input);
    const item = result.lineItems.find((i) => i.name === "AI 영상 생성");
    expect(item!.attemptGroups).toEqual([{ label: "영상 생성 횟수", count: 480, costPerAttempt: 2170 }]);
    expect(item!.totalCost).toBe(5742600);
  });

  test("categorySummary에 이미지·AI 카테고리 집계", () => {
    const input: QuoteInput = {
      ...baseInput,
      contentTypes: ["image", "ai-image"],
      imageDetails: { hasSource: false, imageCount: 1, tasks: [] },
      aiImageDetails: { count: 1 },
    };
    const result = calculateQuote(input);
    const labels = result.categorySummary.map((c) => c.label);
    expect(labels).toContain("이미지 제작");
    expect(labels).toContain("AI 이미지 생성");
  });

  test("예상 제작일정을 입력해도 costSubtotal이 변하지 않음 (재조정 로직 삭제 회귀 확인)", () => {
    const input: QuoteInput = {
      ...baseInput,
      contentTypes: ["image"],
      imageDetails: { hasSource: false, imageCount: 1, tasks: ["remove-bg"] },
    };
    const withoutSchedule = calculateQuote(input);
    const with10Days = calculateQuote({ ...input, expectedScheduleDays: 10 });
    const with1Day = calculateQuote({ ...input, expectedScheduleDays: 1 });
    expect(with10Days.costSubtotal).toBe(withoutSchedule.costSubtotal);
    expect(with1Day.costSubtotal).toBe(withoutSchedule.costSubtotal);
  });

  test("같은 항목(배경 제거)은 이미지만 있는 견적과 이미지+영상이 함께 있는 견적에서 금액이 동일함", () => {
    const imageOnly: QuoteInput = {
      ...baseInput,
      contentTypes: ["image"],
      imageDetails: { hasSource: true, imageCount: 3, tasks: ["remove-bg"] },
    };
    const imageAndVideo: QuoteInput = {
      ...imageOnly,
      contentTypes: ["image", "video"],
      videoDetails: { ...baseInput.videoDetails, durationSeconds: 120, cutEdit: true, subtitle: true },
    };
    const a = calculateQuote(imageOnly).lineItems.find(i => i.name === "배경 제거(누끼)")!.totalCost;
    const b = calculateQuote(imageAndVideo).lineItems.find(i => i.name === "배경 제거(누끼)")!.totalCost;
    expect(a).toBe(b);
  });

  test("선택된 항목 없이 일정만 입력해도 에러 없이 0원", () => {
    const result = calculateQuote({ ...baseInput, expectedScheduleDays: 20 });
    expect(result.costSubtotal).toBe(0);
    expect(result.totalPrice).toBe(0);
  });

  test("콘텐츠 유형을 선택해도 기획 및 리서치 항목은 더 이상 자동 포함되지 않음", () => {
    const input: QuoteInput = {
      ...baseInput,
      contentTypes: ["image"],
      imageDetails: { hasSource: false, imageCount: 1, tasks: [] },
    };
    const result = calculateQuote(input);
    expect(result.lineItems.find((i) => i.name === "기획 및 리서치")).toBeUndefined();
  });

  test("AI 콘텐츠를 선택하지 않으면 프롬프트 설계 항목은 없음", () => {
    const input: QuoteInput = {
      ...baseInput,
      contentTypes: ["image"],
      imageDetails: { hasSource: false, imageCount: 1, tasks: [] },
    };
    const result = calculateQuote(input);
    expect(result.lineItems.find((i) => i.name === "프롬프트 설계")).toBeUndefined();
  });

  test("AI 콘텐츠를 선택하면 프롬프트 설계 항목이 여전히 자동으로 추가됨", () => {
    const input: QuoteInput = {
      ...baseInput,
      contentTypes: ["ai-image"],
      aiImageDetails: { count: 1 },
    };
    const result = calculateQuote(input);
    const prompt = result.lineItems.find((i) => i.name === "프롬프트 설계");
    expect(prompt).toBeDefined();
    expect(prompt!.totalCost).toBe(141030);
  });
});
