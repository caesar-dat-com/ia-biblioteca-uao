"""
Modelos de datos — SQLAlchemy ORM + Pydantic schemas.
16 campos de catalogación + campos de sistema.
"""
import uuid
from datetime import datetime
from typing import Optional, List

from sqlalchemy import Column, String, Integer, Text, DateTime, JSON, Float
from sqlalchemy.orm import DeclarativeBase

from app.database import Base


class Document(Base):
    """Modelo ORM para documentos catalogados."""
    __tablename__ = "documents"

    # ID interno — UUID auto-generado
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # === 16 campos de catalogación ===
    parte_no = Column(String(100), nullable=True, comment="ID (Parte No.) — identificador único")
    titulo = Column(String(500), nullable=True, default="Pendiente", comment="Título")
    subtitulo = Column(String(500), nullable=True, comment="Subtítulo")
    autores = Column(Text, nullable=True, comment="Autor(es) separados por ;")
    anio = Column(Integer, nullable=True, comment="Año de publicación")
    mes_dia = Column(String(50), nullable=True, comment="Mes/Día")
    editorial = Column(String(300), nullable=True, comment="Editorial")
    lugar = Column(String(200), nullable=True, comment="Ciudad/país de publicación")
    tipo_doc = Column(String(50), nullable=True, comment="Tipo de documento")
    edicion_vol = Column(String(100), nullable=True, comment="Edición/Vol.")
    palabras_clave = Column(Text, nullable=True, comment="Palabras clave separadas por ;")
    resumen = Column(Text, nullable=True, comment="Resumen/abstract")
    idioma = Column(String(50), nullable=True, comment="Idioma")
    paginas = Column(String(50), nullable=True, comment="Número de páginas o rango")
    formato = Column(String(50), nullable=True, comment="Formato")
    licencia = Column(String(100), nullable=True, comment="Tipo de licencia")

    # === Campos de sistema ===
    status = Column(String(20), default="uploaded", nullable=False, 
                   comment="Estado: uploaded/extracting/extracted/enriching/enriched/validating/validated/rejected")
    ocr_text = Column(Text, nullable=True, comment="Texto crudo del OCR")
    ocr_engine = Column(String(20), nullable=True, comment="Motor OCR: paddleocr/tesseract")
    ocr_confidence = Column(Float, nullable=True, comment="Confianza promedio del OCR")
    confidence = Column(JSON, nullable=True, comment="Confianza por campo: {campo: 0.0-1.0}")
    source_image = Column(String(500), nullable=True, comment="Path de la imagen subida")
    extraction_method = Column(String(30), nullable=True, comment="Método: llm_cloud/llm_local/rules")
    enriched_from = Column(JSON, nullable=True, comment="Fuentes: [google_books, open_library, crossref]")
    validated_by = Column(String(100), nullable=True, comment="Quién validó")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# === Pydantic Schemas (para API) ===

from pydantic import BaseModel, Field


class DocumentUpload(BaseModel):
    """Schema para respuesta del upload + extracción."""
    id: str
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
    status: str = "uploaded"
    ocr_text: Optional[str] = None
    ocr_engine: Optional[str] = None
    ocr_confidence: Optional[float] = None
    confidence: Optional[dict] = None
    enriched_from: Optional[list] = None


class DocumentUpdate(BaseModel):
    """Schema para actualizar campos (validación humana)."""
    parte_no: Optional[str] = None
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
    validated_by: Optional[str] = None


class DocumentResponse(BaseModel):
    """Schema de respuesta completa."""
    id: str
    parte_no: Optional[str] = None
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
    status: str
    ocr_text: Optional[str] = None
    ocr_engine: Optional[str] = None
    ocr_confidence: Optional[float] = None
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


class StatsResponse(BaseModel):
    """Estadísticas del sistema."""
    total_documents: int
    by_status: dict
    by_type: dict
    avg_confidence: Optional[float] = None