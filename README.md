# Paramedic Triage Intake System

Offline-first mobile intake app for field paramedics, with a FastAPI backend included to demonstrate the complete background synchronization workflow.

## What Is Included

- **React Native / Expo mobile app** in `mobile/`
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

## Offline-First Flow

1. The paramedic submits a triage record.
2. The app writes the record to SQLite immediately with `syncState = pending`.
3. The UI updates from Redux without waiting for the network.
4. The sync worker listens for network restoration through NetInfo.
5. When connectivity is available, queued records are uploaded to the FastAPI backend.
6. Successful records are marked `synced`; failures remain locally available for retry.

This design prevents data loss when cellular coverage is unstable and keeps the UI responsive during background synchronization.
