from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0002_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='project',
            name='deadline_type',
            field=models.CharField(choices=[('flexible', 'Flexible'), ('fixed', 'Fixed')], default='flexible', max_length=20),
        ),
        migrations.AddField(
            model_name='project',
            name='max_proposals',
            field=models.PositiveIntegerField(default=50),
        ),
        migrations.AddField(
            model_name='project',
            name='submission_deadline',
            field=models.DateField(blank=True, null=True),
        ),
    ]
