# Generated migration to add date field to StaffAvailability

from django.db import migrations, models
import django.utils.timezone
from datetime import date


def migrate_year_month_day_to_date(apps, schema_editor):
    """Migrate year, month, day fields to date field"""
    StaffAvailability = apps.get_model('store', 'StaffAvailability')
    
    for availability in StaffAvailability.objects.all():
        if availability.year and availability.month:
            # If day is None, use day 1 (represents the month)
            day = availability.day if availability.day else 1
            try:
                availability.date = date(availability.year, availability.month, day)
                availability.save()
            except ValueError:
                # Skip invalid dates (e.g., Feb 30)
                continue


def reverse_migrate_date_to_year_month_day(apps, schema_editor):
    """Reverse migration: extract year, month, day from date"""
    StaffAvailability = apps.get_model('store', 'StaffAvailability')
    
    for availability in StaffAvailability.objects.all():
        if availability.date:
            availability.year = availability.date.year
            availability.month = availability.date.month
            availability.day = availability.date.day
            availability.save()


class Migration(migrations.Migration):

    dependencies = [
        ('store', '0008_alter_staffavailability_options_and_more'),
    ]

    operations = [
        # Add date field as nullable first
        migrations.AddField(
            model_name='staffavailability',
            name='date',
            field=models.DateField(null=True, blank=True, unique=False),
        ),
        # Migrate data from year/month/day to date
        migrations.RunPython(migrate_year_month_day_to_date, reverse_migrate_date_to_year_month_day),
        # Remove old fields
        migrations.RemoveField(
            model_name='staffavailability',
            name='year',
        ),
        migrations.RemoveField(
            model_name='staffavailability',
            name='month',
        ),
        migrations.RemoveField(
            model_name='staffavailability',
            name='day',
        ),
        # Make date field non-nullable and unique
        migrations.AlterField(
            model_name='staffavailability',
            name='date',
            field=models.DateField(unique=True),
        ),
        # Update ordering
        migrations.AlterModelOptions(
            name='staffavailability',
            options={'ordering': ['date'], 'verbose_name_plural': 'Staff Availabilities'},
        ),
    ]

