# ANSER Web v2

Independent web product — not part of the ANSER Flask codebase (`ban-le` / `gateway` / `san-xuat`).
Built from scratch: Next.js frontend + Node.js backend, communicating over a REST API.

## Structure

```
ANSER-web-v2/
├── frontend/   Next.js (TypeScript, App Router, Tailwind)
└── backend/    Node.js + Express (TypeScript)
```

## Run locally

```bash
# backend
cd backend
npm install
npm run dev        # http://localhost:4000

# frontend (separate terminal)
cd frontend
npm install
npm run dev         # http://localhost:3000
```

Frontend calls the backend at `NEXT_PUBLIC_API_URL` (default `http://localhost:4000`).

## Notes

- The Flask apps (`ban-le`, `gateway`, `san-xuat` in `ANSER_ban-le_gateway/`) are a separate,
  unrelated codebase — this project only borrows product ideas/data model concepts from ANSER,
  it does not call into or depend on their code.
