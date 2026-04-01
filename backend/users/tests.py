from django.test import TestCase
from rest_framework.test import APIClient

from users.models import User


class RegisterReuseInactiveCredentialsTests(TestCase):
	def setUp(self):
		self.client = APIClient()

	def test_can_register_with_username_and_email_of_inactive_user(self):
		old_user = User.objects.create_user(
			username='freelancer1',
			email='freelancer@gmail.com',
			password='oldpass123',
			role='FREELANCER',
			is_active=False,
		)

		payload = {
			'username': 'freelancer1',
			'email': 'freelancer@gmail.com',
			'password': 'newpass123',
			'role': 'FREELANCER',
		}
		response = self.client.post('/api/users/register/', payload, format='json')

		self.assertEqual(response.status_code, 201)

		old_user.refresh_from_db()
		self.assertNotEqual(old_user.username, 'freelancer1')
		self.assertNotEqual(old_user.email, 'freelancer@gmail.com')

		new_user = User.objects.get(email='freelancer@gmail.com')
		self.assertEqual(new_user.username, 'freelancer1')
		self.assertTrue(new_user.is_active)

	def test_active_username_still_rejected(self):
		User.objects.create_user(
			username='taken_user',
			email='taken@example.com',
			password='pass123',
			role='CLIENT',
			is_active=True,
		)

		payload = {
			'username': 'taken_user',
			'email': 'new@example.com',
			'password': 'newpass123',
			'role': 'FREELANCER',
		}
		response = self.client.post('/api/users/register/', payload, format='json')

		self.assertEqual(response.status_code, 400)
		self.assertIn('username', response.data)
