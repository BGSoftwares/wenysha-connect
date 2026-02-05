from rest_framework import serializers
from school.serializers import StudentSerializer
from .models import Parent, StudentParent


class ParentSerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()

    class Meta:
        model = Parent
        fields = ['id', 'name', 'phone', 'email', 'address', 'status', 'children']

    def get_children(self, obj):
        links = StudentParent.objects.filter(parent=obj).select_related('student', 'student__school_class')
        return [
            f"{link.student.name} ({link.student.school_class.name})"
            for link in links
        ]


class StudentParentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    parent_name = serializers.CharField(source='parent.name', read_only=True)

    class Meta:
        model = StudentParent
        fields = ['id', 'student', 'student_name', 'parent', 'parent_name']
