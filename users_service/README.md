# Users Service — документация

Микросервис **Users Service** (`users_service`) отвечает за учётных записей, аутентификацию (JWT) и роли в системе CMAS (общежитие). Это первый сервис в архитектуре: «Пользователи и роли».

Клиенты обычно обращаются к нему **через API Gateway** (`http://localhost:8000`), но сервис также доступен напрямую на порту **8001**.

---

## Роль в системе

```
[Frontend] → [API Gateway :8000] → [Users Service :8001] → [PostgreSQL users_db]
                      ↓
            Rooms / Requests (другие сервисы)
```

| Задача | Где реализовано |
|--------|-----------------|
| Регистрация, логин, JWT | `app/main.py` |
| Хранение профиля и `room_id` | `app/models.py` + БД |
| Схема БД и эволюция | `alembic/versions/` |
| Подключение к PostgreSQL | `app/database.py` |
| Прокси и проверка JWT на входе | `gateway/app/main.py` (вне этой папки) |

Сервис **не** заселяет студентов в комнаты — только сохраняет `room_id`. Логика комнат — в `rooms_service`; Gateway синхронизирует оба сервиса при заселении.

---

## Структура папок и файлов

```
users_service/
├── app/                          # Код приложения (FastAPI)
│   ├── __init__.py               # Маркер пакета Python
│   ├── main.py                   # HTTP API, JWT, бизнес-логика
│   ├── models.py                 # ORM-модель таблицы users
│   └── database.py               # Подключение к БД, сессии SQLAlchemy
├── alembic/                      # Миграции схемы БД
│   ├── env.py                    # Настройка Alembic под этот проект
│   ├── script.py.mako            # Шаблон для новых миграций
│   └── versions/
│       ├── 0001_initial.py       # Создание таблицы users
│       └── 0002_add_phone_birth_date.py
├── tests/                        # Автотесты (pytest)
│   └── test_users.py
├── alembic.ini                   # Конфиг Alembic (пути, логи)
├── conftest.py                   # Настройка pytest (SQLite in-memory)
├── Dockerfile                    # Образ Docker (сборка из корня репо)
└── README.md                     # Этот файл
```

Зависимости Python лежат в **корне репозитория**: `requirements.txt` (общий для всех микросервисов).

---

## `app/` — приложение FastAPI

### `app/__init__.py`

Пустой маркер пакета. Позволяет импортировать `app.main`, `app.models` и т.д.

### `app/database.py`

**Назначение:** единая точка подключения к PostgreSQL и выдача сессий для эндпоинтов.

| Элемент | Назначение |
|---------|------------|
| `get_database_url()` | Собирает URL из `DATABASE_URL` или `USERS_DB_*` |
| `engine` | SQLAlchemy Engine с `pool_pre_ping=True` |
| `SessionLocal` | Фабрика сессий |
| `Base` | Базовый класс для ORM-моделей |
| `get_db()` | Dependency FastAPI: открывает сессию на запрос, закрывает после |

Переменные окружения (из `.env` / docker-compose):

| Переменная | Пример (Docker) | Описание |
|------------|-----------------|----------|
| `USERS_DB_HOST` | `users_db` | Хост PostgreSQL |
| `USERS_DB_PORT` | `5432` | Порт внутри сети Docker |
| `USERS_DB_NAME` | `users_db` | Имя БД |
| `USERS_DB_USER` | `postgres` | Пользователь |
| `USERS_DB_PASSWORD` | `postgres` | Пароль |
| `DATABASE_URL` | — | Альтернатива (например Railway); `postgresql://` автоматически заменяется на `postgresql+psycopg2://` |

### `app/models.py`

**Назначение:** описание таблицы `users` для SQLAlchemy 2.0 (declarative).

Класс `UserORM` → таблица `users`:

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | Integer, PK | Идентификатор |
| `full_name` | String(255) | ФИО |
| `phone` | String(32) | Телефон |
| `birth_date` | Date | Дата рождения |
| `email` | String(255), unique | Email (логин) |
| `role` | String(32) | `student`, `commandant`, `admin` |
| `room_id` | Integer, nullable | ID комнаты (ссылка на rooms_service, без FK в БД) |
| `password_hash` | String(255) | Хеш пароля (не хранится открытый текст) |

Отдельной таблицы `roles` нет — роль хранится строкой в колонке `role`.

### `app/main.py`

**Назначение:** весь HTTP API, Pydantic-схемы, JWT, хеширование паролей, метрики.

#### Инициализация

- `FastAPI` с title «Users Service», CORS `*`
- `Instrumentator` — эндпоинт **`/metrics`** для Prometheus
- JWT: `JWT_SECRET_KEY`, `JWT_ALGORITHM`, `JWT_EXPIRE_MINUTES` (по умолчанию 1440 мин)
- Пароли: `passlib` + предварительный SHA-256 в hex (`_hash_password` / `_verify_password`)

#### Pydantic-модели (вход/выход API)

| Модель | Использование |
|--------|----------------|
| `UserRole` | Enum ролей |
| `UserCreate` | Тело `POST /register` |
| `UserOut` | Ответ без пароля |
| `LoginIn` | Тело `POST /login` |
| `TokenOut` | JWT + `user` + `expires_in` |
| `AssignRoomIn` | Тело `PUT /users/{id}/room` |

#### Зависимости (Depends)

- `get_db` — сессия БД
- `get_current_user` — декодирует Bearer JWT, загружает пользователя; иначе **401**

#### Эндпоинты

| Метод | Путь | Auth | Описание |
|-------|------|------|----------|
| GET | `/` | нет | `{"service": "Users Service", "status": "running"}` |
| GET | `/health` | нет | Healthcheck |
| POST | `/register` | нет | Создание пользователя, **201** |
| POST | `/login` | нет | JWT + данные пользователя |
| GET | `/users` | JWT | Список; query `room_id` — фильтр |
| GET | `/users/{user_id}` | JWT | Один пользователь |
| PUT | `/users/{user_id}/room` | JWT | Установить/сбросить `room_id` |
| GET | `/metrics` | нет | Prometheus (через instrumentator) |

**JWT payload** при логине: `sub` (id), `email`, `role`, `iat`, `exp`.

**Ошибки:** 401 (неверный токен/логин), 404 (нет пользователя), 409 (email занят), 422 (валидация Pydantic).

Документация OpenAPI: http://localhost:8001/docs

---

## `alembic/` — миграции базы данных

Alembic меняет схему PostgreSQL **версионно**, без ручного SQL в проде.

### `alembic.ini`

Корневой конфиг: где лежат скрипты (`script_location = alembic`), логирование. URL в файле — запасной для локального запуска; в Docker реальный URL подставляется в `alembic/env.py` из `DATABASE_URL` / `USERS_DB_*`.

### `alembic/env.py`

Связывает Alembic с приложением:

1. Импортирует `DATABASE_URL`, `Base` из `app.database`
2. Импортирует `app.models` — чтобы Alembic видел метаданные таблиц
3. `target_metadata = Base.metadata`
4. Режимы `offline` / `online` для `alembic upgrade` / `downgrade`

### `alembic/script.py.mako`

Шаблон для команды `alembic revision -m "описание"` — генерирует новый файл в `versions/`.

### `alembic/versions/0001_initial.py`

**Revision:** `0001_initial` (первая миграция).

Создаёт таблицу `users`: `id`, `full_name`, `email`, `role`, `room_id`, `password_hash` + индексы на `id` и уникальный `email`.

### `alembic/versions/0002_add_phone_birth_date.py`

**Revision:** `0002_add_phone_birth_date` ← после `0001_initial`.

Добавляет `phone`, `birth_date`; для существующих строк подставляет заглушки, затем делает колонки `NOT NULL`.

Цепочка: `0001` → `0002` → `head`.

При старте в Docker:

```bash
alembic upgrade head
```

(см. `docker-compose.yml`, `command` сервиса `users_service`).

---

## `tests/` и `conftest.py`

### `conftest.py`

Перед тестами:

- `DATABASE_URL=sqlite:///:memory:` — БД в памяти, без PostgreSQL
- Добавляет корень `users_service` в `sys.path`

### `tests/test_users.py`

Pytest + `TestClient` FastAPI:

- Подменяет `get_db` на SQLite-сессию
- Классы: `TestHealth`, `TestRegister`, `TestLogin`, `TestListUsers`, `TestGetUser`, `TestAssignRoom`

Запуск из корня репозитория (если настроен pytest):

```bash
pytest users_service/tests -v
```

---

## `Dockerfile`

Сборка **из корня репозитория** (`context: .` в docker-compose):

1. `COPY requirements.txt` → `pip install`
2. `COPY users_service/ .` → весь код сервиса в `/app`
3. `EXPOSE 8001`
4. `CMD`: миграции + uvicorn (в compose команда переопределена с `--reload`)

В контейнере рабочая директория `/app`, модуль запускается как `app.main:app`.

---

## Связь с Docker Compose (корень репо)

Фрагмент из `docker-compose.yml`:

| Сервис | Контейнер | Порт с хоста |
|--------|-----------|--------------|
| `users_db` | `cmas_users_db` | **5433** → 5432 |
| `users_service` | `cmas_users_service` | **8001** |

- `env_file: .env` — все `USERS_DB_*`, `JWT_*`, `USERS_SERVICE_PORT`
- `depends_on: users_db` (healthy)
- Volume `./users_service:/app` — hot-reload кода на хосте

---

## Связь с API Gateway

В `gateway/app/main.py`:

- `USERS_SERVICE_URL` (по умолчанию `http://users_service:8001`)
- Прокси: `/register`, `/login`, `/users`, `/users/{id}`, `/users/{id}/room`
- Gateway проверяет JWT на своей стороне и передаёт заголовок `Authorization` в users_service для защищённых маршрутов

Прямой вызов сервиса (отладка):

```bash
curl -X POST http://localhost:8001/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cmas.local","password":"admin123"}'
```

---

## Поток данных (примеры)

### Регистрация

```
Client → POST /register (JSON UserCreate)
  → main.register()
  → проверка уникальности email
  → UserORM + password_hash → commit
  → UserOut (без пароля)
```

### Логин

```
Client → POST /login
  → найти user по email, verify password
  → jwt.encode(payload) → TokenOut
```

### Назначение комнаты (из Gateway после assign в rooms)

```
Gateway → PUT /users/{id}/room {"room_id": 5}
  → JWT → get_current_user
  → обновить user.room_id → UserOut
```

---

## Переменные окружения (сводка)

| Переменная | Назначение |
|------------|------------|
| `USERS_DB_HOST`, `USERS_DB_PORT`, `USERS_DB_NAME`, `USERS_DB_USER`, `USERS_DB_PASSWORD` | PostgreSQL |
| `DATABASE_URL` | Полный URL (опционально) |
| `JWT_SECRET_KEY`, `JWT_ALGORITHM`, `JWT_EXPIRE_MINUTES` | Токены (должны совпадать с Gateway) |
| `USERS_SERVICE_PORT` | Порт на хосте (8001) |

---

## Полезные команды

```bash
# Миграции внутри контейнера
docker compose exec users_service alembic upgrade head

# Логи
docker compose logs users_service -f

# Новая миграция (локально, из папки users_service)
alembic revision -m "описание изменения"
alembic upgrade head
```

---

## Чего нет в этом сервисе (намеренно)

- Отдельной таблицы ролей и RBAC на уровне эндпоинтов (роль есть в JWT, детальные права — в Gateway/клиенте)
- Foreign key на `rooms` — только `room_id` как число
- gRPC, очереди сообщений — только REST
- Собственного `requirements.txt` — общий файл в корне CMAS

---

## Команда и версия API

- OpenAPI title: **Users Service**, version `1.0.0`
- Стек: Python 3.11, FastAPI, SQLAlchemy 2, Alembic, python-jose, passlib, psycopg2 (через requirements корня)
