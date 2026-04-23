from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from contracts.models import Contract
from proposals.models import Proposal
from projects.models import Project

def main():
    try:
        User = get_user_model()
        client_user, _ = User.objects.get_or_create(username="c_sh", email="c_sh@test.com", role="CLIENT")
        freelancer_user, _ = User.objects.get_or_create(username="f_sh", email="f_sh@test.com", role="FREELANCER")

        old_project, _ = Project.objects.get_or_create(
            client=client_user, title="Old project", description="Desc",
            budget_min=10, budget_max=20, duration_days=1
        )
        old_proposal, _ = Proposal.objects.get_or_create(
            project=old_project, freelancer=freelancer_user, bid_amount=15,
            estimated_days=1, cover_letter="test", status="accepted"
        )
        Contract.objects.get_or_create(
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
        print("====== HTTP STATUS ======", res.status_code)
        print("====== RESP DATA ======", res.data)
    except Exception:
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
