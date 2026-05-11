# EzHome Auth Testing

## Setup
Backend at `0.0.0.0:8001`, external base URL from `/app/frontend/.env` `REACT_APP_BACKEND_URL`.
Admin user is auto-seeded on startup.

## MongoDB Verification
```
mongosh
use test_database
db.admin_users.findOne({email: "admin@ezhome.shop"}, {password_hash: 1})
db.admin_users.getIndexes()
db.login_attempts.find().sort({ts:-1}).limit(5)
```
Verify:
- bcrypt hash starts with `$2b$`
- Unique index on `admin_users.email`
- `login_attempts.identifier` index exists

## API Testing
```bash
API=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d '=' -f2)

# Login
TOKEN=$(curl -s -X POST "$API/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ezhome.shop","password":"ezhome-admin-2026"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['access_token'])")

# /me
curl -s "$API/api/auth/me" -H "Authorization: Bearer $TOKEN"

# Protected without token → 401
curl -s -o /dev/null -w "%{http_code}\n" -X POST "$API/api/products" \
  -H "Content-Type: application/json" -d '{}'

# Brute-force: 5 wrong attempts then 6th returns 429
for i in {1..6}; do
  echo -n "attempt $i: "
  curl -s -o /dev/null -w "%{http_code}\n" -X POST "$API/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@ezhome.shop","password":"wrong"}'
done
```

## Frontend
- `/admin/login` — email + password form
- `/admin` — protected layout; redirects to login when no token
- `/admin/products` — full CRUD with search + category filter + edit drawer
- `/admin/banners` — CRUD banners
- `/admin/settings` — site-wide toggles (announcement, hero overline, popup, countdown)
- All admin routes show "Authenticating…" while `/api/auth/me` is checked, then redirect or render
- 401 from any API call (e.g. token expiry) → axios interceptor clears token + redirects to login
