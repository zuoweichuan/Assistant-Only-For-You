from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
import base64
from chat_service import ChatService
from tts import TTSService
from config import Config

from fastapi import FastAPI, File, UploadFile
import csv
import io
from fastapi.responses import StreamingResponse

from fastapi import FastAPI, UploadFile, File, Form

import shutil
import uuid
import os
from fastapi import UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from csv_service import CSVService

# 添加导入
from fastapi import Body
from data_analysis_service import DataAnalysisService
from pydantic import BaseModel
from typing import Optional
from typing import Optional, Dict, Any
app = FastAPI()
csv_service = CSVService()
data_analysis_service = DataAnalysisService()

# CORS设置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = "default"

class AnalyzeRequest(BaseModel):
    file_path: str

chat_service = ChatService()
tts_service = TTSService(Config.FISH_API_KEY, Config.FISH_REFERENCE_ID)

@app.post("/api/upload_csv")
async def upload_csv(file: UploadFile = File(...)):
    # 将上传的文件读取为文本
    content = await file.read()
    text_stream = io.StringIO(content.decode('utf-8', errors='ignore'))
    
    # 读取 CSV
    reader = csv.reader(text_stream)
    rows = list(reader)

    # 在这里对 rows 做处理，如写入一些“填写”逻辑
    # 简单示例：往每行最后一列补充“OK”
    for row in rows:
        row.append("OK")

    # 重新写出 CSV
    output_stream = io.StringIO()
    writer = csv.writer(output_stream)
    writer.writerows(rows)
    output_stream.seek(0)

    # 以附件形式返回填充好的 CSV
    return StreamingResponse(
        output_stream,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=filled_{file.filename}"
        }
    )

@app.post("/api/chat")
async def chat(request: ChatRequest):
    return await normal_chat_flow(request)

async def normal_chat_flow(request: ChatRequest):
    reply, audio_data, expression = await chat_service.generate_reply(
        request.message, 
        request.session_id
    )
    
    print("-- /api/chat --")
    print("reply:", reply)
    print("expression:", expression)

    audio_base64 = base64.b64encode(audio_data).decode('ascii') if audio_data else ''
    
    return JSONResponse(
        content={
            "message": reply,
            "audio": audio_base64,
            "expression": expression
        }
    )


# 添加这个用于处理CSV文件上传的API路由
@app.post("/api/upload-csv")
async def upload_csv(file: UploadFile = File(...), requirement: Optional[str] = Form(None)):
    try:
        # 检查文件类型
        if not file.filename.endswith(".csv"):
            return {
                "success": False,
                "message": "只接受CSV文件格式"
            }
        
        # 创建临时文件存储目录(如果不存在)
        os.makedirs("temp", exist_ok=True)
        
        # 生成唯一文件名
        file_extension = os.path.splitext(file.filename)[1]
        temp_file_name = f"{uuid.uuid4()}{file_extension}"
        temp_file_path = os.path.join("temp", temp_file_name)
        
        # 保存上传文件
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # 处理CSV文件，传递填写要求
        csv_service = CSVService()
        result = await csv_service.process_csv(temp_file_path, requirement)
        
        # 如果成功并且有输出文件，准备下载链接
        if result["success"] and result["file_path"]:
            # 提取文件名用于前端显示
            download_filename = os.path.basename(result["file_path"])
            result["download_filename"] = download_filename
            
        return result
    
    except Exception as e:
        print(f"CSV处理异常: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "message": f"处理文件时出错: {str(e)}"
        }
    
    except Exception as e:
        print(f"CSV处理异常: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "message": f"处理文件时出错: {str(e)}"
        }

# 添加这个用于提供文件下载的路由
@app.get("/api/download/{filename}")
async def download_file(filename: str):
    try:
        file_path = os.path.join("temp", filename)
        
        # 检查文件是否存在
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="文件未找到")
        
        return FileResponse(
            path=file_path, 
            filename=filename,
            media_type="text/csv"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"下载失败: {str(e)}")
    

# 添加这个用于分析CSV文件的API路由
@app.post("/api/analyze-csv")
async def analyze_csv(request: Dict[str, Any]):
    try:
        file_path = request.get("file_path")
        requirement = request.get("requirement")
        
        if not file_path:
            return {
                "success": False,
                "message": "缺少文件路径参数"
            }
        
        data_analysis_service = DataAnalysisService()
        result = await data_analysis_service.analyze_csv(file_path, requirement)
        return result
    except Exception as e:
        print(f"分析CSV异常: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "message": f"分析CSV时出错: {str(e)}"
        }
