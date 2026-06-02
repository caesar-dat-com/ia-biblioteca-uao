# GUION DE SUSTENTACIÓN — CatalogIA
**Duración:** máx 15 min · **Materia:** IA 535212 · **UAO 2026-1S**
**Autores:** César Reyes · Juan Pablo Maya

---

## ESTRUCTURA (distribución de tiempo)

| Bloque | Tiempo | Quién |
|--------|--------|-------|
| Apertura + problema | 1 min | César |
| Qué hace + demo en vivo | 5 min | César (demo) + Juan Pablo (explica campos) |
| Arquitectura técnica | 3 min | Juan Pablo |
| Resultados + métricas | 2 min | César |
| Cierre | 30 seg | Ambos |
| Preguntas | variable | Ambos |

---

## BLOQUE 1 — APERTURA (1 min)

> "Buenos días. Somos César Reyes y Juan Pablo Maya, y hoy presentamos **CatalogIA**: un agente de inteligencia artificial que automatiza la catalogación de documentos empresariales."

> "El problema que resolvemos: catalogar documentos es manual, repetitivo y propenso a errores. Un archivista tarda entre 15 y 30 minutos por documento — clasificando título, autores, editorial, palabras clave, y otros campos. Nosotros hacemos eso mismo en menos de 15 segundos."

> "El cliente que validó el sistema fue el coordinador de Gestión Documental de Postobón S.A., quien calificó el sistema con 4 de 5 puntos y lo clasificó como listo para piloto con mejoras menores."

---

## BLOQUE 2 — DEMO EN VIVO (5 min)

> "Vamos directo a la demostración."

**Pasos de la demo — ir despacio, comentar cada paso:**

1. Abrir `http://localhost:5174`
2. Arrastrar imagen de portada al área de carga
   - *"Observen — el sistema ejecuta el pipeline en tiempo real"*
3. Mientras procesa (~10 seg): *"Internamente está corriendo OCR, luego el modelo de lenguaje, luego buscando en APIs online"*
4. Mostrar el **Confidence Ring**
   - *"Este anillo muestra la confianza del OCR. A mayor porcentaje, el texto fue extraído con mayor certeza"*
5. Mostrar campos extraídos
   - *"16 campos estructurados. Cada uno tiene su fuente: si vino del OCR+IA o de una API online. Y su nivel de confianza individual"*
6. Editar un campo incorrecto
   - *"El humano siempre puede corregir. La IA sugiere, el humano decide"*
7. Clic en **Validar y guardar**
8. Ir a tab **Documentos** → mostrar thumbnail de portada
9. Clic en el documento → mostrar detalle completo

> "El flujo completo: imagen entra, metadatos salen. 15 segundos en lugar de 15 minutos."

---

## BLOQUE 3 — ARQUITECTURA TÉCNICA (3 min)

> "Ahora explico qué hay por dentro."

### 3.1 Arquitectura de software — 3 capas

```
[Frontend React]  ←→  [Backend FastAPI]  ←→  [Servicios IA + BD]
```

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS
- **Backend:** FastAPI (Python) con soporte async nativo. Base de datos SQLite (escalable a PostgreSQL). Expone REST API documentada automáticamente.
- **Servicios IA:** PaddleOCR + Tesseract + GLM-5.1 (Ollama) + APIs enriquecimiento

### 3.2 Arquitectura del modelo de IA — AQUÍ ESTÁ LA RESPUESTA CLAVE

> *"Nuestra solución no entrena un modelo desde cero. Usamos modelos preentrenados con dos arquitecturas de red neuronal distintas:"*

**Motor OCR — PaddleOCR (arquitectura CNN + LSTM):**
- **Detección de texto:** DBNet — red convolucional (CNN) que detecta regiones con texto en la imagen
- **Reconocimiento de texto:** CRNN (Convolutional Recurrent Neural Network) — combina CNN para extraer features visuales + LSTM bidireccional para leer secuencias de caracteres
- Es un modelo de **Deep Learning supervisado**, preentrenado con millones de imágenes de texto
- En Linux usamos **Tesseract** como motor principal (bug de oneDNN en PaddleOCR 3.x) — Tesseract usa una red **LSTM** para reconocimiento de caracteres

**Modelo de lenguaje — GLM-5.1 (arquitectura Transformer):**
- GLM (General Language Model) es un modelo Transformer autoregresivo desarrollado por Zhipu AI / Tsinghua University
- La arquitectura Transformer usa mecanismo de **self-attention** para entender contexto bidireccional
- Lo usamos vía **Ollama** con **prompt engineering**: le pasamos el texto OCR y un prompt estructurado que le pide extraer 16 campos en JSON
- No lo entrenamos — aplicamos **zero-shot prompting** sobre un modelo preentrenado. Esta es la técnica de **Transfer Learning / prompting**
- Fallback: **Qwen2.5:7b** local cuando no hay internet

**Enriquecimiento — cascada de APIs:**
- Google Books API → Open Library API → Crossref API
- Cascada: si la primera no responde, la siguiente toma el relevo

### 3.3 Pipeline completo

```
Imagen → OCR (CNN+LSTM) → Texto crudo
       → LLM (Transformer) → 16 campos JSON
       → APIs enriquecimiento → campos faltantes completados
       → BD SQLite → Validación humana → Registro final
```

> *"Es una arquitectura de pipeline secuencial con Human-in-the-Loop — el humano es parte del sistema, no está afuera de él."*

---

## BLOQUE 4 — RESULTADOS Y MÉTRICAS (2 min)

> "Evaluamos el sistema sobre 5 documentos reales con ground truth verificado."

| Métrica | Resultado |
|---------|-----------|
| Precisión global (9 campos evaluados) | **58.9%** |
| Confianza OCR promedio | **68.6%** |
| Campos correctos por documento | **10.8 / 16** (67.5%) |
| Tiempo por documento | **10–15 segundos** |
| Reducción vs proceso manual | **~95%** |

> "El campo con mayor precisión fue **título** (100%) y **tipo de documento** (100%). El de menor precisión fue **edición/volumen** — campos que no siempre están en la portada."

> "Las métricas en tiempo real están disponibles en el tab Métricas de la aplicación."

---

## BLOQUE 5 — CIERRE (30 seg)

> "CatalogIA demuestra que con OCR, modelos de lenguaje y APIs gratuitas, podemos automatizar el 80% del trabajo de catalogación sin costo de infraestructura cloud."

> "El sistema es un prototipo funcional con validación real de cliente. Con un ciclo más de desarrollo — exportación a Excel, mejora en normas técnicas, procesamiento en lote — estaría listo para despliegue empresarial."

> "Gracias. Quedamos disponibles para preguntas."

---

---

# BANCO DE PREGUNTAS Y RESPUESTAS

---

## PREGUNTA 1 — La que los corchó: "¿Qué tipo de arquitectura de red neuronal manejan?"

**Respuesta completa:**

> "Manejamos dos arquitecturas distintas según el componente:
>
> Para el **OCR**, usamos PaddleOCR que internamente combina dos redes: una **CNN** (Red Neuronal Convolucional) llamada DBNet para detectar regiones con texto en la imagen, y una **CRNN** — que es una Red Neuronal Convolucional + LSTM bidireccional — para reconocer los caracteres. El LSTM permite leer secuencias de izquierda a derecha y de derecha a izquierda simultáneamente, lo que mejora el reconocimiento de texto en contexto. En Linux corremos Tesseract, que también usa LSTM.
>
> Para la **extracción de campos**, usamos GLM-5.1, que es un modelo de lenguaje basado en arquitectura **Transformer**. Los Transformers usan mecanismo de self-attention — en lugar de procesar el texto palabra por palabra como un RNN, procesan todas las palabras en paralelo y aprenden qué partes del texto son relevantes entre sí.
>
> No entrenamos ninguno de los dos modelos. Aplicamos **Transfer Learning**: tomamos modelos preentrenados con grandes corpus y los aplicamos a nuestro problema específico mediante prompt engineering."

---

## PREGUNTA 2 — "¿Por qué no entrenaron su propio modelo?"

> "Tres razones:
> Primero, no tenemos el dataset — necesitaríamos miles de pares imagen/metadatos anotados para entrenar un modelo de extracción de campos desde cero.
> Segundo, los recursos computacionales: nuestra máquina tiene GPU AMD sin soporte CUDA, lo que descarta entrenar modelos grandes localmente.
> Tercero, y más importante: los modelos preentrenados como GLM-5.1 ya fueron entrenados con información bibliográfica masiva. Usando prompt engineering llegamos a resultados equivalentes a un modelo fine-tuneado, sin el costo de datos ni infraestructura.
> Esta es exactamente la tendencia actual en IA empresarial — usar modelos fundacionales con prompting en lugar de entrenar desde cero."

---

## PREGUNTA 3 — "¿Qué tan preciso es el sistema?"

> "En evaluación formal sobre 5 documentos con ground truth: 58.9% de precisión global sobre 9 campos evaluados, y 10.8 de 16 campos correctos por documento — un 67.5%. La confianza OCR promedio fue 68.6%.
> El título y tipo de documento se extraen con 100% de precisión. Los campos con menor precisión son edición y número de páginas — datos que frecuentemente no aparecen en la portada y deben venir de APIs externas.
> El cliente evaluador, coordinador de Postobón S.A., calificó la precisión con 4/5 y la clasificó como 'Alta (60-80% de campos correctos)'."

---

## PREGUNTA 4 — "¿Qué pasa si no hay internet?"

> "El sistema tiene dos niveles de fallback diseñados para funcionar sin internet.
> Para OCR: Tesseract corre 100% local, sin necesidad de conexión.
> Para el modelo de lenguaje: el fallback es Qwen2.5:7b corriendo localmente vía Ollama, también sin internet.
> Lo que sí requiere internet es el enriquecimiento con Google Books, Open Library y Crossref — pero esos campos son complementarios. El sistema extrae los campos principales del OCR+LLM local, y el enriquecimiento solo agrega datos faltantes cuando hay conexión.
> La arquitectura es offline-first por diseño."

---

## PREGUNTA 5 — "¿Cómo escalarían esto a producción?"

> "Cuatro cambios principales:
> Base de datos: de SQLite a PostgreSQL con índices en título y autores.
> LLM: de Ollama local a la API de Zhipu AI o una instancia dedicada del modelo, para mayor velocidad y concurrencia.
> Procesamiento en lote: agregar una cola de tareas (Celery o similar) para procesar múltiples documentos simultáneamente en lugar de uno a la vez.
> Despliegue: containerizar con Docker, desplegar el backend en un servidor con GPU para correr el modelo local con mayor velocidad."

---

## PREGUNTA 6 — "¿Qué es el indicador de confianza que muestran?"

> "Son dos cosas distintas:
> El **Confidence Ring** muestra la confianza del OCR — qué tan legible fue el texto extraído de la imagen. PaddleOCR y Tesseract asignan un score de 0 a 1 por cada región de texto. Promediamos todos los scores para el ring.
> La **confianza por campo** viene del LLM: le pedimos que junto con cada campo también devuelva un score de certeza de 0 a 1. Si el título está claramente en la portada, da 0.95. Si infirió el tipo de documento por el contexto, puede dar 0.6.
> Estos indicadores permiten al catalogador saber dónde priorizar su revisión."

---

## PREGUNTA 7 — "¿Por qué FastAPI y no Django o Flask?"

> "FastAPI tiene tres ventajas clave para este proyecto:
> Async nativo — las llamadas a OCR, al LLM y a las tres APIs de enriquecimiento son operaciones I/O. Con async las hacemos sin bloquear el servidor.
> Documentación automática — genera Swagger/OpenAPI automáticamente desde los tipos Python. Para un prototipo académico eso ahorra tiempo.
> Pydantic integrado — validación de tipos fuerte en la capa de datos sin código adicional.
> Flask no tiene async nativo en la misma versión. Django es más complejo de configurar para una API pura."

---

## PREGUNTA 8 — "¿Qué limitaciones tiene el sistema?"

> "Las principales son tres:
> Calidad de imagen: si la portada está desenfocada, doblada o muy oscura, el OCR baja de 40% de confianza y la extracción falla. El sistema necesita fotos razonablemente nítidas.
> Documentos internos: normas técnicas y manuales empresariales con formatos no estándar tienen menor precisión porque los modelos de enriquecimiento no los conocen.
> Velocidad con LLM local: Qwen2.5:7b local en CPU tarda 30-60 segundos. El fallback funciona, pero es lento para uso masivo."

---

## PREGUNTA 9 — "¿Qué es un agente de IA? ¿Por qué llaman a esto un agente?"

> "Un agente de IA es un sistema que percibe su entorno, toma decisiones y actúa para lograr un objetivo.
> CatalogIA percibe: la imagen de la portada.
> Decide: qué motor OCR usar, si usar enriquecimiento online, qué valor asignar a cada campo cuando hay múltiples fuentes.
> Actúa: extrae, estructura y guarda el resultado.
> También tiene memoria — guarda el historial en base de datos — y tiene la capacidad de delegar a humanos cuando su confianza es baja.
> Técnicamente es un agente simple de pipeline determinístico, no un agente con razonamiento autónomo como un ReAct agent. Pero cumple la definición básica: percepción, decisión y acción orientados a un objetivo."

---

## PREGUNTA 10 — "¿Cómo validan que el sistema funciona?"

> "Tres niveles de validación:
> Técnica: script evaluate.py que corre el pipeline sobre 5 imágenes con ground truth conocido y calcula precisión por campo. Las gráficas están en la presentación.
> Funcional: el tab de Métricas en la aplicación muestra en tiempo real cobertura de campos, distribución por tipo de documento y confianza OCR promedio.
> Con cliente: el documento de retroalimentación firmado por el coordinador de Gestión Documental de Postobón S.A., que evaluó el sistema directamente y lo calificó 4/5."

---

## TIPS DE PRESENTACIÓN

**Si la demo tarda:**
> "Mientras el pipeline procesa, lo que está pasando internamente es: primero Tesseract extrae el texto de la imagen, luego GLM-5.1 analiza ese texto y devuelve los 16 campos en JSON, y finalmente el backend busca datos faltantes en Google Books."

**Si el LLM falla en vivo:**
> "El modelo cloud no está disponible en este momento — el sistema automáticamente cambia a Qwen2.5 local. Esto es exactamente el comportamiento de fallback que diseñamos para garantizar operación sin internet."

**Si preguntan algo que no saben:**
> "Esa es una pregunta técnica que nos llevaría a profundizar en [tema]. Lo que sí puedo confirmar es [lo que sí saben]. ¿Le parece si lo detallamos después de la sustentación?"

**Tiempo:** Si van rápido, profundicen en la demo. Si van lento, compríman resultados y cierre.
