"""
Django settings for Wenyasha Connect backend.
Uses MySQL and Django REST Framework with JWT.
"""
import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'dev-secret-change-in-production')

# Support both DJANGO_DEBUG and DEBUG env var names.
DEBUG = os.environ.get('DJANGO_DEBUG', os.environ.get('DEBUG', 'True')).lower() == 'true'

ALLOWED_HOSTS = os.environ.get('DJANGO_ALLOWED_HOSTS', os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1,::1')).split(',')
# Add ngrok and preview domains dynamically
ngrok_domain = os.environ.get('NGROK_DOMAIN', '').strip()
preview_domain = os.environ.get('PREVIEW_DOMAIN', '').strip()
if ngrok_domain:
    ALLOWED_HOSTS.append(ngrok_domain.replace('https://', '').replace('http://', ''))
if preview_domain:
    ALLOWED_HOSTS.append(preview_domain.replace('https://', '').replace('http://', ''))

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'django_filters',
    'corsheaders',
    'core',
    'school',
    'finance',
    'library',
    'hostel',
    'transport',
    'exams',
    'attendance',
    'notices',
    'parents',
    'content',
    'admissions',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

WSGI_APPLICATION = 'config.wsgi.application'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

if os.environ.get("USE_SQLITE", "False") == "True":
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.mysql',
            'NAME': os.environ.get('MYSQL_DATABASE', 'wenyasha_connect'),
            'USER': os.environ.get('MYSQL_USER', 'root'),
            'PASSWORD': os.environ.get('MYSQL_PASSWORD', ''),
            'HOST': os.environ.get('MYSQL_HOST', '127.0.0.1'),
            'PORT': os.environ.get('MYSQL_PORT', '3306'),
            'OPTIONS': {
                'charset': 'utf8mb4',
                'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
            },
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Custom user: use Django's User; link to Role and profiles via OneToOne
AUTH_USER_MODEL = 'auth.User'

# CORS: allow React dev server, ngrok, and preview domains
CORS_ALLOWED_ORIGINS = os.environ.get('CORS_ALLOWED_ORIGINS', os.environ.get('CORS_ORIGINS', 'http://localhost:5173,http://localhost:8080,http://127.0.0.1:5173,http://127.0.0.1:8080')).split(',')
# Add ngrok and preview domains
if ngrok_domain:
    CORS_ALLOWED_ORIGINS.append(f"https://{ngrok_domain.replace('https://', '').replace('http://', '')}")
if preview_domain:
    CORS_ALLOWED_ORIGINS.append(f"https://{preview_domain.replace('https://', '').replace('http://', '')}")
CORS_ALLOW_CREDENTIALS = True

# CSRF: trust HTTPS origins for ngrok and preview domains
CSRF_TRUSTED_ORIGINS = []
if ngrok_domain:
    CSRF_TRUSTED_ORIGINS.append(f"https://{ngrok_domain.replace('https://', '').replace('http://', '')}")
if preview_domain:
    CSRF_TRUSTED_ORIGINS.append(f"https://{preview_domain.replace('https://', '').replace('http://', '')}")

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_FILTER_BACKENDS': ['django_filters.rest_framework.DjangoFilterBackend'],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 50,
}

# JWT
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
}

# Email configuration - use console backend in development when not specified
EMAIL_BACKEND = os.environ.get('DJANGO_EMAIL_BACKEND', 'django.core.mail.backends.console.EmailBackend')
DEFAULT_FROM_EMAIL = os.environ.get('DJANGO_DEFAULT_FROM_EMAIL', 'webmaster@localhost')
