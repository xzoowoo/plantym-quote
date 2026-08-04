import { getCatalog } from "@/lib/catalog";

describe("getCatalog", () => {
  test("AI 이미지 항목은 laborCost와 attemptGroups를 포함", () => {
    const aiImage = getCatalog().find(c => c.category === "ai-image");
    expect(aiImage?.laborCost).toBe(15670);
    expect(aiImage?.attemptGroups?.[0]).toEqual({ label: "이미지 생성 시도", count: 10, costPerAttempt: 130 });
    expect(aiImage?.unitCost).toBe(16970);
  });

  test("일반 항목(사이즈 변경)은 minutes와 difficultyWeight를 포함", () => {
    const resize = getCatalog().find(c => c.category === "image" && c.name === "사이즈 변경");
    expect(resize?.minutes).toBe(5);
    expect(resize?.difficultyWeight).toBe(1.0);
    expect(resize?.unitCost).toBe(1959);
  });

  test("기획 및 리서치 항목이 카탈로그에 존재 (더 이상 자동 포함되지 않으므로 수동 추가용)", () => {
    const research = getCatalog().find(c => c.category === "planning" && c.name === "기획 및 리서치");
    expect(research).toBeDefined();
    expect(research?.unitCost).toBe(188040);
  });
});
