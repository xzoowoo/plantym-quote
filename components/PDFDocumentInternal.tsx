import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import path from "path";
import type { QuoteInput, QuoteResult } from "@/lib/types";

Font.register({
  family: "NotoSansKR",
  src: path.join(process.cwd(), "public", "fonts", "NotoSansKR.ttf"),
});

const CATEGORY_LABEL: Record<string, string> = {
  image: "이미지",
  video: "영상",
  motion: "모션",
  render: "렌더·인코딩",
  "ai-image": "AI 이미지",
  "ai-video": "AI 영상",
};

const s = StyleSheet.create({
  page: { padding: 48, fontFamily: "NotoSansKR", fontSize: 10, color: "#333" },
  badge: {
    alignSelf: "flex-start", backgroundColor: "#fef3c7", color: "#92400e",
    fontSize: 8, fontWeight: "bold", paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 4, marginBottom: 16,
  },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 4 },
  subtitle: { fontSize: 11, color: "#666", marginBottom: 16 },
  infoGrid: { flexDirection: "row", gap: 12, marginBottom: 24 },
  infoItem: { flex: 1 },
  infoLabel: { fontSize: 8, color: "#9ca3af", marginBottom: 2 },
  infoValue: { fontSize: 10, fontWeight: "bold" },
  sectionTitle: { fontSize: 12, fontWeight: "bold", marginBottom: 8, color: "#1a56db" },
  headerRow: {
    flexDirection: "row", backgroundColor: "#f3f4f6",
    paddingVertical: 6, paddingHorizontal: 4,
  },
  row: {
    flexDirection: "row", borderBottom: "1pt solid #f0f0f0",
    paddingVertical: 5, paddingHorizontal: 4,
  },
  rowAlt: {
    flexDirection: "row", borderBottom: "1pt solid #f0f0f0",
    paddingVertical: 5, paddingHorizontal: 4, backgroundColor: "#fafafa",
  },
  cCategory: { width: 60, fontSize: 9, color: "#6b7280" },
  cName: { flex: 1, fontSize: 9 },
  cUnit: { width: 75, fontSize: 9, color: "#6b7280" },
  cQty: { width: 45, fontSize: 9, textAlign: "center" },
  cUnitCost: { width: 70, fontSize: 9, textAlign: "right", color: "#6b7280" },
  cTotal: { width: 70, fontSize: 9, textAlign: "right", fontWeight: "bold" },
  footerRow: {
    flexDirection: "row", paddingVertical: 6, paddingHorizontal: 4,
    borderTop: "1pt solid #e5e7eb",
  },
  footerLabel: { flex: 1, textAlign: "right", fontSize: 10, color: "#6b7280", paddingRight: 8 },
  footerValue: { width: 70, textAlign: "right", fontSize: 10 },
  totalRow: {
    flexDirection: "row", paddingVertical: 8, paddingHorizontal: 4,
    borderTop: "2pt solid #1a56db", marginTop: 2,
  },
  totalLabel: { flex: 1, textAlign: "right", fontSize: 11, fontWeight: "bold", color: "#1a56db", paddingRight: 8 },
  totalValue: { width: 70, textAlign: "right", fontSize: 11, fontWeight: "bold", color: "#1a56db" },
  note: { fontSize: 8, color: "#9ca3af", marginTop: 24 },
});

export function PDFDocumentInternal({ input, result }: { input: QuoteInput; result: QuoteResult }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.badge}>내부용 — 외부 공개 금지</Text>
        <Text style={s.title}>견 적 서 (원가 세부 내역)</Text>
        <Text style={s.subtitle}>플랜티엠 콘텐츠 제작 견적</Text>

        <View style={s.infoGrid}>
          {[
            { label: "업체명", value: input.basicInfo.companyName },
            { label: "담당자", value: input.basicInfo.contactName },
            { label: "프로젝트", value: input.basicInfo.projectName },
            { label: "견적일", value: input.basicInfo.date ?? "" },
            { label: "패널 수", value: `${input.panelInfo.count ?? 0}개` },
            { label: "패널 사이즈", value: input.panelInfo.size ?? "" },
          ].map(({ label, value }) => (
            <View key={label} style={s.infoItem}>
              <Text style={s.infoLabel}>{label}</Text>
              <Text style={s.infoValue}>{value}</Text>
            </View>
          ))}
        </View>

        <Text style={s.sectionTitle}>작업 항목 원가 내역</Text>

        <View style={s.headerRow}>
          <Text style={s.cCategory}>구분</Text>
          <Text style={s.cName}>작업 항목</Text>
          <Text style={s.cUnit}>기준</Text>
          <Text style={s.cQty}>수량</Text>
          <Text style={s.cUnitCost}>단가</Text>
          <Text style={s.cTotal}>합계</Text>
        </View>

        {result.lineItems.map((item, i) => (
          <View key={i} style={i % 2 === 0 ? s.row : s.rowAlt}>
            <Text style={s.cCategory}>{CATEGORY_LABEL[item.category] ?? item.category}</Text>
            <Text style={s.cName}>{item.name}</Text>
            <Text style={s.cUnit}>{item.unit}</Text>
            <Text style={s.cQty}>{item.quantity}</Text>
            <Text style={s.cUnitCost}>{item.unitCost.toLocaleString()}원</Text>
            <Text style={s.cTotal}>{item.totalCost.toLocaleString()}원</Text>
          </View>
        ))}

        <View style={s.footerRow}>
          <Text style={s.footerLabel}>원가 소계</Text>
          <Text style={s.footerValue}>{result.costSubtotal.toLocaleString()}원</Text>
        </View>
        {result.marginAmount > 0 && (
          <View style={s.footerRow}>
            <Text style={[s.footerLabel, { color: "#1a56db" }]}>마진</Text>
            <Text style={[s.footerValue, { color: "#1a56db" }]}>+ {result.marginAmount.toLocaleString()}원</Text>
          </View>
        )}
        <View style={s.totalRow}>
          <Text style={s.totalLabel}>최종 견적가 (VAT 별도)</Text>
          <Text style={s.totalValue}>{result.totalPrice.toLocaleString()}원</Text>
        </View>

        <Text style={s.note}>
          본 문서는 내부 원가 정보를 포함하고 있어 외부 공개를 금합니다. 플랜티엠
        </Text>
      </Page>
    </Document>
  );
}
