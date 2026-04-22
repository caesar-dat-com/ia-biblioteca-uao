# 🎙️ GUION DE SUSTENTACIÓN — CatalogIA

**Duración estimada:** 8-10 minutos  
**Proyecto:** Agente de IA para Catalogación Empresarial  
**Materia:** Inteligencia Artificial 535212 — Grupo 2  
**Autores:** César Reyes · Juan Pablo Maya  

---

## 1. APERTURA — El problema (30 seg)

> "Buenos días. Hoy les presentamos **CatalogIA**, un agente de inteligencia artificial que automatiza la catalogación de documentos empresariales."

> "El problema es simple: catalogar documentos es un proceso manual, repetitivo y propenso a errores. Un bibliotecario o archivista tarda entre 15 y 30 minutos por documento. Nosotros reducimos eso a segundos."

---

## 2. QUÉ HACE — Función principal (1 min)

> "El sistema funciona así: usted toma una foto de la portada de cualquier documento — un libro, una norma, un manual, una tesis — y CatalogIA hace todo el resto."

**Flujo (mientras muestra la app):**

1. **Sube la foto** → drag & drop o clic
2. **OCR extrae el texto** visible de la portada
3. **Un modelo de IA identifica y estructura 16 campos** bibliográficos
4. **Tres APIs online enriquecen** los datos faltantes
5. **El humano valida** → y se guarda el registro

> "La clave: el humano siempre tiene la última palabra. La IA sugiere, el humano decide."

---

## 3. LOS 16 CAMPOS (30 seg)

> "Extraemos 16 campos según estándares bibliográficos: título, subtítulo, autores, año, editorial, lugar, tipo de documento, edición, palabras clave, resumen, idioma, páginas, formato, licencia, mes/día y ubicación. Cada campo viene con un indicador de confianza y su fuente — si vino del OCR, de la IA, o de una API online."

---

## 4. ARQUITECTURA Y TECNOLOGÍAS (2 min)

> "La arquitectura tiene tres capas:"

### Frontend
> "React 19 con TypeScript, Vite como bundler, Tailwind CSS para estilos. La interfaz tiene tres vistas: subir portada, revisar campos extraídos, y consultar documentos catalogados. Cada campo muestra su nivel de confianza con un indicador visual."

### Backend
> "FastAPI en Python — elegimos FastAPI por su soporte nativo para async, documentación automática, y tipado fuerte con Pydantic. La base de datos es SQLite para el prototipo, escalable a PostgreSQL. El backend orquesta todo el pipeline."

### Servicios de IA (el corazón)

**Motor OCR — doble estrategia:**
> "Usamos **Tesseract** como motor principal — es open source, corre local, soporta español e inglés. Si Tesseract falla, no hay problema — **PaddleOCR** actúa como fallback automático. ¿Por qué no usamos APIs cloud como Google Vision? Porque este sistema debe funcionar sin internet. En una biblioteca o archivo empresarial, la conexión no siempre está garantizada."

**Modelo LLM — extracción de campos:**
> "El texto crudo del OCR no sirve tal cual — está desordenado, tiene errores, falta información. Aquí entra el modelo de lenguaje: le pasamos el texto OCR con un prompt estructurado que le pide extraer los 16 campos en formato JSON. Usamos **GLM-5.1 vía Ollama Cloud** como modelo principal, con **Qwen2.5:7b local** como fallback si no hay internet. El LLM no solo lee — interpreta, clasifica, y estructura."

**Enriquecimiento online — cascada de 3 fuentes:**
> "Cuando el OCR y la IA no pueden completar un campo, el sistema busca online en cascada: primero **Google Books** — mejor cobertura y metadatos completos. Si no encuentra, va a **Open Library** — es 100% gratuita, sin API key. Si tampoco, consulta **Crossref** — especializado en papers académicos y tesis. Esta cascada maximiza la probabilidad de completar los datos sin depender de una sola fuente."

---

## 5. POR QUÉ ESTAS DECISIONES (1 min)

> "¿Por qué esta arquitectura específica?"

- **Offline-first:** Tesseract + Ollama local = funciona sin internet
- **Cloud cuando hay:** GLM-5.1 cloud = mejor precisión cuando hay conexión
- **Fallbacks en cadena:** Si un servicio falla, el siguiente toma el relevo — el sistema nunca se detiene
- **Validación humana:** La IA comete errores — el humano corrige. Esto no es automatización ciega, es amplificación de capacidad
- **APIs gratuitas:** Google Books, Open Library y Crossref no requieren tarjeta de crédito ni pagos

> "Y una decisión técnica importante: nuestra máquina tiene una GPU AMD RX 6700S de 4GB sin soporte CUDA. Eso descartó modelos locales pesados y APIs cloud de pago. Toda la arquitectura está diseñada para funcionar en CPU o con modelos cloud gratuitos."

---

## 6. DEMO EN VIVO (3 min)

> "Vamos a verlo funcionar."

1. **Abrir http://localhost:5174**
2. **Subir una imagen de portada** → "Observen cómo el pipeline se ejecuta"
3. **Mostrar el Confidence Ring** → "Aquí vemos la confianza del OCR — 70% en este caso"
4. **Mostrar los campos extraídos** → "La IA identificó título, autor, editorial, año, tipo — cada uno con su fuente y confianza"
5. **Mostrar campos enriquecidos** → "Google Books completó la información que el OCR no podía leer"
6. **Editar un campo** → "El humano puede corregir cualquier cosa"
7. **Validar** → "Se guarda el registro"
8. **Ir a Documentos** → "Aquí están todos los catalogados"
9. **Clic en un documento** → "Y vemos el detalle completo con la imagen original"

---

## 7. RESULTADOS (30 seg)

> "En nuestras pruebas: el OCR extrae texto con 60-85% de confianza dependiendo de la calidad de la imagen. El LLM identifica correctamente entre 10 y 14 de los 16 campos. Las APIs online completan en promedio 2-3 campos adicionales. El tiempo total del pipeline: entre 5 y 15 segundos por documento. Comparado con 15-30 minutos manual, eso es una reducción del 95% en tiempo."

---

## 8. CIERRE (30 seg)

> "CatalogIA demuestra que la catalogación no tiene que ser un cuello de botella. Con la combinación correcta de OCR, modelos de lenguaje y APIs de enriquecimiento, podemos automatizar el 80% del trabajo y dejar que el humano se enfoque en lo que importa: validar, curar, y decidir."

> "La IA no reemplaza al catalogador. Le da superpoderes."

> "Gracias. ¿Preguntas?"

---

## Tips para la sustentación

- Mantén la demo como centro — muestra, no cuentes
- Si la IA tarda, aprovecha para explicar la arquitectura mientras espera
- Si algo falla en vivo, muestra el fallback — demuestra resiliencia
- Enfoca las preguntas en: ¿por qué estas decisiones técnicas?, ¿qué pasa si no hay internet?

---

_Licencia: Proyecto académico UAO 2026-1S_