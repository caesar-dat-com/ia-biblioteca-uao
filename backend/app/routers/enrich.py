"""Router: Enrich - Búsqueda manual de metadatos online"""
from fastapi import APIRouter, HTTPException
from app.services.enrich import enrich_document

router = APIRouter()


@router.get("/search", summary="Buscar metadatos online")
async def search_metadata(title: str = "", authors: str = "", isbn: str = ""):
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
    """Búsqueda directa por ISBN en Google Books"""
    from app.services.enrich import _search_google_books
    result = await _search_google_books(title="", authors="", isbn=isbn)
    if not result:
        raise HTTPException(404, f"ISBN {isbn} no encontrado")
    return {"status": "success", "data": result}