"""
Router: Documents — CRUD de documentos catalogados.
Usa SQLAlchemy ORM con sesiones inyectadas por FastAPI.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models.schemas import Document, DocumentResponse, DocumentUpdate

router = APIRouter()


@router.get("/", summary="Listar documentos", response_model=dict)
async def list_documents(
    skip: int = 0,
    limit: int = 50,
    status: Optional[str] = None,
    tipo_doc: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Lista documentos catalogados con paginación y filtros."""
    query = db.query(Document)
    
    if status:
        query = query.filter(Document.status == status)
    if tipo_doc:
        query = query.filter(Document.tipo_doc == tipo_doc)
    
    total = query.count()
    documents = query.order_by(Document.created_at.desc()).offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "documents": [DocumentResponse.model_validate(d).model_dump() for d in documents]
    }


@router.get("/stats", summary="Estadísticas de documentos")
async def get_stats(db: Session = Depends(get_db)):
    """Estadísticas generales del catálogo."""
    from sqlalchemy import func
    
    total = db.query(Document).count()
    
    # Por estado
    status_counts = dict(
        db.query(Document.status, func.count(Document.id))
        .group_by(Document.status)
        .all()
    )
    
    # Por tipo
    type_counts = dict(
        db.query(Document.tipo_doc, func.count(Document.id))
        .filter(Document.tipo_doc.isnot(None))
        .group_by(Document.tipo_doc)
        .all()
    )
    
    # Confianza promedio
    avg_conf = db.query(func.avg(Document.ocr_confidence)).scalar()
    
    return {
        "total_documents": total,
        "by_status": status_counts,
        "by_type": type_counts,
        "avg_confidence": round(avg_conf, 3) if avg_conf else None
    }


@router.get("/{doc_id}", summary="Obtener documento por ID", response_model=DocumentResponse)
async def get_document(doc_id: str, db: Session = Depends(get_db)):
    """Obtiene un documento específico por su ID."""
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(404, "Documento no encontrado")
    return DocumentResponse.model_validate(doc)


@router.patch("/{doc_id}", summary="Actualizar documento", response_model=DocumentResponse)
async def update_document(
    doc_id: str,
    updates: DocumentUpdate,
    db: Session = Depends(get_db)
):
    """Actualiza campos de un documento (validación humana)."""
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(404, "Documento no encontrado")
    
    # Aplicar solo campos no-nulos
    update_data = updates.model_dump(exclude_unset=True, exclude_none=True)
    for key, value in update_data.items():
        setattr(doc, key, value)
    
    # Si se está validando, cambiar status
    if updates.validated_by:
        doc.status = "validated"
    
    db.commit()
    db.refresh(doc)
    return DocumentResponse.model_validate(doc)


@router.post("/{doc_id}/validate", summary="Validar documento", response_model=DocumentResponse)
async def validate_document(
    doc_id: str,
    action: str = "approve",  # approve, reject
    corrections: Optional[dict] = None,
    validator: str = "human",
    db: Session = Depends(get_db)
):
    """
    Validación humana: aprobar o rechazar un documento.
    - approve: marca como validado con las correcciones
    - reject: marca como rechazado
    """
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(404, "Documento no encontrado")
    
    if action == "approve":
        # Aplicar correcciones si las hay
        if corrections:
            for key, value in corrections.items():
                if hasattr(doc, key) and value is not None:
                    setattr(doc, key, value)
        doc.status = "validated"
        doc.validated_by = validator
    elif action == "reject":
        doc.status = "rejected"
        doc.validated_by = validator
    else:
        raise HTTPException(400, f"Acción no válida: {action}. Use 'approve' o 'reject'")
    
    db.commit()
    db.refresh(doc)
    return DocumentResponse.model_validate(doc)


@router.delete("/{doc_id}", summary="Eliminar documento")
async def delete_document(doc_id: str, db: Session = Depends(get_db)):
    """Elimina un documento del catálogo."""
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(404, "Documento no encontrado")
    
    db.delete(doc)
    db.commit()
    return {"status": "deleted", "doc_id": doc_id}