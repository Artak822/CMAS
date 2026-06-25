"""Создаёт тестового администратора, если его ещё нет в БД."""
from __future__ import annotations

import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import SessionLocal
from app.main import _hash_password
from app.models import UserORM

ADMIN_EMAIL = "admin@cmas.local"
ADMIN_PASSWORD = "admin123"


def main() -> None:
    db = SessionLocal()
    try:
        existing = db.query(UserORM).filter(UserORM.email == ADMIN_EMAIL).first()
        if existing:
            print(f"Seed: {ADMIN_EMAIL} уже есть (id={existing.id})")
            return

        user = UserORM(
            full_name="Администратор CMAS",
            phone="+79990000000",
            birth_date=date(1990, 1, 1),
            email=ADMIN_EMAIL,
            role="admin",
            room_id=None,
            password_hash=_hash_password(ADMIN_PASSWORD),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"Seed: создан {ADMIN_EMAIL} / {ADMIN_PASSWORD} (id={user.id})")
    finally:
        db.close()


if __name__ == "__main__":
    main()
