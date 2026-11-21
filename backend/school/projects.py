from decimal import Decimal

from rest_framework import permissions, serializers, viewsets

from core.roles import portal_role
from .models import Project, ProjectItem


class IsAdminOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and portal_role(request.user) == 'admin')


class ProjectItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectItem
        fields = ['id', 'project', 'kind', 'title', 'notes', 'due_date', 'cost', 'done']

    def validate_cost(self, value):
        if value < 0:
            raise serializers.ValidationError('Cost cannot be negative.')
        return value


class ProjectSerializer(serializers.ModelSerializer):
    lead_name = serializers.CharField(source='lead.name', read_only=True, default='')
    items = ProjectItemSerializer(many=True, read_only=True)
    spent = serializers.SerializerMethodField()
    progress = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = ['id', 'name', 'description', 'status', 'start_date', 'end_date', 'lead', 'lead_name',
                  'budget', 'currency', 'items', 'spent', 'progress', 'created_at']
        read_only_fields = ['created_at']

    def get_spent(self, obj):
        return str(sum((item.cost for item in obj.items.all()), Decimal('0')))

    def get_progress(self, obj):
        items = list(obj.items.all())
        activities = [item for item in items if item.kind == 'activity']
        return {'done': sum(1 for item in activities if item.done), 'total': len(activities)}

    def validate(self, attrs):
        start, end = attrs.get('start_date'), attrs.get('end_date')
        if start and end and end < start:
            raise serializers.ValidationError({'end_date': 'The end date cannot be before the start date.'})
        budget = attrs.get('budget')
        if budget is not None and budget < 0:
            raise serializers.ValidationError({'budget': 'The budget cannot be negative.'})
        return attrs


class ProjectViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminOnly]
    serializer_class = ProjectSerializer
    queryset = Project.objects.select_related('lead').prefetch_related('items')


class ProjectItemViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminOnly]
    serializer_class = ProjectItemSerializer
    queryset = ProjectItem.objects.all()

    def get_queryset(self):
        queryset = super().get_queryset()
        project = self.request.query_params.get('project')
        return queryset.filter(project_id=project) if project else queryset
