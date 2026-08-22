#!/usr/bin/env python3
"""Extract the six-phase production-identity jump candidate."""

from __future__ import annotations

import hashlib
import json
import math

from PIL import Image

from artifact_paths import ARTIFACTS_ART_ROOT


FRAME = 96
OUT_DIR = ARTIFACTS_ART_ROOT / "candidates" / "active" / "product-cat-jump-v6"
SOURCE = OUT_DIR / "sources" / "jump-six-phase-source.png"
SHEET_DIR = OUT_DIR / "sprite-sheets-96"
NORMALIZED_DIR = OUT_DIR / "normalized-96"
IDENTITY_AUTHORITY = (
    "artifacts/art/candidates/active/product-cat-model-sheet-v1/"
    "sources/model-sheet-chromakey.png"
)


def is_green(pixel: tuple[int, int, int, int]) -> bool:
    red, green, blue, _alpha = pixel
    return green > 120 and green > red * 1.35 and green > blue * 1.35


def remove_green(source: Image.Image) -> Image.Image:
    image = source.convert("RGBA")
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            if is_green(pixels[x, y]):
                pixels[x, y] = (0, 0, 0, 0)
    return image


def column_has_subject(image: Image.Image, x: int) -> bool:
    alpha = image.getchannel("A")
    return any(alpha.getpixel((x, y)) > 24 for y in range(image.height))


def split_frame_groups(image: Image.Image) -> list[tuple[int, int]]:
    raw_groups: list[tuple[int, int]] = []
    in_group = False
    start = 0
    for x in range(image.width):
        occupied = column_has_subject(image, x)
        if occupied and not in_group:
            start = x
            in_group = True
        elif not occupied and in_group:
            raw_groups.append((start, x))
            in_group = False
    if in_group:
        raw_groups.append((start, image.width))

    groups: list[tuple[int, int]] = []
    for start, end in raw_groups:
        if end - start < 16:
            continue
        if groups and start - groups[-1][1] < 24:
            groups[-1] = (groups[-1][0], end)
        else:
            groups.append((start, end))
    return groups


def normalize(subject: Image.Image, index: int) -> tuple[Image.Image, dict[str, object]]:
    bounding_box = subject.getbbox()
    if bounding_box is None:
        raise ValueError(f"Jump frame {index} is empty")
    subject = subject.crop(bounding_box)
    scale = min(88 / max(1, subject.width), 82 / max(1, subject.height))
    provisional = subject.resize(
        (max(1, round(subject.width * scale)), max(1, round(subject.height * scale))),
        Image.Resampling.LANCZOS,
    )
    alpha_area = sum(value > 24 for value in provisional.getchannel("A").tobytes())
    target_alpha_area = 2_800
    area_adjustment = math.sqrt(target_alpha_area / max(1, alpha_area))
    fit_adjustment = min(88 / provisional.width, 82 / provisional.height)
    scale *= min(area_adjustment, fit_adjustment)
    resized = subject.resize(
        (max(1, round(subject.width * scale)), max(1, round(subject.height * scale))),
        Image.Resampling.LANCZOS,
    )

    vertical_offsets = {1: 1, 2: -1, 3: -4, 4: -3, 5: -1, 6: 1}
    frame = Image.new("RGBA", (FRAME, FRAME), (0, 0, 0, 0))
    x = (FRAME - resized.width) // 2
    y = FRAME - resized.height - 7 + vertical_offsets[index]
    frame.alpha_composite(resized, (x, y))
    return frame, {"sprite_size": list(resized.size), "paste": [x, y]}


def make_sheet(frames: list[Image.Image]) -> Image.Image:
    output = Image.new("RGBA", (FRAME * len(frames), FRAME), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        output.alpha_composite(frame, (index * FRAME, 0))
    return output


def main() -> None:
    SHEET_DIR.mkdir(parents=True, exist_ok=True)
    NORMALIZED_DIR.mkdir(parents=True, exist_ok=True)

    source = Image.open(SOURCE).convert("RGBA")
    alpha = remove_green(source)
    groups = split_frame_groups(alpha)
    if len(groups) != 6:
        raise SystemExit(f"Expected 6 jump frames, found {len(groups)} groups: {groups}")

    frames: list[Image.Image] = []
    frames_metadata: list[dict[str, object]] = []
    for index, (start, end) in enumerate(groups, start=1):
        frame, info = normalize(alpha.crop((start, 0, end, alpha.height)), index)
        frames.append(frame)
        frame.save(NORMALIZED_DIR / f"jump-{index:02d}.png")
        frames_metadata.append({"frame": index, "source_x": [start, end], **info})

    sheet = make_sheet(frames)
    sheet.save(SHEET_DIR / "jump.png")
    preview = Image.new("RGBA", sheet.size, (24, 24, 24, 255))
    preview.alpha_composite(sheet, (0, 0))
    preview.save(SHEET_DIR / "jump-preview.png")

    metadata = {
        "identityAuthority": IDENTITY_AUTHORITY,
        "motionReference": (
            "artifacts/art/candidates/active/product-cat-actions-v5/"
            "sources/jump-natural-source.png"
        ),
        "generationPrompt": str(
            (OUT_DIR / "generation-prompt.md").relative_to(ARTIFACTS_ART_ROOT.parent.parent)
        ),
        "source": str(SOURCE.relative_to(ARTIFACTS_ART_ROOT.parent.parent)),
        "sourceSha256": hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
        "framesMetadata": frames_metadata,
    }
    (OUT_DIR / "metadata.json").write_text(
        json.dumps(metadata, indent=2) + "\n", encoding="utf-8"
    )
    (OUT_DIR / "README.md").write_text(
        "# Product Cat Jump v6\n\n"
        "Six-phase jump candidate derived from `product-cat-model-sheet-v1` identity "
        "and the earlier v5 motion reference. It provides distinct anticipation, "
        "launch, rise, apex balance, prepared descent, and grounded recovery poses.\n\n"
        "Generated with built-in ImageGen and normalized deterministically into the "
        "CatStar `96x96` contract. This remains internal prototype evidence until the "
        "complete public-distribution rights chain is recorded.\n",
        encoding="utf-8",
    )
    print(f"Wrote {SHEET_DIR / 'jump.png'}")


if __name__ == "__main__":
    main()
