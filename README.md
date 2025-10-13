# Chat with YouTube Videos

A full‑stack web application that lets users **chat with their YouTube videos**. The interface is modeled after modern LLM chat UIs (like ChatGPT), with a sidebar for multiple chats and a main chat area for interaction.

---

## ScreenShots

---

## Features

* **React frontend** with a ChatGPT‑style interface
  * Sidebar for switching between multiple chats
  * Main chat area for Q&A
  * Real-time message streaming
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

* **Frontend**: React, Tailwind CSS
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
│   ├── config.py
│   ├── requirements.txt
│   └── main.py
│
├── frontend/                    # React app
│   └── src/
│       ├── api/                 # API helpers (auth, chats, base)
│       ├── app/                 # Redux store and related logic
│       ├── assets/              # Static assets (images, logos)
│       ├── components/
│       │   ├── auth/            # Auth form components
│       │   └── home/            # Chat UI, sidebar, chat area, loaders
│       ├── features/            # Redux slices (auth, chats)
│       ├── helpers/             # Utility/helper functions
│       ├── hooks/               # Custom React hooks
│       ├── pages/               # Page components (Home, Login, Signup)
│       ├── App.jsx
│       ├── App.css
│       ├── index.css
│       └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

## Getting Started

### Prerequisites

* **Node.js** >= 18
* **Python** >= 3.10
* **PostgreSQL** running locally or via Docker
* **OpenAI API Key** (or other LLM provider)
* **Huggingface API Key** (for running local emdedding models)


### Environment Variables

Create a `.env` file in the `backend/` directory:

```env
DATABASE_URL 
GROQ_API_KEY
HUGGINGFACE_API_KEY
JWT_SECRET_KEY = 'e64e227cba901e8e22737cc6a07b922a'
JWT_ALGORITHM = HS256

## Optional Configs
MAIL_USERNAME
MAIL_PASSWORD
MAIL_SERVER
MAIL_PORT
MAIL_FROM 
MAIL_FROM_NAME
MAIL_STARTTLS
MAIL_SSL_TLS
USE_CREDENTIALS
VALIDATE_CERTS

```

### Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server
fastapi dev src
```

The backend will be available at `http://localhost:8000`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

---

## Usage

1. **Register or log in** to your account
2. **Start a new chat** by providing a YouTube video URL
3. **Ask questions** about the video content
4. **Receive AI‑powered answers** based on video transcripts
5. **Manage multiple chats** via the sidebar
6. **View chat history** for each conversation

---

## API Documentation

Once the backend is running, visit:
* **Interactive API docs (Swagger)**: `http://localhost:8000/docs`
* **ReDoc**: `http://localhost:8000/redoc`

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## License

MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

* Built with [LangChain](https://www.langchain.com/)
* Powered by [Groq](https://groq.com/)
* UI inspired by ChatGPT

---

## Future Improvements

### Planned Features
* **Multi-language support** for international users
* **Video timestamps** - Link answers to specific video moments
* **Export chat history** to PDF or markdown
* **Collaborative chats** - Share chats with other users
* **Voice input/output** for questions and answers

### Technical Improvements
* **Caching layer** with Redis for faster responses
* **Rate limiting** to prevent API abuse
* **WebSocket support** for real-time streaming responses
* **Improved error handling** and user feedback

### AI Enhancements
* **Support for multiple LLM providers** (Claude, Gemini, local models)
* **Custom fine-tuning** for domain-specific content
* **Semantic search** improvements with better embeddings
* **Multi-modal support** - Analyze video frames and audio
* **Context-aware responses** using chat history
* **Source citations** with exact timestamp references

---

## Contact

For questions or support, please open an issue on GitHub.