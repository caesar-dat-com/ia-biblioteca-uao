"""
Script de setup — Instala dependencias y verifica el entorno.
Uso: python setup.py
"""
import subprocess
import sys
import os

def run(cmd, desc=""):
    if desc:
        print(f"\n{'='*50}")
        print(f"  {desc}")
        print(f"{'='*50}")
    print(f"$ {cmd}")
    result = subprocess.run(cmd, shell=True)
    if result.returncode != 0:
        print(f"❌ Error ejecutando: {cmd}")
        return False
    return True

def main():
    print("🔧 Setup — CatalogIA Backend")
    print("=" * 50)
    
    # 1. Crear venv si no existe
    if not os.path.exists(".venv"):
        print("\n📦 Creando entorno virtual...")
        run("python -m venv .venv", "Entorno virtual")
    else:
        print("✅ Entorno virtual ya existe")
    
    # 2. Instalar dependencias
    print("\n📥 Instalando dependencias...")
    pip_cmd = ".venv\\Scripts\\pip.exe" if sys.platform == "win32" else ".venv/bin/pip"
    run(f"{pip_cmd} install -r requirements.txt", "Dependencias Python")
    
    # 3. Verificar Ollama
    print("\n🤖 Verificando Ollama...")
    ollama_ok = run("ollama list", "Ollama")
    if not ollama_ok:
        print("⚠️  Ollama no está corriendo. Instálalo desde https://ollama.com")
        print("   Luego ejecuta: ollama pull glm-5.1:cloud")
    
    # 4. Verificar Tesseract (fallback OCR)
    print("\n🔍 Verificando Tesseract...")
    tesseract_ok = run("tesseract --version", "Tesseract OCR")
    if not tesseract_ok:
        print("⚠️  Tesseract no instalado. Descárgalo de:")
        print("   https://github.com/UB-Mannheim/tesseract/wiki")
    
    # 5. Crear directorios
    print("\n📁 Creando directorios...")
    os.makedirs("data/uploads", exist_ok=True)
    os.makedirs("data/db", exist_ok=True)
    print("✅ Directorios creados")
    
    # 6. Probar importaciones
    print("\n🧪 Probando importaciones...")
    try:
        import fastapi
        print(f"✅ FastAPI {fastapi.__version__}")
    except ImportError:
        print("❌ FastAPI no instalado")
    
    try:
        import sqlalchemy
        print(f"✅ SQLAlchemy {sqlalchemy.__version__}")
    except ImportError:
        print("❌ SQLAlchemy no instalado")
    
    try:
        import pydantic
        print(f"✅ Pydantic {pydantic.__version__}")
    except ImportError:
        print("❌ Pydantic no instalado")
    
    try:
        from paddleocr import PaddleOCR
        print("✅ PaddleOCR instalado")
    except ImportError:
        print("⚠️  PaddleOCR no instalado — se usará Tesseract como fallback")
    
    try:
        import pytesseract
        print("✅ pytesseract instalado")
    except ImportError:
        print("⚠️  pytesseract no instalado")
    
    print("\n" + "=" * 50)
    print("🎉 Setup completado!")
    print()
    print("Para iniciar el servidor:")
    print("  python run.py")
    print()
    print("O con uvicorn directamente:")
    print("  uvicorn app.main:app --reload --port 8000")
    print()
    print("API docs: http://localhost:8000/docs")
    print("=" * 50)

if __name__ == "__main__":
    main()