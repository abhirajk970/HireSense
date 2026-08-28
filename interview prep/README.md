# HireSense — Technical Interview Preparation Dossier & Master Guide

This directory contains the master technical dossier and interview preparation guide for the **HireSense** platform.

## 📄 File Overview
- **[`index.html`](file:///f:/HireSense/interview%20prep/index.html)**: The master, single-page, self-contained interactive web & PDF dossier.

---

## 🚀 How to View & Export to PDF

### 1. View in Any Browser
Double-click `index.html` or open it with your favorite browser (Chrome, Edge, Brave, Safari, Firefox).

### 2. Export / Print as a Clean PDF
1. Open `index.html` in your browser.
2. Click the **"🖨️ Export to PDF"** button on the top navigation bar (or press `Ctrl + P` / `Cmd + P`).
3. In the print dialog:
   - **Destination**: *Save as PDF*
   - **Layout**: *Portrait*
   - **Margins**: *Default* or *None*
   - **Options**: Check *Background graphics* for colors and badges.
4. Click **Save**. The document is pre-styled with print media queries (`@media print`) that format every section into clean, publication-grade pages.

---

## 📚 What This Dossier Covers

1. **System Overview & Core Philosophy**: Why HireSense was built, eliminating recruiter screening fatigue, zero cloud API costs, and the deterministic evaluation philosophy.
2. **Distributed Microservices Topology**: Breakdown of all 6 services (Core API, AI Interview Service, Collaborative Interview Service, Online Assessment, DSA Practice, and Python ML/Whisper Service).
3. **Deep Tech Theory ("Teach Me Everything Used")**:
   - **Apache Kafka**: Distributed event streaming, consumer groups, partition scaling, and asynchronous code runner execution.
   - **Redis 7**: In-memory caching, rate-limiting, and `@socket.io/redis-adapter` for horizontal WebSocket scaling.
   - **WebRTC**: Direct peer-to-peer audio/video streaming, SDP offers/answers, and STUN/TURN NAT traversal.
   - **NLP & Information Extraction**: spaCy Named Entity Recognition (NER) and Scikit-Learn TF-IDF vector math with Cosine Similarity.
   - **Faster-Whisper STT**: CTranslate2 engine, 16-bit PCM to Float32 audio normalization, and Int8 CPU quantization.
   - **Sandboxed Security**: Node child process timeouts (5000ms SIGKILL), network proxy stripping, and ephemeral file handling.
4. **9-Stage AI State Machine (FSM)**: Complete state transition diagram from `INIT` to `FINAL_FEEDBACK`.
5. **Comprehensive Technical Interview Q&A Bank**:
   - Architecture & Distributed Systems (10+ Q&As)
   - AI, LLM & Prompt Engineering (10+ Q&As)
   - WebRTC, Real-Time & Sandbox Security (8+ Q&As)
   - Behavioral Leadership & Elevator Pitch (5+ High-Impact Q&As)
6. **Interactive Study Tools**:
   - Search & Filter bar across all questions and concepts.
   - Interactive Study Flashcards with click-to-reveal answers.
   - Dark/Light mode switcher.
