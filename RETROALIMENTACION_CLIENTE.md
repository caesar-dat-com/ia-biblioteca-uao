# Retroalimentación del Cliente — CatalogIA

**Proyecto:** CatalogIA — Agente IA para Catalogación Empresarial  
**Asignatura:** Inteligencia Artificial (535212) — Universidad Autónoma de Occidente  
**Equipo:** César Reyes · Juan Pablo Maya  
**Fecha de retroalimentación:** 28 de mayo de 2026  
**Cliente / Evaluador:** Andrés Felipe Montoya Ríos  
**Cargo / Empresa:** Coordinador de Gestión Documental — Postobón S.A.

---

## 1. Contexto de la evaluación

El cliente evaluó el sistema CatalogIA, que automatiza la catalogación de documentos empresariales mediante:
- OCR con PaddleOCR para extracción de texto de portadas
- Modelo de lenguaje GLM-5.1 para identificación de 16 campos bibliográficos
- Enriquecimiento automático con Google Books y Open Library
- Interfaz web para validación humana del resultado

---

## 2. Resultados evaluados

| Documento | Tipo | Campos correctos / 16 | Requirió corrección |
|-----------|------|----------------------|---------------------|
| Introducción a la Inteligencia Artificial (Russell & Norvig) | Libro | 11 / 16 | Sí — subtítulo y edición |
| Deep Learning (Goodfellow et al.) | Libro | 10 / 16 | Sí — lugar y páginas |
| Aplicación de ML en Predicción de Demanda (Tesis UAO) | Tesis | 13 / 16 | Mínima — palabras clave |
| NTC-ISO 9001:2015 — Sistemas de Gestión de Calidad | Norma | 9 / 16 | Sí — año y edición |
| Manual de Operaciones Postobón S.A. | Manual | 11 / 16 | Sí — páginas y licencia |

**Promedio:** 10.8 / 16 campos correctos por documento (67.5%)

---

## 3. Preguntas de evaluación

### 3.1 Utilidad del sistema
> ¿El sistema resuelve el problema de catalogación de documentos en el contexto empresarial?

- [ ] Totalmente (el sistema cubre todas las necesidades identificadas)
- [x] Mayormente (cubre la mayoría de las necesidades, con mejoras menores pendientes)
- [ ] Parcialmente (útil pero requiere mejoras significativas)
- [ ] No resuelve el problema planteado

**Comentarios:** El sistema resuelve el problema central de extracción y estructuración de metadatos. Para uso en Postobón sería necesario agregar integración con el sistema documental interno (OpenText) y soporte para documentos escaneados de baja calidad.

---

### 3.2 Precisión de la extracción
> ¿Los campos extraídos automáticamente son correctos o cercanos a correctos?

- [ ] Muy alta (> 80% de campos correctos sin intervención)
- [x] Alta (60–80% de campos correctos)
- [ ] Media (40–60% de campos correctos)
- [ ] Baja (< 40% de campos correctos)

**Campos con mayor precisión:** Título, tipo de documento, idioma, autores (en documentos con portada clara).

**Campos con menor precisión:** Número de páginas, licencia, edición/volumen (especialmente en normas técnicas).

---

### 3.3 Interfaz de usuario
> ¿La interfaz para validar y corregir catalogaciones es intuitiva?

- [ ] Muy intuitiva (no requiere entrenamiento)
- [x] Intuitiva (requiere breve explicación)
- [ ] Aceptable (curva de aprendizaje moderada)
- [ ] Difícil de usar

**Sugerencias de mejora:** Agregar instrucciones en pantalla al subir el primer documento. El anillo de confianza (confidence ring) es un elemento visual muy útil — mantenerlo. Sería valioso poder exportar los registros a Excel o CSV.

---

### 3.4 Velocidad de procesamiento
> ¿El tiempo de respuesta del sistema es aceptable para uso operacional?

- [ ] Excelente (< 10 segundos por documento)
- [x] Aceptable (10–30 segundos por documento)
- [ ] Lento (30–60 segundos, mejorable)
- [ ] Inaceptable (> 60 segundos)

---

### 3.5 Valor agregado del enriquecimiento automático
> ¿Los datos adicionales obtenidos de Google Books / Open Library son útiles?

- [x] Muy útiles (complementan significativamente la catalogación)
- [ ] Útiles (aportan datos relevantes en la mayoría de casos)
- [ ] Poco útiles (rara vez aportan datos relevantes)
- [ ] No útiles

---

## 4. Aplicabilidad empresarial

> ¿Implementaría o recomendaría este sistema en su organización o área de trabajo?

- [ ] Sí, tal como está (con despliegue en infraestructura propia)
- [x] Sí, con mejoras menores (especificar abajo)
- [ ] Posiblemente, requiere mejoras significativas
- [ ] No, por las siguientes razones:

**Justificación / Mejoras requeridas:** El sistema tiene un núcleo funcional sólido. Para implementación en Postobón se requeriría: (1) exportación a Excel/CSV compatible con el sistema documental actual, (2) soporte para documentos en formato físico escaneado (baja resolución), (3) perfil de administrador para gestionar el catálogo de tipos de documento propios de la compañía.

---

## 5. Fortalezas identificadas

1. Pipeline automatizado end-to-end: desde la foto hasta el registro estructurado, sin necesidad de intervención manual en cada paso.
2. El indicador de confianza por campo permite al usuario priorizar qué revisar — optimiza el tiempo de validación.
3. El enriquecimiento en cascada (Google Books → Open Library → Crossref) completa campos que el OCR no puede leer, especialmente útil para libros académicos.

---

## 6. Oportunidades de mejora

1. Mejorar precisión en documentos técnicos (normas, instructivos) que tienen formatos de portada no estándar.
2. Agregar exportación de catálogo en formatos CSV / Excel para integración con otros sistemas.
3. Capacidad de procesar lotes de documentos (múltiples imágenes a la vez) para digitalización masiva de archivos físicos.

---

## 7. Calificación global del sistema

> En una escala de 1 a 5, donde 5 es "excelente":

| Dimensión | Calificación (1–5) |
|-----------|-------------------|
| Precisión de extracción | 4 |
| Facilidad de uso | 4 |
| Velocidad | 4 |
| Utilidad práctica | 4 |
| **Promedio** | **4.0** |

---

## 8. Comentarios adicionales

El equipo demostró dominio técnico del sistema y capacidad para explicar las decisiones de diseño de forma clara. La arquitectura con fallbacks automáticos (Tesseract + Ollama local) garantiza operación sin depender de servicios de pago, lo cual es una ventaja importante para despliegue empresarial.

El sistema es un prototipo académico funcional con potencial real de aplicación. Con un ciclo adicional de desarrollo orientado a las mejoras señaladas, podría ser adoptado en entornos de gestión documental empresarial.

---

**Firma del cliente:** _A.F. Montoya R._  
**Fecha:** 28 / 05 / 2026

---

*Documento generado como soporte del Tercer Entregable — IA 535212 — UAO 2026-1S*
