# Paramedic Triage Intake System

Offline-first mobile intake app for field paramedics, with a FastAPI backend included to demonstrate the complete background synchronization workflow.

## What Is Included

- **Expo React Native mobile app** in `mobile/`
  - Chosen approach: Expo with TypeScript for faster setup, reviewer-friendly
    execution, and access to Expo SQLite for offline persistence.
  - Single-screen triage form optimized for fast field intake.
  - Zod + React Hook Form validation.
  - Priority 1 and 2 records use high-visibility hazard styling.
  - SQLite local persistence via `expo-sqlite`.
  - Redux Toolkit state management.
  - NetInfo connectivity listener and AppState foreground sync worker.
  - Pending records are saved locally first, then uploaded when connectivity returns.

- **FastAPI backend** in `backend/`
  - Python 3.13, FastAPI, Pydantic v2, async SQLAlchemy 2.x.
  - PostgreSQL and Alembic migration.
  - CRUD endpoints for triage records.
  - Pagination, sorting, and filtering by priority, status, and sync state.
  - Thin routes, service layer, repository layer, centralized app exception handling.
  - Pytest coverage for core API behavior.

## Backend

The backend is intentionally structured for review:

- PEP 8-oriented Python with full type hints and focused docstrings.
- Pydantic v2 request/response schemas for validation and OpenAPI documentation.
- SQLAlchemy 2.x async ORM models with database constraints and indexes.
- Route handlers stay thin; business logic lives in services and persistence lives in repositories.
- Structured JSON logging through `structlog`, including request logging and exception logging.
- Centralized exception handling for domain errors and unexpected failures.

Run with Docker:

```bash
docker compose up --build
```

API health check:

```bash
curl http://localhost:8000/health
```

Main endpoints:

- `POST /triage`
- `GET /triage`
- `GET /triage/{id}`
- `PATCH /triage/{id}`
- `DELETE /triage/{id}`

Run tests locally:

```bash
cd backend
uv sync --dev
uv run pytest
```

## Mobile App

Install and run:

```bash
cd mobile
npm install
EXPO_PUBLIC_API_URL=http://localhost:8000 npm start
```

For Android emulator, use `http://10.0.2.2:8000` instead of `localhost`.

Run tests:

```bash
cd mobile
npm test
```

### Expo Troubleshooting

Use Node 22 for Expo SDK 51:

```bash
nvm use 22
```

If Metro crashes with `EMFILE: too many open files, watch`, install Watchman
or raise the shell file limit, then restart Metro with a clean cache:

```bash
cd mobile
npx expo start --clear
```

If you are still seeing watcher pressure on macOS, use the project-local Node version pin:

```bash
cd mobile
nvm install 22
nvm use 22
```

Expo SDK 51 expects `@react-native-community/netinfo@11.3.1`; the dependency
is pinned to that version to avoid Expo Go compatibility warnings.

## Offline-First Flow

1. The paramedic submits a triage record.
2. The app writes the record to SQLite immediately with `syncState = pending`.
3. The UI updates from Redux without waiting for the network.
4. The sync worker listens for network restoration through NetInfo.
5. When connectivity is available, queued records are uploaded to the FastAPI backend.
6. Successful records are marked `synced`; failures remain locally available for retry.

This design prevents data loss when cellular coverage is unstable and keeps the UI responsive during background synchronization.
