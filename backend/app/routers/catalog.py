"""
Router: Catalogación — Pipeline principal de upload + extracción + enriquecimiento.
Este es el endpoint core del sistema.
"""
import uuid
import os
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session

from app.database import get_db
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