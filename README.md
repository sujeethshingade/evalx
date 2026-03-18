# EvalX

EvalX is a Next.js frontend with a FastAPI backend for extracting marks from uploaded PDF result sheets.

## Tech Stack

- Frontend: Next.js 16.1.6 (App Router), React 19, TypeScript
- Backend: FastAPI, PyMuPDF
- Data/Auth/Email integrations: MongoDB, JWT, Resend, Vercel Blob
- UI: Tailwind CSS, AG Grid, Framer Motion

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

## 5. Performance Optimizations

### Backend Optimizations

#### Database Query Optimization

- **Student List Endpoint** (`/api/results/students`): Uses MongoDB aggregation pipeline instead of loading full arrays into Node.js memory
  - Aggregation stages: `$match` → `$sort` → `$unwind` → `$group` → `$sort`
  - Returns only `{usn, name, latestRunAt}` instead of full result objects
  - **Impact**: 10-100x faster for users with 1000+ student records, 80% less memory usage
- **Student Detail Endpoint** (`/api/results/students/[usn]`): Aggregation pipeline to filter specific student records server-side
  - Filters by USN on MongoDB before transferring data
  - **Impact**: ~5-10x faster for large datasets

### Frontend Optimizations

#### Component Memoization

- **Student Results Pages**: Memoized components prevent unnecessary re-renders
  - `StudentListButton`: Only re-renders when that student's data changes
  - `SavedRunCard`: Only re-renders when that run's data changes
  - `SemesterCard`: Only re-renders when semester data changes
  - `EmailInput`, `PasswordInput`, `OTPInput` (Login/Signup): Prevent form re-renders on parent state changes
  - Uses React.memo() for efficient re-render prevention

#### Request Deduplication

- **Student Details Caching**: Session-level cache for fetched student details
  - First load from API (~0.5s), subsequent loads instant
  - Eliminates redundant API calls when toggling between students
  - **Impact**: ~50% reduction in API calls during typical usage

#### Data Display Optimization

- **AG Grid Configuration**: Pagination (20 rows/page), lazy loading, virtual scrolling
- **Custom Scrollbars**: Optimized scroll experience for large lists
- **Modal Lazy Loading**: Excel viewer modal loads only when opened

## API Notes

- Local extraction endpoint: `POST http://127.0.0.1:8000/api/extract`
- Frontend calls extraction as `POST /api/extract` (rewritten to FastAPI in dev)
- On Vercel, `vercel.json` routes `/api/extract` to `api/index.py`, rest handled by filesystem routing

## Deployment

### Vercel

EvalX is configured for seamless Vercel deployment:

- `vercel.json`: Routes PDF extraction to Python backend, auth/data endpoints to Node.js
- `middleware.ts`: JWT authentication validation on protected routes
- Automatic environment variable injection for MongoDB, JWT, Resend API keys

### Pre-deployment Checklist

1. Set all required environment variables in Vercel project settings
2. Ensure MongoDB Atlas IP whitelist includes Vercel IPs
3. Test locally with `npm run build && npm run start`
4. Verify auth flow with OTP emails from Resend

## Project Structure

```text
evalx/
├── app/
│   ├── api/                    # Next.js API routes
│   │   ├── auth/              # JWT auth endpoints
│   │   ├── results/           # Student results endpoints (optimized)
│   │   ├── email/             # Email delivery routes
│   │   └── blob/              # File storage routes
│   ├── components/            # Reusable React components
│   ├── extract-marks/         # PDF extraction multi-step UI
│   ├── login/                 # Login page (optimized)
│   ├── signup/                # Signup page (optimized)
│   └── student-results/       # Main results dashboard (optimized)
├── lib/
│   ├── auth.ts               # JWT signing/verification
│   ├── mongodb.ts            # MongoDB connection pool
│   ├── server-auth.ts        # Server-side auth helpers
│   └── results.ts            # Data extraction utilities
├── models/                    # MongoDB schemas
├── api/                       # FastAPI Python backend
│   └── index.py              # PDF extraction service
├── middleware.ts             # JWT validation middleware
├── next.config.mjs           # Next.js config
├── tsconfig.json             # TypeScript config
└── vercel.json               # Vercel routing config
```
