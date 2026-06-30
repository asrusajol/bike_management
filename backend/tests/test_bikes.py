import pytest

AUTH_BASE = "/api/v1/auth"
BIKES_BASE = "/api/v1/bikes"


async def register_and_login(client, email: str) -> dict:
    await client.post(f"{AUTH_BASE}/register", json={
        "email": email,
        "password": "testpass123",
        "full_name": "Test User",
    })
    resp = await client.post(f"{AUTH_BASE}/login", data={"username": email, "password": "testpass123"})
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}


@pytest.mark.asyncio
async def test_create_bike(client):
    headers = await register_and_login(client, "bike1@example.com")
    response = await client.post(BIKES_BASE + "/", json={
        "name": "My Yamaha",
        "make": "Yamaha",
        "model": "R15",
        "year": 2022,
        "odometer_unit": "km",
    }, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "My Yamaha"
    assert data["make"] == "Yamaha"


@pytest.mark.asyncio
async def test_list_bikes(client):
    headers = await register_and_login(client, "biklist@example.com")
    await client.post(BIKES_BASE + "/", json={"name": "Bike A"}, headers=headers)
    await client.post(BIKES_BASE + "/", json={"name": "Bike B"}, headers=headers)
    response = await client.get(BIKES_BASE + "/", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) == 2


@pytest.mark.asyncio
async def test_update_bike(client):
    headers = await register_and_login(client, "bikeupd@example.com")
    create_resp = await client.post(BIKES_BASE + "/", json={"name": "Old Name"}, headers=headers)
    bike_id = create_resp.json()["id"]
    response = await client.patch(f"{BIKES_BASE}/{bike_id}", json={"name": "New Name"}, headers=headers)
    assert response.status_code == 200
    assert response.json()["name"] == "New Name"


@pytest.mark.asyncio
async def test_delete_bike(client):
    headers = await register_and_login(client, "bikedel@example.com")
    create_resp = await client.post(BIKES_BASE + "/", json={"name": "Delete Me"}, headers=headers)
    bike_id = create_resp.json()["id"]
    del_resp = await client.delete(f"{BIKES_BASE}/{bike_id}", headers=headers)
    assert del_resp.status_code == 204
    get_resp = await client.get(f"{BIKES_BASE}/{bike_id}", headers=headers)
    assert get_resp.status_code == 404


@pytest.mark.asyncio
async def test_cannot_access_other_users_bike(client):
    h1 = await register_and_login(client, "owner@example.com")
    h2 = await register_and_login(client, "thief@example.com")
    create_resp = await client.post(BIKES_BASE + "/", json={"name": "Private Bike"}, headers=h1)
    bike_id = create_resp.json()["id"]
    response = await client.get(f"{BIKES_BASE}/{bike_id}", headers=h2)
    assert response.status_code == 404
