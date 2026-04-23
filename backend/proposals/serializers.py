from rest_framework import serializers
from decimal import Decimal, InvalidOperation
from .models import Proposal

class ProposalSerializer(serializers.ModelSerializer):
    bid_amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    estimated_days = serializers.IntegerField(required=False)

    def validate(self, attrs):
        project = attrs.get('project')
        bid_amount = attrs.get('bid_amount')
        estimated_days = attrs.get('estimated_days')

        if project is None:
            raise serializers.ValidationError({'project': 'Project is required.'})

        bid_type = getattr(project, 'bid_type', 'flexible')
        deadline_type = getattr(project, 'deadline_type', 'flexible')

        try:
            budget_min = Decimal(str(project.budget_min))
            budget_max = Decimal(str(project.budget_max))
        except (InvalidOperation, TypeError):
            raise serializers.ValidationError({'bid_amount': 'Project budget is invalid.'})

        if bid_type == 'fixed':
            # Fixed projects always use the client-defined budget.
            attrs['bid_amount'] = budget_max
        else:
            if bid_amount is None:
                raise serializers.ValidationError({'bid_amount': 'Bid amount is required for flexible bid projects.'})

            try:
                bid_value = Decimal(str(bid_amount))
            except (InvalidOperation, TypeError):
                raise serializers.ValidationError({'bid_amount': 'Invalid bid amount.'})

            if bid_value <= 0:
                raise serializers.ValidationError({'bid_amount': 'Bid amount must be greater than zero.'})

            if bid_value < budget_min or bid_value > budget_max:
                raise serializers.ValidationError({
                    'bid_amount': f'Bid must be within the allowed project range ({budget_min} - {budget_max}).'
                })

            attrs['bid_amount'] = bid_value

        if deadline_type == 'fixed':
            project_duration = getattr(project, 'duration_days', None)
            if project_duration in (None, ''):
                raise serializers.ValidationError({'estimated_days': 'Project duration is missing for fixed deadline projects.'})
            attrs['estimated_days'] = int(project_duration)
        else:
            if estimated_days in (None, ''):
                raise serializers.ValidationError({'estimated_days': 'Estimated duration is required for flexible deadline projects.'})
            try:
                estimated_value = int(estimated_days)
            except (TypeError, ValueError):
                raise serializers.ValidationError({'estimated_days': 'Estimated duration must be a valid number of days.'})

            if estimated_value <= 0:
                raise serializers.ValidationError({'estimated_days': 'Estimated duration must be greater than zero.'})

            attrs['estimated_days'] = estimated_value

        return attrs

    class Meta:
        model = Proposal
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'freelancer', 'status']
