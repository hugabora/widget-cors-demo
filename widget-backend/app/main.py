from pathlib import Path
from typing import Any, Dict

from fastapi import Body, FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

app: FastAPI = FastAPI(title="Widget Backend")

# Allow a separately hosted frontend to call this API and WebSocket endpoint.
allowed_origins: list[str] = [
    "http://localhost:9000",
    "http://127.0.0.1:9000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
allowed_origins_set: set[str] = set(allowed_origins)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root() -> Dict[str, str]:
    return {
        "service": "widget-backend",
        "status": "ok",
        "dist": "/dist/widget.js",
    }


@app.post("/echo")
async def echo(payload: Any = Body(...)) -> Any:
    return payload


@app.websocket("/chat-echo")
async def chat_echo(websocket: WebSocket) -> None:
    origin: str | None = websocket.headers.get("origin")
    if origin is None or origin not in allowed_origins_set:
        await websocket.close(code=1008, reason="Origin not allowed")
        return

    await websocket.accept()
    try:
        while True:
            message: str = await websocket.receive_text()
            await websocket.send_text(message)
    except WebSocketDisconnect:
        return


dist_dir: Path = Path(__file__).resolve().parent.parent / "dist"
dist_dir.mkdir(parents=True, exist_ok=True)
app.mount("/dist", StaticFiles(directory=dist_dir), name="dist")
