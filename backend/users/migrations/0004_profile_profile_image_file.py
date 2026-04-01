from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0003_profile_company_and_social_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='profile',
            name='profile_image',
            field=models.FileField(blank=True, null=True, upload_to='profile_images/'),
        ),
    ]
