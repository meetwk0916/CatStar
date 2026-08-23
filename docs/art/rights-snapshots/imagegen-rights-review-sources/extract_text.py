#!/usr/bin/env python3
"""Extract readable text from an HTML file (stdlib only). Usage: extract_text.py in.html [out.txt]"""
import html
import re
import sys

def main() -> None:
    src = sys.argv[1]
    raw = open(src, encoding="utf-8", errors="replace").read()
    # Drop scripts/styles/noscript/svg and wayback chrome
    raw = re.sub(r"(?is)<(script|style|noscript|svg|template)[^>]*>.*?</\1>", " ", raw)
    raw = re.sub(r"(?is)<!--.*?-->", " ", raw)
    # Block-level tags become newlines
    raw = re.sub(r"(?i)</(p|div|li|h[1-6]|tr|section|article|blockquote)>", "\n", raw)
    raw = re.sub(r"(?i)<br[^>]*>", "\n", raw)
    txt = re.sub(r"<[^>]+>", " ", raw)
    txt = html.unescape(txt)
    txt = re.sub(r"[ \t\xa0]+", " ", txt)
    txt = re.sub(r"\n\s*\n+", "\n\n", txt)
    out = sys.argv[2] if len(sys.argv) > 2 else None
    if out:
        open(out, "w", encoding="utf-8").write(txt.strip())
        print(f"wrote {out} ({len(txt)} chars)")
    else:
        print(txt.strip())

if __name__ == "__main__":
    main()
