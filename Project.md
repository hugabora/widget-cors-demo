# Widget CORS Demo

This workspace contains three subprojects:

- `widget-backend`: FastAPI backend exposing HTTP and WebSocket echo endpoints, and serving built widget assets from `/dist`.
- `widget-frontend`: TypeScript + Webpack web component widget.
- `host-frontend`: Independent host page that loads and renders the widget.

## Project Structure

- `widget-backend/app/main.py`
- `widget-backend/dist/`
- `widget-frontend/src/index.ts`
- `host-frontend/index.html`

## Features Implemented

### widget-backend

- `POST /echo`: accepts JSON and returns the same JSON payload.
- `WS /chat-echo`: echoes each incoming text message.
- CORS enabled for typical local host origins, including independent host frontend ports.
- Static bundle serving from `GET /dist/widget.js`.

### widget-frontend

- Web component tag: `<chat-echo-widget>`.
- Calls `POST /echo` with fixed payload `{ "message": "Hello" }` when component loads.
- Creates a WebSocket connection to `/chat-echo` on component load.
- Chat input with:
  - Send button
  - `Ctrl+Enter` send shortcut
- Floating bottom-right panel with fixed dimensions and vertical scrollable message history.

### host-frontend

- `index.html` loads widget bundle from the backend (`http://localhost:8000/dist/widget.js`).
- Includes the widget tag on page.
- Includes a simple `app.js` for future host-level event handling.

## Run Instructions

### Quick Start (All Projects)

From the root directory, run:

```bash
./run-all.sh
```

This script will:
1. Build the widget frontend
2. Install backend dependencies
3. Start the backend server (port 8000)
4. Start the host frontend server (port 9000)

Then open:
- Widget with backend: `http://localhost:8000`
- Host frontend: `http://localhost:9000`

Press `Ctrl+C` to stop all servers.

### Manual Setup (Individual Projects)

#### 1) Build widget frontend and copy bundle to backend dist

```bash
cd widget-frontend
npm install
npm run build:backend
```

This creates `widget-frontend/dist/widget.js` and copies it to `widget-backend/dist/widget.js`.

### 2) Run widget-backend (FastAPI)

First, install dependencies (including dev tools):

```bash
cd widget-backend
uv sync --all-groups
```

Then start the server:

```bash
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

To run code checks:

```bash
uv run ruff check app/
```

Backend will be available at:

- `http://localhost:8000/`
- `http://localhost:8000/echo`
- `ws://localhost:8000/chat-echo`
- `http://localhost:8000/dist/widget.js`

### 3) Run host-frontend independently (to demonstrate CORS)

In a separate terminal from the backend:

```bash
cd host-frontend
uv run python -m http.server 9000
```

Open:

- `http://localhost:9000`

This confirms independent hosting:

- Host app origin: `http://localhost:9000`
- Widget/backend origin: `http://localhost:8000`

The widget should:

- show an HTTP echo response for `{ "message": "Hello" }`
- connect WebSocket automatically
- allow chat send with button or `Ctrl+Enter`

## Notes

- If you change widget frontend code, re-run `npm run build:backend`.
- If you use a different host port, add that origin in backend CORS settings in `widget-backend/app/main.py`.

