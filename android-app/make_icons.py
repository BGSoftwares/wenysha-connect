"""Writes the college logo into the Android project's launcher icons.
Usage: python make_icons.py <logo.png> <android res folder>   (after `npx cap add android`)"""
import pathlib
import sys
from PIL import Image

LOGO = Image.open(sys.argv[1]).convert("RGBA")
RES = pathlib.Path(sys.argv[2])
# density: (legacy launcher px, adaptive layer px)
DENSITIES = {"mdpi": (48, 108), "hdpi": (72, 162), "xhdpi": (96, 216), "xxhdpi": (144, 324), "xxxhdpi": (192, 432)}


def draw(size, padding, background):
    canvas = Image.new("RGBA", (size, size), background)
    inner = int(size * (1 - 2 * padding))
    logo = LOGO.copy()
    logo.thumbnail((inner, inner))
    canvas.paste(logo, ((size - logo.width) // 2, (size - logo.height) // 2), logo)
    return canvas


for density, (legacy, adaptive) in DENSITIES.items():
    folder = RES / f"mipmap-{density}"
    if not folder.exists():
        continue
    draw(legacy, 0.08, (255, 255, 255, 255)).save(folder / "ic_launcher.png")
    draw(legacy, 0.08, (255, 255, 255, 255)).save(folder / "ic_launcher_round.png")
    # The adaptive icon's safe zone is the middle two thirds, so leave generous padding.
    draw(adaptive, 0.27, (0, 0, 0, 0)).save(folder / "ic_launcher_foreground.png")
print("Icons written")
