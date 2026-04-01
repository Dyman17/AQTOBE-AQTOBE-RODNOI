import { execFileSync } from "node:child_process";

const PORTS = [8000, 5173];

function pidsForPort(port) {
  try {
    const output = execFileSync("lsof", ["-ti", `:${port}`], { encoding: "utf8" }).trim();
    if (!output) return [];
    return [...new Set(output.split(/\s+/).filter(Boolean))];
  } catch (error) {
    return [];
  }
}

function killPid(pid) {
  try {
    process.kill(Number(pid), "SIGTERM");
    return true;
  } catch (error) {
    return false;
  }
}

for (const port of PORTS) {
  const pids = pidsForPort(port);
  if (pids.length === 0) {
    console.log(`[dev:clean-ports] Port ${port} is free`);
    continue;
  }

  let killed = 0;
  for (const pid of pids) {
    if (killPid(pid)) killed += 1;
  }

  console.log(`[dev:clean-ports] Port ${port}: found ${pids.length}, terminated ${killed}`);
}
