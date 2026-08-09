#!/usr/bin/env python3
"""Normalize production-model-derived daily-life action sources into 96px sheets."""

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from pathlib import Path
from statistics import median

from PIL import Image, ImageChops, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "artifacts/art/candidates/active/product-cat-daily-life-v1"
SOURCE_DIR = OUT_DIR / "sources"
ALPHA_DIR = OUT_DIR / "alpha"
NORMALIZED_DIR = OUT_DIR / "normalized-96"
SHEET_DIR = OUT_DIR / "sprite-sheets-96"
MODEL_SOURCE = ROOT / (
    "artifacts/art/candidates/active/product-cat-model-sheet-v1/"
    "sources/model-sheet-chromakey.png"
)
FRAME = 96
KEY_DOMINANCE_THRESHOLD = 16.0
ALPHA_NOISE_FLOOR = 8
TRANSPARENT_THRESHOLD = 12.0
OPAQUE_THRESHOLD = 220.0


@dataclass(frozen=True)
class ActionSpec:
    columns: int
    rows: int
    frames: int
    max_width: int
    max_height: int


ACTION_SPECS = {
    "eat": ActionSpec(columns=3, rows=2, frames=6, max_width=84, max_height=84),
    "groom": ActionSpec(columns=4, rows=2, frames=8, max_width=82, max_height=84),
    "stretch": ActionSpec(columns=3, rows=2, frames=6, max_width=96, max_height=74),
}


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def sample_border_key(image: Image.Image) -> tuple[int, int, int]:
    width, height = image.size
    pixels = image.load()
    samples: list[tuple[int, int, int]] = []
    band = max(1, min(width, height, 6))
    step = max(1, min(width, height) // 256)
    for x in range(0, width, step):
        for y in range(band):
            samples.append(pixels[x, y][:3])
            samples.append(pixels[x, height - 1 - y][:3])
    for y in range(0, height, step):
        for x in range(band):
            samples.append(pixels[x, y][:3])
            samples.append(pixels[width - 1 - x, y][:3])
    return tuple(int(round(median(sample[channel] for sample in samples))) for channel in range(3))


def channel_distance(first: tuple[int, int, int], second: tuple[int, int, int]) -> int:
    return max(abs(first[index] - second[index]) for index in range(3))


def smoothstep(value: float) -> float:
    value = max(0.0, min(1.0, value))
    return value * value * (3.0 - 2.0 * value)


def soft_alpha(distance: int) -> int:
    if distance <= TRANSPARENT_THRESHOLD:
        return 0
    if distance >= OPAQUE_THRESHOLD:
        return 255
    ratio = (distance - TRANSPARENT_THRESHOLD) / (OPAQUE_THRESHOLD - TRANSPARENT_THRESHOLD)
    return round(255.0 * smoothstep(ratio))


def spill_channels(key: tuple[int, int, int]) -> list[int]:
    key_max = max(key)
    if key_max < 128:
        return []
    return [index for index, value in enumerate(key) if value >= key_max - 16 and value >= 128]


def dominance_alpha(rgb: tuple[int, int, int], key: tuple[int, int, int]) -> int:
    spill = spill_channels(key)
    if not spill:
        return 255
    channels = [float(value) for value in rgb]
    non_spill = [index for index in range(3) if index not in spill]
    key_strength = min(channels[index] for index in spill)
    non_key_strength = max((channels[index] for index in non_spill), default=0.0)
    dominance = key_strength - non_key_strength
    if dominance <= 0:
        return 255
    denominator = max(1.0, float(max(key)) - non_key_strength)
    return round((1.0 - min(1.0, dominance / denominator)) * 255.0)


def key_dominance(rgb: tuple[int, int, int], key: tuple[int, int, int]) -> float:
    spill = spill_channels(key)
    if not spill:
        return 0.0
    channels = [float(value) for value in rgb]
    non_spill = [index for index in range(3) if index not in spill]
    key_strength = min(channels[index] for index in spill)
    non_key_strength = max((channels[index] for index in non_spill), default=0.0)
    return key_strength - non_key_strength


def remove_chroma_key(source_path: Path, alpha_path: Path) -> None:
    with Image.open(source_path) as source_image:
        image = source_image.convert("RGBA")
    key = sample_border_key(image)
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            red, green, blue, original_alpha = pixels[x, y]
            rgb = (red, green, blue)
            distance = channel_distance(rgb, key)
            key_like = distance <= 32 or key_dominance(rgb, key) >= KEY_DOMINANCE_THRESHOLD
            output_alpha = min(soft_alpha(distance), dominance_alpha(rgb, key)) if key_like else 255
            output_alpha = round(output_alpha * (original_alpha / 255.0))
            if 0 < output_alpha <= ALPHA_NOISE_FLOOR:
                output_alpha = 0
            if output_alpha == 0:
                pixels[x, y] = (0, 0, 0, 0)
                continue
            if key_like and output_alpha < 252:
                spill = spill_channels(key)
                non_spill = [index for index in range(3) if index not in spill]
                if non_spill:
                    anchor = max(rgb[index] for index in non_spill)
                    channels = list(rgb)
                    for index in spill:
                        channels[index] = min(channels[index], max(0, anchor - 1))
                    red, green, blue = channels
            pixels[x, y] = (red, green, blue, output_alpha)
    alpha_path.parent.mkdir(parents=True, exist_ok=True)
    image.save(alpha_path)


def largest_component_mask(alpha: Image.Image) -> Image.Image:
    threshold = alpha.point(lambda value: 255 if value > 24 else 0)
    visited: set[tuple[int, int]] = set()
    largest: list[tuple[int, int]] = []

    for y in range(threshold.height):
        for x in range(threshold.width):
            if (x, y) in visited or threshold.getpixel((x, y)) == 0:
                continue

            stack = [(x, y)]
            visited.add((x, y))
            component: list[tuple[int, int]] = []
            while stack:
                current_x, current_y = stack.pop()
                component.append((current_x, current_y))
                for next_x, next_y in (
                    (current_x + 1, current_y),
                    (current_x - 1, current_y),
                    (current_x, current_y + 1),
                    (current_x, current_y - 1),
                ):
                    if (
                        next_x < 0
                        or next_y < 0
                        or next_x >= threshold.width
                        or next_y >= threshold.height
                        or (next_x, next_y) in visited
                        or threshold.getpixel((next_x, next_y)) == 0
                    ):
                        continue
                    visited.add((next_x, next_y))
                    stack.append((next_x, next_y))
            if len(component) > len(largest):
                largest = component

    if not largest:
        raise ValueError("Expected a visible cat pose, found an empty cell")

    mask = Image.new("L", alpha.size, 0)
    pixels = mask.load()
    for x, y in largest:
        pixels[x, y] = 255
    return mask.filter(ImageFilter.MaxFilter(5))


def crop_subject(cell: Image.Image) -> Image.Image:
    alpha = cell.getchannel("A")
    mask = largest_component_mask(alpha)
    cleaned_alpha = ImageChops.multiply(alpha, mask)
    cleaned = cell.copy()
    cleaned.putalpha(cleaned_alpha)
    bbox = cleaned_alpha.getbbox()
    if bbox is None:
        raise ValueError("Expected a visible cat pose, found an empty cell")
    return cleaned.crop(bbox)


def extract_subjects(source: Image.Image, spec: ActionSpec) -> list[Image.Image]:
    if source.width % spec.columns != 0 or source.height % spec.rows != 0:
        raise ValueError(
            f"Source size {source.size} is not divisible by {spec.columns}x{spec.rows} grid"
        )
    cell_width = source.width // spec.columns
    cell_height = source.height // spec.rows
    subjects: list[Image.Image] = []
    for index in range(spec.frames):
        row, column = divmod(index, spec.columns)
        cell = source.crop(
            (
                column * cell_width,
                row * cell_height,
                (column + 1) * cell_width,
                (row + 1) * cell_height,
            )
        )
        subjects.append(crop_subject(cell))
    return subjects


def normalize_subjects(
    subjects: list[Image.Image], spec: ActionSpec, action: str
) -> tuple[list[Image.Image], list[dict[str, object]]]:
    scale = min(
        spec.max_width / max(subject.width for subject in subjects),
        spec.max_height / max(subject.height for subject in subjects),
    )
    frames: list[Image.Image] = []
    metadata: list[dict[str, object]] = []
    for index, subject in enumerate(subjects, start=1):
        size = (
            max(1, round(subject.width * scale)),
            max(1, round(subject.height * scale)),
        )
        resized = subject.resize(size, Image.Resampling.LANCZOS)
        frame = Image.new("RGBA", (FRAME, FRAME), (0, 0, 0, 0))
        x = (FRAME - resized.width) // 2
        y = FRAME - resized.height - 4
        frame.alpha_composite(resized, (x, y))
        frames.append(frame)
        frame.save(NORMALIZED_DIR / action / f"{action}-{index:02d}.png")
        metadata.append(
            {
                "frame": index,
                "subject_size": [subject.width, subject.height],
                "sprite_size": list(size),
                "paste": [x, y],
            }
        )
    return frames, metadata


def make_sheet(frames: list[Image.Image], action: str) -> None:
    sheet = Image.new("RGBA", (FRAME * len(frames), FRAME), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        sheet.alpha_composite(frame, (index * FRAME, 0))
    sheet.save(SHEET_DIR / f"{action}.png")
    preview = Image.new("RGBA", sheet.size, (24, 24, 24, 255))
    preview.alpha_composite(sheet)
    preview.save(SHEET_DIR / f"{action}-preview.png")


def main() -> None:
    NORMALIZED_DIR.mkdir(parents=True, exist_ok=True)
    SHEET_DIR.mkdir(parents=True, exist_ok=True)

    actions: dict[str, object] = {}
    for action, spec in ACTION_SPECS.items():
        action_dir = NORMALIZED_DIR / action
        action_dir.mkdir(parents=True, exist_ok=True)
        source_path = SOURCE_DIR / f"{action}-source-chromakey.png"
        alpha_path = ALPHA_DIR / f"{action}-source.png"
        remove_chroma_key(source_path, alpha_path)
        source = Image.open(alpha_path).convert("RGBA")
        subjects = extract_subjects(source, spec)
        frames, frame_metadata = normalize_subjects(subjects, spec, action)
        make_sheet(frames, action)
        actions[action] = {
            "frames": spec.frames,
            "grid": [spec.columns, spec.rows],
            "source": source_path.relative_to(ROOT).as_posix(),
            "sourceSha256": file_sha256(source_path),
            "alpha": alpha_path.relative_to(ROOT).as_posix(),
            "alphaSha256": file_sha256(alpha_path),
            "framesMetadata": frame_metadata,
        }

    metadata = {
        "schemaVersion": 1,
        "identityAuthority": MODEL_SOURCE.relative_to(ROOT).as_posix(),
        "distributionStatus": "internal prototype only",
        "actions": actions,
    }
    (OUT_DIR / "metadata.json").write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"Wrote {len(ACTION_SPECS)} daily-life action sheets to {SHEET_DIR}")


if __name__ == "__main__":
    main()
