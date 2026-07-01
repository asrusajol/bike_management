# Production Test Cases — Vehixo (BikeTrack)

**Base URL:** `https://vehixo.xyz/api/v1`  
**Docs:** `https://vehixo.xyz/api/v1/docs`

All `curl` commands print the HTTP status alongside the body. Replace placeholder values (e.g. `{BIKE_ID}`) with real UUIDs as you work through the tests.

---

## 0. Pre-flight

### 0-1 — Swagger UI loads

```bash
curl -I https://vehixo.xyz/api/v1/docs
```

**Expected:** `200 OK`, `Content-Type: text/html`

### 0-2 — HTTPS redirect works

```bash
curl -I http://vehixo.xyz/
```

**Expected:** `301` or `302` redirect to `https://vehixo.xyz/`

---

## 1. Authentication

### 1-1 — Register a new user

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  -X POST https://vehixo.xyz/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com","password":"Test@1234","full_name":"Test User"}'
```

**Expected:** `201`  
**Save** the returned `id` for later checks.

### 1-2 — Duplicate email is rejected

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  -X POST https://vehixo.xyz/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com","password":"Test@1234","full_name":"Test User"}'
```

**Expected:** `400`

### 1-3 — Login with correct credentials

```bash
curl -s -X POST https://vehixo.xyz/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=testuser@example.com&password=Test@1234"
```

**Expected:** `200`, body contains `access_token` and `refresh_token`.  
**Save** both tokens:

```bash
ACCESS_TOKEN="<paste access_token here>"
REFRESH_TOKEN="<paste refresh_token here>"
```

### 1-4 — Login with wrong password

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  -X POST https://vehixo.xyz/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=testuser@example.com&password=WrongPassword"
```

**Expected:** `401`

### 1-5 — Get own profile

```bash
curl -s -X GET https://vehixo.xyz/api/v1/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected:** `200`, email matches `testuser@example.com`.

### 1-6 — Update profile name

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  -X PATCH https://vehixo.xyz/api/v1/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Updated Name"}'
```

**Expected:** `200`, `full_name` is `"Updated Name"`.

### 1-7 — Change password

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  -X POST https://vehixo.xyz/api/v1/auth/me/change-password \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"current_password":"Test@1234","new_password":"NewPass@5678"}'
```

**Expected:** `204`

### 1-8 — Old password rejected after change

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  -X POST https://vehixo.xyz/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=testuser@example.com&password=Test@1234"
```

**Expected:** `401`

### 1-9 — Login with new password and get fresh tokens

```bash
curl -s -X POST https://vehixo.xyz/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=testuser@example.com&password=NewPass@5678"
```

**Expected:** `200`. Update `$ACCESS_TOKEN` and `$REFRESH_TOKEN`.

### 1-10 — Refresh token returns new access token

```bash
curl -s -X POST https://vehixo.xyz/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\":\"$REFRESH_TOKEN\"}"
```

**Expected:** `200`, new `access_token` returned. Update `$ACCESS_TOKEN`.

### 1-11 — Request without token is rejected

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  https://vehixo.xyz/api/v1/bikes
```

**Expected:** `401`

---

## 2. Bikes

### 2-1 — Create a bike (minimal fields)

```bash
curl -s -X POST https://vehixo.xyz/api/v1/bikes \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"My Test Bike"}'
```

**Expected:** `201`, response includes `id`, `odometer_unit` defaults to `"km"`.  
**Save:** `BIKE_ID="<id from response>"`

### 2-2 — Create a bike (all fields)

```bash
curl -s -X POST https://vehixo.xyz/api/v1/bikes \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Honda CB300R",
    "make":"Honda",
    "model":"CB300R",
    "year":2023,
    "cc":300,
    "colour":"Pearl Glare White",
    "tank_capacity":12.0,
    "odometer_unit":"km",
    "purchase_date":"2023-05-15",
    "purchase_price":4500.00,
    "plate_number":"DHK-1234"
  }'
```

**Expected:** `201`, all supplied fields present in response.  
**Save:** `BIKE2_ID="<id from response>"`

### 2-3 — List bikes

```bash
curl -s https://vehixo.xyz/api/v1/bikes \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected:** `200`, array with 2 bikes.

### 2-4 — Get single bike

```bash
curl -s https://vehixo.xyz/api/v1/bikes/$BIKE2_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected:** `200`, `name` is `"Honda CB300R"`.

### 2-5 — Update bike

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  -X PATCH https://vehixo.xyz/api/v1/bikes/$BIKE2_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"colour":"Graphite Black","notes":"Updated colour"}'
```

**Expected:** `200`, `colour` is `"Graphite Black"`.

### 2-6 — Get non-existent bike

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  https://vehixo.xyz/api/v1/bikes/00000000-0000-0000-0000-000000000000 \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected:** `404`

---

## 3. Fuel Logs

### 3-1 — Create first fuel log

```bash
curl -s -X POST https://vehixo.xyz/api/v1/bikes/$BIKE2_ID/fuel \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "logged_at":"2026-06-01T08:00:00Z",
    "odometer_reading":1000,
    "fuel_quantity":10.5,
    "fuel_price_per_unit":1.80,
    "is_full_tank":true,
    "station_name":"Petrol Plus"
  }'
```

**Expected:** `201`, `total_cost` auto-calculated (`10.5 × 1.80 = 18.9`), `km_since_last` is `null` (first entry).  
**Save:** `FUEL1_ID="<id>"`

### 3-2 — Create second fuel log (efficiency computed)

```bash
curl -s -X POST https://vehixo.xyz/api/v1/bikes/$BIKE2_ID/fuel \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "logged_at":"2026-06-08T10:00:00Z",
    "odometer_reading":1350,
    "fuel_quantity":12.0,
    "fuel_price_per_unit":1.80,
    "is_full_tank":true
  }'
```

**Expected:** `201`.  
**Save:** `FUEL2_ID="<id>"`

### 3-3 — List fuel logs returns efficiency

```bash
curl -s https://vehixo.xyz/api/v1/bikes/$BIKE2_ID/fuel \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected:** `200`, latest entry has `km_since_last: 350`, `fuel_efficiency: 29.17` (350 ÷ 12).

### 3-4 — Future date is rejected

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  -X POST https://vehixo.xyz/api/v1/bikes/$BIKE2_ID/fuel \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "logged_at":"2030-01-01T00:00:00Z",
    "odometer_reading":2000,
    "fuel_quantity":10,
    "fuel_price_per_unit":2.00
  }'
```

**Expected:** `422`

### 3-5 — Odometer conflict rejected (lower than previous)

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  -X POST https://vehixo.xyz/api/v1/bikes/$BIKE2_ID/fuel \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "logged_at":"2026-06-15T10:00:00Z",
    "odometer_reading":900,
    "fuel_quantity":10,
    "fuel_price_per_unit":2.00
  }'
```

**Expected:** `409`

### 3-6 — Either fuel_quantity or total_cost required

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  -X POST https://vehixo.xyz/api/v1/bikes/$BIKE2_ID/fuel \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "logged_at":"2026-06-15T10:00:00Z",
    "odometer_reading":1400,
    "fuel_price_per_unit":2.00
  }'
```

**Expected:** `422`

### 3-7 — Update fuel log

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  -X PATCH https://vehixo.xyz/api/v1/bikes/$BIKE2_ID/fuel/$FUEL1_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"station_name":"Updated Station"}'
```

**Expected:** `200`, `station_name` updated.

### 3-8 — Delete fuel log

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  -X DELETE https://vehixo.xyz/api/v1/bikes/$BIKE2_ID/fuel/$FUEL1_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected:** `204`

---

## 4. Service Logs

### 4-1 — Create service log

```bash
curl -s -X POST https://vehixo.xyz/api/v1/bikes/$BIKE2_ID/services \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "logged_at":"2026-06-10T09:00:00Z",
    "odometer_reading":1300,
    "service_items":[
      {"name":"Oil Change","cost":35.00},
      {"name":"Air Filter","cost":18.50}
    ],
    "workshop_name":"QuickFix Motors",
    "next_service_km":3300,
    "next_service_date":"2026-12-10"
  }'
```

**Expected:** `201`, `cost` auto-summed to `53.5`.  
**Save:** `SVC_ID="<id>"`

### 4-2 — Empty service_items rejected

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  -X POST https://vehixo.xyz/api/v1/bikes/$BIKE2_ID/services \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "logged_at":"2026-06-12T09:00:00Z",
    "service_items":[]
  }'
```

**Expected:** `422`

### 4-3 — List service logs

```bash
curl -s https://vehixo.xyz/api/v1/bikes/$BIKE2_ID/services \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected:** `200`, 1 entry, `cost: 53.5`.

### 4-4 — Update service log

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  -X PATCH https://vehixo.xyz/api/v1/bikes/$BIKE2_ID/services/$SVC_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"workshop_name":"BetterGarage"}'
```

**Expected:** `200`

### 4-5 — Delete service log

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  -X DELETE https://vehixo.xyz/api/v1/bikes/$BIKE2_ID/services/$SVC_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected:** `204`

---

## 5. Expenses

### 5-1 — Create expense

```bash
curl -s -X POST https://vehixo.xyz/api/v1/bikes/$BIKE2_ID/expenses \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "logged_at":"2026-06-05T00:00:00Z",
    "category":"insurance",
    "cost":280.00,
    "description":"Annual comprehensive insurance"
  }'
```

**Expected:** `201`.  
**Save:** `EXP1_ID="<id>"`

### 5-2 — Create expense with each valid category

Test one entry per category to confirm enum acceptance:

```bash
for cat in tax parking accessories repair cleaning fine other; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST https://vehixo.xyz/api/v1/bikes/$BIKE2_ID/expenses \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"logged_at\":\"2026-06-06T00:00:00Z\",\"category\":\"$cat\",\"cost\":10}")
  echo "$cat → $CODE"
done
```

**Expected:** All `201`

### 5-3 — Invalid category rejected

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  -X POST https://vehixo.xyz/api/v1/bikes/$BIKE2_ID/expenses \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"logged_at":"2026-06-06T00:00:00Z","category":"lunch","cost":10}'
```

**Expected:** `422`

### 5-4 — Update expense

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  -X PATCH https://vehixo.xyz/api/v1/bikes/$BIKE2_ID/expenses/$EXP1_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"cost":295.00}'
```

**Expected:** `200`

### 5-5 — Delete expense

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  -X DELETE https://vehixo.xyz/api/v1/bikes/$BIKE2_ID/expenses/$EXP1_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected:** `204`

---

## 6. Reminders

### 6-1 — Create km-based reminder

```bash
curl -s -X POST https://vehixo.xyz/api/v1/bikes/$BIKE2_ID/reminders \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type":"service",
    "title":"Next Oil Change",
    "trigger_km":3500
  }'
```

**Expected:** `201`, `is_active: true`.  
**Save:** `REM1_ID="<id>"`

### 6-2 — Create date-based reminder

```bash
curl -s -X POST https://vehixo.xyz/api/v1/bikes/$BIKE2_ID/reminders \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type":"insurance",
    "title":"Renew Insurance",
    "trigger_date":"2026-12-01"
  }'
```

**Expected:** `201`.  
**Save:** `REM2_ID="<id>"`

### 6-3 — List reminders

```bash
curl -s https://vehixo.xyz/api/v1/bikes/$BIKE2_ID/reminders \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected:** `200`, 2 entries.

### 6-4 — Deactivate reminder

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  -X PATCH https://vehixo.xyz/api/v1/bikes/$BIKE2_ID/reminders/$REM1_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"is_active":false}'
```

**Expected:** `200`, `is_active: false`.

### 6-5 — Delete reminder

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  -X DELETE https://vehixo.xyz/api/v1/bikes/$BIKE2_ID/reminders/$REM2_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected:** `204`

---

## 7. Stats

### 7-1 — Get bike stats

Re-create a fuel log so there is data for stats:

```bash
curl -s -X POST https://vehixo.xyz/api/v1/bikes/$BIKE2_ID/fuel \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"logged_at":"2026-06-01T08:00:00Z","odometer_reading":1000,"fuel_quantity":10,"fuel_price_per_unit":1.80}'

curl -s -X POST https://vehixo.xyz/api/v1/bikes/$BIKE2_ID/fuel \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"logged_at":"2026-06-10T08:00:00Z","odometer_reading":1400,"fuel_quantity":14,"fuel_price_per_unit":1.80}'
```

Then fetch stats:

```bash
curl -s https://vehixo.xyz/api/v1/bikes/$BIKE2_ID/stats \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected:** `200`, `summary` contains:
- `total_fuel_cost > 0`
- `total_km_run: 400`
- `fuel_logs_count: 2`
- `monthly` array is non-empty

### 7-2 — Stats for bike with no logs

```bash
curl -s https://vehixo.xyz/api/v1/bikes/$BIKE_ID/stats \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected:** `200`, all cost totals are `0`, `total_km_run` is `null`.

---

## 8. Data Isolation (Cross-user Security)

Register a second user and verify they cannot access the first user's data.

### 8-1 — Register second user and get token

```bash
curl -s -X POST https://vehixo.xyz/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"otheruser@example.com","password":"Other@1234","full_name":"Other User"}'

OTHER_TOKEN=$(curl -s -X POST https://vehixo.xyz/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=otheruser@example.com&password=Other@1234" | \
  python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
```

### 8-2 — Cannot read another user's bike

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  https://vehixo.xyz/api/v1/bikes/$BIKE2_ID \
  -H "Authorization: Bearer $OTHER_TOKEN"
```

**Expected:** `404` (not 403 — existence must not be leaked)

### 8-3 — Cannot read another user's fuel logs

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  https://vehixo.xyz/api/v1/bikes/$BIKE2_ID/fuel \
  -H "Authorization: Bearer $OTHER_TOKEN"
```

**Expected:** `404`

### 8-4 — Other user's bike list is empty

```bash
curl -s https://vehixo.xyz/api/v1/bikes \
  -H "Authorization: Bearer $OTHER_TOKEN"
```

**Expected:** `200`, empty array `[]`

---

## 9. Cleanup

Delete test bikes (cascades to all logs and reminders):

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  -X DELETE https://vehixo.xyz/api/v1/bikes/$BIKE_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN"
# Expected: 204

curl -s -o /dev/null -w "%{http_code}\n" \
  -X DELETE https://vehixo.xyz/api/v1/bikes/$BIKE2_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN"
# Expected: 204
```

Verify bike list is empty:

```bash
curl -s https://vehixo.xyz/api/v1/bikes \
  -H "Authorization: Bearer $ACCESS_TOKEN"
# Expected: []
```

---

## Pass / Fail Checklist

| Section | Test | Expected | Result |
|---|---|---|---|
| Pre-flight | 0-1 Swagger loads | 200 | |
| Pre-flight | 0-2 HTTP→HTTPS redirect | 301/302 | |
| Auth | 1-1 Register | 201 | |
| Auth | 1-2 Duplicate email | 400 | |
| Auth | 1-3 Login | 200 + tokens | |
| Auth | 1-4 Wrong password | 401 | |
| Auth | 1-5 Get /me | 200 | |
| Auth | 1-6 Update name | 200 | |
| Auth | 1-7 Change password | 204 | |
| Auth | 1-8 Old password rejected | 401 | |
| Auth | 1-9 Login new password | 200 | |
| Auth | 1-10 Refresh token | 200 | |
| Auth | 1-11 No token | 401 | |
| Bikes | 2-1 Create minimal | 201 | |
| Bikes | 2-2 Create full | 201 | |
| Bikes | 2-3 List | 200, 2 items | |
| Bikes | 2-4 Get single | 200 | |
| Bikes | 2-5 Update | 200 | |
| Bikes | 2-6 Not found | 404 | |
| Fuel | 3-1 Create (qty) | 201 | |
| Fuel | 3-2 Create (efficiency) | 201 | |
| Fuel | 3-3 List with efficiency | 200 | |
| Fuel | 3-4 Future date | 422 | |
| Fuel | 3-5 Odo conflict | 409 | |
| Fuel | 3-6 Missing qty+cost | 422 | |
| Fuel | 3-7 Update | 200 | |
| Fuel | 3-8 Delete | 204 | |
| Service | 4-1 Create | 201 | |
| Service | 4-2 Empty items | 422 | |
| Service | 4-3 List | 200 | |
| Service | 4-4 Update | 200 | |
| Service | 4-5 Delete | 204 | |
| Expenses | 5-1 Create | 201 | |
| Expenses | 5-2 All categories | 7 × 201 | |
| Expenses | 5-3 Invalid category | 422 | |
| Expenses | 5-4 Update | 200 | |
| Expenses | 5-5 Delete | 204 | |
| Reminders | 6-1 Create km | 201 | |
| Reminders | 6-2 Create date | 201 | |
| Reminders | 6-3 List | 200, 2 items | |
| Reminders | 6-4 Deactivate | 200, is_active=false | |
| Reminders | 6-5 Delete | 204 | |
| Stats | 7-1 With data | 200, totals > 0 | |
| Stats | 7-2 Empty bike | 200, totals = 0 | |
| Isolation | 8-2 Other user bike | 404 | |
| Isolation | 8-3 Other user fuel | 404 | |
| Isolation | 8-4 Other user list | 200, [] | |
| Cleanup | Delete bikes | 204 | |
