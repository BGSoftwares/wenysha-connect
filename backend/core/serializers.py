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
    role_normalized = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = ['id', 'user', 'email', 'role', 'role_name', 'role_normalized', 'full_name']

    def get_role_normalized(self, obj):
        name = getattr(obj.role, 'name', '') if obj.role else ''
        if not name:
            return ''
        n = name.lower()
        if 'student' in n:
            return 'student'
        if 'admin' in n:
            return 'admin'
        if 'teacher' in n:
            return 'teacher'
        if 'parent' in n:
            return 'parent'
        if 'account' in n or 'accounts' in n:
            return 'accounts'
        return n


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
        pa = PendingApproval.objects.create(
            password_hash=make_password(password),
            status='pending',
            **validated_data
        )
        # Notify admins about new pending approval (development: console backend)
        try:
            from django.core.mail import send_mail
            from django.conf import settings
            # Prefer configured ADMINS emails, fallback to staff users' emails
            recipients = []
            if getattr(settings, 'ADMINS', None):
                recipients = [email for name, email in settings.ADMINS if email]
            if not recipients:
                from django.contrib.auth.models import User as _User
                recipients = list(_User.objects.filter(is_staff=True, email__isnull=False).values_list('email', flat=True))
            if recipients:
                subj = f"New account approval request: {pa.full_name}"
                body = f"A new account has requested access and requires approval.\n\nName: {pa.full_name}\nEmail: {pa.email}\nRole: {pa.role}\nRequested at: {pa.requested_at}\n\nApprove at the admin panel or via API."
                send_mail(subj, body, settings.DEFAULT_FROM_EMAIL, recipients, fail_silently=True)
        except Exception:
            pass
        return pa


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class PendingApprovalActionSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['approve', 'reject'])
