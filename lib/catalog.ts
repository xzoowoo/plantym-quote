import type { LineItem } from "@/lib/types";
import { RATES, type RateItem } from "@/lib/rates";

export interface CatalogItem {
  category: LineItem["category"];
  name: string;
  unit: string;
  unitCost: number;
}

function toCatalogItem(category: LineItem["category"], rate: RateItem): CatalogItem {
  return { category, name: rate.name, unit: rate.unit, unitCost: rate.cost + (rate.usageFee ?? 0) };
}

export function getCatalog(): CatalogItem[] {
  const list: CatalogItem[] = [];
  Object.values(RATES.planning).forEach(r => list.push(toCatalogItem("planning", r)));
  Object.values(RATES.image).forEach(r => list.push(toCatalogItem("image", r)));
  Object.values(RATES.video).forEach(r => list.push(toCatalogItem("video", r)));
  Object.values(RATES.motion).forEach(r => list.push(toCatalogItem("motion", r)));
  Object.values(RATES.videoWall).forEach(r => list.push(toCatalogItem("motion", r)));
  Object.values(RATES.render).forEach(r => list.push(toCatalogItem("render", r)));
  list.push(toCatalogItem("ai-image", RATES.ai.image));
  list.push(toCatalogItem("ai-video", RATES.ai.video));
  return list;
}
