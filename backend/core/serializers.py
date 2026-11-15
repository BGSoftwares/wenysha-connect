import re

from rest_framework import serializers
import logging

from django.contrib.auth.models import User
from django.contrib.auth.validators import UnicodeUsernameValidator
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from .models import Role, UserProfile, PendingApproval
from .roles import normalize_role_name
from school.models import SchoolClass

logger = logging.getLogger('ablegod.accounts')


class TeacherAccountAllocationInputSerializer(serializers.Serializer):
    subject = serializers.IntegerField(min_value=1)
    school_class = serializers.IntegerField(min_value=1)


class RoleSerializer(serializers.ModelSerializer):
    users_count = serializers.SerializerMethodField()

    class Meta:
        model = Role
        fields = ['id', 'name', 'description', 'permissions', 'users_count']

    def get_users_count(self, obj):
        return UserProfile.objects.filter(role=obj).count()

    def validate_name(self, value):
        value = value.strip()
        existing = Role.objects.filter(name__iexact=value)
        if self.instance:
            existing = existing.exclude(pk=self.instance.pk)
        if existing.exists():
            raise serializers.ValidationError('A role with this name already exists.')
        return value


class UserProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    role_name = serializers.CharField(source='role.name', read_only=True)

    class Meta:
        model = UserProfile
        fields = ['id', 'user', 'email', 'role', 'role_name', 'full_name', 'preferences']


class AdminAccountSerializer(serializers.ModelSerializer):
    username = serializers.CharField(required=False, allow_blank=True, max_length=150)
    email = serializers.EmailField(required=False, allow_blank=True)
    first_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    last_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    full_name = serializers.CharField(max_length=255, required=False, allow_blank=True, write_only=True)
    role = serializers.PrimaryKeyRelatedField(queryset=Role.objects.all(), required=False, allow_null=True, write_only=True)
    role_name = serializers.SerializerMethodField()
    password = serializers.CharField(write_only=True, min_length=8, required=False, allow_blank=True)
    phone = serializers.CharField(write_only=True, required=False, allow_blank=True, max_length=32)
    department = serializers.CharField(write_only=True, required=False, allow_blank=True, max_length=128)
    access_level = serializers.CharField(write_only=True, required=False, allow_blank=True, max_length=64)
    stream = serializers.CharField(write_only=True, required=False, allow_blank=True, max_length=64)
    student_class = serializers.PrimaryKeyRelatedField(
        queryset=SchoolClass.objects.all(),
        write_only=True, required=False, allow_null=True,
    )
    student_id = serializers.CharField(write_only=True, required=False, allow_blank=True, max_length=32)
    teaching_allocations = TeacherAccountAllocationInputSerializer(many=True, required=False, write_only=True)
    allocations = serializers.SerializerMethodField()
    student_class_name = serializers.SerializerMethodField()
    guardian_name = serializers.CharField(write_only=True, required=False, allow_blank=True, max_length=255)
    guardian_relationship = serializers.CharField(write_only=True, required=False, allow_blank=True, max_length=64)
    guardian_phone = serializers.CharField(write_only=True, required=False, allow_blank=True, max_length=32)
    guardian_email = serializers.EmailField(write_only=True, required=False, allow_blank=True)
    guardian_address = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name', 'email', 'is_active', 'is_staff', 'date_joined', 'last_login',
            'full_name', 'role', 'role_name', 'phone', 'department', 'access_level', 'stream',
            'student_class', 'student_class_name', 'student_id', 'teaching_allocations', 'allocations',
            'guardian_name', 'guardian_relationship', 'guardian_phone', 'guardian_email', 'guardian_address', 'password',
        ]
        read_only_fields = ['date_joined', 'last_login', 'is_staff', 'role_name', 'allocations', 'student_class_name']

    def get_allocations(self, obj):
        from school.models import Teacher
        teacher = Teacher.objects.filter(user=obj).first()
        if not teacher:
            return []
        return list(teacher.allocations.select_related('subject', 'school_class').order_by('subject__name', 'school_class__name').values(
            'subject_id', 'subject__name', 'school_class_id', 'school_class__name'
        ))

    def get_student_class_name(self, obj):
        from school.models import Student
        student = Student.objects.select_related('school_class').filter(user=obj).first()
        return student.school_class.name if student else ''

    def get_role_name(self, obj):
        try:
            return obj.profile.role.name if obj.profile.role else ''
        except UserProfile.DoesNotExist:
            return ''

    @staticmethod
    def _profile_preferences(obj):
        try:
            return dict(obj.profile.preferences or {})
        except UserProfile.DoesNotExist:
            return {}

    def to_representation(self, instance):
        data = super().to_representation(instance)
        try:
            profile = instance.profile
            data['full_name'] = profile.full_name or instance.get_full_name()
            data['role'] = profile.role_id
        except UserProfile.DoesNotExist:
            data['full_name'] = instance.get_full_name()
            data['role'] = None
        preferences = self._profile_preferences(instance)
        from school.models import Student, Teacher
        teacher = Teacher.objects.filter(user=instance).first()
        student = Student.objects.select_related('school_class').filter(user=instance).first()
        data['department'] = (teacher.department if teacher and teacher.department else preferences.get('department', ''))
        data['phone'] = (teacher.phone if teacher and teacher.phone else preferences.get('phone', ''))
        data['access_level'] = preferences.get('access_level', '')
        data['stream'] = preferences.get('student_stream', '')
        data['student_id'] = student.student_id if student else ''
        data['student_class'] = student.school_class_id if student else None
        data['student_class_name'] = student.school_class.name if student else ''
        data['allocations'] = self.get_allocations(instance)
        from parents.models import Parent
        parent = Parent.objects.filter(user=instance).first()
        data['phone'] = (teacher.phone if teacher and teacher.phone else parent.phone if parent and parent.phone else data['phone'])
        data['role_change_allowed'] = not (
            Student.objects.filter(user=instance).exists()
            or Teacher.objects.filter(user=instance).exists()
            or Parent.objects.filter(user=instance).exists()
        )
        return data

    def validate_email(self, value):
        value = value.strip().casefold()
        if not value:
            return value
        existing = User.objects.filter(email__iexact=value)
        if self.instance:
            existing = existing.exclude(pk=self.instance.pk)
        if existing.exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value

    def validate_phone(self, value):
        value = value.strip()
        if value and not re.fullmatch(r'\+?[0-9\s().-]+', value):
            raise serializers.ValidationError('Enter a valid phone number.')
        digits = ''.join(character for character in value if character.isdigit())
        if value and len(digits) < 7:
            raise serializers.ValidationError('Enter a valid phone number with at least 7 digits.')
        return value

    def validate_guardian_phone(self, value):
        return self.validate_phone(value)

    def validate_username(self, value):
        value = value.strip()
        if not value:
            return value
        try:
            UnicodeUsernameValidator()(value)
        except DjangoValidationError as error:
            raise serializers.ValidationError(list(error.messages)) from error
        existing = User.objects.filter(username__iexact=value)
        if self.instance:
            existing = existing.exclude(pk=self.instance.pk)
        if existing.exists():
            raise serializers.ValidationError('A user with this username already exists.')
        return value

    def validate(self, attrs):
        creating = self.instance is None
        role = attrs.get('role', None)
        email = attrs.get('email', self.instance.email if self.instance else '')
        first_name = attrs.get('first_name', self.instance.first_name if self.instance else '').strip()
        last_name = attrs.get('last_name', self.instance.last_name if self.instance else '').strip()
        full_name = attrs.get('full_name')
        if full_name is not None:
            full_name = full_name.strip()
        elif creating or 'first_name' in attrs or 'last_name' in attrs:
            full_name = ' '.join(part for part in (first_name, last_name) if part)
            attrs['full_name'] = full_name
        if 'first_name' in attrs:
            attrs['first_name'] = first_name
        if 'last_name' in attrs:
            attrs['last_name'] = last_name
        effective_role = role
        if effective_role is None and self.instance:
            try:
                effective_role = self.instance.profile.role
            except UserProfile.DoesNotExist:
                effective_role = None
        role_name = normalize_role_name(effective_role.name) if effective_role else ''

        if creating and (not first_name or not last_name or not full_name):
            raise serializers.ValidationError({'first_name': 'Enter both first name and surname.'})
        if creating and role is None:
            raise serializers.ValidationError({'role': 'Select a role when creating an account.'})
        if creating and role_name != 'student' and not attrs.get('password'):
            raise serializers.ValidationError({'password': 'A password is required when creating this account.'})
        if creating and role_name != 'student' and not attrs.get('username', '').strip():
            raise serializers.ValidationError({'username': 'Enter a username.'})
        password = attrs.get('password')
        if password:
            try:
                validate_password(password, user=self.instance)
            except DjangoValidationError as error:
                raise serializers.ValidationError({'password': list(error.messages)}) from error
        if creating and role_name == 'student' and password:
            raise serializers.ValidationError({'password': 'Student passwords are generated automatically.'})
        if not creating and 'role' in attrs and role is None:
            raise serializers.ValidationError({'role': 'An account must have an assigned role.'})

        if effective_role and normalize_role_name(effective_role.name) != 'student' and not email:
            raise serializers.ValidationError({'email': 'Email is required for non-student accounts.'})

        current_role_name = ''
        if self.instance:
            try:
                current_role = self.instance.profile.role
                current_role_name = normalize_role_name(current_role.name) if current_role else ''
            except (AttributeError, UserProfile.DoesNotExist):
                pass
        role_changed = not creating and role is not None and role_name != current_role_name
        if role_changed:
            if role_name == 'student':
                raise serializers.ValidationError({'role': 'Use student enrollment to create or link a student record.'})
            from parents.models import Parent
            from school.models import Student, Teacher
            if (
                Student.objects.filter(user=self.instance).exists()
                or Teacher.objects.filter(user=self.instance).exists()
                or Parent.objects.filter(user=self.instance).exists()
            ):
                raise serializers.ValidationError({
                    'role': 'This account is linked to a student, teacher, or parent record. Keep its role to preserve linked school data.'
                })
        teacher_setup_required = role_name == 'teacher' and (
            creating or current_role_name != 'teacher' or 'teaching_allocations' in attrs
        )
        if teacher_setup_required:
            allocations = attrs.get('teaching_allocations')
            if (creating or current_role_name != 'teacher') and not attrs.get('department', '').strip():
                raise serializers.ValidationError({'department': 'Choose the teacher’s department.'})
            if allocations is None:
                raise serializers.ValidationError({'teaching_allocations': 'Add at least one subject-to-class allocation.'})
            if not allocations:
                raise serializers.ValidationError({'teaching_allocations': 'A teacher must have at least one subject-to-class allocation.'})
            from school.models import SchoolClass, Subject
            pairs = set()
            for allocation in allocations:
                pair = (allocation['subject'], allocation['school_class'])
                if pair in pairs:
                    raise serializers.ValidationError({'teaching_allocations': 'Remove duplicate subject and class pairs.'})
                pairs.add(pair)
                if not Subject.objects.filter(pk=pair[0]).exists() or not SchoolClass.objects.filter(pk=pair[1]).exists():
                    raise serializers.ValidationError({'teaching_allocations': 'Choose a valid subject and class for every assignment.'})

        if creating and role_name == 'student':
            if not attrs.get('student_class'):
                raise serializers.ValidationError({'student_class': 'Select the student’s class or form.'})
            if not attrs.get('guardian_name', '').strip() or not attrs.get('guardian_phone', '').strip():
                raise serializers.ValidationError({'guardian_phone': 'Enter the guardian’s name and phone number.'})
            student_id = attrs.get('student_id', '').strip()
            if student_id:
                from school.models import Student
                if Student.objects.filter(student_id__iexact=student_id).exists():
                    raise serializers.ValidationError({'student_id': 'This student number is already in use.'})

        if role_name == 'admin' and creating and not attrs.get('access_level', '').strip():
            attrs['access_level'] = 'Full access'

        if role_name != 'admin' and attrs.get('access_level'):
            raise serializers.ValidationError({'access_level': 'Access level can only be set for administrators.'})

        request = self.context.get('request')
        if (
            not creating
            and request
            and request.user.pk == self.instance.pk
            and not (self.instance.is_staff or self.instance.is_superuser)
        ):
            if attrs.get('is_active', self.instance.is_active) is False:
                raise serializers.ValidationError({'is_active': 'You cannot deactivate the administrator account you are using.'})
            if role is not None and normalize_role_name(role.name) != 'admin':
                raise serializers.ValidationError({'role': 'You cannot remove administrator access from the account you are using.'})
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        full_name = validated_data.pop('full_name', '').strip()
        role = validated_data.pop('role')
        role_name = normalize_role_name(role.name)
        teaching_allocations = validated_data.pop('teaching_allocations', [])
        student_class = validated_data.pop('student_class', None)
        stream = validated_data.pop('stream', '').strip()
        student_id = validated_data.pop('student_id', '').strip()
        guardian = {
            'name': validated_data.pop('guardian_name', '').strip(),
            'relationship': validated_data.pop('guardian_relationship', '').strip(),
            'phone': validated_data.pop('guardian_phone', '').strip(),
            'email': validated_data.pop('guardian_email', '').strip(),
            'address': validated_data.pop('guardian_address', '').strip(),
        }
        phone = validated_data.pop('phone', '').strip()
        department = validated_data.pop('department', '').strip()
        access_level = validated_data.pop('access_level', '').strip()
        password = validated_data.pop('password', '')
        first_name = validated_data.get('first_name', '').strip()
        last_name = validated_data.get('last_name', '').strip()
        initial_preferences = {}
        if department:
            initial_preferences['department'] = department
        if phone:
            initial_preferences['phone'] = phone
        if access_level:
            initial_preferences['access_level'] = access_level

        temporary_password = None
        active = validated_data.pop('is_active', True)
        if role_name == 'student':
            from school.student_accounts import create_student_portal_user
            if stream:
                initial_preferences['student_stream'] = stream
            user, temporary_password = create_student_portal_user(
                first_name, last_name, full_name, initial_preferences,
            )
            user.email = validated_data.pop('email', '')
            user.is_active = active
            user.save(update_fields=['email', 'is_active'])
        else:
            username = validated_data.pop('username', '').strip()
            email = validated_data.pop('email', '').strip()
            validated_data.pop('first_name', None)
            validated_data.pop('last_name', None)
            user = User.objects.create_user(
                username=username, email=email, first_name=first_name, last_name=last_name,
                password=password, is_active=active,
            )
            UserProfile.objects.create(
                user=user, role=role, full_name=full_name, preferences=initial_preferences,
            )

        if role_name == 'teacher':
            from school.models import Teacher, TeacherSubjectClass
            teacher = Teacher.objects.filter(user__isnull=True, name__iexact=full_name).order_by('id').first()
            if teacher:
                teacher.user = user
                teacher.department = department
                teacher.phone = phone
                teacher.save(update_fields=['user', 'department', 'phone'])
            else:
                teacher = Teacher.objects.create(
                    user=user, name=full_name, department=department, phone=phone,
                )
            existing_pairs = set(teacher.allocations.values_list('subject_id', 'school_class_id'))
            TeacherSubjectClass.objects.bulk_create([
                TeacherSubjectClass(teacher=teacher, subject_id=item['subject'], school_class_id=item['school_class'])
                for item in teaching_allocations
                if (item['subject'], item['school_class']) not in existing_pairs
            ])
        elif role_name == 'student':
            from school.models import Student
            from school.serializers import StudentSerializer
            student = Student.objects.create(
                user=user, name=full_name, school_class=student_class,
                **({'student_id': student_id} if student_id else {}),
            )
            StudentSerializer._link_next_of_kin(student, guardian)
            student._portal_temporary_password = temporary_password
            user._portal_temporary_password = temporary_password

        from .sync import sync_linked_portal_records
        sync_linked_portal_records(user, full_name, user.email)
        if role_name == 'parent' and phone:
            from parents.models import Parent
            Parent.objects.filter(user=user).update(phone=phone)
        request = self.context.get('request')
        logger.info('Account created actor=%s target=%s role=%s', getattr(getattr(request, 'user', None), 'pk', None), user.pk, role_name)
        return user

    @transaction.atomic
    def update(self, instance, validated_data):
        full_name = validated_data.pop('full_name', serializers.empty)
        department = validated_data.pop('department', serializers.empty)
        phone = validated_data.pop('phone', serializers.empty)
        access_level = validated_data.pop('access_level', serializers.empty)
        stream = validated_data.pop('stream', serializers.empty)
        student_class = validated_data.pop('student_class', serializers.empty)
        teaching_allocations = validated_data.pop('teaching_allocations', serializers.empty)
        for guardian_field in ('guardian_name', 'guardian_relationship', 'guardian_phone', 'guardian_email', 'guardian_address', 'student_id'):
            validated_data.pop(guardian_field, None)
        role = validated_data.pop('role', serializers.empty)
        password = validated_data.pop('password', None)
        for key, value in validated_data.items():
            setattr(instance, key, value)
        if password:
            instance.set_password(password)
        instance.save()
        if password:
            from .tokens import revoke_user_tokens
            revoke_user_tokens(instance)  # a reset must sign the person out everywhere
        if full_name is not serializers.empty or role is not serializers.empty:
            profile, _ = UserProfile.objects.get_or_create(user=instance)
            update_fields = []
            if full_name is not serializers.empty:
                profile.full_name = full_name
                update_fields.append('full_name')
            if role is not serializers.empty:
                profile.role = role
                update_fields.append('role')
            profile.save(update_fields=update_fields)
        profile, _ = UserProfile.objects.get_or_create(user=instance)
        preferences = dict(profile.preferences or {})
        preference_updates = []
        if department is not serializers.empty:
            preferences['department'] = department.strip()
            preference_updates.append('preferences')
        if phone is not serializers.empty:
            preferences['phone'] = phone.strip()
            preference_updates.append('preferences')
        if access_level is not serializers.empty:
            preferences['access_level'] = access_level.strip()
            preference_updates.append('preferences')
        if stream is not serializers.empty:
            if stream.strip():
                preferences['student_stream'] = stream.strip()
            else:
                preferences.pop('student_stream', None)
            preference_updates.append('preferences')
        if password:
            preferences['must_change_password'] = True
            preference_updates.append('preferences')
        if preference_updates:
            profile.preferences = preferences
            profile.save(update_fields=['preferences'])

        from school.models import Student, Teacher, TeacherSubjectClass
        from core.roles import normalize_role_name as normalize_existing_role
        current_role = instance.profile.role if hasattr(instance, 'profile') else None
        normalized = normalize_existing_role(current_role.name) if current_role else ''
        if normalized == 'teacher':
            teacher, _ = Teacher.objects.get_or_create(user=instance, defaults={'name': instance.get_full_name()})
            if full_name is not serializers.empty:
                teacher.name = full_name.strip()
            if department is not serializers.empty:
                teacher.department = department.strip()
            if phone is not serializers.empty:
                teacher.phone = phone.strip()
            teacher.save()
            if teaching_allocations is not serializers.empty:
                desired_pairs = {
                    (item['subject'], item['school_class']) for item in teaching_allocations
                }
                current = list(TeacherSubjectClass.objects.filter(teacher=teacher))
                removed = [
                    allocation for allocation in current
                    if (allocation.subject_id, allocation.school_class_id) not in desired_pairs
                ]
                if any(allocation.scheduled_periods.exists() for allocation in removed):
                    raise serializers.ValidationError({
                        'teaching_allocations': 'Remove or reassign timetable periods before removing this teaching allocation.'
                    })
                for allocation in removed:
                    allocation.delete()
                current_pairs = {(item.subject_id, item.school_class_id) for item in current}
                TeacherSubjectClass.objects.bulk_create([
                    TeacherSubjectClass(teacher=teacher, subject_id=subject_id, school_class_id=class_id)
                    for subject_id, class_id in desired_pairs - current_pairs
                ])
        if normalized == 'student':
            student = Student.objects.filter(user=instance).first()
            if student and student_class is not serializers.empty and student_class:
                student.school_class = student_class
                student.save(update_fields=['school_class'])
        from .sync import sync_linked_portal_records
        try:
            current_profile = instance.profile
        except UserProfile.DoesNotExist:
            current_profile = None
        sync_linked_portal_records(
            instance,
            current_profile.full_name if current_profile else None,
            instance.email,
        )
        if normalized == 'parent' and phone is not serializers.empty:
            from parents.models import Parent
            Parent.objects.filter(user=instance).update(phone=phone.strip())
        request = self.context.get('request')
        logger.info('Account updated actor=%s target=%s role=%s password_reset=%s', getattr(getattr(request, 'user', None), 'pk', None), instance.pk, normalize_role_name(current_profile.role.name) if current_profile and current_profile.role else '', bool(password))
        return instance


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
        data['email'] = data['email'].strip().casefold()
        if User.objects.filter(email__iexact=data['email']).exists():
            raise serializers.ValidationError({'email': 'A user with this email already exists.'})
        if PendingApproval.objects.filter(email__iexact=data['email'], status='pending').exists():
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
    email = serializers.CharField()
    password = serializers.CharField(write_only=True)


class PendingApprovalActionSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['approve', 'reject'])
