"""Enrichment Service - Busca metadatos online para completar campos faltantes"""
import httpx
import asyncio
from typing import Optional

# APIs gratuitas para enriquecimiento
GOOGLE_BOOKS_API = "https://www.googleapis.com/books/v1/volumes"
OPEN_LIBRARY_API = "https://openlibrary.org/search.json"
CROSSREF_API = "https://api.crossref.org/works"


async def enrich_document(title: str, authors: str = "", isbn: str = "") -> dict:
    """
    Busca metadatos adicionales en fuentes online.
    Retorna dict con campos encontrados y su fuente.
    """
    results = {}
    
    # 1. Google Books (mejor para libros)
    gb_data = await _search_google_books(title, authors, isbn)
    if gb_data:
        results.update(gb_data)
    
    # 2. Open Library (complementa Google Books)
    ol_data = await _search_open_library(title, authors, isbn)
    if ol_data:
        for k, v in ol_data.items():
            if k not in results or not results[k]:
                results[k] = v
    
    # 3. Crossref (mejor para papers académicos)
    if not results.get("tipo_doc") or results.get("tipo_doc") in ["Artículo", "Tesis"]:
        cr_data = await _search_crossref(title, authors)
        if cr_data:
            for k, v in cr_data.items():
                if k not in results or not results[k]:
                    results[k] = v
    
    # Marcar fuente de cada campo
    results["_sources"] = {
        "google_books": bool(gb_data),
        "open_library": bool(ol_data),
        "crossref": bool(cr_data)
    }
    
    return results


async def _search_google_books(title: str, authors: str, isbn: str) -> Optional[dict]:
    """Buscar en Google Books API"""
    query = ""
    if isbn:
        query = f"isbn:{isbn}"
    elif title:
        query = f'intitle:"{title}"'
        if authors:
            query += f'+inauthor:"{authors}"'
    
    if not query:
        return None
    
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(GOOGLE_BOOKS_API, params={"q": query, "maxResults": 3})
            resp.raise_for_status()
            data = resp.json()
            
            if not data.get("items"):
                return None
            
            item = data["items"][0]
            info = item.get("volumeInfo", {})
            
            return {
                "titulo": info.get("title"),
                "subtitulo": info.get("subtitle"),
                "autores": "; ".join(info.get("authors", [])),
                "anio": info.get("publishedDate", "")[:4] if info.get("publishedDate") else None,
                "editorial": info.get("publisher"),
                "paginas": str(info.get("pageCount", "")) if info.get("pageCount") else None,
                "idioma": {"es": "Español", "en": "Inglés", "pt": "Portugués", "fr": "Francés", "de": "Alemán"}.get(info.get("language", ""), info.get("language")),
                "resumen": info.get("description"),
                "palabras_clave": "; ".join(info.get("categories", [])),
                "formato": "Digital" if info.get("readingModes", {}).get("text") else "Impreso",
                "_google_books_id": item.get("id"),
                "_preview_link": info.get("previewLink"),
            }
    except Exception:
        return None


async def _search_open_library(title: str, authors: str, isbn: str) -> Optional[dict]:
    """Buscar en Open Library API"""
    params = {}
    if isbn:
        params["isbn"] = isbn
    elif title:
        params["title"] = title
        if authors:
            params["author"] = authors
    
    if not params:
        return None
    
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(OPEN_LIBRARY_API, params={**params, "limit": 3})
            resp.raise_for_status()
            data = resp.json()
            
            if not data.get("docs"):
                return None
            
            doc = data["docs"][0]
            
            return {
                "titulo": doc.get("title"),
                "autores": "; ".join(doc.get("author_name", [])),
                "anio": str(doc.get("first_publish_year", "")) if doc.get("first_publish_year") else None,
                "palabras_clave": "; ".join(doc.get("subject", [])[:5]),
                "idioma": doc.get("language", [""])[0] if doc.get("language") else None,
                "paginas": str(doc.get("number_of_pages_median", "")) if doc.get("number_of_pages_median") else None,
                "_open_library_id": doc.get("key"),
            }
    except Exception:
        return None


async def _search_crossref(title: str, authors: str) -> Optional[dict]:
    """Buscar en Crossref API (papers académicos)"""
    if not title:
        return None
    
    params = {"query.title": title, "rows": 3}
    if authors:
        params["query.author"] = authors
    
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(CROSSREF_API, params=params)
            resp.raise_for_status()
            data = resp.json()
            
            items = data.get("message", {}).get("items", [])
            if not items:
                return None
            
            item = items[0]
            
            return {
                "titulo": item.get("title", [""])[0],
                "autores": "; ".join([a.get("given", "") + " " + a.get("family", "") for a in item.get("author", [])]),
                "anio": item.get("published-print", {}).get("date-parts", [[""]])[0][0] if item.get("published-print") else None,
                "tipo_doc": _map_crossref_type(item.get("type", "")),
                "resumen": item.get("abstract", ""),
                "idioma": item.get("language"),
                "paginas": item.get("page"),
                "_doi": item.get("DOI"),
            }
    except Exception:
        return None


def _map_crossref_type(crossref_type: str) -> str:
    """Mapear tipos de Crossref a nuestros tipos"""
    mapping = {
        "journal-article": "Artículo",
        "book": "Libro",
        "book-chapter": "Libro",
        "proceedings-article": "Artículo",
        "dissertation": "Tesis",
        "report": "Informe",
        "standard": "Norma",
    }
    return mapping.get(crossref_type, "Otro")