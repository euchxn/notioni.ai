"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TemplateForm from "@/components/TemplateForm";
import TemplatePreview from "@/components/TemplatePreview";
import NotionConnect from "@/components/NotionConnect";
import { GeneratedTemplate } from "@/lib/prompts";

export default function Home() {
  const router = useRouter();
  const [template, setTemplate] = useState<GeneratedTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (description: string) => {
    setIsLoading(true);
    setError(null);
    setTemplate(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "템플릿 생성에 실패했습니다.");
      }

      setTemplate(data.template);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          AI로 노션 템플릿을 자동 생성하세요
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          원하는 템플릿을 자연어로 설명하면, AI가 자동으로 노션 템플릿 구조를
          생성합니다. 생성된 템플릿은 바로 노션에 추가할 수 있습니다.
        </p>
      </section>

      <TemplateForm onGenerate={handleGenerate} isLoading={isLoading} />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {template && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              미리보기
            </h3>
            <TemplatePreview template={template} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              노션에 추가
            </h3>
            <NotionConnect template={template} />
          </div>
        </div>
      )}

      {!template && !isLoading && (
        <section className="mt-12">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
            이런 템플릿을 만들 수 있어요
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: "📋",
                title: "업무 관리",
                desc: "할일, 프로젝트, 회의록 템플릿",
              },
              {
                icon: "📚",
                title: "학습 & 독서",
                desc: "독서 기록, 강의 노트, 학습 플래너",
              },
              {
                icon: "🎯",
                title: "목표 & 습관",
                desc: "습관 트래커, 목표 설정, OKR",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-lg border border-gray-200 text-center"
              >
                <span className="text-4xl mb-3 block">{item.icon}</span>
                <h4 className="font-semibold text-gray-900 mb-1">
                  {item.title}
                </h4>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
