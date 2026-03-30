from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.school_db import db_stats, reset_school_db
from app.substitution import reset_substitution_state


def main() -> None:
    reset_school_db()
    reset_substitution_state()
    stats = db_stats()
    print(
        "Demo data reset complete:",
        f"students={stats['students']}",
        f"teachers={stats['teachers']}",
        f"accounts={stats['accounts']}",
    )


if __name__ == "__main__":
    main()
