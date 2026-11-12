# Izde

Smart search for university documents: keyword search, search by meaning, and a chat that answers with a link to the source.

"Izde" means "search" in Kazakh. Web Programming course project, IITU, 2026. The project is linked to our diploma (a parser for Kazakhstan national standards): it uses the same pipeline (parse, structure, search) on university documents.

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

Phase 1: frontend on mock data. See `docs/06-roadmap.md`.

## Docs

- `docs/01-product.md`: what we build and for whom
- `docs/02-design.md`: design system and screens
- `docs/03-chat.md`: chat specification
- `docs/04-architecture.md`: structure, routes, data types, API contract
- `docs/05-data.md`: real IITU documents used as mock data
- `docs/06-roadmap.md`: phases and tasks
- `docs/prototype.html`: clickable design prototype (open in a browser)
