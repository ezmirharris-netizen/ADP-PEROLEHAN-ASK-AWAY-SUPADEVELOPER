# Sistem Perolehan

AI-powered Malaysian government procurement guidance system based on **Pekeliling Perbendaharaan PK 2.9 (Kaedah Sebut Harga)**.

## Features

- Login (client-side session)
- Form: Jenis Perolehan (Bekalan / Perkhidmatan / Kerja) with conditional Jenis Kerja + Harga Siling
- AI analysis — PK 2.9 compliant guidance (rule-based engine)
- Document generation — Sebut Harga DOCX exported from Supabase-hosted templates
- PDF upload support for Senarai Spesifikasi & Jadual Tawaran Harga fields

---

## Architecture

```
User Browser
    ↓  HTTPS
Backend (Express/TypeScript)     ← serves frontend static files too
    ↓  HTTPS
Supabase Storage                 ← hosts .docx template files
    ↓
Generated .docx returned to user
```

| Part | Technology |
|---|---|
| Frontend | Vanilla HTML / CSS / JS (served by backend) |
| Backend | Express 5, TypeScript, tsx |
| AI Guidance | Rule-based PK 2.9 engine (`pk29Engine.ts`) |
| Vector Search | ChromaDB (in-memory, loads on startup) |
| Template Storage | Supabase Storage bucket (`templates`) |

---

## Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── index.ts              ← server entry point (port 3001)
│   │   ├── app.ts                ← Express app, static file serving
│   │   ├── supabaseClient.ts     ← Supabase storage client
│   │   └── routes/
│   │       ├── perolehan.ts      ← POST /api/perolehan/analyze
│   │       ├── generate-surat.ts ← POST /api/generate-surat (DOCX generation)
│   │       └── pk29Engine.ts     ← PK 2.9 rule-based logic
│   └── scripts/
│       └── createTemplate.mjs    ← uploads .docx template to Supabase
│
└── frontend/
    ├── index.html
    ├── style.css
    └── app.js
```

---

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `SUPABASE_URL` | Your Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Supabase anon/public API key | Yes |
| `SUPABASE_BUCKET` | Storage bucket name (default: `templates`) | No |
| `PORT` | Port to listen on (default: `3001`) | No |

---

## Supabase Setup

The app uses **Supabase Storage** to host Word document templates. No SQL tables are needed.

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Storage** → **New bucket** → name it `templates` → set to **Public**
3. Upload `dokumen-sebut-harga-template.docx` into the bucket
4. Copy your **Project URL** and **anon/public key** from *Settings → API*

To upload templates automatically using the script:

```bash
SUPABASE_URL=https://xxx.supabase.co \
SUPABASE_SERVICE_KEY=your-service-key \
node backend/scripts/createTemplate.mjs
```

---

## Local Development

```bash
# Install dependencies (from project root)
npm install

# Run the backend (also serves frontend on port 3001)
npx tsx backend/src/index.ts
```

Set your environment variables before running (or use a `.env` file):

```bash
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_ANON_KEY=your-anon-key
```

Open `http://localhost:3001` in your browser.

---

## Test Login Credentials

| ID | Kata Laluan |
|---|---|
| `admin` | `admin123` |
| `user01` | `password` |

---

## Deploying to External Services

The frontend and backend deploy together as a **single Node.js service**. The only external dependency is Supabase (already hosted).

### Step 1 — Push code to GitHub

Connect Replit to GitHub (Git tab in sidebar) or download as zip and push manually.

### Step 2 — Choose a hosting platform

#### Option A — Railway (Recommended)

1. Go to [railway.app](https://railway.app) → *New Project → Deploy from GitHub repo*
2. Select your repository
3. Add environment variables in the Railway dashboard:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `PORT` = `3001`
4. Railway auto-detects Node.js — no extra config needed
5. Your app goes live at a `*.up.railway.app` URL

#### Option B — Render

1. Go to [render.com](https://render.com) → *New → Web Service → Connect GitHub repo*
2. **Build Command:** `npm install`
3. **Start Command:** `npx tsx backend/src/index.ts`
4. Add the same environment variables as above
5. Select the free plan

#### Option C — Fly.io

Requires a `Dockerfile`. Good for full control over the runtime environment.

### Step 3 — Set environment variables on your chosen platform

| Variable | Where to get it |
|---|---|
| `SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `SUPABASE_ANON_KEY` | Supabase → Settings → API → anon/public key |

---

## Note on ChromaDB

ChromaDB (used for PK 2.9 document vector search) runs **in-memory** inside the backend process. It reloads automatically on startup. On free-tier hosting where the server sleeps and restarts, the first AI query after wake-up may take a few seconds while ChromaDB initialises.

---

## API Endpoints

### `GET /api/healthz`
Health check. Returns `{ "status": "ok" }`.

### `POST /api/perolehan/analyze`
Returns AI guidance based on PK 2.9 rules.

**Request body:**
```json
{
  "jenisPerolehan": "bekalan" | "perkhidmatan" | "kerja",
  "jenisKerja": "...",
  "hargaSiling": 75000
}
```

### `POST /api/generate-surat`
Generates a Sebut Harga DOCX document from the Supabase template.

**Request:** `multipart/form-data` (supports PDF uploads for spec/price fields)

**Response:** `.docx` file download

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
