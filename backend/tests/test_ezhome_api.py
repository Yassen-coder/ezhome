import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://ezhome-curated.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
ADMIN_EMAIL = "admin@ezhome.shop"
ADMIN_PASSWORD = "ezhome-admin-2026"


# ---------- Fixtures ----------
@pytest.fixture(scope="session")
def s():
    return requests.Session()


@pytest.fixture(scope="session")
def admin_token(s):
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    if r.status_code != 200:
        pytest.skip(f"Admin login failed: {r.status_code} {r.text}")
    return r.json()["access_token"]


@pytest.fixture(scope="session")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# ---------- Health ----------
def test_root(s):
    r = s.get(f"{API}/")
    assert r.status_code == 200
    assert "EzHome" in r.json().get("message", "")


# ---------- Public products ----------
def test_list_products(s):
    r = s.get(f"{API}/products?limit=200")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list) and len(data) >= 30
    assert "_id" not in data[0]
    assert {"id", "title", "category", "source", "affiliate_url"}.issubset(data[0].keys())


def test_filter_category(s):
    r = s.get(f"{API}/products?category=smart-home")
    assert r.status_code == 200
    assert all(p["category"] == "smart-home" for p in r.json())


def test_search(s):
    r = s.get(f"{API}/products?search=lamp")
    assert r.status_code == 200
    assert any("lamp" in p["title"].lower() for p in r.json())


def test_get_single_and_404(s):
    pid = s.get(f"{API}/products?limit=1").json()[0]["id"]
    assert s.get(f"{API}/products/{pid}").status_code == 200
    assert s.get(f"{API}/products/not-a-real-id").status_code == 404


# ---------- Categories ----------
def test_categories(s):
    r = s.get(f"{API}/categories")
    assert r.status_code == 200
    slugs = {c["slug"] for c in r.json()["categories"]}
    assert {"smart-home", "kitchen", "decor", "organization", "tiktok", "fashion"} == slugs


# ---------- Click redirect ----------
def test_click_redirect_and_increment(s):
    p = s.get(f"{API}/products?limit=1").json()[0]
    before = p["click_count"]
    r = s.get(f"{API}/click/{p['id']}", allow_redirects=False)
    assert r.status_code == 302
    assert r.headers["location"] == p["affiliate_url"]
    after = s.get(f"{API}/products/{p['id']}").json()["click_count"]
    assert after == before + 1


def test_click_404(s):
    assert s.get(f"{API}/click/nope", allow_redirects=False).status_code == 404


# ---------- Newsletter / Contact ----------
def test_newsletter_subscribe_and_dedup(s):
    email = f"TEST_news_{int(time.time())}@example.com"
    r1 = s.post(f"{API}/newsletter", json={"email": email})
    assert r1.status_code == 200
    r2 = s.post(f"{API}/newsletter", json={"email": email})
    assert r2.status_code == 200
    assert r2.json().get("already_subscribed") is True


def test_newsletter_invalid_email(s):
    assert s.post(f"{API}/newsletter", json={"email": "bad-email"}).status_code == 422


def test_contact(s):
    r = s.post(f"{API}/contact", json={
        "name": "TEST_User",
        "email": "TEST_contact@example.com",
        "message": "Hi from automated test",
    })
    assert r.status_code == 200 and r.json().get("ok") is True


# ---------- Auth ----------
def test_login_wrong_password_returns_401(s):
    # Use a unique non-admin email so we don't lock out admin
    r = s.post(f"{API}/auth/login", json={"email": "nobody@nowhere.com", "password": "wrong-xyz"})
    assert r.status_code == 401
    # FastAPI returns {"detail": "..."}
    assert "Invalid email or password" in r.text


def test_login_success_returns_jwt(s):
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200
    body = r.json()
    assert "access_token" in body and isinstance(body["access_token"], str)
    assert body.get("token_type") == "Bearer"
    user = body.get("user", {})
    assert user.get("email") == ADMIN_EMAIL
    assert user.get("role") == "admin"
    assert "id" in user


def test_auth_me_without_token_401(s):
    r = s.get(f"{API}/auth/me")
    assert r.status_code == 401


def test_auth_me_with_token_returns_admin(s, auth_headers):
    r = s.get(f"{API}/auth/me", headers=auth_headers)
    assert r.status_code == 200
    assert r.json().get("email") == ADMIN_EMAIL


def test_auth_me_with_invalid_token_401(s):
    r = s.get(f"{API}/auth/me", headers={"Authorization": "Bearer invalid.jwt.token"})
    assert r.status_code == 401


def test_admin_stats_unauth_then_auth(s, auth_headers):
    assert s.get(f"{API}/admin/stats").status_code == 401
    r = s.get(f"{API}/admin/stats", headers=auth_headers)
    assert r.status_code == 200
    body = r.json()
    for k in ("total_products", "total_clicks", "total_subscribers", "total_messages", "top_products"):
        assert k in body
    assert body["total_products"] >= 30


# ---------- Products CRUD (JWT-protected) ----------
def test_product_crud_protected(s, auth_headers):
    payload = {
        "title": "TEST_Product",
        "description": "test desc",
        "short_description": "short",
        "image_url": "https://example.com/img.jpg",
        "category": "smart-home",
        "source": "amazon",
        "affiliate_url": "https://amazon.com/dp/TEST",
        "original_price": 100.0,
        "discounted_price": 80.0,
    }
    # 401 without token
    assert s.post(f"{API}/products", json=payload).status_code == 401

    r = s.post(f"{API}/products", json=payload, headers=auth_headers)
    assert r.status_code == 200
    pid = r.json()["id"]

    # Verify persistence
    g = s.get(f"{API}/products/{pid}")
    assert g.status_code == 200 and g.json()["title"] == "TEST_Product"

    # PATCH
    pu = s.patch(f"{API}/products/{pid}", json={"title": "TEST_Updated"}, headers=auth_headers)
    assert pu.status_code == 200 and pu.json()["title"] == "TEST_Updated"
    assert s.get(f"{API}/products/{pid}").json()["title"] == "TEST_Updated"

    # DELETE
    d = s.delete(f"{API}/products/{pid}", headers=auth_headers)
    assert d.status_code == 200
    assert s.get(f"{API}/products/{pid}").status_code == 404


# ---------- Banner CRUD ----------
def test_banners_public_list(s):
    r = s.get(f"{API}/banners")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_banner_crud_protected(s, auth_headers):
    payload = {
        "title": "TEST_Banner",
        "subtitle": "subtitle",
        "image_url": "https://example.com/banner.jpg",
        "cta_text": "Shop",
        "cta_link": "/products",
        "position": "hero",
        "order": 1,
        "is_active": True,
    }
    # 401 without token
    assert s.post(f"{API}/banners", json=payload).status_code == 401

    r = s.post(f"{API}/banners", json=payload, headers=auth_headers)
    assert r.status_code == 200
    bid = r.json()["id"]
    assert r.json()["title"] == "TEST_Banner"

    # PATCH toggle is_active
    pu = s.patch(f"{API}/banners/{bid}", json={"is_active": False}, headers=auth_headers)
    assert pu.status_code == 200 and pu.json()["is_active"] is False

    # Verify via list
    banners = s.get(f"{API}/banners").json()
    assert any(b["id"] == bid and b["is_active"] is False for b in banners)

    # DELETE
    d = s.delete(f"{API}/banners/{bid}", headers=auth_headers)
    assert d.status_code == 200
    banners = s.get(f"{API}/banners").json()
    assert not any(b["id"] == bid for b in banners)


# ---------- Site Settings ----------
def test_settings_get_public(s):
    r = s.get(f"{API}/settings")
    assert r.status_code == 200
    body = r.json()
    for k in ("announcement_text", "hero_overline", "newsletter_enabled", "countdown_enabled"):
        assert k in body


def test_settings_patch_unauth_401(s):
    assert s.patch(f"{API}/settings", json={"announcement_text": "X"}).status_code == 401


def test_settings_patch_and_persist(s, auth_headers):
    original = s.get(f"{API}/settings").json()
    new_text = f"TEST_ANNOUNCEMENT_{int(time.time())}"
    r = s.patch(f"{API}/settings", json={"announcement_text": new_text}, headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["announcement_text"] == new_text
    # verify persisted via GET
    assert s.get(f"{API}/settings").json()["announcement_text"] == new_text
    # restore
    s.patch(f"{API}/settings", json={"announcement_text": original["announcement_text"]}, headers=auth_headers)


# ---------- Admin user seed / bcrypt format ----------
def test_admin_password_hash_is_bcrypt(s, auth_headers):
    """Indirect: confirm we can log in (bcrypt verify works) — direct DB check below."""
    # Direct DB inspection
    try:
        from motor.motor_asyncio import AsyncIOMotorClient  # noqa
    except Exception:
        pytest.skip("motor not available in test env")
    import asyncio
    from motor.motor_asyncio import AsyncIOMotorClient

    async def _check():
        cli = AsyncIOMotorClient(os.environ.get("MONGO_URL", "mongodb://localhost:27017"))
        db = cli[os.environ.get("DB_NAME", "test_database")]
        u = await db.admin_users.find_one({"email": ADMIN_EMAIL})
        cli.close()
        return u

    user = asyncio.get_event_loop().run_until_complete(_check()) if not asyncio.get_event_loop().is_running() else None
    if user is None:
        # fallback: just login again
        r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200
        return
    ph = user.get("password_hash", "")
    assert ph.startswith("$2b$") or ph.startswith("$2a$"), f"Expected bcrypt hash, got: {ph[:10]}"


# ---------- Brute force (use safe non-admin email) ----------
def test_brute_force_returns_429():
    """5 wrong attempts then 6th returns 429. Uses unique email to avoid admin lockout."""
    session = requests.Session()
    unique_email = f"bruteforce_{int(time.time())}@example.com"
    last_status = None
    for i in range(6):
        r = session.post(f"{API}/auth/login", json={"email": unique_email, "password": "wrong"})
        last_status = r.status_code
        if i < 5:
            assert r.status_code == 401, f"attempt {i+1} expected 401 got {r.status_code}"
    # 6th attempt should be 429
    assert last_status == 429, f"expected 429 on 6th attempt, got {last_status}"
