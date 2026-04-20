"""
Modelos de datos — SQLAlchemy ORM + Pydantic schemas.
16 campos de catalogación + campos de sistema.
"""
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Column, String, Integer, Text, DateTime, JSON
from sqlalchemy.sql import func

from app.database import Base


class Document(Base):
    """Modelo ORM para documentos catalogados."""
    __tablename__ = "documents"

    # ID interno
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # === 16 campos de catalogación ===
    parte_no = Column(String(50), nullable=True, comment="ID (Parte No.)")
    titulo = Column(String(500), nullable=False, comment="Título")
    subtitulo = Column(String(500), nullable=True, comment="Subtítulo")
    autores = Column(Text, nullable=True, comment="Autor(es) separados por ;")
    anio = Column(Integer, nullable=True, comment="Año de publicación")
    mes_dia = Column(String(50), nullable=True, comment="Mes/Día")
    editorial = Column(String(300), nullable=True, comment="Editorial")
    lugar = Column(String(200), nullable=True, comment="Ciudad/país")
    tipo_doc = Column(String(50), nullable=True, comment="Tipo de documento")
    edicion_vol = Column(String(100), nullable=True, comment="Edición/Vol.")
    palabras_clave = Column(Text, nullable=True, comment="Palabras clave separadas por ;")
    resumen = Column(Text, nullable=True, comment="Resumen/abstract")
    idioma = Column(String(50), nullable=True, comment="Idioma")
    paginas = Column(String(50), nullable=True, comment="Número de páginas o rango")
    formato = Column(String(50), nullable=True, comment="Formato")
    licencia = Column(String(100), nullable=True, comment="Tipo de licencia")

    # === Campos de sistema ===
    status = Column(String(20), default="uploaded", nullable=False)
    ocr_text = Column(Text, nullable=True, comment="Texto crudo del OCR")
    ocr_engine = Column(String(20), nullable=True, comment="Motor OCR usado")
    confidence = Column(JSON, nullable=True, comment="Confianza por campo")
    source_image = Column(String(500), nullable=True, comment="Path de la imagen")
    extraction_method = Column(String(30), nullable=True, comment="Método de extracción LLM")
    enriched_from = Column(JSON, nullable=True, comment="Fuentes de enriquecimiento")
    validated_by = Column(String(100), nullable=True, comment="Quién validó")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


# === Pydantic Schemas ===

from pydantic import BaseModel, Field
from typing import Optional


class DocumentCreate(BaseModel):
    """Schema para crear un documento (desde upload)."""
    titulo: str = "Pendiente de extracción"
    parte_no: Optional[str] = None
    subtitulo: Optional[str] = None
    autores: Optional[str] = None
    anio: Optional[int] = None
    mes_dia: Optional[str] = None
    editorial: Optional[str] = None
    lugar: Optional[str] = None
    tipo_doc: Optional[str] = None
    edicion_vol: Optional[str] = None
    palabras_clave: Optional[str] = None
    resumen: Optional[str] = None
    idioma: Optional[str] = None
    paginas: Optional[str] = None
    formato: Optional[str] = None
    licencia: Optional[str] = None


class DocumentUpdate(BaseModel):
    """Schema para actualizar campos (validación humana)."""
    titulo: Optional[str] = None
    parte_no: Optional[str] = None
    subtitulo: Optional[str] = None
    autores: Optional[str] = None
    anio: Optional[int] = None
    mes_dia: Optional[str] = None
    editorial: Optional[str] = None
    lugar: Optional[str] = None
    tipo_doc: Optional[str] = None
    edicion_vol: Optional[str] = None
    palabras_clave: Optional[str] = None
    resumen: Optional[str] = None
    idioma: Optional[str] = None
    paginas: Optional[str] = None
    formato: Optional[str] = None
    licencia: Optional[str] = None
    status: Optional[str] = None
    validated_by: Optional[str] = None


class DocumentResponse(BaseModel):
    """Schema de respuesta completa."""
    id: str
    parte_no: Optional[str]
    titulo: str
    subtitulo: Optional[str]
    autores: Optional[str]
    anio: Optional[int]
    mes_dia: Optional[str]
    editorial: Optional[str]
    lugar: Optional[str]
    tipo_doc: Optional[str]
    edicion_vol: Optional[str]
    palabras_clave: Optional[str]
    resumen: Optional[str]
    idioma: Optional[str]
    paginas: Optional[str]
    formato: Optional[str]
    licencia: Optional[str]
    status: str
    ocr_text: Optional[str] = None
    ocr_engine: Optional[str] = None
    confidence: Optional[dict] = None
    source_image: Optional[str] = None
    extraction_method: Optional[str] = None
    enriched_from: Optional[list] = None
    validated_by: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ExtractionResult(BaseModel):
    """Resultado de la extracción LLM."""
    titulo: Optional[str] = None
    subtitulo: Optional[str] = None
    autores: Optional[str] = None
    anio: Optional[int] = None
    mes_dia: Optional[str] = None
    editorial: Optional[str] = None
    lugar: Optional[str] = None
    tipo_doc: Optional[str] = None
    edicion_vol: Optional[str] = None
    palabras_clave: Optional[str] = None
    resumen: Optional[str] = None
    idioma: Optional[str] = None
    paginas: Optional[str] = None
    formato: Optional[str] = None
    licencia: Optional[str] = None


class EnrichmentResult(BaseModel):
    """Resultado del enriquecimiento desde APIs externas."""
    source: str  # google_books, open_library, crossref
    fields_updated: list[str]
    data: dict