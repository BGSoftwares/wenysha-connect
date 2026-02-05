from rest_framework import serializers
from .models import AdmissionApplication


class AdmissionApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdmissionApplication
        fields = [
            'id', 'full_name', 'email', 'phone', 'gender', 'date_of_birth', 'address',
            'previous_school', 'result_slip', 'guardian_name', 'guardian_phone', 'created_at'
        ]
        read_only_fields = ['created_at']
