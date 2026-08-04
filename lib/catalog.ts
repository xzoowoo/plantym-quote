import type { LineItem, AttemptGroup } from "@/lib/types";
import { RATES, AI_RATES, type RateItem, type AIRate } from "@/lib/rates";

export interface CatalogItem {
  category: LineItem["category"];
  name: string;
  unit: string;
  unitCost: number;
  minutes?: number;
  difficultyWeight?: number;
  laborCost?: number;
  attemptGroups?: AttemptGroup[];
}

function toCatalogItem(category: LineItem["category"], rate: RateItem): CatalogItem {
  return {
    category,
    name: rate.name,
    unit: rate.unit,
    unitCost: rate.cost,
    minutes: rate.minutes,
    difficultyWeight: rate.difficultyWeight,
  };
}

function toAICatalogItem(category: "ai-image" | "ai-video", rate: AIRate): CatalogItem {
  const usageFee = rate.attemptGroups.reduce((s, g) => s + g.count * g.costPerAttempt, 0);
  return {
    category,
    name: rate.name,
    unit: rate.unit,
    unitCost: rate.laborCost + usageFee,
    laborCost: rate.laborCost,
    attemptGroups: rate.attemptGroups,
  };
}

export function getCatalog(): CatalogItem[] {
  const list: CatalogItem[] = [];
  Object.values(RATES.planning).forEach(r => list.push(toCatalogItem("planning", r)));
  Object.values(RATES.image).forEach(r => list.push(toCatalogItem("image", r)));
  Object.values(RATES.video).forEach(r => list.push(toCatalogItem("video", r)));
  Object.values(RATES.motion).forEach(r => list.push(toCatalogItem("motion", r)));
  Object.values(RATES.videoWall).forEach(r => list.push(toCatalogItem("motion", r)));
  Object.values(RATES.render).forEach(r => list.push(toCatalogItem("render", r)));
  list.push(toAICatalogItem("ai-image", AI_RATES.image));
  list.push(toAICatalogItem("ai-video", AI_RATES.video));
  return list;
}
