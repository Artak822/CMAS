from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Rooms Service",
    description="Сервис управления комнатами и проживанием",
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
    return {"service": "Rooms Service", "status": "running"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
