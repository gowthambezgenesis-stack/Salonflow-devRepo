# Generated migration to add staff_assignment and fix BlockedSlot

from django.db import migrations, models
import django.utils.timezone
from datetime import datetime


def migrate_blockedslot_datetime_to_date_time(apps, schema_editor):
    """Migrate BlockedSlot from DateTimeField to separate date and time fields"""
    BlockedSlot = apps.get_model('store', 'BlockedSlot')
    
    for slot in BlockedSlot.objects.all():
        if slot.start_time:
            slot.date = slot.start_time.date()
            slot.start_time_time = slot.start_time.time()
            if slot.end_time:
                slot.end_time_time = slot.end_time.time()
            else:
                # Default to 30 minutes after start
                from datetime import timedelta
                end_dt = slot.start_time + timedelta(minutes=30)
                slot.end_time_time = end_dt.time()
            slot.save()


def reverse_migrate_blockedslot(apps, schema_editor):
    """Reverse migration: combine date and time back to DateTimeField"""
    BlockedSlot = apps.get_model('store', 'BlockedSlot')
    
    for slot in BlockedSlot.objects.all():
        if slot.date and slot.start_time_time:
            from datetime import datetime, time
            slot.start_time = datetime.combine(slot.date, slot.start_time_time)
            if slot.end_time_time:
                slot.end_time = datetime.combine(slot.date, slot.end_time_time)
            slot.save()


class Migration(migrations.Migration):

    dependencies = [
        ('store', '0009_add_date_to_staffavailability'),
    ]

    operations = [
        # First, add new fields to BlockedSlot
        migrations.AddField(
            model_name='blockedslot',
            name='date',
            field=models.DateField(null=True, blank=True),
        ),
        migrations.AddField(
            model_name='blockedslot',
            name='start_time_time',
            field=models.TimeField(null=True, blank=True),
        ),
        migrations.AddField(
            model_name='blockedslot',
            name='end_time_time',
            field=models.TimeField(null=True, blank=True),
        ),
        # Migrate data
        migrations.RunPython(migrate_blockedslot_datetime_to_date_time, reverse_migrate_blockedslot),
        # Remove old DateTimeField
        migrations.RemoveField(
            model_name='blockedslot',
            name='start_time',
        ),
        migrations.RemoveField(
            model_name='blockedslot',
            name='end_time',
        ),
        # Rename new fields to correct names
        migrations.RenameField(
            model_name='blockedslot',
            old_name='start_time_time',
            new_name='start_time',
        ),
        migrations.RenameField(
            model_name='blockedslot',
            old_name='end_time_time',
            new_name='end_time',
        ),
        # Make date field non-nullable
        migrations.AlterField(
            model_name='blockedslot',
            name='date',
            field=models.DateField(),
        ),
        migrations.AlterField(
            model_name='blockedslot',
            name='start_time',
            field=models.TimeField(),
        ),
        migrations.AlterField(
            model_name='blockedslot',
            name='end_time',
            field=models.TimeField(),
        ),
        # Add staff_assignment to Booking
        migrations.AddField(
            model_name='booking',
            name='staff_assignment',
            field=models.PositiveIntegerField(blank=True, help_text='Staff number assigned (1-based index)', null=True),
        ),
    ]

