# 📺 VidAgent: Your Intelligent YouTube Conversational Agent

## Make Videos Talk

VidAgent is an agentic RAG (Retrieval-Augmented Generation) application designed to transform how you consume YouTube content. Instead of just watching, you can now **converse** with any video. Powered by an advanced AI agent, ChatTube analyzes transcripts, retrieves relevant context, and provides real-time, cited answers to your deepest questions.

---

## 🚀 Live Demo
**Coming Soon**

---

## 🌟 Core Features

- **🧠 Agentic Reasoning**: Built with **LangGraph**, the application uses a sophisticated state machine to decide whether to fetch video context, check conversation history, or answer directly.
- **⚡ Real-time SSE Streaming**: Experience instantaneous responses with Server-Sent Events (SSE). Watch the AI "think" through agent steps and stream answers token-by-token.
- **📥 Intelligent Ingestion**: Automatically extracts YouTube transcripts, segments them into meaningful chunks, and indexes them into a high-performance vector database.
- **🤖 Multi-LLM Support**: Choice and flexibility. Switch between various cutting-edge models like GPT-OSS-120B, Llama 3.3, and Qwen to find the best reasoning for your queries.
- **💾 Persistent Conversations**: Seamlessly save your chat history. Conversations are persisted to a PostgreSQL backend with manual cache synchronization for a lag-free UI.
- **🎨 Premium UX/UI**: A modern, sleek interface built with Tailwind CSS 4 and Shadcn/UI. Features include:
  - Responsive Sidebar for chat management.
  - Interactive status indicators for Agent steps.
  - Full Markdown support for code snippets, lists, and tables in AI responses.
  - Smooth animations with Framer Motion.
  - Dark/Light mode support.

---

## 🏗️ High-Level Architecture

1.  **Ingestion Pipeline**: YouTube URL → Transcript Extraction → Recursive Character Splitting → Pinecone Vector Store.
2.  **Agentic Workflow**: User Query → LangGraph Decision Maker → Vector Similarity Search (Metadata Filtered by Video ID) → Context Consolidation → LLM Response.
3.  **Communication**: Frontend communicates with FastAPI via REST for configuration and SSE for high-concurrency streaming.

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) & [TanStack Query v5](https://tanstack.com/query/latest)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) + [Shadcn/UI](https://ui.shadcn.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Markdown**: [React Markdown](https://github.com/remarkjs/react-markdown) + [Remark GFM](https://github.com/remarkjs/remark-gfm)
- **Icons**: [Lucide React](https://lucide.dev/)

### **Backend**
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/)
- **Orchestration**: [LangChain](https://www.langchain.com/) & [LangGraph](https://www.langchain.com/langgraph)
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [SQLAlchemy](https://www.sqlalchemy.org/) (Async)
- **Vector DB**: [Pinecone](https://www.pinecone.io/)
- **Authentication**: JWT (JSON Web Tokens) with Argon2 hashing
- **Logging**: [Loguru](https://github.com/Delgan/loguru)

---

## 📂 Project Structure

```bash
.
├── backend/                     # FastAPI Application
│   └── src/
│       ├── ai/                  # AI Agent, LangGraph logic, & Vector DB integrations
│       ├── auth/                # JWT Auth, User flows, & Security
│       ├── chats/               # Chat management & QA persistence logic
│       ├── db/                  # SQLAlchemy models & migrations
│       └── main.py              # Application entry point
│
├── frontend/                    # React Vite Application
│   └── src/
│       ├── components/          # Specialized UI components (ChatArea, Sidebar, etc.)
│       ├── hooks/               # Custom hooks (SSE streaming, API wrappers)
│       ├── constants/           # LLM configurations & Agent step messages
│       ├── store/               # Zustand state management
│       ├── types/               # TypeScript definitions
│       └── pages/               # Main application views
│
└── README.md
```

---

## 🚀 Getting Started

### **Prerequisites**
- **Node.js** >= 20
- **Python** >= 3.11
- **PostgreSQL** (Local or Cloud)
- **Pinecone Account** (Vector Index)
- **Groq API Key** (LLM Provider)

### **1. Environment Setup**
Create a `.env` file in the `backend/` directory:

```env
DATABASE_URL=postgresql+asyncpg://user:pass@localhost/chattube
GROQ_API_KEY=your_groq_key
PINECONE_API_KEY=your_pinecone_key
PINECONE_INDEX=chattube
JWT_SECRET_KEY=your_super_secret_key
# Optional: Mail settings for verification
MAIL_USERNAME=...
```

### **2. Backend Installation**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # venv\Scripts\activate on Windows
pip install -r requirements.txt
fastapi dev src
```

### **3. Frontend Installation**
```bash
cd frontend
npm install
npm run dev
```

---

## 📖 Key Implementation Details

### **Agentic SSE Streaming**
The application uses a custom `useAgentStream` hook that handles the complexity of SSE:
- Automatic 401 token refresh and retry logic.
- Real-time updates of agent status (e.g., "Scanning transcript...", "Thinking...").
- AbortController integration for cancelling streams mid-way.

### **Persistance & Caching**
To provide a snappy experience:
1.  Query and Response are saved to PostgreSQL *after* the stream completes.
2.  The TanStack Query cache is manually updated on the frontend to reflect changes instantly without a full page refetch.

---

## 🤝 Contributing
Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📜 License
Distributed under the MIT License. See `LICENSE` for more information.

---

## ❤️ Acknowledgments
- UI inspiration from ChatGPT and Claude.
- Groq for providing lightning-fast LLM inference.
- Google Antigravity for frontend development.
