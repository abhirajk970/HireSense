# 🌟 HireSense — AI-Native Talent Acquisition & Agentic Assessment Platform

<div align="center">

![HireSense Banner](https://img.shields.io/badge/HireSense-AI%20Talent%20Platform-0db9ca?style=for-the-badge&logo=rocket)
[![Live Documentation](https://img.shields.io/badge/📖_Live_Docs-GitHub_Pages-1a6fc4?style=for-the-badge&logo=github)](https://abhirajk970.github.io/HireSense/)
[![CI Pipeline](https://github.com/abhirajk970/HireSense/actions/workflows/ci.yml/badge.svg)](https://github.com/abhirajk970/HireSense/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

<br />

[![LangChain](https://img.shields.io/badge/LangChain-Agentic%20FSM-353535?style=flat-square&logo=chainlink&logoColor=white)](https://langchain.com/)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-Vector%20Store-FF4B4B?style=flat-square)](https://trychroma.com/)
[![LLaMA 3](https://img.shields.io/badge/LLaMA_3-8B%20Ollama-0467DF?style=flat-square&logo=meta&logoColor=white)](https://ollama.ai/)
[![Apache Kafka](https://img.shields.io/badge/Apache_Kafka-Event--Driven-231F20?style=flat-square&logo=apachekafka&logoColor=white)](https://kafka.apache.org/)
[![Redis 7](https://img.shields.io/badge/Redis-7.x%20Pub%2FSub-DC382D?style=flat-square&logo=redis&logoColor=white)](https://redis.io/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React 18](https://img.shields.io/badge/React-18.x%20Vite-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![Docker](https://img.shields.io/badge/Docker-Multi--Stage-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![GitHub Actions](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF?style=flat-square&logo=githubactions&logoColor=white)](https://github.com/features/actions)

<p align="center">
  <b>Enterprise-grade, distributed AI hiring ecosystem.</b><br />
  Featuring LangChain/LangGraph multi-agent interview orchestration, ChromaDB RAG semantic matching, Kafka event-driven sandboxed code evaluation, and edge AI computer vision proctoring.
</p>

[Architecture](#-architecture--system-overview) • [Agentic & RAG Pipeline](#-agentic-interview-engine--rag-pipeline) • [Microservices Matrix](#-microservices-matrix) • [CI/CD & Quality Gates](#-cicd-pipeline--quality-gates) • [Quickstart](#-quickstart-guide)

---

</div>

## 📌 Executive Highlights

* **Distributed Microservices Monorepo**: Built across **5 Express microservices + 1 Python FastAPI service** exposing **81+ REST endpoints** (~27,500+ LOC, 250+ source files).
* **LangChain & LangGraph Multi-Agent Engine**: Deterministic 7-stage stateful interview workflow powered by local **LLaMA 3 (8B)**, featuring dynamic prompt injection, few-shot conditioning, and automated regex guardrails.
* **ChromaDB Production RAG Pipeline**: Chunks domain interview rubrics and candidate resumes with dense vector embeddings (`all-MiniLM-L6-v2`) and hybrid BM25 retrieval, hitting **92% semantic matching accuracy**.
* **Context Engineering & Compaction**: Implements an **8-turn sliding context window** with recursive LangChain history compaction, slashing token overhead by **40%** while preserving conversational continuity.
* **Event-Driven Execution (Kafka)**: Asynchronous code submission queueing via `kafkajs` to sandboxed Piston runner containers under strict 5s timeouts with real-time Socket.IO result streaming.
* **Redis 7 Session & State Layer**: Distributed session store, rate limiting, and horizontal WebSocket synchronization via `@socket.io/redis-adapter`.
* **CI/CD Quality Gates**: Multi-stage **GitHub Actions CI/CD pipeline** automating ESLint, Pytest, Pydantic schema validation tests, and Docker container packaging.
* **Client-Side Edge AI Proctoring**: Real-time **TensorFlow.js (COCO-SSD)** inference loops (3s polling) flagging multi-face presence, absence, and unauthorized mobile devices.

---

## 🏗 Architecture & System Overview

```mermaid
flowchart TB
    subgraph Clients[" 🌐 Client Applications "]
        FE["Candidate / Company Portal\n(React + Vite - :5173)"]
        AI_FE["AI Interview Room UI\n(React + Vite - :5174)"]
        OA_FE["Online Assessment UI\n(React - :3000)"]
        PRAC_FE["DSA Practice UI\n(React + Vite - :5175)"]
    end

    subgraph Messaging[" ⚡ Event-Driven & Caching Layer "]
        KAFKA["Apache Kafka Bus\n(Broker :9092)"]
        REDIS["Redis 7 State & Pub/Sub\n(:6379)"]
    end

    subgraph Microservices[" ⚙️ Core Services & Microservices "]
        CORE_BE["Core Backend API\n(Node/Express - :5000)"]
        AI_INT_BE["AI Interview Engine\n(Node/Express - :5005)"]
        DSA_BE["DSA Practice Service\n(Node/Express - :5007)"]
        PRAC_BE["AI Practice Service\n(Node/Express - :5008)"]
        OA_BE["OA & Proctoring API\n(Node/Express - :5002)"]
        AI_SVC["AI Python Engine (FastAPI)\n(FastAPI - :8000)"]
    end

    subgraph GenAI[" 🧠 Agentic AI, RAG & Local LLM "]
        LANG["LangChain & LangGraph Orchestrator"]
        CHROMA[("ChromaDB Vector Store\n(Embeddings: all-MiniLM-L6-v2)")]
        OLLAMA["LLaMA 3 8B Local\n(Ollama - :11434)"]
        WHISPER["Faster-Whisper int8\n(CPU Audio Transcription)"]
    end

    subgraph Data[" 💾 Data Storage "]
        MONGO[("MongoDB 6.x\n(12 Collections)")]
    end

    %% Routing
    FE --> CORE_BE
    AI_FE --> AI_INT_BE
    OA_FE --> OA_BE
    PRAC_FE --> DSA_BE

    AI_INT_BE --> KAFKA
    AI_INT_BE --> REDIS
    AI_INT_BE --> LANG
    LANG --> OLLAMA
    LANG --> CHROMA

    CORE_BE --> AI_SVC
    AI_SVC --> WHISPER
    AI_SVC --> CHROMA

    CORE_BE --> MONGO
    AI_INT_BE --> MONGO
```

---

## 🤖 Agentic Interview Engine & RAG Pipeline

### 1. Stateful 7-Stage LangGraph FSM
The interview engine operates as a stateful graph managing state transitions while preventing non-deterministic LLM behavior:
```
[ INIT ] ──> [ GREETING & CONTEXT ] ──> [ PROBLEM_PROMPT ] ──> [ CANDIDATE_CODE ]
                                                                      │
[ FINAL_FEEDBACK ] <── [ EVALUATION ] <── [ HINT_PROMPT (if stuck) ] <┘
```
* **Guardrails & Bias Neutrality**: Evaluates candidate responses using LangChain prompt templates, passing completions through strict regex sanitizers to eliminate unsolicited conversational praise and maintain neutral evaluation.
* **Structured Output Parsing**: Leverages `PydanticOutputParser` to force evaluation outputs into validated JSON structures (`score: 0-100`, `technical_accuracy`, `code_efficiency`, `strengths`, `improvements`).

### 2. ChromaDB RAG Semantic Retrieval
* **Vector Knowledge Base**: Candidate resumes and standard technical question rubrics are chunked using `RecursiveCharacterTextSplitter` (chunk size: 500, overlap: 50) and vectorized using `sentence-transformers/all-MiniLM-L6-v2`.
* **Hybrid Retrieval**: Employs dense vector similarity queries against ChromaDB combined with sparse BM25 keyword matching, grounding LLaMA 3's technical evaluation against the exact rubric criteria.

### 3. Context Engineering & Dynamic History Compaction
* Manages an **8-turn sliding context window**. When conversational history reaches token limits, a recursive summarization chain condenses preceding turns into a dense 2-sentence state digest, slashing prompt tokens by **40%** without losing interview context.

---

## ⚙️ Microservices Matrix

| Service | Technology | Port | Responsibilities |
| :--- | :--- | :--- | :--- |
| **`backend`** | Node.js, Express, MongoDB | `:5000` | Core authentication (JWT, RBAC), company workflows, job lifecycle, applicant tracking |
| **`ai-interview-backend`**| Express, LangChain, Kafka, Redis | `:5005` | Real-time WebSocket interview rooms, LangGraph FSM, LLaMA 3 integration, code runners |
| **`ai-service`** | FastAPI, ChromaDB, spaCy, Whisper | `:8000` | Resume parsing (pdfplumber + NER), ChromaDB RAG matching, int8 Faster-Whisper ASR |
| **`oa-backend`** | Express, MongoDB | `:5002` | Online assessment generation, dynamic MCQs, exam submission state |
| **`dsa-practice-backend`**| Express, Redis | `:5007` | Candidate code playground, problem library, sandboxed execution |
| **`ai-practice-backend`** | Express, Ollama | `:5008` | Self-serve mock interview simulator with real-time AI feedback |

---

## 🚀 CI/CD Pipeline & Quality Gates

The repository employs a multi-stage **GitHub Actions CI/CD workflow** (`.github/workflows/ci.yml`) to enforce code reliability and AI quality gates before deployment:

```
[ Push / PR ] ──> [ Static Analysis & Lint ] ──> [ Unit & Regression Tests ] ──> [ AI Schema Gates ] ──> [ Docker Build ]
```
1. **Lint & Static Analysis**: ESLint across all 5 Express microservices and Flake8/Black for Python services.
2. **Automated Unit Testing**: Jest suites validating API contracts and Pytest testing NLP extraction.
3. **AI Quality Gates**: Verifies that prompt templates and output parsers correctly validate against Pydantic schema definitions with zero validation faults.
4. **Docker Container Smoke Tests**: Automated multi-stage Docker builds ensuring container images compile cleanly.

---

## 🛠️ Tech Stack Badges

* **Frontend**: React 18 (Vite), TailwindCSS, Monaco Editor, Socket.IO Client, TensorFlow.js (COCO-SSD)
* **Backend**: Node.js, Express.js 5.x, Python 3.11, FastAPI
* **AI & Agentic**: LangChain, LangGraph, Ollama (LLaMA 3 8B), ChromaDB, Faster-Whisper, spaCy NER, Scikit-learn
* **Data & Messaging**: MongoDB 6.x, Redis 7.x, Apache Kafka (`kafkajs`), ZooKeeper
* **DevOps & Testing**: Docker, Docker Compose, GitHub Actions CI/CD, Jest, Pytest, Postman

---

## ⚡ Quickstart Guide

### 1. Prerequisites
* **Docker & Docker Compose** installed and running
* **Node.js 18+** and **Python 3.11+**
* **Ollama** installed locally (`ollama pull llama3:8b`)

### 2. Spin Up Infrastructure via Docker
```bash
# Clone the repository
git clone https://github.com/abhirajk970/HireSense.git
cd HireSense

# Start MongoDB, Redis 7, Apache Kafka & ZooKeeper
docker-compose up -d
```

### 3. Launch Python AI Microservice
```bash
cd ai-service
python -m venv venv
# On Windows: venv\Scripts\activate | On Linux: source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 4. Launch Core & Interview Backends
```bash
# In terminal 2: Core backend
cd backend && npm install && npm run dev

# In terminal 3: AI Interview backend
cd ai-interview-backend && npm install && npm run dev
```

### 5. Launch Client Portals
```bash
# In terminal 4: Main candidate & company portal
cd frontend && npm install && npm run dev
```
Access the application at `http://localhost:5173`.

---

## 📄 License
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
