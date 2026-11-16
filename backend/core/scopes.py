"""Which records each portal role may see in aggregate views (dashboards, exports)."""
from functools import reduce
from operator import or_

from django.db.models import Q


def teacher_marks_filter(teacher):
    """Marks a teacher may see: every subject in classes they run, plus their own subject/class allocations.

    Returns None when the teacher has no classes or allocations (so callers return nothing).
    """
    from school.models import SchoolClass

    own_class_ids = set(SchoolClass.objects.filter(class_teacher=teacher).values_list('id', flat=True))
    filters = [Q(student__school_class_id__in=own_class_ids)] if own_class_ids else []
    filters += [
        Q(student__school_class_id=a.school_class_id, subject_id=a.subject_id)
        for a in teacher.allocations.all()
    ]
    return reduce(or_, filters) if filters else None
