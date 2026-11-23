"""Class and year-group rankings for an exam, and the fixed copy taken when results are published."""
import re
from collections import defaultdict
from decimal import Decimal, ROUND_HALF_UP

from django.db import transaction

from school.models import SchoolClass, Student
from .models import ExamMark, PublishedRanking


# Names such as "3B1" and "3B2" are two classes of the same level, "3B": form 3, stream B, class 1 or 2.
_STREAM_CLASS = re.compile(r'^\s*(\d+)\s*([A-Za-z]+)\s*\d+\s*$')


def get_level_name(class_name):
    stream = _STREAM_CLASS.match(class_name)
    if stream:
        return f'{stream.group(1)}{stream.group(2).upper()}'
    match = re.match(r'^\s*(.+?\d+)', class_name)
    return match.group(1).strip() if match else None


def get_symbol(pct):
    if pct >= 70:
        return 'A'
    if pct >= 60:
        return 'B'
    if pct >= 50:
        return 'C'
    if pct >= 45:
        return 'D'
    if pct >= 40:
        return 'E'
    return 'U'


def build_ranking(exam, class_ids):
    """Each ranked learner's sort key, and the number of active learners, across the given classes."""
    active_students = Student.objects.filter(status='Active', school_class_id__in=class_ids)
    totals = defaultdict(lambda: [Decimal('0'), 0, Decimal('0'), defaultdict(int)])
    marks = ExamMark.objects.filter(
        exam=exam,
        absent=False,
        student__status='Active',
        student__school_class_id__in=class_ids,
    ).values('student_id', 'scored', 'total_marks')
    for mark in marks:
        total_marks = mark['total_marks']
        percentage = (
            Decimal(mark['scored']) * Decimal(100) / Decimal(total_marks)
            if total_marks > 0
            else Decimal(0)
        )
        totals[mark['student_id']][0] += percentage
        totals[mark['student_id']][1] += 1
        totals[mark['student_id']][2] += Decimal(mark['scored'])
        totals[mark['student_id']][3][get_symbol(percentage)] += 1

    # Learners are compared on: average percentage, then the number of A, B, C, D and E symbols, then total marks scored.
    candidate_keys = {}
    for candidate_id, (total_pct, count, total_scored, symbols) in totals.items():
        if count:
            avg = (total_pct / count).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
            candidate_keys[candidate_id] = (
                avg, symbols['A'], symbols['B'], symbols['C'], symbols['D'], symbols['E'], total_scored,
            )
    return candidate_keys, active_students.count()


def position_of(candidate_keys, student_id):
    """1-based position, or None when the learner has no counted marks."""
    target_key = candidate_keys.get(student_id)
    if target_key is None:
        return None
    return 1 + sum(key > target_key for key in candidate_keys.values())


def level_for(school_class, all_classes=None, exam_class_ids=None):
    """The level name (for example "Form 3" or "3B") and the ids of every class in it.

    When the exam's own classes are known, only those count, so a class that is not sitting this
    exam never changes the learners' positions. A level with a single class ranks that class alone.
    """
    level_name = get_level_name(school_class.name)
    classes = all_classes if all_classes is not None else SchoolClass.objects.only('id', 'name')
    restrict = bool(exam_class_ids) and school_class.id in exam_class_ids
    level_class_ids = [
        other.id for other in classes
        if level_name and get_level_name(other.name) == level_name and (not restrict or other.id in exam_class_ids)
    ]
    return level_name, level_class_ids or [school_class.id]


def class_names(class_ids):
    """Sorted names of the given classes, for the "Position in 3B1 & 3B2" label on the report card."""
    return list(SchoolClass.objects.filter(pk__in=class_ids).order_by('name').values_list('name', flat=True))


@transaction.atomic
def freeze_rankings(exam):
    """Store every active learner's positions as they stand now, replacing any earlier copy. Returns how many were stored."""
    PublishedRanking.objects.filter(exam=exam).delete()
    all_classes = list(SchoolClass.objects.only('id', 'name'))
    exam_class_ids = set(exam.classes.values_list('id', flat=True))
    built = {}

    def ranking(class_ids):
        key = tuple(sorted(class_ids))
        if key not in built:
            built[key] = build_ranking(exam, list(key))
        return built[key]

    rows = []
    for school_class in exam.classes.all():
        level_name, level_class_ids = level_for(school_class, all_classes, exam_class_ids)
        class_keys, class_total = ranking([school_class.id])
        level_keys, level_total = ranking(level_class_ids)
        for student in Student.objects.filter(status='Active', school_class=school_class):
            rows.append(PublishedRanking(
                exam=exam, student=student,
                class_position=position_of(class_keys, student.id), class_total=class_total,
                level_position=position_of(level_keys, student.id) if level_name else None,
                level_total=level_total if level_name else None,
                level_name=level_name or '',
            ))
    PublishedRanking.objects.bulk_create(rows)
    return len(rows)
