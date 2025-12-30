'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useEffect } from 'react';

// 사용 가능한 기능 정의
const AVAILABLE_FEATURES = {
  text: { name: "텍스트", description: "기본 텍스트 블록", alwaysEnabled: true },
  heading: { name: "제목", description: "제목 블록 (H1, H2, H3)" },
  toggle: { name: "토글", description: "접을 수 있는 토글 블록" },
  callout: { name: "콜아웃", description: "아이콘과 함께 강조" },
  todo: { name: "할 일 목록", description: "체크박스 목록" },
  bulleted_list: { name: "글머리 기호", description: "불릿 포인트 목록" },
  numbered_list: { name: "번호 목록", description: "숫자 순서 목록" },
  divider: { name: "구분선", description: "섹션 구분" },
  quote: { name: "인용", description: "인용문 블록" },
  code: { name: "코드", description: "코드 블록" },
  table: { name: "표", description: "표 형태 데이터" },
  bookmark: { name: "북마크", description: "URL 북마크" },
};

type FeatureKey = keyof typeof AVAILABLE_FEATURES;

export default function Chat() {
  const [notionToken, setNotionToken] = useState('');
  const [pageId, setPageId] = useState('');
  const [enabledFeatures, setEnabledFeatures] = useState<FeatureKey[]>(['text']);
  const [showFeatures, setShowFeatures] = useState(false);

  const { messages, input = '', handleInputChange, handleSubmit, isLoading } = useChat({
    api: (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001') + '/api/chat',
    body: {
      notion_token: notionToken,
      page_id: pageId,
      enabled_features: enabledFeatures,
    },
  });

  const toggleFeature = (feature: FeatureKey) => {
    // 텍스트는 항상 활성화
    if (feature === 'text') return;
    
    setEnabledFeatures(prev => {
      if (prev.includes(feature)) {
        return prev.filter(f => f !== feature);
      } else {
        return [...prev, feature];
      }
    });
  };

  const selectAllFeatures = () => {
    setEnabledFeatures(Object.keys(AVAILABLE_FEATURES) as FeatureKey[]);
  };

  const selectOnlyText = () => {
    setEnabledFeatures(['text']);
  };

  return (
    <div className="flex flex-col w-full max-w-md py-10 mx-auto stretch px-4">
      <h1 className="text-2xl font-bold text-center mb-6">✨ 나만의 Notion 생성기</h1>

      {/* 1. 설정 입력칸 (토큰 & ID) */}
      <div className="bg-gray-100 p-4 rounded-lg mb-4 space-y-3 shadow-inner">
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1">Notion Token (Integration Key)</label>
          <input
            type="password"
            className="w-full p-2 border border-gray-300 rounded text-sm"
            placeholder="secret_..."
            value={notionToken}
            onChange={(e) => setNotionToken(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1">Page ID</label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded text-sm"
            placeholder="32자리 ID (URL에서 복사)"
            value={pageId}
            onChange={(e) => setPageId(e.target.value)}
          />
        </div>
        <p className="text-xs text-gray-400">
          * 다른 사람의 Notion에 템플릿을 생성하려면 해당 사용자의 키가 필요합니다.
        </p>
      </div>

      {/* 2. 기능 선택 영역 */}
      <div className="mb-4">
        <button
          onClick={() => setShowFeatures(!showFeatures)}
          className="w-full flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
        >
          <span className="font-medium text-blue-700">
            🔧 사용할 기능 선택 ({enabledFeatures.length}개 선택됨)
          </span>
          <span className="text-blue-500">{showFeatures ? '▲' : '▼'}</span>
        </button>
        
        {showFeatures && (
          <div className="mt-2 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="flex gap-2 mb-3">
              <button
                onClick={selectAllFeatures}
                className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                전체 선택
              </button>
              <button
                onClick={selectOnlyText}
                className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                텍스트만
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(AVAILABLE_FEATURES) as [FeatureKey, typeof AVAILABLE_FEATURES[FeatureKey]][]).map(([key, feature]) => (
                <label
                  key={key}
                  className={`flex items-center p-2 rounded border cursor-pointer transition-all ${
                    enabledFeatures.includes(key)
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  } ${feature.alwaysEnabled ? 'opacity-75' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={enabledFeatures.includes(key)}
                    onChange={() => toggleFeature(key)}
                    disabled={feature.alwaysEnabled}
                    className="mr-2"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{feature.name}</div>
                    <div className="text-xs text-gray-500 truncate">{feature.description}</div>
                  </div>
                </label>
              ))}
            </div>
            
            <p className="mt-3 text-xs text-gray-400">
              💡 선택한 기능만 AI가 템플릿 생성에 사용합니다. 텍스트는 기본으로 항상 활성화됩니다.
            </p>
          </div>
        )}
      </div>

      {/* 3. 채팅 기록 */}
      <div className="space-y-4 mb-24">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            <p>💬 노션에 만들고 싶은 템플릿을 설명해보세요!</p>
            <p className="text-xs mt-2">예: "신년 계획표 만들어줘", "독서 기록 템플릿 만들어줘"</p>
          </div>
        )}
        {messages.map(m => (
          <div key={m.id} className={`p-4 rounded-lg ${m.role === 'user' ? 'bg-blue-100' : 'bg-gray-100 border border-gray-200'}`}>
            <strong className="block font-bold mb-1 text-sm">{m.role === 'user' ? '나' : 'AI'}</strong>
            <div className="whitespace-pre-wrap text-sm">{m.content}</div>
          </div>
        ))}
        {isLoading && (
          <div className="p-4 rounded-lg bg-gray-100 border border-gray-200 animate-pulse">
            <strong className="block font-bold mb-1 text-sm">AI</strong>
            <div className="text-sm text-gray-500">생성 중...</div>
          </div>
        )}
      </div>

      {/* 4. 입력창 */}
      <form onSubmit={handleSubmit} className="fixed bottom-0 left-0 right-0 w-full max-w-md mx-auto mb-6 px-4">
        <div className="relative">
          <input
            className="w-full p-4 pr-12 border border-gray-300 rounded-full shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={input}
            placeholder="예: 신년 계획표 만들어줘"
            onChange={handleInputChange}
            disabled={!notionToken || !pageId || isLoading}
          />
          <button
            type="submit"
            disabled={!notionToken || !pageId || isLoading || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            ➤
          </button>
        </div>
        {!notionToken && <p className="text-center text-xs text-red-500 mt-2">👆 먼저 위에서 Notion 정보를 입력해주세요.</p>}
      </form>
    </div>
  );
}
