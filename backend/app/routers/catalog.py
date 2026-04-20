"""Router: Catalogación - Endpoint principal de upload + extracción"""
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.ocr import extract_text_from_image
from app.services.extract import extract_fields_from_ocr, classify_document
from app.services.enrich import enrich_document
from app.database import get_db, init_db
import uuid
import base64

router = APIRouter()


@router.post("/upload", summary="Subir portada y extraer metadatos")
async def upload_and_extract(image: UploadFile = File(...)):
    """
    Pipeline completo:
    1. Recibe imagen de portada
    2. OCR extrae texto
    3. IA extrae campos estructurados
    4. Enriquecimiento online busca datos faltantes
    5. Clasifica el documento
    6. Retorna resultado para validación humana
    """
    # Leer imagen
    image_bytes = await image.read()
    if len(image_bytes) > 10 * 1024 * 1024:  # 10MB max
        raise HTTPException(400, "Imagen demasiado grande (máx 10MB)")
    
    # Paso 1: OCR
    ocr_result = await extract_text_from_image(image_bytes)
    
    # Paso 2: Extracción con IA
    fields = await extract_fields_from_ocr(
        ocr_result["full_text"],
        ocr_result["confidence"]
    )
    
    # Paso 3: Enriquecimiento online (si tenemos título)
    title = fields.get("titulo") or ocr_result["full_text"][:100]
    enrich_data = {}
    if title:
        enrich_data = await enrich_document(
            title=title,
            authors=fields.get("autores", ""),
            isbn=""  # TODO: detectar ISBN del OCR
        )
    
    # Paso 4: Combinar OCR + IA + Enriquecimiento (prioridad: IA > enriquecimiento)
    combined = {}
    all_fields = [
        "titulo", "subtitulo", "autores", "anio", "mes_dia", "editorial",
        "lugar", "tipo_doc", "edicion_vol", "palabras_clave", "resumen",
        "idioma", "paginas", "formato", "licencia"
    ]
    
    for field in all_fields:
        # Prioridad: IA > Enriquecimiento > null
        val = fields.get(field)
        if not val and enrich_data.get(field):
            val = enrich_data[field]
            combined[f"{field}_fuente"] = "enriquecimiento"
        elif val:
            combined[f"{field}_fuente"] = "ocr_ia"
        else:
            combined[f"{field}_fuente"] = None
        combined[field] = val
    
    # Paso 5: Clasificación
    combined["ubicacion"] = await classify_document(combined)
    combined["ubicacion_fuente"] = "clasificacion_auto"
    
    # Metadatos del proceso
    combined["_id"] = str(uuid.uuid4())[:8]
    combined["_ocr_text"] = ocr_result["full_text"]
    combined["_ocr_confidence"] = ocr_result["confidence"]
    combined["_ocr_engine"] = ocr_result["engine"]
    combined["_enrichment_sources"] = enrich_data.get("_sources", {})
    
    return {"status": "success", "data": combined}


@router.post("/validate/{doc_id}", summary="Validar registro catalogado")
async def validate_document(doc_id: str, corrections: dict):
    """
    Revisión humana: aceptar, corregir o rechazar.
    Guarda en BD con las correcciones.
    """
    db = await get_db()
    
    # TODO: Implementar guardado con correcciones
    # Por ahora retorna confirmación
    return {
        "status": "validated",
        "doc_id": doc_id,
        "corrections_applied": len(corrections),
        "fields_corrected": list(corrections.keys())
    }