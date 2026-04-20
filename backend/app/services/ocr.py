"""OCR Service - Extracción de texto desde imágenes de portada"""
import os
from pathlib import Path
from PIL import Image
import io

# OCR engine selection
OCR_ENGINE = os.getenv("OCR_ENGINE", "paddleocr")  # paddleocr | tesseract


async def extract_text_from_image(image_bytes: bytes) -> dict:
    """
    Extrae texto de una imagen de portada.
    Retorna dict con texto crudo y bounding boxes.
    """
    if OCR_ENGINE == "paddleocr":
        return await _extract_with_paddleocr(image_bytes)
    else:
        return await _extract_with_tesseract(image_bytes)


async def _extract_with_paddleocr(image_bytes: bytes) -> dict:
    """Extraer texto usando PaddleOCR (mejor para español, soporta GPU/CPU)"""
    try:
        from paddleocr import PaddleOCR
        ocr = PaddleOCR(use_angle_cls=True, lang='es', use_gpu=False, show_log=False)
        
        img = Image.open(io.BytesIO(image_bytes))
        temp_path = "_temp_upload.jpg"
        img.save(temp_path)
        
        result = ocr.ocr(temp_path, cls=True)
        
        os.remove(temp_path)
        
        lines = []
        for idx in range(len(result)):
            res = result[idx]
            if res:
                for line in res:
                    text = line[1][0]
                    confidence = line[1][1]
                    bbox = line[0]
                    lines.append({
                        "text": text,
                        "confidence": confidence,
                        "bbox": bbox,
                        "position": _bbox_to_position(bbox, img.size)
                    })
        
        full_text = " ".join([l["text"] for l in lines])
        avg_confidence = sum([l["confidence"] for l in lines]) / max(len(lines), 1)
        
        return {
            "full_text": full_text,
            "lines": lines,
            "confidence": avg_confidence,
            "engine": "paddleocr"
        }
    except ImportError:
        # Fallback a tesseract si paddleocr no está instalado
        return await _extract_with_tesseract(image_bytes)


async def _extract_with_tesseract(image_bytes: bytes) -> dict:
    """Extraer texto usando Tesseract (fallback)"""
    import pytesseract
    
    img = Image.open(io.BytesIO(image_bytes))
    data = pytesseract.image_to_data(img, lang='spa+eng', output_type=pytesseract.Output.DICT)
    
    lines = []
    current_line = []
    for i in range(len(data['text'])):
        text = data['text'][i].strip()
        conf = int(data['conf'][i])
        if text and conf > 30:
            current_line.append({
                "text": text,
                "confidence": conf / 100.0,
                "bbox": [
                    data['left'][i], data['top'][i],
                    data['left'][i] + data['width'][i], data['top'][i] + data['height'][i]
                ],
                "position": _estimate_position(data['top'][i], img.size[1])
            })
    
    full_text = " ".join([l["text"] for l in lines])
    avg_confidence = sum([l["confidence"] for l in lines]) / max(len(lines), 1)
    
    return {
        "full_text": full_text,
        "lines": lines,
        "confidence": avg_confidence,
        "engine": "tesseract"
    }


def _bbox_to_position(bbox, img_size) -> str:
    """Convierte bounding box a posición aproximada en la página"""
    y_center = (bbox[0][1] + bbox[2][1]) / 2
    y_ratio = y_center / img_size[1]
    
    if y_ratio < 0.2:
        return "top"
    elif y_ratio < 0.5:
        return "upper-middle"
    elif y_ratio < 0.8:
        return "lower-middle"
    else:
        return "bottom"


def _estimate_position(top: int, height: int) -> str:
    """Estima posición vertical del texto"""
    ratio = top / max(height, 1)
    if ratio < 0.2:
        return "top"
    elif ratio < 0.5:
        return "upper-middle"
    elif ratio < 0.8:
        return "lower-middle"
    return "bottom"