from django.contrib import admin
from .models import SupportTicket


@admin.register(SupportTicket)
class SupportTicketAdmin(admin.ModelAdmin):
	list_display = ('id', 'reporter', 'reported_user', 'target_role', 'category', 'status', 'created_at')
	list_filter = ('status', 'target_role', 'category')
	search_fields = ('reporter__username', 'reported_user__username', 'subject', 'description')

# Register your models here.
