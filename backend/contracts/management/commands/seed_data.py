from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from contracts.models import Contract
from messaging.models import Message
from reviews.models import Review
from notifications.models import Notification
from proposals.models import Proposal
from datetime import date

User = get_user_model()


class Command(BaseCommand):
    help = "Seed milestone 3 data"

    def handle(self, *args, **kwargs):

        # ✅ Check admin exists
        admin = User.objects.filter(email="admin@gmail.com").first()

        if not admin:
            admin = User.objects.create_superuser(
                username="admin",
                email="admin@gmail.com",
                password="Admin@1234"
            )

        proposals = Proposal.objects.all()[:5]

        for p in proposals[:3]:
            contract = Contract.objects.create(
                proposal=p,
                client=p.project.client,
                freelancer=p.freelancer,
                status="active",
                start_date=date.today()
            )

            Message.objects.create(
                contract=contract,
                sender=contract.client,
                receiver=contract.freelancer,
                content="Project started!"
            )

        for p in proposals[3:5]:
            contract = Contract.objects.create(
                proposal=p,
                client=p.project.client,
                freelancer=p.freelancer,
                status="completed",
                start_date=date.today(),
                end_date=date.today()
            )

            Review.objects.create(
                contract=contract,
                reviewer=contract.client,
                reviewee=contract.freelancer,
                rating=5,
                comment="Excellent work!"
            )

            Notification.objects.create(
                user=contract.freelancer,
                contract=contract,
                type="contract_review"
            )

        self.stdout.write(self.style.SUCCESS("Seed data created"))