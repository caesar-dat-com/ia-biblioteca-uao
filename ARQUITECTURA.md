# Arquitectura Técnica — Agente IA para Catalogación Empresarial

**Proyecto:** IA 535212 — Grupo 2
**Fecha:** 2026-04-19
**Restricción crítica:** 2 días para prototipo funcional (sustentación 21 abr)

---

## 1. Evaluación de Tecnologías

### 1.1 OCR — Extracción de texto desde portada

| Tecnología | Precisión | Velocidad | Setup | GPU | Sin Internet | Veredicto |
|-----------|-----------|-----------|-------|-----|-------------|-----------|
| **PaddleOCR** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Media | ROCm parcial* | Sí | **PRINCIPAL** |
| Tesseract | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Fácil | No | Sí | Fallback |
| EasyOCR | ⭐⭐⭐⭐ | ⭐⭐ | Fácil | ROCm* | Sí | Alternativa |
| Google Vision API | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Fácil (clave) | No | No | No viable* |
| AWS Textract | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Media (clave) | No | No | No viable* |

*\* AMD RX 6700S: ROCm soporte limitado en Windows. PaddleOCR corre en CPU sin problema (2-5s por imagen). Google Vision/Textract requieren cuenta cloud con tarjeta de crédito — no viable para prototipo de 2 días.*

**Decisión: PaddleOCR como motor principal, Tesseract como fallback automático.**

Justificación:
- PaddleOCR tiene el mejor soporte multiidioma (español + inglés) de las opciones locales
- Corre bien en CPU (2-5 segundos por portada) — no necesitamos GPU
- API Python limpia, fácil de integrar
- Tesseract como fallback garantiza que siempre hay un OCR disponible
- Para prototipo de 2 días, no podemos configurar APIs cloud desde cero

### 1.2 Modelo de IA — Extracción y clasificación de campos

| Enfoque | Precisión | Latencia | Requisitos | Veredicto |
|---------|-----------|----------|-----------|-----------|
| **LLM cloud (GLM-5/Qwen3) + prompt estructurado** | ⭐⭐⭐⭐⭐ | 3-10s | API key Ollama Cloud | **PRINCIPAL** |
| LLM local (Qwen2.5:7b via Ollama) | ⭐⭐⭐⭐ | 10-30s | 8GB+ RAM | Fallback offline |
| LLM local pequeño (Qwen2:0.5b) | ⭐⭐⭐ | 2-5s | 2GB RAM | Emergencia offline |
| Reglas + regex (sin IA) | ⭐⭐⭐ | <1s | Ninguno | Backup si todo falla |

**Decisión: LLM vía API (GLM-5.1 cloud) como motor principal, Ollama local como fallback.**

Estrategia de prompt:
```
Dada la siguiente información extraída por OCR de una portada de documento:
---
{ocr_text}
---
Extrae los siguientes campos en formato JSON. Si un campo no se puede 
determinar, usa null. Sé preciso, no inventes información.

Campos: titulo, subtitulo, autores, anio, mes_dia, editorial, lugar, 
tipo_doc, edicion_vol, palabras_clave, resumen, idioma, paginas, formato, licencia

Respuesta SOLO en JSON válido.
```

### 1.3 APIs de Enriquecimiento — Búsqueda de metadatos faltantes

| API | Gratuidad | Cobertura | Rate Limit | Calidad | Veredicto |
|-----|-----------|-----------|------------|---------|-----------|
| **Open Library API** | 100% | ⭐⭐⭐⭐ | Sin límite práctico | ⭐⭐⭐⭐ | **Principal** |
| **Google Books API** | 1000 req/día | ⭐⭐⭐⭐⭐ | 1000/día | ⭐⭐⭐⭐⭐ | **Principal** |
| **Crossref API** | 100% | ⭐⭐⭐⭐⭐ | Cortesía | ⭐⭐⭐⭐⭐ | Complemento |
| OpenAlex | 100% | ⭐⭐⭐⭐ | 10/seg | ⭐⭐⭐⭐ | Fallback |

**Decisión: Cascada Google Books → Open Library → Crossref.**

Orden de búsqueda:
1. Google Books (mejor cobertura, ISBN, portadas, metadatos completos)
2. Open Library (si Google no encuentra, buen respaldo para libros)
3. Crossref (artículos académicos, papers, DOI)

Estrategia: Buscar por ISBN si disponible, sino por título+autor. Completar campos que el OCR no pudo extraer.

### 1.4 Clasificación automática

**Enfoque:** LLM clasifica el tipo de documento basándose en los campos extraídos.

Categorías del schema: Libro, Artículo, Tesis, Informe, Manual, Norma, Patente, Otro

Prompt de clasificación:
```
Dado el siguiente documento catalogado:
{Título}, {Autor}, {Editorial}, {Año}, {Resumen}

Clasifica en UNA de estas categorías:
Libro, Artículo, Tesis, Informe, Manual, Norma, Patente, Otro

Responde SOLO con la categoría.
```

---

## 2. Arquitectura Propuesta

### 2.1 Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  React + TypeScript + Vite + Tailwind                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │  Upload   │ │ Review   │ │ Catalog  │ │  Dashboard    │  │
│  │  Imagen/  │ │ Validar  │ │ Buscar   │ │  Estadísticas │  │
│  │  PDF      │ │ Editar   │ │ Filtrar  │ │  Métricas     │  │
│  └─────┬─────┘ └────┬─────┘ └────┬─────┘ └───────┬───────┘  │
│        │             │            │                │          │
└────────┼─────────────┼────────────┼────────────────┼─────────┘
         │             │            │                │
    ┌────▼─────────────▼────────────▼────────────────▼─────┐
    │                    FASTAPI (REST)                      │
    │  ┌─────────────────────────────────────────────────┐  │
    │  │              API ROUTER                           │  │
    │  │  /api/documents          CRUD documentos          │  │
    │  │  /api/documents/upload   Subir imagen/PDF         │  │
    │  │  /api/documents/{id}/extract  Ejecutar pipeline   │  │
    │  │  /api/documents/{id}/validate  Validar humano     │  │
    │  │  /api/documents/{id}/enrich   Enriquecer online   │  │
    │  │  /api/stats               Métricas                │  │
    │  └─────────────────────┬───────────────────────────┘  │
    │                        │                               │
    │  ┌─────────────────────▼───────────────────────────┐  │
    │  │            PIPELINE ORQUESTADOR                   │  │
    │  │                                                    │  │
    │  │  1. OCR Engine ──► 2. LLM Extract ──► 3. Enrich  │  │
    │  │        │                  │               │       │  │
    │  │  ┌─────▼─────┐    ┌──────▼──────┐  ┌────▼────┐  │  │
    │  │  │ PaddleOCR │    │ GLM-5 Cloud │  │ Google   │  │  │
    │  │  │ Tesseract │    │ Qwen Local  │  │ Books    │  │  │
    │  │  │ (fallback)│    │ (fallback)  │  │ OpenLib  │  │  │
    │  │  └───────────┘    └─────────────┘  │ Crossref │  │  │
    │  │                                     └─────────┘  │  │
    │  │  4. Classify ──► 5. Merge ──► 6. Save            │  │
    │  │     (LLM)        (Reglas)    (SQLite)            │  │
    │  └─────────────────────────────────────────────────┘  │
    │                                                        │
    │  ┌──────────────────────────────────────────────────┐  │
    │  │                 DATABASE LAYER                    │  │
    │  │     SQLite (dev) / Supabase (prod futuro)        │  │
    │  │     SQLAlchemy ORM + Alembic migrations            │  │
    │  └──────────────────────────────────────────────────┘  │
    └────────────────────────────────────────────────────────┘
```

### 2.2 Flujo de Datos

```
Imagen/PDF
    │
    ▼
┌──────────────────┐
│  1. INGESTA      │  Upload → almacenar archivo → crear registro (status: uploaded)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  2. OCR          │  PaddleOCR (o Tesseract fallback) → texto raw de portada
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  3. EXTRACCIÓN   │  LLM (GLM-5/Qwen) + prompt estructurado → JSON con 16 campos
│                  │  Marcar campos con confianza: high/medium/low/null
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  4. ENRIQUECIM   │  Para campos null/low confidence:
│                  │  Google Books → Open Library → Crossref
│                  │  Merge: online > OCR, nunca sobreescribir manual
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  5. CLASIFICACIÓ │  LLM clasifica tipo_doc según campos extraídos
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  6. VALIDACIÓN   │  Humano revisa → aprobar / corregir / rechazar
│                  │  Si corrige → actualiza campos → re-clasificar
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  7. ALMACENAMIENT│  Save en BD → exportable como JSON/CSV
└──────────────────┘
```

### 2.3 Modelo de Datos

```python
class Document(Base):
    id: str                    # UUID auto-generado
    parte_no: str              # ID (Parte No.) — editable manual
    titulo: str                # Requerido
    subtitulo: str | None      # Opcional
    autores: str               # Lista separada por ";"
    anio: int | None           # Año de publicación
    mes_dia: str | None        # Mes/Día si aplica
    editorial: str | None      # Editorial
    lugar: str | None          # Ciudad/país
    tipo_doc: str              # Categoría (Libro, Artículo, etc.)
    edicion_vol: str | None    # Edición/Vol.
    palabras_clave: str        # Lista separada por ";"
    resumen: str | None        # Resumen/abstract
    idioma: str                # Español, Inglés, etc.
    paginas: str | None        # Número de páginas o rango
    formato: str               # PDF, Impreso, etc.
    licencia: str | None       # Tipo de licencia
    
    # Campos de sistema
    status: str                # uploaded → extracted → enriched → validated → published
    ocr_text: str | None       # Texto crudo del OCR
    ocr_engine: str | None     # "paddleocr" o "tesseract"
    confidence: dict           # {"titulo": 0.95, "autores": 0.8, ...}
    source_image: str           # Path de la imagen subida
    extraction_method: str     # "llm_cloud" o "llm_local"
    enriched_from: list        # ["google_books", "open_library"]
    created_at: datetime
    updated_at: datetime
    validated_by: str | None   # "cesar" o "juan_pablo"
```

### 2.4 Estados del Documento

```
uploaded → extracting → extracted → enriching → enriched → validating → validated/published
                                                         ↘ rejected
```

---

## 3. Stack Técnico Recomendado

### 3.1 Backend

| Componente | Tecnología | Versión | Justificación |
|-----------|-----------|---------|---------------|
| Runtime | Python | 3.11+ | Ecosistema ML/IA maduro |
| Framework | FastAPI | 0.110+ | Async, docs auto, types, rápido |
| ORM | SQLAlchemy | 2.0+ | Estándar Python, migraciones con Alembic |
| BD (dev) | SQLite | - | Cero config, un archivo, suficiente para piloto |
| BD (prod) | Supabase/PostgreSQL | - | Escalable cuando toque |
| OCR Principal | PaddleOCR | 2.7+ | Mejor precisión multiidioma local |
| OCR Fallback | pytesseract | 0.3.10+ | Siempre disponible, confiable |
| LLM Cloud | GLM-5.1 (Ollama Cloud) | - | Ya configurado en la máquina de César |
| LLM Local | Ollama (Qwen2.5:7b) | - | Fallback offline |
| Enriquecimiento | httpx | - | Async HTTP para APIs externas |
| Validación | Pydantic | 2.0+ | Validación del schema de 16 campos |
| Testing | pytest | 8.0+ | Tests del pipeline |

### 3.2 Frontend

| Componente | Tecnología | Justificación |
|-----------|-----------|---------------|
| Framework | React 18 + TypeScript | Stack conocido por el equipo |
| Build | Vite 5+ | Rápido, HMR |
| Estilos | TailwindCSS 3+ | UI rápida sin escribir CSS |
| HTTP Client | fetch/axios | Llamadas a la API |
| Estado | useState + useReducer | Suficiente para el prototipo |
| Componentes | Headless UI o shadcn/ui | Componentes accesibles y rápidos |

### 3.3 Justificación de decisiones considerando GPU limitada

**AMD RX 6700S 4GB sin CUDA** → No podemos usar modelos locales grandes de forma eficiente.

Estrategia:
1. **OCR en CPU:** PaddleOCR corre bien en CPU (~3s por imagen). No necesitamos GPU para OCR.
2. **LLM cloud:** GLM-5.1 vía Ollama Cloud ya está configurado y funciona. Latencia aceptable.
3. **LLM local como fallback:** Qwen2.5:7b corre en CPU si el internet falla (lento pero funcional).
4. **No usar GPU para nada:** Todo el pipeline funciona en CPU o cloud. La GPU queda libre.

### 3.4 Consideraciones de prototipo (2 días)

**NO implementar (para después de la sustentación):**
- Autenticación de usuarios
- Rate limiting avanzado
- Migraciones de BD (Alembic)
- Tests unitarios completos
- CI/CD
- Deployment en servidor

**SÍ implementar (mínimo viable):**
- Upload de imagen/PDF → OCR → extracción → revisión → guardar
- 3-4 pantallas funcionales
- Pipeline end-to-end que se pueda demostrar
- Base de datos SQLite funcional
- Enriquecimiento con al menos Google Books

---

## 4. Plan de Implementación (2 días)

### Día 1 — Domingo 20 de abril (HOY)

#### Bloque 1: Setup + Backend core (3-4 horas)
- [ ] **0.5h** Crear estructura de proyecto, requirements.txt, config
- [ ] **0.5h** Setup FastAPI + SQLAlchemy + modelo de datos + BD SQLite
- [ ] **1h** Endpoint de upload (imagen/PDF) + almacenamiento
- [ ] **1h** Pipeline OCR: integrar PaddleOCR + fallback Tesseract
- [ ] **0.5h** Tests básicos del OCR con imágenes de prueba

#### Bloque 2: Pipeline IA (3-4 horas)
- [ ] **1h** Prompt engineering para extracción de 16 campos + tests
- [ ] **0.5h** Integrar LLM (GLM-5 cloud via Ollama API)
- [ ] **1h** Enriquecimiento: Google Books API + Open Library API
- [ ] **0.5h** Clasificación automática de tipo_doc
- [ ] **0.5h** Merge de campos: OCR + LLM + enriquecimiento → resultado final

#### Bloque 3: API completa (2 horas)
- [ ] **0.5h** Endpoint de validación humana (PATCH /documents/{id}/validate)
- [ ] **0.5h** Endpoint de enriquecimiento manual (POST /documents/{id}/enrich)
- [ ] **0.5h** CRUD completo (list, get, update, delete)
- [ ] **0.5h** Endpoint de estadísticas (conteos por estado, tipo, etc.)

### Día 2 — Lunes 21 de abril (SUSTENTACIÓN)

#### Bloque 4: Frontend (4-5 horas)
- [ ] **1h** Setup React + Vite + Tailwind + estructura
- [ ] **1h** Pantalla de Upload (drag & drop de imagen/PDF)
- [ ] **1h** Pantalla de Revisión (formulario editable con los 16 campos)
- [ ] **1h** Pantalla de Listado (tabla de documentos, filtros)
- [ ] **0.5h** Dashboard básico (conteos, gráfico simple)

#### Bloque 5: Integración + Pulido (2-3 horas)
- [ ] **1h** Integración frontend ↔ backend end-to-end
- [ ] **0.5h** Datos de prueba (5-10 documentos de ejemplo)
- [ ] **0.5h** Manejo de errores y estados de carga
- [ ] **0.5h** README con instrucciones de ejecución

#### Bloque 6: Presentación (1-2 horas)
- [ ] **0.5h** Actualizar PPTX con arquitectura real y demos
- [ ] **0.5h** Preparar demo script (qué mostrar, en qué orden)
- [ ] **0.5h** Ensayar flujo completo: upload → OCR → extracción → revisión → guardar

### Resumen de tiempo: ~16 horas de trabajo en 2 días

**Priorización si algo falla:**
1. **NUNCA sacrificar:** Pipeline OCR → extracción → validación (es el core)
2. **Reducible:** Enriquecimiento online (mostrar con 1 API es suficiente)
3. **Prescindible:** Dashboard (la sustentación no depende de esto)
4. **Prescindible:** Tests (el prototipo funciona sin tests formales)

---

## 5. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|-----------|
| PaddleOCR falla al instalar | Media | Alto | Tesseract como fallback, probar hoy |
| LLM cloud no disponible | Baja | Alto | Ollama local como fallback |
| OCR de mala calidad en fotos | Media | Medio | Preprocesamiento de imagen (resize, contraste) |
| APIs de enriquecimiento caídas | Baja | Bajo | Datos parciales siguen siendo útiles |
| No alcanzar a terminar frontend | Media | Medio | Usar shadcn/ui o componentes mínimos |
| SQLite corrupción | Baja | Medio | Backup automático, reiniciar es trivial |

---

## 6. Métricas de Éxito (para la sustentación)

- ✅ Upload de imagen funciona
- ✅ OCR extrae texto visible
- ✅ LLM extrae al menos 10 de 16 campos con >80% precisión
- ✅ Enriquecimiento completa al menos 2 campos faltantes
- ✅ Clasificación automática acierta tipo_doc en >70%
- ✅ Validación humana permite corregir y aprobar
- ✅ Documentos se almacenan y recuperan de SQLite
- ✅ Flujo end-to-end completo en <3 minutos por documento