# EvalX

EvalX is a Next.js frontend with a FastAPI backend for extracting marks from uploaded PDF result sheets.

## Tech Stack

- Frontend: Next.js (App Router), React, TypeScript
- Backend: FastAPI, PyMuPDF
- Data/Auth/Email integrations: MongoDB, JWT, Resend, Vercel Blob

## Prerequisites

- Node.js 20+
- npm 10+
- Python 3.10+

## 1. Install Dependencies

### Frontend dependencies

```bash
npm install
```

### Backend dependencies

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## 2. Environment Variables

Create `.env.local` in project root with values like:

```bash
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
RESEND_API_KEY=your_resend_api_key
RESEND_FROM="EvalX <onboarding@resend.dev>"
```

Notes:

- `MONGODB_URI` and `JWT_SECRET` are needed for login/auth flows.
- `RESEND_API_KEY` is needed for OTP and email result routes.
- `RESEND_FROM` is optional. Set it to your verified sender/domain in Resend.
- PDF extraction route itself is handled by FastAPI (`/api/extract`).

## Authentication Flow

- Signup: email + password
- First-time verification: OTP via email
- Subsequent logins: email + password only

## 3. Run Locally (Frontend + Backend)

Use two terminals from the project root.

### Terminal 1: Start FastAPI backend

```bash
source venv/bin/activate
uvicorn api.index:app --host 127.0.0.1 --port 8000 --reload
```

### Terminal 2: Start Next.js frontend

```bash
npm run dev
```

Open `http://localhost:3000`.

In development, Next.js rewrites `/api/*` to `http://127.0.0.1:8000/api/*`, so the frontend can call backend endpoints directly.

## 4. Production Build

```bash
npm run build
npm run start
```

## API Notes

- Local extraction endpoint: `POST http://127.0.0.1:8000/api/extract`
- Frontend calls extraction as `POST /api/extract` (rewritten to FastAPI in dev)
- On Vercel, `vercel.json` routes `/api/*` to `api/index.py`
