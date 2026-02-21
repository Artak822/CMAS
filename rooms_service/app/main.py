from __future__ import annotations

from datetime import date
from enum import Enum
from itertools import count
from typing import Dict, List, Optional

from fastapi import FastAPI, HTTPException  # pyright: ignore[reportMissingImports]
from fastapi.middleware.cors import CORSMiddleware  # pyright: ignore[reportMissingImports]
from pydantic import BaseModel, Field  # pyright: ignore[reportMissingImports]

app = FastAPI(
    title="Rooms Service",
    description="Сервис управления комнатами и проживанием",
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


class RoomStatus(str, Enum):
    free = "free"
    partial = "partial"
    repair = "repair"


class Floor(BaseModel):
    id: int
    number: int = Field(..., ge=1)
    dormitory: str = Field(..., min_length=1)


class Room(BaseModel):
    id: int
    number: str = Field(..., min_length=1)
    floor_id: int
    capacity: int = Field(..., ge=1)
    free_places: int = Field(..., ge=0)
    status: RoomStatus


class Residence(BaseModel):
    id: int
    student_id: int
    room_id: int
    check_in_date: date
    check_out_date: Optional[date] = None


class RoomAssignIn(BaseModel):
    student_id: int
    room_id: int
    check_in_date: Optional[date] = None


class RoomEvictIn(BaseModel):
    student_id: int
    room_id: int
    check_out_date: Optional[date] = None


class FloorStats(BaseModel):
    floor_id: int
    total_rooms: int
    total_capacity: int
    total_free_places: int
    occupied_places: int
    occupancy_percent: float


def _calculate_status(room: Room) -> RoomStatus:
    if room.status == RoomStatus.repair:
        return RoomStatus.repair
    if room.free_places >= room.capacity:
        return RoomStatus.free
    return RoomStatus.partial


# In-memory storage (MVP). Replace with DB later.
_floor_id = count(1)
_room_id = count(1)
_residence_id = count(1)

floors: Dict[int, Floor] = {}
rooms: Dict[int, Room] = {}
residences: List[Residence] = []


# Seed data for quick testing
floor_1 = Floor(id=next(_floor_id), number=1, dormitory="A")
floor_2 = Floor(id=next(_floor_id), number=2, dormitory="A")
floors[floor_1.id] = floor_1
floors[floor_2.id] = floor_2

room_101 = Room(
    id=next(_room_id),
    number="101",
    floor_id=floor_1.id,
    capacity=3,
    free_places=3,
    status=RoomStatus.free,
)
room_102 = Room(
    id=next(_room_id),
    number="102",
    floor_id=floor_1.id,
    capacity=2,
    free_places=1,
    status=RoomStatus.partial,
)
room_201 = Room(
    id=next(_room_id),
    number="201",
    floor_id=floor_2.id,
    capacity=2,
    free_places=2,
    status=RoomStatus.free,
)
rooms[room_101.id] = room_101
rooms[room_102.id] = room_102
rooms[room_201.id] = room_201


@app.get("/")
async def root():
    return {"service": "Rooms Service", "status": "running"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.get("/rooms", response_model=list[Room])
async def list_rooms() -> List[Room]:
    return list(rooms.values())


@app.get("/rooms/{room_id}", response_model=Room)
async def get_room(room_id: int) -> Room:
    room = rooms.get(room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room


@app.post("/rooms/assign", response_model=Residence)
async def assign_room(payload: RoomAssignIn) -> Residence:
    room = rooms.get(payload.room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    if room.status == RoomStatus.repair:
        raise HTTPException(status_code=400, detail="Room is under repair")
    if room.free_places <= 0:
        raise HTTPException(status_code=400, detail="No free places in room")

    check_in = payload.check_in_date or date.today()
    residence = Residence(
        id=next(_residence_id),
        student_id=payload.student_id,
        room_id=payload.room_id,
        check_in_date=check_in,
        check_out_date=None,
    )
    residences.append(residence)

    room.free_places -= 1
    room.status = _calculate_status(room)
    rooms[room.id] = room

    return residence


@app.post("/rooms/evict", response_model=Residence)
async def evict_room(payload: RoomEvictIn) -> Residence:
    room = rooms.get(payload.room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    for idx, res in enumerate(residences):
        if (
            res.student_id == payload.student_id
            and res.room_id == payload.room_id
            and res.check_out_date is None
        ):
            check_out = payload.check_out_date or date.today()
            updated = res.model_copy(update={"check_out_date": check_out})
            residences[idx] = updated
            room.free_places += 1
            room.status = _calculate_status(room)
            rooms[room.id] = room
            return updated

    raise HTTPException(status_code=404, detail="Active residence not found")


@app.get("/floors/{floor_id}/stats", response_model=FloorStats)
async def floor_stats(floor_id: int) -> FloorStats:
    floor = floors.get(floor_id)
    if not floor:
        raise HTTPException(status_code=404, detail="Floor not found")

    floor_rooms = [r for r in rooms.values() if r.floor_id == floor_id]
    total_rooms = len(floor_rooms)
    total_capacity = sum(r.capacity for r in floor_rooms)
    total_free_places = sum(r.free_places for r in floor_rooms)
    occupied_places = total_capacity - total_free_places
    occupancy_percent = (
        (occupied_places / total_capacity) * 100 if total_capacity > 0 else 0.0
    )

    return FloorStats(
        floor_id=floor.id,
        total_rooms=total_rooms,
        total_capacity=total_capacity,
        total_free_places=total_free_places,
        occupied_places=occupied_places,
        occupancy_percent=round(occupancy_percent, 2),
    )
