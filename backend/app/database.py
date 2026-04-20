"""Database setup - SQLite with aiograph"""
import aiosqlite
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "catalog.db")

SCHEMA = """
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    titulo TEXT NOT NULL,
    subtitulo TEXT,
    autores TEXT,
    anio INTEGER,
    mes_dia TEXT,
    editorial TEXT,
    lugar TEXT,
    tipo_doc TEXT,
    edicion_vol TEXT,
    palabras_clave TEXT,
    resumen TEXT,
    idioma TEXT,
    paginas TEXT,
    formato TEXT,
    licencia TEXT,
    imagen_portada TEXT,
    confianza_extraccion REAL DEFAULT 0.0,
    validado BOOLEAN DEFAULT FALSE,
    ubicacion TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS extraction_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id TEXT NOT NULL,
    campo TEXT NOT NULL,
    valor_extraido TEXT,
    valor_corregido TEXT,
    fuente TEXT,
    confianza REAL,
    FOREIGN KEY (document_id) REFERENCES documents(id)
);
"""


async def get_db():
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    return db


async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.executescript(SCHEMA)
        await db.commit()