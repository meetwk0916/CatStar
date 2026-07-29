#!/bin/sh
# Run CatStar image QA with a Python interpreter that already provides Pillow.

export PYTHONDONTWRITEBYTECODE=1

if [ -n "${CATSTAR_PYTHON:-}" ] && "$CATSTAR_PYTHON" -c "from PIL import Image" >/dev/null 2>&1; then
  exec "$CATSTAR_PYTHON" "$@"
fi

if python3 -c "from PIL import Image" >/dev/null 2>&1; then
  exec python3 "$@"
fi

for candidate in "$HOME"/.cache/codex-runtimes/*/dependencies/python/bin/python3; do
  if [ -x "$candidate" ] && "$candidate" -c "from PIL import Image" >/dev/null 2>&1; then
    exec "$candidate" "$@"
  fi
done

echo "CatStar image QA requires Python with Pillow. Set CATSTAR_PYTHON or install Pillow for python3." >&2
exit 1
