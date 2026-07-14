import type { QuoteInput, QuoteResult, LineItem, CategorySummary } from "@/lib/types";
import { RATES, DAILY_RATE } from "@/lib/rates";

function item(
  category: LineItem["category"],
  rate: { name: string; unit: string; cost: number },
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
  };
}

function aiItem(
  category: "ai-image" | "ai-video",
  rate: { name: string; unit: string; cost: number; usageFee?: number },
  quantity: number
): { line: LineItem; fixedPortion: number } {
  const fee = rate.usageFee ?? 0;
  const totalCost = (rate.cost + fee) * quantity;
  return {
    line: {
      category,
      name: rate.name,
      unit: rate.unit,
      quantity,
      unitCost: rate.cost + fee,
      totalCost,
    },
    fixedPortion: fee * quantity,
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
  const fixedPortions: number[] = [];
  const push = (line: LineItem, fixedPortion = 0) => {
    items.push(line);
    fixedPortions.push(fixedPortion);
  };

  const p = input.panelInfo.count;
  const durationMin = Math.max(1, Math.ceil((input.videoDetails?.durationSeconds ?? 0) / 60));

  if (input.contentTypes.length > 0) {
    push(item("planning", RATES.planning.research, 1, false, 1));
  }
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
    const { line, fixedPortion } = aiItem("ai-image", RATES.ai.image, input.aiImageDetails.count);
    push(line, fixedPortion);
  }

  if (input.contentTypes.includes("ai-video") && input.aiVideoDetails.count > 0) {
    const { line, fixedPortion } = aiItem("ai-video", RATES.ai.video, input.aiVideoDetails.count);
    push(line, fixedPortion);
  }

  const keepIdx = items.map((_, i) => i).filter(i => items[i].quantity > 0 && items[i].totalCost > 0);
  let filteredItems = keepIdx.map(i => items[i]);
  const filteredFixed = keepIdx.map(i => fixedPortions[i]);

  const schedule = input.expectedScheduleDays;
  if (schedule && schedule > 0) {
    const scalableSum = filteredItems.reduce((s, it, i) => s + (it.totalCost - filteredFixed[i]), 0);
    if (scalableSum > 0) {
      const targetBudget = schedule * DAILY_RATE;
      const scaleFactor = targetBudget / scalableSum;
      filteredItems = filteredItems.map((it, i) => {
        const fixed = filteredFixed[i];
        const scalable = it.totalCost - fixed;
        const totalCost = Math.round(scalable * scaleFactor + fixed);
        return { ...it, totalCost, unitCost: Math.round(totalCost / it.quantity) };
      });
    }
  }

  return recalcResult(filteredItems, input.marginRate);
}
