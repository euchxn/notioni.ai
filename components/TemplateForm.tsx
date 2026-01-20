"use client";

import { useState } from "react";

interface TemplateFormProps {
  onGenerate: (description: string) => Promise<void>;
  isLoading: boolean;
}

const EXAMPLE_PROMPTS = [
  "주간 업무 관리 템플릿. 할일 체크리스트, 우선순위, 마감일이 필요해요",
  "독서 기록 템플릿. 책 제목, 저자, 읽은 날짜, 별점, 메모를 기록하고 싶어요",
  "프로젝트 관리 템플릿. 마일스톤, 담당자, 진행상태를 추적할 수 있으면 좋겠어요",
  "습관 트래커 템플릿. 매일 체크할 수 있는 습관 목록이 필요해요",
];

export default function TemplateForm({
  onGenerate,
  isLoading,
}: TemplateFormProps) {
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim() && !isLoading) {
      await onGenerate(description);
    }
  };

  const handleExampleClick = (example: string) => {
    setDescription(example);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        어떤 템플릿을 만들어 드릴까요?
      </h2>

      <form onSubmit={handleSubmit}>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="원하는 템플릿을 자유롭게 설명해주세요. 예: 주간 업무 관리 템플릿이 필요해요. 할일 체크리스트와 우선순위가 있었으면 좋겠어요."
          className="w-full h-32 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
          disabled={isLoading}
        />

        <div className="mt-4 flex justify-between items-center">
          <span className="text-sm text-gray-500">
            {description.length > 0 && `${description.length}자`}
          </span>
          <button
            type="submit"
            disabled={isLoading || description.trim().length < 10}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                생성 중...
              </span>
            ) : (
              "템플릿 생성"
            )}
          </button>
        </div>
      </form>

      <div className="mt-6">
        <p className="text-sm text-gray-600 mb-3">예시 프롬프트:</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_PROMPTS.map((example, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleExampleClick(example)}
              className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
            >
              {example.slice(0, 25)}...
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
