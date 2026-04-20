---
agent: Ares
status: active
type: project
created: 2026-04-19
course: "INTELIGENCIA ARTIFICIAL (535212) - Grupo 2"
---

# Agente de IA para la Biblioteca UAO — Prototipo

## Contexto
- **Curso:** Inteligencia Artificial (535212) — Grupo 2
- **Profesor:** Hugo Alberto Gallo Machado (hagallo@uao.edu.co)
- **Equipo:** César Armando Reyes Oliveros + Juan Pablo Maya Escudero
- **Institución:** CRAI-Biblioteca UAO → **CAMBIO: ahora datos empresariales**

## ⚠️ Cambio importante (2026-04-19)
La UAO **nunca dio acceso** a los datos de la biblioteca. El proyecto se readapta:
- **Antes:** Catalogación de libros con datos del CRAI-Biblioteca UAO
- **Ahora:** Catalogación de documentos empresariales con los siguientes campos:

| # | Campo | Tipo |
|---|-------|------|
| 1 | ID (Parte No.) | Identificador único |
| 2 | Título | Texto |
| 3 | Subtítulo | Texto |
| 4 | Autor(es) | Lista |
| 5 | Año | Número |
| 6 | Mes/Día | Fecha |
| 7 | Editorial | Texto |
| 8 | Lugar | Texto |
| 9 | Tipo de Doc. | Categoría |
| 10 | Edición/Vol. | Texto |
| 11 | Palabras clave | Lista |
| 12 | Resumen | Texto largo |
| 13 | Idioma | Categoría |
| 14 | Páginas | Número/rango |
| 15 | Formato | Categoría |
| 16 | Licencia | Categoría |

- El enfoque human-in-the-loop y la arquitectura se mantienen
- Se reutiliza la propuesta v2 como base, adaptando orígenes de datos y caso de uso

## Arquitectura original (a adaptar)
1. **Ingesta** — Fuente de datos → OCR/parser
2. **Extracción** — NLP + reglas de normalización
3. **Motor IA** — Sugerencia de metadatos + detección de faltantes
4. **Validación** — Revisión humana (approbar/corregir/rechazar)
5. **Salida** — Registro estructurado exportable

## Stack técnico
- **Backend:** Python + FastAPI
- **OCR:** Tesseract / PaddleOCR (extracción desde PDFs/imágenes)
- **NLP:** Ollama local (glm-4 / qwen) + reglas bibliográficas
- **Frontend:** React + TypeScript + Vite + Tailwind
- **Base de datos:** SQLite para piloto (migrable a Supabase)
- **Formatos de salida:** JSON, CSV
- **Validación:** Human-in-the-loop (approbar/corregir/rechazar)

## Sustentaciones esta semana
- **Mar 21 abr** — Sustentación proyecto IA
- **Mié 22 abr** — 2da fecha sustentación
- **Jue 23 abr** — Examen 2 de IA (8:30am)

## Archivos
- `Agente_IA_Biblioteca_UAO_empresarial_v2.pptx` — Propuesta original (marzo 2026)

## Próximos pasos
1. [ ] Confirmar con el profesor el origen de los datos empresariales
2. [ ] Crear repositorio git + esqueleto del proyecto
3. [ ] Definir esquema JSON/SQLite con los 16 campos
4. [ ] Implementar endpoint de ingesta (upload PDF/imagen)
5. [ ] Implementar pipeline OCR → NLP → extracción de campos
6. [ ] Crear interfaz de validación humana
7. [ ] Preparar presentación para sustentación (mar 21)