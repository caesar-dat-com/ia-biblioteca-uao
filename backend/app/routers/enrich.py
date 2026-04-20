"""
Router: Enrich — Búsqueda manual de metadatos online.
Endpoints para buscar y enriquecer documentos existentes.
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.schemas import Document, DocumentResponse
from app.services.enrich import enrich_document

router = APIRouter()


@router.get("/search", summary="Buscar metadatos online")
async def search_metadata(
    title: str = "",
    authors: str = "",
    isbn: str = ""
):
    """
    Busca metadatos en Google Books, Open Library y Crossref.
    Útil para enriquecer manualmente o verificar datos.
    """
    if not title and not authors and not isbn:
        raise HTTPException(400, "Debe proporcionar al menos título, autor o ISBN")
    
    results = await enrich_document(title=title, authors=authors, isbn=isbn)
    return {"status": "success", "data": results}


@router.get("/isbn/{isbn}", summary="Buscar por ISBN")
async def search_by_isbn(isbn: str):
    """Búsqueda directa por ISBN en Google Books."""
    from app.services.enrich import _search_google_books
    result = await _search_google_books(title="", authors="", isbn=isbn)
    if not result:
        raise HTTPException(404, f"ISBN {isbn} no encontrado")
    return {"status": "success", "data": result}


@router.post("/{doc_id}", summary="Enriquecer documento existente")
async def enrich_existing_document(
    doc_id: str,
    db: Session = Depends(get_db)
):
    """
    Ejecuta enriquecimiento online sobre un documento ya existente.
    Solo completa campos que están vacíos o con baja confianza.
    """
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(404, "Documento no encontrado")
    
    title = doc.titulo or ""
    authors = doc.autores or ""
    
    if not title:
        raise HTTPException(400, "El documento necesita al menos un título para enriquecer")
    
    enrich_data = await enrich_document(title=title, authors=authors)
    
    # Solo llenar campos vacíos
    fields_updated = []
    enrich_fields = [
        "titulo", "subtitulo", "autores", "anio", "mes_dia", "editorial",
        "lugar", "tipo_doc", "edicion_vol", "palabras_clave", "resumen",
        "idioma", "paginas", "formato", "licencia"
    ]
    
    for field in enrich_fields:
        current_val = getattr(doc, field, None)
        enrich_val = enrich_data.get(field)
        if (not current_val or current_val == "Pendiente") and enrich_val:
            setattr(doc, field, enrich_val)
            fields_updated.append(field)
    
    doc.enriched_from = (doc.enriched_from or []) + enrich_data.get("_sources", [])
    db.commit()
    db.refresh(doc)
    
    return {
        "status": "enriched",
        "fields_updated": fields_updated,
        "data": DocumentResponse.model_validate(doc).model_dump()
    }