import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import path from "path";
import type { QuoteInput, QuoteResult } from "@/lib/types";

Font.register({
  family: "NotoSansKR",
  src: path.join(process.cwd(), "public", "fonts", "NotoSansKR.ttf"),
});

const s = StyleSheet.create({
  page: { padding: 48, fontFamily: "NotoSansKR", fontSize: 10, color: "#333" },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 4 },
  subtitle: { fontSize: 11, color: "#666", marginBottom: 24 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: "bold", marginBottom: 8, color: "#1a56db" },
  row: { flexDirection: "row", borderBottom: "1pt solid #e5e7eb", paddingVertical: 5 },
  headerRow: { flexDirection: "row", backgroundColor: "#f3f4f6", paddingVertical: 6, marginBottom: 2 },
  col1: { flex: 3 },
  col2: { width: 90, textAlign: "right" },
  totalRow: { flexDirection: "row", paddingVertical: 8, borderTop: "2pt solid #1a56db", marginTop: 4 },
  totalLabel: { flex: 3, fontSize: 12, fontWeight: "bold", color: "#1a56db" },
  totalValue: { width: 90, fontSize: 12, fontWeight: "bold", color: "#1a56db", textAlign: "right" },
  note: { fontSize: 8, color: "#9ca3af", marginTop: 24 },
  infoGrid: { flexDirection: "row", gap: 16, marginBottom: 24 },
  infoItem: { flex: 1 },
  infoLabel: { fontSize: 8, color: "#9ca3af", marginBottom: 2 },
  infoValue: { fontSize: 10, fontWeight: "bold" },
});

export function PDFDocument({ input, result }: { input: QuoteInput; result: QuoteResult }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.title}>견 적 서</Text>
        <Text style={s.subtitle}>플랜티엠 콘텐츠 제작 견적</Text>

        <View style={s.infoGrid}>
          {[
            { label: "업체명", value: input.basicInfo.companyName },
            { label: "담당자", value: input.basicInfo.contactName },
            { label: "프로젝트", value: input.basicInfo.projectName },
            { label: "견적일", value: input.basicInfo.date ?? "" },
            { label: "패널 수", value: `${input.panelInfo.count ?? 0}개` },
            { label: "사이즈", value: input.panelInfo.size ?? "" },
          ].map(({ label, value }) => (
            <View key={label} style={s.infoItem}>
              <Text style={s.infoLabel}>{label}</Text>
              <Text style={s.infoValue}>{value}</Text>
            </View>
          ))}
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>작업 내역</Text>
          <View style={s.headerRow}>
            <Text style={s.col1}>구분</Text>
            <Text style={s.col2}>금액</Text>
          </View>
          {result.categorySummary.map((cat) => (
            <View key={cat.label} style={s.row}>
              <Text style={s.col1}>{cat.label}</Text>
              <Text style={s.col2}>{cat.amount.toLocaleString()}원</Text>
            </View>
          ))}
          {result.marginAmount > 0 && (
            <View style={s.row}>
              <Text style={s.col1}>기타 (프로젝트 관리 및 제경비)</Text>
              <Text style={s.col2}>{result.marginAmount.toLocaleString()}원</Text>
            </View>
          )}
        </View>

        <View style={s.totalRow}>
          <Text style={s.totalLabel}>합계 (VAT 별도)</Text>
          <Text style={s.totalValue}>{result.totalPrice.toLocaleString()}원</Text>
        </View>

        <Text style={s.note}>
          본 견적서는 작업 범위 및 난이도에 따라 변경될 수 있습니다. 문의: 플랜티엠
        </Text>
      </Page>
    </Document>
  );
}
