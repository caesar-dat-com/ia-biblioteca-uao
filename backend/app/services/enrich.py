"""
Enrichment Service - Busca metadatos online para completar campos faltantes.
Cascada: Google Books → Open Library → Crossref.
"""
import httpx
from typing import Optional

from app.config import GOOGLE_BOOKS_API_KEY, OPEN_LIBRARY_BASE_URL, CROSSREF_BASE_URL

# API endpoints
GOOGLE_BOOKS_API = "https://www.googleapis.com/books/v1/volumes"
OPEN_LIBRARY_API = "https://openlibrary.org/search.json"
CROSSREF_API = "https://api.crossref.org/works"

LANGUAGE_MAP = {
    "es": "Español", "en": "Inglés", "pt": "Portugués",
    "fr": "Francés", "de": "Alemán", "it": "Otro", "ja": "Otro",
    "zh": "Otro", "ru": "Otro", "ko": "Otro"
}


async def enrich_document(title: str, authors: str = "", isbn: str = "") -> dict:
    """
    Busca metadatos adicionales en fuentes online.
    Cascada: Google Books → Open Library → Crossref.
    Retorna dict con campos encontrados y su fuente.
    """
    results = {}
    sources_used = []
    
    # 1. Google Books (mejor para libros, buen respaldo general)
    gb_data = await _search_google_books(title, authors, isbn)
    if gb_data:
        results.update(gb_data)
        sources_used.append("google_books")
    
    # 2. Open Library (complementa lo que Google no tiene)
    ol_data = await _search_open_library(title, authors, isbn)
    if ol_data:
        for k, v in ol_data.items():
            # Solo llenar si Google Books no lo tenía
            if k not in results or not results[k]:
                results[k] = v
        if ol_data:
            sources_used.append("open_library")
    
    # 3. Crossref (mejor para papers académicos)
    cr_data = await _search_crossref(title, authors)
    if cr_data:
        for k, v in cr_data.items():
            if k not in results or not results[k]:
                results[k] = v
        sources_used.append("crossref")
    
    # Marcar fuentes
    results["_sources"] = sources_used
    
    return results


async def _search_google_books(title: str, authors: str, isbn: str) -> Optional[dict]:
    """Buscar en Google Books API (gratuita, sin key para pocas requests)."""
    query = ""
    if isbn:
        query = f"isbn:{isbn}"
    elif title:
        query = f'intitle:"{title}"'
        if authors:
            first_author = authors.split(";")[0].strip()
            query += f'+inauthor:"{first_author}"'
    
    if not query:
        return None
    
    try:
        params = {"q": query, "maxResults": 3}
        if GOOGLE_BOOKS_API_KEY:
            params["key"] = GOOGLE_BOOKS_API_KEY
        
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(GOOGLE_BOOKS_API, params=params)
            resp.raise_for_status()
            data = resp.json()
            
            if not data.get("items"):
                return None
            
            item = data["items"][0]
            info = item.get("volumeInfo", {})
            
            result = {}
            
            if info.get("title"):
                result["titulo"] = info["title"]
            if info.get("subtitle"):
                result["subtitulo"] = info["subtitle"]
            if info.get("authors"):
                result["autores"] = "; ".join(info["authors"])
            if info.get("publishedDate"):
                year_str = info["publishedDate"][:4]
                if year_str.isdigit():
                    result["anio"] = int(year_str)
            if info.get("publisher"):
                result["editorial"] = info["publisher"]
            if info.get("pageCount"):
                result["paginas"] = str(info["pageCount"])
            if info.get("language"):
                result["idioma"] = LANGUAGE_MAP.get(info["language"], info["language"])
            if info.get("description"):
                result["resumen"] = info["description"][:500]
            if info.get("categories"):
                result["palabras_clave"] = "; ".join(info["categories"][:5])
            if info.get("printType"):
                result["formato"] = "Impreso" if info["printType"] == "BOOK" else "Digital"
            
            # Links útiles
            result["_google_books_id"] = item.get("id")
            result["_preview_link"] = info.get("previewLink")
            
            return result
            
    except Exception as e:
        print(f"⚠️ Google Books error: {e}")
        return None


async def _search_open_library(title: str, authors: str, isbn: str) -> Optional[dict]:
    """Buscar en Open Library API (100% gratuita, sin key)."""
    params = {}
    if isbn:
        params["isbn"] = isbn
    elif title:
        params["title"] = title
        if authors:
            first_author = authors.split(";")[0].strip()
            params["author"] = first_author
    
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
            result = {}
            
            if doc.get("title"):
                result["titulo"] = doc["title"]
            if doc.get("author_name"):
                result["autores"] = "; ".join(doc["author_name"][:5])
            if doc.get("first_publish_year"):
                result["anio"] = doc["first_publish_year"]
            if doc.get("subject"):
                result["palabras_clave"] = "; ".join(doc["subject"][:5])
            if doc.get("number_of_pages_median"):
                result["paginas"] = str(doc["number_of_pages_median"])
            if doc.get("publisher"):
                pub = doc["publisher"]
                if isinstance(pub, list):
                    result["editorial"] = pub[0] if pub else None
                else:
                    result["editorial"] = pub
            if doc.get("language"):
                langs = doc["language"]
                if isinstance(langs, list):
                    result["idioma"] = LANGUAGE_MAP.get(langs[0], langs[0]) if langs else None
            
            result["_open_library_id"] = doc.get("key")
            
            return result
            
    except Exception as e:
        print(f"⚠️ Open Library error: {e}")
        return None


async def _search_crossref(title: str, authors: str) -> Optional[dict]:
    """Buscar en Crossref API (papers académicos, tesis, artículos)."""
    if not title:
        return None
    
    params = {"query.title": title, "rows": 3}
    if authors:
        first_author = authors.split(";")[0].strip()
        params["query.author"] = first_author
    
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(CROSSREF_API, params=params)
            resp.raise_for_status()
            data = resp.json()
            
            items = data.get("message", {}).get("items", [])
            if not items:
                return None
            
            item = items[0]
            result = {}
            
            if item.get("title"):
                titles = item["title"]
                result["titulo"] = titles[0] if isinstance(titles, list) else titles
            if item.get("author"):
                author_names = []
                for a in item["author"][:5]:
                    given = a.get("given", "")
                    family = a.get("family", "")
                    author_names.append(f"{family}, {given}".strip(", "))
                result["autores"] = "; ".join(author_names)
            if item.get("published-print"):
                date_parts = item["published-print"].get("date-parts", [[""]])
                if date_parts and date_parts[0]:
                    result["anio"] = date_parts[0][0] if len(date_parts[0]) > 0 else None
            elif item.get("published-online"):
                date_parts = item["published-online"].get("date-parts", [[""]])
                if date_parts and date_parts[0]:
                    result["anio"] = date_parts[0][0] if len(date_parts[0]) > 0 else None
            
            if item.get("type"):
                result["tipo_doc"] = _map_crossref_type(item["type"])
            if item.get("abstract"):
                result["resumen"] = item["abstract"][:500]
            if item.get("page"):
                result["paginas"] = item["page"]
            if item.get("DOI"):
                result["_doi"] = item["DOI"]
            if item.get("publisher"):
                result["editorial"] = item["publisher"]
            if item.get("container-title"):
                containers = item["container-title"]
                result["lugar"] = containers[0] if isinstance(containers, list) and containers else None
            
            return result
            
    except Exception as e:
        print(f"⚠️ Crossref error: {e}")
        return None


def _map_crossref_type(crossref_type: str) -> str:
    """Mapear tipos de Crossref a nuestros tipos de documento."""
    mapping = {
        "journal-article": "Artículo",
        "book": "Libro",
        "book-chapter": "Libro",
        "proceedings-article": "Artículo",
        "proceedings": "Artículo",
        "dissertation": "Tesis",
        "thesis": "Tesis",
        "report": "Informe",
        "standard": "Norma",
        "patent": "Patente",
        "reference-entry": "Otro",
        "monograph": "Libro",
        "edited-book": "Libro",
    }
    return mapping.get(crossref_type, "Otro")