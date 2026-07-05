# SentinelAI Backend

**SentinelAI** is an AI-powered Cyber Incident Response Platform. Users upload
cybersecurity log files, which will later be investigated by a CrewAI
multi-agent workflow.

This repository contains **only the backend foundation**: authentication,
file upload, and the investigation/report data model. CrewAI multi-agent
analysis and RAG are intentionally **not** implemented yet — they are future
additions that will plug into the `POST /investigate/{id}` endpoint.

---

## Requirements

- Python 3.11+
- pip

All Python dependencies are listed in `requirements.txt`.

---

## Installation

```bash
# 1. Clone / unzip the project, then move into the backend folder
cd backend

# 2. Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate      # on Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment variables
cp .env.example .env
# then edit .env and set a strong SECRET_KEY, e.g.:
#   python3 -c "import secrets; print(secrets.token_hex(32))"
```

---

## Running the Server

```bash
uvicorn app.main:app --reload
```

The API will be available at:

- Base URL: `http://127.0.0.1:8000`
- Swagger UI (interactive docs): `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

On first run, `sentinel.db` (a SQLite database file) is created automatically
in the `backend/` directory, along with all required tables.

---

## Folder Structure

```
backend/
├── app/
│   ├── main.py                 # FastAPI app, routers, exception handlers
│   ├── config.py                # Environment-based settings
│   ├── dependencies.py          # get_current_user (JWT) dependency
│   ├── database/
│   │   ├── database.py          # SQLAlchemy engine/session/init_db
│   │   ├── models.py            # User, Investigation, Report ORM models
│   │   └── schemas.py           # Pydantic request/response schemas
│   ├── api/
│   │   ├── auth.py              # /auth/register, /auth/login, /auth/me
│   │   ├── upload.py            # /upload
│   │   ├── investigation.py     # /investigate/{id}, /history
│   │   └── report.py            # /report/{id}
│   └── utils/
│       ├── security.py          # bcrypt hashing + JWT create/decode
│       └── responses.py         # standard success/error response envelope
├── uploads/                     # uploaded log files land here
├── reports/                     # generated report artifacts (future use)
├── requirements.txt
├── .env.example
└── README.md
```

---

## Authentication

- Passwords are hashed with **bcrypt** (via passlib) — plaintext passwords
  are never stored.
- On register/login, a **JWT access token** is issued (`HS256`, configurable
  expiration via `ACCESS_TOKEN_EXPIRE_MINUTES`).
- Protected endpoints require an `Authorization: Bearer <token>` header.
- In Swagger UI, click **Authorize** and paste the token returned by
  `/auth/login` or `/auth/register` to call protected endpoints interactively.

---

## API Endpoints

| Method | Endpoint               | Auth required | Description                                      |
|--------|------------------------|:-------------:|---------------------------------------------------|
| POST   | `/auth/register`       | No            | Create a new user account, returns a JWT token     |
| POST   | `/auth/login`          | No            | Log in, returns a JWT token                        |
| GET    | `/auth/me`             | Yes           | Get the current authenticated user's profile       |
| POST   | `/upload`              | Yes           | Upload a `.txt`/`.csv`/`.log` file (max 10MB)       |
| POST   | `/investigate/{id}`    | Yes           | Start an investigation (CrewAI placeholder)         |
| GET    | `/history`             | Yes           | List all investigations for the current user        |
| GET    | `/report/{id}`         | Yes           | Retrieve the report for an investigation             |

### Standard Response Envelope

Every endpoint returns JSON in one of these two shapes:

**Success**
```json
{
  "success": true,
  "message": "Human-readable message",
  "data": { }
}
```

**Error**
```json
{
  "success": false,
  "message": "Human-readable error message",
  "data": null
}
```

---

## Database Schema

**User**
| Column         | Type      |
|----------------|-----------|
| id             | string (uuid, PK) |
| name           | string    |
| email          | string (unique) |
| password_hash  | string    |
| created_at     | datetime  |

**Investigation**
| Column       | Type      |
|--------------|-----------|
| id           | string (uuid, PK) |
| user_id      | string (FK -> users.id) |
| filename     | string    |
| attack_type  | string (nullable) |
| severity     | string (nullable) |
| status       | string (`uploaded` / `investigating` / `completed` / `failed`) |
| created_at   | datetime  |

**Report**
| Column           | Type      |
|------------------|-----------|
| id               | string (uuid, PK) |
| investigation_id | string (FK -> investigations.id, unique) |
| summary          | string (nullable) |
| recommendations  | string (nullable) |
| pdf_path         | string (nullable) |
| created_at       | datetime  |

**Relationships:** One `User` → many `Investigation`s. One `Investigation` → one `Report`.

---

## Security Notes

- `SECRET_KEY` must be set via environment variable (`.env`) — never hardcode
  it, and never commit `.env` to version control.
- Password hashes are never returned in any API response.
- Uploaded files are validated by extension and size, and stored under a
  randomly generated filename to prevent path traversal / collisions.
- SQL injection is prevented by exclusively using SQLAlchemy's ORM query
  builder (no raw/string-interpolated SQL anywhere).

---

## What's Next (Not Included in This Foundation)

- CrewAI multi-agent investigation workflow (will be wired into
  `POST /investigate/{id}`)
- RAG-based log analysis
- PDF report generation (the `pdf_path` column is ready to be populated)
