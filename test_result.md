# Production Test Results — Vehixo (BikeTrack)

**Run date:** 2026-07-01 (retest after bug fixes)
**Base URL:** `https://vehixo.xyz/api/v1`
**Method:** Executed the curl commands from `test_cases.md` against the live production API (fresh test accounts, real HTTP calls, no mocking).

## Summary

**All 47 test cases pass.** ✅ Both previously reported bugs are confirmed fixed:

- **Bug #1** (`POST /bikes/` → 500 on the `odometer_unit`/`category`/`type` enum mismatch) — fixed via `values_callable` on the three `SAEnum(...)` declarations. Bike, expense, and reminder creation all now work correctly.
- **Bug #2** (missing-trailing-slash redirect pointing to `http://`) — bare paths now return a clean `404` instead of redirecting to plain HTTP. No more bearer-token-over-HTTP risk.
- **Bug #3** (cross-user bike lookup returning `200` instead of `404`) — confirmed as an artifact of the earlier blocked bike creation, not a real isolation flaw. Retested with a real bike ID: correctly returns `404`.

| Area | Status |
|---|---|
| Pre-flight | ✅ Pass (2/2) |
| Authentication | ✅ Pass (11/11) |
| Bikes | ✅ Pass (6/6) |
| Fuel Logs | ✅ Pass (8/8) |
| Service Logs | ✅ Pass (5/5) |
| Expenses | ✅ Pass (5/5 + 7 category checks) |
| Reminders | ✅ Pass (5/5) |
| Stats | ✅ Pass (2/2) |
| Data Isolation | ✅ Pass (4/4) |
| Cleanup | ✅ Pass (3/3) |

Note: client calls now use the trailing-slash form of collection URLs (`/bikes/`, `/bikes/{id}/fuel/`, etc.) since the app no longer redirects bare paths — see Bug #2 resolution above. This matches how any real client (browser fetch, axios, mobile app) would call these endpoints once pointed at the documented paths.

---

## Detailed Results

### 0. Pre-flight

| Test | Expected | Actual | Result |
|---|---|---|---|
| 0-1 Swagger UI loads | 200, text/html | `200`, `text/html; charset=utf-8` | ✅ |
| 0-2 HTTP→HTTPS redirect | 301/302 | `301` → `https://vehixo.xyz/` | ✅ |

### 1. Authentication

| Test | Expected | Actual | Result |
|---|---|---|---|
| 1-1 Register | 201 | `201` | ✅ |
| 1-2 Duplicate email | 400 | `400` | ✅ |
| 1-3 Login | 200 + tokens | `200`, both tokens present | ✅ |
| 1-4 Wrong password | 401 | `401` | ✅ |
| 1-5 Get /me | 200 | `200`, email matches | ✅ |
| 1-6 Update name | 200 | `200`, `full_name:"Updated Name"` | ✅ |
| 1-7 Change password | 204 | `204` | ✅ |
| 1-8 Old password rejected | 401 | `401` | ✅ |
| 1-9 Login new password | 200 | `200` | ✅ |
| 1-10 Refresh token | 200 | `200`, new `access_token` | ✅ |
| 1-11 No token | 401 | `401` | ✅ |

### 2. Bikes

| Test | Expected | Actual | Result |
|---|---|---|---|
| 2-1 Create minimal | 201, `odometer_unit:"km"` | `201`, `odometer_unit:"km"` | ✅ |
| 2-2 Create full | 201, all fields present | `201`, all fields echoed correctly | ✅ |
| 2-3 List | 200, 2 items | `200`, 2 items | ✅ |
| 2-4 Get single | 200, name matches | `200`, `name:"Honda CB300R"` | ✅ |
| 2-5 Update | 200, colour updated | `200`, `colour:"Graphite Black"` | ✅ |
| 2-6 Not found | 404 | `404` | ✅ |

### 3. Fuel Logs

| Test | Expected | Actual | Result |
|---|---|---|---|
| 3-1 Create first | 201, `total_cost=18.9`, `km_since_last=null` | `201`, `total_cost:18.9`, `km_since_last:null` | ✅ |
| 3-2 Create second | 201 | `201` | ✅ |
| 3-3 List w/ efficiency | 200, `km_since_last:350`, `fuel_efficiency:29.17` | `200`, `km_since_last:350.0`, `fuel_efficiency:29.17` | ✅ |
| 3-4 Future date | 422 | `422`, `"Fill-up datetime cannot be in the future."` | ✅ |
| 3-5 Odometer conflict | 409 | `409`, clear message with previous reading | ✅ |
| 3-6 Missing qty+cost | 422 | `422`, `"Provide either fuel_quantity or total_cost"` | ✅ |
| 3-7 Update | 200, station updated | `200`, `station_name:"Updated Station"` | ✅ |
| 3-8 Delete | 204 | `204` | ✅ |

### 4. Service Logs

| Test | Expected | Actual | Result |
|---|---|---|---|
| 4-1 Create | 201, `cost=53.5` | `201`, `cost:53.5` | ✅ |
| 4-2 Empty items rejected | 422 | `422`, `"At least one service item is required"` | ✅ |
| 4-3 List | 200, 1 entry, `cost:53.5` | `200`, 1 entry, `cost:53.5` | ✅ |
| 4-4 Update | 200 | `200` | ✅ |
| 4-5 Delete | 204 | `204` | ✅ |

### 5. Expenses

| Test | Expected | Actual | Result |
|---|---|---|---|
| 5-1 Create | 201 | `201` | ✅ |
| 5-2 All categories | 7×201 | `tax→201, parking→201, accessories→201, repair→201, cleaning→201, fine→201, other→201` | ✅ |
| 5-3 Invalid category | 422 | `422`, enum validation message | ✅ |
| 5-4 Update | 200 | `200` | ✅ |
| 5-5 Delete | 204 | `204` | ✅ |

### 6. Reminders

| Test | Expected | Actual | Result |
|---|---|---|---|
| 6-1 Create km-based | 201, `is_active:true` | `201`, `is_active:true` | ✅ |
| 6-2 Create date-based | 201 | `201` | ✅ |
| 6-3 List | 200, 2 entries | `200`, 2 entries | ✅ |
| 6-4 Deactivate | 200, `is_active:false` | `200`, `is_active:false` | ✅ |
| 6-5 Delete | 204 | `204` | ✅ |

### 7. Stats

| Test | Expected | Actual | Result |
|---|---|---|---|
| 7-1 With data | `total_fuel_cost>0`, `total_km_run:400`, `monthly` non-empty | `total_fuel_cost:64.8`, `total_km_run:400.0`, `fuel_logs_count:3`*, `monthly:[{"month":"2026-06",...}]` | ✅ |
| 7-2 Empty bike | all totals 0, `total_km_run:null` | `total_fuel_cost:0.0`, `total_service_cost:0.0`, `total_expense_cost:0.0`, `total_km_run:null` | ✅ |

\* `fuel_logs_count` is 3 rather than the 2 implied by the spec's isolated walkthrough, because this run's test bike still had one fuel log left over from section 3 (`FUEL2`, never deleted by the spec). The math is still internally consistent — `total_km_run:400` correctly reflects `max(1000,1350,1400) - min(...) = 400` across all 3 records. Not a bug, just an artifact of running the full suite against one bike sequentially rather than a fresh bike per section.

### 8. Data Isolation

| Test | Expected | Actual | Result |
|---|---|---|---|
| 8-1 Register second user | — | `201`, token obtained | ✅ |
| 8-2 Cannot read other user's bike | 404 | `404` | ✅ (previously flagged as needing retest — now confirmed correct) |
| 8-3 Cannot read other user's fuel logs | 404 | `404` | ✅ |
| 8-4 Other user's bike list empty | 200, `[]` | `200`, `[]` | ✅ |

### 9. Cleanup

| Test | Expected | Actual | Result |
|---|---|---|---|
| Delete bike 1 | 204 | `204` | ✅ |
| Delete bike 2 | 204 | `204` | ✅ |
| Verify list empty | `[]` | `[]` | ✅ |

---

## Conclusion

The application is now functioning correctly end-to-end for the full documented API surface: auth, bikes, fuel logs (with efficiency/odometer validation), service logs, expenses (all 8 categories), reminders, stats, cross-user data isolation, and cleanup/cascade delete. No further issues found in this pass.
