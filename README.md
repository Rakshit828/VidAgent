# Chat with YouTube Videos

A full‑stack web application that lets users **chat with their YouTube videos**. The interface is modeled after modern LLM chat UIs (like ChatGPT), with a sidebar for multiple chats and a main chat area for interaction.

---

## Features

* **React frontend** with a ChatGPT‑style interface

  * Sidebar for switching between multiple chats
  * Main chat area for Q&A
* **FastAPI backend** for APIs and business logic
* **Authentication** with JWT tokens
* **Database**: PostgreSQL for structured data
* **Vector database**: ChromaDB for embeddings and retrieval
* **LangChain integration** for LLM orchestration
* **Chat organization**

  * One user → multiple chats
  * One chat → multiple Q&As
  * One chat is bound to **one YouTube video ID**

---

## Tech Stack

* **Frontend**: React, Tailwind (if applicable)
* **Backend**: FastAPI (Python)
* **AI/LLM**: LangChain
* **Vector DB**: ChromaDB
* **Relational DB**: PostgreSQL
* **Auth**: JWT

---

## Project Structure

```bash
.
├── backend/                # FastAPI app
|    |----src
|    │     ├── ai/        # AI Features, langchain + chroma db
|    │     ├── auth/      # Authentication and User Management
|    │     ├── chats/     # User Chats and QAs management
|    |     |--- utils/    # Universal helpers
|    |     └── db/        # Postgresql setup (Database Code)
│    |  .env
|    | config.py
|
├── frontend/               # React app
│   ├── src/
│   │   ├── api/   # Chat UI, sidebar, auth forms
│   │   ├── app/        # Login, dashboard, chat view
│   │   └── assets/        # API helpers, JWT utils
│
└── README.md
```

---

## Getting Started

### Prerequisites

* Node.js >= 18
* Python >= 3.10
* PostgreSQL running locally or via Docker

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head  # run migrations
uvicorn main:app --reload
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## Usage

1. Register or log in.
2. Start a new chat by linking a YouTube video.
3. Ask questions about the video, receive AI‑powered answers.
4. Manage multiple chats via the sidebar.


---

## License

MIT License.
