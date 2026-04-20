"""
Genera imágenes de portada de ejemplo para testing del OCR.
Uso: python generate_test_images.py
"""
from PIL import Image, ImageDraw, ImageFont
import os

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "data", "test_images")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Colores
BG_COLORS = [(20, 60, 120), (120, 20, 20), (20, 100, 60), (80, 40, 100), (100, 80, 20)]
TEXT_COLOR = (255, 255, 255)
SUBTITLE_COLOR = (200, 200, 200)

TEST_COVERS = [
    {
        "filename": "test_libro_ia.jpg",
        "title": "Introducción a la\nInteligencia Artificial",
        "subtitle": "Un Enfoque Moderno — 4a Edición",
        "author": "Stuart Russell\nPeter Norvig",
        "publisher": "Pearson Educación • 2021",
        "bg_color": BG_COLORS[0],
    },
    {
        "filename": "test_libro_dl.jpg",
        "title": "Deep Learning",
        "subtitle": "",
        "author": "Ian Goodfellow\nYoshua Bengio\nAaron Courville",
        "publisher": "MIT Press • 2016",
        "bg_color": BG_COLORS[1],
    },
    {
        "filename": "test_tesis.jpg",
        "title": "Aplicación de Machine\nLearning en la Predicción\nde Demanda Empresarial",
        "subtitle": "Trabajo de Grado — Ingeniería de Datos e IA",
        "author": "César Armando\nReyes Oliveros",
        "publisher": "Universidad Autónoma de Occidente\nCali, Colombia — 2026",
        "bg_color": BG_COLORS[2],
    },
    {
        "filename": "test_norma.jpg",
        "filename": "test_norma.jpg",
        "title": "NTC-ISO 9001:2015",
        "subtitle": "Sistemas de Gestión de la Calidad\nRequisitos",
        "author": "ICONTEC",
        "publisher": "Bogotá, Colombia",
        "bg_color": BG_COLORS[3],
    },
    {
        "filename": "test_manual.jpg",
        "title": "Manual de Operaciones\nPostobón S.A.",
        "subtitle": "Procesos de Línea de Producción\n3a Edición",
        "author": "Postobón S.A.",
        "publisher": "Medellín, Colombia — 2024",
        "bg_color": BG_COLORS[4],
    },
]


def create_cover(cover_data, size=(600, 900)):
    """Crea una imagen de portada simulada."""
    img = Image.new("RGB", size, cover_data["bg_color"])
    draw = ImageDraw.Draw(img)
    
    # Intentar cargar fuente, si no existe usar default
    try:
        font_title = ImageFont.truetype("arial.ttf", 36)
        font_subtitle = ImageFont.truetype("arial.ttf", 20)
        font_author = ImageFont.truetype("arial.ttf", 22)
        font_publisher = ImageFont.truetype("arial.ttf", 16)
    except OSError:
        font_title = ImageFont.load_default()
        font_subtitle = ImageFont.load_default()
        font_author = ImageFont.load_default()
        font_publisher = ImageFont.load_default()
    
    y_offset = 120
    
    # Título
    draw.multiline_text(
        (50, y_offset), cover_data["title"],
        fill=TEXT_COLOR, font=font_title, spacing=8
    )
    
    # Calcular altura del título para posicionar subtítulo
    title_bbox = draw.multiline_textbbox((0, 0), cover_data["title"], font=font_title)
    y_offset += (title_bbox[3] - title_bbox[1]) + 30
    
    # Subtítulo
    if cover_data["subtitle"]:
        draw.multiline_text(
            (50, y_offset), cover_data["subtitle"],
            fill=SUBTITLE_COLOR, font=font_subtitle, spacing=6
        )
        sub_bbox = draw.multiline_textbbox((0, 0), cover_data["subtitle"], font=font_subtitle)
        y_offset += (sub_bbox[3] - sub_bbox[1]) + 40
    
    # Línea decorativa
    draw.line([(50, 650), (550, 650)], fill=SUBTITLE_COLOR, width=2)
    
    # Autor
    draw.multiline_text(
        (50, 680), cover_data["author"],
        fill=TEXT_COLOR, font=font_author, spacing=6
    )
    
    # Editorial
    draw.multiline_text(
        (50, 820), cover_data["publisher"],
        fill=SUBTITLE_COLOR, font=font_publisher, spacing=4
    )
    
    return img


def main():
    print("🖼️  Generando imágenes de prueba para OCR...")
    
    for cover in TEST_COVERS:
        filename = cover["filename"]
        img = create_cover(cover)
        filepath = os.path.join(OUTPUT_DIR, filename)
        img.save(filepath, "JPEG", quality=95)
        print(f"  ✅ {filepath} ({img.size[0]}x{img.size[1]})")
    
    print(f"\n✅ {len(TEST_COVERS)} imágenes generadas en {OUTPUT_DIR}")
    print("   Úsalas para probar el upload en el frontend.")


if __name__ == "__main__":
    main()