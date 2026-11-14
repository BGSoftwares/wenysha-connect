import io
import json
import re
from unittest import mock

from django.conf import settings
from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import User
from django.core import mail
from django.core.management import call_command
from django.core.cache import cache
from django.db import connection
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from core import mfa, totp
from core.caching import get_portal_state
from core.models import Role, UserProfile
from core.throttling import MAX_FAILED_ATTEMPTS, AccountLockoutManager, LoginRateThrottle

PASSWORD = 'Correct-horse-battery-9'
RFC_6238_SECRET = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ'  # ASCII "12345678901234567890"


class AuthTestCase(TestCase):
    def setUp(self):
        cache.clear()  # counters/lockouts/challenges are cache-backed
        self.role, _ = Role.objects.get_or_create(name='Student')
        self.user = User.objects.create_user(username='tendai', email='tendai@example.com', password=PASSWORD)
        UserProfile.objects.create(user=self.user, role=self.role, full_name='Tendai Moyo')
        self.client = APIClient()

    def login(self, identifier='tendai', password=PASSWORD, **extra):
        return self.client.post('/api/auth/login/', {'email': identifier, 'password': password}, format='json', **extra)

    def fresh_user(self):
        return User.objects.select_related('profile__role').get(pk=self.user.pk)


@override_settings(PASSWORD_HASHERS=[
    'core.hashers.HardenedArgon2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',
])
class PasswordHashingTests(AuthTestCase):
    def test_new_passwords_are_hashed_with_argon2id(self):
        user = User.objects.create_user(username='fresh', password=PASSWORD)
        self.assertTrue(user.password.startswith('argon2$argon2id$'))
        self.assertTrue(user.check_password(PASSWORD))
        self.assertFalse(user.check_password('wrong'))

    def test_legacy_pbkdf2_hash_still_works_and_is_upgraded_on_login(self):
        User.objects.filter(pk=self.user.pk).update(password=make_password(PASSWORD, hasher='pbkdf2_sha256'))
        self.assertTrue(self.fresh_user().password.startswith('pbkdf2_sha256$'))

        self.assertEqual(self.login().status_code, 200)

        self.assertTrue(self.fresh_user().password.startswith('argon2$argon2id$'))


class LoginTests(AuthTestCase):
    def test_success_returns_session_tokens_and_role(self):
        response = self.login()
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['access'])
        self.assertTrue(response.data['refresh'])
        self.assertTrue(response.data['session_id'])
        self.assertEqual(response.data['user']['role'], 'Student')
        self.assertNotIn('password', json.dumps(response.data))

    def test_can_log_in_with_email_or_username_in_any_case(self):
        self.assertEqual(self.login('tendai@example.com').status_code, 200)
        self.assertEqual(self.login('TENDAI').status_code, 200)

    def test_stale_authorization_header_does_not_block_login(self):
        self.assertEqual(self.login(HTTP_AUTHORIZATION='Bearer not-a-real-token').status_code, 200)

    def test_wrong_password_and_unknown_user_look_identical(self):
        wrong = self.login(password='nope')
        unknown = self.login('ghost', 'nope')
        self.assertEqual(wrong.status_code, 401)
        self.assertEqual(unknown.status_code, 401)
        self.assertEqual(wrong.data, unknown.data)

    def test_unknown_user_still_costs_a_password_hash_verification(self):
        with mock.patch('core.views.hasher_check_password') as spy:
            self.login('ghost', 'nope')
        spy.assert_called_once()

    def test_disabled_account_cannot_log_in(self):
        User.objects.filter(pk=self.user.pk).update(is_active=False)
        self.assertEqual(self.login().status_code, 403)


class BruteForceProtectionTests(AuthTestCase):
    def test_account_locks_after_repeated_failures_even_for_the_right_password(self):
        statuses = [self.login(password='bad').status_code for _ in range(MAX_FAILED_ATTEMPTS)]
        self.assertEqual(statuses, [401] * (MAX_FAILED_ATTEMPTS - 1) + [429])
        self.assertEqual(self.login().status_code, 429)

    def test_successful_login_resets_the_failure_counter(self):
        for _ in range(MAX_FAILED_ATTEMPTS - 1):
            self.login(password='bad')
        self.assertEqual(self.login().status_code, 200)
        for _ in range(MAX_FAILED_ATTEMPTS - 1):
            self.assertEqual(self.login(password='bad').status_code, 401)

    def test_lockout_manager_counts_and_resets(self):
        for _ in range(MAX_FAILED_ATTEMPTS - 1):
            self.assertEqual(AccountLockoutManager.record_failure('Someone'), (False, 0))
        locked, seconds = AccountLockoutManager.record_failure('someone')  # case-insensitive
        self.assertTrue(locked)
        self.assertGreater(seconds, 0)
        self.assertTrue(AccountLockoutManager.is_locked('SOMEONE')[0])
        AccountLockoutManager.reset('someone')
        self.assertFalse(AccountLockoutManager.is_locked('someone')[0])

    def test_per_ip_throttle_limits_login_requests(self):
        with mock.patch.dict(LoginRateThrottle.THROTTLE_RATES, {'login': '2/minute'}):
            statuses = [self.login().status_code for _ in range(3)]
        self.assertEqual(statuses, [200, 200, 429])

    def test_forged_forwarded_for_header_cannot_dodge_the_ip_throttle(self):
        rest_framework = {**settings.REST_FRAMEWORK, 'NUM_PROXIES': 1}
        with override_settings(REST_FRAMEWORK=rest_framework), \
                mock.patch.dict(LoginRateThrottle.THROTTLE_RATES, {'login': '2/minute'}):
            # The last entry is what our proxy appended; earlier entries are attacker-controlled.
            statuses = [
                self.login(HTTP_X_FORWARDED_FOR=f'10.9.9.{i}, 198.51.100.7').status_code
                for i in range(3)
            ]
        self.assertEqual(statuses, [200, 200, 429])


class TokenTests(AuthTestCase):
    def refresh(self, token):
        return self.client.post('/api/auth/token/refresh/', {'refresh': token}, format='json')

    def test_refresh_rotates_and_the_old_refresh_token_is_rejected(self):
        original = self.login().data['refresh']
        rotated = self.refresh(original)
        self.assertEqual(rotated.status_code, 200)
        self.assertNotEqual(rotated.data['refresh'], original)
        self.assertEqual(self.refresh(original).status_code, 401)
        self.assertEqual(self.refresh(rotated.data['refresh']).status_code, 200)

    def test_logout_revokes_the_refresh_token(self):
        refresh = self.login().data['refresh']
        self.assertEqual(self.client.post('/api/auth/logout/', {'refresh': refresh}, format='json').status_code, 204)
        self.assertEqual(self.refresh(refresh).status_code, 401)

    def test_logout_with_garbage_is_harmless(self):
        self.assertEqual(self.client.post('/api/auth/logout/', {'refresh': 'garbage'}, format='json').status_code, 204)

    def test_access_token_authenticates_requests(self):
        tokens = self.login().data
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
        self.assertEqual(self.client.get('/api/auth/me/').status_code, 200)
        self.client.credentials()
        self.assertEqual(self.client.get('/api/auth/me/').status_code, 401)

    def test_password_change_revokes_other_sessions_and_keeps_this_one(self):
        other_device = self.login().data['refresh']
        this_device = self.login().data
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {this_device['access']}")

        new_password = 'Another-strong-pass-2026'
        response = self.client.post('/api/auth/change-password/', {
            'current_password': PASSWORD, 'new_password': new_password, 'confirm_password': new_password,
        }, format='json')
        self.assertEqual(response.status_code, 200)

        self.client.credentials()
        self.assertEqual(self.refresh(other_device).status_code, 401)
        self.assertEqual(self.refresh(this_device['refresh']).status_code, 401)
        self.assertEqual(self.refresh(response.data['refresh']).status_code, 200)
        self.assertEqual(self.login().status_code, 401)  # old password
        self.assertEqual(self.login(password=new_password).status_code, 200)


class AccountCacheTests(AuthTestCase):
    def test_portal_state_is_cached_without_credentials(self):
        user = self.fresh_user()
        first = get_portal_state(user)
        self.assertEqual(first['role'], 'Student')
        self.assertNotIn('password', json.dumps(first).lower())

        another_instance = self.fresh_user()
        with self.assertNumQueries(0):
            self.assertEqual(get_portal_state(another_instance), first)

    def test_cache_is_invalidated_when_the_profile_changes(self):
        get_portal_state(self.fresh_user())
        profile = UserProfile.objects.get(user=self.user)
        profile.preferences = {'must_change_password': True}
        profile.save()
        self.assertTrue(get_portal_state(self.fresh_user())['must_change_password'])

    def test_temporary_password_accounts_are_limited_until_they_change_it(self):
        profile = UserProfile.objects.get(user=self.user)
        profile.preferences = {'must_change_password': True}
        profile.save()
        tokens = self.login().data
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
        self.assertEqual(self.client.get('/api/auth/me/').status_code, 200)
        blocked = self.client.get('/api/auth/accounts/')
        self.assertEqual(blocked.status_code, 403)
        self.assertEqual(blocked.data['detail'].code, 'password_change_required')  # not just a role denial

    def test_login_lookup_columns_are_indexed(self):
        with connection.cursor() as cursor:
            constraints = connection.introspection.get_constraints(cursor, User._meta.db_table)
        indexed = [tuple(c['columns']) for c in constraints.values() if c.get('index') or c.get('unique')]
        self.assertIn(('email',), indexed)
        self.assertIn(('username',), indexed)


class TotpPrimitiveTests(TestCase):
    def setUp(self):
        cache.clear()

    def test_matches_rfc_6238_test_vector(self):
        # RFC 6238 appendix B: T=59s -> 94287082 (8 digits); we use 6, i.e. the last six.
        self.assertEqual(totp.totp_now(RFC_6238_SECRET, for_time=59), '287082')

    def test_accepts_adjacent_step_but_not_far_ones(self):
        now = 1_800_000_020.0
        self.assertTrue(totp.verify_totp(RFC_6238_SECRET, totp.totp_now(RFC_6238_SECRET, now - 30), 1, for_time=now))
        self.assertFalse(totp.verify_totp(RFC_6238_SECRET, totp.totp_now(RFC_6238_SECRET, now - 120), 1, for_time=now))

    def test_a_code_cannot_be_used_twice(self):
        now = 1_800_000_020.0
        code = totp.totp_now(RFC_6238_SECRET, now)
        self.assertTrue(totp.verify_totp(RFC_6238_SECRET, code, 7, for_time=now))
        self.assertFalse(totp.verify_totp(RFC_6238_SECRET, code, 7, for_time=now))

    def test_secret_round_trips_through_encryption(self):
        secret = totp.generate_secret()
        stored = totp.encrypt_secret(secret)
        self.assertNotIn(secret, stored)
        self.assertEqual(totp.decrypt_secret(stored), secret)
        self.assertIsNone(totp.decrypt_secret('tampered'))


class EmailMfaTests(AuthTestCase):
    def setUp(self):
        super().setUp()
        mfa.enable_email_mfa(self.user)

    def start(self):
        response = self.login()
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['mfa_required'])
        self.assertEqual(response.data['mfa_method'], 'email')
        self.assertNotIn('access', response.data)
        return response.data['mfa_token'], re.search(r'\b(\d{6})\b', mail.outbox[-1].body).group(1)

    def verify(self, token, code):
        return self.client.post('/api/auth/mfa/verify/', {'mfa_token': token, 'code': code}, format='json')

    def test_password_alone_does_not_grant_tokens(self):
        token, code = self.start()
        response = self.verify(token, code)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['access'])

    def test_code_is_single_use(self):
        token, code = self.start()
        self.assertEqual(self.verify(token, code).status_code, 200)
        self.assertEqual(self.verify(token, code).status_code, 400)

    def test_wrong_code_is_rejected(self):
        token, code = self.start()
        wrong = f"{(int(code) + 1) % 1000000:06d}"
        response = self.verify(token, wrong)
        self.assertEqual(response.status_code, 400)
        self.assertIn('remaining', response.data['detail'])

    def test_challenge_dies_after_too_many_wrong_codes(self):
        token, code = self.start()
        wrong = f"{(int(code) + 1) % 1000000:06d}"
        for _ in range(3):
            self.assertEqual(self.verify(token, wrong).status_code, 400)
        self.assertEqual(self.verify(token, code).status_code, 400)

    def test_account_is_blocked_after_repeated_failures_across_fresh_challenges(self):
        for _ in range(MAX_FAILED_ATTEMPTS):
            token, code = self.start()
            self.verify(token, f"{(int(code) + 1) % 1000000:06d}")
        token, code = self.start()
        response = self.verify(token, code)
        self.assertEqual(response.status_code, 400)
        self.assertIn('Too many', response.data['detail'])

    def test_tampered_token_is_rejected(self):
        token, code = self.start()
        self.assertEqual(self.verify(token + 'x', code).status_code, 400)

    def test_resend_has_a_cooldown(self):
        token, _ = self.start()
        first = self.client.post('/api/auth/mfa/resend/', {'mfa_token': token}, format='json')
        self.assertEqual(first.status_code, 200)
        self.assertEqual(len(mail.outbox), 2)
        second = self.client.post('/api/auth/mfa/resend/', {'mfa_token': token}, format='json')
        self.assertEqual(second.status_code, 429)

    def test_toggle_requires_the_password_and_an_email_address(self):
        self.client.force_authenticate(self.user)
        self.assertEqual(self.client.post('/api/auth/mfa/toggle/', {'enabled': False, 'password': 'bad'}, format='json').status_code, 400)
        self.assertEqual(self.client.post('/api/auth/mfa/toggle/', {'enabled': False, 'password': PASSWORD}, format='json').status_code, 200)
        self.assertFalse(mfa.is_mfa_enabled_for_user(self.fresh_user()))

        self.user.email = ''
        self.user.save()
        response = self.client.post('/api/auth/mfa/toggle/', {'enabled': True, 'password': PASSWORD}, format='json')
        self.assertEqual(response.status_code, 400)


class TotpMfaTests(AuthTestCase):
    FIXED_NOW = 1_800_000_010.0  # inside a 30s step, far from its edges

    def test_enrol_then_sign_in_with_authenticator_codes(self):
        clock = mock.Mock(time=lambda: self.FIXED_NOW)
        with mock.patch('core.totp.time', clock):
            self.client.force_authenticate(self.user)

            bad = self.client.post('/api/auth/mfa/totp/setup/', {'password': 'bad'}, format='json')
            self.assertEqual(bad.status_code, 400)

            setup = self.client.post('/api/auth/mfa/totp/setup/', {'password': PASSWORD}, format='json')
            self.assertEqual(setup.status_code, 200)
            secret = setup.data['secret']
            self.assertTrue(setup.data['otpauth_uri'].startswith('otpauth://totp/'))
            # Stored encrypted, and not active until proven.
            self.assertNotIn(secret, json.dumps(UserProfile.objects.get(user=self.user).preferences))
            self.assertFalse(mfa.is_mfa_enabled_for_user(self.fresh_user()))

            valid_now = {totp.totp_now(secret, self.FIXED_NOW + offset) for offset in (-30, 0, 30)}
            wrong = next(f"{n:06d}" for n in range(1000000) if f"{n:06d}" not in valid_now)
            self.assertEqual(self.client.post('/api/auth/mfa/totp/confirm/', {'code': wrong}, format='json').status_code, 400)
            self.assertFalse(mfa.is_mfa_enabled_for_user(self.fresh_user()))

            current = totp.totp_now(secret, self.FIXED_NOW)
            self.assertEqual(self.client.post('/api/auth/mfa/totp/confirm/', {'code': current}, format='json').status_code, 200)
            self.assertTrue(mfa.is_mfa_enabled_for_user(self.fresh_user()))

            # Sign in: no email is sent, and the code just used for enrolment cannot be replayed.
            self.client.force_authenticate(None)
            challenge = self.login()
            self.assertEqual(challenge.data['mfa_method'], 'totp')
            self.assertEqual(len(mail.outbox), 0)
            token = challenge.data['mfa_token']

            replay = self.client.post('/api/auth/mfa/verify/', {'mfa_token': token, 'code': current}, format='json')
            self.assertEqual(replay.status_code, 400)

            next_code = totp.totp_now(secret, self.FIXED_NOW + 30)
            ok = self.client.post('/api/auth/mfa/verify/', {'mfa_token': token, 'code': next_code}, format='json')
            self.assertEqual(ok.status_code, 200)
            self.assertTrue(ok.data['access'])

    def test_turning_mfa_off_removes_the_stored_secret(self):
        clock = mock.Mock(time=lambda: self.FIXED_NOW)
        with mock.patch('core.totp.time', clock):
            self.client.force_authenticate(self.user)
            secret = self.client.post('/api/auth/mfa/totp/setup/', {'password': PASSWORD}, format='json').data['secret']
            self.client.post('/api/auth/mfa/totp/confirm/', {'code': totp.totp_now(secret, self.FIXED_NOW)}, format='json')
        self.client.post('/api/auth/mfa/toggle/', {'enabled': False, 'password': PASSWORD}, format='json')
        prefs = UserProfile.objects.get(user=self.user).preferences
        self.assertNotIn('totp_secret', prefs)
        self.assertNotIn('mfa_enabled', prefs)
        self.assertEqual(self.login().status_code, 200)


class BackupCodeTests(AuthTestCase):
    def setUp(self):
        super().setUp()
        mfa.enable_email_mfa(self.user)
        self.codes = mfa.generate_backup_codes(self.fresh_user())

    def start(self):
        return self.login().data['mfa_token']

    def verify(self, token, code):
        return self.client.post('/api/auth/mfa/verify/', {'mfa_token': token, 'code': code}, format='json')

    def test_eight_codes_in_xxxxx_xxxxx_form(self):
        self.assertEqual(len(self.codes), mfa.BACKUP_CODE_COUNT)
        self.assertTrue(all(re.fullmatch(r'[a-z0-9]{5}-[a-z0-9]{5}', c) for c in self.codes))
        self.assertEqual(len(set(self.codes)), len(self.codes))

    def test_only_hashes_are_stored(self):
        stored = json.dumps(UserProfile.objects.get(user=self.user).preferences)
        for code in self.codes:
            self.assertNotIn(code.replace('-', ''), stored)

    def test_a_backup_code_signs_in_exactly_once(self):
        first = self.verify(self.start(), self.codes[0])
        self.assertEqual(first.status_code, 200)
        self.assertTrue(first.data['access'])
        self.assertEqual(self.verify(self.start(), self.codes[0]).status_code, 400)
        self.assertEqual(mfa.backup_codes_remaining(self.fresh_user()), mfa.BACKUP_CODE_COUNT - 1)

    def test_case_and_dash_do_not_matter(self):
        typed = self.codes[1].upper().replace('-', ' ')
        self.assertEqual(self.verify(self.start(), typed).status_code, 200)

    def test_wrong_backup_code_is_rejected_and_counted(self):
        response = self.verify(self.start(), 'zzzzz-zzzzz')
        self.assertEqual(response.status_code, 400)
        self.assertIn('remaining', response.data['detail'])
        self.assertEqual(mfa.backup_codes_remaining(self.fresh_user()), mfa.BACKUP_CODE_COUNT)

    def test_regenerating_needs_the_password_and_retires_the_old_codes(self):
        self.client.force_authenticate(self.user)
        self.assertEqual(self.client.post('/api/auth/mfa/backup-codes/', {'password': 'bad'}, format='json').status_code, 400)
        fresh = self.client.post('/api/auth/mfa/backup-codes/', {'password': PASSWORD}, format='json')
        self.assertEqual(fresh.status_code, 200)
        self.client.force_authenticate(None)

        self.assertEqual(self.verify(self.start(), self.codes[0]).status_code, 400)
        self.assertEqual(self.verify(self.start(), fresh.data['backup_codes'][0]).status_code, 200)

    def test_turning_mfa_off_removes_backup_codes(self):
        self.client.force_authenticate(self.user)
        self.client.post('/api/auth/mfa/toggle/', {'enabled': False, 'password': PASSWORD}, format='json')
        self.assertNotIn('backup_codes', UserProfile.objects.get(user=self.user).preferences)

    def test_status_reports_remaining_codes(self):
        self.client.force_authenticate(self.user)
        self.assertEqual(self.client.get('/api/auth/mfa/status/').data['backup_codes_remaining'], mfa.BACKUP_CODE_COUNT)


@override_settings(MFA_REQUIRED_ROLES=['Student'])
class RequiredMfaTests(AuthTestCase):
    FIXED_NOW = 1_800_000_010.0

    def sign_in(self):
        tokens = self.login().data
        self.assertTrue(tokens['user']['mfa_setup_required'])
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")

    def enrol(self):
        clock = mock.Mock(time=lambda: self.FIXED_NOW)
        with mock.patch('core.totp.time', clock):
            secret = self.client.post('/api/auth/mfa/totp/setup/', {'password': PASSWORD}, format='json').data['secret']
            return self.client.post('/api/auth/mfa/totp/confirm/', {'code': totp.totp_now(secret, self.FIXED_NOW)}, format='json')

    def test_unenrolled_account_can_only_reach_setup_screens(self):
        self.sign_in()
        me = self.client.get('/api/auth/me/')
        self.assertEqual(me.status_code, 200)
        self.assertTrue(me.data['mfa_setup_required'])
        status = self.client.get('/api/auth/mfa/status/')
        self.assertEqual(status.status_code, 200)
        self.assertTrue(status.data['mfa_required'])

        blocked = self.client.get('/api/auth/accounts/')
        self.assertEqual(blocked.status_code, 403)
        self.assertEqual(blocked.data['detail'].code, 'mfa_setup_required')

    def test_enrolling_lifts_the_restriction_and_returns_backup_codes(self):
        self.sign_in()
        response = self.enrol()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['backup_codes']), mfa.BACKUP_CODE_COUNT)

        self.assertFalse(self.client.get('/api/auth/me/').data['mfa_setup_required'])
        after = self.client.get('/api/auth/accounts/')  # a student may still be denied by role,
        self.assertNotEqual(getattr(after.data.get('detail'), 'code', None), 'mfa_setup_required')  # but not by MFA

    def test_required_accounts_cannot_turn_mfa_off(self):
        self.sign_in()
        self.enrol()
        response = self.client.post('/api/auth/mfa/toggle/', {'enabled': False, 'password': PASSWORD}, format='json')
        self.assertEqual(response.status_code, 403)
        self.assertTrue(mfa.is_mfa_enabled_for_user(self.fresh_user()))

    def test_roles_not_listed_are_unaffected(self):
        with override_settings(MFA_REQUIRED_ROLES=['Admin']):
            tokens = self.login().data
        self.assertFalse(tokens['user']['mfa_setup_required'])


class ResetMfaCommandTests(AuthTestCase):
    def test_reset_clears_mfa_and_signs_the_account_out(self):
        mfa.enable_email_mfa(self.user)
        mfa.generate_backup_codes(self.fresh_user())

        out = io.StringIO()
        call_command('reset_mfa', 'TENDAI@example.com', stdout=out)

        user = self.fresh_user()
        self.assertFalse(mfa.is_mfa_enabled_for_user(user))
        self.assertEqual(mfa.backup_codes_remaining(user), 0)
        self.assertIn('reset', out.getvalue())
        self.assertEqual(self.login().status_code, 200)  # plain password sign-in again
