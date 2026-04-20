"""
IA Extraction Service - Usa LLM (Ollama cloud/local) para extraer campos
estructurados del texto OCR y clasificar el documento.
"""
import httpx
import json
import re
import os

from app.config import OLLAMA_BASE_URL, LLM_MODEL, LLM_FALLBACK_MODEL

EXTRACTION_PROMPT = """Eres un asistente especializado en catalogación bibliográfica y documental. A partir del texto OCR de una portada de documento, extrae los siguientes campos en formato JSON.

CAMPOS A EXTRAER:
- titulo: Título principal del documento
- subtitulo: Subtítulo si existe
- autores: Lista de autores separados por punto y coma (ej: "García Márquez, Gabriel; Vargas Llosa, Mario")
- anio: Año de publicación (número entero)
- mes_dia: Mes y/o día si aparece (ej: "Marzo" o "15 de mayo")
- editorial: Editorial o institución editora
- lugar: Ciudad/país de publicación
- tipo_doc: Tipo de documento — debe ser EXACTAMENTE uno de: Libro, Artículo, Tesis, Informe, Manual, Norma, Patente, Otro
- edicion_vol: Edición o volumen si aparece (ej: "3a ed." o "Vol. 2")
- palabras_clave: Palabras clave separadas por punto y coma
- idioma: Idioma principal — debe ser EXACTAMENTE uno de: Español, Inglés, Portugués, Francés, Alemán, Otro
- paginas: Número de páginas o rango (ej: "350" o "1-250")
- formato: Formato — debe ser EXACTAMENTE uno de: PDF, Impreso, Digital, HTML, Otro
- licencia: Tipo de licencia si aparece — uno de: CC BY, CC BY-SA, CC BY-NC, CC BY-ND, CC BY-NC-SA, CC BY-NC-ND, Propietaria, Dominio público, Otro

TEXTO OCR DE LA PORTADA:
```
{ocr_text}
```

REGLAS:
1. Responde SOLO con JSON válido, sin texto antes ni después.
2. Si un campo no se puede determinar, pon null.
3. No inventes información que no esté en el texto.
4. Para tipo_doc, infiere según el contenido: si parece tesis pon "Tesis", si es libro "Libro", etc.
5. Para idioma, si el texto está en español pon "Español".

Ejemplo de formato de respuesta:
{{"titulo": "Introducción a la IA", "subtitulo": "Fundamentos y aplicaciones", "autores": "Russell, Stuart; Norvig, Peter", "anio": 2020, "mes_dia": null, "editorial": "Pearson", "lugar": "Madrid", "tipo_doc": "Libro", "edicion_vol": "4a ed.", "palabras_clave": "inteligencia artificial; machine learning; deep learning", "idioma": "Español", "paginas": "1132", "formato": "Impreso", "licencia": "Propietaria"}}"""


async def extract_fields_from_ocr(ocr_text: str, ocr_confidence: float = 0.0) -> dict:
    """
    Usa LLM (Ollama) para extraer campos estructurados del texto OCR.
    Retorna dict con campos extraídos y confianza por campo.
    Intenta modelo principal, fallback si falla.
    """
    prompt = EXTRACTION_PROMPT.format(ocr_text=ocr_text)
    
    # Intentar con modelo principal
    result = await _call_llm(LLM_MODEL, prompt)
    
    if result.get("_error") and LLM_FALLBACK_MODEL != LLM_MODEL:
        print(f"⚠️ Modelo principal falló, intentando fallback: {LLM_FALLBACK_MODEL}")
        result = await _call_llm(LLM_FALLBACK_MODEL, prompt)
    
    # Calcular confianza por campo basándose en OCR + si el LLM pudo extraer
    confidence = {}
    base_conf = min(ocr_confidence + 0.1, 1.0)  # Boost de 0.1 por el LLM
    
    for field in ["titulo", "subtitulo", "autores", "anio", "mes_dia", "editorial",
                   "lugar", "tipo_doc", "edicion_vol", "palabras_clave", "resumen",
                   "idioma", "paginas", "formato", "licencia"]:
        if result.get(field) is not None and result.get(field) != "":
            confidence[field] = round(base_conf, 2)
        else:
            confidence[field] = 0.0
    
    result["confidence"] = confidence
    return result


async def _call_llm(model: str, prompt: str) -> dict:
    """Llama a un modelo LLM via Ollama API y parsea la respuesta JSON."""
    try:
        async with httpx.AsyncClient(timeout=90.0) as client:
            resp = await client.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.1,
                        "num_predict": 2048
                    }
                }
            )
            resp.raise_for_status()
            data = resp.json()
            response_text = data.get("response", "")
            
            return _parse_json_response(response_text)
            
    except httpx.ConnectError:
        return _empty_result("Ollama no disponible — no se pudo conectar al servicio")
    except httpx.TimeoutException:
        return _empty_result(f"Timeout al conectar con Ollama (modelo: {model})")
    except Exception as e:
        return _empty_result(f"Error: {str(e)}")


def _parse_json_response(text: str) -> dict:
    """Extraer JSON de la respuesta del modelo. Robusto a formato irregular."""
    # Buscar bloque JSON en la respuesta
    json_match = re.search(r'\{[\s\S]*\}', text)
    if json_match:
        try:
            parsed = json.loads(json_match.group())
            # Limpiar campos _error si existen
            parsed.pop("_error", None)
            return parsed
        except json.JSONDecodeError:
            pass
    
    # Segundo intento: buscar entre ```json y ```
    code_match = re.search(r'```(?:json)?\s*(\{[\s\S]*?\})\s*```', text)
    if code_match:
        try:
            return json.loads(code_match.group(1))
        except json.JSONDecodeError:
            pass
    
    return _empty_result("No se pudo parsear respuesta JSON del modelo")


def _empty_result(error_msg: str) -> dict:
    """Retorna resultado vacío con mensaje de error."""
    return {
        "titulo": None, "subtitulo": None, "autores": None,
        "anio": None, "mes_dia": None, "editorial": None,
        "lugar": None, "tipo_doc": None, "edicion_vol": None,
        "palabras_clave": None, "resumen": None, "idioma": None,
        "paginas": None, "formato": None, "licencia": None,
        "_error": error_msg
    }


async def classify_document(fields: dict) -> str:
    """
    Clasifica el documento en una categoría según tipo y contenido.
    Usa el campo tipo_doc si ya existe, sino infiere por contenido.
    """
    tipo = (fields.get("tipo_doc") or "").lower().strip()
    
    # Si ya tenemos tipo_doc del LLM, clasificar
    classification_map = {
        "libro": "A. Libros y Monografías",
        "artículo": "B. Artículos y Papers",
        "articulo": "B. Artículos y Papers",
        "paper": "B. Artículos y Papers",
        "tesis": "C. Tesis y Trabajos de Grado",
        "informe": "D. Informes Técnicos",
        "manual": "E. Manuales y Guías",
        "guía": "E. Manuales y Guías",
        "norma": "F. Normas y Regulaciones",
        "patente": "G. Patentes",
    }
    
    if tipo in classification_map:
        return classification_map[tipo]
    
    # Inferencia por contenido si no hay tipo
    titulo = (fields.get("titulo") or "").lower()
    resumen = (fields.get("resumen") or "").lower()
    editorial = (fields.get("editorial") or "").lower()
    combined = f"{titulo} {resumen} {editorial}"
    
    if any(w in combined for w in ["thesis", "tesis", "grado", "maestría", "doctorado", "phd", "trabajo de grado"]):
        return "C. Tesis y Trabajos de Grado"
    elif any(w in combined for w in ["journal", "revista", "proceedings", "congress", "conferencia"]):
        return "B. Artículos y Papers"
    elif any(w in combined for w in ["manual", "guía", "guide", "handbook", "guia"]):
        return "E. Manuales y Guías"
    elif any(w in combined for w in ["norma", "standard", "iso", "regulation", "ntc"]):
        return "F. Normas y Regulaciones"
    elif any(w in combined for w in ["informe", "report", "technical report"]):
        return "D. Informes Técnicos"
    elif any(w in combined for w in ["patent", "patente", "invención"]):
        return "G. Patentes"
    
    return "A. Libros y Monografías"  # Default: libro