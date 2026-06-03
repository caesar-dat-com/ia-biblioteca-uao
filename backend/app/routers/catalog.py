"""
Router: Catalogación — Pipeline principal de upload + extracción + enriquecimiento.
Este es el endpoint core del sistema.
"""
import uuid
import json
import os
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db, SessionLocal
from app.models.schemas import Document, DocumentResponse
from app.services.ocr import extract_text_from_image
from app.services.extract import extract_fields_from_ocr, classify_document
from app.services.enrich import enrich_document
from app.config import UPLOAD_DIR, MAX_UPLOAD_SIZE_MB

router = APIRouter()

# Todos los campos de catalogación
CATALOG_FIELDS = [
    "titulo", "subtitulo", "autores", "anio", "mes_dia", "editorial",
    "lugar", "tipo_doc", "edicion_vol", "palabras_clave", "resumen",
    "idioma", "paginas", "formato", "licencia"
]


@router.post("/upload", summary="Subir portada y extraer metadatos", response_model=dict)
async def upload_and_extract(
    image: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Pipeline completo de catalogación:
    1. Recibe imagen de portada (PNG, JPG, WEBP)
    2. OCR extrae texto
    3. LLM extrae campos estructurados
    4. Enriquecimiento online busca datos faltantes
    5. Clasifica el documento
    6. Guarda en BD y retorna para validación humana
    """
    # Validar tipo de archivo
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(400, "Solo se aceptan imágenes (PNG, JPG, WEBP)")
    
    # Leer imagen
    image_bytes = await image.read()
    max_bytes = MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(image_bytes) > max_bytes:
        raise HTTPException(400, f"Imagen demasiado grande (máx {MAX_UPLOAD_SIZE_MB}MB)")
    
    # Guardar imagen original
    file_ext = Path(image.filename or "upload.jpg").suffix or ".jpg"
    filename = f"{uuid.uuid4().hex[:12]}{file_ext}"
    filepath = UPLOAD_DIR / filename
    filepath.write_bytes(image_bytes)
    
    # Crear registro inicial en BD
    doc = Document(
        titulo="Procesando...",
        status="uploaded",
        source_image=str(filepath),
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    
    doc_id = doc.id
    
    try:
        # ===== PASO 1: OCR =====
        doc.status = "extracting"
        db.commit()
        
        ocr_result = await extract_text_from_image(image_bytes)
        
        # ===== PASO 2: Extracción con IA =====
        fields = await extract_fields_from_ocr(
            ocr_text=ocr_result["full_text"],
            ocr_confidence=ocr_result["confidence"]
        )
        
        # ===== PASO 3: Enriquecimiento online =====
        doc.status = "enriching"
        db.commit()
        
        title = fields.get("titulo") or ocr_result["full_text"][:100]
        authors = fields.get("autores", "")
        enrich_data = {}
        
        if title and title != "Pendiente":
            enrich_data = await enrich_document(
                title=title,
                authors=authors,
                isbn=""  # TODO: detectar ISBN del OCR
            )
        
        # ===== PASO 4: Merge OCR + IA + Enriquecimiento =====
        combined = {}
        field_sources = {}
        
        for field in CATALOG_FIELDS:
            # Prioridad: IA > Enriquecimiento > null
            ia_val = fields.get(field)
            enrich_val = enrich_data.get(field) if enrich_data else None
            
            if ia_val:
                combined[field] = ia_val
                field_sources[field] = "ocr_ia"
            elif enrich_val:
                combined[field] = enrich_val
                field_sources[field] = "enriquecimiento"
            else:
                combined[field] = None
                field_sources[field] = None
        
        # ===== PASO 5: Clasificación =====
        classification = await classify_document(combined)
        combined["tipo_doc"] = combined.get("tipo_doc") or classification.split(". ")[1] if ". " in classification else classification
        
        # ===== PASO 6: Guardar en BD =====
        for field in CATALOG_FIELDS:
            if combined.get(field) is not None:
                setattr(doc, field, combined[field])
        
        doc.status = "enriched"
        doc.ocr_text = ocr_result["full_text"]
        doc.ocr_engine = ocr_result["engine"]
        doc.ocr_confidence = ocr_result["confidence"]
        doc.confidence = fields.get("confidence", {})
        doc.extraction_method = "llm_cloud"
        doc.enriched_from = enrich_data.get("_sources", []) if enrich_data else []
        
        db.commit()
        db.refresh(doc)
        
        return {
            "status": "success",
            "data": DocumentResponse.model_validate(doc).model_dump(),
            "field_sources": field_sources,
            "classification": classification,
            "ocr_engine": ocr_result["engine"],
            "ocr_confidence": round(ocr_result["confidence"], 3),
            "enrichment_sources": enrich_data.get("_sources", []) if enrich_data else [],
        }
    
    except Exception as e:
        # En caso de error, marcar documento como fallido
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if doc:
            doc.status = "error"
            doc.ocr_text = f"ERROR: {str(e)}"
            db.commit()
        
        raise HTTPException(500, f"Error procesando imagen: {str(e)}")


@router.get("/stream/{doc_id}", summary="Pipeline SSE — eventos en tiempo real")
async def stream_pipeline(doc_id: str):
    """
    SSE stream del pipeline completo.
    Cliente recibe: ocr_start → ocr_done → llm_start → field_found* → llm_done
                    → enrich_start → enrich_done → complete | error
    """
    async def event_generator():
        db = SessionLocal()
        try:
            doc = db.query(Document).filter(Document.id == doc_id).first()
            if not doc:
                yield f"data: {json.dumps({'event': 'error', 'message': 'Documento no encontrado'})}\n\n"
                return
            if not doc.source_image or not Path(doc.source_image).exists():
                yield f"data: {json.dumps({'event': 'error', 'message': 'Imagen no encontrada'})}\n\n"
                return

            image_bytes = Path(doc.source_image).read_bytes()

            # ── Paso 1: OCR ──
            yield f"data: {json.dumps({'event': 'ocr_start'})}\n\n"
            ocr_result = await extract_text_from_image(image_bytes)
            yield f"data: {json.dumps({'event': 'ocr_done', 'confidence': round(ocr_result['confidence'], 3), 'engine': ocr_result['engine'], 'chars': len(ocr_result['full_text'])})}\n\n"

            # ── Paso 2: LLM ──
            yield f"data: {json.dumps({'event': 'llm_start'})}\n\n"
            fields = await extract_fields_from_ocr(ocr_result["full_text"], ocr_result["confidence"])
            conf = fields.get("confidence", {})

            for field in CATALOG_FIELDS:
                val = fields.get(field)
                if val:
                    yield f"data: {json.dumps({'event': 'field_found', 'field': field, 'confidence': round(conf.get(field, 0.5), 3)})}\n\n"

            fields_found = sum(1 for f in CATALOG_FIELDS if fields.get(f))
            yield f"data: {json.dumps({'event': 'llm_done', 'fields_found': fields_found})}\n\n"

            # ── Paso 3: Enriquecimiento ──
            yield f"data: {json.dumps({'event': 'enrich_start'})}\n\n"
            title = fields.get("titulo") or ocr_result["full_text"][:100]
            enrich_data = {}
            if title and title != "Pendiente":
                enrich_data = await enrich_document(title=title, authors=fields.get("autores", ""))

            sources = enrich_data.get("_sources", []) if enrich_data else []
            yield f"data: {json.dumps({'event': 'enrich_done', 'sources': sources})}\n\n"

            # ── Merge + guardar ──
            combined = {}
            field_sources = {}
            for field in CATALOG_FIELDS:
                ia_val = fields.get(field)
                enrich_val = enrich_data.get(field) if enrich_data else None
                if ia_val:
                    combined[field] = ia_val
                    field_sources[field] = "ocr_ia"
                elif enrich_val:
                    combined[field] = enrich_val
                    field_sources[field] = "enriquecimiento"
                else:
                    combined[field] = None
                    field_sources[field] = None

            classification = await classify_document(combined)
            combined["tipo_doc"] = combined.get("tipo_doc") or (
                classification.split(". ")[1] if ". " in classification else classification
            )

            for field in CATALOG_FIELDS:
                if combined.get(field) is not None:
                    setattr(doc, field, combined[field])

            doc.status = "enriched"
            doc.ocr_text = ocr_result["full_text"]
            doc.ocr_engine = ocr_result["engine"]
            doc.ocr_confidence = ocr_result["confidence"]
            doc.confidence = conf
            doc.extraction_method = "llm_cloud"
            doc.enriched_from = sources

            db.commit()
            db.refresh(doc)

            doc_data = DocumentResponse.model_validate(doc).model_dump(mode="json")
            yield f"data: {json.dumps({'event': 'complete', 'data': doc_data, 'field_sources': field_sources})}\n\n"

        except Exception as e:
            db.rollback()
            yield f"data: {json.dumps({'event': 'error', 'message': str(e)})}\n\n"
        finally:
            db.close()

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/upload-only", summary="Subir imagen sin procesar")
async def upload_only(
    image: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Sube una imagen y crea registro, sin ejecutar el pipeline."""
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(400, "Solo se aceptan imágenes")
    
    image_bytes = await image.read()
    max_bytes = MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(image_bytes) > max_bytes:
        raise HTTPException(400, f"Imagen demasiado grande (máx {MAX_UPLOAD_SIZE_MB}MB)")
    
    file_ext = Path(image.filename or "upload.jpg").suffix or ".jpg"
    filename = f"{uuid.uuid4().hex[:12]}{file_ext}"
    filepath = UPLOAD_DIR / filename
    filepath.write_bytes(image_bytes)
    
    doc = Document(
        titulo="Pendiente de extracción",
        status="uploaded",
        source_image=str(filepath),
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    
    return {
        "status": "uploaded",
        "doc_id": doc.id,
        "message": "Imagen subida. Use POST /api/catalog/process/{doc_id} para procesar."
    }


@router.post("/process/{doc_id}", summary="Ejecutar pipeline sobre documento existente")
async def process_document(
    doc_id: str,
    db: Session = Depends(get_db)
):
    """Ejecuta el pipeline completo (OCR + IA + enriquecimiento) sobre un documento ya subido."""
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(404, "Documento no encontrado")
    
    if not doc.source_image:
        raise HTTPException(400, "Documento no tiene imagen asociada")
    
    filepath = Path(doc.source_image)
    if not filepath.exists():
        raise HTTPException(400, f"Imagen no encontrada: {filepath}")
    
    image_bytes = filepath.read_bytes()
    
    try:
        doc.status = "extracting"
        db.commit()
        
        ocr_result = await extract_text_from_image(image_bytes)
        fields = await extract_fields_from_ocr(ocr_result["full_text"], ocr_result["confidence"])
        
        doc.status = "enriching"
        db.commit()
        
        title = fields.get("titulo") or ocr_result["full_text"][:100]
        enrich_data = {}
        if title:
            enrich_data = await enrich_document(title=title, authors=fields.get("autores", ""))
        
        # Merge
        for field in CATALOG_FIELDS:
            ia_val = fields.get(field)
            enrich_val = enrich_data.get(field) if enrich_data else None
            if ia_val:
                setattr(doc, field, ia_val)
            elif enrich_val:
                setattr(doc, field, enrich_val)
        
        classification = await classify_document({f: getattr(doc, f, None) for f in CATALOG_FIELDS})
        
        doc.status = "enriched"
        doc.ocr_text = ocr_result["full_text"]
        doc.ocr_engine = ocr_result["engine"]
        doc.ocr_confidence = ocr_result["confidence"]
        doc.confidence = fields.get("confidence", {})
        doc.extraction_method = "llm_cloud"
        doc.enriched_from = enrich_data.get("_sources", []) if enrich_data else []
        
        db.commit()
        db.refresh(doc)
        
        return {
            "status": "success",
            "data": DocumentResponse.model_validate(doc).model_dump(),
            "classification": classification,
        }
    
    except Exception as e:
        doc.status = "error"
        doc.ocr_text = f"ERROR: {str(e)}"
        db.commit()
        raise HTTPException(500, f"Error procesando: {str(e)}")