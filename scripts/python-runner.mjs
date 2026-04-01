import { spawn, spawnSync } from "node:child_process";
import process from "node:process";
import { fileURLToPath } from "node:url";

export const PYTHON_CANDIDATES = [
  { command: "python3", args: [] },
  { command: "python", args: [] },
  { command: "py", args: ["-3"] },
];

export function detectPythonCommand(spawnSyncImpl = spawnSync) {
  for (const candidate of PYTHON_CANDIDATES) {
    const result = spawnSyncImpl(candidate.command, [...candidate.args, "--version"], {
      stdio: "ignore",
    });
    if (result.status === 0) {
      return candidate;
    }
  }
  return null;
}

export function buildModuleCommand(candidate, moduleArgs) {
  return {
    command: candidate.command,
    args: [...candidate.args, "-m", ...moduleArgs],
  };
}

function runCommand(command, args, cwd) {
  const child = spawn(command, args, {
    cwd,
    stdio: "inherit",
    env: process.env,
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 0);
  });

  child.on("error", (error) => {
    console.error(error.message);
    process.exit(1);
  });
}

function usage() {
  console.error("Usage: node scripts/python-runner.mjs <backend-dev|setup-backend>");
}

const action = process.argv[2];

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  if (!action) {
    usage();
    process.exit(1);
  }

  const python = detectPythonCommand();
  if (!python) {
    console.error(
      "Could not find a supported Python launcher. Tried: python3, python, py -3.",
    );
    process.exit(1);
  }

  let command;
  if (action === "backend-dev") {
    command = buildModuleCommand(python, [
      "uvicorn",
      "app.main:app",
      "--reload",
      "--port",
      "8000",
    ]);
  } else if (action === "setup-backend") {
    command = buildModuleCommand(python, [
      "pip",
      "install",
      "-r",
      "requirements.txt",
    ]);
  } else {
    usage();
    process.exit(1);
  }

  runCommand(command.command, command.args, "backend");
}
