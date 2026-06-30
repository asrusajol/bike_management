import pytest

BASE = "/api/v1/auth"


@pytest.mark.asyncio
async def test_register_user(client):
    response = await client.post(f"{BASE}/register", json={
        "email": "test@example.com",
        "password": "testpass123",
        "full_name": "Test User",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert "id" in data
    assert "hashed_password" not in data


@pytest.mark.asyncio
async def test_register_duplicate_email(client):
    payload = {"email": "dup@example.com", "password": "pass", "full_name": "Dup"}
    await client.post(f"{BASE}/register", json=payload)
    response = await client.post(f"{BASE}/register", json=payload)
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_login_success(client):
    await client.post(f"{BASE}/register", json={
        "email": "login@example.com",
        "password": "testpass123",
        "full_name": "Login User",
    })
    response = await client.post(f"{BASE}/login", data={
        "username": "login@example.com",
        "password": "testpass123",
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_wrong_password(client):
    response = await client.post(f"{BASE}/login", data={
        "username": "test@example.com",
        "password": "wrongpass",
    })
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_me(client):
    await client.post(f"{BASE}/register", json={
        "email": "me@example.com",
        "password": "pass123",
        "full_name": "Me User",
    })
    login = await client.post(f"{BASE}/login", data={"username": "me@example.com", "password": "pass123"})
    token = login.json()["access_token"]
    response = await client.get(f"{BASE}/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["email"] == "me@example.com"
