from fastapi import FastAPI, APIRouter, HTTPException, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import hmac
import hashlib
import logging
from pathlib import Path
from pydantic import BaseModel
from typing import List, Optional

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

client = AsyncIOMotorClient(os.environ['MONGO_URL'])
db = client[os.environ['DB_NAME']]
ADMIN_PASSWORD = os.environ['ADMIN_PASSWORD']
ADMIN_SECRET = os.environ['ADMIN_SECRET']

app = FastAPI()
api_router = APIRouter(prefix="/api")


class Fueling(BaseModel):
    id: str
    garage: str
    pump: int
    liters: float
    date: str
    time: str
    note: str = ""
    created_at: str
    updated_at: str
    deleted: bool = False
    device_id: str = ""


class PumpReading(BaseModel):
    start: Optional[float] = None
    end: Optional[float] = None


class Totalizer(BaseModel):
    id: str
    date: str
    pumps: List[PumpReading]
    updated_at: str


class Vehicle(BaseModel):
    id: str
    garage: str
    updated_at: str
    deleted: bool = False


class SyncPayload(BaseModel):
    fuelings: List[Fueling] = []
    totalizers: List[Totalizer] = []
    vehicles: List[Vehicle] = []


class LoginPayload(BaseModel):
    password: str


KINDS = {"fuelings": db.fuelings, "totalizers": db.totalizers, "vehicles": db.vehicles}


async def upsert_lww(coll, rec: BaseModel):
    data = rec.model_dump()
    existing = await coll.find_one({"id": data["id"]}, {"_id": 0, "updated_at": 1})
    if existing and existing["updated_at"] > data["updated_at"]:
        return
    await coll.replace_one({"id": data["id"]}, data, upsert=True)


async def dump_all():
    out = {}
    for name, coll in KINDS.items():
        out[name] = await coll.find({}, {"_id": 0}).to_list(100000)
    return out


def admin_token():
    return hmac.new(ADMIN_SECRET.encode(), ADMIN_PASSWORD.encode(), hashlib.sha256).hexdigest()


@api_router.get("/")
async def root():
    return {"message": "Prva smena API"}


@api_router.post("/sync")
async def sync(payload: SyncPayload):
    for name in KINDS:
        for rec in getattr(payload, name):
            await upsert_lww(KINDS[name], rec)
    return await dump_all()


@api_router.post("/admin/login")
async def admin_login(payload: LoginPayload):
    if not hmac.compare_digest(payload.password, ADMIN_PASSWORD):
        raise HTTPException(status_code=401, detail="Pogrešna lozinka")
    return {"token": admin_token()}


@api_router.get("/admin/data")
async def admin_data(authorization: str = Header(default="")):
    if not hmac.compare_digest(authorization.replace("Bearer ", ""), admin_token()):
        raise HTTPException(status_code=401, detail="Neovlašćen pristup")
    return await dump_all()


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)


@app.on_event("startup")
async def startup():
    for coll in KINDS.values():
        await coll.create_index("id", unique=True)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
