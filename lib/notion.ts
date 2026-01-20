import { Client } from "@notionhq/client";
import { GeneratedTemplate, TemplateBlock, DatabaseSchema } from "./prompts";

export function createNotionClient(accessToken: string) {
  return new Client({ auth: accessToken });
}

function convertBlockToNotion(block: TemplateBlock): object {
  const baseBlock = {
    object: "block" as const,
  };

  switch (block.type) {
    case "heading_1":
      return {
        ...baseBlock,
        type: "heading_1",
        heading_1: {
          rich_text: [{ type: "text", text: { content: block.content } }],
        },
      };
    case "heading_2":
      return {
        ...baseBlock,
        type: "heading_2",
        heading_2: {
          rich_text: [{ type: "text", text: { content: block.content } }],
        },
      };
    case "heading_3":
      return {
        ...baseBlock,
        type: "heading_3",
        heading_3: {
          rich_text: [{ type: "text", text: { content: block.content } }],
        },
      };
    case "paragraph":
      return {
        ...baseBlock,
        type: "paragraph",
        paragraph: {
          rich_text: [{ type: "text", text: { content: block.content } }],
        },
      };
    case "bulleted_list_item":
      return {
        ...baseBlock,
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [{ type: "text", text: { content: block.content } }],
        },
      };
    case "numbered_list_item":
      return {
        ...baseBlock,
        type: "numbered_list_item",
        numbered_list_item: {
          rich_text: [{ type: "text", text: { content: block.content } }],
        },
      };
    case "to_do":
      return {
        ...baseBlock,
        type: "to_do",
        to_do: {
          rich_text: [{ type: "text", text: { content: block.content } }],
          checked: block.checked || false,
        },
      };
    case "divider":
      return {
        ...baseBlock,
        type: "divider",
        divider: {},
      };
    case "callout":
      return {
        ...baseBlock,
        type: "callout",
        callout: {
          rich_text: [{ type: "text", text: { content: block.content } }],
          icon: { emoji: "💡" },
        },
      };
    case "quote":
      return {
        ...baseBlock,
        type: "quote",
        quote: {
          rich_text: [{ type: "text", text: { content: block.content } }],
        },
      };
    default:
      return {
        ...baseBlock,
        type: "paragraph",
        paragraph: {
          rich_text: [{ type: "text", text: { content: block.content } }],
        },
      };
  }
}

function convertDatabaseProperties(schema: DatabaseSchema) {
  const properties: Record<string, object> = {};

  for (const [name, prop] of Object.entries(schema.properties)) {
    switch (prop.type) {
      case "title":
        properties[name] = { title: {} };
        break;
      case "rich_text":
        properties[name] = { rich_text: {} };
        break;
      case "checkbox":
        properties[name] = { checkbox: {} };
        break;
      case "select":
        properties[name] = {
          select: {
            options:
              prop.options?.map((opt) => ({
                name: opt,
              })) || [],
          },
        };
        break;
      case "date":
        properties[name] = { date: {} };
        break;
      case "number":
        properties[name] = { number: {} };
        break;
      default:
        properties[name] = { rich_text: {} };
    }
  }

  return properties;
}

export async function createNotionPage(
  accessToken: string,
  parentPageId: string,
  template: GeneratedTemplate
) {
  const notion = createNotionClient(accessToken);

  // 블록 변환
  const children = template.blocks.map(convertBlockToNotion);

  // 페이지 생성
  const page = await notion.pages.create({
    parent: { page_id: parentPageId },
    icon: template.icon ? { emoji: template.icon as never } : undefined,
    properties: {
      title: {
        title: [{ text: { content: template.title } }],
      },
    },
    children: children as never[],
  });

  // 데이터베이스가 있으면 생성
  if (template.database) {
    await notion.databases.create({
      parent: { page_id: page.id },
      title: [{ type: "text", text: { content: template.database.title } }],
      properties: convertDatabaseProperties(template.database) as never,
    });
  }

  return page;
}
