"""
Configuración centralizada del backend.
Lee variables de entorno con defaults sensatos para desarrollo.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Cargar .env si existe
load_dotenv()

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", str(BASE_DIR / "data" / "uploads")))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Database
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'data' / 'db' / 'catalogacion.db'}")

# OCR
OCR_ENGINE = os.getenv("OCR_ENGINE", "paddleocr")  # paddleocr | tesseract

# LLM
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
LLM_MODEL = os.getenv("LLM_MODEL", "glm-5.1:cloud")
LLM_FALLBACK_MODEL = os.getenv("LLM_FALLBACK_MODEL", "qwen2.5:7b")

# APIs externas
GOOGLE_BOOKS_API_KEY = os.getenv("GOOGLE_BOOKS_API_KEY", "")
OPEN_LIBRARY_BASE_URL = os.getenv("OPEN_LIBRARY_BASE_URL", "https://openlibrary.org/api")
CROSSREF_BASE_URL = os.getenv("CROSSREF_BASE_URL", "https://api.crossref.org/works")

# App
APP_NAME = os.getenv("APP_NAME", "Agente IA Catalogación")
APP_VERSION = os.getenv("APP_VERSION", "0.1.0")
DEBUG = os.getenv("DEBUG", "true").lower() == "true"
MAX_UPLOAD_SIZE_MB = int(os.getenv("MAX_UPLOAD_SIZE_MB", "20"))

# Schema fields
DOCUMENT_FIELDS = [
    "titulo", "subtitulo", "autores", "anio", "mes_dia",
    "editorial", "lugar", "tipo_doc", "edicion_vol", "palabras_clave",
    "resumen", "idioma", "paginas", "formato", "licencia"
]

DOCUMENT_TYPES = ["Libro", "Artículo", "Tesis", "Informe", "Manual", "Norma", "Patente", "Otro"]

DOCUMENT_STATUSES = ["uploaded", "extracting", "extracted", "enriching", "enriched", "validating", "validated", "published", "rejected"]

LANGUAGES = ["Español", "Inglés", "Portugués", "Francés", "Alemán", "Otro"]

FORMATS = ["PDF", "Impreso", "Digital", "HTML", "Otro"]

LICENSES = ["CC BY", "CC BY-SA", "CC BY-NC", "CC BY-ND", "CC BY-NC-SA", "CC BY-NC-ND", "Propietaria", "Dominio público", "Otro"]