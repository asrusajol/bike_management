# Bike Maintenance Cost Tracker — Project Plan

A web-first application to track motorcycle/bike maintenance costs over time: fuel, services, and other expenses. Inspired by apps like Drivvo.

---

## Tech Stack

### Backend
| Layer | Choice | Reason |
|---|---|---|
| Framework | **FastAPI** | Async, auto-generated OpenAPI docs, Pydantic validation |
| ORM | **SQLAlchemy 2.0** | Mature, async support, migration-friendly |
| Migrations | **Alembic** | Schema versioning |
| Database | **PostgreSQL** | Relational, JSON support for flexible expense metadata |
| Auth | **JWT (python-jose)** | Stateless, mobile-ready |
| Password hashing | **bcrypt (passlib)** | Industry standard |
| Task Queue | **Celery + Redis** | Background jobs: reminders, report generation |
| File Storage | **AWS S3 / local** | Receipt image uploads |

### Frontend (Web — Phase 1 target)
| Layer | Choice |
|---|---|
| Framework | **React 18 + TypeScript + Vite** |
| UI Library | **shadcn/ui + Tailwind CSS** |
| State / Server | **TanStack Query (React Query)** |
| Charts | **Recharts** |
| Forms | **React Hook Form + Zod** |
| Routing | **React Router v6** |

### Future Mobile (Phase 2 target)
- **React Native + Expo** — shares types and API client with the web app

### Infrastructure
| Concern | Choice |
|---|---|
| Containerization | Docker + docker-compose |
| CI/CD | GitHub Actions |
| Hosting (backend) | Railway / Render / AWS EC2 |
| Hosting (frontend) | Vercel / Netlify |
| Monitoring | Sentry (errors) + Prometheus (metrics) |

---

## Core Data Models

```
User
 ├── id, email, hashed_password, name, created_at

Bike
 ├── id, user_id (FK), name, make, model, year
 ├── odometer_unit (km/miles), purchase_date, purchase_price
 ├── plate_number, notes, image_url

FuelLog
 ├── id, bike_id (FK), date, odometer_reading
 ├── fuel_quantity (liters/gallons), fuel_price_per_unit
 ├── total_cost, station_name, is_full_tank, notes

ServiceLog
 ├── id, bike_id (FK), date, odometer_reading
 ├── service_type (enum: oil_change, tire, brake, chain, general, etc.)
 ├── cost, workshop_name, next_service_km, next_service_date, notes

Expense
 ├── id, bike_id (FK), date, category
 ├── (enum: insurance, tax, parking, accessories, repair, other)
 ├── cost, description, receipt_image_url, notes

Reminder
 ├── id, bike_id (FK), type, trigger_km, trigger_date
 ├── is_active, last_notified_at, notes
```

---

## Feature Breakdown

### Authentication
- [x] Register / Login / Logout
- [x] JWT access + refresh tokens
- [x] Password reset via email
- [x] Profile update

### Bike Management
- [x] Add / Edit / Delete a bike
- [x] Support multiple bikes per user
- [x] Upload bike photo
- [x] Set odometer unit (km or miles)
- [x] View bike summary card (total spend, fuel efficiency, last service)

### Fuel Logs
- [x] Log a refuel: date, odometer, quantity, price/unit, total cost
- [x] Full tank vs. partial fill flag
- [x] Calculate fuel efficiency (km/l or mpg) automatically
- [x] Fuel cost history chart

### Service Logs
- [x] Log service: type, cost, workshop, odometer
- [x] Set next service reminder (by km or date)
- [x] Service history timeline

### Other Expenses
- [x] Log any expense with category (insurance, tax, accessories, etc.)
- [x] Attach receipt photo
- [x] Expense category breakdown chart

### Dashboard
- [x] Total spend this month vs. last month
- [x] Cost breakdown by category (donut chart)
- [x] Fuel efficiency trend (line chart)
- [x] Cost per km over time
- [x] Upcoming reminders widget
- [x] Recent activity feed

### Reports & Analytics
- [x] Monthly/yearly cost summary
- [x] Fuel efficiency history
- [x] Cost by category over custom date range
- [x] Export to CSV / PDF

### Reminders & Notifications
- [x] Service due reminders (by date or odometer)
- [x] Email notifications (Celery + SMTP)
- [x] In-app notification badge

---

## Project Phases

### Phase 1 — Foundation & Backend Core (Weeks 1–3)
**Goal:** Fully functional REST API, tested and documented.

- [ ] Project scaffold: FastAPI app, Alembic, PostgreSQL, Docker setup
- [ ] User auth endpoints (register, login, refresh, reset password)
- [ ] Bike CRUD endpoints
- [ ] Fuel log CRUD + fuel efficiency calculation logic
- [ ] Service log CRUD
- [ ] Other expenses CRUD
- [ ] Input validation with Pydantic schemas
- [ ] Unit + integration tests (pytest)
- [ ] Auto-generated OpenAPI docs at `/docs`

**Deliverable:** Postman/Swagger-testable API running locally via docker-compose

---

### Phase 2 — Web Frontend Core (Weeks 4–7)
**Goal:** Usable web app covering the main daily-use flows.

- [ ] Vite + React + TypeScript project scaffold
- [ ] Auth pages: Login, Register, Forgot Password
- [ ] Bike management UI: list, add, edit, delete
- [ ] Fuel log UI: form, history list
- [ ] Service log UI: form, history timeline
- [ ] Expense log UI: form, history list
- [ ] Basic dashboard: KPI cards + cost breakdown chart
- [ ] Responsive layout (mobile-first CSS)
- [ ] API client layer (Axios + React Query)

**Deliverable:** Working web app, deployable to Vercel

---

### Phase 3 — Analytics, Reports & Reminders (Weeks 8–10)
**Goal:** Insights and retention features.

- [ ] Fuel efficiency trend chart (Recharts)
- [ ] Cost per km/month chart
- [ ] Monthly/yearly cost summary page
- [ ] Custom date range filter on all reports
- [ ] CSV export endpoint (backend) + download button (frontend)
- [ ] PDF report generation (backend: WeasyPrint or ReportLab)
- [ ] Reminder creation UI
- [ ] Celery worker + Redis setup for scheduled email reminders
- [ ] Email templates (HTML) for reminders

**Deliverable:** Full analytics dashboard, working reminders via email

---

### Phase 4 — Polish & Advanced Features (Weeks 11–13)
**Goal:** Production-ready web app.

- [ ] Receipt image upload (S3 or local storage)
- [ ] Dark mode
- [ ] Bike photo upload
- [ ] Multi-currency support (stored in user preferences)
- [ ] Odometer unit toggle (km ↔ miles) with on-the-fly conversion
- [ ] User profile page
- [ ] Delete account / data export (GDPR)
- [ ] CI/CD pipeline (GitHub Actions → Railway/Render)
- [ ] Sentry error tracking
- [ ] Rate limiting (slowapi)
- [ ] Load testing (locust)

**Deliverable:** Production-deployed web app with monitoring

---

### Phase 5 — Mobile App (Weeks 14–20)
**Goal:** Native mobile experience using React Native + Expo.

- [ ] Expo project scaffold with shared TypeScript types from web
- [ ] Reuse API client layer
- [ ] Auth flow (Login / Register)
- [ ] Bottom tab navigation
- [ ] Bike management screens
- [ ] Fuel log screens + quick-add floating button
- [ ] Service log screens
- [ ] Expense screens
- [ ] Dashboard with native charts (Victory Native)
- [ ] Push notifications (Expo Notifications) for reminders
- [ ] Camera integration for receipt capture
- [ ] Offline support (SQLite via Expo SQLite, sync on reconnect)
- [ ] App Store + Play Store submission

**Deliverable:** Published iOS and Android apps

---

## Repository Structure

```
bike_management/
├── backend/
│   ├── app/
│   │   ├── api/          # Route handlers (v1/)
│   │   ├── core/         # Config, security, dependencies
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic schemas (request/response)
│   │   ├── services/     # Business logic
│   │   ├── tasks/        # Celery tasks (reminders)
│   │   └── main.py
│   ├── alembic/          # DB migrations
│   ├── tests/
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── api/          # Axios client + React Query hooks
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Route-level page components
│   │   ├── stores/       # Zustand global state
│   │   └── types/        # Shared TypeScript types
│   ├── public/
│   └── package.json
│
├── mobile/               # Phase 5
│   └── (React Native + Expo)
│
├── docker-compose.yml
└── project_plan.md
```

---

## API Endpoint Summary

```
POST   /auth/register
POST   /auth/login
POST   /auth/refresh
POST   /auth/forgot-password
POST   /auth/reset-password

GET    /bikes                   # List user's bikes
POST   /bikes                   # Add a bike
GET    /bikes/{id}
PUT    /bikes/{id}
DELETE /bikes/{id}

GET    /bikes/{id}/fuel         # Fuel log list
POST   /bikes/{id}/fuel
PUT    /bikes/{id}/fuel/{log_id}
DELETE /bikes/{id}/fuel/{log_id}

GET    /bikes/{id}/services
POST   /bikes/{id}/services
PUT    /bikes/{id}/services/{log_id}
DELETE /bikes/{id}/services/{log_id}

GET    /bikes/{id}/expenses
POST   /bikes/{id}/expenses
PUT    /bikes/{id}/expenses/{log_id}
DELETE /bikes/{id}/expenses/{log_id}

GET    /bikes/{id}/reminders
POST   /bikes/{id}/reminders
DELETE /bikes/{id}/reminders/{rem_id}

GET    /bikes/{id}/stats        # Dashboard summary data
GET    /bikes/{id}/reports      # Analytics with ?from=&to=&group_by=
GET    /bikes/{id}/export       # CSV/PDF export
```

---

## Milestones & Timeline

| Milestone | Target Week | Status |
|---|---|---|
| Backend API complete + tested | Week 3 | Not started |
| Web app core flows working | Week 7 | Not started |
| Analytics + reminders live | Week 10 | Not started |
| Production web app deployed | Week 13 | Not started |
| Mobile app published | Week 20 | Not started |

---

## Open Decisions

1. **Database hosting** — Supabase (managed Postgres + free tier) vs. self-hosted
2. **Email provider** — SendGrid vs. AWS SES vs. Resend
3. **File storage** — AWS S3 vs. Cloudflare R2 (cheaper egress)
4. **Authentication** — Custom JWT vs. integrate Supabase Auth / Auth0
5. **Pricing model** — Free tier (1 bike) + Pro subscription (unlimited bikes + reports)?