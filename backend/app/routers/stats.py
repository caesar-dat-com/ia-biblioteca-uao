"""
Router: Estadísticas del sistema — métricas de uso, rendimiento y cobertura de campos.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

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
            "by_status": {}, "by_tipo_doc": {}, "by_idioma": {},
            "by_ocr_engine": {}, "by_enrichment_source": {},
            "avg_ocr_confidence": None, "field_fill_rate": {},
            "avg_fields_per_doc": 0, "validated_count": 0,
            "confidence_distribution": {}, "source_breakdown": {},
            "top_keywords": [],
        }

    # ── Agrupaciones básicas ──
    by_status: dict = {}
    by_tipo: dict = {}
    by_idioma: dict = {}
    by_engine: dict = {}
    by_enrich: dict = {}

    for d in docs:
        by_status[d.status] = by_status.get(d.status, 0) + 1
        by_tipo[d.tipo_doc or "Desconocido"] = by_tipo.get(d.tipo_doc or "Desconocido", 0) + 1
        by_idioma[d.idioma or "Desconocido"] = by_idioma.get(d.idioma or "Desconocido", 0) + 1
        by_engine[d.ocr_engine or "desconocido"] = by_engine.get(d.ocr_engine or "desconocido", 0) + 1

        # Fuentes de enriquecimiento
        for src in (d.enriched_from or []):
            by_enrich[src] = by_enrich.get(src, 0) + 1

    # ── Confianza promedio ──
    confidences = [d.ocr_confidence for d in docs if d.ocr_confidence is not None]
    avg_conf = round(sum(confidences) / len(confidences), 3) if confidences else None

    # ── Distribución de confianza (histograma 4 buckets) ──
    conf_dist = {"0-25%": 0, "25-50%": 0, "50-75%": 0, "75-100%": 0}
    for c in confidences:
        pct = c * 100
        if pct < 25:
            conf_dist["0-25%"] += 1
        elif pct < 50:
            conf_dist["25-50%"] += 1
        elif pct < 75:
            conf_dist["50-75%"] += 1
        else:
            conf_dist["75-100%"] += 1

    # ── Fill rate por campo ──
    fill_rate = {}
    for field in CATALOG_FIELDS:
        filled = sum(1 for d in docs if getattr(d, field, None) not in (None, "", "Pendiente", "Procesando..."))
        fill_rate[field] = round(filled / total * 100, 1)

    # ── Campos de fuente: OCR+IA vs enriquecimiento ──
    ocr_ia_fields = 0
    enrich_fields = 0
    for d in docs:
        has_enrich = bool(d.enriched_from)
        for field in CATALOG_FIELDS:
            val = getattr(d, field, None)
            if val not in (None, "", "Pendiente", "Procesando..."):
                if has_enrich and field in ["resumen", "paginas", "lugar"]:
                    enrich_fields += 1
                else:
                    ocr_ia_fields += 1
    total_fields = ocr_ia_fields + enrich_fields
    source_breakdown = {
        "OCR+IA": round(ocr_ia_fields / total_fields * 100, 1) if total_fields else 0,
        "Enriquecimiento": round(enrich_fields / total_fields * 100, 1) if total_fields else 0,
    }

    # ── Promedio campos por doc ──
    def count_fields(doc):
        return sum(1 for f in CATALOG_FIELDS if getattr(doc, f, None) not in (None, "", "Pendiente", "Procesando..."))

    avg_fields = round(sum(count_fields(d) for d in docs) / total, 1)
    validated = sum(1 for d in docs if d.status == "validated")

    # ── Top keywords ──
    kw_count: dict = {}
    for d in docs:
        if d.palabras_clave:
            for kw in d.palabras_clave.split(";"):
                kw = kw.strip().lower()
                if kw and len(kw) > 2:
                    kw_count[kw] = kw_count.get(kw, 0) + 1
    top_keywords = sorted(kw_count.items(), key=lambda x: x[1], reverse=True)[:12]

    return {
        "total": total,
        "by_status": by_status,
        "by_tipo_doc": by_tipo,
        "by_idioma": by_idioma,
        "by_ocr_engine": by_engine,
        "by_enrichment_source": by_enrich,
        "avg_ocr_confidence": avg_conf,
        "field_fill_rate": fill_rate,
        "avg_fields_per_doc": avg_fields,
        "validated_count": validated,
        "confidence_distribution": conf_dist,
        "source_breakdown": source_breakdown,
        "top_keywords": [{"kw": k, "count": v} for k, v in top_keywords],
    }
