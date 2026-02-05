from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Role, UserProfile, PendingApproval


class RoleSerializer(serializers.ModelSerializer):
    users_count = serializers.SerializerMethodField()

    class Meta:
        model = Role
        fields = ['id', 'name', 'description', 'permissions', 'users_count']

    def get_users_count(self, obj):
        return UserProfile.objects.filter(role=obj).count()


class UserProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    role_name = serializers.CharField(source='role.name', read_only=True)

    class Meta:
        model = UserProfile
        fields = ['id', 'user', 'email', 'role', 'role_name', 'full_name']


class PendingApprovalSerializer(serializers.ModelSerializer):
    class Meta:
        model = PendingApproval
        fields = [
            'id', 'full_name', 'email', 'role', 'status', 'requested_at', 'additional_info'
        ]
        read_only_fields = ['requested_at', 'status']


class SignUpSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)
    confirm_password = serializers.CharField(min_length=8, write_only=True)
    role = serializers.ChoiceField(choices=['student', 'parent', 'teacher', 'accounts'])
    additional_info = serializers.JSONField(required=False, default=dict)

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({'email': 'A user with this email already exists.'})
        if PendingApproval.objects.filter(email=data['email'], status='pending').exists():
            raise serializers.ValidationError({'email': 'A pending request with this email already exists.'})
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        password = validated_data.pop('password')
        from django.contrib.auth.hashers import make_password
        return PendingApproval.objects.create(
            password_hash=make_password(password),
            status='pending',
            **validated_data
        )


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class PendingApprovalActionSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['approve', 'reject'])
