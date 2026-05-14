// app/api/pdf/route.ts
import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer, DocumentProps } from "@react-pdf/renderer";
import { PDFDocument } from "@/components/PDFDocument";
import React from "react";

export async function POST(req: NextRequest) {
  try {
    const { input, result } = await req.json();

    if (!input?.basicInfo || !result?.categorySummary || !Array.isArray(result.categorySummary)) {
      return NextResponse.json({ error: "유효하지 않은 요청입니다." }, { status: 400 });
    }

    const element = React.createElement(PDFDocument, { input, result }) as React.ReactElement<DocumentProps>;
    const buffer = await renderToBuffer(element);
    const base64 = Buffer.from(buffer).toString("base64");
    return NextResponse.json({ base64 });
  } catch (e) {
    console.error("pdf API error:", e);
    return NextResponse.json({ error: "PDF 생성 중 오류가 발생했습니다." }, { status: 500 });
  }
}
