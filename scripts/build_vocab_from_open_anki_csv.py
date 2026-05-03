#!/usr/bin/env python3
"""
Build `data/n2_vocabulary.json` from `data/third_party/open_anki_jlpt_n2.csv`.

Output schema per row:
  - id
  - word
  - reading
  - meaning

Rules:
  - Ignore rows missing expression/reading/meaning.
  - De-duplicate by expression (keep first occurrence).
  - Keep CSV order.
"""

from __future__ import annotations

import csv
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VOCAB_PATH = ROOT / "data" / "n2_vocabulary.json"
CSV_PATH = ROOT / "data/third_party/open_anki_jlpt_n2.csv"


def clean_text(s: str) -> str:
    s = s.strip().strip('"').strip()
    return re.sub(r"\s+", " ", s)


def parse_csv_rows() -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    seen: set[str] = set()

    with CSV_PATH.open(encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        for r in reader:
            word = clean_text(str(r.get("expression", "")))
            reading = clean_text(str(r.get("reading", "")))
            meaning = clean_text(str(r.get("meaning", "")))

            if not word or not reading or not meaning:
                continue
            if word in seen:
                continue

            seen.add(word)
            rows.append({"word": word, "reading": reading, "meaning": meaning})

    return rows


def main() -> None:
    if not CSV_PATH.exists():
        raise SystemExit(f"Missing CSV: {CSV_PATH}")

    csv_rows = parse_csv_rows()
    id_width = max(4, len(str(len(csv_rows))))

    out: list[dict[str, str]] = []
    for idx, row in enumerate(csv_rows, start=1):
        out.append(
            {
                "id": f"n2-v-{idx:0{id_width}d}",
                "word": row["word"],
                "reading": row["reading"],
                "meaning": row["meaning"],
            }
        )

    VOCAB_PATH.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(out)} items to {VOCAB_PATH.relative_to(ROOT)}")
    if out:
        print("First:", out[0]["id"], out[0]["word"])
        print("Last:", out[-1]["id"], out[-1]["word"])


if __name__ == "__main__":
    main()
