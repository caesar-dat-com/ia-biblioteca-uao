"""IA Extraction Service - Usa modelo local (Ollama) para extraer campos estructurados del OCR"""
import httpx
import json
import os

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:7b-instruct")

EXTRACTION_PROMPT = """Eres un asistente especializado en catalogación bibliográfica. A partir del texto OCR de una portada de documento, extrae los siguientes campos en formato JSON.

CAMPOS A EXTRAER:
- titulo: Título principal del documento
- subtitulo: Subtítulo si existe
- autores: Lista de autores separados por punto y coma
- anio: Año de publicación (número)
- mes_dia: Mes y/o día si aparece
- editorial: Editorial o institución editora
- lugar: Ciudad/país de publicación
- tipo_doc: Tipo de documento (Libro, Artículo, Tesis, Informe, Manual, Norma, Patente, Otro)
- edicion_vol: Edición o volumen si aparece
- palabras_clave: Palabras clave separadas por punto y coma
- idioma: Idioma principal del documento
- paginas: Número de páginas o rango
- formato: Formato (PDF, Impreso, Digital, etc.)
- licencia: Tipo de licencia si aparece

TEXTO OCR DE LA PORTADA:
```
{ocr_text}
```

Responde SOLO con JSON válido. Si un campo no se puede determinar, déjalo como null. Ejemplo:
{{"titulo": "...", "subtitulo": null, "autores": "Autor1; Autor2", ...}}"""


async def extract_fields_from_ocr(ocr_text: str, confidence: float = 0.0) -> dict:
    """
    Usa Ollama para extraer campos estructurados del texto OCR.
    Retorna dict con campos extraídos y confianza por campo.
    """
    prompt = EXTRACTION_PROMPT.format(ocr_text=ocr_text)
    
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                f"{OLLAMA_URL}/api/generate",
                json={
                    "model": OLLAMA_MODEL,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.1,
                        "num_predict": 1024
                    }
                }
            )
            resp.raise_for_status()
            data = resp.json()
            response_text = data.get("response", "")
            
            # Parsear JSON de la respuesta
            result = _parse_json_response(response_text)
            
            # Calcular confianza por campo
            for key, value in result.items():
                if value is not None and value != "" and value != []:
                    result[f"{key}_confianza"] = min(confidence + 0.1, 1.0)
                else:
                    result[f"{key}_confianza"] = 0.0
            
            return result
            
    except httpx.ConnectError:
        # Ollama no disponible - retornar campos vacíos
        return {
            "titulo": None, "subtitulo": None, "autores": None,
            "anio": None, "mes_dia": None, "editorial": None,
            "lugar": None, "tipo_doc": None, "edicion_vol": None,
            "palabras_clave": None, "resumen": None, "idioma": None,
            "paginas": None, "formato": None, "licencia": None,
            "_error": "Ollama no disponible - solo OCR disponible"
        }
    except Exception as e:
        return {"_error": str(e)}


def _parse_json_response(text: str) -> dict:
    """Extraer JSON de la respuesta del modelo"""
    # Buscar JSON en la respuesta
    import re
    json_match = re.search(r'\{[\s\S]*\}', text)
    if json_match:
        try:
            return json.loads(json_match.group())
        except json.JSONDecodeError:
            pass
    
    # Si no se encontró JSON válido
    return {
        "titulo": None, "subtitulo": None, "autores": None,
        "anio": None, "mes_dia": None, "editorial": None,
        "lugar": None, "tipo_doc": None, "edicion_vol": None,
        "palabras_clave": None, "resumen": None, "idioma": None,
        "paginas": None, "formato": None, "licencia": None,
        "_error": "No se pudo parsear respuesta del modelo"
    }


async def classify_document(fields: dict) -> str:
    """Clasificar documento según tipo y contenido"""
    tipo = fields.get("tipo_doc", "").lower() if fields.get("tipo_doc") else ""
    
    # Clasificación simple basada en tipo
    classification_map = {
        "libro": "A. Libros y Monografías",
        "artículo": "B. Artículos y Papers",
        "articulo": "B. Artículos y Papers",
        "tesis": "C. Tesis y Trabajos de Grado",
        "informe": "D. Informes Técnicos",
        "manual": "E. Manuales y Guías",
        "norma": "F. Normas y Regulaciones",
        "patente": "G. Patentes",
    }
    
    if tipo in classification_map:
        return classification_map[tipo]
    
    # Si no hay tipo, inferir por contenido
    titulo = (fields.get("titulo") or "").lower()
    resumen = (fields.get("resumen") or "").lower()
    combined = f"{titulo} {resumen}"
    
    if any(w in combined for w in ["thesis", "tesis", "grado", "maestría", "doctorado"]):
        return "C. Tesis y Trabajos de Grado"
    elif any(w in combined for w in ["journal", "revista", "proceedings", "congress"]):
        return "B. Artículos y Papers"
    elif any(w in combined for w in ["manual", "guía", "guide", "handbook"]):
        return "E. Manuales y Guías"
    elif any(w in combined for w in ["norma", "standard", "iso", "regulation"]):
        return "F. Normas y Regulaciones"
    
    return "A. Libros y Monografías"  # Default