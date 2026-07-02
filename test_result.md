# Production Test Results — Vehixo (BikeTrack)

**Run date:** 2026-07-01 (retest after timezone-handling fix)
**Base URL:** `https://vehixo.xyz/api/v1`
**Method:** Executed the curl commands from the current `test_cases.md` (10 sections, including the new Section 9 — Timezone Handling) against the live production API using fresh test accounts.

## Summary

**All 50 automated test cases pass.** ✅

This run adds coverage for the newly added Section 9 (Timezone Handling), which verifies the fix for a bug where fuel/service/expense forms defaulted their date/time picker to UTC and the backend mislabeled naive local timestamps as UTC. All three automatable timezone checks pass:

- A past instant expressed with a `+06:00` offset is correctly accepted (the backend evaluates the real absolute instant, not a naive misread of the digits).
- A future instant expressed with a `+06:00` offset is still correctly rejected.
- Naive (offset-less) timestamps still fall back sanely to UTC (past accepted, future rejected).

Test 9-4 is a manual frontend/browser check (verifying the date picker shows local time and the request body sends an offset) and isn't automatable via curl — flagged as **not run**, recommend doing it manually in a non-UTC browser before considering this fully verified end-to-end.

Previously reported bugs (enum-mismatch 500 on bike/expense/reminder creation, and the HTTP-downgrade redirect) remain fixed — reconfirmed in this run.

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
| Timezone Handling | ✅ Pass (3/3 automated); ⚠️ 9-4 not run (manual browser check) |
| Cleanup | ✅ Pass (3/3) |

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

\* `fuel_logs_count` is 3 rather than the 2 implied by an isolated walkthrough, because this run's test bike still had one fuel log left over from section 3 (never deleted by the spec at that point). `total_km_run:400` is still correct — `max(1000,1350,1400) - min(...) = 400`. Not a bug, just an artifact of running the full suite sequentially against one bike.

### 8. Data Isolation

| Test | Expected | Actual | Result |
|---|---|---|---|
| 8-1 Register second user | — | `201`, token obtained | ✅ |
| 8-2 Cannot read other user's bike | 404 | `404` | ✅ |
| 8-3 Cannot read other user's fuel logs | 404 | `404` | ✅ |
| 8-4 Other user's bike list empty | 200, `[]` | `200`, `[]` | ✅ |

### 9. Timezone Handling (new section)

| Test | Expected | Actual | Result |
|---|---|---|---|
| 9-1 Past instant, `+06:00` offset | 201 | `201`, `logged_at` correctly normalized to `2026-07-01T07:40:51Z` (5 min before test time) | ✅ |
| 9-2 Future instant, `+06:00` offset | 422 | `422`, `"Fill-up datetime cannot be in the future."` | ✅ |
| 9-3 Naive timestamp fallback (past then future) | 201 then 422 | `201` (past-naive expense created), `422` `"Expense datetime cannot be in the future."` (future-naive rejected) | ✅ |
| 9-4 Manual frontend check | local time shown, no drift | Not run — requires a browser session with a non-UTC OS timezone; not automatable via curl | ⚠️ Not run |

The critical check here is 9-1: a timestamp written as `13:40` with a `+06:00` offset is only 5 minutes in the past in absolute terms, but a naive-UTC misread of those same digits would place it ~6 hours in the future and get wrongly rejected. Since it returned `201` with `logged_at` correctly normalized to the UTC instant, the offset is being honored correctly — confirming the reported bug is fixed on the backend. Recommend running 9-4 manually in a non-UTC browser to confirm the frontend side (date picker default and payload format) before fully closing this out.

### 10. Cleanup

| Test | Expected | Actual | Result |
|---|---|---|---|
| Delete bike 1 | 204 | `204` | ✅ |
| Delete bike 2 | 204 | `204` | ✅ |
| Verify list empty | `[]` | `[]` | ✅ |

---

## Conclusion

All automated tests pass across the full documented API surface, including the new timezone-handling fix. The only outstanding item is the manual frontend check (9-4), which needs a human to verify in a browser with a non-UTC system clock — recommend doing that before signing off on the timezone fix end-to-end.
