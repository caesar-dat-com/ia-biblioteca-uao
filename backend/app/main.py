"""
Agente de IA para Catalogación Empresarial
Backend API - FastAPI
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import catalog, documents, enrich

app = FastAPI(
    title="Agente IA Catalogación",
    description="API para extracción, enriquecimiento y clasificación de metadatos documentales",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(catalog.router, prefix="/api/catalog", tags=["catalog"])
app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
app.include_router(enrich.router, prefix="/api/enrich", tags=["enrich"])


@app.get("/")
async def root():
    return {"message": "Agente IA Catalogación API", "version": "0.1.0"}


@app.get("/health")
async def health():
    return {"status": "ok"}