from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('contracts', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='contract',
            name='pending_action_by',
            field=models.CharField(choices=[('NONE', 'None'), ('CLIENT', 'Client'), ('FREELANCER', 'Freelancer')], default='NONE', max_length=20),
        ),
    ]
