from django.contrib.auth.hashers import PBKDF2PasswordHasher


class HardenedPBKDF2PasswordHasher(PBKDF2PasswordHasher):
    """
    Hardened PBKDF2 with SHA-256 and 720,000 iterations.
    Exceeds OWASP recommended standards (minimum 600,000) for high resistance
    against GPU/ASIC accelerated dictionary attacks.
    """
    iterations = 720000
