import os, sys, django
sys.path.append(r"a:\Work\Project\Talent_Link_Feb-26_Team-C\backend")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "talentlink.settings")
django.setup()

from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from contracts.models import Contract
from proposals.models import Proposal
from projects.models import Project

try:
    User = get_user_model()
    client_user = User.objects.create(username="c2", email="c2@test.com", role="CLIENT")
    freelancer_user = User.objects.create(username="f2", email="f2@test.com", role="FREELANCER")
    
    old_project = Project.objects.create(
        client=client_user, title="Old project", description="Desc", 
        budget_min=10, budget_max=20, duration_days=1
    )
    old_proposal = Proposal.objects.create(
        project=old_project, freelancer=freelancer_user, bid_value=15, 
        duration_days=1, cover_letter="test", status="accepted"
    )
    old_contract = Contract.objects.create(
        client=client_user, freelancer=freelancer_user, proposal=old_proposal,
        title="Old Contract", description="Test", budget=15,
        status="completed"
    )
    
    client = APIClient()
    client.force_authenticate(user=client_user)
    payload = {
        "title": "New project",
        "description": "Desc",
        "skills_required": "React",
        "budget_min": 100,
        "budget_max": 200,
        "duration_days": 30,
        "deadline_type": "flexible",
        "submission_deadline": None,
        "max_proposals": 20,
    }
    res = client.post('/api/projects/', payload, format='json')
    print("STATUS:", res.status_code)
    print("DATA:", res.data)
except Exception as e:
    import traceback
    traceback.print_exc()
