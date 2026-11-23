"""Upload, view and remove the signed-in teacher's or principal's signature image."""
from rest_framework import permissions, status
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import UserSignature
from .roles import is_admin, portal_role
from .upload_validation import validate_upload

SIGNATURE_EXTENSIONS = frozenset({'.png', '.jpg', '.jpeg', '.webp'})
MAX_SIGNATURE_BYTES = 1024 * 1024  # a scanned signature is tens of kilobytes; 1 MB is generous


def can_sign(user):
    return is_admin(user) or portal_role(user) == 'teacher'


def _payload(signature):
    return {'url': signature.image.url if signature and signature.image else None}


class SignatureView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def _check_role(self, request):
        if not can_sign(request.user):
            return Response({'detail': 'Only teachers and the principal have a signature.'}, status=status.HTTP_403_FORBIDDEN)
        return None

    def get(self, request):
        denied = self._check_role(request)
        if denied:
            return denied
        return Response(_payload(UserSignature.objects.filter(user=request.user).first()))

    def post(self, request):
        denied = self._check_role(request)
        if denied:
            return denied
        image = request.FILES.get('image')
        if image is None:
            return Response({'image': 'Choose a signature image to upload.'}, status=status.HTTP_400_BAD_REQUEST)
        if image.size > MAX_SIGNATURE_BYTES:
            return Response({'image': 'The signature image must be smaller than 1 MB.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            validate_upload(image, SIGNATURE_EXTENSIONS, 'signature')
        except ValidationError as error:
            detail = error.detail
            message = detail[0] if isinstance(detail, list) and detail else detail
            return Response({'image': str(message)}, status=status.HTTP_400_BAD_REQUEST)

        signature = UserSignature.objects.filter(user=request.user).first()
        if signature:
            signature.image.delete(save=False)  # drop the old file before storing the new one
            signature.image = image
            signature.save()
        else:
            signature = UserSignature.objects.create(user=request.user, image=image)
        return Response(_payload(signature), status=status.HTTP_200_OK)

    def delete(self, request):
        denied = self._check_role(request)
        if denied:
            return denied
        signature = UserSignature.objects.filter(user=request.user).first()
        if signature:
            signature.image.delete(save=False)
            signature.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
