# SentinelAI — Frontend

AI-powered cyber incident response platform. React 18 + TypeScript + Tailwind
CSS frontend for the SentinelAI FastAPI backend.

## Stack

- Vite + React 18 + TypeScript (strict mode)
- Tailwind CSS
- React Router DOM v6
- Axios (with a JWT request interceptor + 401 handling)
- Framer Motion
- React Hook Form
- Lucide React icons
- Recharts
- jsPDF (client-side report PDF export)

## Getting started

```bash
npm install
cp .env.example .env   # adjust VITE_API_BASE_URL if your backend isn't on 127.0.0.1:8000
npm run dev
```

The app runs at `http://localhost:5173` and expects the backend at
`http://127.0.0.1:8000` by default (see `.env`).

## Backend contract this app was built against

- `POST /auth/register` — JSON `{ name, email, password }`
- `POST /auth/login` — JSON `{ email, password }` (**not** an OAuth2
  `application/x-www-form-urlencoded` form — see `src/api/authApi.ts` for
  the note on why)
- `GET /auth/me` — current user, used to restore a session on page reload
- `POST /upload` — multipart form upload (`file` field), returns the new
  Investigation
- `POST /investigate/{investigation_id}` — runs the AI investigation
  pipeline and returns the updated Investigation (+ findings, once the
  backend's AI module returns them)
- `GET /history` — all investigations for the current user
- `GET /report/{investigation_id}` — the generated report for an
  investigation

Every endpoint responds with the envelope `{ success, message, data }`;
`src/api/*.ts` unwraps this consistently and throws a normal `Error` with
the backend's `message` on failure.

## Folder structure

```
src/
├── api/            # raw HTTP calls (one file per backend resource)
├── components/     # ui/ primitives + feature-grouped components
├── contexts/       # AuthContext (session state)
├── layouts/        # AuthLayout, DashboardLayout
├── pages/          # one file per route
├── routes/         # AppRoutes + ProtectedRoute/GuestOnlyRoute
├── services/       # multi-call workflows (upload+investigate, report+pdf)
├── types/          # shared TypeScript types
└── utils/          # formatters, constants, PDF generation
```

## Notes

- Auth state persists via a JWT stored in `localStorage`; a session is
  restored on reload via `GET /auth/me`.
- The Upload page runs the full pipeline synchronously against
  `POST /investigate/{id}` and animates the 5-agent pipeline
  (Incident Manager → Log Parser → Threat Analyst → Knowledge Agent →
  Report Generator) while it waits.
- PDF export happens entirely client-side with jsPDF from the report data
  already returned by the API — no backend PDF endpoint is required.
