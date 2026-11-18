"""Short-lived cache of class and level rankings.

Rankings are worked out from every mark in a class or year group, and many parents and students ask for them at once
on results day. The result only changes when a mark, an exam or a learner changes, so it is kept under a version
number that those changes bump. A five minute expiry is the safety net for any change that bypasses the signals.
"""
from django.core.cache import cache
from django.db import transaction
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

VERSION_KEY = 'exam-ranking-version'
TTL_SECONDS = 300


def current_version():
    return cache.get_or_set(VERSION_KEY, 1, None)


def bump_version():
    _bump()
    # Again once the surrounding transaction commits, so a request that cached old data mid-save cannot keep it.
    transaction.on_commit(_bump)


def _bump():
    try:
        cache.incr(VERSION_KEY)
    except ValueError:
        cache.set(VERSION_KEY, 2, None)


def cached_ranking(exam_id, class_ids, build):
    key = f"exam-ranking:{current_version()}:{exam_id}:{','.join(str(i) for i in sorted(set(class_ids)))}"
    value = cache.get(key)
    if value is None:
        value = build()
        cache.set(key, value, TTL_SECONDS)
    return value


@receiver([post_save, post_delete], sender='exams.ExamMark')
@receiver([post_save, post_delete], sender='exams.Exam')
@receiver([post_save, post_delete], sender='school.Student')
@receiver([post_save, post_delete], sender='school.SchoolClass')
def _bump_on_change(sender, **kwargs):
    bump_version()
