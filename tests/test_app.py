from urllib.parse import quote

from app import activities


def activity_path(activity_name: str) -> str:
    return quote(activity_name, safe="")


def test_get_activities_returns_all(client):
    response = client.get("/activities")

    assert response.status_code == 200
    payload = response.json()
    assert "Soccer Team" in payload
    assert payload["Soccer Team"]["participants"]


def test_signup_for_activity_success(client):
    activity_name = "Chess Club"
    new_email = "newstudent@mergington.edu"

    response = client.post(
        f"/activities/{activity_path(activity_name)}/signup",
        params={"email": new_email},
    )

    assert response.status_code == 200
    assert new_email in activities[activity_name]["participants"]


def test_signup_duplicate_fails(client):
    activity_name = "Soccer Team"
    existing_email = activities[activity_name]["participants"][0]

    response = client.post(
        f"/activities/{activity_path(activity_name)}/signup",
        params={"email": existing_email},
    )

    assert response.status_code == 400
    assert "already signed up" in response.json()["detail"]


def test_unregister_participant_success(client):
    activity_name = "Swimming Club"
    existing_email = activities[activity_name]["participants"][0]

    response = client.delete(
        f"/activities/{activity_path(activity_name)}/participants/{existing_email}"
    )

    assert response.status_code == 200
    assert existing_email not in activities[activity_name]["participants"]


def test_unregister_missing_participant_returns_404(client):
    activity_name = "Debate Team"
    missing_email = "doesnotexist@mergington.edu"

    response = client.delete(
        f"/activities/{activity_path(activity_name)}/participants/{missing_email}"
    )

    assert response.status_code == 404
    assert "not registered" in response.json()["detail"]
