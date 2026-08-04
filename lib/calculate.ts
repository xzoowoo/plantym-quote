import type { QuoteInput, QuoteResult, LineItem, CategorySummary } from "@/lib/types";
import { RATES, AI_RATES, type RateItem, type AIRate } from "@/lib/rates";

function item(
  category: LineItem["category"],
  rate: RateItem,
  quantity: number,
  perPanel: boolean,
  panelCount: number
): LineItem {
  const effectiveQty = perPanel ? quantity * panelCount : quantity;
  return {
    category,
    name: rate.name,
    unit: rate.unit,
    quantity: effectiveQty,
    unitCost: rate.cost,
    totalCost: rate.cost * effectiveQty,
    minutes: rate.minutes,
    difficultyWeight: rate.difficultyWeight,
  };
}

function aiItem(category: "ai-image" | "ai-video", rate: AIRate, quantity: number): LineItem {
  const usageFee = rate.attemptGroups.reduce((s, g) => s + g.count * g.costPerAttempt, 0);
  const unitCost = rate.laborCost + usageFee;
  return {
    category,
    name: rate.name,
    unit: rate.unit,
    quantity,
    unitCost,
    totalCost: unitCost * quantity,
    laborCost: rate.laborCost,
    attemptGroups: rate.attemptGroups,
  };
}

export function recalcResult(lineItems: LineItem[], marginRate: number): QuoteResult {
  const costSubtotal = lineItems.reduce((s, i) => s + i.totalCost, 0);
  const marginAmount = Math.round(costSubtotal * marginRate / 100);
  const totalPrice = costSubtotal + marginAmount;
  return { lineItems, costSubtotal, marginAmount, totalPrice, categorySummary: buildSummary(lineItems) };
}

function buildSummary(items: LineItem[]): CategorySummary[] {
  const map: Record<string, number> = {};
  const labels: Record<LineItem["category"], string> = {
    planning: "기획",
    image: "이미지 제작",
    video: "영상·모션 제작",
    motion: "영상·모션 제작",
    render: "영상·모션 제작",
    "ai-image": "AI 이미지 생성",
    "ai-video": "AI 영상 생성",
  };
  for (const i of items) {
    const label = labels[i.category];
    map[label] = (map[label] ?? 0) + i.totalCost;
  }
  return Object.entries(map).map(([label, amount]) => ({ label, amount }));
}

export function calculateQuote(input: QuoteInput): QuoteResult {
  const items: LineItem[] = [];
  const push = (line: LineItem) => { items.push(line); };

  const p = input.panelInfo.count;
  const durationMin = Math.max(1, Math.ceil((input.videoDetails?.durationSeconds ?? 0) / 60));

  if (input.contentTypes.includes("ai-image") || input.contentTypes.includes("ai-video")) {
    push(item("planning", RATES.planning.promptDesign, 1, false, 1));
  }

  if (input.contentTypes.includes("image") && input.imageDetails) {
    const img = input.imageDetails;
    const n = img.imageCount;

    if (!img.hasSource) {
      push(item("image", RATES.image.research, 1, false, 1));
    }
    if (img.tasks.includes("resize") && n > 0) {
      push(item("image", RATES.image.resize, n, false, 1));
    }
    if (img.tasks.includes("remove-bg"))
      push(item("image", RATES.image.removeBg, n, false, 1));
    if (img.tasks.includes("separate"))
      push(item("image", RATES.image.separate, n, false, 1));
    if (img.tasks.includes("reposition"))
      push(item("image", RATES.image.reposition, n, false, 1));
    if (img.tasks.includes("composite"))
      push(item("image", RATES.image.composite, n, false, 1));
    if (img.tasks.includes("text"))
      push(item("image", RATES.image.text, n, false, 1));
    if (img.tasks.includes("design-element"))
      push(item("image", RATES.image.designElement, n, false, 1));
  }

  if (input.contentTypes.includes("video") && input.videoDetails) {
    const vid = input.videoDetails;

    if (vid.cutEdit)
      push(item("video", RATES.video.cutEdit, durationMin, false, p));
    if (vid.subtitle)
      push(item("video", RATES.video.subtitle, durationMin, false, p));
    if (vid.rolling && vid.rollingCount > 0)
      push(item("motion", RATES.motion.rolling, vid.rollingCount, false, p));

    if (vid.transition !== "none") {
      const r = vid.transition === "basic" ? RATES.motion.transitionBasic : RATES.motion.transitionAdvanced;
      push(item("motion", r, vid.transitionCount, false, p));
    }
    if (vid.entrance !== "none") {
      const r = vid.entrance === "basic" ? RATES.motion.entranceBasic : RATES.motion.entranceAdvanced;
      push(item("motion", r, vid.entranceCount, false, p));
    }
    if (vid.emphasis !== "none") {
      const r = vid.emphasis === "basic" ? RATES.motion.emphasisBasic : RATES.motion.emphasisAdvanced;
      push(item("motion", r, vid.emphasisCount, false, p));
    }
    if (vid.special !== "none") {
      const r = vid.special === "basic" ? RATES.motion.specialBasic : RATES.motion.specialAdvanced;
      push(item("motion", r, vid.specialCount, false, p));
    }
    if (vid.animation !== "none") {
      const r = vid.animation === "basic" ? RATES.motion.animationBasic : RATES.motion.animationAdvanced;
      push(item("motion", r, vid.animationCount, false, p));
    }

    const renderRate = vid.renderQuality === "4k" ? RATES.render.k4 : RATES.render.fhd;
    push(item("render", renderRate, durationMin, false, 1));
    push(item("render", RATES.render.mp4Convert, durationMin, false, 1));
    if (vid.usbConvert)
      push(item("render", RATES.render.usb, 1, false, 1));
  }

  if (input.panelInfo.isVideoWall) {
    const r = p > 2 ? RATES.videoWall.advanced : RATES.videoWall.basic;
    push(item("motion", r, 1, false, 1));
  }

  if (input.contentTypes.includes("ai-image") && input.aiImageDetails.count > 0) {
    push(aiItem("ai-image", AI_RATES.image, input.aiImageDetails.count));
  }

  if (input.contentTypes.includes("ai-video") && input.aiVideoDetails.count > 0) {
    push(aiItem("ai-video", AI_RATES.video, input.aiVideoDetails.count));
  }

  const filteredItems = items.filter(i => i.quantity > 0 && i.totalCost > 0);

  return recalcResult(filteredItems, input.marginRate);
}
