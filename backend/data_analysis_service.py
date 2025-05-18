import pandas as pd
import json
import os
from typing import Dict, Any, List

from typing import Optional
from config import Config
from llm import LLMService

class DataAnalysisService:
    def __init__(self):
        self.llm_service = LLMService(
            api_key=Config.LLM_API_KEY,
            api_url=Config.LLM_API_URL
        )
    
    async def analyze_csv(self, file_path: str, requirement: Optional[str] = None):
        """分析CSV文件并生成数据见解"""
        try:
            # 读取CSV文件
            df = pd.read_csv(file_path)
            
            # 从文件读取提示词模板
            prompt_path = os.path.join(os.path.dirname(__file__), "prompts", "data_analysis.txt")
            with open(prompt_path, "r", encoding="utf-8") as f:
                prompt_template = f.read()
            
            # 准备数据样本和统计信息
            data_sample = df.head(5).to_string(index=False)
            data_stats = df.describe().to_string()
            
            # 构建提示词参数
            prompt_params = {
                "data_sample": data_sample,
                "data_stats": data_stats,
                "column_info": str(df.dtypes),
                "requirement": requirement if requirement else "请进行全面的数据分析"
            }
            
            # 填充提示词
            prompt = prompt_template.format(**prompt_params)
            
            # 生成分析报告
            analysis = await self.llm_service.generate_response(prompt)
            
            # 返回结果
            return {
                "success": True,
                "analysis": analysis,
                "visualization_data": self._prepare_visualization_data(df)
            }
            
        except Exception as e:
            error_msg = f"分析CSV文件时发生错误: {str(e)}"
            print(error_msg)
            import traceback
            print(traceback.format_exc())
            return {
                "success": False,
                "message": error_msg
            }
    
    def _generate_stats(self, df: pd.DataFrame) -> Dict[str, Any]:
        """生成数据的基本统计信息"""
        # 尝试将数值列转换为数值类型
        numeric_df = df.copy()
        for col in numeric_df.columns:
            try:
                numeric_df[col] = pd.to_numeric(numeric_df[col])
            except:
                pass
        
        # 仅为数值列计算统计数据
        numeric_cols = numeric_df.select_dtypes(include=['number']).columns
        stats = {}
        
        if len(numeric_cols) > 0:
            stats["numeric"] = {
                col: {
                    "min": float(numeric_df[col].min()),
                    "max": float(numeric_df[col].max()),
                    "mean": float(numeric_df[col].mean()),
                    "median": float(numeric_df[col].median())
                } for col in numeric_cols
            }
        
        stats["row_count"] = len(df)
        stats["column_count"] = len(df.columns)
        
        return stats
    
    def _prepare_visualization_data(self, df: pd.DataFrame) -> Dict[str, Any]:
        """准备适合可视化的数据格式"""
        # 尝试将数值列转换为数值类型
        numeric_df = df.copy()
        for col in numeric_df.columns:
            try:
                numeric_df[col] = pd.to_numeric(numeric_df[col])
            except:
                pass
        
        # 获取数值列和分类列
        numeric_cols = numeric_df.select_dtypes(include=['number']).columns.tolist()
        category_cols = [col for col in df.columns if col not in numeric_cols]
        
        # 准备不同图表类型的数据
        viz_data = {
            "columns": df.columns.tolist(),
            "numeric_columns": numeric_cols,
            "category_columns": category_cols,
            "chart_data": {}
        }
        
        # 如果有数值列和分类列，可以创建分组图表数据
        if numeric_cols and category_cols:
            # 选择第一个分类列和第一个数值列作为示例
            cat_col = category_cols[0]
            num_col = numeric_cols[0]
            
            # 分组数据
            grouped = df.groupby(cat_col)[num_col].mean().reset_index()
            viz_data["chart_data"]["bar"] = {
                "categories": grouped[cat_col].tolist(),
                "series": [{
                    "name": num_col,
                    "data": grouped[num_col].tolist()
                }]
            }
        
        # 如果只有数值列，可以创建折线图数据
        elif numeric_cols:
            # 使用前10行作为示例
            sample = df[numeric_cols].head(10)
            viz_data["chart_data"]["line"] = {
                "categories": sample.index.tolist(),
                "series": [{
                    "name": col,
                    "data": sample[col].tolist()
                } for col in numeric_cols]
            }
            
        # 为饼图准备数据（使用第一个类别列的计数）- 修复这部分代码
        if category_cols:
            cat_col = category_cols[0]
            # value_counts().reset_index() 返回两列DataFrame
            # 第一列是原始值，第二列是计数
            pie_data = df[cat_col].value_counts().reset_index()
            
            # 正确引用列名
            name_col = pie_data.columns[0]  # 第一列包含类别名称
            count_col = pie_data.columns[1]  # 第二列包含计数值
            
            viz_data["chart_data"]["pie"] = {
                "data": [{"name": str(row[name_col]), "value": int(row[count_col])} 
                        for _, row in pie_data.iterrows()]
            }
            
        return viz_data
    
    async def _generate_analysis_insights(self, df: pd.DataFrame) -> str:
        """使用AI生成数据分析见解"""
        # 准备数据摘要
        data_summary = df.describe().to_string()
        sample_data = df.head(5).to_string()
        
        prompt = f"""
        请分析以下数据并给出简短、清晰的见解和趋势:
        
        数据统计摘要:
        {data_summary}
        
        样本数据:
        {sample_data}
        
        请提供以下内容:
        1. 数据的主要特点和趋势
        2. 任何明显的关联或模式
        3. 可能的业务建议(2-3点)
        
        回复应简洁、专业，不超过150字。
        """
        
        try:
            response = await self.llm_service.generate_response(prompt)
            return response if isinstance(response, str) else "无法生成分析见解"
        except Exception as e:
            return f"生成分析见解时出错: {str(e)}"
