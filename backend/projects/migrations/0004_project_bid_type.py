from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0003_project_deadline_and_max_proposals'),
    ]

    operations = [
        migrations.AddField(
            model_name='project',
            name='bid_type',
            field=models.CharField(
                choices=[('flexible', 'Flexible Range'), ('fixed', 'Fixed Amount')],
                default='flexible',
                max_length=20,
            ),
        ),
    ]
