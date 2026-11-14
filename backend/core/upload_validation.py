"""
Upload validation shared by every file field.

The browser-supplied Content-Type is attacker controlled, so it is never trusted.
A file is accepted only when BOTH are true:
  1. its extension is on the allowlist for that field, and
  2. the first bytes of the file match what that extension claims to be.

This stops an HTML/SVG/script file being stored under a harmless-looking name
(for example "photo.png") and later being served from the site's own origin.
SVG is deliberately not allowed anywhere: it is an XML document that can carry
script.
"""
from pathlib import Path

from rest_framework import serializers

IMAGE_EXTENSIONS = frozenset({'.jpg', '.jpeg', '.png', '.gif', '.webp'})
VIDEO_EXTENSIONS = frozenset({'.mp4', '.m4v', '.mov', '.webm'})
DOCUMENT_EXTENSIONS = frozenset({'.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.csv', '.txt', '.zip'})
# Work handed in by students/teachers: documents, plus photos taken on a phone.
ATTACHMENT_EXTENSIONS = DOCUMENT_EXTENSIONS | IMAGE_EXTENSIONS | frozenset({'.heic'})
MATERIAL_EXTENSIONS = DOCUMENT_EXTENSIONS | IMAGE_EXTENSIONS | VIDEO_EXTENSIONS

_HEAD_BYTES = 1024

# extension -> kind of content it must really contain
_KIND_BY_EXTENSION = {
    '.jpg': 'jpeg', '.jpeg': 'jpeg', '.png': 'png', '.gif': 'gif', '.webp': 'webp',
    '.pdf': 'pdf',
    '.docx': 'zip', '.pptx': 'zip', '.xlsx': 'zip', '.epub': 'zip', '.zip': 'zip',
    '.doc': 'ole', '.ppt': 'ole', '.xls': 'ole',
    '.mp4': 'isobmff', '.m4v': 'isobmff', '.mov': 'isobmff', '.heic': 'isobmff',
    '.webm': 'webm',
    '.csv': 'text', '.txt': 'text',
}


def _matches(kind: str, head: bytes) -> bool:
    if kind == 'jpeg':
        return head.startswith(b'\xff\xd8\xff')
    if kind == 'png':
        return head.startswith(b'\x89PNG\r\n\x1a\n')
    if kind == 'gif':
        return head.startswith((b'GIF87a', b'GIF89a'))
    if kind == 'webp':
        return head[:4] == b'RIFF' and head[8:12] == b'WEBP'
    if kind == 'pdf':
        return b'%PDF-' in head  # the spec allows a few bytes of junk before the header
    if kind == 'zip':
        return head.startswith((b'PK\x03\x04', b'PK\x05\x06'))
    if kind == 'ole':
        return head.startswith(b'\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1')
    if kind == 'isobmff':
        return head[4:8] == b'ftyp'
    if kind == 'webm':
        return head.startswith(b'\x1a\x45\xdf\xa3')
    if kind == 'text':
        return b'\x00' not in head  # plain text never contains NUL bytes
    return False


def validate_upload(uploaded_file, allowed_extensions, label: str = 'file'):
    """Raise a DRF ValidationError unless the upload is an allowed, genuine file."""
    if uploaded_file is None:
        return uploaded_file

    extension = Path(uploaded_file.name).suffix.lower()
    if extension not in allowed_extensions:
        allowed = ', '.join(sorted(e.lstrip('.').upper() for e in allowed_extensions))
        raise serializers.ValidationError(f'This {label} type is not allowed. Allowed types: {allowed}.')

    uploaded_file.seek(0)
    head = uploaded_file.read(_HEAD_BYTES)
    uploaded_file.seek(0)
    if not _matches(_KIND_BY_EXTENSION[extension], head):
        raise serializers.ValidationError(
            f'The contents of this {label} do not match its "{extension}" extension. '
            'Re-save or re-export the file and try again.'
        )
    return uploaded_file
