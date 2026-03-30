import os
import re
import socket
import subprocess
import sys
import time
import shutil
from pathlib import Path
from typing import Optional, Tuple

ROOT = Path(__file__).resolve().parent
BACKEND_DIR = ROOT / "backend"
FRONTEND_DIR = ROOT / "frontend_main"


def _load_env_file(path: Path) -> dict:
    data = {}
    if not path.exists():
        return data
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        data[key.strip()] = value.strip().strip('"').strip("'")
    return data


def _parse_db_host_port(url: str) -> Tuple[str, int]:
    host = "localhost"
    port = 5432
    m = re.search(r"@([^:/]+)(?::(\d+))?", url)
    if m:
        host = m.group(1)
        if m.group(2):
            port = int(m.group(2))
    return host, port


def _is_port_open(host: str, port: int) -> bool:
    try:
        with socket.create_connection((host, port), timeout=1):
            return True
    except OSError:
        return False


def _find_pg_ctl() -> Optional[Path]:
    candidates = []
    program_files = os.environ.get("ProgramFiles") or "C:\\Program Files"
    pg_root = Path(program_files) / "PostgreSQL"
    if pg_root.exists():
        for child in pg_root.glob("*\\bin\\pg_ctl.exe"):
            candidates.append(child)
    for name in ["pg_ctl", "pg_ctl.exe"]:
        path = shutil.which(name)
        if path:
            candidates.append(Path(path))
    return candidates[0] if candidates else None


def _detect_pg_data(pg_ctl_path: Path) -> Optional[Path]:
    bin_dir = pg_ctl_path.parent
    data_dir = bin_dir.parent / "data"
    if data_dir.exists():
        return data_dir
    env_data = os.environ.get("PGDATA")
    if env_data and Path(env_data).exists():
        return Path(env_data)
    return None


def _start_postgres(host: str, port: int) -> bool:
    if _is_port_open(host, port):
        print(f"[db] PostgreSQL is already running at {host}:{port}")
        return True

    pg_ctl = _find_pg_ctl()
    if not pg_ctl:
        print("[db] PostgreSQL not running and pg_ctl not found. Start DB manually.")
        return False

    data_dir = _detect_pg_data(pg_ctl)
    if not data_dir:
        print("[db] pg_ctl found, but data directory not detected. Set PGDATA env and re-run.")
        return False

    print(f"[db] Starting PostgreSQL with {pg_ctl} -D {data_dir}")
    proc = subprocess.run([str(pg_ctl), "start", "-D", str(data_dir)], capture_output=True, text=True)
    if proc.returncode != 0:
        print("[db] Failed to start PostgreSQL:")
        print(proc.stdout.strip())
        print(proc.stderr.strip())
        return False

    for _ in range(10):
        if _is_port_open(host, port):
            print(f"[db] PostgreSQL started at {host}:{port}")
            return True
        time.sleep(0.5)

    print("[db] PostgreSQL start requested but port still closed.")
    return False


def _find_npm() -> str:
    for name in ["npm", "npm.cmd", "npm.exe"]:
        path = shutil.which(name)
        if path:
            return path
    return "npm"


def main() -> int:
    env = _load_env_file(BACKEND_DIR / ".env")
    db_url = env.get("SQLALCHEMY_DATABASE_URI", "")
    host, port = _parse_db_host_port(db_url) if db_url else ("localhost", 5432)

    _start_postgres(host, port)

    backend_cmd = [
        sys.executable,
        "-m",
        "uvicorn",
        "app.main:app",
        "--reload",
        "--host",
        "127.0.0.1",
        "--port",
        "8000",
    ]
    frontend_cmd = [_find_npm(), "run", "dev"]

    print("[backend]", " ".join(backend_cmd))
    backend_proc = subprocess.Popen(backend_cmd, cwd=str(BACKEND_DIR))

    print("[frontend]", " ".join(frontend_cmd))
    frontend_proc = subprocess.Popen(frontend_cmd, cwd=str(FRONTEND_DIR))

    try:
        while True:
            time.sleep(0.5)
            if backend_proc.poll() is not None:
                print("[backend] stopped.")
                break
            if frontend_proc.poll() is not None:
                print("[frontend] stopped.")
                break
    except KeyboardInterrupt:
        print("\nStopping...")
    finally:
        for proc in [frontend_proc, backend_proc]:
            if proc.poll() is None:
                proc.terminate()
        time.sleep(1)
        for proc in [frontend_proc, backend_proc]:
            if proc.poll() is None:
                proc.kill()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
