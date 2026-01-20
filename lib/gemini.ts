import { GoogleGenerativeAI } from "@google/generative-ai";
import { TEMPLATE_GENERATION_PROMPT, GeneratedTemplate } from "./prompts";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function generateTemplate(
  userDescription: string
): Promise<GeneratedTemplate> {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `${TEMPLATE_GENERATION_PROMPT}

사용자 요청: ${userDescription}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  // JSON 파싱 시도
  try {
    // 코드 블록 제거 (```json ... ```)
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    const jsonText = jsonMatch ? jsonMatch[1] : text;

    const template = JSON.parse(jsonText.trim()) as GeneratedTemplate;
    return template;
  } catch (error) {
    console.error("Failed to parse AI response:", text);
    throw new Error("AI 응답을 파싱하는데 실패했습니다. 다시 시도해주세요.");
  }
}
