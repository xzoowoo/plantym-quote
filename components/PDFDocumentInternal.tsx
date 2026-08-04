import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import path from "path";
import type { QuoteInput, QuoteResult, LineItem } from "@/lib/types";

Font.register({
  family: "NotoSansKR",
  src: path.join(process.cwd(), "public", "fonts", "NotoSansKR.ttf"),
});

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

const timeOrAttempts = (li: LineItem): string => {
  if (li.minutes !== undefined) return `${li.minutes}분`;
  if (li.attemptGroups) return li.attemptGroups.map(g => `${g.label} ${g.count}건`).join("\n");
  return "-";
};

const s = StyleSheet.create({
  page: { padding: 48, fontFamily: "NotoSansKR", fontSize: 10, color: "#333" },
  badge: {
    alignSelf: "flex-start", backgroundColor: "#fef3c7", color: "#92400e",
    fontSize: 8, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 4, marginBottom: 16,
  },
  title: { fontSize: 19, marginBottom: 4 },
  subtitle: { fontSize: 11, color: "#666", marginBottom: 16 },
  infoGrid: { flexDirection: "row", gap: 12, marginBottom: 24 },
  infoItem: { flex: 1 },
  infoLabel: { fontSize: 8, color: "#9ca3af", marginBottom: 2 },
  infoValue: { fontSize: 11, color: "#111827" },
  sectionTitle: { fontSize: 13, marginBottom: 8, color: "#1a56db" },
  // 테이블 헤더
  headerRow: {
    flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e5e7eb",
    paddingVertical: 7, paddingHorizontal: 6,
  },
  hName:     { flex: 1,    fontSize: 8, color: "#9ca3af" },
  hUnit:     { width: 50,  fontSize: 8, color: "#9ca3af", textAlign: "center" },
  hQty:      { width: 35,  fontSize: 8, color: "#9ca3af", textAlign: "center" },
  hTime:     { width: 90,  fontSize: 8, color: "#9ca3af", textAlign: "center" },
  hUnitCost: { width: 80,  fontSize: 8, color: "#9ca3af", textAlign: "right" },
  hTotal:    { width: 80,  fontSize: 8, color: "#9ca3af", textAlign: "right" },
  // 카테고리 그룹 헤더
  catRow: { paddingTop: 14, paddingHorizontal: 6, paddingBottom: 0 },
  catLabel: { fontSize: 11, color: "#374151" },
  catEnglish: { fontSize: 9, color: "#9ca3af" },
  catLine: { borderBottomWidth: 1, borderBottomColor: "#d1d5db", marginTop: 5 },
  // 항목 행
  row: {
    flexDirection: "row",
    paddingVertical: 6, paddingHorizontal: 6, paddingLeft: 14,
    borderBottomWidth: 1, borderBottomColor: "#f9fafb",
  },
  cName:     { flex: 1,   fontSize: 9, color: "#1f2937" },
  cUnit:     { width: 50, fontSize: 9, color: "#9ca3af", textAlign: "center" },
  cQty:      { width: 35, fontSize: 9, color: "#1f2937", fontWeight: "bold", textAlign: "center" },
  cTime:     { width: 90, fontSize: 8, color: "#1f2937", textAlign: "center" },
  cUnitCost: { width: 80, fontSize: 9, color: "#9ca3af", textAlign: "right" },
  cTotal:    { width: 80, fontSize: 9, color: "#111827", fontWeight: "bold", textAlign: "right" },
  // 푸터
  footerRow: {
    flexDirection: "row", paddingVertical: 6, paddingHorizontal: 6,
    borderTopWidth: 1, borderTopColor: "#e5e7eb",
  },
  footerLabel: { flex: 1, textAlign: "right", fontSize: 10, color: "#6b7280", paddingRight: 8 },
  footerValue: { width: 85, textAlign: "right", fontSize: 10, color: "#111827", fontWeight: "bold" },
  marginRow: { flexDirection: "row", paddingVertical: 5, paddingHorizontal: 6 },
  marginLabel: { flex: 1, textAlign: "right", fontSize: 10, color: "#1a56db", paddingRight: 8 },
  marginValue: { width: 85, textAlign: "right", fontSize: 10, color: "#1a56db", fontWeight: "bold" },
  totalRow: {
    flexDirection: "row", paddingVertical: 8, paddingHorizontal: 6,
    borderTopWidth: 2, borderTopColor: "#1a56db", marginTop: 2,
  },
  totalLabel: { flex: 1, textAlign: "right", fontSize: 12, color: "#1a56db", paddingRight: 8 },
  totalValue: { width: 85, textAlign: "right", fontSize: 11, fontWeight: "bold", color: "#1a56db" },
  note: { fontSize: 8, color: "#9ca3af", marginTop: 24 },
});

export function PDFDocumentInternal({ input, result }: { input: QuoteInput; result: QuoteResult }) {
  // 카테고리별 그룹화
  const grouped: { category: LineItem["category"]; items: typeof result.lineItems }[] = [];
  for (const lineItem of result.lineItems) {
    const group = grouped.find(g => g.category === lineItem.category);
    if (group) {
      group.items.push(lineItem);
    } else {
      grouped.push({ category: lineItem.category, items: [lineItem] });
    }
  }

  const marginRate = result.costSubtotal > 0
    ? Math.round(result.marginAmount / result.costSubtotal * 100)
    : 0;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.badge}>내부용 — 외부 공개 금지</Text>
        <Text style={s.title}>견 적 서 (원가 세부 내역)</Text>
        <Text style={s.subtitle}>플랜티엠 콘텐츠 제작 견적</Text>

        <View style={s.infoGrid}>
          {[
            { label: "업체명",    value: input.basicInfo.companyName },
            { label: "담당자",    value: input.basicInfo.contactName },
            { label: "프로젝트", value: input.basicInfo.projectName },
            { label: "견적일",   value: input.basicInfo.date ?? "" },
            { label: "패널 수",  value: `${input.panelInfo.count ?? 0}개` },
            { label: "사이즈",   value: input.panelInfo.size ?? "" },
          ].map(({ label, value }) => (
            <View key={label} style={s.infoItem}>
              <Text style={s.infoLabel}>{label}</Text>
              <Text style={s.infoValue}>{value}</Text>
            </View>
          ))}
        </View>

        <Text style={s.sectionTitle}>작업 항목 원가 내역</Text>

        {/* 테이블 헤더 */}
        <View style={s.headerRow}>
          <Text style={s.hName}>작업 항목</Text>
          <Text style={s.hUnit}>기준</Text>
          <Text style={s.hQty}>수량</Text>
          <Text style={s.hTime}>소요시간/건수 (건당)</Text>
          <Text style={s.hUnitCost}>단가</Text>
          <Text style={s.hTotal}>합계</Text>
        </View>

        {/* 카테고리 그룹별 항목 */}
        {grouped.map(({ category, items }) => {
          const info = CATEGORY_INFO[category];
          return (
            <View key={category}>
              {/* 카테고리 헤더 */}
              <View style={s.catRow}>
                <Text style={s.catLabel}>
                  {info.label}{"  "}
                  <Text style={s.catEnglish}>({info.english})</Text>
                </Text>
                <View style={s.catLine} />
              </View>
              {/* 항목 */}
              {items.map((lineItem, i) => (
                <View key={i} style={s.row}>
                  <Text style={s.cName}>{lineItem.name}</Text>
                  <Text style={s.cUnit}>{lineItem.unit}</Text>
                  <Text style={s.cQty}>{lineItem.quantity}</Text>
                  <Text style={s.cTime}>{timeOrAttempts(lineItem)}</Text>
                  <Text style={s.cUnitCost}>{fmt(lineItem.unitCost)}</Text>
                  <Text style={s.cTotal}>{fmt(lineItem.totalCost)}</Text>
                </View>
              ))}
            </View>
          );
        })}

        {/* 푸터 합계 */}
        <View style={s.footerRow}>
          <Text style={s.footerLabel}>원가 소계</Text>
          <Text style={s.footerValue}>{fmt(result.costSubtotal)}</Text>
        </View>
        {result.marginAmount > 0 && (
          <View style={s.marginRow}>
            <Text style={s.marginLabel}>마진 ({marginRate}%)</Text>
            <Text style={s.marginValue}>+ {fmt(result.marginAmount)}</Text>
          </View>
        )}
        <View style={s.totalRow}>
          <Text style={s.totalLabel}>최종 견적가 (VAT 별도)</Text>
          <Text style={s.totalValue}>{fmt(result.totalPrice)}</Text>
        </View>

        <Text style={s.note}>
          산출 근거: 기준 단가 188,040원/일(8시간 기준), 23,505원/시간 · 난이도 가중치 하 1.0 / 중 1.5 / 상 2.0 · 근거: 한국디자인산업연합회(KODIA) 2025년 산업별 노임단가표
          {"\n"}AI 생성비 산출 근거: 작업비(기획·리서치, 프롬프트 설계, 생성·선별, 후보정·합성)는 위와 동일한 기준 단가·난이도로 산정 · AI 솔루션 사용료는 Midjourney Mega Plan · Gemini Ultra Plan 기준, 이미지 생성 130원/건 · 영상 생성 2,170원/건(환율 1,550원/USD, 2026-07-01 기준)
          {input.expectedScheduleDays ? `\n예상 제작일정 ${input.expectedScheduleDays}일은 참고용으로 기재된 값이며, 항목별 금액에는 반영되지 않았습니다.` : ""}
        </Text>
        <Text style={s.note}>본 문서는 내부 원가 정보를 포함하고 있어 외부 공개를 금합니다. 플랜티엠</Text>
      </Page>
    </Document>
  );
}
