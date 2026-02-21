from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from itertools import count
from typing import Dict, List, Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(
    title="Requests Service",
    description="Сервис управления заявками и обслуживанием",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RequestStatus(str, Enum):
    created = "created"
    in_progress = "in_progress"
    done = "done"


class RequestCreate(BaseModel):
    student_id: int = Field(..., ge=1)
    room_id: int = Field(..., ge=1)
    category: str = Field(..., min_length=2)
    description: str = Field(..., min_length=5)


class RequestStatusUpdate(BaseModel):
    status: RequestStatus
    assignee_id: Optional[int] = Field(default=None, ge=1)


class CommentCreate(BaseModel):
    author_id: int = Field(..., ge=1)
    text: str = Field(..., min_length=1)


class Comment(BaseModel):
    id: int
    request_id: int
    author_id: int
    text: str
    created_at: datetime


class MaintenanceRequest(BaseModel):
    id: int
    student_id: int
    room_id: int
    category: str
    description: str
    status: RequestStatus
    assignee_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime


class MaintenanceRequestDetails(MaintenanceRequest):
    comments: List[Comment] = Field(default_factory=list)


_request_id = count(1)
_comment_id = count(1)
requests_store: Dict[int, MaintenanceRequest] = {}
comments_store: Dict[int, List[Comment]] = {}


def _get_request_or_404(request_id: int) -> MaintenanceRequest:
    request_item = requests_store.get(request_id)
    if not request_item:
        raise HTTPException(status_code=404, detail="Request not found")
    return request_item


def _request_to_details(request_item: MaintenanceRequest) -> MaintenanceRequestDetails:
    return MaintenanceRequestDetails(
        **request_item.model_dump(),
        comments=comments_store.get(request_item.id, []),
    )


@app.get("/")
async def root():
    return {"service": "Requests Service", "status": "running"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.get("/requests", response_model=list[MaintenanceRequest])
async def list_requests(
    status: Optional[RequestStatus] = Query(default=None),
    student_id: Optional[int] = Query(default=None, ge=1),
    room_id: Optional[int] = Query(default=None, ge=1),
) -> list[MaintenanceRequest]:
    items = list(requests_store.values())
    if status is not None:
        items = [item for item in items if item.status == status]
    if student_id is not None:
        items = [item for item in items if item.student_id == student_id]
    if room_id is not None:
        items = [item for item in items if item.room_id == room_id]
    return items


@app.get("/requests/{request_id}", response_model=MaintenanceRequestDetails)
async def get_request(request_id: int) -> MaintenanceRequestDetails:
    request_item = _get_request_or_404(request_id)
    return _request_to_details(request_item)


@app.post("/requests", response_model=MaintenanceRequestDetails, status_code=201)
async def create_request(payload: RequestCreate) -> MaintenanceRequestDetails:
    now = datetime.now(timezone.utc)
    request_item = MaintenanceRequest(
        id=next(_request_id),
        student_id=payload.student_id,
        room_id=payload.room_id,
        category=payload.category,
        description=payload.description,
        status=RequestStatus.created,
        assignee_id=None,
        created_at=now,
        updated_at=now,
    )
    requests_store[request_item.id] = request_item
    comments_store[request_item.id] = []
    return _request_to_details(request_item)


@app.put("/requests/{request_id}/status", response_model=MaintenanceRequestDetails)
async def update_request_status(
    request_id: int,
    payload: RequestStatusUpdate,
) -> MaintenanceRequestDetails:
    request_item = _get_request_or_404(request_id)
    updated = request_item.model_copy(
        update={
            "status": payload.status,
            "assignee_id": payload.assignee_id
            if payload.assignee_id is not None
            else request_item.assignee_id,
            "updated_at": datetime.now(timezone.utc),
        }
    )
    requests_store[request_id] = updated
    return _request_to_details(updated)


@app.get("/requests/room/{room_id}", response_model=list[MaintenanceRequest])
async def list_requests_by_room(room_id: int) -> list[MaintenanceRequest]:
    return [item for item in requests_store.values() if item.room_id == room_id]


@app.post("/requests/{request_id}/comments", response_model=MaintenanceRequestDetails)
async def add_comment(request_id: int, payload: CommentCreate) -> MaintenanceRequestDetails:
    request_item = _get_request_or_404(request_id)
    comment = Comment(
        id=next(_comment_id),
        request_id=request_id,
        author_id=payload.author_id,
        text=payload.text,
        created_at=datetime.now(timezone.utc),
    )
    comments_store.setdefault(request_id, []).append(comment)
    updated = request_item.model_copy(update={"updated_at": datetime.now(timezone.utc)})
    requests_store[request_id] = updated
    return _request_to_details(updated)
