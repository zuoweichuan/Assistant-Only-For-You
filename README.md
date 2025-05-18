# Assistant-Only-For-You

Hi，我是nana，一个能记住你喜好的傲娇猫娘

!聊天界面预览

## 项目介绍

Assistant-Only-For-You 是一个专属于你的个性化AI助手，集成了聊天、语音交互和Live2D动态展示功能。它可以记住你的喜好，提供傲娇猫娘风格的互动体验。

## 功能特点

- 个性化聊天交互
- 语音合成（TTS）功能
- 支持Live2D动态角色展示
- 可定制化的响应和行为模式
- 对话历史记录保存

## 安装说明

### 环境准备

- Node.js: v22.12.0
- Python: 3.10.14

确保你的系统已经安装了以上版本的环境，才能顺利运行本项目(或者其他版本也可以，但我没试过)

### 前端安装
```bash
cd frontend
npm install
```

### 后端安装
```bash
cd backend
# 创建虚拟环境
python -m venv venv
# Windows激活虚拟环境
.\venv\Scripts\activate
# Linux/Mac激活虚拟环境
source venv/bin/activate

# 安装依赖
pip install fastapi uvicorn openai python-dotenv
```

### 后端配置
- LLM和向量模型的配置见backend/config.py
- 支持用本地大模型或者线上的API
- 如果是本地大模型的话，推荐用lm-studio
- 我测试过的模型组合是qwen2.5-32b-instruct和nomic-embed-text-v1.5-GGUF
- 线上模型推荐用claude-3-5-sonnet
- TTS服务使用了Fish Audio的API，需要注册账号并获取API Key
- https://fish.audio/zh-CN/
- 如果不想使用TTS，可以把FISH_API_KEY设置为空字符串

## 运行说明

### 启动前端
```bash
cd frontend
npm run dev
```
前端将在 http://localhost:5173 启动

### 启动后端
```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
后端API将在 http://localhost:8000 启动

## 其他说明

- 对话历史保存至backend/save/下，想备份的话可以保存整个文件夹
- live2d模型是我在工坊买的，仅供学习交流使用，请勿用于商业用途！！！
- 如果在运行过程中遇到什么问题，欢迎来我的主页留意 https://space.bilibili.com/3546572358945017

## 项目结构

```
.
├── backend/                # Python 后端
│   ├── config.py           # 模型配置
│   ├── main.py             # 主入口
│   └── save/               # 保存对话历史
│
└── frontend/               # 前端应用
    ├── src/                # 源代码
    └── public/             # 静态资源
        └── models/         # Live2D模型
```

---

欢迎体验这个专属于你的AI伴侣，让nana陪伴你的日常！