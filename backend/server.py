import os
import json
from PIL import Image
import numpy as np
from io import BytesIO
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.responses import JSONResponse, StreamingResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

app = FastAPI()

# Mount static only for frontend asset or preview
app.mount("/static", StaticFiles(directory="static"), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMPLATE_DIR = "static/eval_templates"
BASE_DATA_DIR = "/home/data/Dataset/Template"
SAVE_RESULT_DIR = "static/eval_results"  # 🔧 새로 추가된 저장 디렉토리
os.makedirs(SAVE_RESULT_DIR, exist_ok=True)

ZOOM_LEVELS = [0.25, 0.5, 0.75, 1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0, 6.0, 8.0, 10.0, 12.0]

# 공통 경로 해석 함수
def resolve_image_path(template_id: str, filename: str) -> str:
    template_path = os.path.join(TEMPLATE_DIR, f"template_{template_id}.json")
    if not os.path.exists(template_path):
        raise HTTPException(status_code=404, detail="Template not found")

    with open(template_path, "r", encoding="utf-8") as f:
        template = json.load(f)

    if isinstance(template, list):  # 호환성 처리
        template = template[0]

    image_url = template.get("image_url")
    if not image_url:
        raise HTTPException(status_code=400, detail="image_url not specified")

    full_dir = os.path.join(BASE_DATA_DIR, image_url)
    full_path = os.path.join(full_dir, filename)
    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail=f"{filename} not found")

    return full_path

@app.get("/zoom_levels")
def get_zoom_levels():
    return {"zoom_levels": ZOOM_LEVELS}

@app.get("/list_templates")
async def list_templates():
    try:
        files = [f for f in os.listdir(TEMPLATE_DIR) if f.endswith(".json")]
        return JSONResponse(content={"templates": files})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving templates: {str(e)}")

@app.get("/eval_templates/{filename}")
async def get_template(filename: str):
    file_path = os.path.join(TEMPLATE_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Template not found")

    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    return JSONResponse(content=data)

@app.get("/eval_template_detail")
def get_template_detail(template_id: str = Query(...)):
    try:
        path = os.path.join(TEMPLATE_DIR, f"template_{template_id}.json")
        if not os.path.exists(path):
            raise HTTPException(status_code=404, detail="Template not found")

        with open(path, "r", encoding="utf-8") as f:
            template = json.load(f)

        image_url = template.get("image_url")
        query_list = template.get("query", [])

        if not image_url:
            raise HTTPException(status_code=400, detail="Missing image_url in template")

        full_path = os.path.join(BASE_DATA_DIR, image_url)
        if not os.path.isdir(full_path):
            raise HTTPException(status_code=500, detail="Invalid image_url directory")

        files = os.listdir(full_path)
        a_files = sorted([f for f in files if "_A." in f and f.lower().endswith(('.bmp', '.png', '.jpg', '.jpeg'))])
        b_files = sorted([f for f in files if "_B." in f and f.lower().endswith(('.bmp', '.png', '.jpg', '.jpeg'))])

        image_pairs = []
        for a_file in a_files:
            prefix = a_file.split("_A.")[0]
            b_file = next((b for b in b_files if b.startswith(prefix)), None)
            if b_file:
                image_pairs.append({"a": a_file, "b": b_file})

        return {
            "query": query_list,
            "image_pairs": image_pairs
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/get_image")
def get_image(template_id: str = Query(...), filename: str = Query(...)):
    try:
        path = resolve_image_path(template_id, filename)
        return FileResponse(path, media_type="image/bmp")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/diff_image")
def generate_diff_image(template_id: str, img1: str, img2: str, threshold: int = 20):
    try:
        path1 = resolve_image_path(template_id, img1)
        path2 = resolve_image_path(template_id, img2)

        image1 = np.array(Image.open(path1).convert("RGB"))
        image2 = np.array(Image.open(path2).convert("RGB"))

        diff = np.abs(image1.astype(np.int16) - image2.astype(np.int16)).mean(axis=2)
        height, width = diff.shape
        result = np.zeros((height, width, 3), dtype=np.uint8)

        result[diff == 0] = [0, 0, 0]
        result[diff > threshold] = [255, 0, 0]
        mask = (diff > 0) & (diff <= threshold)
        result[mask] = [0, 0, 255]

        output = BytesIO()
        Image.fromarray(result).save(output, format="PNG")
        output.seek(0)
        return StreamingResponse(output, media_type="image/png")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 🔧 [추가] 평가 결과 저장
@app.post("/save_evaluation")
async def save_evaluation(request: Request):
    try:
        data = await request.json()
        template_id = data.get("template_id", "unknown_template")
        user_id = data.get("user_id", "unknown_user")

        filename = f"{template_id}_{user_id}.json"
        filepath = os.path.join(SAVE_RESULT_DIR, filename)

        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

        return {"status": "ok", "file": filepath}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 🔧 [추가] 평가 결과 불러오기
@app.get("/load_evaluation")
async def load_evaluation(template_id: str, user_id: str):
    try:
        filename = f"{template_id}_{user_id}.json"
        filepath = os.path.join(SAVE_RESULT_DIR, filename)

        if not os.path.exists(filepath):
            raise HTTPException(status_code=404, detail="Evaluation not found")

        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)

        return JSONResponse(content=data)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 개발 실행 시
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
