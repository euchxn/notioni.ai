import { NextRequest, NextResponse } from "next/server";
import { generateTemplate } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const { description } = await request.json();

    if (!description || typeof description !== "string") {
      return NextResponse.json(
        { error: "템플릿 설명을 입력해주세요." },
        { status: 400 }
      );
    }

    if (description.length < 10) {
      return NextResponse.json(
        { error: "템플릿 설명을 더 자세히 입력해주세요. (최소 10자)" },
        { status: 400 }
      );
    }

    const template = await generateTemplate(description);

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Template generation error:", error);
    return NextResponse.json(
      { error: "템플릿 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
