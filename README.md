# Notion Template AI

AI가 자동으로 노션 템플릿을 생성해주는 웹 애플리케이션입니다.

## 기능

- 자연어로 원하는 템플릿 설명
- AI가 노션 블록 구조 자동 생성
- 생성된 템플릿 미리보기
- 사용자 본인의 노션에 원클릭 템플릿 생성

## 기술 스택

- **프레임워크**: Next.js 14 (App Router)
- **AI**: Google Gemini API
- **노션 연동**: Notion API
- **스타일링**: Tailwind CSS

## 배포자용 설정

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일 생성:

```
GEMINI_API_KEY=your_gemini_api_key_here
```

**Google Gemini API Key 발급** (무료):
1. https://aistudio.google.com/app/apikey 접속
2. "Create API key" 클릭
3. 발급받은 키를 `.env.local`에 입력

### 3. 개발 서버 실행

```bash
npm run dev
```

### 4. Vercel 배포

1. GitHub에 코드 푸시
2. [Vercel](https://vercel.com)에서 프로젝트 import
3. Environment Variables에 `GEMINI_API_KEY` 추가
4. Deploy

## 사용자용 가이드

### 템플릿 생성하기

1. 메인 페이지에서 원하는 템플릿을 자연어로 설명합니다.
   - 예: "주간 업무 관리 템플릿. 할일 체크리스트, 우선순위, 마감일이 필요해요"
2. "템플릿 생성" 버튼을 클릭합니다.
3. 생성된 템플릿을 미리보기에서 확인합니다.

### 노션에 템플릿 추가하기

#### 1. Notion Integration 만들기
1. [notion.so/my-integrations](https://www.notion.so/my-integrations) 접속
2. "New integration" 클릭
3. 이름 입력 후 생성
4. **Internal Integration Secret** 복사

#### 2. 페이지에 Integration 연결
1. 템플릿을 추가할 노션 페이지 열기
2. 우측 상단 "..." 클릭 → "Connections"
3. 만든 Integration 선택하여 연결

#### 3. 페이지 ID 찾기
페이지 URL에서 마지막 32자리가 페이지 ID입니다:
```
https://notion.so/페이지이름-abc123def456...
                              └── 이 부분이 페이지 ID
```

#### 4. 템플릿 생성
1. 웹 앱에서 API Key와 페이지 ID 입력
2. "노션에 템플릿 생성" 클릭
3. 노션에서 확인!

## 프로젝트 구조

```
notion-template-ai/
├── app/
│   ├── page.tsx              # 메인 페이지
│   ├── layout.tsx            # 레이아웃
│   ├── globals.css           # 전역 스타일
│   └── api/
│       ├── generate/route.ts # AI 템플릿 생성 API
│       └── notion/
│           └── create/route.ts # Notion 페이지 생성
├── components/
│   ├── TemplateForm.tsx      # 입력 폼
│   ├── TemplatePreview.tsx   # 미리보기
│   └── NotionConnect.tsx     # 노션 연결 (API 키 입력)
├── lib/
│   ├── gemini.ts             # Gemini API 클라이언트
│   ├── notion.ts             # Notion API 클라이언트
│   └── prompts.ts            # AI 프롬프트 및 타입 정의
└── .env.local                # 환경 변수 (Gemini API 키만)
```

## 보안

- Gemini API 키: 서버에서만 사용 (환경 변수)
- Notion API 키: 사용자가 직접 입력, 브라우저 로컬 스토리지에만 저장
- 서버에 사용자의 Notion 자격 증명 저장하지 않음

## 라이선스

MIT
