# Agente de IA para Catalogación — Propuesta Original (v2)
*Extraído de la presentación PPTX el 2026-04-19*

---

## 1. Contexto y problema
La catalogación es técnica, repetitiva y crítica para la calidad del servicio bibliotecario.

**Dolores del proceso actual:**
- Captura manual exige tiempo y revisión permanente
- Variación en criterios genera inconsistencias
- Tiempo en tareas repetitivas reduce espacio para análisis

**Oportunidad:** Agente de IA que sugiera metadatos, detecte faltantes y apoye pre-catalogación con validación humana final.

---

## 2. Objetivo general
Diseñar e implementar un agente de IA que apoye la catalogación, automatizando extracción, normalización y sugerencia de metadatos con validación humana final.

**Incluye:** Lectura de fuentes, sugerencia de campos, pantalla de revisión
**No incluye:** Automatización total, integración productiva completa, cobertura más allá de libros

---

## 3. Metodología (5 fases)
1. **Diagnóstico** — Mapeo del proceso actual, cuellos de botella
2. **Diseño** — Definición funcional y técnica del agente
3. **Desarrollo** — Prototipo con OCR, NLP, reglas bibliográficas
4. **Piloto** — Pruebas con datos reales, medición de precisión
5. **Mejora** — Ajustes de prompts, reglas, interfaz, métricas

---

## 4. EDA teórico
**Fuentes:** Registros bibliográficos, portadas, páginas legales, índices, ISBN
**Variables:** Completitud, frecuencia de autores/editoriales, tasa de duplicados
**Preguntas:** ¿Qué campos se pueden inferir? ¿Dónde están los errores comunes?

---

## 5. Arquitectura
1. Ingesta → 2. Extracción (OCR+parser) → 3. Motor IA (NLP+reglas) → 4. Validación humana → 5. Salida (MARC21/JSON)

Capa transversal: Gobierno de datos, bitácora, trazabilidad, retroalimentación

---

## 6. Flujo de trabajo
Recepción → Lectura → Sugerencia → Validación → Publicación

---

## 7. Bases
- **Bibliotecológicas:** RDA, MARC 21, Dublin Core
- **Tecnológicas:** OCR, NLP/IA generativa, human-in-the-loop

---

## 8. Métricas de éxito
- Precisión de extracción por campo
- Reducción del tiempo de pre-catalogación
- % de sugerencias aceptadas sin cambios / con ajuste menor / con rechazo

---

## 9. Cronograma original (marzo 2026)
16-28 marzo: Definición alcance → Levantamiento → EDA → Arquitectura → Construcción → Exposición

---

## 10. Recomendaciones
1. Gobierno de datos (origen, limpieza, protección)
2. Métricas de éxito desde el inicio
3. Riesgos y ética (errores OCR, alucinaciones, sesgos)
4. Integración con sistema bibliotecario
5. UX del catalogador (evidencia visible, editar, aprobar)
6. Escalabilidad (tesis, revistas, audiovisual)

---

## 11. Equipo y roles
- **Hugo Alberto Gallo Machado:** Direccionamiento institucional y alcance
- **César Armando Reyes Oliveros:** Análisis, desarrollo, pruebas, documentación técnica
- **Juan Pablo Maya Escudero:** Modelado funcional, validación del flujo, apoyo implementación