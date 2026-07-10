import pytest


@pytest.mark.asyncio
async def test_create_and_list_triage_record(client):
    response = await client.post(
        "/triage",
        json={
            "patient_name": "Amina Otieno",
            "condition_description": "Severe chest pain with shortness of breath",
            "priority": 1,
            "status": "Pending",
            "synced": True,
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["data"]["priority"] == 1

    list_response = await client.get("/triage", params={"priority": 1})

    assert list_response.status_code == 200
    list_body = list_response.json()
    assert list_body["meta"]["total"] == 1
    assert list_body["data"][0]["patient_name"] == "Amina Otieno"


@pytest.mark.asyncio
async def test_rejects_invalid_priority(client):
    response = await client.post(
        "/triage",
        json={
            "patient_name": "Amina Otieno",
            "condition_description": "Stable",
            "priority": 9,
            "status": "Pending",
        },
    )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_update_and_delete_triage_record(client):
    created = await client.post(
        "/triage",
        json={
            "patient_name": "Brian Mwangi",
            "condition_description": "Fractured arm",
            "priority": 3,
            "status": "In-Transit",
        },
    )
    record_id = created.json()["data"]["id"]

    updated = await client.patch(f"/triage/{record_id}", json={"priority": 2})
    assert updated.status_code == 200
    assert updated.json()["data"]["priority"] == 2

    deleted = await client.delete(f"/triage/{record_id}")
    assert deleted.status_code == 204

    missing = await client.get(f"/triage/{record_id}")
    assert missing.status_code == 404
