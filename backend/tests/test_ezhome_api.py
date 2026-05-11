import os
import pytest
import requests

BASE_URL = os.environ.get("EZHOME_BASE_URL", "https://ezhome-curated.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
ADMIN_PASSWORD = "ezhome-admin-2026"
ADMIN_TOKEN = "ezhome-secret-admin-token-7f3a9c2e"


@pytest.fixture(scope="session")
def s():
    return requests.Session()


# Health
def test_root(s):
    r = s.get(f"{API}/")
    assert r.status_code == 200
    assert "EzHome" in r.json().get("message", "")


# Products
def test_list_products(s):
    r = s.get(f"{API}/products?limit=200")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert len(data) >= 30, f"expected ~34 seeded products, got {len(data)}"
    # no _id leakage
    assert "_id" not in data[0]
    assert {"id", "title", "category", "source", "affiliate_url"}.issubset(data[0].keys())


def test_filter_category(s):
    r = s.get(f"{API}/products?category=smart-home")
    assert r.status_code == 200
    data = r.json()
    assert len(data) > 0
    assert all(p["category"] == "smart-home" for p in data)


def test_filter_source(s):
    r = s.get(f"{API}/products?source=shein")
    assert r.status_code == 200
    data = r.json()
    assert all(p["source"] == "shein" for p in data)


def test_filter_trending(s):
    r = s.get(f"{API}/products?trending=true")
    assert r.status_code == 200
    assert all(p["is_trending"] for p in r.json())


def test_filter_best_seller(s):
    r = s.get(f"{API}/products?best_seller=true")
    assert r.status_code == 200
    assert all(p["is_best_seller"] for p in r.json())


def test_filter_daily_deal(s):
    r = s.get(f"{API}/products?daily_deal=true")
    assert r.status_code == 200
    assert all(p["is_daily_deal"] for p in r.json())


def test_search(s):
    r = s.get(f"{API}/products?search=lamp")
    assert r.status_code == 200
    data = r.json()
    assert len(data) >= 1
    assert any("lamp" in p["title"].lower() for p in data)


def test_get_single_product(s):
    pid = s.get(f"{API}/products?limit=1").json()[0]["id"]
    r = s.get(f"{API}/products/{pid}")
    assert r.status_code == 200
    assert r.json()["id"] == pid


def test_get_product_404(s):
    r = s.get(f"{API}/products/not-a-real-id")
    assert r.status_code == 404


# Categories
def test_categories(s):
    r = s.get(f"{API}/categories")
    assert r.status_code == 200
    cats = r.json()["categories"]
    assert len(cats) == 6
    slugs = {c["slug"] for c in cats}
    assert {"smart-home", "kitchen", "decor", "organization", "tiktok", "fashion"} == slugs


# Click redirect + counter
def test_click_redirect_and_increment(s):
    p = s.get(f"{API}/products?limit=1").json()[0]
    before = p["click_count"]
    r = s.get(f"{API}/click/{p['id']}", allow_redirects=False)
    assert r.status_code == 302
    assert r.headers["location"] == p["affiliate_url"]
    after = s.get(f"{API}/products/{p['id']}").json()["click_count"]
    assert after == before + 1


def test_click_404(s):
    r = s.get(f"{API}/click/nope", allow_redirects=False)
    assert r.status_code == 404


# Newsletter
def test_newsletter_subscribe_and_dedup(s):
    email = "TEST_news_dedup@example.com"
    r1 = s.post(f"{API}/newsletter", json={"email": email})
    assert r1.status_code == 200
    r2 = s.post(f"{API}/newsletter", json={"email": email})
    assert r2.status_code == 200
    assert r2.json().get("already_subscribed") is True


def test_newsletter_invalid_email(s):
    r = s.post(f"{API}/newsletter", json={"email": "bad-email"})
    assert r.status_code == 422


# Contact
def test_contact(s):
    r = s.post(f"{API}/contact", json={
        "name": "TEST_User",
        "email": "TEST_contact@example.com",
        "message": "Hi from automated test",
    })
    assert r.status_code == 200
    assert r.json().get("ok") is True


# Admin login
def test_admin_login_wrong(s):
    r = s.post(f"{API}/admin/login", json={"password": "wrong"})
    assert r.status_code == 401


def test_admin_login_correct(s):
    r = s.post(f"{API}/admin/login", json={"password": ADMIN_PASSWORD})
    assert r.status_code == 200
    assert r.json()["token"] == ADMIN_TOKEN


# Admin stats auth
def test_admin_stats_unauth(s):
    r = s.get(f"{API}/admin/stats")
    assert r.status_code == 401


def test_admin_stats_auth(s):
    r = s.get(f"{API}/admin/stats", headers={"X-Admin-Token": ADMIN_TOKEN})
    assert r.status_code == 200
    body = r.json()
    for k in ("total_products", "total_clicks", "total_subscribers", "total_messages", "top_products"):
        assert k in body
    assert body["total_products"] >= 30


# Admin CRUD
def test_admin_product_crud(s):
    headers = {"X-Admin-Token": ADMIN_TOKEN}
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
    # Create requires auth
    r_unauth = s.post(f"{API}/products", json=payload)
    assert r_unauth.status_code == 401

    r = s.post(f"{API}/products", json=payload, headers=headers)
    assert r.status_code == 200
    pid = r.json()["id"]

    # Verify GET
    g = s.get(f"{API}/products/{pid}")
    assert g.status_code == 200
    assert g.json()["title"] == "TEST_Product"

    # PATCH
    pu = s.patch(f"{API}/products/{pid}", json={"title": "TEST_Updated"}, headers=headers)
    assert pu.status_code == 200
    assert pu.json()["title"] == "TEST_Updated"
    assert s.get(f"{API}/products/{pid}").json()["title"] == "TEST_Updated"

    # DELETE
    d = s.delete(f"{API}/products/{pid}", headers=headers)
    assert d.status_code == 200
    assert s.get(f"{API}/products/{pid}").status_code == 404
