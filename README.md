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
├── backend/                     # FastAPI app
│   └── src/
│       ├── ai/                  # AI features (LangChain, ChromaDB)
│       ├── auth/                # Authentication and user management
│       ├── chats/               # User chats and QAs management
│       ├── utils/               # Universal helpers
│       └── db/                  # PostgreSQL setup (database code)
│   ├── .env
│   └── config.py
│
├── frontend/                    # React app
│   └── src/
│       ├── api/                 # API helpers (auth, chats, base)
│       ├── app/                 # Redux store and related logic
│       ├── assets/              # Static assets (images, logos)
│       ├── components/
│       │   ├── auth/            # Auth form components
│       │   ├── ui/              # Chat UI, sidebar, chat area, loaders, etc.
│       ├── features/            # Redux slices (auth, chats)
│       ├── helpers/             # Utility/helper functions
│       ├── hooks/               # Custom React hooks
│       ├── pages/               # Page components (Home, Login, Signup)
│       ├── App.jsx
│       ├── App.css
│       ├── index.css
│       └── main.jsx
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
