from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Query
from fastapi.responses import RedirectResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import secrets
import re
import httpx
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional
import uuid
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ.get('MONGO_URL') or os.environ.get('MONGODB_URL')
if not mongo_url:
    raise RuntimeError("MONGO_URL environment variable is not set")
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'ezhome')]

ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'admin@ezhome.shop')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'ezhome-admin-2026')
JWT_SECRET = os.environ.get('JWT_SECRET', 'change-me-in-production-' + secrets.token_hex(16))
JWT_ALGO = "HS256"
ACCESS_TOKEN_TTL_MIN = 60  # 1 hour
LOGIN_MAX_ATTEMPTS = 5
LOGIN_LOCKOUT_MIN = 15
AUTO_ADD_SECRET = os.environ.get("AUTO_ADD_SECRET")
LANDING_BASE_URL = os.environ.get("LANDING_BASE_URL", "https://ezhome-shop.com")

app = FastAPI(title="EzHome Affiliate API")
api_router = APIRouter(prefix="/api")
bearer_scheme = HTTPBearer(auto_error=False)


# ============== AUTH HELPERS ==============
def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "type": "access",
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_TTL_MIN),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


def decode_token(token: str) -> dict:
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])


async def get_current_admin(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> dict:
    if not creds or not creds.credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = decode_token(creds.credentials)
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.admin_users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


async def verify_auto_add_token(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> None:
    if not AUTO_ADD_SECRET:
        raise HTTPException(status_code=401, detail="Not authorized")
    if not creds or not creds.credentials:
        raise HTTPException(status_code=401, detail="Not authorized")
    if not secrets.compare_digest(creds.credentials, AUTO_ADD_SECRET):
        raise HTTPException(status_code=401, detail="Not authorized")


def slugify_title(title: str) -> str:
    slug = re.sub(r"[^\w\s-]", "", title.lower().strip())
    slug = re.sub(r"[-\s]+", "-", slug).strip("-")
    return slug or str(uuid.uuid4())[:8]


async def unique_product_slug(title: str) -> str:
    base = slugify_title(title)
    slug = base
    n = 2
    while await db.products.find_one({"slug": slug}, {"_id": 1}):
        slug = f"{base}-{n}"
        n += 1
    return slug


# ============== MODELS ==============
class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    short_description: str = ""
    image_url: str
    image_urls: List[str] = Field(default_factory=list)
    secondary_image_url: Optional[str] = None
    video_url: Optional[str] = None
    category: str
    source: str
    affiliate_url: str
    original_price: float
    discounted_price: float
    rating: float = 4.5
    review_count: int = 0
    badges: List[str] = []
    is_trending: bool = False
    is_best_seller: bool = False
    is_daily_deal: bool = False
    click_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ProductCreate(BaseModel):
    title: str
    description: str
    short_description: str = ""
    image_url: str
    image_urls: List[str] = Field(default_factory=list)
    secondary_image_url: Optional[str] = None
    video_url: Optional[str] = None
    category: str
    source: str
    affiliate_url: str
    original_price: float
    discounted_price: float
    rating: float = 4.5
    review_count: int = 0
    badges: List[str] = []
    is_trending: bool = False
    is_best_seller: bool = False
    is_daily_deal: bool = False


class ProductUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    image_url: Optional[str] = None
    image_urls: Optional[List[str]] = None
    secondary_image_url: Optional[str] = None
    video_url: Optional[str] = None
    category: Optional[str] = None
    source: Optional[str] = None
    affiliate_url: Optional[str] = None
    original_price: Optional[float] = None
    discounted_price: Optional[float] = None
    rating: Optional[float] = None
    review_count: Optional[int] = None
    badges: Optional[List[str]] = None
    is_trending: Optional[bool] = None
    is_best_seller: Optional[bool] = None
    is_daily_deal: Optional[bool] = None


AUTO_ADD_CATEGORIES = frozenset({
    "kitchen", "cleaning", "organization", "smart-home", "decor", "daily-essentials",
})
AUTO_ADD_SOURCES = frozenset({"amazon", "shein", "aliexpress"})


class ProductAutoAdd(BaseModel):
    title: str
    short_description: str
    description: str = ""
    images: List[str] = Field(min_length=1)
    video: Optional[str] = None
    affiliate_url: str
    category: str
    source: str
    original_price: float
    discounted_price: Optional[float] = None
    rating: float = 4.5
    review_count: int = 0
    tags: Optional[str] = None
    featured: bool = False
    trending: bool = False


class ProductAutoAddResponse(BaseModel):
    success: bool = True
    product_id: str
    slug: str
    landing_page_url: str


class NewsletterSubscribe(BaseModel):
    email: EmailStr


class NewsletterSubscriber(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ContactCreate(BaseModel):
    name: str
    email: EmailStr
    message: str


class ContactMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    message: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AdminLogin(BaseModel):
    email: EmailStr
    password: str


class AdminUser(BaseModel):
    id: str
    email: EmailStr
    name: str = "Admin"
    role: str = "admin"


class AdminLoginResponse(BaseModel):
    access_token: str
    token_type: str = "Bearer"
    user: AdminUser


class Banner(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    subtitle: str = ""
    image_url: str
    cta_text: str = "Shop Now"
    cta_link: str = "/products"
    position: str = "hero"
    order: int = 0
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class BannerCreate(BaseModel):
    title: str
    subtitle: str = ""
    image_url: str
    cta_text: str = "Shop Now"
    cta_link: str = "/products"
    position: str = "hero"
    order: int = 0
    is_active: bool = True


class BannerUpdate(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    image_url: Optional[str] = None
    cta_text: Optional[str] = None
    cta_link: Optional[str] = None
    position: Optional[str] = None
    order: Optional[int] = None
    is_active: Optional[bool] = None


class SiteSettings(BaseModel):
    announcement_text: str = "FREE GLOBAL SHIPPING ON ORDERS $50+ · NEW DROPS WEEKLY"
    hero_overline: str = "The Curated Home, Reimagined"
    hero_eyebrow_enabled: bool = True
    newsletter_enabled: bool = True
    countdown_enabled: bool = True
    updated_at: Optional[datetime] = None


class SiteSettingsUpdate(BaseModel):
    announcement_text: Optional[str] = None
    hero_overline: Optional[str] = None
    hero_eyebrow_enabled: Optional[bool] = None
    newsletter_enabled: Optional[bool] = None
    countdown_enabled: Optional[bool] = None


class FlashDeal(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str = "Limited Time Offers"
    subtitle: str = "Premium pieces at unbeatable prices."
    product_ids: List[str] = Field(default_factory=list)
    starts_at: str = ""
    ends_at: str = ""
    is_enabled: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class FlashDealCreate(BaseModel):
    title: str
    subtitle: str = ""
    product_ids: List[str] = Field(default_factory=list)
    starts_at: str
    ends_at: str
    is_enabled: bool = True


class FlashDealUpdate(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    product_ids: Optional[List[str]] = None
    starts_at: Optional[str] = None
    ends_at: Optional[str] = None
    is_enabled: Optional[bool] = None


class FlashDealActiveResponse(BaseModel):
    campaign: Optional[dict] = None
    products: List[dict] = Field(default_factory=list)


def _parse_iso_dt(value: str) -> datetime:
    if not value:
        return datetime.now(timezone.utc)
    s = value.replace("Z", "+00:00")
    try:
        dt = datetime.fromisoformat(s)
    except ValueError:
        return datetime.now(timezone.utc)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def flash_deal_status(deal: dict) -> str:
    if not deal.get("is_enabled"):
        return "draft"
    now = datetime.now(timezone.utc)
    start = _parse_iso_dt(deal.get("starts_at", ""))
    end = _parse_iso_dt(deal.get("ends_at", ""))
    if now < start:
        return "scheduled"
    if now > end:
        return "ended"
    return "live"


def _flash_deal_with_status(doc: dict) -> dict:
    out = dict(doc)
    if isinstance(out.get("created_at"), datetime):
        out["created_at"] = out["created_at"].isoformat()
    out["status"] = flash_deal_status(out)
    return out


async def _load_flash_deal_products(product_ids: List[str]) -> List[dict]:
    products = []
    for pid in product_ids:
        doc = await db.products.find_one({"id": pid}, {"_id": 0})
        if doc:
            products.append(normalize_product_dict(doc))
    return products


# ============== EMAIL HELPER ==============
async def send_email_via_resend(to: str, subject: str, html: str) -> bool:
    resend_key = os.environ.get("RESEND_API_KEY")
    if not resend_key:
        return False
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {resend_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": "EzHome <onboarding@resend.dev>",
                    "to": to,
                    "subject": subject,
                    "html": html,
                }
            )
            return response.status_code == 200
    except Exception as e:
        logging.error(f"Resend email failed: {e}")
        return False


def normalize_product_dict(doc: dict) -> dict:
    """Unify image_url, image_urls, and secondary_image_url."""
    if not doc:
        return doc
    urls = [str(u).strip() for u in (doc.get("image_urls") or []) if u and str(u).strip()]
    primary = (doc.get("image_url") or "").strip()
    secondary = (doc.get("secondary_image_url") or "").strip()
    if primary and primary not in urls:
        urls.insert(0, primary)
    if secondary and secondary not in urls:
        urls.append(secondary)
    if not urls and primary:
        urls = [primary]
    doc["image_urls"] = urls
    doc["image_url"] = urls[0] if urls else primary
    doc["secondary_image_url"] = urls[1] if len(urls) > 1 else None
    video = doc.get("video_url")
    doc["video_url"] = str(video).strip() if video and str(video).strip() else None
    return doc


# ============== ROUTES ==============
@api_router.get("/")
async def root():
    return {"message": "EzHome API live", "version": "1.0"}


# ----- Products -----
@api_router.get("/products", response_model=List[Product])
async def list_products(
    category: Optional[str] = None,
    source: Optional[str] = None,
    trending: Optional[bool] = None,
    best_seller: Optional[bool] = None,
    daily_deal: Optional[bool] = None,
    search: Optional[str] = None,
    limit: int = Query(100, le=200),
):
    q = {}
    if category:
        q['category'] = category
    if source:
        q['source'] = source
    if trending is not None:
        q['is_trending'] = trending
    if best_seller is not None:
        q['is_best_seller'] = best_seller
    if daily_deal is not None:
        q['is_daily_deal'] = daily_deal
    if search:
        q['title'] = {"$regex": search, "$options": "i"}
    docs = await db.products.find(q, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return [normalize_product_dict(d) for d in docs]


@api_router.get("/products/{product_id}/related", response_model=List[Product])
async def related_products(product_id: str, limit: int = Query(8, le=16)):
    doc = await db.products.find_one({"id": product_id}, {"_id": 0, "category": 1})
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found")
    q = {"category": doc["category"], "id": {"$ne": product_id}}
    docs = await db.products.find(q, {"_id": 0}).sort("click_count", -1).to_list(limit)
    return [normalize_product_dict(d) for d in docs]


@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    doc = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found")
    return normalize_product_dict(doc)


@api_router.post("/products", response_model=Product)
async def create_product(payload: ProductCreate, _: dict = Depends(get_current_admin)):
    data = normalize_product_dict(payload.model_dump())
    product = Product(**data)
    doc = product.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.products.insert_one(doc)
    return normalize_product_dict(doc)


@api_router.post("/products/auto-add", response_model=ProductAutoAddResponse)
async def auto_add_product(payload: ProductAutoAdd, _: None = Depends(verify_auto_add_token)):
    if payload.category not in AUTO_ADD_CATEGORIES:
        raise HTTPException(status_code=422, detail=f"Invalid category. Allowed: {', '.join(sorted(AUTO_ADD_CATEGORIES))}")
    if payload.source not in AUTO_ADD_SOURCES:
        raise HTTPException(status_code=422, detail=f"Invalid source. Allowed: {', '.join(sorted(AUTO_ADD_SOURCES))}")

    slug = await unique_product_slug(payload.title)
    discounted = payload.discounted_price if payload.discounted_price is not None else payload.original_price
    badges = [payload.tags.strip()] if payload.tags and payload.tags.strip() else []

    raw = {
        "title": payload.title,
        "short_description": payload.short_description,
        "description": payload.description,
        "image_url": payload.images[0],
        "image_urls": payload.images,
        "video_url": payload.video,
        "category": payload.category,
        "source": payload.source,
        "affiliate_url": payload.affiliate_url,
        "original_price": payload.original_price,
        "discounted_price": discounted,
        "rating": payload.rating,
        "review_count": payload.review_count,
        "badges": badges,
        "is_trending": payload.trending,
        "is_best_seller": payload.featured,
        "slug": slug,
    }
    data = normalize_product_dict(raw)
    product = Product(**data)
    doc = product.model_dump()
    doc["slug"] = slug
    doc["created_at"] = doc["created_at"].isoformat()
    await db.products.insert_one(doc)

    return ProductAutoAddResponse(
        product_id=product.id,
        slug=slug,
        landing_page_url=f"{LANDING_BASE_URL.rstrip('/')}/products/{slug}",
    )


@api_router.patch("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, payload: ProductUpdate, _: dict = Depends(get_current_admin)):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    updates = normalize_product_dict(updates)
    res = await db.products.update_one({"id": product_id}, {"$set": updates})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    doc = await db.products.find_one({"id": product_id}, {"_id": 0})
    return normalize_product_dict(doc)


@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, _: dict = Depends(get_current_admin)):
    res = await db.products.delete_one({"id": product_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"ok": True}


# ----- Categories -----
SITE_CATEGORIES = [
    {"slug": "kitchen", "name": "Kitchen", "description": "Tools that make cooking effortless"},
    {"slug": "cleaning", "name": "Cleaning", "description": "Supplies and tools for a cleaner home"},
    {"slug": "organization", "name": "Organization", "description": "Order, beautifully designed"},
    {"slug": "smart-home", "name": "Smart Home", "description": "Cutting-edge devices for the modern home"},
    {"slug": "decor", "name": "Decor", "description": "Pieces that transform your space"},
    {"slug": "daily-essentials", "name": "Daily Essentials", "description": "Everyday must-haves for modern living"},
]


@api_router.get("/categories")
async def list_categories():
    return {"categories": SITE_CATEGORIES}


# ----- Click tracking + redirect -----
@api_router.get("/click/{product_id}")
async def click_redirect(product_id: str):
    doc = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found")
    await db.products.update_one({"id": product_id}, {"$inc": {"click_count": 1}})
    await db.clicks.insert_one({
        "id": str(uuid.uuid4()),
        "product_id": product_id,
        "source": doc.get("source"),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })
    return RedirectResponse(url=doc["affiliate_url"], status_code=302)


@api_router.get("/admin/stats")
async def admin_stats(_: dict = Depends(get_current_admin)):
    total_products = await db.products.count_documents({})
    total_clicks = await db.clicks.count_documents({})
    total_subs = await db.newsletter.count_documents({})
    total_msgs = await db.contacts.count_documents({})
    top = await db.products.find({}, {"_id": 0, "id": 1, "title": 1, "click_count": 1}).sort("click_count", -1).to_list(10)
    return {
        "total_products": total_products,
        "total_clicks": total_clicks,
        "total_subscribers": total_subs,
        "total_messages": total_msgs,
        "top_products": top,
    }


# ----- Newsletter -----
@api_router.post("/newsletter")
async def subscribe(payload: NewsletterSubscribe):
    existing = await db.newsletter.find_one({"email": payload.email})
    if existing:
        return {"ok": True, "already_subscribed": True}
    sub = NewsletterSubscriber(email=payload.email)
    doc = sub.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.newsletter.insert_one(doc)

    # Notify site owner of the new subscriber
    contact_email = "dxnyementaiz@gmail.com"
    await send_email_via_resend(
        to=contact_email,
        subject="New EzHome Newsletter Subscriber",
        html=f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a1a1a;">New Newsletter Subscriber 🎉</h2>
            <p style="font-size: 15px; color: #333;">Someone just subscribed to the EzHome newsletter:</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 12px;">
                <tr>
                    <td style="padding: 10px 8px; font-weight: bold; width: 80px;">Email:</td>
                    <td style="padding: 10px 8px; color: #1a1a1a;">{payload.email}</td>
                </tr>
                <tr style="background: #f5f5f5;">
                    <td style="padding: 10px 8px; font-weight: bold;">Time:</td>
                    <td style="padding: 10px 8px; color: #555;">{doc['created_at']}</td>
                </tr>
            </table>
            <p style="margin-top: 16px; font-size: 13px; color: #888;">This notification was sent automatically by EzHome.</p>
        </div>
        """
    )

    return {"ok": True, "already_subscribed": False}


# ----- Contact -----
@api_router.post("/contact")
async def contact(payload: ContactCreate):
    msg = ContactMessage(**payload.model_dump())
    doc = msg.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.contacts.insert_one(doc)

    contact_email = "dxnyementaiz@gmail.com"
    await send_email_via_resend(
        to=contact_email,
        subject=f"New message from EzHome — {payload.name}",
        html=f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a1a1a;">New Contact Message</h2>
            <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px; font-weight: bold;">Name:</td><td style="padding: 8px;">{payload.name}</td></tr>
                <tr><td style="padding: 8px; font-weight: bold;">Email:</td><td style="padding: 8px;">{payload.email}</td></tr>
                <tr><td style="padding: 8px; font-weight: bold;">Message:</td><td style="padding: 8px;">{payload.message}</td></tr>
            </table>
        </div>
        """
    )

    return {"ok": True}


# ----- Auth -----
async def _check_brute_force(identifier: str) -> None:
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=LOGIN_LOCKOUT_MIN)
    attempts = await db.login_attempts.count_documents({
        "identifier": identifier,
        "ts": {"$gte": cutoff.isoformat()},
        "success": False,
    })
    if attempts >= LOGIN_MAX_ATTEMPTS:
        raise HTTPException(status_code=429, detail=f"Too many attempts. Try again in {LOGIN_LOCKOUT_MIN} minutes.")


async def _log_attempt(identifier: str, success: bool) -> None:
    await db.login_attempts.insert_one({
        "identifier": identifier,
        "ts": datetime.now(timezone.utc).isoformat(),
        "success": success,
    })


@api_router.post("/auth/login", response_model=AdminLoginResponse)
async def auth_login(payload: AdminLogin, request: Request):
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{payload.email.lower()}"
    await _check_brute_force(identifier)

    user = await db.admin_users.find_one({"email": payload.email.lower()})
    if not user or not verify_password(payload.password, user.get("password_hash", "")):
        await _log_attempt(identifier, False)
        raise HTTPException(status_code=401, detail="Invalid email or password")

    await _log_attempt(identifier, True)
    await db.login_attempts.delete_many({"identifier": identifier, "success": True})

    token = create_access_token(user["id"], user["email"])
    return AdminLoginResponse(
        access_token=token,
        user=AdminUser(id=user["id"], email=user["email"], name=user.get("name", "Admin"), role=user.get("role", "admin")),
    )


@api_router.get("/auth/me", response_model=AdminUser)
async def auth_me(current: dict = Depends(get_current_admin)):
    return AdminUser(id=current["id"], email=current["email"], name=current.get("name", "Admin"), role=current.get("role", "admin"))


@api_router.post("/auth/logout")
async def auth_logout(_: dict = Depends(get_current_admin)):
    return {"ok": True}


# ----- Banners -----
@api_router.get("/banners", response_model=List[Banner])
async def list_banners(active: Optional[bool] = None, position: Optional[str] = None):
    q = {}
    if active is not None:
        q["is_active"] = active
    if position:
        q["position"] = position
    docs = await db.banners.find(q, {"_id": 0}).sort("order", 1).to_list(100)
    return docs


@api_router.post("/banners", response_model=Banner)
async def create_banner(payload: BannerCreate, _: dict = Depends(get_current_admin)):
    banner = Banner(**payload.model_dump())
    doc = banner.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.banners.insert_one(doc)
    return banner


@api_router.patch("/banners/{banner_id}", response_model=Banner)
async def update_banner(banner_id: str, payload: BannerUpdate, _: dict = Depends(get_current_admin)):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    res = await db.banners.update_one({"id": banner_id}, {"$set": updates})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Banner not found")
    doc = await db.banners.find_one({"id": banner_id}, {"_id": 0})
    return doc


@api_router.delete("/banners/{banner_id}")
async def delete_banner(banner_id: str, _: dict = Depends(get_current_admin)):
    res = await db.banners.delete_one({"id": banner_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Banner not found")
    return {"ok": True}


# ----- Flash deals (limited-time campaigns) -----
@api_router.get("/flash-deals/active", response_model=FlashDealActiveResponse)
async def get_active_flash_deal():
    now = datetime.now(timezone.utc).isoformat()
    live = await db.flash_deals.find(
        {
            "is_enabled": True,
            "starts_at": {"$lte": now},
            "ends_at": {"$gte": now},
        },
        {"_id": 0},
    ).sort("ends_at", 1).to_list(1)
    doc = live[0] if live else None
    if not doc:
        return {"campaign": None, "products": []}
    campaign = _flash_deal_with_status(doc)
    products = await _load_flash_deal_products(doc.get("product_ids", []))
    return {"campaign": campaign, "products": products}


@api_router.get("/flash-deals")
async def list_flash_deals(_: dict = Depends(get_current_admin)):
    docs = await db.flash_deals.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    result = []
    for doc in docs:
        item = _flash_deal_with_status(doc)
        item["products"] = await _load_flash_deal_products(doc.get("product_ids", []))
        result.append(item)
    return result


@api_router.post("/flash-deals", response_model=FlashDeal)
async def create_flash_deal(payload: FlashDealCreate, _: dict = Depends(get_current_admin)):
    deal = FlashDeal(**payload.model_dump())
    doc = deal.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.flash_deals.insert_one(doc)
    return deal


@api_router.patch("/flash-deals/{deal_id}", response_model=FlashDeal)
async def update_flash_deal(deal_id: str, payload: FlashDealUpdate, _: dict = Depends(get_current_admin)):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    res = await db.flash_deals.update_one({"id": deal_id}, {"$set": updates})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Flash deal not found")
    doc = await db.flash_deals.find_one({"id": deal_id}, {"_id": 0})
    return doc


@api_router.delete("/flash-deals/{deal_id}")
async def delete_flash_deal(deal_id: str, _: dict = Depends(get_current_admin)):
    res = await db.flash_deals.delete_one({"id": deal_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Flash deal not found")
    return {"ok": True}


# ----- Site Settings (singleton) -----
async def _get_settings_doc() -> dict:
    doc = await db.site_settings.find_one({"_id": "singleton"}, {"_id": 0})
    if not doc:
        default = SiteSettings().model_dump()
        default['updated_at'] = datetime.now(timezone.utc).isoformat()
        await db.site_settings.insert_one({"_id": "singleton", **default})
        return default
    return doc


@api_router.get("/settings", response_model=SiteSettings)
async def get_settings():
    doc = await _get_settings_doc()
    if doc.get('updated_at') and isinstance(doc['updated_at'], str):
        try:
            doc['updated_at'] = datetime.fromisoformat(doc['updated_at'])
        except Exception:
            doc['updated_at'] = None
    return doc


@api_router.patch("/settings", response_model=SiteSettings)
async def update_settings(payload: SiteSettingsUpdate, _: dict = Depends(get_current_admin)):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    updates['updated_at'] = datetime.now(timezone.utc).isoformat()
    await db.site_settings.update_one({"_id": "singleton"}, {"$set": updates}, upsert=True)
    doc = await db.site_settings.find_one({"_id": "singleton"}, {"_id": 0})
    if doc.get('updated_at') and isinstance(doc['updated_at'], str):
        try:
            doc['updated_at'] = datetime.fromisoformat(doc['updated_at'])
        except Exception:
            doc['updated_at'] = None
    return doc


# ----- Seed -----
@api_router.post("/seed")
async def seed_products():
    existing = await db.products.count_documents({})
    if existing > 0:
        return {"ok": True, "skipped": True, "existing": existing}
    seed_data = _build_seed_data()
    for p in seed_data:
        product = Product(**p)
        doc = product.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.products.insert_one(doc)
    return {"ok": True, "inserted": len(seed_data)}


def _build_seed_data():
    return [
        # --- Smart Home ---
        {"title": "Aura Smart Ambient Lamp", "short_description": "Mood-shifting glow that learns your routine.", "description": "A sculptural smart lamp with 16M colors, voice control, and adaptive scenes.", "image_url": "https://images.unsplash.com/photo-1565636192335-d3b7e23dfaa6?w=800&q=85", "category": "smart-home", "source": "amazon", "affiliate_url": "https://amazon.com/dp/B0SMART01", "original_price": 129.00, "discounted_price": 79.00, "rating": 4.8, "review_count": 2384, "badges": ["BEST SELLER"], "is_trending": True, "is_best_seller": True},
        {"title": "Echo Mist Aroma Diffuser", "short_description": "Whisper-quiet diffusion meets sculptural design.", "description": "Ultrasonic diffuser with 7-color ambient lighting and 12-hour runtime.", "image_url": "https://images.unsplash.com/photo-1611088335681-a7a204af3cc6?w=800&q=85", "category": "smart-home", "source": "amazon", "affiliate_url": "https://amazon.com/dp/B0SMART02", "original_price": 69.00, "discounted_price": 39.00, "rating": 4.7, "review_count": 1521, "badges": ["20% OFF"], "is_daily_deal": True},
        {"title": "Nova Motion Sensor Light", "short_description": "Auto-on warmth for every hallway.", "description": "Rechargeable motion-activated LED strip. Sleek, magnetic, and effortlessly modern.", "image_url": "https://images.unsplash.com/photo-1558002038-1055907df827?w=800&q=85", "category": "smart-home", "source": "aliexpress", "affiliate_url": "https://aliexpress.com/item/smart-light", "original_price": 39.00, "discounted_price": 19.00, "rating": 4.6, "review_count": 873, "badges": ["VIRAL"], "is_trending": True},
        {"title": "Pulse Mini Robot Vacuum", "short_description": "Whisper-quiet, app-controlled, brilliant.", "description": "Slim 2.7\" profile, smart mapping, 120 min runtime.", "image_url": "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=800&q=85", "category": "smart-home", "source": "amazon", "affiliate_url": "https://amazon.com/dp/B0SMART04", "original_price": 299.00, "discounted_price": 199.00, "rating": 4.9, "review_count": 4210, "badges": ["BEST SELLER"], "is_best_seller": True, "is_trending": True},
        {"title": "Lumen Sunrise Wake Clock", "short_description": "Wake up the way nature intended.", "description": "Light therapy alarm clock that mimics the sunrise.", "image_url": "https://images.unsplash.com/photo-1512446816042-444d641267d4?w=800&q=85", "category": "smart-home", "source": "amazon", "affiliate_url": "https://amazon.com/dp/B0SMART05", "original_price": 89.00, "discounted_price": 59.00, "rating": 4.7, "review_count": 1985, "badges": []},
        {"title": "Vox Pro Bluetooth Speaker", "short_description": "Studio sound. Pocket size.", "description": "360° immersive sound, 20-hour battery, waterproof aluminum body.", "image_url": "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=85", "category": "smart-home", "source": "amazon", "affiliate_url": "https://amazon.com/dp/B0SMART06", "original_price": 149.00, "discounted_price": 89.00, "rating": 4.8, "review_count": 3201, "badges": ["40% OFF"], "is_daily_deal": True},
        # --- Kitchen ---
        {"title": "Mira Marble Cutting Board", "short_description": "A sculpture you also cook on.", "description": "Hand-finished Carrara marble with built-in juice groove.", "image_url": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=85", "category": "kitchen", "source": "amazon", "affiliate_url": "https://amazon.com/dp/B0KITCH01", "original_price": 59.00, "discounted_price": 34.00, "rating": 4.9, "review_count": 1267, "badges": ["BEST SELLER"], "is_best_seller": True},
        {"title": "Verde Stoneware Mug Set", "short_description": "The mug you'll reach for every morning.", "description": "Hand-glazed stoneware in moss green. Set of 4.", "image_url": "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800&q=85", "category": "kitchen", "source": "amazon", "affiliate_url": "https://amazon.com/dp/B0KITCH02", "original_price": 48.00, "discounted_price": 29.00, "rating": 4.8, "review_count": 2104, "badges": []},
        {"title": "Brio Electric Milk Frother", "short_description": "Café-quality foam in 60 seconds.", "description": "Whisper-quiet, dual-whisk, hot & cold settings.", "image_url": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=85", "category": "kitchen", "source": "amazon", "affiliate_url": "https://amazon.com/dp/B0KITCH03", "original_price": 49.00, "discounted_price": 26.00, "rating": 4.7, "review_count": 5832, "badges": ["VIRAL"], "is_trending": True},
        {"title": "Slate Knife Block Set", "short_description": "Japanese steel meets minimalist design.", "description": "6-piece high-carbon stainless set with magnetic wooden block.", "image_url": "https://images.unsplash.com/photo-1593618998160-e34014e67546?w=800&q=85", "category": "kitchen", "source": "amazon", "affiliate_url": "https://amazon.com/dp/B0KITCH04", "original_price": 199.00, "discounted_price": 129.00, "rating": 4.9, "review_count": 942, "badges": ["35% OFF"], "is_daily_deal": True, "is_best_seller": True},
        # --- Decor ---
        {"title": "Sona Sculptural Vase", "short_description": "Quiet drama for any surface.", "description": "Hand-thrown ceramic vase with organic curves.", "image_url": "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=800&q=85", "category": "decor", "source": "amazon", "affiliate_url": "https://amazon.com/dp/B0DECOR01", "original_price": 89.00, "discounted_price": 49.00, "rating": 4.8, "review_count": 421, "badges": ["NEW"]},
        {"title": "Mira Linen Throw Pillow", "short_description": "Belgian linen, hand-stitched edges.", "description": "Stonewashed linen pillow cover in oat.", "image_url": "https://images.unsplash.com/photo-1584100936595-c0654b55a2e6?w=800&q=85", "category": "decor", "source": "amazon", "affiliate_url": "https://amazon.com/dp/B0DECOR02", "original_price": 65.00, "discounted_price": 39.00, "rating": 4.7, "review_count": 1893, "badges": ["BEST SELLER"], "is_best_seller": True},
        {"title": "Sage Wall Mirror", "short_description": "Arched, oversized, irresistible.", "description": "32\" arched mirror with brushed brass frame.", "image_url": "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&q=85", "category": "decor", "source": "amazon", "affiliate_url": "https://amazon.com/dp/B0DECOR05", "original_price": 249.00, "discounted_price": 149.00, "rating": 4.8, "review_count": 2783, "badges": ["VIRAL"], "is_trending": True, "is_daily_deal": True},
        # --- Organization ---
        {"title": "Luma Acrylic Drawer Organizers", "short_description": "Find everything in 2 seconds.", "description": "12-piece modular acrylic system.", "image_url": "https://images.unsplash.com/photo-1606744824163-985d376605aa?w=800&q=85", "category": "organization", "source": "amazon", "affiliate_url": "https://amazon.com/dp/B0ORG01", "original_price": 49.00, "discounted_price": 29.00, "rating": 4.8, "review_count": 3892, "badges": ["BEST SELLER"], "is_best_seller": True, "is_trending": True},
        {"title": "Tessa Woven Storage Baskets", "short_description": "Storage that doubles as decor.", "description": "Hand-woven seagrass baskets, set of 3.", "image_url": "https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=800&q=85", "category": "organization", "source": "amazon", "affiliate_url": "https://amazon.com/dp/B0ORG03", "original_price": 65.00, "discounted_price": 39.00, "rating": 4.7, "review_count": 1574, "badges": []},
        {"title": "Pico Cable Management Box", "short_description": "Hide the chaos, beautifully.", "description": "Bamboo-topped cable organizer.", "image_url": "https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=800&q=85", "category": "organization", "source": "aliexpress", "affiliate_url": "https://aliexpress.com/item/cable-box", "original_price": 29.00, "discounted_price": 16.00, "rating": 4.5, "review_count": 921, "badges": ["VIRAL"]},
        # --- Cleaning ---
        {"title": "PureWave Cordless Vacuum", "short_description": "Lightweight power for every corner.", "description": "Handheld cordless vacuum with HEPA filter and 40-min runtime.", "image_url": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=85", "category": "cleaning", "source": "amazon", "affiliate_url": "https://amazon.com/dp/B0CLEAN01", "original_price": 129.00, "discounted_price": 89.00, "rating": 4.8, "review_count": 4210, "badges": ["BEST SELLER"], "is_best_seller": True, "is_trending": True},
        {"title": "Microfiber Mop System", "short_description": "Streak-free floors in minutes.", "description": "Flat mop with washable pads and extendable handle.", "image_url": "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=85", "category": "cleaning", "source": "amazon", "affiliate_url": "https://amazon.com/dp/B0CLEAN02", "original_price": 45.00, "discounted_price": 28.00, "rating": 4.7, "review_count": 2891, "badges": ["VIRAL"], "is_trending": True},
        {"title": "Eco Dish Soap Dispenser Set", "short_description": "Refillable, minimal, countertop-ready.", "description": "Glass dispenser trio for kitchen sink organization.", "image_url": "https://images.unsplash.com/photo-1628177142898-93e36e4e3a1c?w=800&q=85", "category": "cleaning", "source": "aliexpress", "affiliate_url": "https://aliexpress.com/item/dispenser", "original_price": 32.00, "discounted_price": 18.00, "rating": 4.6, "review_count": 1102, "badges": [], "is_daily_deal": True},
        # --- Daily Essentials ---
        {"title": "Hydro Glow Water Bottle", "short_description": "Hydration goals, achieved.", "description": "32oz motivational time-marker bottle.", "image_url": "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=85", "category": "daily-essentials", "source": "amazon", "affiliate_url": "https://amazon.com/dp/B0DAILY01", "original_price": 35.00, "discounted_price": 22.00, "rating": 4.9, "review_count": 18203, "badges": ["BEST SELLER"], "is_trending": True, "is_daily_deal": True},
        {"title": "Cloud Comfort Slides", "short_description": "Walking on actual clouds.", "description": "Ultra-cushioned pillow slides for home.", "image_url": "https://images.unsplash.com/photo-1603487742131-4160ec999306?w=800&q=85", "category": "daily-essentials", "source": "amazon", "affiliate_url": "https://amazon.com/dp/B0DAILY02", "original_price": 39.00, "discounted_price": 19.00, "rating": 4.8, "review_count": 24891, "badges": ["VIRAL"], "is_trending": True},
        {"title": "Bamboo Bath Towel Set", "short_description": "Spa-soft, quick-dry luxury.", "description": "6-piece ultra-absorbent towel set in sand.", "image_url": "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=85", "category": "daily-essentials", "source": "amazon", "affiliate_url": "https://amazon.com/dp/B0DAILY03", "original_price": 79.00, "discounted_price": 49.00, "rating": 4.7, "review_count": 3421, "badges": ["35% OFF"], "is_best_seller": True},
        {"title": "Aroma Sleep Pillow Spray", "short_description": "Wind down in one mist.", "description": "Lavender-chamomile pillow mist, 100ml.", "image_url": "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&q=85", "category": "daily-essentials", "source": "aliexpress", "affiliate_url": "https://aliexpress.com/item/pillow-spray", "original_price": 24.00, "discounted_price": 14.00, "rating": 4.6, "review_count": 1821, "badges": []},
    ]


def _category_banner_defaults():
    """Default homepage category tiles (position=category) — editable in admin."""
    tiles = [
        ("smart-home", "Smart Home", "Effortless luxury, automated", "https://images.unsplash.com/photo-1558002038-1055907df827?w=900&q=85", 0),
        ("kitchen", "Kitchen", "For the modern cook", "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=900&q=85", 1),
        ("decor", "Decor", "Quietly stunning pieces", "https://images.unsplash.com/photo-1584100936595-c0654b55a2e6?w=900&q=85", 2),
        ("cleaning", "Cleaning", "A cleaner home, effortlessly", "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=900&q=85", 3),
        ("organization", "Organization", "Order, beautifully", "https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=900&q=85", 4),
        ("daily-essentials", "Daily Essentials", "Everyday must-haves", "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=900&q=85", 5),
    ]
    return [
        {
            "title": title,
            "subtitle": subtitle,
            "image_url": img,
            "cta_text": "Shop Now",
            "cta_link": f"/category/{slug}",
            "position": "category",
            "order": order,
            "is_active": True,
        }
        for slug, title, subtitle, img, order in tiles
    ]


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def startup_event():
    try:
        await db.admin_users.create_index("email", unique=True)
        await db.admin_users.create_index("id", unique=True)
        await db.products.create_index("id", unique=True)
        await db.products.create_index("category")
        await db.banners.create_index("position")
        await db.login_attempts.create_index("identifier")
        await db.newsletter.create_index("email", unique=True)
    except Exception as e:
        logger.warning(f"Index creation: {e}")

    try:
        existing = await db.admin_users.find_one({"email": ADMIN_EMAIL.lower()})
        if not existing:
            admin_id = str(uuid.uuid4())
            await db.admin_users.insert_one({
                "id": admin_id,
                "email": ADMIN_EMAIL.lower(),
                "password_hash": hash_password(ADMIN_PASSWORD),
                "name": "EzHome Admin",
                "role": "admin",
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
            logger.info(f"Seeded admin user: {ADMIN_EMAIL}")
        elif not verify_password(ADMIN_PASSWORD, existing.get("password_hash", "")):
            await db.admin_users.update_one(
                {"email": ADMIN_EMAIL.lower()},
                {"$set": {"password_hash": hash_password(ADMIN_PASSWORD)}}
            )
            logger.info("Admin password hash refreshed from env")
    except Exception as e:
        logger.error(f"Admin seed error: {e}")

    try:
        # Migrate legacy categories off the site
        for old_cat, new_cat in [("tiktok", "daily-essentials"), ("fashion", "daily-essentials")]:
            res = await db.products.update_many(
                {"category": old_cat}, {"$set": {"category": new_cat}}
            )
            if res.modified_count:
                logger.info(f"Migrated {res.modified_count} products from {old_cat} to {new_cat}")

        # Backfill image_urls for legacy products (once per doc missing the field)
        legacy = db.products.find(
            {"$or": [{"image_urls": {"$exists": False}}, {"image_urls": None}, {"image_urls": []}]},
            {"_id": 0},
        )
        async for p in legacy:
            norm = normalize_product_dict(dict(p))
            await db.products.update_one(
                {"id": p["id"]},
                {"$set": {
                    "image_urls": norm["image_urls"],
                    "image_url": norm["image_url"],
                    "secondary_image_url": norm.get("secondary_image_url"),
                }},
            )

        count = await db.products.count_documents({})
        if count == 0:
            seed_data = _build_seed_data()
            for p in seed_data:
                product = Product(**p)
                doc = product.model_dump()
                doc['created_at'] = doc['created_at'].isoformat()
                await db.products.insert_one(doc)
            logger.info(f"Seeded {len(seed_data)} products")
    except Exception as e:
        logger.error(f"Product seed error: {e}")

    try:
        flash_count = await db.flash_deals.count_documents({})
        if flash_count == 0:
            now = datetime.now(timezone.utc)
            end = now.replace(hour=23, minute=59, second=59, microsecond=999000)
            deal_ids = []
            async for p in db.products.find({"is_daily_deal": True}, {"id": 1}):
                deal_ids.append(p["id"])
            if deal_ids:
                campaign = FlashDeal(
                    title="Daily Deals",
                    subtitle="Gone when the timer hits zero.",
                    product_ids=deal_ids,
                    starts_at=now.isoformat(),
                    ends_at=end.isoformat(),
                    is_enabled=True,
                )
                doc = campaign.model_dump()
                doc["created_at"] = doc["created_at"].isoformat()
                await db.flash_deals.insert_one(doc)
                logger.info(f"Seeded flash deal campaign with {len(deal_ids)} products")

        cat_banner_count = await db.banners.count_documents({"position": "category"})
        if cat_banner_count == 0:
            for payload in _category_banner_defaults():
                banner = Banner(**payload)
                doc = banner.model_dump()
                doc["created_at"] = doc["created_at"].isoformat()
                await db.banners.insert_one(doc)
            logger.info("Seeded default category banners")
    except Exception as e:
        logger.error(f"Category banner seed error: {e}")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
