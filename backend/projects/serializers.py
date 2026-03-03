from rest_framework import serializers
from .models import Project

class ProjectSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.username', read_only=True)
    
    class Meta:
        model = Project
        fields = ['id', 'client', 'client_name', 'title', 'description', 
                 'skills_required', 'budget_min', 'budget_max', 
                 'duration_days', 'status', 'created_at', 'updated_at']
        read_only_fields = ['client', 'created_at', 'updated_at']
