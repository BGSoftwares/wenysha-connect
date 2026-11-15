"""
Backups made from inside the portal.

Admins: a ZIP archive of school records (JSON, one file per table) saved on the server, listed,
downloadable and deletable. Passwords, password hashes, tokens, authenticator secrets and
per-user preferences are never written. Accounts are saved without passwords, so this is a
records backup: full disaster recovery is the database backup made by the `backup` service.

Teachers: a ZIP of CSV files holding only their own classes' students, marks and attendance.
"""
import csv
import io
import json
import logging
import re
import zipfile
from datetime import datetime, timezone as dt_timezone
from functools import reduce
from operator import or_
from pathlib import Path

from django.apps import apps
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core import serializers
from django.core.serializers.json import DjangoJSONEncoder
from django.db.models import Q
from django.http import FileResponse, HttpResponse
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .permissions import IsPortalAdmin
from .roles import portal_role, teacher_class_ids

logger = logging.getLogger(__name__)

# Apps whose tables hold school records.
RECORD_APPS = (
    'school', 'exams', 'attendance', 'notices', 'finance', 'library',
    'hostel', 'transport', 'parents', 'content', 'admissions', 'core',
)
# Never written to a backup, whatever the model.
SECRET_FIELD = re.compile(r'password|secret|token|hash|otp|backup_code|preferences', re.I)
USER_FIELDS = ('id', 'username', 'email', 'first_name', 'last_name', 'is_active', 'is_staff',
               'is_superuser', 'date_joined', 'last_login')

# The user part never contains '-', so the optional '-files' marker is unambiguous.
NAME_RE = re.compile(r'^backup-(\d{8})-(\d{6})-([A-Za-z0-9_.]{1,40})(-files)?\.zip$')
MIN_SECONDS_BETWEEN_BACKUPS = 30


# --------------------------------------------------------------------------- admin archive

def _root() -> Path:
    root = Path(settings.BACKUP_ROOT)
    root.mkdir(parents=True, exist_ok=True)
    return root


def _safe_fields(model):
    fields = list(model._meta.concrete_fields) + list(model._meta.many_to_many)
    return [f.name for f in fields if not SECRET_FIELD.search(f.name)]


def _describe(path: Path) -> dict:
    match = NAME_RE.match(path.name)
    created = datetime.strptime(match.group(1) + match.group(2), '%Y%m%d%H%M%S').replace(tzinfo=dt_timezone.utc)
    return {
        'name': path.name,
        'size': path.stat().st_size,
        'created_at': created.isoformat(),
        'created_by': match.group(3),
        'includes_files': bool(match.group(4)),
    }


def list_backups() -> list:
    items = [_describe(p) for p in _root().iterdir() if p.is_file() and NAME_RE.match(p.name)]
    return sorted(items, key=lambda item: item['created_at'], reverse=True)


def _resolve(name: str):
    """Return the archive path for a name, or None. Only names we generated are accepted."""
    if not NAME_RE.match(name or ''):
        return None
    path = (_root() / name).resolve()
    return path if path.parent == _root().resolve() and path.is_file() else None


def _prune():
    for item in list_backups()[settings.BACKUP_MAX_FILES:]:
        try:
            (_root() / item['name']).unlink()
        except OSError:
            logger.warning('Could not remove old backup %s', item['name'])


def create_backup(user, include_files: bool = False) -> dict:
    now = timezone.now().astimezone(dt_timezone.utc)
    slug = re.sub(r'[^A-Za-z0-9_.]', '_', user.get_username())[:40] or 'admin'
    name = f"backup-{now:%Y%m%d-%H%M%S}-{slug}{'-files' if include_files else ''}.zip"
    final = _root() / name
    partial = _root() / f'.{name}.part'
    counts = {}
    try:
        with zipfile.ZipFile(partial, 'w', zipfile.ZIP_DEFLATED) as archive:
            for label in RECORD_APPS:
                for model in apps.get_app_config(label).get_models():
                    fields = _safe_fields(model)
                    queryset = model._default_manager.all().order_by('pk')
                    counts[model._meta.label_lower] = queryset.count()
                    archive.writestr(
                        f'data/{model._meta.label_lower}.json',
                        serializers.serialize('json', queryset, fields=fields),
                    )
            users = list(get_user_model().objects.order_by('pk').values(*USER_FIELDS))
            counts['auth.user'] = len(users)
            archive.writestr('data/auth.user.json', json.dumps(users, cls=DjangoJSONEncoder))

            file_count = 0
            if include_files:
                media = Path(settings.MEDIA_ROOT)
                for path in sorted(media.rglob('*')) if media.is_dir() else []:
                    if path.is_file() and not path.is_symlink():
                        archive.write(path, f'files/{path.relative_to(media).as_posix()}')
                        file_count += 1

            archive.writestr('manifest.json', json.dumps({
                'created_at': now.isoformat(),
                'created_by': user.get_username(),
                'includes_files': include_files,
                'file_count': file_count,
                'record_counts': counts,
                'not_included': [
                    'passwords and password hashes', 'sign-in tokens', 'authenticator-app secrets and backup codes',
                    'per-user preferences',
                ],
            }, indent=2))
        partial.replace(final)
    finally:
        partial.unlink(missing_ok=True)
    _prune()
    logger.info('Backup %s created by %s (files=%s)', name, user.get_username(), include_files)
    return _describe(final)


class BackupListCreateView(APIView):
    permission_classes = [IsPortalAdmin]

    def get(self, request):
        return Response({'results': list_backups(), 'keep': settings.BACKUP_MAX_FILES})

    def post(self, request):
        latest = (list_backups() or [None])[0]
        if latest:
            age = (timezone.now() - datetime.fromisoformat(latest['created_at'])).total_seconds()
            if age < MIN_SECONDS_BETWEEN_BACKUPS:
                return Response({'detail': 'A backup was only just made. Wait a moment before making another.'},
                                status=status.HTTP_429_TOO_MANY_REQUESTS)
        include_files = str(request.data.get('include_files', '')).lower() in ('1', 'true', 'yes')
        return Response(create_backup(request.user, include_files), status=status.HTTP_201_CREATED)


class BackupDetailView(APIView):
    permission_classes = [IsPortalAdmin]

    def get(self, request, name):
        path = _resolve(name)
        if path is None:
            return Response({'detail': 'Backup not found.'}, status=status.HTTP_404_NOT_FOUND)
        logger.info('Backup %s downloaded by %s', name, request.user.get_username())
        return FileResponse(path.open('rb'), as_attachment=True, filename=name, content_type='application/zip')

    def delete(self, request, name):
        path = _resolve(name)
        if path is None:
            return Response({'detail': 'Backup not found.'}, status=status.HTTP_404_NOT_FOUND)
        path.unlink()
        logger.info('Backup %s deleted by %s', name, request.user.get_username())
        return Response(status=status.HTTP_204_NO_CONTENT)


# --------------------------------------------------------------------------- teacher export

def _cell(value):
    """Stop spreadsheet programs running typed-in text as a formula."""
    text = '' if value is None else str(value)
    return "'" + text if text[:1] in ('=', '+', '-', '@', '\t', '\r') else text


def _csv(header, rows) -> str:
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(header)
    for row in rows:
        writer.writerow([_cell(v) for v in row])
    return buffer.getvalue()


def build_teacher_export(user):
    """Return (zip_bytes, filename) or None when the account has no teacher record."""
    from attendance.models import AttendanceRecord
    from exams.models import ExamMark
    from school.models import SchoolClass, Student, Teacher

    teacher = Teacher.objects.filter(user=user).first()
    if teacher is None:
        return None

    class_ids = teacher_class_ids(user)
    own_class_ids = set(SchoolClass.objects.filter(class_teacher=teacher).values_list('id', flat=True))
    allocations = list(teacher.allocations.select_related('subject', 'school_class'))

    students = Student.objects.filter(school_class_id__in=class_ids).select_related('school_class').order_by('school_class__name', 'name')
    mark_filters = [Q(student__school_class_id__in=own_class_ids)] if own_class_ids else []
    mark_filters += [Q(student__school_class_id=a.school_class_id, subject_id=a.subject_id) for a in allocations]
    marks = (
        ExamMark.objects.filter(reduce(or_, mark_filters)) if mark_filters else ExamMark.objects.none()
    ).select_related('exam', 'student__school_class', 'subject').order_by('exam__start_date', 'student__name', 'subject__name')
    attendance = AttendanceRecord.objects.filter(student__school_class_id__in=class_ids).select_related(
        'student__school_class').order_by('-date', 'student__name', 'session')

    now = timezone.localtime()
    files = {
        'students.csv': _csv(
            ['Student ID', 'Name', 'Class', 'Gender', 'Status'],
            [(s.student_id, s.name, s.school_class.name, s.gender, s.status) for s in students]),
        'my_classes_and_subjects.csv': _csv(
            ['Class', 'Subject', 'Periods per week', 'Room'],
            [(a.school_class.name, a.subject.name, a.periods, a.room) for a in allocations]),
        'marks.csv': _csv(
            ['Exam', 'Term', 'Year', 'Student ID', 'Student', 'Class', 'Subject', 'Scored', 'Out of', 'Percent', 'Comment'],
            [(m.exam.name, m.exam.term, m.exam.year, m.student.student_id, m.student.name, m.student.school_class.name,
              m.subject.name, m.scored, m.total_marks,
              round(m.scored * 100 / m.total_marks, 1) if m.total_marks else '', m.comment) for m in marks]),
        'attendance.csv': _csv(
            ['Date', 'Session', 'Student ID', 'Student', 'Class', 'Status', 'Minutes late', 'Excuse'],
            [(r.date, r.session, r.student.student_id, r.student.name, r.student.school_class.name, r.status,
              r.late_minutes, r.excuse_reason) for r in attendance]),
        'README.txt': (
            f'Backup of {teacher.name}\'s teaching records, made {now:%d %b %Y %H:%M}.\n\n'
            'It holds only the classes and subjects assigned to you: students (name, class, gender, status), '
            'marks you can enter, attendance for your classes, and your allocations.\n'
            'Contact details, addresses, dates of birth and fees are not included.\n'
            'Keep this file somewhere private: it contains learners\' names and results.\n'
        ),
    }
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED) as archive:
        for filename, content in files.items():
            archive.writestr(filename, content)
    logger.info('Teacher data backup downloaded by %s', user.get_username())
    return buffer.getvalue(), f'my-teaching-data-{now:%Y%m%d}.zip'


class TeacherBackupView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if portal_role(request.user) != 'teacher':
            return Response({'detail': 'Only teachers can download this backup.'}, status=status.HTTP_403_FORBIDDEN)
        result = build_teacher_export(request.user)
        if result is None:
            return Response({'detail': 'No teacher record is linked to this account. Ask an administrator.'},
                            status=status.HTTP_400_BAD_REQUEST)
        content, filename = result
        response = HttpResponse(content, content_type='application/zip')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        response['Cache-Control'] = 'no-store'
        return response
