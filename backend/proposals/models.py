from django.db import models
from users.models import User
from projects.models import Project

class Proposal(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('withdrawn', 'Withdrawn'),
    )

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='proposals')
    freelancer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='proposals', limit_choices_to={'role': 'FREELANCER'})
    cover_letter = models.TextField()
    bid_amount = models.DecimalField(max_digits=10, decimal_places=2)
    estimated_days = models.IntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('project', 'freelancer')

    def __str__(self):
        return f"{self.freelancer.username} - {self.project.title}"


class FreelancerBehaviorReport(models.Model):
    REASON_CHOICES = (
        ('misbehavior', 'Misbehavior'),
        ('fake_company', 'Fake Company'),
    )

    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('warning_issued', 'Warning Issued'),
        ('user_removed', 'User Removed'),
        ('dismissed', 'Dismissed'),
    )

    reporter = models.ForeignKey(User, on_delete=models.CASCADE, related_name='freelancer_reports_filed')
    reported_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='freelancer_reports_received')
    proposal = models.ForeignKey(Proposal, on_delete=models.CASCADE, related_name='behavior_reports')
    reason = models.CharField(max_length=30, choices=REASON_CHOICES)
    details = models.TextField(blank=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='pending')
    action_note = models.TextField(blank=True)
    actioned_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='freelancer_reports_actioned')
    actioned_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Report #{self.id} - {self.reported_user.username} ({self.reason})"


class FreelancerReportMessage(models.Model):
    report = models.ForeignKey(FreelancerBehaviorReport, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='freelancer_report_messages_sent')
    message = models.TextField()
    visible_to_reporter = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"FreelancerReportMessage #{self.id} (report={self.report_id})"
