from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('proposals', '0003_alter_proposal_unique_together'),
    ]

    operations = [
        migrations.CreateModel(
            name='FreelancerBehaviorReport',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('reason', models.CharField(choices=[('misbehavior', 'Misbehavior'), ('fake_company', 'Fake Company')], max_length=30)),
                ('details', models.TextField(blank=True)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('warning_issued', 'Warning Issued'), ('user_removed', 'User Removed'), ('dismissed', 'Dismissed')], default='pending', max_length=30)),
                ('action_note', models.TextField(blank=True)),
                ('actioned_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('actioned_by', models.ForeignKey(blank=True, null=True, on_delete=models.SET_NULL, related_name='freelancer_reports_actioned', to=settings.AUTH_USER_MODEL)),
                ('proposal', models.ForeignKey(on_delete=models.CASCADE, related_name='behavior_reports', to='proposals.proposal')),
                ('reported_user', models.ForeignKey(on_delete=models.CASCADE, related_name='freelancer_reports_received', to=settings.AUTH_USER_MODEL)),
                ('reporter', models.ForeignKey(on_delete=models.CASCADE, related_name='freelancer_reports_filed', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
