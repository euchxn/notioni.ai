import { NextRequest, NextResponse } from "next/server";
import { createNotionPage } from "@/lib/notion";
import { GeneratedTemplate } from "@/lib/prompts";

export async function POST(request: NextRequest) {
  try {
    const { template, notionApiKey, pageId } = (await request.json()) as {
      template: GeneratedTemplate;
      notionApiKey: string;
      pageId: string;
    };

    if (!notionApiKey) {
      return NextResponse.json(
        { error: "Notion API 키를 입력해주세요." },
        { status: 400 }
      );
    }

    if (!pageId) {
      return NextResponse.json(
        { error: "페이지 ID를 입력해주세요." },
        { status: 400 }
      );
    }

    if (!template) {
      return NextResponse.json(
        { error: "템플릿 데이터가 필요합니다." },
        { status: 400 }
      );
    }

    // 페이지 ID에서 하이픈 제거 및 정리
    const cleanPageId = pageId.replace(/-/g, "").trim();

    const page = await createNotionPage(notionApiKey, cleanPageId, template);

    return NextResponse.json({
      success: true,
      pageId: page.id,
      url: (page as { url?: string }).url,
    });
  } catch (error) {
    console.error("Notion page creation error:", error);

    // 에러 메시지 분석하여 사용자 친화적 메시지 반환
    const errorMessage = error instanceof Error ? error.message : "";

    if (errorMessage.includes("Could not find page") || errorMessage.includes("object_not_found")) {
      return NextResponse.json(
        { error: "페이지를 찾을 수 없습니다. 페이지 ID를 확인하고, Integration이 해당 페이지에 연결되어 있는지 확인해주세요." },
        { status: 400 }
      );
    }

    if (errorMessage.includes("unauthorized") || errorMessage.includes("Invalid token")) {
      return NextResponse.json(
        { error: "API 키가 올바르지 않습니다. Integration Secret을 확인해주세요." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "노션 페이지 생성 중 오류가 발생했습니다. API 키와 페이지 ID를 확인해주세요." },
      { status: 500 }
    );
  }
}
