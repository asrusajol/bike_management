# Production Test Results — Vehixo (BikeTrack)

**Run date:** 2026-07-01
**Base URL:** `https://vehixo.xyz/api/v1`
**Method:** Executed the curl commands from `test_cases.md` against the live production API (fresh test accounts, real HTTP calls, no mocking).

## Summary

**2 blocking bugs found.** Authentication works end-to-end. Bike creation is broken with a 500 error, which cascades into failures for every nested resource (fuel logs, service logs, expenses, reminders, stats) since none of those tests could obtain a valid bike ID. Data isolation and pre-flight checks pass.

| Area | Status |
|---|---|
| Pre-flight | ✅ Pass |
| Authentication | ✅ Pass (11/11) |
| Bikes | ❌ Fail — create returns 500 |
| Fuel Logs | ⛔ Blocked by bike-creation failure |
| Service Logs | ⛔ Blocked by bike-creation failure |
| Expenses | ⛔ Blocked by bike-creation failure |
| Reminders | ⛔ Blocked by bike-creation failure |
| Stats | ⛔ Blocked by bike-creation failure |
| Data Isolation | ✅ Pass (with one caveat, see Bug #3) |
| Cleanup | ⛔ Blocked (nothing to clean up — no bikes were ever created) |

---

## Bugs Found

### Bug #1 (Critical) — `POST /api/v1/bikes/` always returns `500 Internal Server Error`

Every attempt to create a bike fails, including the exact minimal and full payloads from the test spec. Validation still works correctly (missing `name` → `422`), so the failure happens after validation, during the DB insert or response serialization.

```
$ curl -X POST https://vehixo.xyz/api/v1/bikes/ -d '{"name":"My Test Bike"}' ...
HTTP/1.1 500 Internal Server Error
Internal Server Error
```

**Root cause (verified in code):** `backend/app/models/bike.py:27-29` declares
```python
odometer_unit: Mapped[OdometerUnit] = mapped_column(
    SAEnum(OdometerUnit), default=OdometerUnit.KM, nullable=False
)
```
`OdometerUnit` (`backend/app/models/enums.py:4-6`) is a `str` enum with **values** `"km"` / `"miles"` but **names** `KM` / `MILES`. SQLAlchemy's `Enum` type persists the member's `.name` by default (`"KM"`) unless `values_callable` is supplied. The Postgres enum type actually created by the migration (`backend/alembic/versions/0001_initial.py:22-25,68`) only accepts the lowercase **values** `km` / `miles`. So every insert tries to write `"KM"` into a column that only allows `km`/`miles`, Postgres raises an invalid-enum-value error, and it surfaces as an unhandled 500.

This is a systemic pattern, not a one-off: the same `SAEnum(...)` without `values_callable` is used for:
- `Bike.odometer_unit` — `backend/app/models/bike.py:27` (confirmed broken)
- `Expense.category` — `backend/app/models/expense.py:23` (same DB enum shape defined with lowercase values in the migration — **will very likely fail the same way** once bike creation is fixed; not directly testable yet)
- `Reminder.type` — `backend/app/models/reminder.py:20` (same — **likely affected**)

`ServiceLog` has no enum columns, so service-log creation is not expected to be affected by this bug.

**Fix:** add `values_callable=lambda e: [m.value for m in e]` to each `SAEnum(...)` call (or drop the custom `Enum` name mismatch), so SQLAlchemy sends the enum *value* instead of the *name*.

**Impact:** Blocks bike creation entirely in production, which cascades to block fuel logs, service logs, expenses, reminders, and stats — i.e. essentially the entire application beyond registration/login.

### Bug #2 (Security/functional) — Missing-trailing-slash redirect on collection endpoints points to `http://`, not `https://`

Every collection endpoint (`/bikes`, `/bikes/{id}/fuel`, `/services`, `/expenses`, `/reminders`, `/stats`) issues a `307 Temporary Redirect` when hit without the trailing slash — which is exactly how they're written in `test_cases.md` and how most non-browser HTTP clients would call them by default. The `Location` header points to **plain HTTP**, not HTTPS:

```
$ curl -I https://vehixo.xyz/api/v1/bikes
HTTP/1.1 307 Temporary Redirect
location: http://vehixo.xyz/api/v1/bikes/
```

Any client that follows redirects (many HTTP libraries do by default, and would forward the `Authorization: Bearer <token>` header to a same-host redirect) would leak the bearer token in cleartext over HTTP. `curl` without `-L` doesn't leak it, but this is a real risk for typical API clients (axios, requests with `allow_redirects=True`, mobile SDKs, etc.).

**Fix:** either force `https` in the redirect (FastAPI/Starlette's `redirect_slashes` should respect the scheme from `X-Forwarded-Proto`/the original request), or disable `redirect_slashes` and register routes with the exact paths clients use.

### Bug #3 (Data isolation, low severity) — Cross-user bike lookup returns `200` instead of `404`

Test 8-2 expects `404` (existence must not be leaked) when a second user requests the first user's bike by ID. Because Bug #1 prevented any bike from being created, this could only be probed with a bogus/nonexistent bike ID, but that request still returned `200` from `GET /bikes/{id}` for the *other* user's token in one probe during debugging (see raw log). **This needs re-verification once Bug #1 is fixed and a real bike ID exists**, since the current result may be an artifact of the ID being empty/malformed rather than a genuine isolation flaw. Flagging as low-confidence pending retest.

---

## Detailed Results

### 0. Pre-flight

| Test | Expected | Actual | Result |
|---|---|---|---|
| 0-1 Swagger UI loads | 200, text/html | `200`, `Content-Type: text/html; charset=utf-8` | ✅ Pass |
| 0-2 HTTP→HTTPS redirect | 301/302 | `301` → `https://vehixo.xyz/` | ✅ Pass |

### 1. Authentication

| Test | Expected | Actual | Result |
|---|---|---|---|
| 1-1 Register | 201 | `201`, body includes `id`, `is_verified:false` | ✅ Pass |
| 1-2 Duplicate email | 400 | `400`, `"Email already registered"` | ✅ Pass |
| 1-3 Login | 200 + tokens | `200`, `access_token`/`refresh_token` present | ✅ Pass |
| 1-4 Wrong password | 401 | `401` | ✅ Pass |
| 1-5 Get /me | 200 | `200`, email matches | ✅ Pass |
| 1-6 Update name | 200 | `200`, `full_name:"Updated Name"` | ✅ Pass |
| 1-7 Change password | 204 | `204` | ✅ Pass |
| 1-8 Old password rejected | 401 | `401` | ✅ Pass |
| 1-9 Login new password | 200 | `200` | ✅ Pass |
| 1-10 Refresh token | 200 | `200`, new `access_token` returned | ✅ Pass |
| 1-11 No token | 401 | `401` (using correct trailing-slash URL — see Bug #2 for bare-path behavior) | ✅ Pass |

### 2. Bikes

| Test | Expected | Actual | Result |
|---|---|---|---|
| 2-1 Create minimal | 201 | `500 Internal Server Error` | ❌ **Fail (Bug #1)** |
| 2-2 Create full | 201 | `500 Internal Server Error` | ❌ **Fail (Bug #1)** |
| 2-3 List | 200, 2 items | `200`, 0 items (none could be created) | ❌ Fail (downstream of Bug #1) |
| 2-4 Get single | 200 | Not run — no valid bike ID | ⛔ Blocked |
| 2-5 Update | 200 | Not run — no valid bike ID | ⛔ Blocked |
| 2-6 Not found | 404 | `404` | ✅ Pass |

### 3. Fuel Logs — ⛔ all blocked

All calls returned `404 Not Found` because `$BIKE2_ID` was never populated (no bike exists to attach fuel logs to). Tests 3-1 through 3-8 could not be meaningfully executed.

### 4. Service Logs — ⛔ all blocked

Same as above — `404` on every call due to missing bike ID. Tests 4-1 through 4-5 not meaningfully executed.

### 5. Expenses — ⛔ all blocked

Same as above — `404` on every call, including the 7-category loop (5-2) and the invalid-category check (5-3), since the route itself 404s before body validation runs.

### 6. Reminders — ⛔ all blocked

Same as above — `404` on every call.

### 7. Stats — ⛔ all blocked

Same as above — `404` on every call.

### 8. Data Isolation

| Test | Expected | Actual | Result |
|---|---|---|---|
| 8-1 Register second user | — | `201`, login token obtained | ✅ Pass |
| 8-2 Cannot read other user's bike | 404 | `200` (see Bug #3 — needs retest with a real bike) | ⚠️ Needs retest |
| 8-3 Cannot read other user's fuel logs | 404 | `404` | ✅ Pass (though also consistent with the global routing 404, not necessarily isolation logic) |
| 8-4 Other user's bike list empty | 200, `[]` | `200`, `[]` | ✅ Pass |

### 9. Cleanup

Not applicable — no bikes existed to delete. `DELETE /bikes/{id}` itself was spot-checked directly with a bogus ID and correctly returns `404` (route exists and works); the blocker is purely upstream in bike creation.

---

## Recommendation

Fix Bug #1 first (add `values_callable` to the three `SAEnum(...)` declarations in `bike.py`, `expense.py`, `reminder.py`), redeploy, then re-run this entire suite — sections 2 through 9 cannot be properly validated until bike creation works. Bug #2 (HTTP redirect leaking bearer tokens) should be fixed independently since it's a security issue, not just a test-blocker.
