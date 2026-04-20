"""Router: Documents - CRUD de documentos catalogados"""
from fastapi import APIRouter, HTTPException
from app.database import get_db

router = APIRouter()


@router.get("/", summary="Listar documentos")
async def list_documents(skip: int = 0, limit: int = 50):
    """Lista documentos catalogados con paginación"""
    db = await get_db()
    cursor = await db.execute("SELECT * FROM documents ORDER BY fecha_creacion DESC LIMIT ? OFFSET ?", (limit, skip))
    rows = await cursor.fetchall()
    await db.close()
    return {"documents": [dict(row) for row in rows]}


@router.get("/{doc_id}", summary="Obtener documento por ID")
async def get_document(doc_id: str):
    """Obtiene un documento específico"""
    db = await get_db()
    cursor = await db.execute("SELECT * FROM documents WHERE id = ?", (doc_id,))
    row = await cursor.fetchone()
    await db.close()
    if not row:
        raise HTTPException(404, "Documento no encontrado")
    return dict(row)


@router.delete("/{doc_id}", summary="Eliminar documento")
async def delete_document(doc_id: str):
    """Elimina un documento catalogado"""
    db = await get_db()
    await db.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
    await db.commit()
    await db.close()
    return {"status": "deleted", "doc_id": doc_id}