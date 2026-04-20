"""
Configuración de base de datos — SQLite para prototipo.
Usa SQLAlchemy ORM con sesión inyectable via FastAPI dependency.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.config import DATABASE_URL

# Engine de SQLAlchemy
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # SQLite requiere esto
    echo=False
)

# Sesión
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Base declarativa para modelos ORM."""
    pass


def get_db():
    """Dependency para inyectar sesión de BD en endpoints FastAPI."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Crear todas las tablas si no existen."""
    # Importar modelos para que Base los registre
    from app.models.schemas import Document  # noqa: F401
    Base.metadata.create_all(bind=engine)