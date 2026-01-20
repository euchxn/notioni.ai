"use client";

import { useState, useEffect } from "react";
import { GeneratedTemplate } from "@/lib/prompts";

interface NotionConnectProps {
  template: GeneratedTemplate;
}

const STORAGE_KEY = "notion_settings";

export default function NotionConnect({ template }: NotionConnectProps) {
  const [apiKey, setApiKey] = useState("");
  const [pageId, setPageId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    url?: string;
    error?: string;
  } | null>(null);

  // 로컬 스토리지에서 설정 불러오기
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const { apiKey: savedKey, pageId: savedPageId } = JSON.parse(saved);
        if (savedKey) setApiKey(savedKey);
        if (savedPageId) setPageId(savedPageId);
      } catch (e) {
        // ignore
      }
    }
  }, []);

  // 설정 저장
  const saveSettings = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ apiKey, pageId }));
  };

  const handleCreate = async () => {
    if (!apiKey.trim() || !pageId.trim()) {
      setResult({ success: false, error: "API 키와 페이지 ID를 모두 입력해주세요." });
      return;
    }

    setIsCreating(true);
    setResult(null);
    saveSettings();

    try {
      const response = await fetch("/api/notion/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template,
          notionApiKey: apiKey.trim(),
          pageId: pageId.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({ success: true, url: data.url });
      } else {
        setResult({ success: false, error: data.error });
      }
    } catch (error) {
      console.error("Failed to create page:", error);
      setResult({ success: false, error: "페이지 생성에 실패했습니다." });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          노션에 템플릿 생성하기
        </h3>
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="text-sm text-blue-600 hover:underline"
        >
          {showHelp ? "도움말 닫기" : "설정 방법?"}
        </button>
      </div>

      {showHelp && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg text-sm text-gray-700 space-y-3">
          <div>
            <p className="font-semibold mb-1">1. Notion Integration 만들기</p>
            <ol className="list-decimal ml-4 space-y-1">
              <li>
                <a
                  href="https://www.notion.so/my-integrations"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  notion.so/my-integrations
                </a>
                {" "}접속
              </li>
              <li>&quot;New integration&quot; 클릭</li>
              <li>이름 입력 후 생성</li>
              <li>&quot;Internal Integration Secret&quot; 복사</li>
            </ol>
          </div>
          <div>
            <p className="font-semibold mb-1">2. 페이지에 Integration 연결</p>
            <ol className="list-decimal ml-4 space-y-1">
              <li>템플릿을 추가할 노션 페이지 열기</li>
              <li>우측 상단 &quot;...&quot; 클릭 → &quot;Connections&quot;</li>
              <li>만든 Integration 선택하여 연결</li>
            </ol>
          </div>
          <div>
            <p className="font-semibold mb-1">3. 페이지 ID 찾기</p>
            <p className="ml-4">
              페이지 URL에서 마지막 32자리가 페이지 ID입니다.
              <br />
              <code className="bg-gray-200 px-1 rounded text-xs">
                notion.so/페이지이름-<span className="text-blue-600 font-bold">abc123def456...</span>
              </code>
            </p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notion API Key (Integration Secret)
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="secret_xxxxxxxxxxxxxxxxxxxxx"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            페이지 ID (템플릿을 추가할 페이지)
          </label>
          <input
            type="text"
            value={pageId}
            onChange={(e) => setPageId(e.target.value)}
            placeholder="abc123def456789..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-sm"
          />
        </div>

        <button
          onClick={handleCreate}
          disabled={isCreating || !apiKey.trim() || !pageId.trim()}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isCreating ? (
            <span className="flex items-center justify-center gap-2">
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
            "노션에 템플릿 생성"
          )}
        </button>

        <p className="text-xs text-gray-500 text-center">
          입력한 정보는 브라우저에 저장되며 서버에 저장되지 않습니다.
        </p>
      </div>

      {result && (
        <div
          className={`mt-4 p-4 rounded-lg ${
            result.success
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          {result.success ? (
            <div>
              <p className="text-green-800 font-medium">
                템플릿이 성공적으로 생성되었습니다!
              </p>
              {result.url && (
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline mt-2 inline-block"
                >
                  노션에서 확인하기 →
                </a>
              )}
            </div>
          ) : (
            <p className="text-red-800">{result.error}</p>
          )}
        </div>
      )}
    </div>
  );
}
