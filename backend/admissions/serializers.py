from rest_framework import serializers
from .models import AdmissionApplication


class AdmissionApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdmissionApplication
        fields = [
            'id', 'full_name', 'email', 'phone', 'gender', 'date_of_birth', 'address',
            'previous_school', 'result_slip', 'guardian_name', 'guardian_phone', 'applying_for', 'status', 'created_at'
        ]
        read_only_fields = ['created_at']

    def validate_status(self, value):
        # Public submissions may only enter the queue as pending. Authenticated
        # reviewers may change an existing application's status.
        if self.instance is None and value != 'pending':
            raise serializers.ValidationError('New applications must start as pending.')
        return value
