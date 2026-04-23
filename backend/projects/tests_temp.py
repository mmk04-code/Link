from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from contracts.models import Contract
from proposals.models import Proposal
from projects.models import Project
from notifications.models import Notification

class ProjectCreateTest(TestCase):
    def test_create_with_past_contract(self):
        User = get_user_model()
        client_user = User.objects.create(username="c1", email="c1@test.com", role="CLIENT")
        freelancer_user = User.objects.create(username="f1", email="f1@test.com", role="FREELANCER")
        
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
        
        with open('test_res.txt', 'w') as f:
            f.write(f"STATUS: {res.status_code}\n")
            f.write(f"DATA: {res.data}\n")
