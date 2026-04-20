"""
Script de seed — Crea documentos de ejemplo en la BD para demo.
Uso: python seed.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, init_db
from app.models.schemas import Document

SAMPLE_DOCUMENTS = [
    {
        "parte_no": "DOC-001",
        "titulo": "Introducción a la Inteligencia Artificial",
        "subtitulo": "Un Enfoque Moderno",
        "autores": "Russell, Stuart; Norvig, Peter",
        "anio": 2021,
        "mes_dia": None,
        "editorial": "Pearson Educación",
        "lugar": "Madrid, España",
        "tipo_doc": "Libro",
        "edicion_vol": "4a ed.",
        "palabras_clave": "inteligencia artificial; machine learning; deep learning; redes neuronales",
        "resumen": "Texto fundamental en el campo de la IA que cubre desde búsqueda y razonamiento hasta aprendizaje automático y robótica.",
        "idioma": "Español",
        "paginas": "1132",
        "formato": "Impreso",
        "licencia": "Propietaria",
        "status": "validated",
        "ocr_engine": "paddleocr",
        "ocr_confidence": 0.92,
        "extraction_method": "llm_cloud",
        "enriched_from": ["google_books"],
        "validated_by": "cesar",
    },
    {
        "parte_no": "DOC-002",
        "titulo": "Deep Learning",
        "subtitulo": None,
        "autores": "Goodfellow, Ian; Bengio, Yoshua; Courville, Aaron",
        "anio": 2016,
        "mes_dia": "Noviembre",
        "editorial": "MIT Press",
        "lugar": "Cambridge, MA",
        "tipo_doc": "Libro",
        "edicion_vol": None,
        "palabras_clave": "deep learning; redes neuronales; optimización; redes convolucionales",
        "resumen": "Libro de referencia en deep learning que cubre fundamentos matemáticos, redes convolucionales, redes recurrentes y métodos generativos.",
        "idioma": "Inglés",
        "paginas": "800",
        "formato": "Digital",
        "licencia": "Propietaria",
        "status": "enriched",
        "ocr_engine": "paddleocr",
        "ocr_confidence": 0.88,
        "extraction_method": "llm_cloud",
        "enriched_from": ["google_books", "open_library"],
        "validated_by": None,
    },
    {
        "parte_no": "DOC-003",
        "titulo": "Tesis: Aplicación de Machine Learning en la Predicción de Demanda Empresarial",
        "subtitulo": None,
        "autores": "Reyes Oliveros, César Armando",
        "anio": 2026,
        "mes_dia": "Abril",
        "editorial": "Universidad Autónoma de Occidente",
        "lugar": "Cali, Colombia",
        "tipo_doc": "Tesis",
        "edicion_vol": None,
        "palabras_clave": "machine learning; predicción; demanda; supply chain; ingeniería de datos",
        "resumen": "Tesis que explora la aplicación de modelos de machine learning para la predicción de demanda en contextos empresariales colombianos.",
        "idioma": "Español",
        "paginas": "85",
        "formato": "PDF",
        "licencia": None,
        "status": "uploaded",
        "ocr_engine": "tesseract",
        "ocr_confidence": 0.75,
        "extraction_method": "llm_cloud",
        "enriched_from": [],
        "validated_by": None,
    },
    {
        "parte_no": "DOC-004",
        "titulo": "NTC-ISO 9001:2015",
        "subtitulo": "Sistemas de Gestión de la Calidad — Requisitos",
        "autores": "ICONTEC",
        "anio": 2015,
        "editorial": "ICONTEC",
        "lugar": "Bogotá, Colombia",
        "tipo_doc": "Norma",
        "palabras_clave": "calidad; gestión; ISO; normatividad; requisitos",
        "resumen": "Norma técnica colombiana que establece los requisitos para un sistema de gestión de la calidad.",
        "idioma": "Español",
        "paginas": "28",
        "formato": "Impreso",
        "licencia": "Propietaria",
        "status": "extracting",
        "ocr_engine": "paddleocr",
        "ocr_confidence": 0.85,
        "extraction_method": "llm_cloud",
        "enriched_from": [],
        "validated_by": None,
    },
    {
        "parte_no": "DOC-005",
        "titulo": "Manual de Operaciones Postobón S.A.",
        "subtitulo": "Procesos de Línea de Producción",
        "autores": "Postobón S.A.",
        "anio": 2024,
        "editorial": "Postobón S.A.",
        "lugar": "Medellín, Colombia",
        "tipo_doc": "Manual",
        "edicion_vol": "3a ed.",
        "palabras_clave": "operaciones; producción; manufactura; calidad; Postobón",
        "resumen": "Manual interno de operaciones que detalla los procesos de línea de producción de Postobón S.A.",
        "idioma": "Español",
        "paginas": "145",
        "formato": "Digital",
        "licencia": "Propietaria",
        "status": "validated",
        "ocr_engine": "paddleocr",
        "ocr_confidence": 0.95,
        "extraction_method": "llm_cloud",
        "enriched_from": [],
        "validated_by": "juan_pablo",
    },
]


def seed(force=False):
    """Insertar documentos de ejemplo en la BD."""
    init_db()
    db = SessionLocal()
    
    # Verificar si ya hay datos
    existing = db.query(Document).count()
    if existing > 0:
        if force:
            db.query(Document).delete()
            db.commit()
        else:
            print(f"Ya hay {existing} documentos en la BD. Use --force para re-seed.")
            db.close()
            return
    
    for doc_data in SAMPLE_DOCUMENTS:
        doc = Document(**doc_data)
        db.add(doc)
    
    db.commit()
    db.close()
    
    print(f"OK: {len(SAMPLE_DOCUMENTS)} documentos de ejemplo insertados")
    print("  Estados: validated(2), enriched(1), extracting(1), uploaded(1)")
    print("  Tipos: Libro(2), Tesis(1), Norma(1), Manual(1)")


if __name__ == "__main__":
    force = "--force" in sys.argv or "-f" in sys.argv
    seed(force=force)