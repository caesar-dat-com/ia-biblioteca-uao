# CatalogIA — Agente de IA para Catalogación Empresarial

> Proyecto de Inteligencia Artificial (535212) — Universidad Autónoma de Occidente
> **Autores:** César Reyes · Juan Pablo Maya

---

## Descripción

CatalogIA es un sistema de catalogación inteligente que automatiza la extracción, enriquecimiento y clasificación de metadatos documentales a partir de imágenes de portadas. El usuario fotografía la portada de un documento y el agente de IA:

1. **Extrae texto** mediante OCR (Tesseract / PaddleOCR)
2. **Identifica 16 campos** bibliográficos usando un modelo LLM (Ollama cloud)
3. **Enriquece** los datos con fuentes online (Google Books, Open Library, Crossref)
4. **Presenta** los resultados para validación humana
5. **Almacena** el registro catalogado en base de datos

---

## Arquitectura

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Frontend  │────▶│     Backend      │────▶│   Servicios AI    │
│  React+Vite │     │    FastAPI       │     │                  │
│  Tailwind   │     │    SQLite        │     │  ● Tesseract OCR │
│  Port 5174  │     │    Port 8000     │     │  ● Ollama LLM    │
└─────────────┘     └──────────────────┘     │  ● Google Books  │
                                              │  ● Open Library  │
                                              │  ● Crossref      │
                                              └──────────────────┘
```

### Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Frontend | React + Vite + TypeScript | React 19, Vite 6 |
| Estilos | Tailwind CSS 4 + CSS Variables | — |
| Iconos | Lucide React | ^0.475 |
| Backend | FastAPI + Uvicorn | FastAPI 0.115 |
| Base de datos | SQLite (aiosqlite) | — |
| OCR | Tesseract 5.5 + PaddleOCR 2.9 | spa+eng |
| LLM | Ollama (glm-5.1:cloud) | Cloud/local |
| APIs externas | Google Books, Open Library, Crossref | REST |
| Lenguaje | Python 3.11 | — |

---

## 16 Campos de Catalogación

El agente extrae y clasifica los siguientes campos según estándares bibliográficos:

| # | Campo | Descripción | Ejemplo |
|---|-------|-------------|---------|
| 1 | titulo | Título principal | "Inteligencia Artificial" |
| 2 | subtitulo | Subtítulo | "Un enfoque moderno" |
| 3 | autores | Autor(es) separados por ; | "Russell, Stuart; Norvig, Peter" |
| 4 | anio | Año de publicación | 2024 |
| 5 | mes_dia | Mes y/o día | "Marzo" |
| 6 | editorial | Editorial o institución | "Pearson" |
| 7 | lugar | Ciudad/país de publicación | "México, D.F." |
| 8 | tipo_doc | Tipo de documento | Libro, Artículo, Tesis, etc. |
| 9 | edicion_vol | Edición o volumen | "3ra ed., Vol. 2" |
| 10 | palabras_clave | Descriptores temáticos | "IA, machine learning, NLP" |
| 11 | resumen | Resumen/abstract | "Texto descriptivo..." |
| 12 | idioma | Idioma del documento | Español, Inglés |
| 13 | paginas | Número de páginas | "432" |
| 14 | formato | Formato disponible | PDF, Impreso, Digital |
| 15 | licencia | Tipo de licencia | "CC BY", "Propietaria" |
| 16 | ubicacion | Ubicación física/digital | "Estante A3, Sector 2" |

---

## Instalación y Ejecución

### Prerrequisitos

- Python 3.11+
- Node.js 18+
- Tesseract OCR 5.x (con datos de español)
- Ollama (con modelo cloud o local)

### 1. Backend

```bash
cd backend

# Instalar dependencias
pip install -r requirements.txt

# Instalar Tesseract OCR (si no está instalado)
# Windows: choco install tesseract
# Descargar datos de español:
# https://github.com/tesseract-ocr/tessdata/raw/main/spa.traineddata
# Copiar a: C:\Program Files\Tesseract-OCR\tessdata\

# Configurar variables de entorno (opcional)
cp .env.example .env
# Editar .env con API keys si se desea

# Ejecutar
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### 2. Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev
```

### 3. Acceder

- **Frontend:** http://localhost:5174
- **API Docs:** http://localhost:8000/docs

---

## API Endpoints

### Catalogación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/catalog/upload` | Sube imagen → OCR → Extracción IA → Enriquecimiento |
| POST | `/api/catalog/validate/{id}` | Valida documento con correcciones humanas |

### Documentos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/documents` | Lista documentos catalogados |
| GET | `/api/documents/{id}` | Detalle de un documento |
| DELETE | `/api/documents/{id}` | Elimina un documento |

### Enriquecimiento

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/enrich/search?title=...` | Busca en Google Books + Open Library |
| GET | `/api/enrich/isbn/{isbn}` | Busca por ISBN |

---

## Flujo de Uso

1. **Subir portada** — Arrastra o selecciona imagen de la portada del documento
2. **Procesamiento automático** — OCR extrae texto → IA identifica campos → APIs online enriquecen datos
3. **Revisión** — El sistema muestra los 16 campos con indicadores de fuente y confianza
4. **Edición** — El usuario puede corregir cualquier campo directamente
5. **Validación** — Confirma los datos y se almacena el registro catalogado
6. **Consulta** — Los documentos catalogados quedan disponibles en la lista

---

## Estructura del Proyecto

```
IA-Biblioteca-UAO/
├── README.md                          ← Este archivo
├── schema.json                        ← Esquema de 16 campos
├── PROPUESTA_ORIGINAL.md              ← Propuesta inicial del proyecto
├── .gitignore
│
├── backend/
│   ├── requirements.txt               ← Dependencias Python
│   ├── .env.example                    ← Variables de entorno template
│   ├── app/
│   │   ├── main.py                     ← FastAPI app + CORS
│   │   ├── config.py                   ← Configuración centralizada
│   │   ├── database.py                 ← SQLite schema + init
│   │   ├── models/
│   │   │   └── schemas.py              ← Pydantic models
│   │   ├── routers/
│   │   │   ├── catalog.py             ← Upload + validación
│   │   │   ├── documents.py            ← CRUD documentos
│   │   │   └── enrich.py              ← Búsqueda online
│   │   └── services/
│   │       ├── ocr.py                  ← Tesseract + PaddleOCR
│   │       ├── extract.py             ← LLM extracción de campos
│   │       └── enrich.py             ← Google Books + Open Library + Crossref
│   └── data/                           ← SQLite + uploads (gitignore)
│
└── frontend/
    ├── package.json
    ├── vite.config.ts                  ← Proxy /api → backend
    ├── tsconfig.json
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx                     ← Layout + tabs
        ├── index.css                   ← Variables CSS + animaciones
        └── components/
            ├── Header.tsx              ← Logo + branding
            ├── UploadZone.tsx          ← Drag & drop de imágenes
            ├── ResultsPanel.tsx        ← 16 campos + edición + validación
            ├── ConfidenceRing.tsx      ← Indicador circular de confianza
            ├── FieldCard.tsx           ← Tarjeta individual de campo
            └── DocumentList.tsx        ← Lista de documentos catalogados
```

---

## Variables de Entorno

| Variable | Default | Descripción |
|----------|---------|-------------|
| `OCR_ENGINE` | `paddleocr` | Motor OCR: `paddleocr` o `tesseract` |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | URL de Ollama |
| `LLM_MODEL` | `glm-5.1:cloud` | Modelo LLM para extracción |
| `LLM_FALLBACK_MODEL` | `qwen2.5:7b` | Modelo fallback local |
| `GOOGLE_BOOKS_API_KEY` | — | API key de Google Books |
| `DATABASE_URL` | `sqlite:///data/db/catalogacion.db` | URL de base de datos |
| `MAX_UPLOAD_SIZE_MB` | `20` | Tamaño máximo de imagen |

---

## Justificación del Enfoque Empresarial

Originalmente el proyecto se propuso para la biblioteca de la UAO. Dado que la universidad no otorgó acceso a los datos bibliográficos, el proyecto pivoteó hacia un enfoque empresarial más amplio:

- **16 campos de catalogación** estándar (vs. los limitados de la biblioteca)
- **Clasificación automática de tipo documental** (libro, artículo, tesis, norma, etc.)
- **Enriquecimiento online** con 3 fuentes para mayor completitud
- **Validación humana** como paso final — el humano siempre tiene la última palabra
- **Escalable** — puede adaptarse a cualquier organización que necesite catalogar documentos

---

## Presentación

El archivo `Agente_IA_Biblioteca_UAO_empresarial_v2.pptx` contiene la presentación del proyecto adaptada al enfoque empresarial.

**Fechas de sustentación:**
- 21 de abril de 2026 — Primera fecha
- 22 de abril de 2026 — Segunda fecha

---

_Licencia: Proyecto académico UAO 2026-1S_