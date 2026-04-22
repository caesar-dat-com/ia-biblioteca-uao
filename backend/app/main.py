"""
Agente de IA para Catalogacion Empresarial
Backend API - FastAPI
"""
from contextlib import asynccontextmanager
import sys
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Force UTF-8 on Windows
if sys.platform == 'win32':
    os.environ.setdefault('PYTHONIOENCODING', 'utf-8')
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

from fastapi.responses import FileResponse
from app.database import init_db
from app.routers import catalog, documents, enrich
from app.config import UPLOAD_DIR


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: crear BD y directorios."""
    init_db()
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    print("[OK] Base de datos inicializada")
    print(f"[OK] Directorio uploads: {UPLOAD_DIR}")
    yield
    print("[BYE] Apagando servidor...")


app = FastAPI(
    title="CatalogIA - Agente de Catalogacion",
    description="API para extraccion, enriquecimiento y clasificacion de metadatos documentales",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(catalog.router, prefix="/api/catalog", tags=["catalog"])
app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
app.include_router(enrich.router, prefix="/api/enrich", tags=["enrich"])


@app.get("/")
async def root():
    return {
        "message": "CatalogIA API",
        "version": "0.1.0",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/api/images/{filename}")
async def serve_image(filename: str):
    """Sirve una imagen subida desde el directorio uploads."""
    from pathlib import Path
    filepath = UPLOAD_DIR / filename
    if not filepath.exists():
        from fastapi import HTTPException
        raise HTTPException(404, "Imagen no encontrada")
    return FileResponse(str(filepath), media_type="image/jpeg")