"""OCR Service - Extraccion de texto desde imagenes de portada."""
import os
import io
import tempfile
from pathlib import Path
from PIL import Image

from app.config import OCR_ENGINE

# Deshabilitar oneDNN/MKL-DNN para evitar bug en PaddlePaddle 3.x en Linux
os.environ.setdefault("FLAGS_use_mkldnn", "0")
os.environ.setdefault("PADDLE_USE_ONEDNN", "0")

# Asegurar Tesseract en PATH (Windows)
_tesseract_dir = r"C:\Program Files\Tesseract-OCR"
if _tesseract_dir not in os.environ.get("Path", ""):
    os.environ["Path"] = _tesseract_dir + ";" + os.environ.get("Path", "")


async def extract_text_from_image(image_bytes: bytes) -> dict:
    """
    Extrae texto de una imagen de portada.
    Retorna dict con texto crudo, lineas y confianza.
    Intenta PaddleOCR primero, Tesseract como fallback.
    """
    if OCR_ENGINE == "tesseract":
        return await _extract_with_tesseract(image_bytes)

    try:
        return await _extract_with_paddleocr(image_bytes)
    except Exception as e:
        print(f"[WARN] PaddleOCR fallo ({e}), usando Tesseract como fallback")
        return await _extract_with_tesseract(image_bytes)


async def _extract_with_paddleocr(image_bytes: bytes) -> dict:
    """Extraer texto usando PaddleOCR 3.x."""
    from paddleocr import PaddleOCR

    # PaddleOCR 3.x API — sin use_angle_cls/use_gpu/show_log
    ocr = PaddleOCR(lang='es')

    img = Image.open(io.BytesIO(image_bytes))

    with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp:
        img.save(tmp.name, format='JPEG', quality=95)
        tmp_path = tmp.name

    try:
        results = list(ocr.predict(tmp_path))
    finally:
        os.unlink(tmp_path)

    lines = []
    for page_result in results:
        # PaddleOCR 3.x: resultado tiene atributos rec_texts, rec_scores, dt_polys
        if hasattr(page_result, 'rec_texts') and page_result.rec_texts:
            for text, score, poly in zip(
                page_result.rec_texts,
                page_result.rec_scores,
                page_result.dt_polys,
            ):
                if text and score > 0.3:
                    bbox = [poly[0], poly[2]]  # top-left, bottom-right
                    lines.append({
                        "text": text,
                        "confidence": round(float(score), 3),
                        "bbox": bbox,
                        "position": _bbox_to_position(poly, img.size),
                    })

    full_text = "\n".join([l["text"] for l in lines])
    avg_confidence = sum([l["confidence"] for l in lines]) / max(len(lines), 1)

    return {
        "full_text": full_text,
        "lines": lines,
        "confidence": round(avg_confidence, 3),
        "engine": "paddleocr",
        "line_count": len(lines)
    }


async def _extract_with_tesseract(image_bytes: bytes) -> dict:
    """Extraer texto usando Tesseract (fallback confiable)."""
    import pytesseract

    img = Image.open(io.BytesIO(image_bytes))

    # Texto completo
    full_text = pytesseract.image_to_string(img, lang='spa+eng')

    # Datos detallados con confianza
    data = pytesseract.image_to_data(img, lang='spa+eng', output_type=pytesseract.Output.DICT)

    lines = []
    for i in range(len(data['text'])):
        text = data['text'][i].strip()
        conf = int(data['conf'][i])
        if text and conf > 30:
            lines.append({
                "text": text,
                "confidence": round(conf / 100.0, 3),
                "bbox": [
                    data['left'][i], data['top'][i],
                    data['left'][i] + data['width'][i], data['top'][i] + data['height'][i]
                ],
                "position": _estimate_position(data['top'][i], img.size[1])
            })

    avg_confidence = sum([l["confidence"] for l in lines]) / max(len(lines), 1)

    return {
        "full_text": full_text.strip(),
        "lines": lines,
        "confidence": round(avg_confidence, 3),
        "engine": "tesseract",
        "line_count": len(lines)
    }


def _bbox_to_position(bbox, img_size) -> str:
    """Convierte bounding box a posicion aproximada en la pagina."""
    y_center = (bbox[0][1] + bbox[2][1]) / 2
    y_ratio = y_center / max(img_size[1], 1)

    if y_ratio < 0.2:
        return "top"
    elif y_ratio < 0.5:
        return "upper-middle"
    elif y_ratio < 0.8:
        return "lower-middle"
    else:
        return "bottom"


def _estimate_position(top: int, height: int) -> str:
    """Estima posicion vertical del texto."""
    ratio = top / max(height, 1)
    if ratio < 0.2:
        return "top"
    elif ratio < 0.5:
        return "upper-middle"
    elif ratio < 0.8:
        return "lower-middle"
    return "bottom"