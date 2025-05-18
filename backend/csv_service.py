import pandas as pd
import json
import os
import re
from typing import Dict, List, Any, Optional

from config import Config
from llm import LLMService

class CSVService:
    def __init__(self):
        self.llm_service = LLMService(
            api_key=Config.LLM_API_KEY,
            api_url=Config.LLM_API_URL
        )
        
    async def process_csv(self, file_path: str, requirement: Optional[str] = None) -> Dict[str, Any]:
        """
        处理CSV文件，使用模型填写空白单元格
        
        参数:
        - file_path: CSV文件路径
        - requirement: 用户的填写要求（可选）
        """
        try:
            # 读取CSV文件
            df = pd.read_csv(file_path)
            
            # 检查是否有空值
            if not df.isna().any().any():
                return {
                    "success": True,
                    "message": "CSV文件中没有需要填写的空白单元格",
                    "file_path": file_path  # 返回原文件路径，因为不需要处理
                }
            
            # 准备提示词
            csv_content = df.fillna("[BLANK]").to_csv(index=False)
            
            # 从文件读取提示词模板
            prompt_path = os.path.join(os.path.dirname(__file__), "prompts", "csv_handler.txt")
            with open(prompt_path, "r", encoding="utf-8") as f:
                prompt_template = f.read()
            
            # 构建提示词参数
            prompt_params = {
                "csv_content": csv_content,
                "requirement": requirement if requirement else ""
            }
            
            # 填充提示词
            prompt = prompt_template.format(**prompt_params)
            
            print("发送提示词请求...")
            if requirement:
                print(f"用户填写要求: {requirement}")
            
            # 生成回复
            response = await self.llm_service.generate_response(prompt, is_json=True)
            
            print("AI响应:", response)
            
            # 检查结果格式
            if not isinstance(response, dict) or "cells" not in response:
                return {
                    "success": False,
                    "message": "模型返回的格式不正确",
                    "raw_response": str(response)
                }
            
            # 根据模型回复填写DataFrame
            for cell in response.get("cells", []):
                row = int(cell["row"])  # 确保row是整数
                column = cell["column"]
                content = cell["content"]
                
                # 填写单元格
                df.loc[row, column] = content
            
            # 保存处理后的CSV
            output_path = os.path.splitext(file_path)[0] + "_filled.csv"
            df.to_csv(output_path, index=False)
            
            return {
                "success": True,
                "message": "CSV文件处理成功",
                "file_path": output_path
            }
                
        except Exception as e:
            error_msg = f"处理CSV文件时发生错误: {str(e)}"
            import traceback
            print(error_msg)
            print(traceback.format_exc())
            return {
                "success": False,
                "message": error_msg
            }
