"""
Django settings for Able God College backend.
Uses MySQL and Django REST Framework with JWT.
"""
import os
import sys
import warnings
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv
from django.core.exceptions import ImproperlyConfigured

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')
load_dotenv()


def _as_list(value: str, default: str = "") -> list[str]:
    items = value if value else default
    return [item.strip() for item in items.split(',') if item.strip()]


# Support both DJANGO_DEBUG and DEBUG env var names.
DEBUG = os.environ.get('DJANGO_DEBUG', os.environ.get('DEBUG', 'False')).lower() == 'true'

_DEVELOPMENT_SECRET_KEY = 'development-secret-key-change-in-production-use-env-2026-abcdefghi123456'
_IS_TEST_RUN = 'test' in sys.argv[1:]
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', _DEVELOPMENT_SECRET_KEY)
if not DEBUG and not _IS_TEST_RUN and (
    not SECRET_KEY
    or SECRET_KEY == _DEVELOPMENT_SECRET_KEY
    or SECRET_KEY == 'replace-this-in-production'
    or SECRET_KEY.startswith('replace-with-a-unique-secret')
    or len(SECRET_KEY) < 50
):
    raise ImproperlyConfigured(
        'Set a unique DJANGO_SECRET_KEY of at least 50 characters before running with DJANGO_DEBUG=False.'
    )

ALLOWED_HOSTS = _as_list(
    os.environ.get('DJANGO_ALLOWED_HOSTS', os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1,0.0.0.0,::1')),
    'localhost,127.0.0.1,0.0.0.0,::1'
)


INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'whitenoise.runserver_nostatic',
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'django_filters',
    'corsheaders',
    'core',
    'school.apps.SchoolConfig',
    'finance',
    'library',
    'hostel',
    'transport',
    'exams',
    'attendance.apps.AttendanceConfig',
    'notices',
    'parents',
    'content',
    'admissions',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
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
            'NAME': os.environ.get('MYSQL_DATABASE', 'able_god_college'),
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

# Password hashing: Argon2id (memory-hard) is the preferred algorithm. The older
# hashers stay listed only so existing accounts can still log in; Django then
# re-hashes their password with Argon2id automatically on that successful login.
PASSWORD_HASHERS = [
    'core.hashers.HardenedArgon2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher',
    'django.contrib.auth.hashers.BCryptSHA256PasswordHasher',
]
if _IS_TEST_RUN:
    # Keep the test suite fast; security tests override PASSWORD_HASHERS explicitly.
    PASSWORD_HASHERS.insert(0, 'django.contrib.auth.hashers.MD5PasswordHasher')

# Shared cache for profile data, rate-limit counters, account lockouts and MFA
# challenges. It must be shared by every worker and every server behind the load
# balancer, so production uses Redis (REDIS_URL). Per-process memory is only
# acceptable for single-process local development.
REDIS_URL = os.environ.get('REDIS_URL', '').strip()
if REDIS_URL:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.redis.RedisCache',
            'LOCATION': REDIS_URL,
            'KEY_PREFIX': 'ablegod',
            'TIMEOUT': 300,
            'OPTIONS': {'socket_connect_timeout': 2, 'socket_timeout': 2},
        }
    }
else:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'ablegod-auth-cache',
            'TIMEOUT': 300,
            'OPTIONS': {'MAX_ENTRIES': 10000},
        }
    }
    if not DEBUG and not _IS_TEST_RUN:
        warnings.warn(
            'REDIS_URL is not set: login rate limits, lockouts and MFA challenges are kept in '
            'per-process memory and will NOT work correctly with several workers or servers.',
            RuntimeWarning,
        )

# Authenticator-app secrets are encrypted at rest. Defaults to a key derived from
# DJANGO_SECRET_KEY; set MFA_ENCRYPTION_KEY to rotate DJANGO_SECRET_KEY independently.
MFA_ENCRYPTION_KEY = os.environ.get('MFA_ENCRYPTION_KEY', '')

# Portal roles that MUST use two-step verification (comma separated; empty = nobody).
# Until they enrol they can sign in but only reach the screens needed to set it up.
MFA_REQUIRED_ROLES = [
    role.strip()
    for role in os.environ.get('MFA_REQUIRED_ROLES', '' if _IS_TEST_RUN else 'Admin').split(',')
    if role.strip()
]

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Africa/Harare'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
FRONTEND_BUILD_DIR = Path(os.environ.get('FRONTEND_BUILD_DIR', BASE_DIR.parent / 'dist')).resolve()
STATICFILES_DIRS = [FRONTEND_BUILD_DIR] if FRONTEND_BUILD_DIR.is_dir() else []
MEDIA_URL = '/media/'
MEDIA_ROOT = Path(os.environ.get('DJANGO_MEDIA_ROOT', BASE_DIR / 'media')).resolve()
FILE_UPLOAD_MAX_MEMORY_SIZE = 20 * 1024 * 1024
# This limit includes multipart headers and fields as well as the file itself.
DATA_UPLOAD_MAX_MEMORY_SIZE = 22 * 1024 * 1024
STORAGES = {
    'default': {
        'BACKEND': 'django.core.files.storage.FileSystemStorage',
    },
    'staticfiles': {
        'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage',
    },
}
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Custom user: use Django's User; link to Role and profiles via OneToOne
AUTH_USER_MODEL = 'auth.User'

# CORS: allow configured frontend origins, with localhost defaults for local development.
CORS_ALLOWED_ORIGINS = _as_list(
    os.environ.get(
        'CORS_ALLOWED_ORIGINS',
        os.environ.get(
            'CORS_ORIGINS',
            'http://localhost:5173,http://localhost:8080,http://localhost:8081,http://127.0.0.1:5173,http://127.0.0.1:8080,http://127.0.0.1:8081'
        )
    ),
    'http://localhost:5173,http://localhost:8080,http://localhost:8081,http://127.0.0.1:5173,http://127.0.0.1:8080,http://127.0.0.1:8081'
)
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = _as_list(
    os.environ.get(
        'CSRF_TRUSTED_ORIGINS',
        'http://localhost:5173,http://localhost:8080,http://localhost:8081,http://127.0.0.1:5173,http://127.0.0.1:8080,http://127.0.0.1:8081'
    ),
    'http://localhost:5173,http://localhost:8080,http://localhost:8081,http://127.0.0.1:5173,http://127.0.0.1:8080,http://127.0.0.1:8081'
)

SECURE_SSL_REDIRECT = os.environ.get(
    'DJANGO_SECURE_SSL_REDIRECT',
    'False' if DEBUG else 'True',
).lower() == 'true'
SECURE_HSTS_SECONDS = int(os.environ.get('DJANGO_SECURE_HSTS_SECONDS', '31536000' if not DEBUG else '0'))
SECURE_HSTS_INCLUDE_SUBDOMAINS = os.environ.get(
    'DJANGO_SECURE_HSTS_INCLUDE_SUBDOMAINS',
    'True' if not DEBUG else 'False',
).lower() == 'true'
SECURE_HSTS_PRELOAD = os.environ.get(
    'DJANGO_SECURE_HSTS_PRELOAD',
    'False',
).lower() == 'true'

if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'core.authentication.PasswordChangeRequiredJWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_FILTER_BACKENDS': ['django_filters.rest_framework.DjangoFilterBackend'],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 50,
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '120/minute',
        'user': '600/minute',
        # Per client IP. Sized for a school network where many students share one
        # public IP; per-account lockout (core.throttling) is the main brute-force guard.
        'login': os.environ.get('LOGIN_THROTTLE_RATE', '1000/minute' if _IS_TEST_RUN else '20/minute'),
        'signup': os.environ.get('SIGNUP_THROTTLE_RATE', '1000/minute' if _IS_TEST_RUN else '10/hour'),
        'mfa': os.environ.get('MFA_THROTTLE_RATE', '1000/minute' if _IS_TEST_RUN else '10/minute'),
    },
    # Number of trusted reverse proxies in front of Django (our nginx = 1). Without
    # this, DRF trusts the whole client-supplied X-Forwarded-For header, which lets
    # an attacker dodge rate limits by sending a different fake address each time.
    'NUM_PROXIES': int(os.environ.get('NUM_PROXIES', '0' if DEBUG or _IS_TEST_RUN else '1')),
}

# Admin account lifecycle events are emitted without credential values; the
# deployment's process supervisor can collect these console records.
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {'ablegod_console': {'class': 'logging.StreamHandler'}},
    'loggers': {
        'ablegod.accounts': {
            'handlers': ['ablegod_console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# JWT
SIMPLE_JWT = {
    # Short-lived access token; the client renews it silently with the refresh token.
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=int(os.environ.get('JWT_ACCESS_MINUTES', '15'))),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=int(os.environ.get('JWT_REFRESH_DAYS', '7'))),
    # Every refresh issues a new refresh token and blacklists the old one.
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}

# Email configuration - use console backend in development when not specified
EMAIL_BACKEND = os.environ.get('DJANGO_EMAIL_BACKEND', 'django.core.mail.backends.console.EmailBackend')
DEFAULT_FROM_EMAIL = os.environ.get('DJANGO_DEFAULT_FROM_EMAIL', 'webmaster@localhost')
