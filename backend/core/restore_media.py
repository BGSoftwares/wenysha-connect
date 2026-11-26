"""Safely replace the shared media volume from a compressed tar archive on stdin."""
from __future__ import annotations

import shutil
import sys
import tarfile
import tempfile
import uuid
from pathlib import Path, PurePosixPath


MEDIA_ROOT = Path('/app/media')


def _remove(path: Path) -> None:
    if path.is_dir() and not path.is_symlink():
        shutil.rmtree(path)
    else:
        path.unlink(missing_ok=True)


def _safe_members(archive: tarfile.TarFile) -> list[tuple[tarfile.TarInfo, PurePosixPath]]:
    validated = []
    seen = set()
    for member in archive.getmembers():
        if member.name.startswith('/'):
            raise ValueError(f'Absolute archive path is not allowed: {member.name}')
        relative = PurePosixPath(member.name)
        if '..' in relative.parts:
            raise ValueError(f'Parent traversal is not allowed: {member.name}')
        parts = tuple(part for part in relative.parts if part not in ('', '.'))
        if not parts:
            continue
        if parts[0].startswith('.restore-stage-') or parts[0].startswith('.restore-old-'):
            raise ValueError(f'Reserved restore path is not allowed: {member.name}')
        relative = PurePosixPath(*parts)
        if relative in seen:
            raise ValueError(f'Duplicate archive path is not allowed: {member.name}')
        seen.add(relative)
        if not (member.isdir() or member.isfile()):
            raise ValueError(f'Only regular files and directories are allowed: {member.name}')
        validated.append((member, relative))
    return validated


def _extract(archive: tarfile.TarFile, members: list[tuple[tarfile.TarInfo, PurePosixPath]], stage: Path) -> None:
    for member, relative in members:
        destination = stage.joinpath(*relative.parts)
        if member.isdir():
            destination.mkdir(parents=True, exist_ok=True)
            destination.chmod(0o755)
            continue

        destination.parent.mkdir(parents=True, exist_ok=True)
        source = archive.extractfile(member)
        if source is None:
            raise ValueError(f'Could not read archive file: {member.name}')
        with source, destination.open('wb') as output:
            shutil.copyfileobj(source, output)
        destination.chmod(0o644)


def _replace_media(stage: Path, previous: Path) -> None:
    MEDIA_ROOT.mkdir(parents=True, exist_ok=True)
    previous.mkdir(mode=0o700)
    moved_old = []
    moved_new = []
    try:
        for child in list(MEDIA_ROOT.iterdir()):
            if child not in (stage, previous):
                child.replace(previous / child.name)
                moved_old.append(child.name)
        for child in list(stage.iterdir()):
            child.replace(MEDIA_ROOT / child.name)
            moved_new.append(child.name)
    except Exception:
        # The old tree remains available until all staged files have been moved.
        for name in moved_new:
            _remove(MEDIA_ROOT / name)
        for name in moved_old:
            (previous / name).replace(MEDIA_ROOT / name)
        raise


def main() -> int:
    if not MEDIA_ROOT.is_dir():
        print(f'Media volume is not mounted at {MEDIA_ROOT}', file=sys.stderr)
        return 1

    token = uuid.uuid4().hex
    stage = MEDIA_ROOT / f'.restore-stage-{token}'
    previous = MEDIA_ROOT / f'.restore-old-{token}'
    stage.mkdir(mode=0o700)

    try:
        with tempfile.NamedTemporaryFile(prefix='media-restore-', suffix='.tar.gz') as compressed:
            shutil.copyfileobj(sys.stdin.buffer, compressed)
            compressed.flush()
            with tarfile.open(compressed.name, mode='r:gz') as archive:
                members = _safe_members(archive)
                _extract(archive, members, stage)

        _replace_media(stage, previous)
        shutil.rmtree(previous)
        shutil.rmtree(stage)
        print(f'Restored {len(members)} media entries into {MEDIA_ROOT}.')
        return 0
    except Exception as error:
        if stage.exists():
            shutil.rmtree(stage, ignore_errors=True)
        print(f'Media restore failed: {error}', file=sys.stderr)
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
