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

  test("패널 2개 → 이미지 항목 비용 × 2", () => {
    const input: QuoteInput = {
      ...baseInput,
      panelInfo: { count: 2, size: "55인치", orientation: "horizontal", resolution: "fhd", isVideoWall: false },
      contentTypes: ["image"],
      imageDetails: { hasSource: true, imageCount: 1, tasks: ["remove-bg"] },
    };
    const result = calculateQuote(input);
    const item = result.lineItems.find((i) => i.name === "배경 제거(누끼)");
    expect(item!.totalCost).toBe(11753 * 2);
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

  test("AI 이미지 2건 → 40,475 × 2", () => {
    const input: QuoteInput = {
      ...baseInput,
      contentTypes: ["ai-image"],
      aiImageDetails: { count: 2 },
    };
    const result = calculateQuote(input);
    const item = result.lineItems.find((i) => i.name === "AI 이미지 생성");
    expect(item!.totalCost).toBe(40475 * 2);
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

  test("일정 미입력 시 기존 계산과 동일", () => {
    const input: QuoteInput = {
      ...baseInput,
      contentTypes: ["image"],
      imageDetails: { hasSource: false, imageCount: 1, tasks: [] },
    };
    const withoutSchedule = calculateQuote(input);
    const withZeroSchedule = calculateQuote({ ...input, expectedScheduleDays: 0 });
    expect(withZeroSchedule.costSubtotal).toBe(withoutSchedule.costSubtotal);
  });

  test("예상 제작일정 입력 시 항목 비율 유지하며 총액이 일정에 맞춰짐", () => {
    const base: QuoteInput = {
      ...baseInput,
      contentTypes: ["image"],
      imageDetails: { hasSource: false, imageCount: 1, tasks: ["remove-bg"] },
    };
    const baseResult = calculateQuote(base);
    const result = calculateQuote({ ...base, expectedScheduleDays: 10 });

    const researchBase = baseResult.lineItems.find(i => i.name === "소스 리서치")!.totalCost;
    const removeBgBase = baseResult.lineItems.find(i => i.name === "배경 제거(누끼)")!.totalCost;
    const research = result.lineItems.find(i => i.name === "소스 리서치")!.totalCost;
    const removeBg = result.lineItems.find(i => i.name === "배경 제거(누끼)")!.totalCost;

    expect(research / removeBg).toBeCloseTo(researchBase / removeBgBase, 2);
    expect(result.costSubtotal).toBeCloseTo(10 * 188040, -2);
  });

  test("AI 이미지 포함 시 AI 솔루션 사용료는 일정과 무관하게 고정", () => {
    const input: QuoteInput = {
      ...baseInput,
      contentTypes: ["ai-image"],
      aiImageDetails: { count: 1 },
      expectedScheduleDays: 1,
    };
    const result = calculateQuote(input);
    const total = result.lineItems.find(i => i.name === "AI 이미지 생성")!.totalCost;
    expect(total).toBe(Math.round(1 * 188040) + 1300);
  });

  test("선택된 항목 없이 일정만 입력해도 에러 없이 0원", () => {
    const result = calculateQuote({ ...baseInput, expectedScheduleDays: 20 });
    expect(result.costSubtotal).toBe(0);
    expect(result.totalPrice).toBe(0);
  });
});
