"use client";
import React, { useState } from "react";
import { Trash2, Plus } from "lucide-react";
import type { QuoteInput, QuoteResult, LineItem } from "@/lib/types";
import type { CatalogItem } from "@/lib/catalog";

const CATEGORY_INFO: Record<LineItem["category"], { label: string; english: string }> = {
  planning:   { label: "기획",        english: "Planning" },
  image:      { label: "이미지 제작",  english: "Image Production" },
  video:      { label: "영상 제작",    english: "Video Production" },
  motion:     { label: "모션그래픽",   english: "Motion Graphic" },
  render:     { label: "렌더.인코딩", english: "Rendering" },
  "ai-image": { label: "AI 이미지",   english: "AI Image" },
  "ai-video": { label: "AI 영상",     english: "AI Video" },
};

const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(Math.round(n)) + "원";

function AddItemRow({ catalog, onAdd }: { catalog: CatalogItem[]; onAdd: (c: CatalogItem, qty: number) => void }) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [qty, setQty] = useState(1);

  if (catalog.length === 0) return null;

  const selected = catalog[selectedIdx];
  const isAI = selected.category === "ai-image" || selected.category === "ai-video";

  return (
    <div className="px-6 py-4 border-t border-slate-100 flex items-center gap-3">
      <select
        value={selectedIdx}
        onChange={e => setSelectedIdx(Number(e.target.value))}
        className="flex-1 bg-slate-50 border-2 border-slate-50 rounded-xl py-2.5 px-3 text-[13px] font-bold text-slate-700 outline-none focus:border-primary/30 focus:bg-white transition-all"
      >
        {catalog.map((c, i) => (
          <option key={i} value={i}>
            {CATEGORY_INFO[c.category].label} · {c.name} ({fmt(c.unitCost)}/{c.unit})
          </option>
        ))}
      </select>
      <input
        type="number"
        min={1}
        value={isAI ? 1 : qty}
        disabled={isAI}
        title={isAI ? "AI 항목은 1건 고정으로만 추가할 수 있습니다." : undefined}
        onChange={e => setQty(Math.max(1, Number(e.target.value)))}
        className="w-20 text-center bg-slate-50 border-2 border-slate-50 rounded-xl py-2.5 outline-none focus:border-primary/30 focus:bg-white transition-all font-bold text-[13px] disabled:text-slate-400 disabled:cursor-not-allowed"
      />
      <button
        onClick={() => { onAdd(selected, isAI ? 1 : qty); setQty(1); }}
        className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-primary text-white text-[13px] font-bold hover:bg-blue-700 transition-all shrink-0"
      >
        <Plus size={14} />
        <span>항목 추가</span>
      </button>
    </div>
  );
}

interface Props {
  result: QuoteResult;
  input?: QuoteInput;
  editable?: boolean;
  catalog?: CatalogItem[];
  onUpdateQuantity?: (index: number, quantity: number) => void;
  onUpdateMinutes?: (index: number, minutes: number) => void;
  onUpdateAttemptCount?: (index: number, groupIndex: number, count: number) => void;
  onRemoveItem?: (index: number) => void;
  onAddItem?: (catalogItem: CatalogItem, quantity: number) => void;
}

export default function QuoteTable({ result, input, editable, catalog, onUpdateQuantity, onUpdateMinutes, onUpdateAttemptCount, onRemoveItem, onAddItem }: Props) {
  const grouped: { category: LineItem["category"]; items: { item: LineItem; index: number }[] }[] = [];
  result.lineItems.forEach((lineItem, index) => {
    const group = grouped.find(g => g.category === lineItem.category);
    const entry = { item: lineItem, index };
    if (group) {
      group.items.push(entry);
    } else {
      grouped.push({ category: lineItem.category, items: [entry] });
    }
  });

  const marginRate = result.costSubtotal > 0
    ? Math.round(result.marginAmount / result.costSubtotal * 100)
    : 0;
  const colCount = editable ? 7 : 6;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="px-6 py-4 text-[11px] font-bold text-slate-400">작업 항목</th>
            <th className="px-4 py-4 text-[11px] font-bold text-slate-400 text-center w-[80px]">기준</th>
            <th className="px-4 py-4 text-[11px] font-bold text-slate-400 text-center w-[70px]">수량</th>
            <th className="px-4 py-4 text-[11px] font-bold text-slate-400 text-center w-[150px]">소요시간/건수 (건당)</th>
            <th className="px-4 py-4 text-[11px] font-bold text-slate-400 text-right w-[130px]">단가</th>
            <th className="px-4 py-4 text-[11px] font-bold text-slate-400 text-right w-[150px] pr-6">합계</th>
            {editable && <th className="w-[48px]" />}
          </tr>
        </thead>
        <tbody>
          {grouped.map(({ category, items }) => {
            const info = CATEGORY_INFO[category];
            return (
              <React.Fragment key={category}>
                {/* 카테고리 그룹 헤더 */}
                <tr>
                  <td colSpan={colCount} className="px-6 pt-7 pb-0">
                    <div className="text-[13px] font-semibold text-slate-600">
                      {info.label}
                      <span className="text-slate-400 font-normal ml-1.5">({info.english})</span>
                    </div>
                    <div className="mt-2 border-b border-slate-200" />
                  </td>
                </tr>
                {/* 항목 행 */}
                {items.map(({ item: lineItem, index }) => (
                  <tr key={`${category}-${index}`} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-6 py-4 pl-8 text-[13px] font-medium text-slate-800">{lineItem.name}</td>
                    <td className="px-4 py-4 text-[12px] text-slate-400 text-center">{lineItem.unit}</td>
                    <td className="px-4 py-4 text-[13px] font-bold text-slate-800 text-center">
                      {editable && (category === "ai-image" || category === "ai-video") ? (
                        <span
                          className="inline-block w-14 text-center bg-slate-100 rounded-lg py-1 text-slate-400 cursor-not-allowed"
                          title="AI 항목 수량은 4단계(정보 입력)에서 조정해주세요. 다른 항목들과의 비율 재계산을 위해서입니다."
                        >
                          {lineItem.quantity}
                        </span>
                      ) : editable ? (
                        <input
                          type="number"
                          min={0}
                          value={lineItem.quantity}
                          onChange={e => onUpdateQuantity?.(index, Math.max(0, Number(e.target.value)))}
                          className="w-14 text-center bg-slate-50 rounded-lg py-1 outline-none focus:ring-2 focus:ring-primary/30 font-bold text-slate-800"
                        />
                      ) : (
                        lineItem.quantity
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {lineItem.minutes !== undefined && lineItem.difficultyWeight !== undefined ? (
                        <div className="flex items-center justify-center gap-1">
                          {editable ? (
                            <input
                              type="number"
                              min={0}
                              value={lineItem.minutes}
                              onChange={e => onUpdateMinutes?.(index, Math.max(0, Number(e.target.value)))}
                              className="w-16 text-center bg-slate-50 rounded-lg py-1 outline-none focus:ring-2 focus:ring-primary/30 font-bold text-slate-800"
                            />
                          ) : (
                            <span className="text-[12px] font-bold text-slate-800">{lineItem.minutes}</span>
                          )}
                          <span className="text-[11px] text-slate-400">분(건당)</span>
                        </div>
                      ) : lineItem.attemptGroups ? (
                        <div className="space-y-1.5">
                          {lineItem.attemptGroups.map((g, gi) => (
                            <div key={gi} className="flex flex-col items-center gap-0.5">
                              <div className="flex items-center justify-center gap-1">
                                {editable ? (
                                  <input
                                    type="number"
                                    min={0}
                                    value={g.count}
                                    onChange={e => onUpdateAttemptCount?.(index, gi, Math.max(0, Number(e.target.value)))}
                                    className="w-14 text-center bg-slate-50 rounded-lg py-1 outline-none focus:ring-2 focus:ring-primary/30 font-bold text-slate-800"
                                  />
                                ) : (
                                  <span className="text-[12px] font-bold text-slate-800">{g.count}</span>
                                )}
                                <span className="text-[11px] text-slate-400">건</span>
                              </div>
                              <span className="text-[10px] text-slate-400">{g.label}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-[12px] text-slate-400 text-right font-mono whitespace-nowrap">{fmt(lineItem.unitCost)}</td>
                    <td className="px-4 py-4 text-[13px] font-bold text-slate-900 text-right font-mono pr-6 whitespace-nowrap">{fmt(lineItem.totalCost)}</td>
                    {editable && (
                      <td className="text-center">
                        <button
                          onClick={() => onRemoveItem?.(index)}
                          className="text-slate-300 hover:text-red-500 transition-colors"
                          aria-label="항목 삭제"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </React.Fragment>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-slate-100">
            <td colSpan={5} className="px-6 py-5 text-right text-[13px] text-slate-500 font-medium">원가 소계</td>
            <td className="px-4 py-5 text-right font-mono font-black text-slate-900 text-[15px] pr-6 whitespace-nowrap">{fmt(result.costSubtotal)}</td>
            {editable && <td />}
          </tr>
          {result.marginAmount > 0 && (
            <tr>
              <td colSpan={5} className="px-6 py-3 text-right text-[13px] text-primary font-medium">마진 ({marginRate}%)</td>
              <td className="px-4 py-3 text-right font-mono font-bold text-primary text-[14px] pr-6 whitespace-nowrap">+ {fmt(result.marginAmount)}</td>
              {editable && <td />}
            </tr>
          )}
          <tr className="bg-primary/5">
            <td colSpan={5} className="px-6 py-5 text-right font-black text-slate-900 text-[14px]">최종 견적가 (VAT 별도)</td>
            <td className="px-4 py-5 text-right font-mono font-black text-primary text-[15px] pr-6 whitespace-nowrap">{fmt(result.totalPrice)}</td>
            {editable && <td />}
          </tr>
        </tfoot>
      </table>
      {editable && catalog && onAddItem && <AddItemRow catalog={catalog} onAdd={onAddItem} />}
      <div className="px-6 py-4 text-[11px] text-slate-400 leading-relaxed border-t border-slate-100">
        산출 근거: 기준 단가 188,040원/일(8시간 기준), 23,505원/시간 · 난이도 가중치 하 1.0 / 중 1.5 / 상 2.0 · 근거: 한국디자인산업연합회(KODIA) 2025년 산업별 노임단가표
        <span className="block mt-1">
          AI 생성비 산출 근거: 작업비(기획·리서치, 프롬프트 설계, 생성·선별, 후보정·합성)는 위와 동일한 기준 단가·난이도로 산정 · AI 솔루션 사용료는 Midjourney Mega Plan · Gemini Ultra Plan 기준, 이미지 생성 130원/건 · 영상 생성 2,170원/건(환율 1,550원/USD, 2026-07-01 기준)
        </span>
        {input?.expectedScheduleDays ? (
          <span className="block mt-1">예상 제작일정 {input.expectedScheduleDays}일은 참고용으로 기재된 값이며, 항목별 금액에는 반영되지 않았습니다.</span>
        ) : null}
        {editable ? (
          <span className="block mt-1">AI 이미지·영상 생성 수량은 이 화면에서 변경할 수 없습니다. 다른 항목과의 비율 재계산이 필요해 4단계(정보 입력)에서 조정해주세요.</span>
        ) : null}
      </div>
    </div>
  );
}
