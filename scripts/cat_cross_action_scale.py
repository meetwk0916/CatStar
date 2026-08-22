"""Shared source normalization and apparent-scale authority for cat actions."""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from math import sqrt
from pathlib import Path
from statistics import median
from types import MappingProxyType

from PIL import Image


FRAME = 96
ALPHA_THRESHOLD = 24
MIN_STATIONARY_TO_WALK_LINEAR_SCALE_RATIO = MappingProxyType(
    {"idle": 0.88, "sit": 0.86}
)


@dataclass(frozen=True)
class NormalizedPose:
    image: Image.Image
    sprite_size: tuple[int, int]
    paste: tuple[int, int]
    source_scale: float


@dataclass(frozen=True)
class CrossActionScaleAuthority:
    """Freeze reviewed source calibrations behind one body-scale/registration seam.

    Source strips have different raster resolutions, so each action needs one
    reviewed source-to-runtime calibration. Unlike bounding-box fitting, these
    calibrations do not change when replacement art gets wider or taller: art
    that no longer fits the shared 96px registration contract fails instead of
    silently shrinking.
    """

    name: str
    source_scale_by_action: Mapping[str, float]
    frame_size: int = FRAME
    side_margin: int = 2
    top_margin: int = 4
    bottom_margin: int = 4

    def __post_init__(self) -> None:
        calibrations = dict(self.source_scale_by_action)
        missing = {"idle", "sit", "walk"} - set(calibrations)
        if missing:
            raise ValueError(
                f"{self.name}: missing stationary/walk source calibrations: "
                + ", ".join(sorted(missing))
            )
        if any(scale <= 0 for scale in calibrations.values()):
            raise ValueError(f"{self.name}: source calibrations must be positive")
        object.__setattr__(self, "source_scale_by_action", MappingProxyType(calibrations))

    def has_action(self, action: str) -> bool:
        return action in self.source_scale_by_action

    def normalize(self, action: str, subjects: Sequence[Image.Image]) -> list[NormalizedPose]:
        try:
            source_scale = self.source_scale_by_action[action]
        except KeyError as error:
            raise ValueError(f"{self.name}: no source calibration for {action}") from error

        normalized: list[NormalizedPose] = []
        for frame_index, subject in enumerate(subjects, start=1):
            width = max(1, round(subject.width * source_scale))
            height = max(1, round(subject.height * source_scale))
            x = (self.frame_size - width) // 2
            y = self.frame_size - height - self.bottom_margin
            if x < self.side_margin or y < self.top_margin:
                raise ValueError(
                    f"{self.name}/{action}[{frame_index}]: reviewed body scale "
                    f"produces {width}x{height}px at ({x},{y}); re-author the "
                    "source composition instead of shrinking this action"
                )
            frame = Image.new(
                "RGBA", (self.frame_size, self.frame_size), (0, 0, 0, 0)
            )
            resized = subject.resize((width, height), Image.Resampling.NEAREST)
            frame.alpha_composite(resized, (x, y))
            normalized.append(
                NormalizedPose(
                    image=frame,
                    sprite_size=(width, height),
                    paste=(x, y),
                    source_scale=source_scale,
                )
            )
        return normalized


ROUNDED_SHORT_HAIR_SCALE_AUTHORITY = CrossActionScaleAuthority(
    name="rounded-short-haired production master",
    source_scale_by_action={
        "idle": 0.22277227722772278,
        "sit": 0.18340611353711792,
        "walk": 0.4444444444444444,
    },
)

ORANGE_TABBY_PREVIEW_SCALE_AUTHORITY = CrossActionScaleAuthority(
    name="orange-tabby appearance prototype",
    source_scale_by_action={
        "idle": 0.24561403508771928,
        "sit": 0.17248459958932238,
        "walk": 0.37037037037037035,
    },
)


def sheet_frame_masses(path: Path, frame_count: int) -> list[int]:
    with Image.open(path) as source:
        image = source.convert("RGBA")
    if image.size != (FRAME * frame_count, FRAME):
        raise ValueError(
            f"{path}: expected {frame_count} {FRAME}x{FRAME} frames, got {image.size}"
        )
    return [
        sum(
            1
            for value in image
            .crop((index * FRAME, 0, (index + 1) * FRAME, FRAME))
            .getchannel("A")
            .get_flattened_data()
            if value > ALPHA_THRESHOLD
        )
        for index in range(frame_count)
    ]


def apparent_linear_scale_ratio(first_masses: list[int], second_masses: list[int]) -> float:
    """Approximate the smaller-to-larger linear scale from visible pixel mass."""

    first = median(first_masses)
    second = median(second_masses)
    if first <= 0 or second <= 0:
        return 0
    return sqrt(min(first, second) / max(first, second))


def require_stationary_walk_scale(
    stationary_path: Path,
    stationary_frames: int,
    walk_path: Path,
    walk_frames: int,
    *,
    stationary_action: str,
    label: str,
) -> float:
    try:
        minimum = MIN_STATIONARY_TO_WALK_LINEAR_SCALE_RATIO[stationary_action]
    except KeyError as error:
        raise ValueError(f"Unsupported stationary action: {stationary_action}") from error
    ratio = apparent_linear_scale_ratio(
        sheet_frame_masses(stationary_path, stationary_frames),
        sheet_frame_masses(walk_path, walk_frames),
    )
    if ratio < minimum:
        raise ValueError(
            f"{label}: {stationary_action}/walk apparent linear scale is {ratio:.2%}; "
            f"minimum is {minimum:.0%}"
        )
    return ratio
