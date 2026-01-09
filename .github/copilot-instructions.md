# Copilot / AI agent instructions — Notioni service

Purpose: Give AI coding agents the minimal, concrete knowledge to be productive in this repository.

- **Big picture:** This repo has two main components:
  - `frontend/` — Next.js (app router) UI and in-repo AI agent wiring. Look in `frontend/app/` (server/client routes) and `frontend/agent/` (agent wrappers).
  - `backend/` — FastAPI service that orchestrates Notion edits and calls Google Gemini. See `backend/main.py`.

- **How code is organized:**
  - `frontend/app/api/*/route.ts` are serverless API handlers that convert UI messages to provider requests (example: `frontend/app/api/bedrock/route.ts`).
  - `frontend/agent/*.ts` contains provider-specific agent definitions (example: `frontend/agent/openai-basic-agent.ts` uses `ToolLoopAgent` and `@ai-sdk/openai`).
  - The backend expects an `api.env` file (loaded via `dotenv`) with `NOTION_TOKEN`, `PAGE_ID`, and `GEMINI_API_KEY`.

- **Build / run commands:**
  - Frontend dev: `cd frontend && npm install && npm run dev` (scripts in `frontend/package.json`: `dev`, `build`, `start`).
  - Backend dev: install `backend/requirements.txt` and run with `python backend/main.py` or `uvicorn backend.main:app --reload --port 8000`.

- **Common patterns to follow when editing or adding agents/API routes:**
  - Agents: follow the shape in `frontend/agent/*` — instantiate provider via `@ai-sdk/<provider>` and wrap with `ToolLoopAgent` (or equivalent). Example: `openai('gpt-5-mini')` and `providerOptions` are common.
  - API routes: accept `{ messages }`, convert to provider messages (e.g., `convertToModelMessages(messages)`), then return a stream via `streamText(...).toUIMessageStreamResponse()`.
  - Keep streaming behavior: many front-end components expect a streaming UI message response shape.

- **Integration points / external deps:**
  - Providers used: OpenAI (`@ai-sdk/openai`), Anthropic, Amazon Bedrock, Azure, Google, and others listed in `frontend/package.json` dependencies.
  - Model names and options are set at the agent or route level (search for `gpt-5-mini`, `claude-*`, `anthropic.*` within `frontend/agent` and `frontend/app/api`).
  - Backend uses `notion_client` and Google Generative API (`google.generativeai`) — env keys live in `backend/api.env`.

- **Project-specific conventions:**
  - Prefer the `app` router and server-route handlers (`route.ts`) for back-end calls from the UI.
  - Agents are small, single-purpose objects under `frontend/agent/` — add new providers here and export types with `InferAgentUIMessage` when needed.
  - When modifying Notion behavior, use `backend/main.py` patterns: `get_ai_design`, `execute_notion_plan`, and the `mode` semantics (`add`/`replace`/`update`).

- **When you need to change behavior:**
  - Update the agent file in `frontend/agent/` and the corresponding API route in `frontend/app/api/*/route.ts`.
  - Run frontend locally (`npm run dev`) and exercise the UI; for backend changes, run `uvicorn` and call `/api/chat` or `/api/blocks`.

- **Files to inspect for examples:**
  - `frontend/package.json` — dependency and script conventions
  - `frontend/agent/openai-basic-agent.ts` — simple agent pattern
  - `frontend/app/api/bedrock/route.ts` — server-route streaming pattern
  - `backend/main.py` — Notion orchestration, `api.env` usage, and JSON contract for AI responses

If anything is unclear or you want more detail (examples for adding a provider, environment guidance, or test harnesses), tell me which area to expand. 
