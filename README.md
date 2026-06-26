# Sistem Perolehan

AI-powered Malaysian government procurement guidance system based on **Pekeliling Perbendaharaan PK 2.9 (Kaedah Sebut Harga)**.

## Features

- Login (client-side session)
- Form: Jenis Perolehan (Bekalan / Perkhidmatan / Kerja) with conditional Jenis Kerja + Harga Siling
- AI analysis — PK 2.9 compliant guidance streamed in real-time
- Follow-up AI document generation (Arahan, Borang, Syarat-Syarat Am, Senarai Semak)
- PDF export

---

## Project Structure

```
.
├── backend/        # Express 5 API server (TypeScript)
│   ├── src/
│   │   ├── index.ts
│   │   ├── app.ts
│   │   └── routes/
│   │       ├── index.ts
│   │       ├── health.ts
│   │       ├── perolehan.ts     ← POST /api/perolehan/analyze (SSE)
│   │       └── generate-doc.ts  ← POST /api/perolehan/generate-doc (SSE)
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/       # Plain HTML/CSS/JS — no build step needed
    ├── index.html
    ├── style.css
    └── app.js      ← set BACKEND_URL at top of this file
```

---

## Quick Start

### 1 — Backend

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env: set your OPENAI_API_KEY and OPENAI_MODEL

# Run dev server (port 3001 by default)
npm run dev
```

#### `.env` values

| Variable | Description | Example |
|---|---|---|
| `OPENAI_API_KEY` | Your OpenAI API key | `sk-proj-...` |
| `OPENAI_MODEL` | Model to use | `gpt-4o-mini` |
| `PORT` | Port to listen on | `3001` |

---

### 2 — Frontend

Open `frontend/index.html` directly in a browser, **or** serve it with any static file server:

```bash
cd frontend
npx serve .
# or: python3 -m http.server 8080
```

**Important:** Edit `BACKEND_URL` at the top of `frontend/app.js` to point to your running backend:

```js
const BACKEND_URL = "http://localhost:3001";
```

If your backend is on a different host/port, change this value accordingly.

---

## Test Login Credentials

| ID | Kata Laluan |
|---|---|
| `admin` | `admin123` |
| `user01` | `password` |

---

## API Endpoints

### `GET /api/healthz`
Health check. Returns `{ "status": "ok" }`.

### `POST /api/perolehan/analyze`
Streams AI guidance based on PK 2.9.

**Request body:**
```json
{
  "jenisPerolehan": "bekalan" | "perkhidmatan" | "kerja",
  "jenisKerja": "...",  // required if jenisPerolehan = "kerja"
  "hargaSiling": 75000  // number, positive
}
```

**Response:** `text/event-stream` (SSE)
```
data: {"content":"## Kaedah Perolehan\n..."}
data: {"done":true}
```

### `POST /api/perolehan/generate-doc`
Streams a full draft sebut harga document.

**Request body:** same as `/analyze`

**Response:** `text/event-stream` (SSE), same format.

---

## Procurement Threshold Reference (PK 2.9)

| Jenis | Had Nilai | Kaedah |
|---|---|---|
| Bekalan / Perkhidmatan | ≤ RM50k | Pembelian Terus |
| Bekalan / Perkhidmatan | > RM50k – RM100k | Sebut Harga (Bumiputera) |
| Bekalan / Perkhidmatan | > RM100k – RM500k | Sebut Harga |
| Bekalan / Perkhidmatan | > RM500k | Tender |
| Kerja | ≤ RM50k | Pembelian Terus |
| Kerja | > RM50k – RM200k | Sebut Harga (CIDB G1) |
| Kerja | > RM200k – RM500k | Sebut Harga (CIDB G2) |
| Kerja | > RM500k | Tender |

---

## Deployment Notes

- Set `OPENAI_API_KEY` as an environment variable — never commit it to git.
- For production, add `CORS` origin restrictions in `backend/src/app.ts`.
- The frontend can be hosted on any static host (Netlify, Vercel, GitHub Pages, etc.); just update `BACKEND_URL` to your production backend URL.
- The backend can be deployed to Railway, Render, Fly.io, or any Node.js host.
