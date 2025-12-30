import os
import json
import asyncio
from dotenv import load_dotenv
from typing import List, Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.responses import StreamingResponse

import google.generativeai as genai
from notion_client import Client

# 1. 환경변수 로드
load_dotenv("api.env")

NOTION_TOKEN = os.getenv("NOTION_TOKEN")
PAGE_ID = os.getenv("PAGE_ID")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-flash-latest')
notion = Client(auth=NOTION_TOKEN)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    messages: list
    enabled_features: Optional[List[str]] = None  # 사용자가 선택한 기능들

# =========================================================
# 사용 가능한 모든 기능 정의
# =========================================================
ALL_FEATURES = {
    "text": {
        "name": "텍스트",
        "types": ["paragraph"],
        "always_enabled": True
    },
    "heading": {
        "name": "제목",
        "types": ["heading_1", "heading_2", "heading_3"]
    },
    "toggle": {
        "name": "토글",
        "types": ["toggle"]
    },
    "callout": {
        "name": "콜아웃",
        "types": ["callout"]
    },
    "todo": {
        "name": "할 일 목록",
        "types": ["to_do"]
    },
    "bulleted_list": {
        "name": "글머리 기호 목록",
        "types": ["bulleted_list_item"]
    },
    "numbered_list": {
        "name": "번호 매기기 목록",
        "types": ["numbered_list_item"]
    },
    "divider": {
        "name": "구분선",
        "types": ["divider"]
    },
    "quote": {
        "name": "인용",
        "types": ["quote"]
    },
    "code": {
        "name": "코드",
        "types": ["code"]
    },
    "table": {
        "name": "표",
        "types": ["table"]
    },
    "child_page": {
        "name": "하위 페이지",
        "types": ["child_page"]
    }
}

# =========================================================
# 1. [핵심] 기존 블록 조회 함수
# =========================================================
def get_existing_blocks(page_id: str):
    """
    페이지의 기존 블록들을 조회합니다.
    """
    try:
        blocks = notion.blocks.children.list(block_id=page_id)
        return blocks.get("results", [])
    except Exception as e:
        print(f"블록 조회 실패: {e}")
        return []

def get_block_content(block):
    """
    블록에서 텍스트 내용을 추출합니다.
    """
    block_type = block.get("type")
    if block_type and block_type in block:
        rich_text = block[block_type].get("rich_text", [])
        if rich_text:
            return "".join([t.get("plain_text", "") for t in rich_text])
    return ""

def get_all_blocks_recursive(page_id: str, depth=0):
    """
    페이지의 모든 블록을 재귀적으로 조회합니다 (하위 블록 포함).
    """
    blocks = get_existing_blocks(page_id)
    result = []
    
    for block in blocks:
        block_info = {
            "id": block.get("id"),
            "type": block.get("type"),
            "content": get_block_content(block),
            "has_children": block.get("has_children", False),
            "depth": depth
        }
        result.append(block_info)
        
        # 하위 블록이 있으면 재귀 조회
        if block.get("has_children"):
            children = get_all_blocks_recursive(block.get("id"), depth + 1)
            block_info["children"] = children
            result.extend(children)
    
    return result

# =========================================================
# 2. [핵심] 블록 수정 함수
# =========================================================
def update_block(block_id: str, new_content: str, block_type: str = None):
    """
    기존 블록의 내용을 수정합니다.
    """
    try:
        # 블록 정보 조회
        block = notion.blocks.retrieve(block_id=block_id)
        current_type = block_type or block.get("type")
        
        # 수정할 내용 구성
        rich_text = [{"type": "text", "text": {"content": new_content}}]
        
        update_data = {}
        
        if current_type in ["paragraph", "heading_1", "heading_2", "heading_3"]:
            update_data[current_type] = {"rich_text": rich_text}
        elif current_type in ["toggle", "to_do", "bulleted_list_item", "numbered_list_item", "quote", "callout"]:
            update_data[current_type] = {"rich_text": rich_text}
            if current_type == "to_do":
                update_data[current_type]["checked"] = block.get(current_type, {}).get("checked", False)
        else:
            update_data["paragraph"] = {"rich_text": rich_text}
        
        notion.blocks.update(block_id=block_id, **update_data)
        print(f"✅ 블록 수정 완료: {block_id}")
        return True
        
    except Exception as e:
        print(f"블록 수정 실패: {e}")
        return False

# =========================================================
# 3. [핵심] 블록 삭제 함수
# =========================================================
def delete_block(block_id: str):
    """
    블록을 삭제합니다.
    """
    try:
        notion.blocks.delete(block_id=block_id)
        print(f"🗑️ 블록 삭제 완료: {block_id}")
        return True
    except Exception as e:
        print(f"블록 삭제 실패: {e}")
        return False

def delete_all_blocks(page_id: str):
    """
    페이지의 모든 블록을 삭제합니다.
    """
    blocks = get_existing_blocks(page_id)
    for block in blocks:
        delete_block(block.get("id"))

# =========================================================
# 4. [핵심] 재귀 함수: 블록 안에 블록을 넣는 로직
# =========================================================
def build_notion_structure(items):
    """
    JSON 리스트를 받아서 Notion 블록 구조로 변환합니다.
    'children'이 있으면 자기 자신을 다시 호출(재귀)해서 내용을 채웁니다.
    """
    blocks = []
    
    for item in items:
        b_type = item.get("type", "paragraph")
        content = item.get("content", "")
        children_data = item.get("children", [])
        
        rich_text = [{"type": "text", "text": {"content": content}}]
        base_block = {"object": "block", "type": b_type}

        if b_type in ["toggle", "to_do", "bulleted_list_item", "numbered_list_item", "quote", "callout"]:
            block_content = {"rich_text": rich_text}
            
            if b_type == "to_do":
                block_content["checked"] = item.get("checked", False)
            elif b_type == "callout":
                block_content["icon"] = {"emoji": item.get("icon", "💡")}
            
            if children_data:
                block_content["children"] = build_notion_structure(children_data)
                
            base_block[b_type] = block_content

        elif b_type in ["paragraph", "heading_1", "heading_2", "heading_3"]:
            base_block[b_type] = {"rich_text": rich_text}
        
        elif b_type == "code":
            language = item.get("language", "plain text")
            base_block["code"] = {
                "rich_text": rich_text,
                "language": language
            }
            
        elif b_type == "divider":
            base_block["divider"] = {}
            
        elif b_type == "table":
            rows = content.strip().split("\n")
            table_rows = []
            for row_str in rows:
                cells = row_str.split("|")
                cells = [c.strip() for c in cells]
                row_block = {
                    "type": "table_row",
                    "table_row": {
                        "cells": [[{"type": "text", "text": {"content": c}}] for c in cells]
                    }
                }
                table_rows.append(row_block)
            
            width = len(rows[0].split("|")) if rows else 1
            base_block["table"] = {
                "table_width": width,
                "has_column_header": True,
                "children": table_rows
            }

        elif b_type == "child_page":
            pass

        else:
            base_block["type"] = "paragraph"
            base_block["paragraph"] = {"rich_text": rich_text}
        
        if b_type != "child_page":
            blocks.append(base_block)
            
    return blocks

# =========================================================
# 5. 실행기: 페이지 생성과 블록 추가/수정을 조율
# =========================================================
def execute_notion_plan(design_data, mode="add"):
    """
    mode: "add" (추가), "replace" (전체 교체), "update" (부분 수정)
    """
    if not design_data: 
        return "생성할 내용이 없습니다."
    
    try:
        # 전체 교체 모드: 기존 내용 삭제 후 새로 추가
        if mode == "replace":
            print("🔄 기존 내용 삭제 중...")
            delete_all_blocks(PAGE_ID)
        
        current_batch = []
        
        for item in design_data:
            b_type = item.get("type", "paragraph")
            content = item.get("content", "")
            children_data = item.get("children", [])
            block_id = item.get("block_id")  # 수정할 블록 ID (있으면 수정 모드)

            # 수정 모드: block_id가 있으면 해당 블록 수정
            if block_id and mode == "update":
                update_block(block_id, content, b_type)
                continue

            # 하위 페이지(child_page)를 만드는 경우
            if b_type == "child_page":
                if current_batch:
                    notion.blocks.children.append(block_id=PAGE_ID, children=current_batch)
                    current_batch = [] 

                page_content_blocks = []
                if children_data:
                    page_content_blocks = build_notion_structure(children_data)

                print(f"📄 페이지 생성 중(내용 포함): {content}")
                notion.pages.create(
                    parent={"page_id": PAGE_ID},
                    properties={
                        "title": {"title": [{"text": {"content": content}}]}
                    },
                    children=page_content_blocks
                )

            # 일반 블록인 경우
            else:
                blocks = build_notion_structure([item])
                if blocks:
                    current_batch.append(blocks[0])

        # 남은 블록 처리
        if current_batch:
            notion.blocks.children.append(block_id=PAGE_ID, children=current_batch)

        mode_text = {
            "add": "추가",
            "replace": "전체 교체",
            "update": "수정"
        }
        return f"✅ Notion 페이지 {mode_text.get(mode, '처리')} 완료!"

    except Exception as e:
        print(f"API 전송 실패: {e}")
        return f"❌ 전송 에러: {e}"

# =========================================================
# 6. 선택된 기능에 따른 AI 프롬프트 생성
# =========================================================
def get_allowed_types(enabled_features: Optional[List[str]] = None) -> List[str]:
    """선택된 기능에 따라 허용된 블록 타입 목록을 반환합니다."""
    if enabled_features is None:
        enabled_features = ["text"]
    
    # 텍스트는 항상 포함
    if "text" not in enabled_features:
        enabled_features.insert(0, "text")
    
    allowed_types = []
    for feature_key in enabled_features:
        if feature_key in ALL_FEATURES:
            allowed_types.extend(ALL_FEATURES[feature_key]["types"])
    
    return list(set(allowed_types))

def get_ai_design(user_prompt, existing_blocks=None, enabled_features=None):
    print(f"⚡ Gemini 요청: {user_prompt}")
    
    # 허용된 블록 타입 가져오기
    allowed_types = get_allowed_types(enabled_features)
    allowed_types_text = ", ".join(allowed_types)
    
    # 기능 설명 생성
    feature_descriptions = []
    for feature_key in (enabled_features or ["text"]):
        if feature_key in ALL_FEATURES:
            feature = ALL_FEATURES[feature_key]
            feature_descriptions.append(f"- {feature['name']}: {', '.join(feature['types'])}")
    features_text = "\n".join(feature_descriptions)
    
    # 기존 내용 정보 추가
    existing_info = ""
    if existing_blocks:
        existing_info = f"""
    [현재 페이지에 있는 블록들]
    {json.dumps(existing_blocks, ensure_ascii=False, indent=2)}
    
    위 블록들을 참고해서:
    - 수정이 필요하면 해당 블록의 "block_id"를 포함해서 반환
    - 새로 추가할 내용은 "block_id" 없이 반환
    - 전체 교체가 필요하면 "mode": "replace"를 최상위에 포함
    """
    
    prompt = f"""
    너는 Notion 템플릿 기획자야.
    주제: "{user_prompt}"
    {existing_info}
    
    ## 중요: 사용 가능한 기능 (사용자가 선택한 기능만 사용해!)
    {features_text}
    
    ## 허용된 블록 타입만 사용해! (이 목록에 없는 타입은 절대 사용하지 마!)
    {allowed_types_text}
    
    ## 규칙
    1. 반드시 허용된 블록 타입만 사용해
    2. 허용되지 않은 블록 타입을 사용하면 안 돼
    3. 사용자가 요청하더라도 허용되지 않은 기능은 가장 비슷한 허용된 블록으로 대체해
       예: toggle이 허용되지 않으면 paragraph나 bulleted_list_item으로 대체
    4. 'children' 필드를 사용해서 토글이나 페이지 안에 들어갈 상세 내용을 채워
    
    [응답 형식]
    {{
        "mode": "add" | "replace" | "update",
        "blocks": [ ...블록 리스트... ]
    }}
    
    [블록 구조]
    {{
        "type": "블록타입 (허용된 타입만!)", 
        "content": "내용",
        "block_id": "기존블록ID (수정시에만)",
        "children": [ ...하위 블록 리스트... ] 
    }}

    [의도 파악]
    - "수정해줘", "바꿔줘", "변경해줘" → mode: "update" + block_id 포함
    - "새로 만들어줘", "전체 교체해줘" → mode: "replace"
    - "추가해줘", "더 넣어줘" → mode: "add"
    - 명확하지 않으면 기본값 "add"
    
    오직 JSON 데이터만 출력해.
    """
    
    try:
        response = model.generate_content(prompt)
        text = response.text.replace("```json", "").replace("```", "").strip()
        result = json.loads(text)
        
        # 허용되지 않은 블록 타입 필터링/변환
        result["blocks"] = filter_blocks_by_allowed_types(result.get("blocks", []), allowed_types)
        
        return result

    except Exception as e:
        print(f"⚠️ AI 에러: {e}")
        return {"mode": "add", "blocks": []}

def filter_blocks_by_allowed_types(blocks, allowed_types):
    """허용되지 않은 블록 타입을 paragraph로 변환합니다."""
    filtered = []
    for block in blocks:
        b_type = block.get("type", "paragraph")
        
        # 허용되지 않은 타입은 paragraph로 변환
        if b_type not in allowed_types:
            print(f"⚠️ 허용되지 않은 블록 타입 '{b_type}'을 'paragraph'로 변환")
            block["type"] = "paragraph"
        
        # children도 재귀적으로 처리
        if "children" in block and block["children"]:
            block["children"] = filter_blocks_by_allowed_types(block["children"], allowed_types)
        
        filtered.append(block)
    
    return filtered

# =========================================================
# 7. API 엔드포인트
# =========================================================

# 사용 가능한 기능 목록 반환 API
@app.get("/api/features")
async def get_available_features():
    """사용 가능한 모든 기능 목록을 반환합니다."""
    return {"features": ALL_FEATURES}

@app.post("/api/chat")
async def handle_chat(request: ChatRequest):
    user_message = request.messages[-1]['content']
    enabled_features = request.enabled_features
    print(f"📩 메시지: {user_message}")
    print(f"🔧 활성화된 기능: {enabled_features}")

    async def event_generator():
        yield f"'{user_message}' 요청을 처리하는 중입니다... ✍️\n"
        
        # 활성화된 기능 표시
        if enabled_features:
            feature_names = [ALL_FEATURES[f]["name"] for f in enabled_features if f in ALL_FEATURES]
            yield f"📦 사용 기능: {', '.join(feature_names)}\n"
        
        await asyncio.sleep(0.5)
        
        # 기존 블록 조회 (수정 모드 지원)
        yield "📖 현재 페이지 내용을 확인하는 중...\n"
        existing_blocks = get_all_blocks_recursive(PAGE_ID)
        
        # 간소화된 블록 정보 (AI에게 전달용)
        simplified_blocks = [
            {"block_id": b["id"], "type": b["type"], "content": b["content"]}
            for b in existing_blocks if b.get("content")
        ]
        
        design_result = get_ai_design(
            user_message, 
            simplified_blocks if simplified_blocks else None,
            enabled_features
        )
        
        if not design_result or not design_result.get("blocks"):
            yield "❌ 내용을 생성하지 못했습니다."
            return

        mode = design_result.get("mode", "add")
        blocks = design_result.get("blocks", [])
        
        mode_text = {"add": "추가", "replace": "전체 교체", "update": "수정"}
        yield f"🔧 모드: {mode_text.get(mode, mode)}\n"
        yield f"구조화된 블록을 Notion에 배치하고 있습니다... 🧱\n"
        
        result = execute_notion_plan(blocks, mode)
        yield f"\n{result}"

    return StreamingResponse(event_generator(), media_type="text/plain")

# 블록 조회 API (프론트엔드에서 사용 가능)
@app.get("/api/blocks")
async def get_blocks():
    blocks = get_all_blocks_recursive(PAGE_ID)
    return {"blocks": blocks}

# 특정 블록 수정 API
@app.put("/api/blocks/{block_id}")
async def update_single_block(block_id: str, request: dict):
    new_content = request.get("content", "")
    block_type = request.get("type")
    success = update_block(block_id, new_content, block_type)
    return {"success": success}

# 특정 블록 삭제 API
@app.delete("/api/blocks/{block_id}")
async def delete_single_block(block_id: str):
    success = delete_block(block_id)
    return {"success": success}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
