from django.contrib.auth.hashers import Argon2PasswordHasher, PBKDF2PasswordHasher


class HardenedArgon2PasswordHasher(Argon2PasswordHasher):
    """
    Argon2id with explicit, memory-hard parameters (64 MiB, 3 passes, 4 lanes).

    Argon2id is the current OWASP first choice: unlike PBKDF2 it needs a large
    block of RAM per guess, which makes GPU/ASIC cracking far more expensive.
    Django stores the parameters inside each hash, so these numbers can be raised
    later and existing users are upgraded transparently the next time they log in.
    """
    time_cost = 3
    memory_cost = 65536  # KiB
    parallelism = 4


class HardenedPBKDF2PasswordHasher(PBKDF2PasswordHasher):
    """Kept for reference/compatibility; no longer the preferred hasher."""
    iterations = 720000
