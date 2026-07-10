# Paramedic Triage Intake System

Offline-first mobile intake app for field paramedics, with a FastAPI backend included to demonstrate the complete background synchronization workflow.

## What Is Included
<img width="308" height="687" alt="Screenshot 2026-07-10 at 23 39 24" src="https://github.com/user-attachments/assets/927a2823-3859-4678-ae41-c251686ca9bc" /> || <img width="321" height="691" alt="Screenshot 2026-07-10 at 23 40 02" src="https://github.com/user-attachments/assets/a2d7d863-46f9-44c1-935f-ed8dad7fc670" />



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

If the build fails with `Network is unreachable` while installing Python
packages, Docker Desktop cannot reach PyPI from inside the build container. Check
Docker Desktop networking or your VPN/proxy, then rebuild only the API image:

```bash
docker compose build --no-cache api
docker compose up
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
npm start
```

The mobile app defaults to a self-contained mock API mode so the offline-first
queue can be reviewed without running a backend:

```bash
EXPO_PUBLIC_API_MODE=mock npm start
```

Mock uploads wait 2 seconds to simulate a real network request. To demonstrate
retry behavior, opt into random mock failures:

```bash
EXPO_PUBLIC_API_MODE=mock EXPO_PUBLIC_MOCK_FAILURE_RATE=0.25 npm start
```

To use the included FastAPI backend instead:

```bash
EXPO_PUBLIC_API_MODE=http EXPO_PUBLIC_API_URL=http://localhost:8000 npm start
```

For Android emulator with the backend, use `http://10.0.2.2:8000` instead of
`localhost`.

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
2. The app writes the record to SQLite immediately with `syncState = pending`;
   submission success does not depend on internet connectivity.
3. The UI updates from Redux without waiting for the network.
4. The sync worker listens for network restoration through NetInfo.
5. The sync worker also runs when the app returns to the foreground through
   AppState, which covers device lifecycle changes during field use.
6. When connectivity is available, queued records are uploaded in the background
   to either the local mock API or `POST /api/v1/triage`.
7. The upload loop is guarded so only one sync pass runs at a time.
8. Failed uploads are marked `failed` with the error message and are picked up
   again by the next connectivity or foreground sync pass.
9. Successful records are marked `synced` and store the returned remote ID.

This design prevents data loss when cellular coverage is unstable and keeps the
UI responsive during background synchronization.

## Assessment Checklist

- **Single-screen intake:** patient name, condition description, priority 1-5,
  and status (`Pending`, `In-Transit`) are captured on one screen.
- **Validation:** blank text fields are rejected and priority/status values are
  constrained with Zod and React Hook Form.
- **Critical visual treatment:** priority 1 and 2 use high-visibility red/orange
  styling in the selector and recent intake list.
- **Offline interception:** submit always writes to SQLite first; offline devices
  queue records instead of showing a generic network error.
- **Local persistence:** Expo SQLite stores queued, syncing, failed, and synced
  records on device.
- **Background queue:** NetInfo and AppState trigger automatic retry when
  connectivity returns or the app becomes active.
- **State management:** Redux Toolkit owns UI state while database and sync code
  live outside the screen component.
- **Testing:** mobile unit tests cover validation and API mapping; backend tests
  cover API behavior.

## Demo Video Script

1. Start the app in mock mode with `npm start`.
2. Enable Airplane Mode on the device.
3. Submit a priority 1 or 2 record and show that it appears immediately as
   safely queued.
4. Disable Airplane Mode.
5. Wait for the banner/list to show the record automatically transition to
   synchronized without tapping a retry button.
