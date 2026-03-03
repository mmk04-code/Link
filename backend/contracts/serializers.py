from rest_framework import serializers
from .models import Contract

# Simple User serializer (define it here temporarily)
class SimpleUserSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    username = serializers.CharField()
    email = serializers.CharField()

class ContractSerializer(serializers.ModelSerializer):
    # Use simple serializers instead of importing
    client_details = SimpleUserSerializer(source='client', read_only=True)
    freelancer_details = SimpleUserSerializer(source='freelancer', read_only=True)
    can_activate = serializers.SerializerMethodField()

    class Meta:
        model = Contract
        fields = '__all__'
        read_only_fields = ['client', 'freelancer', 'created_at', 'updated_at']

    def get_can_activate(self, obj):
        return obj.can_be_activated()

class ContractCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contract
        fields = ['proposal', 'title', 'description', 'terms', 'budget', 
                 'currency', 'start_date', 'end_date']

    def create(self, validated_data):
        proposal = validated_data.get('proposal')
        
        if not proposal:
            raise serializers.ValidationError({"proposal": "Proposal does not exist"})
        
        try:
            validated_data['client'] = proposal.project.client
            validated_data['freelancer'] = proposal.freelancer
        except AttributeError as e:
            raise serializers.ValidationError({
                "error": f"Proposal object missing expected attributes: {str(e)}"
            })
            
        validated_data['status'] = 'draft'
        return super().create(validated_data)

class ContractStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Contract.STATUS_CHOICES)
    notes = serializers.CharField(required=False, allow_blank=True)

class ContractConfirmSerializer(serializers.Serializer):
    confirm = serializers.BooleanField()