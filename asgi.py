"""Vercel ASGI entrypoint for the Kçiq DMA panel."""
from __future__ import annotations

import os
import sys
from pathlib import Path

_BACKEND = Path(__file__).resolve().parent / "app" / "backend"
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

# SQLite needs a writable path on Vercel's ephemeral filesystem.
if os.environ.get("VERCEL"):
    os.environ.setdefault("KCIQ_DB", "/tmp/kciq.db")

import main as backend_main  # noqa: E402

app = backend_main.app
