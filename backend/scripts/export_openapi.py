from __future__ import annotations

import json
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.main import app


def main() -> None:
    repo_root = Path(__file__).resolve().parents[2]
    out_path = repo_root / "docs" / "openapi.json"
    out_path.write_text(json.dumps(app.openapi(), ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"Wrote {out_path}")


if __name__ == "__main__":
    main()
