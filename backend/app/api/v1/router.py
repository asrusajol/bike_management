from fastapi import APIRouter

from app.api.v1.endpoints import auth, bikes, fuel, services, expenses, reminders, stats

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(bikes.router, prefix="/bikes", tags=["bikes"])
api_router.include_router(fuel.router, prefix="/bikes/{bike_id}/fuel", tags=["fuel"])
api_router.include_router(services.router, prefix="/bikes/{bike_id}/services", tags=["services"])
api_router.include_router(expenses.router, prefix="/bikes/{bike_id}/expenses", tags=["expenses"])
api_router.include_router(reminders.router, prefix="/bikes/{bike_id}/reminders", tags=["reminders"])
api_router.include_router(stats.router, prefix="/bikes/{bike_id}/stats", tags=["stats"])
