# BikeTrack — Motorcycle Cost Tracker

A web-first application to track motorcycle running costs over time: fuel fills, service visits, and miscellaneous expenses. Inspired by Drivvo.

---

## Tech Stack

### Backend
| Layer | Choice |
|---|---|
| Framework | FastAPI 0.138 |
| ORM | SQLAlchemy 2.0 (async) |
| Migrations | Alembic 1.18 |
| Database | PostgreSQL (asyncpg driver) |
| Auth | JWT (python-jose) + bcrypt |
| Task Queue | Celery + Redis (scaffolded, not yet active) |
| File Storage | AWS S3 via boto3 (scaffolded, not yet active) |

### Frontend
| Layer | Choice |
|---|---|
| Framework | React 18 + TypeScript + Vite |
| UI / Styling | Tailwind CSS |
| State / Server | TanStack Query (React Query) |
| Charts | Recharts |
| Forms | Controlled components (no form library) |
| Routing | React Router v6 |

---

## Data Models (current schema after all migrations)

```
User
 ├── id (UUID PK)
 ├── email (unique), hashed_password, full_name
 ├── is_active, is_verified
 └── created_at, updated_at

Bike
 ├── id (UUID PK), user_id (FK → users)
 ├── name, make, model, year
 ├── cc, colour, tank_capacity          ← added in 0001 / 0002
 ├── odometer_unit (km | miles)
 ├── purchase_date, purchase_price, plate_number
 ├── notes, image_url
 └── created_at, updated_at

FuelLog
 ├── id (UUID PK), bike_id (FK → bikes)
 ├── logged_at (DateTime)               ← was `date` Date; changed in 0003
 ├── odometer_reading, fuel_quantity, fuel_price_per_unit, total_cost
 ├── is_full_tank, station_name, notes
 └── created_at, updated_at

ServiceLog
 ├── id (UUID PK), bike_id (FK → bikes)
 ├── logged_at (DateTime)               ← was `date` Date; changed in 0004
 ├── odometer_reading
 ├── service_items (JSONB)              ← was service_type Enum → TEXT[] → JSONB (0004/0005)
 │    [{name: str, cost: float}, ...]   ← individual line items
 ├── cost (Float)                       ← sum of service_items costs
 ├── workshop_name, next_service_km, next_service_date, notes
 └── created_at, updated_at

Expense
 ├── id (UUID PK), bike_id (FK → bikes)
 ├── logged_at (DateTime)               ← was `date` Date; changed in 0006
 ├── category (Enum: insurance | tax | parking | accessories | repair | cleaning | fine | other)
 ├── cost, description, receipt_image_url, notes
 └── created_at, updated_at

Reminder
 ├── id (UUID PK), bike_id (FK → bikes)
 ├── type (Enum: service | insurance | tax | custom)
 ├── title, trigger_km, trigger_date
 ├── is_active, last_notified_at, notes
 └── created_at, updated_at
```

---

## Migration History

| Revision | Description |
|---|---|
| `0000` | Initial schema — create all base tables |
| `0001` | Add `cc`, `colour` columns to `bikes` |
| `0002` | Add `tank_capacity` column to `bikes` |
| `0003` | Rename `fuel_logs.date` (Date) → `logged_at` (DateTime) |
| `0004` | Rename `service_logs.date` → `logged_at`; convert `service_type` Enum → `service_types` TEXT[] |
| `0005` | Convert `service_logs.service_types` TEXT[] → `service_items` JSONB with per-item costs |
| `0006` | Rename `expenses.date` (Date) → `logged_at` (DateTime) |

---

## Feature Status

### Authentication
- [x] Register / Login / Logout
- [x] JWT access tokens
- [ ] Refresh tokens
- [ ] Password reset via email
- [ ] Profile update page

### Bike Management
- [x] Add / Edit / Delete a bike
- [x] Multiple bikes per user
- [x] Bike selector in header / sidebar
- [ ] Bike photo upload

### Fuel Logs
- [x] Log a refuel: datetime, odometer, quantity, price/unit, total cost, tank %
- [x] Full tank vs. partial fill flag
- [x] Station name (with autocomplete from localStorage)
- [x] Fuel efficiency (km/L) calculated from consecutive full-tank fills
- [x] Fuel log history — desktop table + mobile cards
- [x] Bidirectional qty↔total calculation in Quick Add form

### Service Logs
- [x] Log a service: datetime, odometer, line-item list (name + cost each), workshop
- [x] Chip-based service type selector with custom types (stored in localStorage)
- [x] Next service reminder fields (km / date)
- [x] Service log history — desktop table + mobile cards

### Other Expenses
- [x] Log any expense: datetime, category, amount, description
- [x] Future datetime blocked on entry
- [x] Expense log history — desktop table + mobile cards
- [ ] Receipt photo upload

### Dashboard
- [x] Total spend + per-category KPI cards (mobile: break-all value, no truncation)
- [x] Average fuel efficiency card
- [x] Monthly cost bar chart
- [x] Global Quick Add — FAB (mobile, bottom-center) + sidebar button (desktop)

### Quick Add Modal
- [x] Accessible from any page via FAB / sidebar button
- [x] Bike selector when 2+ bikes exist
- [x] Three tabs: Fuel / Service / Expense
- [x] Mobile bottom sheet + desktop centered card
- [x] Drag handle on mobile, Escape key closes

### History / Timeline
- [x] Unified timeline: fuel, service, expense events merged and sorted newest-first
- [x] Grouped by month with month-total spend header
- [x] Day separator labels within each month
- [x] Color-coded dots: orange=Fuel, green=Service, purple=Expense
- [x] Filter pills: All | Fuel | Service | Expense

### Reports & Analytics
- [x] Filter tabs: Overall | Fuel | Service | Expenses
- [x] **Overall**: total KM run, daily avg KM, avg efficiency, cost overview, pie chart, monthly line + bar charts
- [x] **Fuel**: total cost, daily avg cost, avg/best/worst efficiency cards, monthly line + bar charts
- [x] **Service**: total cost, daily avg, per-visit avg, monthly line + bar charts
- [x] **Expenses**: total cost, daily avg, per-record avg, category pie + breakdown table, monthly charts
- [ ] Date range filter
- [ ] CSV / PDF export

### Reminders
- [x] Reminder model + backend API (scaffolded)
- [ ] Reminder creation UI
- [ ] Email notifications via Celery

### Mobile
- [x] Responsive sidebar — burger icon on mobile, collapsible drawer with backdrop
- [x] All log pages: dual-layout (table on desktop, cards on mobile)
- [x] StatCard column layout with `break-all` to handle long currency strings

---

## Repository Structure

```
bike_management/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/   # auth, bikes, fuel_logs, service_logs,
│   │   │                       # expenses, reminders, stats
│   │   ├── core/               # config, database, security, deps
│   │   ├── models/             # SQLAlchemy ORM models + enums
│   │   ├── schemas/            # Pydantic v2 request/response schemas
│   │   └── services/           # stats_service (monthly aggregates,
│   │                           #   efficiency range)
│   ├── alembic/
│   │   ├── versions/           # 0000 – 0006
│   │   └── env.py              # async Alembic runner
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── api/                # Axios client + React Query hooks
│   │   ├── components/
│   │   │   ├── layout/         # AppLayout, Sidebar
│   │   │   └── shared/         # QuickAddModal, StatCard, BikeSelector
│   │   ├── pages/
│   │   │   ├── auth/           # Login, Register
│   │   │   ├── bikes/          # BikesPage
│   │   │   ├── dashboard/      # DashboardPage
│   │   │   ├── fuel/           # FuelPage
│   │   │   ├── services/       # ServicesPage
│   │   │   ├── expenses/       # ExpensesPage
│   │   │   ├── history/        # HistoryPage (unified timeline)
│   │   │   └── stats/          # StatsPage (reports + analytics)
│   │   └── types/              # TypeScript interfaces (bike, fuel, service,
│   │                           #   expense, stats)
│   └── package.json
│
├── docker-compose.yml
└── project_plan.md
```

---

## API Endpoints (actual)

```
POST   /api/v1/auth/register
POST   /api/v1/auth/login

GET    /api/v1/bikes
POST   /api/v1/bikes
GET    /api/v1/bikes/{id}
PUT    /api/v1/bikes/{id}
DELETE /api/v1/bikes/{id}

GET    /api/v1/fuel-logs?bike_id=
POST   /api/v1/fuel-logs
PUT    /api/v1/fuel-logs/{id}
DELETE /api/v1/fuel-logs/{id}

GET    /api/v1/service-logs?bike_id=
POST   /api/v1/service-logs
PUT    /api/v1/service-logs/{id}
DELETE /api/v1/service-logs/{id}

GET    /api/v1/expenses?bike_id=
POST   /api/v1/expenses
PUT    /api/v1/expenses/{id}
DELETE /api/v1/expenses/{id}

GET    /api/v1/reminders?bike_id=
POST   /api/v1/reminders
DELETE /api/v1/reminders/{id}

GET    /api/v1/stats?bike_id=          # BikeStats: summary, monthly, efficiency,
                                       #   expense_by_category
```

---

## Roadmap

### Near-term
- [ ] Reminder creation UI + Celery email delivery
- [ ] Date range filter on Reports page
- [ ] CSV export
- [ ] Bike photo upload (S3)
- [ ] Receipt photo capture

### Future
- [ ] Refresh token rotation + silent re-auth
- [ ] Password reset via email
- [ ] Multi-currency support
- [ ] Odometer km ↔ miles toggle
- [ ] Dark mode
- [ ] React Native mobile app (iOS + Android)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Sentry error tracking
