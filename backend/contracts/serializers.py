from rest_framework import serializers
from .models import Contract
from users.models import Profile

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
    client_profile_image = serializers.SerializerMethodField()
    freelancer_profile_image = serializers.SerializerMethodField()
    client_name = serializers.CharField(source='client.username', read_only=True)
    freelancer_name = serializers.CharField(source='freelancer.username', read_only=True)
    project_title = serializers.CharField(source='proposal.project.title', read_only=True)
    proposal_cover_letter = serializers.CharField(source='proposal.cover_letter', read_only=True)

    class Meta:
        model = Contract
        fields = '__all__'
        read_only_fields = ['client', 'freelancer', 'created_at', 'updated_at', 'proposal']

    def get_can_activate(self, obj):
        return obj.can_be_activated()

    def _build_profile_image_url(self, user):
        request = self.context.get('request')
        try:
            profile = Profile.objects.filter(user=user).first()
            if not profile:
                return ''
            if profile.profile_image:
                image_url = profile.profile_image.url
                return request.build_absolute_uri(image_url) if request else image_url
            return profile.profile_image_url or ''
        except Exception:
            return ''

    def get_client_profile_image(self, obj):
        return self._build_profile_image_url(obj.client)

    def get_freelancer_profile_image(self, obj):
        return self._build_profile_image_url(obj.freelancer)

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