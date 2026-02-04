#!/usr/bin/env bash
# apply_backend_patch.sh
# Usage:
#   ./apply_backend_patch.sh
# This script writes the backend files into the repo and commits them to
# the existing branch add/django-backend-setup, then pushes the branch.
# Run this from the root of your local git clone.

set -euo pipefail

BRANCH="add/django-backend-setup"
COMMIT_MESSAGE="feat(back): add Django + MySQL backend, DRF, seed & setup scripts"

# Ensure we are in a git repo
if [ ! -d ".git" ]; then
  echo "ERROR: This script must be run from the root of your git repository (missing .git)"
  exit 1
fi

echo "Fetching from origin..."
git fetch origin

# Checkout or create branch
if git show-ref --verify --quiet "refs/heads/${BRANCH}"; then
  git checkout "${BRANCH}"
  git pull --ff-only origin "${BRANCH}" || true
else
  # Try to create branch tracking origin if it exists upstream
  if git ls-remote --exit-code --heads origin "${BRANCH}" >/dev/null 2>&1; then
    git checkout -b "${BRANCH}" "origin/${BRANCH}"
  else
    git checkout -b "${BRANCH}"
  fi
fi

# Create directories
mkdir -p backend core backend/wenysha_backend backend/core/management/commands backend/core/migrations sql

# Now create each file. Use heredocs to avoid editing by hand.

cat > backend/requirements.txt <<'EOF'
Django>=4.2,<5
djangorestframework>=3.14
mysqlclient>=2.1
djangorestframework-simplejwt>=5.2.2
django-cors-headers>=4.0
python-dotenv>=1.0
django-filter>=23.1
EOF

cat > backend/.env.example <<'EOF'
# Django / MySQL / JWT / CORS config example
DJANGO_SECRET_KEY=replace-this-in-prod
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost

# MySQL connection used by Django
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_DATABASE=wenysha_connect
MYSQL_USER=wenysha_user
MYSQL_PASSWORD=secretpassword

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173

# JWT lifetimes
JWT_ACCESS_MINUTES=60
JWT_REFRESH_DAYS=7

# Admin user to create by seed script (optional) — values provided
SEED_ADMIN_USERNAME=admin
SEED_ADMIN_EMAIL=bgurumanischoolstuff@gmail.com
SEED_ADMIN_PASSWORD=M226213@b1851887
EOF

cat > backend/setup_and_seed.sh <<'EOF'
#!/usr/bin/env bash
# setup_and_seed.sh
# Usage:
#   ./setup_and_seed.sh <mysql_root_user> <mysql_root_password> [db_name] [db_user] [db_password] [mysql_host] [mysql_port]
#
set -euo pipefail

MYSQL_ROOT_USER="${1:-root}"
MYSQL_ROOT_PASSWORD="${2:-}"
DB_NAME="${3:-wenysha_connect}"
DB_USER="${4:-wenysha_user}"
DB_PASSWORD="${5:-secretpassword}"
MYSQL_HOST="${6:-127.0.0.1}"
MYSQL_PORT="${7:-3306}"

BACKEND_DIR="$(cd "$(dirname "$0")" && pwd)"
VENV_DIR="$BACKEND_DIR/.venv"

echo "==> Creating MySQL database and user"
mysql -u"${MYSQL_ROOT_USER}" -p"${MYSQL_ROOT_PASSWORD}" -h"${MYSQL_HOST}" -P"${MYSQL_PORT}" <<MYSQL_CMDS
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'%' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'%';
FLUSH PRIVILEGES;
MYSQL_CMDS

echo "==> DB and user ensured: ${DB_NAME} @ ${MYSQL_HOST}:${MYSQL_PORT}"

if [ ! -d "$VENV_DIR" ]; then
  echo "==> Creating virtualenv in $VENV_DIR"
  python3 -m venv "$VENV_DIR"
fi

echo "==> Activating virtualenv"
# shellcheck disable=SC1090
source "$VENV_DIR/bin/activate"

echo "==> Installing Python dependencies"
pip install --upgrade pip
pip install -r "$BACKEND_DIR/requirements.txt"

if [ ! -f "$BACKEND_DIR/.env" ]; then
  echo "==> Copying .env.example to .env (edit .env if necessary)"
  cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
  sed -i "s/^MYSQL_DATABASE=.*/MYSQL_DATABASE=${DB_NAME}/" "$BACKEND_DIR/.env"
  sed -i "s/^MYSQL_USER=.*/MYSQL_USER=${DB_USER}/" "$BACKEND_DIR/.env"
  sed -i "s/^MYSQL_PASSWORD=.*/MYSQL_PASSWORD=${DB_PASSWORD}/" "$BACKEND_DIR/.env"
  sed -i "s/^MYSQL_HOST=.*/MYSQL_HOST=${MYSQL_HOST}/" "$BACKEND_DIR/.env"
  sed -i "s/^MYSQL_PORT=.*/MYSQL_PORT=${MYSQL_PORT}/" "$BACKEND_DIR/.env"
  echo "Edited backend/.env with DB credentials"
else
  echo "==> backend/.env already exists, not overwriting"
fi

echo "==> Running Django migrations"
cd "$BACKEND_DIR"
python manage.py makemigrations --noinput || true
python manage.py migrate --noinput

echo "==> Seeding initial data via management command"
python manage.py seed_initial_data

echo "==> Done. The backend should be migrated and seeded."

echo
echo "Verification commands:"
echo "  - API root: curl http://127.0.0.1:8000/api/"
echo "  - Obtain JWT token: curl -X POST http://127.0.0.1:8000/api/auth/token/ -d 'username=admin&password=M226213@b1851887'"
echo
EOF

chmod +x backend/setup_and_seed.sh

cat > sql/db_create_and_user.sql <<'EOF'
-- Replace placeholders: <DB>, <DB_USER>, <DB_PASSWORD>
CREATE DATABASE IF NOT EXISTS `wenysha_connect` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'wenysha_user'@'%' IDENTIFIED BY 'secretpassword';
GRANT ALL PRIVILEGES ON `wenysha_connect`.* TO 'wenysha_user'@'%';
FLUSH PRIVILEGES;
EOF

cat > backend/manage.py <<'EOF'
#!/usr/bin/env python
import os
import sys

def main():
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "wenysha_backend.settings")
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise
    execute_from_command_line(sys.argv)

if __name__ == "__main__":
    main()
EOF

cat > backend/wenysha_backend/__init__.py <<'EOF'
# package initializer for wenysha_backend
EOF

cat > backend/wenysha_backend/asgi.py <<'EOF'
import os
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "wenysha_backend.settings")
application = get_asgi_application()
EOF

cat > backend/wenysha_backend/wsgi.py <<'EOF'
import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "wenysha_backend.settings")
application = get_wsgi_application()
EOF

cat > backend/wenysha_backend/settings.py <<'EOF'
import os
from pathlib import Path
from dotenv import load_dotenv
from datetime import timedelta

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "replace-this-in-prod")
DEBUG = os.getenv("DJANGO_DEBUG", "True") == "True"
ALLOWED_HOSTS = os.getenv("DJANGO_ALLOWED_HOSTS", "127.0.0.1,localhost").split(",")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "corsheaders",
    "django_filters",
    "core",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "wenysha_backend.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {"context_processors": ["django.template.context_processors.debug",
                                           "django.template.context_processors.request",
                                           "django.contrib.auth.context_processors.auth",
                                           "django.contrib.messages.context_processors.messages"]},
    }
]

WSGI_APPLICATION = "wenysha_backend.wsgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.mysql",
        "NAME": os.getenv("MYSQL_DATABASE", "wenysha_connect"),
        "USER": os.getenv("MYSQL_USER", "root"),
        "PASSWORD": os.getenv("MYSQL_PASSWORD", ""),
        "HOST": os.getenv("MYSQL_HOST", "127.0.0.1"),
        "PORT": os.getenv("MYSQL_PORT", "3306"),
        "OPTIONS": {"init_command": "SET sql_mode='STRICT_TRANS_TABLES'"},
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True
STATIC_URL = "static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# CORS
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:5173").split(",")
CORS_ALLOW_CREDENTIALS = True

# REST Framework + JWT
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
    ),
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=int(os.getenv("JWT_ACCESS_MINUTES", "60"))),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=int(os.getenv("JWT_REFRESH_DAYS", "7"))),
}
EOF

cat > backend/wenysha_backend/urls.py <<'EOF'
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("core.urls")),
    path("api/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]
EOF

cat > backend/core/__init__.py <<'EOF'
# core app
EOF

cat > backend/core/apps.py <<'EOF'
from django.apps import AppConfig

class CoreConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "core"
EOF

cat > backend/core/models.py <<'EOF'
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class ClassRoom(models.Model):
    name = models.CharField(max_length=128, unique=True)
    teacher_name = models.CharField(max_length=256, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    def __str__(self):
        return self.name

class Parent(models.Model):
    first_name = models.CharField(max_length=128)
    last_name = models.CharField(max_length=128)
    phone = models.CharField(max_length=32, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    address = models.CharField(max_length=512, blank=True, null=True)
    status = models.CharField(max_length=16, default="Active")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    def __str__(self):
        return f"{self.first_name} {self.last_name}"

class Student(models.Model):
    first_name = models.CharField(max_length=128)
    last_name = models.CharField(max_length=128)
    dob = models.DateField(blank=True, null=True)
    gender = models.CharField(max_length=8, default="Other")
    classroom = models.ForeignKey(ClassRoom, on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(max_length=16, default="Active")
    parent = models.ForeignKey(Parent, on_delete=models.SET_NULL, null=True, blank=True, related_name="children")
    admission_date = models.DateField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    def __str__(self):
        return f"{self.first_name} {self.last_name}"

class Application(models.Model):
    application_reference = models.CharField(max_length=64, unique=True)
    applicant_first_name = models.CharField(max_length=128)
    applicant_last_name = models.CharField(max_length=128)
    grade_applied = models.CharField(max_length=64, blank=True, null=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=16, default="pending")
    documents = models.JSONField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    def __str__(self):
        return self.application_reference

class FeeStructure(models.Model):
    name = models.CharField(max_length=256)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    term = models.CharField(max_length=64, blank=True, null=True)
    form = models.CharField(max_length=64, blank=True, null=True)
    category = models.CharField(max_length=128, blank=True, null=True)
    boarding_type = models.CharField(max_length=64, blank=True, null=True)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    def __str__(self):
        return self.name

class Discount(models.Model):
    name = models.CharField(max_length=256)
    description = models.TextField(blank=True, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    student = models.ForeignKey(Student, on_delete=models.SET_NULL, null=True, blank=True)
    fee_structure = models.ForeignKey(FeeStructure, on_delete=models.SET_NULL, null=True, blank=True)
    start_date = models.DateField(blank=True, null=True)
    end_date = models.DateField(blank=True, null=True)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    def __str__(self):
        return self.name

class Invoice(models.Model):
    invoice_number = models.CharField(max_length=64, unique=True)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="invoices")
    issued_at = models.DateTimeField(auto_now_add=True)
    due_date = models.DateField(blank=True, null=True)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=16, default="issued")
    metadata = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    def __str__(self):
        return self.invoice_number

class Payment(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="payments")
    paid_at = models.DateTimeField(auto_now_add=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    method = models.CharField(max_length=64, blank=True, null=True)
    reference = models.CharField(max_length=128, blank=True, null=True)
    def __str__(self):
        return f"Payment {self.id} for {self.invoice.invoice_number}"

class Book(models.Model):
    title = models.CharField(max_length=512)
    author = models.CharField(max_length=256, blank=True, null=True)
    isbn = models.CharField(max_length=64, blank=True, null=True)
    category = models.CharField(max_length=128, blank=True, null=True)
    copies = models.IntegerField(default=1)
    available = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    def __str__(self):
        return self.title

class Attendance(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    classroom = models.ForeignKey(ClassRoom, on_delete=models.SET_NULL, null=True, blank=True)
    date = models.DateField()
    status = models.CharField(max_length=16, default="present")
    notes = models.TextField(blank=True, null=True)
    class Meta:
        unique_together = ("student","date")
    def __str__(self):
        return f"{self.student} - {self.date}"

class Promotion(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    from_classroom = models.ForeignKey(ClassRoom, on_delete=models.SET_NULL, null=True, blank=True, related_name="promotions_from")
    to_classroom = models.ForeignKey(ClassRoom, on_delete=models.SET_NULL, null=True, blank=True, related_name="promotions_to")
    promoted_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, null=True)
    def __str__(self):
        return f"Promotion {self.student} at {self.promoted_at}"
EOF

cat > backend/core/serializers.py <<'EOF'
from rest_framework import serializers
from .models import (
    ClassRoom, Parent, Student, Application, FeeStructure, Discount,
    Invoice, Payment, Book, Attendance, Promotion
)

class ClassRoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClassRoom
        fields = "__all__"

class ParentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Parent
        fields = "__all__"

class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = "__all__"

class ApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Application
        fields = "__all__"

class FeeStructureSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeeStructure
        fields = "__all__"

class DiscountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Discount
        fields = "__all__"

class InvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = "__all__"

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = "__all__"

class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = "__all__"

class AttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendance
        fields = "__all__"

class PromotionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Promotion
        fields = "__all__"
EOF

cat > backend/core/views.py <<'EOF'
from rest_framework import viewsets, permissions, filters
from .models import (
    ClassRoom, Parent, Student, Application, FeeStructure, Discount,
    Invoice, Payment, Book, Attendance, Promotion
)
from .serializers import (
    ClassRoomSerializer, ParentSerializer, StudentSerializer, ApplicationSerializer,
    FeeStructureSerializer, DiscountSerializer, InvoiceSerializer, PaymentSerializer,
    BookSerializer, AttendanceSerializer, PromotionSerializer
)
from django_filters.rest_framework import DjangoFilterBackend

class ClassRoomViewSet(viewsets.ModelViewSet):
    queryset = ClassRoom.objects.all()
    serializer_class = ClassRoomSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ["name", "teacher_name"]

class ParentViewSet(viewsets.ModelViewSet):
    queryset = Parent.objects.all().order_by("-created_at")
    serializer_class = ParentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ["first_name","last_name","phone","email"]

class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all().order_by("-created_at")
    serializer_class = StudentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ["first_name","last_name","parent__first_name","parent__last_name"]

class ApplicationViewSet(viewsets.ModelViewSet):
    queryset = Application.objects.all().order_by("-submitted_at")
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ["application_reference","applicant_first_name","applicant_last_name","status"]

class FeeStructureViewSet(viewsets.ModelViewSet):
    queryset = FeeStructure.objects.all().order_by("-created_at")
    serializer_class = FeeStructureSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ["name","form","term"]

class DiscountViewSet(viewsets.ModelViewSet):
    queryset = Discount.objects.all().order_by("-created_at")
    serializer_class = DiscountSerializer
    permission_classes = [permissions.IsAuthenticated]

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all().order_by("-issued_at")
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ["invoice_number","student__first_name","student__last_name"]

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all().order_by("-paid_at")
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ["reference","method"]

class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all().order_by("title")
    serializer_class = BookSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ["title","author","isbn","category"]

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all().order_by("-date")
    serializer_class = AttendanceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ["student__first_name","student__last_name"]

class PromotionViewSet(viewsets.ModelViewSet):
    queryset = Promotion.objects.all().order_by("-promoted_at")
    serializer_class = PromotionSerializer
    permission_classes = [permissions.IsAuthenticated]
EOF

cat > backend/core/urls.py <<'EOF'
from rest_framework import routers
from . import views
from django.urls import path, include

router = routers.DefaultRouter()
router.register(r"classrooms", views.ClassRoomViewSet)
router.register(r"parents", views.ParentViewSet)
router.register(r"students", views.StudentViewSet)
router.register(r"applications", views.ApplicationViewSet)
router.register(r"fees", views.FeeStructureViewSet)
router.register(r"discounts", views.DiscountViewSet)
router.register(r"invoices", views.InvoiceViewSet)
router.register(r"payments", views.PaymentViewSet)
router.register(r"books", views.BookViewSet)
router.register(r"attendance", views.AttendanceViewSet)
router.register(r"promotions", views.PromotionViewSet)

urlpatterns = [
    path("", include(router.urls)),
]
EOF

cat > backend/core/migrations/__init__.py <<'EOF'
# migrations package
EOF

cat > backend/core/management/commands/seed_initial_data.py <<'EOF'
"""
Idempotent data seeder for initial verification.
Run: python manage.py seed_initial_data
"""

import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from core.models import (
    ClassRoom, Parent, Student, Application, FeeStructure, Discount,
    Invoice, Payment, Book, Attendance, Promotion
)

User = get_user_model()

class Command(BaseCommand):
    help = "Create sample data for local development and verification (idempotent)."

    def handle(self, *args, **options):
        now = timezone.now()
        # Create admin user (from env if present)
        admin_username = os.getenv("SEED_ADMIN_USERNAME", "admin")
        admin_email = os.getenv("SEED_ADMIN_EMAIL", "admin@example.com")
        admin_password = os.getenv("SEED_ADMIN_PASSWORD", "adminpass")

        if not User.objects.filter(username=admin_username).exists():
            self.stdout.write(f"Creating superuser {admin_username}")
            User.objects.create_superuser(username=admin_username, email=admin_email, password=admin_password)
        else:
            self.stdout.write(f"Superuser {admin_username} already exists")

        # Classrooms
        c1, _ = ClassRoom.objects.get_or_create(name="Form 4A", defaults={"teacher_name": "Mrs. Grace Moyo"})
        c2, _ = ClassRoom.objects.get_or_create(name="Form 3A", defaults={"teacher_name": "Ms. Linda Phiri"})

        # Parents
        p1, _ = Parent.objects.get_or_create(first_name="John", last_name="Doe", defaults={
            "phone": "+263771234567", "email": "john.doe@example.com", "address": "123 Example St", "status": "Active"
        })

        # Students
        s1, _ = Student.objects.get_or_create(first_name="Alice", last_name="Doe", defaults={
            "dob": "2008-05-06", "gender": "F", "classroom": c1, "status": "Active", "parent": p1, "admission_date": now.date()
        })

        # Fee structures
        f1, _ = FeeStructure.objects.get_or_create(name="Tuition Term 1", defaults={
            "amount": 500.00, "term": "Term 1", "form": "Form 4", "category": "Academic", "boarding_type": "All", "active": True
        })
        f2, _ = FeeStructure.objects.get_or_create(name="Exam Fee", defaults={
            "amount": 100.00, "term": "Term 2", "form": "All", "category": "Academic", "boarding_type": "All", "active": True
        })

        # Application
        app_ref = "APP-2026-001"
        application, created = Application.objects.get_or_create(application_reference=app_ref, defaults={
            "applicant_first_name": "Kevin",
            "applicant_last_name": "Moyo",
            "grade_applied": "Form 1",
            "status": "pending",
            "documents": [{"type": "birth_certificate", "url": ""}],
            "notes": "Seed application"
        })
        if created:
            self.stdout.write(f"Created application {app_ref}")

        # Invoice & Payment
        invoice_num = "INV-1001"
        invoice, created = Invoice.objects.get_or_create(invoice_number=invoice_num, defaults={
            "student": s1,
            "issued_at": now,
            "due_date": (now + timezone.timedelta(days=14)).date(),
            "total_amount": 600.00,
            "status": "issued",
            "metadata": {"generated_by": "seed"}
        })
        if created:
            self.stdout.write(f"Created invoice {invoice_num}")

        # Payment for invoice
        payment, created = Payment.objects.get_or_create(invoice=invoice, reference="PAY-REF-1001", defaults={
            "paid_at": now,
            "amount": 600.00,
            "method": "cash",
        })
        if created:
            self.stdout.write("Created payment for invoice")

        # Books
        book1, _ = Book.objects.get_or_create(title="Advanced Mathematics", defaults={
            "author": "John Smith", "isbn": "978-3-16-148410-0", "category": "Mathematics", "copies": 15, "available": 8
        })

        # Attendance for today
        attendance, _ = Attendance.objects.get_or_create(student=s1, date=now.date(), defaults={
            "classroom": c1, "status": "present", "notes": "Seeded attendance"
        })

        # Promotion record (if not already)
        promotion, _ = Promotion.objects.get_or_create(student=s1, from_classroom=c2, to_classroom=c1, defaults={
            "notes": "Seed promotion record"
        })

        # Discount sample
        discount, _ = Discount.objects.get_or_create(name="Merit Scholarship", student=s1, defaults={
            "description": "50% scholarship for top performer",
            "percentage": 50.00,
            "active": True
        })

        self.stdout.write(self.style.SUCCESS("Seeding complete. Sample data created or already present."))
EOF

# Stage and commit
git add backend sql
git commit -m "$COMMIT_MESSAGE" || {
  echo "No changes to commit (maybe identical content already present)."
}

# Push
echo "Pushing branch ${BRANCH} to origin..."
git push -u origin "${BRANCH}"

echo "Done. Files created and pushed to ${BRANCH}."
echo "Next: run backend/setup_and_seed.sh with MySQL root credentials to create DB, run migrations and seed data."
echo "Example:"
echo "  chmod +x backend/setup_and_seed.sh"
echo "  ./backend/setup_and_seed.sh root <mysql_root_password> wenysha_connect wenysha_user secretpassword 127.0.0.1 3306"
