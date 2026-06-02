"""
Router: Estadísticas del sistema — métricas de uso, rendimiento y cobertura de campos.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.schemas import Document

router = APIRouter()

CATALOG_FIELDS = [
    "titulo", "subtitulo", "autores", "anio", "mes_dia", "editorial",
    "lugar", "tipo_doc", "edicion_vol", "palabras_clave", "resumen",
    "idioma", "paginas", "formato", "licencia",
]


@router.get("/", summary="Métricas globales del sistema")
async def get_stats(db: Session = Depends(get_db)):
    docs = db.query(Document).all()
    total = len(docs)

    if total == 0:
        return {
            "total": 0,
            "by_status": {},
            "by_tipo_doc": {},
            "by_idioma": {},
            "by_ocr_engine": {},
            "avg_ocr_confidence": None,
            "field_fill_rate": {},
            "avg_fields_per_doc": 0,
            "validated_count": 0,
        }

    # Por status
    by_status: dict = {}
    for d in docs:
        by_status[d.status] = by_status.get(d.status, 0) + 1

    # Por tipo_doc
    by_tipo: dict = {}
    for d in docs:
        k = d.tipo_doc or "Desconocido"
        by_tipo[k] = by_tipo.get(k, 0) + 1

    # Por idioma
    by_idioma: dict = {}
    for d in docs:
        k = d.idioma or "Desconocido"
        by_idioma[k] = by_idioma.get(k, 0) + 1

    # Por motor OCR
    by_engine: dict = {}
    for d in docs:
        k = d.ocr_engine or "desconocido"
        by_engine[k] = by_engine.get(k, 0) + 1

    # Confianza promedio OCR
    confidences = [d.ocr_confidence for d in docs if d.ocr_confidence is not None]
    avg_conf = round(sum(confidences) / len(confidences), 3) if confidences else None

    # Fill rate por campo (% de docs donde el campo tiene valor)
    fill_rate = {}
    for field in CATALOG_FIELDS:
        filled = sum(1 for d in docs if getattr(d, field, None) not in (None, "", "Pendiente", "Procesando..."))
        fill_rate[field] = round(filled / total * 100, 1)

    # Promedio de campos extraídos por documento
    def count_fields(doc):
        return sum(
            1 for f in CATALOG_FIELDS
            if getattr(doc, f, None) not in (None, "", "Pendiente", "Procesando...")
        )

    avg_fields = round(sum(count_fields(d) for d in docs) / total, 1)

    validated = sum(1 for d in docs if d.status == "validated")

    return {
        "total": total,
        "by_status": by_status,
        "by_tipo_doc": by_tipo,
        "by_idioma": by_idioma,
        "by_ocr_engine": by_engine,
        "avg_ocr_confidence": avg_conf,
        "field_fill_rate": fill_rate,
        "avg_fields_per_doc": avg_fields,
        "validated_count": validated,
    }
