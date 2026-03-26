# Agent instructions (thebestmessenger)

## Product
We are building an integrated HR system with an internal messenger (see `plan.md`):
- Auth (JWT) + RBAC
- Employees/org structure
- Leave requests + approval workflow (manager, HR) + history
- HR announcements + HR tasks (read/completed)
- Chats + messages (REST + WebSocket)

Planning docs:
- `plan.md` (repo root) — product-level scope and modules
- `backend/plan.md` — backend execution plan and milestone status (source of truth for backend work)

## Backend stack
- FastAPI
- SQL database via SQLAlchemy + Alembic (target: PostgreSQL)
- REST for business endpoints + WebSocket endpoints for messenger
- Separate layers: ORM models vs Pydantic request/response schemas

## Project layout (existing)
Backend lives in `backend/`:
- `backend/app/main.py` — FastAPI app entrypoint
- `backend/app/api/` — HTTP/WebSocket routers and transport-layer deps
- `backend/app/domain/` — domain entities, use-cases, repository *interfaces*
- `backend/app/infrastructure/` — persistence/IO implementation (SQLAlchemy models, repo impls)
- `backend/app/schemas/` — Pydantic schemas (DTOs) for requests/responses
- `backend/app/core/` — cross-cutting: config, security, db session, logging
- `backend/tests/` — tests

## Architecture rules
### Vertical Slice Architecture (within existing folders)
Implement each feature as a “slice” that is mirrored across layers by feature name:
- `backend/app/api/<feature>/...`
- `backend/app/domain/<feature>/...`
- `backend/app/infrastructure/<feature>/...`
- `backend/app/schemas/<feature>/...` (or `backend/app/schemas/<feature>.py` if small)

Keep slice boundaries strict:
- `api` is the only place that knows about FastAPI (`APIRouter`, `Depends`, `HTTPException`, status codes).
- `schemas` is the only place that knows about Pydantic request/response DTOs.
- `domain` contains business rules and orchestrates work; it must not import `fastapi`, SQLAlchemy ORM models, or DB sessions.
- `infrastructure` contains SQLAlchemy ORM models and repository implementations; it must not import FastAPI.

### Repository Pattern (mandatory)
For each feature:
- Define repository interfaces in `backend/app/domain/<feature>/repositories.py` (Protocol/ABC).
- Implement them in `backend/app/infrastructure/<feature>/repositories.py`.
- Wire implementations via FastAPI dependencies (typically in `backend/app/api/<feature>/dependencies.py` or `backend/app/core/deps.py`).

Domain use-cases should depend on interfaces only:
- `domain` use-case gets `repo: <RepoInterface>` (and other ports) via DI.
- `api` constructs/depends-injects concrete implementations.

### Use-cases
Prefer “use-case first” naming and structure:
- `backend/app/domain/<feature>/use_cases.py` (or `services.py` if it reads better)
- Keep use-cases thin but explicit; push invariants/validation into domain objects where appropriate.
- Raise domain exceptions; translate them to HTTP errors in `api`.

## Implementation conventions
- Prefer explicit typing everywhere (including return types).
- Prefer `async` endpoints; if the persistence layer is sync, keep the sync work out of the event loop (or migrate to async SQLAlchemy when we introduce DB).
- Avoid “god” modules; keep feature code inside its slice.
- Do not introduce new top-level packages without a strong reason; extend the existing layout.

## API conventions
- Routers live under `backend/app/api/<feature>/router.py` (or `routes.py`).
- `backend/app/main.py` should only assemble the app (include routers, middleware, lifespan), not contain business logic.
- REST resources: nouns, plural, consistent nesting (`/employees`, `/departments`, `/leave-requests`, `/announcements`, `/chats`, `/messages`).
- WebSocket: keep a dedicated `api/messenger/` slice with connection manager isolated from business logic.

## Database & migrations
- SQLAlchemy ORM models live in `backend/app/infrastructure/<feature>/models.py`.
- Alembic migrations live under `backend/alembic/` (configure when DB is introduced).
- Never access the DB directly from `api` or `domain`; always go through repositories.

## Testing
- Put tests in `backend/tests/` and keep them slice-oriented (`test_<feature>_*.py`).
- Prefer fast unit tests for domain/use-cases with fake repos; add integration tests for repositories once DB wiring exists.

## Tooling notes
`backend/uv.lock` suggests we use `uv` for dependency management.
- Add dependencies in `backend/pyproject.toml`, then run `uv sync`.
- Use `uv run ...` for running commands in the managed environment.
