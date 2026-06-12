# BabyGrowth AI — Backend API

Python FastAPI backend for the BabyGrowth AI child development tracking application.
Handles authentication, child profiles, growth records, and LLM-powered conversations.

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | FastAPI (async Python) |
| ORM | SQLAlchemy 2.0 |
| Validation | Pydantic / Pydantic-Settings |
| Database | PostgreSQL (SQLite for development) |
| Migrations | Alembic |
| Auth | JWT (python-jose) + bcrypt |
| LLM | Groq API (OpenAI-compatible) via `openai` package |

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app, CORS, router registration
│   ├── config.py            # Settings via env (pydantic-settings)
│   ├── database.py          # SQLAlchemy engine & session
│   ├── models.py            # ORM models (User, Child, GrowthRecord, Conversation, ChatMessage)
│   ├── schemas.py           # Pydantic request/response schemas
│   ├── auth.py              # Password hashing, JWT create/verify, get_current_user dependency
│   └── routers/
│       ├── auth.py          # POST /api/auth/register, /login, /logout
│       ├── child.py         # GET/POST /api/child
│       ├── growth.py        # CRUD /api/growth
│       └── chat.py          # Conversations & chat messages with LLM
├── alembic/                 # Schema migrations
│   └── versions/            # e602a2057552_initial_schema.py
├── alembic.ini
├── seed_data.py             # Demo data: user, child, growth records, conversations
├── requirements.txt
└── .env                     # Environment variables (not committed)
```

## API Endpoints

### Auth (`/api/auth`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/register` | Register a new user (role forced to `parent`) |
| POST | `/login` | Login, returns JWT token |
| POST | `/logout` | Logout (stub) |

### Child (`/api/child`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Get current user's child profile |
| POST | `/` | Create a child profile |
| GET | `/{child_id}` | Get child by ID (scoped to current user) |

### Growth Records (`/api/growth`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List growth records (query: `childId`) |
| POST | `/` | Create a growth record |
| PUT | `/{record_id}` | Update a growth record |
| DELETE | `/{record_id}` | Delete a growth record |

### Chat (`/api/chat`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/conversations` | List conversations (query: `childId`) |
| POST | `/conversations` | Create a new conversation |
| PUT | `/conversations/{conv_id}` | Rename a conversation |
| DELETE | `/conversations/{conv_id}` | Delete a conversation |
| POST | `/conversations/{conv_id}/generate-title` | Auto-generate title via LLM |
| POST | `/` | Send a message (LLM-powered reply) |
| GET | `/history` | Get message history (query: `conversationId`) |

## Data Model

```
User (1) ──── (N) Child (1) ──── (N) GrowthRecord
                      │
                      ├── (N) Conversation (1) ──── (N) ChatMessage
```

- **User**: email (unique), password_hash, name, role
- **Child**: user_id, name, date_of_birth, sex, birth_weight, birth_length
- **GrowthRecord**: child_id, date, weight, height, notes
- **Conversation**: child_id, title (auto-generated), summary (after 50 messages)
- **ChatMessage**: conversation_id, user_message, assistant_message, created_at

## LLM Integration

- **Provider**: Groq (via OpenAI-compatible client)
- **Model**: `llama-3.1-8b-instant`
- **System prompt**: Pediatric context with child's age, sex, and recent measurements
- **Memory**: Full history up to 50 messages, then summary mode (LLM generates 2-3 sentence summary of older messages)
- **Title generation**: After first message in a new conversation
- **Error handling**: Graceful fallback, no crash on LLM failure

## Setup

```bash
# 1. Create virtual environment
python3 -m venv venv
source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL, GROQ_API_KEY, and JWT_SECRET_KEY

# 4. Run database migrations
alembic upgrade head

# 5. (Optional) Seed demo data
python seed_data.py

# 6. Start server
uvicorn app.main:app --reload --port 8000
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite:///./baby_growth.db` | PostgreSQL or SQLite connection string |
| `GROQ_API_KEY` | `""` | Groq API key for LLM access |
| `GROQ_MODEL` | `llama-3.1-8b-instant` | Groq model to use |
| `JWT_SECRET_KEY` | `change-this-to-a-random-secret-key` | Secret for JWT signing |
| `JWT_ALGORITHM` | `HS256` | JWT signing algorithm |
| `JWT_EXPIRE_MINUTES` | `1440` | Token expiration in minutes |
| `CORS_ORIGINS` | `http://localhost:3000` | Comma-separated allowed origins |
