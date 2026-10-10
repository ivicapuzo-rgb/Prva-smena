"""Backend API tests for Prva smena app."""
import os
import uuid
from datetime import datetime, timezone

import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    # fallback: read from frontend/.env file
    try:
        with open('/app/frontend/.env') as fh:
            for line in fh:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    BASE_URL = line.split('=', 1)[1].strip().rstrip('/')
                    break
    except Exception:
        pass

API = f"{BASE_URL}/api"
ADMIN_PASSWORD = "puzopb"


def now_iso():
    return datetime.now(timezone.utc).isoformat()


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---------- Health ----------
def test_root(session):
    r = session.get(f"{API}/")
    assert r.status_code == 200
    assert "Prva smena" in r.json().get("message", "")


# ---------- Admin login ----------
def test_admin_login_wrong(session):
    r = session.post(f"{API}/admin/login", json={"password": "wrong"})
    assert r.status_code == 401


def test_admin_login_correct(session):
    r = session.post(f"{API}/admin/login", json={"password": ADMIN_PASSWORD})
    assert r.status_code == 200
    data = r.json()
    assert "token" in data and isinstance(data["token"], str) and len(data["token"]) > 10


@pytest.fixture(scope="module")
def admin_token(session):
    r = session.post(f"{API}/admin/login", json={"password": ADMIN_PASSWORD})
    assert r.status_code == 200
    return r.json()["token"]


def test_admin_data_requires_token(session):
    r = session.get(f"{API}/admin/data")
    assert r.status_code == 401


def test_admin_data_wrong_token(session):
    r = session.get(f"{API}/admin/data", headers={"Authorization": "Bearer bogus"})
    assert r.status_code == 401


def test_admin_data_with_token(session, admin_token):
    r = session.get(f"{API}/admin/data", headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200
    data = r.json()
    for key in ("fuelings", "totalizers", "vehicles"):
        assert key in data and isinstance(data[key], list)


# ---------- Sync ----------
def test_sync_upserts_fueling_and_vehicle(session, admin_token):
    fid = f"TEST_{uuid.uuid4()}"
    vid = f"TEST_{uuid.uuid4()}"
    today = datetime.now().strftime("%Y-%m-%d")
    payload = {
        "fuelings": [{
            "id": fid, "garage": "TEST9001", "pump": 3, "liters": 23.45,
            "date": today, "time": "08:15", "note": "pytest",
            "created_at": now_iso(), "updated_at": now_iso(), "deleted": False,
            "device_id": "pytest",
        }],
        "totalizers": [{
            "id": f"tot_{today}", "date": today,
            "pumps": [{"start": 100.0, "end": 200.0}] * 8,
            "updated_at": now_iso(),
        }],
        "vehicles": [{
            "id": vid, "garage": "TEST9001", "updated_at": now_iso(), "deleted": False,
        }],
    }
    r = session.post(f"{API}/sync", json=payload)
    assert r.status_code == 200, r.text
    data = r.json()
    assert any(f["id"] == fid and f["liters"] == 23.45 for f in data["fuelings"])
    assert any(v["id"] == vid for v in data["vehicles"])
    assert any(t["id"] == f"tot_{today}" for t in data["totalizers"])

    # Verify via admin/data
    r2 = session.get(f"{API}/admin/data", headers={"Authorization": f"Bearer {admin_token}"})
    assert r2.status_code == 200
    adata = r2.json()
    assert any(f["id"] == fid for f in adata["fuelings"])


def test_sync_last_write_wins(session):
    fid = f"TEST_{uuid.uuid4()}"
    today = datetime.now().strftime("%Y-%m-%d")
    base = {
        "id": fid, "garage": "TEST9002", "pump": 1, "liters": 10.0,
        "date": today, "time": "09:00", "note": "v1",
        "created_at": "2026-01-01T10:00:00+00:00",
        "updated_at": "2026-01-01T10:00:00+00:00",
        "deleted": False, "device_id": "pytest",
    }
    r1 = session.post(f"{API}/sync", json={"fuelings": [base]})
    assert r1.status_code == 200

    # Older update should be ignored
    older = {**base, "liters": 1.0, "updated_at": "2026-01-01T09:00:00+00:00"}
    session.post(f"{API}/sync", json={"fuelings": [older]})

    # Newer update should win
    newer = {**base, "liters": 99.9, "updated_at": "2026-01-01T11:00:00+00:00"}
    r3 = session.post(f"{API}/sync", json={"fuelings": [newer]})
    data = r3.json()
    rec = next(f for f in data["fuelings"] if f["id"] == fid)
    assert rec["liters"] == 99.9


def test_sync_empty_payload(session):
    r = session.post(f"{API}/sync", json={})
    assert r.status_code == 200
    data = r.json()
    assert "fuelings" in data
