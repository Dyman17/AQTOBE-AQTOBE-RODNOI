import test from "node:test";
import assert from "node:assert/strict";

import {
  buildModuleCommand,
  detectPythonCommand,
  PYTHON_CANDIDATES,
} from "./python-runner.mjs";

test("PYTHON_CANDIDATES keeps the expected detection order", () => {
  assert.deepEqual(PYTHON_CANDIDATES, [
    { command: "python3", args: [] },
    { command: "python", args: [] },
    { command: "py", args: ["-3"] },
  ]);
});

test("detectPythonCommand picks the first available launcher", () => {
  const calls = [];
  const spawnSync = (command, args) => {
    calls.push([command, args]);
    if (command === "python3") {
      return { status: 0 };
    }
    return { status: 1 };
  };

  const detected = detectPythonCommand(spawnSync);

  assert.deepEqual(detected, { command: "python3", args: [] });
  assert.deepEqual(calls, [["python3", ["--version"]]]);
});

test("detectPythonCommand falls back to py -3 when needed", () => {
  const calls = [];
  const spawnSync = (command, args) => {
    calls.push([command, args]);
    if (command === "py") {
      return { status: 0 };
    }
    return { status: 1 };
  };

  const detected = detectPythonCommand(spawnSync);

  assert.deepEqual(detected, { command: "py", args: ["-3"] });
  assert.deepEqual(calls, [
    ["python3", ["--version"]],
    ["python", ["--version"]],
    ["py", ["-3", "--version"]],
  ]);
});

test("detectPythonCommand returns null when no launcher is available", () => {
  const detected = detectPythonCommand(() => ({ status: 1 }));
  assert.equal(detected, null);
});

test("buildModuleCommand builds uvicorn module invocation", () => {
  const command = buildModuleCommand(
    { command: "python3", args: [] },
    ["uvicorn", "app.main:app", "--reload", "--port", "8000"],
  );

  assert.deepEqual(command, {
    command: "python3",
    args: ["-m", "uvicorn", "app.main:app", "--reload", "--port", "8000"],
  });
});

test("buildModuleCommand preserves launcher arguments for py -3", () => {
  const command = buildModuleCommand(
    { command: "py", args: ["-3"] },
    ["pip", "install", "-r", "requirements.txt"],
  );

  assert.deepEqual(command, {
    command: "py",
    args: ["-3", "-m", "pip", "install", "-r", "requirements.txt"],
  });
});
