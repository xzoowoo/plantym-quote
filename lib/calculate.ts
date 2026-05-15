import type { QuoteInput, QuoteResult, LineItem, CategorySummary } from "@/lib/types";
import { RATES } from "@/lib/rates";

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

function buildSummary(items: LineItem[]): CategorySummary[] {
  const map: Record<string, number> = {};
  const labels: Record<LineItem["category"], string> = {
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
  const p = input.panelInfo.count;
  const durationMin = Math.max(1, Math.ceil((input.videoDetails?.durationSeconds ?? 0) / 60));

  if (input.contentTypes.includes("image") && input.imageDetails) {
    const img = input.imageDetails;
    const n = img.imageCount;

    if (!img.hasSource) {
      items.push(item("image", RATES.image.research, 1, true, p));
    }
    if (img.tasks.includes("resize") && n > 0) {
      const sets = Math.max(1, Math.ceil(n / 5));
      items.push(item("image", RATES.image.resize, sets, true, p));
    }
    if (img.tasks.includes("remove-bg"))
      items.push(item("image", RATES.image.removeBg, n, true, p));
    if (img.tasks.includes("separate"))
      items.push(item("image", RATES.image.separate, n, true, p));
    if (img.tasks.includes("reposition"))
      items.push(item("image", RATES.image.reposition, n, true, p));
    if (img.tasks.includes("composite"))
      items.push(item("image", RATES.image.composite, n, true, p));
    if (img.tasks.includes("text"))
      items.push(item("image", RATES.image.text, n, true, p));
    if (img.tasks.includes("design-element"))
      items.push(item("image", RATES.image.designElement, n, true, p));
  }

  if (input.contentTypes.includes("video") && input.videoDetails) {
    const vid = input.videoDetails;

    if (vid.cutEdit)
      items.push(item("video", RATES.video.cutEdit, durationMin, false, p));
    if (vid.subtitle)
      items.push(item("video", RATES.video.subtitle, durationMin, false, p));
    if (vid.rolling && vid.rollingCount > 0)
      items.push(item("video", RATES.video.rolling, vid.rollingCount, false, p));

    if (vid.transition !== "none") {
      const r = vid.transition === "basic" ? RATES.motion.transitionBasic : RATES.motion.transitionAdvanced;
      items.push(item("motion", r, vid.transitionCount, false, p));
    }
    if (vid.entrance !== "none") {
      const r = vid.entrance === "basic" ? RATES.motion.entranceBasic : RATES.motion.entranceAdvanced;
      items.push(item("motion", r, vid.entranceCount, false, p));
    }
    if (vid.emphasis !== "none") {
      const r = vid.emphasis === "basic" ? RATES.motion.emphasisBasic : RATES.motion.emphasisAdvanced;
      items.push(item("motion", r, vid.emphasisCount, false, p));
    }
    if (vid.special !== "none") {
      const r = vid.special === "basic" ? RATES.motion.specialBasic : RATES.motion.specialAdvanced;
      items.push(item("motion", r, vid.specialCount, false, p));
    }
    if (vid.animation !== "none") {
      const r = vid.animation === "basic" ? RATES.motion.animationBasic : RATES.motion.animationAdvanced;
      items.push(item("motion", r, vid.animationCount, false, p));
    }

    const renderRate = vid.renderQuality === "4k" ? RATES.render.k4 : RATES.render.fhd;
    items.push(item("render", renderRate, durationMin, false, 1));
    items.push(item("render", RATES.render.mp4Convert, durationMin, false, 1));
    if (vid.usbConvert)
      items.push(item("render", RATES.render.usb, 1, false, 1));
  }

  if (input.panelInfo.isVideoWall) {
    const r = p > 2 ? RATES.videoWall.advanced : RATES.videoWall.basic;
    items.push(item("motion", r, 1, false, 1));
  }

  if (input.contentTypes.includes("ai-image") && input.aiImageDetails.count > 0) {
    items.push(item("ai-image", RATES.ai.image, input.aiImageDetails.count, false, 1));
  }

  if (input.contentTypes.includes("ai-video") && input.aiVideoDetails.count > 0) {
    items.push(item("ai-video", RATES.ai.video, input.aiVideoDetails.count, false, 1));
  }

  const filteredItems = items.filter(i => i.quantity > 0 && i.totalCost > 0);

  const costSubtotal = items.reduce((s, i) => s + i.totalCost, 0);
  const marginAmount = Math.round(costSubtotal * input.marginRate / 100);
  const totalPrice = costSubtotal + marginAmount;

  return { lineItems: filteredItems, costSubtotal, marginAmount, totalPrice, categorySummary: buildSummary(filteredItems) };
}
