import os
import json

from PIL import Image
import numpy as np
from io import BytesIO

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import JSONResponse, StreamingResponse
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


# server.py
ZOOM_LEVELS = [0.25, 0.5, 0.75, 1.0, 2.0, 4.0]

@app.get("/zoom_levels")
def get_zoom_levels():
    return {"zoom_levels": ZOOM_LEVELS}


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


@app.get("/diff_image")
def generate_diff_image(img1: str = Query(...), img2: str = Query(...), threshold: int = 20):
    try:
        path1 = f"static/sample/{img1}"
        path2 = f"static/sample/{img2}"

        image1 = np.array(Image.open(path1).convert("RGB"))
        image2 = np.array(Image.open(path2).convert("RGB"))

        print(f"📂 shape1: {image1.shape}")
        print(f"📂 shape2: {image2.shape}")

        diff = np.abs(image1.astype(np.int16) - image2.astype(np.int16)).mean(axis=2)
        height, width = diff.shape

        result = np.zeros((height, width, 3), dtype=np.uint8)
        result[diff == 0] = [0, 0, 0]         # 검정
        result[diff > threshold] = [255, 0, 0]  # 빨강
        mask = (diff > 0) & (diff <= threshold)
        result[mask] = [0, 0, 255]           # 파랑

        output = BytesIO()
        Image.fromarray(result).save(output, format="PNG")
        output.seek(0)
        return StreamingResponse(output, media_type="image/png")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/get_image_pairs")
def get_image_pairs(template_id: str = Query(...)):
    try:
        # 1. 템플릿 JSON 경로 지정
        template_path = os.path.join("static/eval_templates/", f"template_{template_id}.json")
        print(f"🔍 Looking for template: {template_path}")
        
        if not os.path.exists(template_path):
            raise HTTPException(status_code=404, detail="Template not found")

        # 2. 템플릿 로드
        with open(template_path, "r", encoding="utf-8") as f:
            template_data = json.load(f)
            if isinstance(template_data, list):
                template_data = template_data[0]

        image_dir = template_data.get("image_dir")
        print(f"📁 image_dir from template: {image_dir}")

        if not image_dir or not os.path.isdir(image_dir):
            raise HTTPException(status_code=500, detail="Invalid image_dir in template")

        # 3. image_pairs.json 캐시 파일이 존재하면 바로 반환
        cache_path = os.path.join(image_dir, "image_pairs.json")
        if os.path.exists(cache_path):
            with open(cache_path, "r", encoding="utf-8") as f:
                image_pairs = json.load(f)
            return {"image_pairs": image_pairs}

        # 4. 파일 이름 기준으로 A/B 쌍 탐색
        files = os.listdir(image_dir)
        a_files = sorted([f for f in files if "_A_" in f and f.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp'))])
        b_files = sorted([f for f in files if "_B_" in f and f.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp'))])

        image_pairs = []
        for a_file in a_files:
            base_name = a_file.replace("_A_", "")
            b_file = next((b for b in b_files if b.replace("_B_", "") == base_name), None)
            if b_file:
                image_pairs.append({"a": a_file, "b": b_file})

        # 5. image_pairs.json 저장
        with open(cache_path, "w", encoding="utf-8") as f:
            json.dump(image_pairs, f, indent=2)

        return {"image_pairs": image_pairs}

    except Exception as e:
        print("❌ Exception occurred:", str(e))  # 추가 로그
        raise HTTPException(status_code=500, detail=str(e))




# @app.get("/image_pairs/{template_id}")
# def get_image_pairs(template_id: str):


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
