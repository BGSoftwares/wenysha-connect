"""Class and year-group rankings for an exam, and the fixed copy taken when results are published."""
import re
from collections import defaultdict
from decimal import Decimal, ROUND_HALF_UP

from django.db import transaction

from school.models import SchoolClass, Student
from .models import ExamMark, PublishedRanking


def get_level_name(class_name):
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


def level_for(school_class, all_classes=None):
    """The year group name (for example "Form 3") and the ids of every class in it."""
    level_name = get_level_name(school_class.name)
    classes = all_classes if all_classes is not None else SchoolClass.objects.only('id', 'name')
    level_class_ids = [
        other.id for other in classes if level_name and get_level_name(other.name) == level_name
    ]
    return level_name, level_class_ids or [school_class.id]


@transaction.atomic
def freeze_rankings(exam):
    """Store every active learner's positions as they stand now, replacing any earlier copy. Returns how many were stored."""
    PublishedRanking.objects.filter(exam=exam).delete()
    all_classes = list(SchoolClass.objects.only('id', 'name'))
    built = {}

    def ranking(class_ids):
        key = tuple(sorted(class_ids))
        if key not in built:
            built[key] = build_ranking(exam, list(key))
        return built[key]

    rows = []
    for school_class in exam.classes.all():
        level_name, level_class_ids = level_for(school_class, all_classes)
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
