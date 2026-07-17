# RetroDex Frontend — Next.js

This is your RetroDex UI, built using Next.js and wired to the FastAPI + Neon backend. 

## Setup

### 1. Install dependencies
```bash
cd retrodex-nextjs
npm install
```

### 2. Point it at your backend
```bash
cp .env.local.example .env.local
```

### 3. Run it
Make sure your FastAPI backend is running first —
see its README for setup. Then, in this project:
```bash
npm run dev
```
Visit `http://localhost:3000`.


## Troubleshooting
- **Blank grid / "Couldn't reach the Dex API" message:** backend isn't running, or
  `NEXT_PUBLIC_API_URL` is wrong. Check `http://localhost:8000/docs` loads in your browser.
- **CORS error in browser console:** backend's `CORS_ORIGINS` doesn't include your
  frontend's actual URL (`http://localhost:3000` for local dev).
