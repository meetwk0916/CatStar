#!/usr/bin/env python3
"""Build CatStar's six curated coat presets from one reviewed motion master."""

from __future__ import annotations

import colorsys
import json
from pathlib import Path

from PIL import Image, ImageDraw


CAT_DIR = Path("public/assets/scenes/window-room/cat")
ACTIVE_CANDIDATE_DIR = Path("artifacts/art/candidates/active")
QUALITY_SLICE_V10_DIR = Path(
    "artifacts/art/candidates/active/product-cat-quality-slice-v10/sprite-sheets-96"
)
QUALITY_SLICE_V12_DIR = Path(
    "artifacts/art/candidates/active/product-cat-quality-slice-v12/sprite-sheets-96"
)
QUIET_MOTION_V1_DIR = Path(
    "artifacts/art/candidates/active/product-cat-quiet-motion-v1/sprite-sheets-96"
)
DAILY_LIFE_V1_DIR = Path(
    "artifacts/art/candidates/active/product-cat-daily-life-v1/sprite-sheets-96"
)
PREVIEW_DIR = Path("artifacts/art/candidates/active/cat-coat-presets-v1")
ORANGE_SHAPE_PREVIEW_DIR = Path(
    "artifacts/art/candidates/active/product-cat-orange-tabby-preview-v2/sprite-sheets-96"
)
FRAME = 96

COAT_PRESETS = (
    "gray-white-tabby",
    "orange-tabby",
    "solid-black",
    "solid-white",
    "calico",
    "tuxedo",
)

MOTION_SOURCES = {
    "idle": QUIET_MOTION_V1_DIR / "idle.png",
    "sit": QUALITY_SLICE_V12_DIR / "sit.png",
    "walk": QUALITY_SLICE_V12_DIR / "walk.png",
    "jump": ACTIVE_CANDIDATE_DIR / "product-cat-jump-v6/sprite-sheets-96/jump.png",
    "sleep": QUIET_MOTION_V1_DIR / "sleep.png",
    "interact": QUALITY_SLICE_V12_DIR / "interact.png",
    "eat": DAILY_LIFE_V1_DIR / "eat.png",
    "lie": QUIET_MOTION_V1_DIR / "lie.png",
    "groom": DAILY_LIFE_V1_DIR / "groom.png",
    "stretch": DAILY_LIFE_V1_DIR / "stretch.png",
}
ORANGE_SHAPE_PREVIEW_ACTIONS = frozenset(MOTION_SOURCES)


def luminance(red: int, green: int, blue: int) -> float:
    return red * 0.299 + green * 0.587 + blue * 0.114


def is_gold(red: int, green: int, blue: int) -> bool:
    return red > 120 and green > 65 and blue < 90 and red > blue * 1.8


def is_pink(red: int, green: int, blue: int) -> bool:
    return red > 185 and red - green > 35 and red - blue > 18


def is_white_marking(red: int, green: int, blue: int) -> bool:
    return luminance(red, green, blue) > 214 and max(red, green, blue) - min(red, green, blue) < 38


def colorize(hue: float, saturation: float, lightness: float) -> tuple[int, int, int]:
    red, green, blue = colorsys.hls_to_rgb(hue, lightness, saturation)
    return round(red * 255), round(green * 255), round(blue * 255)


def charcoal(value: float, *, darkest: int = 24, lightest: int = 102) -> tuple[int, int, int]:
    tone = round(darkest + (value / 255) * (lightest - darkest))
    return tone, max(0, tone - 2), max(0, tone - 1)


def warm_white(value: float) -> tuple[int, int, int]:
    if value < 52:
        tone = round(38 + value * 0.35)
        return tone, tone, min(255, tone + 2)
    tone = round(206 + (value / 255) * 47)
    return tone, max(0, tone - 3), max(0, tone - 2)


def interpolate_palette(
    value: float,
    stops: tuple[tuple[int, tuple[int, int, int]], ...],
) -> tuple[int, int, int]:
    for index, (upper_value, upper_color) in enumerate(stops):
        if value > upper_value:
            continue
        if index == 0:
            return upper_color
        lower_value, lower_color = stops[index - 1]
        progress = (value - lower_value) / (upper_value - lower_value)
        return tuple(
            round(lower + (upper - lower) * progress)
            for lower, upper in zip(lower_color, upper_color, strict=True)
        )
    return stops[-1][1]


def orange_tabby(value: float) -> tuple[int, int, int]:
    """Map the motion master's values to the approved big-ginger palette.

    This remains an internal preview treatment: it preserves pose geometry while
    replacing the gray-white source's cool/pink cast and high-contrast stripes.
    """
    return interpolate_palette(
        value,
        (
            (0, (28, 19, 21)),
            (42, (75, 48, 43)),
            (92, (178, 91, 21)),
            (142, (202, 111, 25)),
            (192, (225, 140, 35)),
            (232, (245, 178, 65)),
            (255, (250, 202, 105)),
        ),
    )


def calico_orange(value: float) -> tuple[int, int, int]:
    lightness = 0.14 + (value / 255) * 0.58
    saturation = 0.52 if value > 95 else 0.4
    return colorize(0.075, saturation, lightness)


def cream_muzzle(value: float) -> tuple[int, int, int]:
    return interpolate_palette(
        value,
        (
            (214, (207, 157, 96)),
            (238, (239, 203, 145)),
            (255, (247, 220, 174)),
        ),
    )


ORANGE_MUZZLE_REGIONS = {
    "idle": (0.82, 0.18, 0.5),
    "sit": (0.75, 0.1, 0.36),
    "walk": (0.82, 0.18, 0.55),
    "jump": (0.74, 0.12, 0.57),
    "eat": (0.75, 0.28, 0.65),
    "lie": (0.74, 0.2, 0.6),
    "sleep": (0.75, 0.18, 0.58),
    "groom": (0.7, 0.08, 0.4),
    "stretch": (0.78, 0.18, 0.6),
    "interact": (0.78, 0.16, 0.56),
}


def is_orange_muzzle(
    action: str,
    frame_x: int,
    y: int,
    frame_bounds: tuple[int, int, int, int],
) -> bool:
    left, top, right, bottom = frame_bounds
    width = max(1, right - left)
    height = max(1, bottom - top)
    normalized_x = (frame_x - left) / width
    normalized_y = (y - top) / height
    min_x, min_y, max_y = ORANGE_MUZZLE_REGIONS[action]
    return normalized_x >= min_x and min_y <= normalized_y <= max_y


def is_orange_calico_patch(frame_x: int, y: int) -> bool:
    normalized_x = frame_x / FRAME
    normalized_y = y / FRAME
    patches = (
        ((normalized_x - 0.36) / 0.24) ** 2 + ((normalized_y - 0.35) / 0.2) ** 2 < 1,
        ((normalized_x - 0.68) / 0.28) ** 2 + ((normalized_y - 0.63) / 0.24) ** 2 < 1,
        ((normalized_x - 0.2) / 0.2) ** 2 + ((normalized_y - 0.74) / 0.19) ** 2 < 1,
    )
    return any(patches)


def transform_pixel(
    coat: str,
    action: str,
    frame_x: int,
    y: int,
    frame_bounds: tuple[int, int, int, int],
    pixel: tuple[int, int, int, int],
) -> tuple[int, int, int, int]:
    red, green, blue, alpha = pixel
    if alpha == 0:
        return pixel

    if coat == "orange-tabby":
        if is_gold(red, green, blue):
            return pixel
        value = luminance(red, green, blue)
        if is_white_marking(red, green, blue) and is_orange_muzzle(
            action, frame_x, y, frame_bounds
        ):
            return (*cream_muzzle(value), alpha)
        return (*orange_tabby(value), alpha)

    if is_gold(red, green, blue) or is_pink(red, green, blue):
        return pixel

    value = luminance(red, green, blue)
    white_marking = is_white_marking(red, green, blue)

    if coat == "gray-white-tabby":
        return pixel
    if coat == "tuxedo":
        if white_marking:
            return pixel
        return (*charcoal(value, darkest=18, lightest=88), alpha)
    if coat == "solid-black":
        return (*charcoal(value, darkest=18, lightest=96), alpha)
    if coat == "solid-white":
        return (*warm_white(value), alpha)
    if coat == "calico":
        if white_marking:
            return pixel
        target = calico_orange(value) if is_orange_calico_patch(frame_x, y) else charcoal(value)
        return (*target, alpha)
    raise ValueError(f"Unknown coat preset: {coat}")


def recolor_sheet(source: Image.Image, coat: str, action: str) -> Image.Image:
    image = source.convert("RGBA")
    output = Image.new("RGBA", image.size, (0, 0, 0, 0))
    source_pixels = image.load()
    output_pixels = output.load()

    frame_bounds = []
    for frame_index in range(image.width // FRAME):
        alpha = image.crop((frame_index * FRAME, 0, (frame_index + 1) * FRAME, FRAME)).getchannel("A")
        bounds = alpha.getbbox()
        if bounds is None:
            raise ValueError(f"{action}: frame {frame_index} is empty")
        frame_bounds.append(bounds)

    for y in range(image.height):
        for x in range(image.width):
            frame_index = x // FRAME
            output_pixels[x, y] = transform_pixel(
                coat,
                action,
                x % FRAME,
                y,
                frame_bounds[frame_index],
                source_pixels[x, y],
            )
    return output


def load_motion_source(action: str) -> Image.Image:
    source_path = MOTION_SOURCES[action]
    return Image.open(source_path).convert("RGBA")


def make_preview(spec: dict[str, object]) -> None:
    actions = ("idle", "sit", "walk", "interact", "groom", "stretch")
    label_width = 118
    header_height = 24
    row_height = FRAME + 18
    preview = Image.new(
        "RGBA",
        (label_width + FRAME * len(actions), header_height + row_height * len(COAT_PRESETS)),
        (24, 24, 24, 255),
    )
    draw = ImageDraw.Draw(preview)

    for action_index, action in enumerate(actions):
        draw.text(
            (label_width + action_index * FRAME + 8, 7),
            action,
            fill=(235, 235, 235, 255),
        )

    for coat_index, coat in enumerate(COAT_PRESETS):
        row_y = header_height + coat_index * row_height
        draw.text((8, row_y + 38), coat, fill=(235, 235, 235, 255))
        for action_index, action in enumerate(actions):
            sheet = Image.open(CAT_DIR / coat / str(spec["actions"][action]["file"])).convert("RGBA")
            frame = sheet.crop((0, 0, FRAME, FRAME))
            preview.alpha_composite(frame, (label_width + action_index * FRAME, row_y))

    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
    preview.save(PREVIEW_DIR / "coat-presets-preview.png")


def main() -> None:
    spec = json.loads((CAT_DIR / "cat.animations.json").read_text())
    for action, config in spec["actions"].items():
        source_path = MOTION_SOURCES[action]
        expected_size = (FRAME * int(config["frames"]), FRAME)
        source = load_motion_source(action)
        if source.size != expected_size:
            raise ValueError(f"{action}: expected {expected_size}, got {source.size} from {source_path}")

        for coat in COAT_PRESETS:
            destination_dir = CAT_DIR / coat
            destination_dir.mkdir(parents=True, exist_ok=True)
            if coat == "orange-tabby" and action in ORANGE_SHAPE_PREVIEW_ACTIONS:
                preview_sheet = Image.open(ORANGE_SHAPE_PREVIEW_DIR / str(config["file"]))
                preview_sheet.convert("RGBA").save(destination_dir / str(config["file"]))
            else:
                recolor_sheet(source, coat, action).save(destination_dir / str(config["file"]))

    make_preview(spec)
    print(f"Built {len(COAT_PRESETS)} coat presets with {len(MOTION_SOURCES)} actions each")


if __name__ == "__main__":
    main()
