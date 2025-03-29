import os
import json
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")

# CORS 설정 (React 프론트엔드와 연동)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 모든 도메인에서 API 호출 허용
    allow_credentials=True,
    allow_methods=["*"],  # 모든 HTTP 메서드 허용
    allow_headers=["*"],  # 모든 HTTP 헤더 허용
)

# JSON 템플릿이 저장된 디렉토리
TEMPLATE_DIR = "static/eval_templates"


@app.get("/list_templates")
async def list_templates():
    """ 평가 템플릿 JSON 파일 목록을 반환 """
    try:
        files = [f for f in os.listdir(TEMPLATE_DIR) if f.endswith(".json")]
        return JSONResponse(content={"templates": files})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving templates: {str(e)}")


@app.get("/eval_templates/{filename}")
async def get_template(filename: str):
    """ 특정 평가 템플릿 JSON 파일 반환 """
    file_path = os.path.join(TEMPLATE_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Template not found")

    with open(file_path, "r", encoding="utf-8") as file:
        data = json.load(file)

    return JSONResponse(content=data)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
