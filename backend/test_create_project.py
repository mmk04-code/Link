import os
import django
import sys

sys.path.append(r"a:\Work\Project\Talent_Link_Feb-26_Team-C\backend")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "talentlink.settings")
django.setup()

from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()
client_user = User.objects.filter(role="CLIENT").first()
if not client_user:
    client_user, _ = User.objects.get_or_create(username="test_client_new", email="test@client.com", role="CLIENT")

client = APIClient()
client.force_authenticate(user=client_user)

payload = {
    "title": "Test project",
    "description": "Desc",
    "skills_required": "React",
    "budget_min": 100,
    "budget_max": 200,
    "duration_days": 30,
    "deadline_type": "flexible",
    "submission_deadline": None,
    "max_proposals": 20,
}

response = client.post('/api/projects/', payload, format='json')
print("Status Code:", response.status_code)
print("Response Data:", response.data)
