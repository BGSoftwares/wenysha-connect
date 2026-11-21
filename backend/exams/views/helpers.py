from collections import defaultdict
from parents.models import StudentParent
from school.models import TeacherSubjectClass


def expected_subject_ids_by_class(exam, class_ids):
    exam_subject_ids = set(exam.subjects.values_list('pk', flat=True))
    allocations_by_class = defaultdict(set)
    for class_id, subject_id in TeacherSubjectClass.objects.filter(
        school_class_id__in=class_ids,
        subject_id__in=exam_subject_ids,
    ).values_list('school_class_id', 'subject_id'):
        allocations_by_class[class_id].add(subject_id)
    return {
        class_id: allocations_by_class[class_id] or exam_subject_ids
        for class_id in class_ids
    }


def linked_student_ids(user):
    """IDs of the children linked to this parent or guardian account."""
    return StudentParent.objects.filter(parent__user=user).values_list('student_id', flat=True)
