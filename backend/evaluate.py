"""
CatalogIA — Script de Evaluación de Rendimiento
Uso: python evaluate.py
Genera métricas por campo + gráficas PNG en data/evaluation/
"""
import asyncio
import json
import os
import sys
from pathlib import Path

sys.path.insert(0, os.path.dirname(__file__))

# Ground truth para las 5 imágenes de prueba
GROUND_TRUTH = {
    "test_libro_ia.jpg": {
        "titulo": "Introducción a la Inteligencia Artificial",
        "subtitulo": "Un Enfoque Moderno",
        "autores": "Russell, Stuart; Norvig, Peter",
        "anio": 2021,
        "editorial": "Pearson Educación",
        "lugar": "Madrid",
        "tipo_doc": "Libro",
        "edicion_vol": "4a ed.",
        "idioma": "Español",
    },
    "test_libro_dl.jpg": {
        "titulo": "Deep Learning",
        "autores": "Goodfellow, Ian; Bengio, Yoshua; Courville, Aaron",
        "anio": 2016,
        "editorial": "MIT Press",
        "lugar": "Cambridge",
        "tipo_doc": "Libro",
        "idioma": "Inglés",
    },
    "test_tesis.jpg": {
        "titulo": "Aplicación de Machine Learning en la Predicción de Demanda Empresarial",
        "subtitulo": "Trabajo de Grado",
        "autores": "Reyes Oliveros, César Armando",
        "anio": 2026,
        "editorial": "Universidad Autónoma de Occidente",
        "lugar": "Cali, Colombia",
        "tipo_doc": "Tesis",
        "idioma": "Español",
    },
    "test_norma.jpg": {
        "titulo": "NTC-ISO 9001:2015",
        "subtitulo": "Sistemas de Gestión de la Calidad",
        "autores": "ICONTEC",
        "editorial": "ICONTEC",
        "lugar": "Bogotá, Colombia",
        "tipo_doc": "Norma",
        "idioma": "Español",
    },
    "test_manual.jpg": {
        "titulo": "Manual de Operaciones Postobón S.A.",
        "subtitulo": "Procesos de Línea de Producción",
        "autores": "Postobón S.A.",
        "anio": 2024,
        "editorial": "Postobón S.A.",
        "lugar": "Medellín, Colombia",
        "tipo_doc": "Manual",
        "edicion_vol": "3a ed.",
        "idioma": "Español",
    },
}

EVAL_FIELDS = [
    "titulo", "subtitulo", "autores", "anio", "editorial",
    "lugar", "tipo_doc", "edicion_vol", "idioma",
]

OUTPUT_DIR = Path(__file__).parent / "data" / "evaluation"
TEST_IMAGES_DIR = Path(__file__).parent / "data" / "test_images"


def normalize(val) -> str:
    if val is None:
        return ""
    return str(val).strip().lower()


def field_match(pred, truth, field: str) -> bool:
    """True si el campo extraído coincide con el ground truth."""
    p = normalize(pred)
    t = normalize(truth)

    if not t:
        return True  # no hay ground truth para este campo → no penaliza
    if not p:
        return False

    if field == "anio":
        return p == t

    # Para strings: coincidencia exacta o contención bidireccional
    if p == t:
        return True
    if t in p or p in t:
        return True

    # Similitud de palabras clave (al menos 50% de palabras importantes coinciden)
    p_words = set(p.replace(";", " ").split())
    t_words = set(t.replace(";", " ").split())
    if len(t_words) > 0:
        overlap = len(p_words & t_words) / len(t_words)
        return overlap >= 0.5

    return False


async def run_pipeline_on_image(image_path: Path) -> dict:
    """Corre OCR + extracción LLM sobre una imagen."""
    from app.services.ocr import extract_text_from_image
    from app.services.extract import extract_fields_from_ocr

    image_bytes = image_path.read_bytes()

    print(f"  OCR: {image_path.name}...", end=" ", flush=True)
    ocr_result = await extract_text_from_image(image_bytes)
    print(f"[{ocr_result['engine']} | conf={ocr_result['confidence']:.2f}]", end=" ", flush=True)

    print("LLM...", end=" ", flush=True)
    fields = await extract_fields_from_ocr(ocr_result["full_text"], ocr_result["confidence"])
    print("OK")

    return {
        "fields": fields,
        "ocr_engine": ocr_result["engine"],
        "ocr_confidence": ocr_result["confidence"],
        "ocr_text": ocr_result["full_text"],
    }


async def evaluate():
    """Evaluación completa del pipeline."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Generar imágenes de prueba si no existen
    if not TEST_IMAGES_DIR.exists() or not list(TEST_IMAGES_DIR.glob("*.jpg")):
        print("Generando imágenes de prueba...")
        import generate_test_images
        generate_test_images.main()

    results = {}
    field_scores: dict[str, list[bool]] = {f: [] for f in EVAL_FIELDS}
    ocr_confidences = []

    print("\n=== EVALUACIÓN CatalogIA ===\n")

    for img_name, ground_truth in GROUND_TRUTH.items():
        img_path = TEST_IMAGES_DIR / img_name
        if not img_path.exists():
            print(f"  SKIP: {img_name} (imagen no encontrada)")
            continue

        try:
            pipeline_result = await run_pipeline_on_image(img_path)
        except Exception as e:
            print(f"  ERROR en {img_name}: {e}")
            continue

        extracted = pipeline_result["fields"]
        ocr_confidences.append(pipeline_result["ocr_confidence"])

        # Evaluar cada campo
        doc_scores = {}
        for field in EVAL_FIELDS:
            truth_val = ground_truth.get(field)
            pred_val = extracted.get(field)
            match = field_match(pred_val, truth_val, field) if truth_val is not None else None
            doc_scores[field] = {
                "truth": truth_val,
                "predicted": pred_val,
                "match": match,
            }
            if match is not None:
                field_scores[field].append(match)

        results[img_name] = {
            "scores": doc_scores,
            "ocr_engine": pipeline_result["ocr_engine"],
            "ocr_confidence": pipeline_result["ocr_confidence"],
        }

    # Calcular precisión por campo
    field_accuracy = {}
    for field in EVAL_FIELDS:
        scores = field_scores[field]
        if scores:
            field_accuracy[field] = round(sum(scores) / len(scores) * 100, 1)
        else:
            field_accuracy[field] = 0.0

    overall_accuracy = round(
        sum(field_accuracy.values()) / len(field_accuracy), 1
    )
    avg_ocr_conf = round(sum(ocr_confidences) / len(ocr_confidences) * 100, 1) if ocr_confidences else 0

    print(f"\n=== RESULTADOS ===")
    print(f"Precisión global: {overall_accuracy}%")
    print(f"Confianza OCR promedio: {avg_ocr_conf}%")
    print(f"\nPrecisión por campo:")
    for field, acc in sorted(field_accuracy.items(), key=lambda x: -x[1]):
        bar = "█" * int(acc / 5)
        print(f"  {field:<15} {acc:>5.1f}% {bar}")

    # Guardar JSON
    report = {
        "overall_accuracy": overall_accuracy,
        "avg_ocr_confidence": avg_ocr_conf,
        "field_accuracy": field_accuracy,
        "documents_evaluated": len(results),
        "details": results,
    }
    report_path = OUTPUT_DIR / "evaluation_report.json"
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2))
    print(f"\nReporte guardado: {report_path}")

    # Generar gráficas
    generate_charts(field_accuracy, overall_accuracy, avg_ocr_conf)

    return report


def generate_charts(field_accuracy: dict, overall_accuracy: float, avg_ocr_conf: float):
    """Genera gráficas PNG para la presentación."""
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        import matplotlib.patches as mpatches
        import numpy as np
    except ImportError:
        print("matplotlib no disponible — omitiendo gráficas")
        return

    plt.rcParams.update({
        "font.family": "DejaVu Sans",
        "figure.facecolor": "#0f1117",
        "axes.facecolor": "#1a1d2e",
        "axes.edgecolor": "#3a3d5c",
        "axes.labelcolor": "#e0e0f0",
        "xtick.color": "#b0b0d0",
        "ytick.color": "#b0b0d0",
        "text.color": "#e0e0f0",
        "grid.color": "#2a2d4a",
        "grid.linestyle": "--",
        "grid.alpha": 0.5,
    })

    fields = list(field_accuracy.keys())
    accuracies = [field_accuracy[f] for f in fields]
    colors = ["#4ade80" if a >= 80 else "#facc15" if a >= 60 else "#f87171" for a in accuracies]

    # ── Gráfica 1: Precisión por campo ──
    fig, ax = plt.subplots(figsize=(10, 5))
    bars = ax.barh(fields, accuracies, color=colors, height=0.6)
    ax.set_xlim(0, 110)
    ax.set_xlabel("Precisión (%)", fontsize=12)
    ax.set_title(f"CatalogIA — Precisión por campo de catalogación\n(Precisión global: {overall_accuracy}%)", fontsize=13, pad=12)
    ax.axvline(x=overall_accuracy, color="#60a5fa", linestyle="--", linewidth=1.5, alpha=0.8, label=f"Promedio: {overall_accuracy}%")

    for bar, val in zip(bars, accuracies):
        ax.text(val + 1, bar.get_y() + bar.get_height() / 2, f"{val:.0f}%", va="center", fontsize=10)

    legend_elements = [
        mpatches.Patch(color="#4ade80", label="≥ 80%  Bueno"),
        mpatches.Patch(color="#facc15", label="60–79% Aceptable"),
        mpatches.Patch(color="#f87171", label="< 60%  Bajo"),
    ]
    ax.legend(handles=legend_elements, loc="lower right", fontsize=9, framealpha=0.3)
    ax.grid(axis="x")
    plt.tight_layout()
    fig.savefig(OUTPUT_DIR / "chart_field_accuracy.png", dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"  Gráfica guardada: {OUTPUT_DIR / 'chart_field_accuracy.png'}")

    # ── Gráfica 2: Resumen de métricas ──
    fig, axes = plt.subplots(1, 2, figsize=(10, 4))
    fig.suptitle("CatalogIA — Resumen de Rendimiento", fontsize=14, fontweight="bold")

    # Gauge-style para precisión global
    ax1 = axes[0]
    theta = np.linspace(0, np.pi, 100)
    r = 1.0
    ax1.set_aspect("equal")
    ax1.set_xlim(-1.3, 1.3)
    ax1.set_ylim(-0.2, 1.3)
    ax1.axis("off")

    # Arco de fondo
    ax1.plot(np.cos(theta), np.sin(theta), color="#2a2d4a", linewidth=20, solid_capstyle="round")
    # Arco de valor
    frac = overall_accuracy / 100
    theta_fill = np.linspace(0, np.pi * frac, 100)
    color_gauge = "#4ade80" if overall_accuracy >= 80 else "#facc15" if overall_accuracy >= 60 else "#f87171"
    ax1.plot(np.cos(theta_fill), np.sin(theta_fill), color=color_gauge, linewidth=20, solid_capstyle="round")
    ax1.text(0, 0.2, f"{overall_accuracy:.0f}%", ha="center", va="center", fontsize=28, fontweight="bold", color=color_gauge)
    ax1.text(0, -0.1, "Precisión Global", ha="center", fontsize=11, color="#b0b0d0")

    # OCR Confidence pie-style bar
    ax2 = axes[1]
    ax2.set_aspect("equal")
    ax2.set_xlim(-1.3, 1.3)
    ax2.set_ylim(-0.2, 1.3)
    ax2.axis("off")

    frac2 = avg_ocr_conf / 100
    theta_fill2 = np.linspace(0, np.pi * frac2, 100)
    ax2.plot(np.cos(theta), np.sin(theta), color="#2a2d4a", linewidth=20, solid_capstyle="round")
    color_ocr = "#60a5fa"
    ax2.plot(np.cos(theta_fill2), np.sin(theta_fill2), color=color_ocr, linewidth=20, solid_capstyle="round")
    ax2.text(0, 0.2, f"{avg_ocr_conf:.0f}%", ha="center", va="center", fontsize=28, fontweight="bold", color=color_ocr)
    ax2.text(0, -0.1, "Confianza OCR Promedio", ha="center", fontsize=11, color="#b0b0d0")

    plt.tight_layout()
    fig.savefig(OUTPUT_DIR / "chart_summary.png", dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"  Gráfica guardada: {OUTPUT_DIR / 'chart_summary.png'}")

    print(f"\nGráficas generadas en: {OUTPUT_DIR}")


if __name__ == "__main__":
    asyncio.run(evaluate())
