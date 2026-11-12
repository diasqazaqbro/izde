# Izde

Smart search for university documents: keyword search, search by meaning, and a chat that answers with a link to the source.

"Izde" means "search" in Kazakh. Web Programming course project, IITU, 2026. The project is linked to our diploma (a parser for Kazakhstan national standards): it uses the same pipeline (parse, structure, search) on university documents.

## Demo

**https://izde-five.vercel.app**

Sign in with any email and password. Pick "Администратор" on the sign-in form to see the admin pages and plans. Document titles and quotes come from real public IITU documents; search and chat answers are simulated in phase 1, and chats are kept in your browser.

## Team

| Name | Role | Responsible for |
|---|---|---|
| Dias Adilov | Team Lead, Backend, AI agent | Planning, code review, NestJS API, chat that answers from documents |
| Zhangir Isametov | Frontend | Search, document card, chat UI, admin pages |
| Olzhas Bazarbaiuly | ML | Document parsing, embeddings, search by meaning (Russian, Kazakh, English) |
| Nurmuhammed Zaitin | DevOps / QA | Docker, CI/CD, deployment, testing |

## Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 16+, React 19, TypeScript, Tailwind CSS |
| Backend | NestJS, TypeScript |
| Database | PostgreSQL + pgvector |
| ML service | Python, FastAPI, sentence-transformers, PyMuPDF |
| LLM | Cloud LLM API (local model as plan B) |
| Payment | Mock checkout |
| DevOps | Docker Compose, GitHub Actions |

## Repository structure

```
frontend/   Next.js app
backend/    NestJS API (later)
ml/         Python ML service (later)
docs/       product, design, chat, architecture, data, roadmap
```

## Status

Phase 1 (frontend on mock data) is done: search, document card, chat, admin pages, plans, RU / KZ / EN. All data goes through `frontend/src/lib/api`; phase 2 replaces the mock with HTTP calls to the backend. See `docs/06-roadmap.md` and `docs/PROGRESS.md`.

## Run locally

Node.js 20.9 or newer, npm.

```bash
cd frontend
npm install
npm run dev          # http://localhost:3000
```

Sign in with any email and password. Pick "Администратор" on the sign-in form to see the admin pages and plans.

| Command | What it does |
|---|---|
| `npm run dev` | dev server on port 3000 |
| `npm run typecheck` | generates route types and runs `tsc` |
| `npm run lint` | ESLint |
| `npm test` | unit tests of the mock data layer (vitest) |
| `npm run build` / `npm start` | production build and server |

The demo keeps chats, the current plan and user roles in the browser's `localStorage`. Clear site data to start over.

## Docs

- `docs/01-product.md`: what we build and for whom
- `docs/02-design.md`: design system and screens
- `docs/03-chat.md`: chat specification
- `docs/04-architecture.md`: structure, routes, data types, API contract
- `docs/05-data.md`: real IITU documents used as mock data
- `docs/06-roadmap.md`: phases and tasks
- `docs/prototype.html`: clickable design prototype (open in a browser)
- `docs/DECISIONS.md`: decisions taken during phase 1 and why
- `docs/PROGRESS.md`: work log
- `docs/TESTING.md`: 15-minute manual test checklist
