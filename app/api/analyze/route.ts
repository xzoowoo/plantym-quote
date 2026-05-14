// app/api/analyze/route.ts
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const ITEM_LIST = `
이미지 작업: resize(사이즈변경), remove-bg(배경제거), separate(소스분리), reposition(비율재배치), composite(합성), text(텍스트추가), design-element(디자인요소추가)
영상·모션 작업: cutEdit(컷편집), subtitle(자막), rolling(롤링), transition-basic/advanced(화면전환), entrance-basic/advanced(등장효과), emphasis-basic/advanced(강조효과), special-basic/advanced(특수효과), animation-basic/advanced(애니메이션)
`;

export async function POST(req: NextRequest) {
  const { text, contentTypes } = await req.json();

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `다음 작업 항목 목록을 참고해서, 사용자의 요청 텍스트에서 필요한 작업 항목과 수량을 추출해줘.

작업 항목 목록:
${ITEM_LIST}

사용자 요청: "${text}"
선택된 콘텐츠 유형: ${JSON.stringify(contentTypes)}

반드시 아래 JSON 형식으로만 답해줘. 추출된 항목이 없으면 빈 배열로:
{
  "detected": [
    { "type": "image_task", "key": "remove-bg", "count": 2, "note": "배경 제거" },
    { "type": "motion", "key": "entrance-advanced", "count": 3, "note": "빛 번지는 효과" }
  ],
  "summary": "감지된 항목 한 줄 설명"
}

type은 image_task, video_task, motion 중 하나.`,
      },
    ],
  });

  const text_content = message.content[0].type === "text" ? message.content[0].text : "{}";
  const jsonMatch = text_content.match(/\{[\s\S]*\}/);
  let parsed: { detected: unknown[]; summary: string } = { detected: [], summary: "" };
  try {
    if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
  } catch {
    // JSON 파싱 실패 시 빈 배열 fallback 유지
  }

  return NextResponse.json({ detected: parsed.detected, summary: parsed.summary });
}
