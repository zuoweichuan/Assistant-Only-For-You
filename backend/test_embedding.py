import requests
import socket
import time
from urllib3.util.retry import Retry
from requests.adapters import HTTPAdapter
import os

IPADDR = os.environ.get('IPADDR')
def test_server(base_url: str = f"http://{IPADDR}:1234") -> None:
    """测试从 WSL 连接到 LM Studio 服务器"""
    print(f"=== WSL -> LM Studio 连接测试 ===")
    print(f"测试地址: {base_url}\n")
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer lm-studio"
    }
    
    # 1. 测试原始套接字连接
    print("1. 测试 TCP 连接...")
    host = base_url.split("://")[1].split(":")[0]
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(5)
        result = sock.connect_ex((host, 1234))
        print(f"Socket 连接结果: {'成功' if result == 0 else '失败'} (代码: {result})")
        sock.close()
    except Exception as e:
        print(f"Socket 连接错误: {e}")
    
    # 2. 配置带重试的会话
    session = requests.Session()
    retries = Retry(
        total=3,
        backoff_factor=0.5,
        status_forcelist=[500, 502, 503, 504]
    )
    session.mount('http://', HTTPAdapter(max_retries=retries))
    
    # 3. 测试模型列表
    print("\n2. 测试模型列表...")
    try:
        response = session.get(
            f"{base_url}/v1/models",
            headers=headers,
            timeout=10,
            verify=False
        )
        print(f"状态码: {response.status_code}")
        if response.status_code == 200:
            models = response.json()
            print("可用模型:")
            for model in models.get("data", []):
                print(f"  - {model['id']}")
        else:
            print(f"错误响应: {response.text}")
    except Exception as e:
        print(f"请求错误: {e}")
    
    # 4. 测试 Embedding
    print("\n3. 测试 Embedding...")
    try:
        data = {
            "model": "text-embedding-nomic-embed-text-v1.5",
            "input": "测试文本"
        }
        response = session.post(
            f"{base_url}/v1/embeddings",
            headers=headers,
            json=data,
            timeout=10,
            verify=False
        )
        print(f"状态码: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            embedding = result["data"][0]["embedding"]
            print(f"Embedding 维度: {len(embedding)}")
        else:
            print(f"错误响应: {response.text}")
    except Exception as e:
        print(f"请求错误: {e}")

def main():
    # 测试多个可能的地址
    urls = [
        "http://192.168.224.1:1234",  # VMware 网络适配器地址
        "http://172.27.64.1:1234",    # WSL 适配器地址
        "http://host.docker.internal:1234"  # Docker 特殊DNS
    ]
    
    for url in urls:
        print(f"\n{'='*50}")
        test_server(url)
        time.sleep(1)  # 在测试之间稍作暂停

if __name__ == "__main__":
    main()
