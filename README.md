# HireSense: AI-Powered Talent Acquisition Platform

![HireSense Banner](https://img.shields.io/badge/HireSense-AI%20Interview%20Platform-blue?style=for-the-badge&logo=react)

HireSense is a comprehensive, AI-driven hiring platform that seamlessly connects candidates with companies. Our platform streamlines the recruitment process through advanced machine learning for resume screening, AI-proctored online assessments, and local LLaMA-based autonomous technical interviews.

## 🚀 Key Features

*   **AI Interview Microservice:** A local-first, interactive DSA assessment platform powered by LLaMA 3 (via Ollama). Features a specialized "Notebook" interface for candidates to submit algorithms and pseudocode, with the AI dynamically offering hints or transitions based on the candidate's progress.
*   **AI-Proctored Online Assessments (OA):** A secure testing environment that sends and manages candidate invitations, utilizing machine learning to monitor for and flag suspicious activity during tests.
*   **Candidate & Company Portals:** Dedicated dashboards for job seekers to track applications and for recruiters to manage job postings, review AI-generated candidate evaluations, and schedule interviews.
*   **Resume Screening Engine:** Automated parsing and ranking of resumes to find the best fit for specific roles.
*   **Auto-MCQ Generation:** Dynamically generates relevant multiple-choice questions for preliminary screening based on job descriptions and candidate skills.

## 🏗 Architecture & Tech Stack

HireSense is built on a scalable microservices architecture to ensure high availability and modular development.

**Frontend:**
*   React.js / Next.js
*   Tailwind CSS (Glassmorphism & Modern UI)
*   State Management: Redux / Context API

**Backend & Microservices:**
*   Node.js & Express.js
*   Python (for ML and AI integrations)
*   **Services:**
    *   `ai-interview-backend`
    *   `oa-backend` (Online Assessment)
    *   `ai-service`
    *   `backend` (Core API)

**AI & Machine Learning:**
*   LLaMA 3 (Running locally via Ollama)
*   Computer Vision (Proctoring System)
*   NLP (Resume parsing and MCQ generation)

**Database:**
*   MongoDB (NoSQL for flexible data storage)
*   PostgreSQL (For structured transactional data)

## 📁 Repository Structure

```
HireSense/
├── ai-interview-backend/      # Backend service for local LLaMA interviews
├── ai-interview-frontend/     # Specialized Notebook UI for DSA assessments
├── ai-service/                # Central AI logic and processing engine
├── backend/                   # Core application API (Auth, Profiles, etc.)
├── frontend/                  # Main Candidate and Company Portals
├── oa-backend/                # Online Assessment & Proctoring API
└── oa-frontend/               # Candidate testing environment interface
```

## 🛠 Getting Started

### Prerequisites

*   Node.js (v18+)
*   Python (3.9+)
*   Ollama (For running LLaMA 3 locally)
*   MongoDB instance

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/abhirajk970/HireSense.git
    cd HireSense
    ```

2.  **Install dependencies for all microservices:**
    Navigate to each directory (`frontend`, `backend`, `ai-interview-backend`, etc.) and run:
    ```bash
    npm install
    ```
    *(For Python services, use `pip install -r requirements.txt`)*

3.  **Environment Variables:**
    Create a `.env` file in each respective backend service using the provided `.env.example` templates.

4.  **Run the application locally:**
    You can start the main frontend and backend services:
    ```bash
    # In frontend/
    npm start

    # In backend/
    npm run dev
    ```

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request with your proposed changes. Ensure all code follows the established formatting and passes existing tests.

## 📄 License

This project is licensed under the MIT License.
