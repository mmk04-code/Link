from django.db import models
from django.conf import settings


class SupportTicket(models.Model):
	TARGET_ROLE_CHOICES = (
		('CLIENT', 'Client'),
		('FREELANCER', 'Freelancer'),
	)

	CATEGORY_CHOICES = (
		('misbehavior', 'Misbehavior'),
		('fake_company', 'Fake Company'),
		('payment_issue', 'Payment Issue'),
		('scam_risk', 'Scam Risk'),
		('other', 'Other'),
	)

	STATUS_CHOICES = (
		('pending', 'Pending'),
		('under_review', 'Under Review'),
		('warning_issued', 'Warning Issued'),
		('user_hidden', 'User Hidden'),
		('resolved', 'Resolved'),
		('dismissed', 'Dismissed'),
	)

	reporter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='support_tickets_created')
	reported_user = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		null=True,
		blank=True,
		on_delete=models.SET_NULL,
		related_name='support_tickets_reported_against',
	)
	target_role = models.CharField(max_length=20, choices=TARGET_ROLE_CHOICES)
	category = models.CharField(max_length=30, choices=CATEGORY_CHOICES)
	subject = models.CharField(max_length=180)
	description = models.TextField()
	status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='pending')
	admin_note = models.TextField(blank=True)
	actioned_by = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		null=True,
		blank=True,
		on_delete=models.SET_NULL,
		related_name='support_tickets_actioned',
	)
	actioned_at = models.DateTimeField(null=True, blank=True)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		ordering = ['-created_at']

	def __str__(self):
		return f"SupportTicket #{self.id} ({self.category})"


class SupportTicketMessage(models.Model):
	ticket = models.ForeignKey(SupportTicket, on_delete=models.CASCADE, related_name='messages')
	sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='support_messages_sent')
	message = models.TextField()
	visible_to_reporter = models.BooleanField(default=False)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ['created_at']

	def __str__(self):
		return f"SupportTicketMessage #{self.id} (ticket={self.ticket_id})"
