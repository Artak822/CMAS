from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="API Gateway",
    description="Единая точка входа для всех микросервисов",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "service": "API Gateway",
        "status": "running",
        "services": {
            "users": "http://localhost:8001",
            "rooms": "http://localhost:8002",
            "requests": "http://localhost:8003"
        }
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
