import type { CatPalette } from "../types";

type PixelValue = 0 | 1 | 2 | 3 | 4;

const PALETTE_MAP: Record<
  CatPalette,
  { primary: string; secondary: string; accent: string; belly: string }
> = {
  ORANGE: { primary: "#E89F71", secondary: "#D38555", accent: "#ECA3A3", belly: "#FFFDF9" },
  BLACK: { primary: "#3A3A3C", secondary: "#2C2C2E", accent: "#ECA3A3", belly: "#545456" },
  WHITE: { primary: "#F2F2F7", secondary: "#E5E5EA", accent: "#ECA3A3", belly: "#FFFFFF" },
  CALICO: { primary: "#E89F71", secondary: "#3A3A3C", accent: "#ECA3A3", belly: "#FFFDF9" },
  TUXEDO: { primary: "#2C2C2E", secondary: "#2C2C2E", accent: "#ECA3A3", belly: "#FFFFFF" },
};

const FRAME_IDLE: PixelValue[][] = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0],
  [0, 2, 3, 1, 2, 0, 0, 0, 0, 2, 1, 3, 2, 0, 0, 0],
  [0, 2, 1, 1, 1, 2, 2, 2, 2, 1, 1, 1, 2, 0, 0, 0],
  [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 0, 0],
  [2, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 2, 0, 0],
  [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 0, 0],
  [0, 2, 2, 2, 1, 1, 1, 1, 1, 1, 2, 2, 2, 0, 0, 0],
  [0, 0, 0, 2, 1, 1, 4, 4, 1, 1, 2, 0, 0, 0, 0, 0],
  [0, 0, 0, 2, 1, 4, 4, 4, 4, 1, 2, 0, 2, 2, 0, 0],
  [0, 0, 0, 2, 1, 4, 4, 4, 4, 1, 2, 0, 2, 1, 1, 2],
  [0, 0, 0, 2, 1, 1, 4, 4, 1, 1, 2, 2, 1, 1, 2, 0],
  [0, 0, 0, 0, 2, 1, 1, 1, 1, 2, 1, 1, 1, 2, 0, 0],
  [0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0],
  [0, 0, 0, 0, 0, 2, 2, 0, 0, 2, 2, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
];

interface PixelCatRendererProps {
  palette: CatPalette;
  showStardust: boolean;
}

export default function PixelCatRenderer({ palette, showStardust }: PixelCatRendererProps) {
  const colors = PALETTE_MAP[palette];
  const colorFor = (value: PixelValue): string => {
    if (value === 1) return colors.primary;
    if (value === 2) return "#4A3E3D";
    if (value === 3) return colors.accent;
    if (value === 4) return colors.belly;
    return "transparent";
  };

  return (
    <svg
      className="h-36 w-36 overflow-visible"
      viewBox="0 0 16 18"
      aria-hidden="true"
      style={{ imageRendering: "pixelated", shapeRendering: "crispEdges" }}
    >
      {showStardust ? (
        <g className="stardust-pixels">
          <rect x="4" y="0" width="1" height="1" fill="#FFD700" />
          <rect x="8" y="0.5" width="1" height="1" fill="#FFE88A" />
          <rect x="12" y="1" width="1" height="1" fill="#FFD700" />
          <rect x="2" y="3" width="1" height="1" fill="#FFE88A" />
          <rect x="14" y="4" width="1" height="1" fill="#FFD700" />
        </g>
      ) : null}
      <g transform="translate(0 2)">
        {FRAME_IDLE.flatMap((row, y) =>
          row.map((value, x) =>
            value === 0 ? null : (
              <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={colorFor(value)} />
            ),
          ),
        )}
      </g>
    </svg>
  );
}
