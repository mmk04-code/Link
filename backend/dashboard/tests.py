from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from projects.models import Project
from proposals.models import Proposal
from contracts.models import Contract
from reviews.models import Review
from proposals.models import FreelancerBehaviorReport
from dashboard.models import SupportTicket

User = get_user_model()

class DashboardAPITestCase(TestCase):
    def setUp(self):
        # Create test users
        self.client_user = User.objects.create_user(
            username='testclient',
            email='client@test.com',
            password='test123',
            role='CLIENT'
        )
        self.freelancer_user = User.objects.create_user(
            username='testfreelancer',
            email='freelancer@test.com',
            password='test123',
            role='FREELANCER'
        )
        self.admin_user = User.objects.create_superuser(
            username='admin',
            email='admin@test.com',
            password='admin123'
        )
        
        # Create test project
        self.project = Project.objects.create(
            client=self.client_user,
            title='Test Project',
            description='Test Description',
            budget_max='1000.00',
            budget_min='500.00',
            duration_days=30
        )
        
        # Create test proposal
        self.proposal = Proposal.objects.create(
            project=self.project,
            freelancer=self.freelancer_user,
            bid_amount='500.00',
            cover_letter='Test cover letter',
            estimated_days=7
        )
        
        # Create test contract
        self.contract = Contract.objects.create(
            proposal=self.proposal,
            client=self.client_user,
            freelancer=self.freelancer_user,
            title='Test Contract',
            description='Test Contract Description',
            budget='500.00',
            currency='USD',
            status='active'
        )

        self.review = Review.objects.create(
            contract=self.contract,
            reviewer=self.client_user,
            reviewee=self.freelancer_user,
            communication_rating=5,
            quality_rating=4,
            professionalism_rating=5,
            title='Great work',
            comment='Delivered on time and with quality.',
            is_public=True,
        )
        
        self.client = APIClient()
    
    def test_client_dashboard(self):
        self.client.force_authenticate(user=self.client_user)
        response = self.client.get('/api/dashboard/client/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('active_projects', response.data)
    
    def test_freelancer_dashboard(self):
        self.client.force_authenticate(user=self.freelancer_user)
        response = self.client.get('/api/dashboard/freelancer/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('applied_proposals', response.data)
    
    def test_admin_dashboard(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/dashboard/admin/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('users', response.data)

    def test_admin_proposals_list(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/admin/proposals/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('stats', response.data)
        self.assertIn('results', response.data)

    def test_admin_proposal_decision(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(
            f'/api/admin/proposals/{self.proposal.id}/decision/',
            {'decision': 'accepted'},
            format='json',
        )
        self.assertEqual(response.status_code, 200)
        self.proposal.refresh_from_db()
        self.assertEqual(self.proposal.status, 'accepted')

    def test_admin_users_list(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/admin/users/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('stats', response.data)
        self.assertIn('results', response.data)

    def test_admin_users_role_filter(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/admin/users/?role=client')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(all(item['role'] == 'CLIENT' for item in response.data.get('results', [])))

    def test_admin_users_search_filter(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/admin/users/?search=freelancer@test.com')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(any(item['email'] == 'freelancer@test.com' for item in response.data.get('results', [])))

    def test_admin_users_stats_endpoint(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/admin/users/stats/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('total', response.data)
        self.assertIn('clients', response.data)
        self.assertIn('freelancers', response.data)

    def test_admin_can_remove_client_user(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(
            f'/api/admin/users/{self.client_user.id}/action/',
            {'action': 'remove'},
            format='json',
        )
        self.assertEqual(response.status_code, 200)
        self.client_user.refresh_from_db()
        self.assertFalse(self.client_user.is_active)

    def test_admin_can_remove_freelancer_user(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(
            f'/api/admin/users/{self.freelancer_user.id}/action/',
            {'action': 'remove'},
            format='json',
        )
        self.assertEqual(response.status_code, 200)
        self.freelancer_user.refresh_from_db()
        self.assertFalse(self.freelancer_user.is_active)

    def test_admin_cannot_remove_admin_user(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(
            f'/api/admin/users/{self.admin_user.id}/action/',
            {'action': 'remove'},
            format='json',
        )
        self.assertEqual(response.status_code, 400)

    def test_admin_contracts_list(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/admin/contracts/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('stats', response.data)
        self.assertIn('results', response.data)

    def test_admin_reviews_list(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/admin/reviews/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('stats', response.data)
        self.assertIn('results', response.data)
    
    def test_unauthorized_access(self):
        response = self.client.get('/api/dashboard/client/')
        self.assertEqual(response.status_code, 401)

    def test_admin_can_list_freelancer_reports(self):
        FreelancerBehaviorReport.objects.create(
            reporter=self.client_user,
            reported_user=self.freelancer_user,
            proposal=self.proposal,
            reason='misbehavior',
            details='Rude communication',
            status='pending',
        )

        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/dashboard/admin/reports/?status=pending')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['reporter_name'], self.client_user.username)

    def test_reported_user_can_reply_support_ticket_and_share(self):
        ticket = SupportTicket.objects.create(
            reporter=self.client_user,
            reported_user=self.freelancer_user,
            target_role='FREELANCER',
            category='misbehavior',
            subject='Test complaint',
            description='Complaint details',
            status='under_review',
        )

        self.client.force_authenticate(user=self.freelancer_user)
        response = self.client.post(
            f'/api/dashboard/support/tickets/{ticket.id}/reply/',
            {
                'message': 'Sorry for the misunderstanding. I will improve.',
                'send_to_reporter': True,
            },
            format='json',
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['reply']['sender_name'], self.freelancer_user.username)
        self.assertTrue(response.data['reply']['visible_to_reporter'])

    def test_reported_user_can_reply_freelancer_report_and_share(self):
        report = FreelancerBehaviorReport.objects.create(
            reporter=self.client_user,
            reported_user=self.freelancer_user,
            proposal=self.proposal,
            reason='misbehavior',
            details='Aggressive language',
            status='pending',
        )

        self.client.force_authenticate(user=self.freelancer_user)
        response = self.client.post(
            f'/api/dashboard/reports/{report.id}/reply/',
            {
                'message': 'Sorry, I will communicate better.',
                'send_to_reporter': True,
            },
            format='json',
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['reply']['sender_name'], self.freelancer_user.username)
        self.assertTrue(response.data['reply']['visible_to_reporter'])
