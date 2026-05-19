from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Query
from fastapi.responses import RedirectResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import secrets
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional
import uuid
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
import resend


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'admin@ezhome.shop')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'ezhome-admin-2026')
JWT_SECRET = os.environ.get('JWT_SECRET', 'change-me-in-production-' + secrets.token_hex(16))
JWT_ALGO = "HS256"
ACCESS_TOKEN_TTL_MIN = 60  # 1 hour
LOGIN_MAX_ATTEMPTS = 5
LOGIN_LOCKOUT_MIN = 15

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


# ============== MODELS ==============
class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    short_description: str = ""
    image_url: str
    secondary_image_url: Optional[str] = None
    category: str  # smart-home, kitchen, decor, organization, tiktok, fashion, best-seller, trending
    source: str  # amazon | temu | shein
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
    secondary_image_url: Optional[str] = None
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
    secondary_image_url: Optional[str] = None
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


# ---------- Banner / SiteSettings ----------
class Banner(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    subtitle: str = ""
    image_url: str
    cta_text: str = "Shop Now"
    cta_link: str = "/products"
    position: str = "hero"  # hero | promo | featured
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
    return docs


@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    doc = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found")
    return doc


@api_router.post("/products", response_model=Product)
async def create_product(payload: ProductCreate, _: dict = Depends(get_current_admin)):
    product = Product(**payload.model_dump())
    doc = product.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.products.insert_one(doc)
    return product


@api_router.patch("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, payload: ProductUpdate, _: dict = Depends(get_current_admin)):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    res = await db.products.update_one({"id": product_id}, {"$set": updates})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    doc = await db.products.find_one({"id": product_id}, {"_id": 0})
    return doc


@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, _: dict = Depends(get_current_admin)):
    res = await db.products.delete_one({"id": product_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"ok": True}


# ----- Categories -----
@api_router.get("/categories")
async def list_categories():
    return {
        "categories": [
            {"slug": "smart-home", "name": "Smart Home", "description": "Cutting-edge devices for the modern home"},
            {"slug": "kitchen", "name": "Kitchen Essentials", "description": "Tools that make cooking effortless"},
            {"slug": "decor", "name": "Home Decor", "description": "Pieces that transform your space"},
            {"slug": "organization", "name": "Organization & Storage", "description": "Order, beautifully designed"},
            {"slug": "tiktok", "name": "Viral TikTok Finds", "description": "What everyone's talking about"},
            {"slug": "fashion", "name": "SHEIN Fashion Picks", "description": "Curated style, delivered"},
        ]
    }


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
    return {"ok": True, "already_subscribed": False}


# ----- Contact -----
@api_router.post("/contact")
async def contact(payload: ContactCreate):
    msg = ContactMessage(**payload.model_dump())
    doc = msg.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.contacts.insert_one(doc)

    # Send email notification
    try:
        resend_api_key = os.environ.get("RESEND_API_KEY")
        contact_email = os.environ.get("CONTACT_EMAIL", "dxnyementaiz@gmail.com")
        if resend_api_key:
            resend.api_key = resend_api_key
            resend.Emails.send({
                "from": "EzHome Contact <onboarding@resend.dev>",
                "to": contact_email,
                "subject": f"New Contact Message from {payload.name}",
                "html": f"""
                <h2>New message from EzHome Contact Form</h2>
                <p><strong>Name:</strong> {payload.name}</p>
                <p><strong>Email:</strong> {payload.email}</p>
                <p><strong>Subject:</strong> {payload.subject}</p>
                <p><strong>Message:</strong></p>
                <p>{payload.message}</p>
                """
            })
    except Exception as e:
        logging.error(f"Email send failed: {e}")

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
    # purge old successful attempts older than 1 day
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
    # Client-side token clearing; no server-side state for JWT
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
    """Seeds the database with curated demo products. Idempotent - skips if already seeded."""
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
        {"title": "Aura Smart Ambient Lamp", "short_description": "Mood-shifting glow that learns your routine.", "description": "A sculptural smart lamp with 16M colors, voice control, and adaptive scenes. Designed for the modern minimalist home.", "image_url": "https://images.unsplash.com/photo-1565636192335-d3b7e23dfaa6?w=800&q=85", "category": "smart-home", "source": "amazon", "affiliate_url": "https://amazon.com/dp/B0SMART01", "original_price": 129.00, "discounted_price": 79.00, "rating": 4.8, "review_count": 2384, "badges": ["BEST SELLER"], "is_trending": True, "is_best_seller": True},
        {"title": "Echo Mist Aroma Diffuser", "short_description": "Whisper-quiet diffusion meets sculptural design.", "description": "Ultrasonic diffuser with 7-color ambient lighting and 12-hour runtime. Pure aroma therapy.", "image_url": "https://images.unsplash.com/photo-1611088335681-a7a204af3cc6?w=800&q=85", "category": "smart-home", "source": "amazon", "affiliate_url": "https://amazon.com/dp/B0SMART02", "original_price": 69.00, "discounted_price": 39.00, "rating": 4.7, "review_count": 1521, "badges": ["20% OFF"], "is_daily_deal": True},
        {"title": "Nova Motion Sensor Light", "short_description": "Auto-on warmth for every hallway.", "description": "Rechargeable motion-activated LED strip. Sleek, magnetic, and effortlessly modern.", "image_url": "https://images.unsplash.com/photo-1558002038-1055907df827?w=800&q=85", "category": "smart-home", "source": "temu", "affiliate_url": "https://temu.com/smart-light", "original_price": 39.00, "discounted_price": 19.00, "rating": 4.6, "review_count": 873, "badges": ["VIRAL"], "is_trending": True},
        {"title": "Pulse Mini Robot Vacuum", "short_description": "Whisper-quiet, app-controlled, brilliant.", "description": "Slim 2.7\" profile, smart mapping, 120 min runtime. The smartest cleaner you'll ever forget about.", "image_url": "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=800&q=85", "category": "smart-home", "source": "amazon", "affiliate_url": "https://amazon.com/dp/B0SMART04", "original_price": 299.00, "discounted_price": 199.00, "rating": 4.9, "review_count": 4210, "badges": ["BEST SELLER"], "is_best_seller": True, "is_trending": True},
        {"title": "Lumen Sunrise Wake Clock", "short_description": "Wake up the way nature intended.", "description": "Light therapy alarm clock that mimics the sunrise. Better sleep, better mornings.", "image_url": "https://images.unsplash.com/photo-1512446816042-444d641267d4?w=800&q=85", "category": "smart-home", "source": "amazon", "affiliate_url": "https://amazon.com/dp/B0SMART05", "original_price": 89.00, "discounted_price": 59.00, "rating": 4.7, "review_count": 1985, "badges": []},
        {"title": "Vox Pro Bluetooth Speaker", "short_description": "Studio sound. Pocket size.", "description": "360° immersive sound, 20-hour battery, waterproof aluminum body. Pure sonic luxury.", "image_url": "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=85", "category": "smart-home", "source": "amazon", "affiliate_url": "https://amazon.com/dp/B0SMART06", "original_price": 149.00, "discounted_price": 89.00, "rating": 4.8, "review_count": 3201, "badges": ["40% OFF"], "is_daily_deal": True},

        # --- Kitchen ---
        {"title": "Mira Marble Cutting Board", "short_description": "A sculpture you also cook on.", "description": "Hand-finished Carrara marble with built-in juice groove. Heirloom quality.", "image_url": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=85", "category": "kitchen", "source": "amazon", "affiliate_url": "https://amazon.com/dp/B0KITCH01", "original_price": 59.00, "discounted_price": 34.00, "rating": 4.9, "review_count": 1267, "badges": ["BEST SELLER"], "is_best_seller": True},
        {"title": "Verde Stoneware Mug Set", "short_description": "The mug you'll reach for every morning.", "description": "Hand-glazed stoneware in moss green. Set of 4. Microwave & dishwasher safe.", "image_url": "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800&q=85", "category": "kitchen", "source": "amazon", "affiliate_url": "https://amazon.com/dp/B0KITCH02", "original_price": 48.00, "discounted_price": 29.00, "rating": 4.8, "review_count": 2104, "badges": []},
        {"title": "Brio Electric Milk Frother", "short_description": "Café-quality foam in 60 seconds.", "description": "Whisper-quiet, dual-whisk, hot & cold settings. Your morning ritual just got upgraded.", "image_url": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=85", "category": "kitchen", "source": "amazon", "affiliate_url": "https://amazon.com/dp/B0KITCH03", "original_price": 49.00, "discounted_price": 26.00, "rating": 4.7, "review_count": 5832, "badges": ["VIRAL"], "is_trending": True},
        {"title": "Slate Knife Block Set", "short_description": "Japanese steel meets minimalist design.", "description": "6-piece high-carbon stainless set with magnetic wooden block. A chef's dream.", "image_url": "https://images.unsplash.com/photo-1593618998160-e34014e67546?w=800&q=85", "category": "kitchen", "source": "amazon", "affiliate_url": "https://amazon.com/dp/B0KITCH04", "original_price": 199.00, "discounted_price": 129.00, "rating": 4.9, "review_count": 942, "badges": ["35% OFF"], "is_daily_deal": True, "is_best_seller": True},
        {"title": "Loop Glass Storage Jars", "short_description": "Pantry porn, organized.", "description": "Set of 6 airtight borosilicate jars with bamboo lids. Beautiful and functional.", "image_url": "https://images.unsplash.com/photo-1591643002519-1ed18ddfb2cc?w=800&q=85", "category": "kitchen", "source": "temu", "affiliate_url": "https://temu.com/glass-jars", "original_price": 45.00, "discounted_price": 22.00, "rating": 4.6, "review_count": 1487, "badges": []},
        {"title": "Helio Pour-Over Coffee Set", "short_description": "Ritual-grade brewing, sculpted.", "description": "Borosilicate glass dripper, server, and walnut stand. For the coffee purist.", "image_url": "https://images.unsplash.com/photo-1530016070-4c12c1afd00d?w=800&q=85", "category": "kitchen", "source": "amazon", "affiliate_url": "https://amazon.com/dp/B0KITCH06", "original_price": 79.00, "discounted_price": 49.00, "rating": 4.8, "review_count": 678, "badges": []},

        # --- Decor ---
        {"title": "Sona Sculptural Vase", "short_description": "Quiet drama for any surface.", "description": "Hand-thrown ceramic vase with organic curves. An instant focal point.", "image_url": "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=800&q=85", "category": "decor", "source": "amazon", "affiliate_url": "https://amazon.com/dp/B0DECOR01", "original_price": 89.00, "discounted_price": 49.00, "rating": 4.8, "review_count": 421, "badges": ["NEW"]},
        {"title": "Mira Linen Throw Pillow", "short_description": "Belgian linen, hand-stitched edges.", "description": "Stonewashed linen pillow cover in oat. Down-feather insert included.", "image_url": "https://images.unsplash.com/photo-1584100936595-c0654b55a2e6?w=800&q=85", "category": "decor", "source": "amazon", "affiliate_url": "https://amazon.com/dp/B0DECOR02", "original_price": 65.00, "discounted_price": 39.00, "rating": 4.7, "review_count": 1893, "badges": ["BEST SELLER"], "is_best_seller": True},
        {"title": "Aria Boucle Floor Cushion", "short_description": "Floor seating, redefined.", "description": "Plush boucle cushion in cream. Reading nook essential.", "image_url": "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&q=85", "category": "decor", "source": "amazon", "affiliate_url": "https://amazon.com/dp/B0DECOR03", "original_price": 119.00, "discounted_price": 79.00, "rating": 4.6, "review_count": 543, "badges": []},
        {"title": "Nova Brass Candle Holder", "short_description": "Heirloom-grade brass, modern silhouette.", "description": "Set of 3 graduated brass taper holders. Dinner parties, elevated.", "image_url": "https://images.unsplash.com/photo-1602874801007-aa191aa6f4b3?w=800&q=85", "category": "decor", "source": "amazon", "affiliate_url": "https://amazon.com/dp/B0DECOR04", "original_price": 79.00, "discounted_price": 45.00, "rating": 4.9, "review_count": 327, "badges": []},
        {"title": "Sage Wall Mirror", "short_description": "Arched, oversized, irresistible.", "description": "32\" arched mirror with brushed brass frame. Instant room transformation.", "image_url": "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&q=85", "category": "decor", "source": "amazon", "affiliate_url": "https://amazon.com/dp/B0DECOR05", "original_price": 249.00, "discounted_price": 149.00, "rating": 4.8, "review_count": 2783, "badges": ["VIRAL"], "is_trending": True, "is_daily_deal": True},
        {"title": "Pluma Faux Pampas Set", "short_description": "Year-round texture, zero upkeep.", "description": "Premium faux pampas grass bundle. Looks impossibly real.", "image_url": "https://images.unsplash.com/photo-1602874801006-30be46a51a36?w=800&q=85", "category": "decor", "source": "temu", "affiliate_url": "https://temu.com/pampas", "original_price": 35.00, "discounted_price": 19.00, "rating": 4.5, "review_count": 1402, "badges": []},

        # --- Organization ---
        {"title": "Luma Acrylic Drawer Organizers", "short_description": "Find everything in 2 seconds.", "description": "12-piece modular acrylic system. Customizable for any drawer.", "image_url": "https://images.unsplash.com/photo-1606744824163-985d376605aa?w=800&q=85", "category": "organization", "source": "amazon", "affiliate_url": "https://amazon.com/dp/B0ORG01", "original_price": 49.00, "discounted_price": 29.00, "rating": 4.8, "review_count": 3892, "badges": ["BEST SELLER"], "is_best_seller": True, "is_trending": True},
        {"title": "Halo Closet Velvet Hangers", "short_description": "Slim. Strong. Suit-friendly.", "description": "Set of 50 ultra-thin velvet hangers. Saves 50% closet space.", "image_url": "https://images.unsplash.com/photo-1558997519-c3c7ab44e2cb?w=800&q=85", "category": "organization", "source": "amazon", "affiliate_url": "https://amazon.com/dp/B0ORG02", "original_price": 39.00, "discounted_price": 22.00, "rating": 4.9, "review_count": 8201, "badges": []},
        {"title": "Tessa Woven Storage Baskets", "short_description": "Storage that doubles as decor.", "description": "Hand-woven seagrass baskets, set of 3. Earth-toned versatility.", "image_url": "https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=800&q=85", "category": "organization", "source": "amazon", "affiliate_url": "https://amazon.com/dp/B0ORG03", "original_price": 65.00, "discounted_price": 39.00, "rating": 4.7, "review_count": 1574, "badges": []},
        {"title": "Pico Cable Management Box", "short_description": "Hide the chaos, beautifully.", "description": "Bamboo-topped cable organizer. Bye, ugly cords.", "image_url": "https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=800&q=85", "category": "organization", "source": "temu", "affiliate_url": "https://temu.com/cable-box", "original_price": 29.00, "discounted_price": 16.00, "rating": 4.5, "review_count": 921, "badges": ["VIRAL"]},

        # --- TikTok Finds ---
        {"title": "Bloom Rotating Makeup Organizer", "short_description": "TikTok's most-viewed beauty hack.", "description": "360° rotating acrylic vanity organizer. 92M views and counting.", "image_url": "https://images.unsplash.com/photo-1631214540242-3cd8c4b0b3b9?w=800&q=85", "category": "tiktok", "source": "amazon", "affiliate_url": "https://amazon.com/dp/B0TIK01", "original_price": 49.00, "discounted_price": 28.00, "rating": 4.7, "review_count": 12490, "badges": ["VIRAL"], "is_trending": True, "is_best_seller": True},
        {"title": "Cloud Slipper Slides", "short_description": "Walking on actual clouds.", "description": "Ultra-cushioned pillow slides. The slipper TikTok won't shut up about.", "image_url": "https://images.unsplash.com/photo-1603487742131-4160ec999306?w=800&q=85", "category": "tiktok", "source": "amazon", "affiliate_url": "https://amazon.com/dp/B0TIK02", "original_price": 39.00, "discounted_price": 19.00, "rating": 4.8, "review_count": 24891, "badges": ["VIRAL"], "is_trending": True},
        {"title": "Hydro Glow Water Bottle", "short_description": "Hydration goals, achieved.", "description": "32oz motivational time-marker bottle. Hits different.", "image_url": "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=85", "category": "tiktok", "source": "amazon", "affiliate_url": "https://amazon.com/dp/B0TIK03", "original_price": 35.00, "discounted_price": 22.00, "rating": 4.9, "review_count": 18203, "badges": ["VIRAL"], "is_trending": True, "is_daily_deal": True},
        {"title": "Aura LED Strip Lights", "short_description": "Vibe-shift your entire room.", "description": "50ft RGB LED strips with music sync and app control. Bedroom transformed.", "image_url": "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&q=85", "category": "tiktok", "source": "temu", "affiliate_url": "https://temu.com/led-strips", "original_price": 29.00, "discounted_price": 14.00, "rating": 4.6, "review_count": 9821, "badges": ["50% OFF"], "is_daily_deal": True},
        {"title": "Velvet Scrunchie Set", "short_description": "Zero-crease hair, every day.", "description": "20-pack soft velvet scrunchies in muted tones.", "image_url": "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=85", "category": "tiktok", "source": "temu", "affiliate_url": "https://temu.com/scrunchies", "original_price": 18.00, "discounted_price": 9.00, "rating": 4.7, "review_count": 4521, "badges": []},
        {"title": "Mini Stapler Handbag", "short_description": "The viral micro-bag of the year.", "description": "Compact crossbody in buttery vegan leather. As seen on every FYP.", "image_url": "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=85", "category": "tiktok", "source": "shein", "affiliate_url": "https://shein.com/mini-bag", "original_price": 32.00, "discounted_price": 18.00, "rating": 4.5, "review_count": 7821, "badges": ["VIRAL"], "is_trending": True},

        # --- Fashion (SHEIN) ---
        {"title": "Linen Wide Leg Trousers", "short_description": "Effortless cool, every wear.", "description": "Flowy linen-blend trousers in oat. Day-to-night versatile.", "image_url": "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&q=85", "category": "fashion", "source": "shein", "affiliate_url": "https://shein.com/trousers", "original_price": 39.00, "discounted_price": 22.00, "rating": 4.6, "review_count": 3421, "badges": ["BEST SELLER"], "is_best_seller": True},
        {"title": "Oversized Cashmere Blend Cardigan", "short_description": "The cozy you live in.", "description": "Slouchy open-front cardigan in camel. Pure throw-on luxury.", "image_url": "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=85", "category": "fashion", "source": "shein", "affiliate_url": "https://shein.com/cardigan", "original_price": 55.00, "discounted_price": 32.00, "rating": 4.7, "review_count": 2843, "badges": []},
        {"title": "Slip Satin Midi Dress", "short_description": "Quietly stunning, always.", "description": "Bias-cut satin in champagne. Wedding-guest perfection.", "image_url": "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=85", "category": "fashion", "source": "shein", "affiliate_url": "https://shein.com/slip-dress", "original_price": 45.00, "discounted_price": 26.00, "rating": 4.5, "review_count": 5273, "badges": ["VIRAL"], "is_trending": True},
        {"title": "Sculpted Square-Toe Boots", "short_description": "Knee-high power, modernized.", "description": "Faux-leather knee boots with architectural square toe.", "image_url": "https://images.unsplash.com/photo-1605812860427-4024433a70fd?w=800&q=85", "category": "fashion", "source": "shein", "affiliate_url": "https://shein.com/boots", "original_price": 79.00, "discounted_price": 45.00, "rating": 4.4, "review_count": 1923, "badges": ["40% OFF"], "is_daily_deal": True},
        {"title": "Gold Hoop Earring Set", "short_description": "Five hoops, infinite looks.", "description": "5-pack 18k gold-plated hoops in varied sizes. Hypoallergenic.", "image_url": "https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=800&q=85", "category": "fashion", "source": "shein", "affiliate_url": "https://shein.com/hoops", "original_price": 28.00, "discounted_price": 15.00, "rating": 4.8, "review_count": 6921, "badges": ["BEST SELLER"], "is_best_seller": True},
        {"title": "Knit Bodycon Mini Dress", "short_description": "The girls-night staple.", "description": "Ribbed knit dress in espresso. Hugs in all the right places.", "image_url": "https://images.unsplash.com/photo-1612722432474-b971cdcea546?w=800&q=85", "category": "fashion", "source": "shein", "affiliate_url": "https://shein.com/knit-dress", "original_price": 35.00, "discounted_price": 19.00, "rating": 4.5, "review_count": 4102, "badges": []},
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
    # Indexes
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

    # Seed admin user
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
            # password rotated in env — update hash
            await db.admin_users.update_one(
                {"email": ADMIN_EMAIL.lower()},
                {"$set": {"password_hash": hash_password(ADMIN_PASSWORD)}}
            )
            logger.info("Admin password hash refreshed from env")
    except Exception as e:
        logger.error(f"Admin seed error: {e}")

    # Auto-seed products if empty
    try:
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


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
