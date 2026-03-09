from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from projects.models import Project
from proposals.models import Proposal
from contracts.models import Contract
from reviews.models import Review

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
    
    def test_unauthorized_access(self):
        response = self.client.get('/api/dashboard/client/')
        self.assertEqual(response.status_code, 401)
