import asyncio
import os
from csv_service import CSVService

async def test_csv_service():
    # 创建测试目录
    os.makedirs("temp", exist_ok=True)
    
    # 创建一个测试CSV文件
    test_csv_content = """姓名,年龄,职业,入职日期,部门
张三,25,软件工程师,2022-01-15,研发部
李四,28,,2021-09-10,市场部
王五,,,2023-03-22,研发部
赵六,31,产品经理,,"""
    
    # 保存测试CSV文件
    test_csv_path = "./temp/test_csv.csv"
    with open(test_csv_path, "w", encoding="utf-8") as f:
        f.write(test_csv_content)
    
    # 创建CSV服务实例
    csv_service = CSVService()
    
    # 处理CSV文件
    result = await csv_service.process_csv(test_csv_path)
    
    print("处理结果:", result)
    
    # 如果成功，打印处理后的CSV内容
    if result["success"] and result["file_path"]:
        print("\n处理后的CSV文件内容:")
        with open(result["file_path"], "r", encoding="utf-8") as f:
            print(f.read())

if __name__ == "__main__":
    asyncio.run(test_csv_service())
