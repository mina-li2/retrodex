import os
import socket
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.engine.url import make_url
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is not set. Copy .env.example to .env and fill in your Neon connection string."
    )


def _build_connect_args(database_url: str) -> dict:
    """
    Resolve the DB hostname to an IPv4 address up front and pass it to psycopg2
    directly. Windows resolves hostnames via IPv6 first by default; if IPv6
    isn't actually usable on the network, every single connection attempt
    eats a ~5-6s timeout before falling back to IPv4. Skipping that lookup
    here avoids paying that tax on every reconnect.
    """
    try:
        url = make_url(database_url)
        if not url.host:
            return {}
        ipv4 = socket.getaddrinfo(url.host, None, socket.AF_INET)[0][4][0]
        return {"hostaddr": ipv4, "host": url.host}
    except Exception:
        return {}


engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=280,
    connect_args=_build_connect_args(DATABASE_URL),
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()