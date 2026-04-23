from rest_framework import serializers
from .models import Review
from contracts.models import Contract
from users.serializers import UserSerializer

class ReviewSerializer(serializers.ModelSerializer):
    reviewer_details = UserSerializer(source='reviewer', read_only=True)
    reviewee_details = UserSerializer(source='reviewee', read_only=True)

    class Meta:
        model = Review
        fields = '__all__'
        read_only_fields = ['reviewer', 'reviewee', 'overall_rating', 
                           'is_public', 'flagged', 'created_at', 'updated_at']

    def validate(self, data):
        contract = Contract.objects.get(id=data['contract'].id)
        if contract.status != 'completed':
            raise serializers.ValidationError("Reviews can only be submitted for completed contracts")
        user = self.context['request'].user
        if user not in [contract.client, contract.freelancer]:
            raise serializers.ValidationError("You are not part of this contract")
        data['reviewee'] = contract.freelancer if user == contract.client else contract.client
        return data