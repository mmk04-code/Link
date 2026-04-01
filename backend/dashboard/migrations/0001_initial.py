from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='SupportTicket',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('target_role', models.CharField(choices=[('CLIENT', 'Client'), ('FREELANCER', 'Freelancer')], max_length=20)),
                ('category', models.CharField(choices=[('misbehavior', 'Misbehavior'), ('fake_company', 'Fake Company'), ('payment_issue', 'Payment Issue'), ('scam_risk', 'Scam Risk'), ('other', 'Other')], max_length=30)),
                ('subject', models.CharField(max_length=180)),
                ('description', models.TextField()),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('under_review', 'Under Review'), ('warning_issued', 'Warning Issued'), ('user_hidden', 'User Hidden'), ('resolved', 'Resolved'), ('dismissed', 'Dismissed')], default='pending', max_length=30)),
                ('admin_note', models.TextField(blank=True)),
                ('actioned_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('actioned_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='support_tickets_actioned', to=settings.AUTH_USER_MODEL)),
                ('reported_user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='support_tickets_reported_against', to=settings.AUTH_USER_MODEL)),
                ('reporter', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='support_tickets_created', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
