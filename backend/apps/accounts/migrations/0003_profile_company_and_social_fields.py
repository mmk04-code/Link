from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_user_is_verified_alter_user_role'),
    ]

    operations = [
        migrations.AddField(
            model_name='profile',
            name='company_description',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='profile',
            name='company_logo_url',
            field=models.URLField(blank=True),
        ),
        migrations.AddField(
            model_name='profile',
            name='company_name',
            field=models.CharField(blank=True, max_length=200),
        ),
        migrations.AddField(
            model_name='profile',
            name='company_social_links',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='profile',
            name='company_website',
            field=models.URLField(blank=True),
        ),
        migrations.AddField(
            model_name='profile',
            name='github_url',
            field=models.URLField(blank=True),
        ),
        migrations.AddField(
            model_name='profile',
            name='linkedin_url',
            field=models.URLField(blank=True),
        ),
        migrations.AddField(
            model_name='profile',
            name='profile_image_url',
            field=models.URLField(blank=True),
        ),
    ]
