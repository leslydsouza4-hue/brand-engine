#!/usr/bin/env node
// Development only (Replit workspace preview). Runs the API dev server and, every
// minute, fast-forwards the workspace to GitHub main when new commits exist, then
// restarts the API. The Vite web app hot-reloads changed files by itself.
// Never touches production deploys, never merges divergent history, never
// overwrites uncommitted edits. Opt out with AUTO_PULL=0.
import { spawn, execFileSync } from "node:child_process";

const RUN = process.env.AUTO_PULL_TEST_CMD ? ["sh", ["-c", process.env.AUTO_PULL_TEST_CMD]] : ["pnpm", ["--filter", "@workspace/api-server", "run", "dev"]];
const INTERVAL = Number(process.env.AUTO_PULL_INTERVAL_MS || 60_000);
const git = (...args) => execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 60_000 }).trim();
const log = msg => console.log(`[auto-update] ${msg}`);

let child;
function start() {
  child = spawn(RUN[0], RUN[1], { stdio: "inherit", detached: true });
  child.on("exit", code => { if (!restarting) log(`API exited (${code}); auto-update keeps watching`); });
}
let restarting = false;
async function restart() {
  restarting = true;
  if (child?.pid) { try { process.kill(-child.pid, "SIGTERM"); } catch { /* already gone */ } }
  await new Promise(r => setTimeout(r, 2500));
  if (child?.pid) { try { process.kill(-child.pid, "SIGKILL"); } catch { /* gone */ } }
  restarting = false;
  start();
}

function check() {
  try {
    if (process.env.AUTO_PULL === "0") return;
    const branch = git("rev-parse", "--abbrev-ref", "HEAD");
    if (branch !== "main") return;
    git("fetch", "-q", "origin", "main");
    const head = git("rev-parse", "HEAD"), remote = git("rev-parse", "origin/main");
    if (head === remote) return;
    if (git("merge-base", "HEAD", "origin/main") !== head) { log("local commits differ from GitHub; not auto-pulling"); return; }
    if (git("status", "--porcelain", "--untracked-files=no")) { log("uncommitted workspace edits; not auto-pulling"); return; }
    const changed = git("diff", "--name-only", head, remote).split("\n");
    git("merge", "--ff-only", "-q", "origin/main");
    log(`updated ${head.slice(0, 7)} -> ${remote.slice(0, 7)}`);
    if (changed.some(f => f === "pnpm-lock.yaml" || f.endsWith("package.json")))
      execFileSync("pnpm", ["install", "--frozen-lockfile"], { stdio: "inherit", timeout: 300_000 });
    void restart();
  } catch (error) { log(`check skipped: ${error.message.split("\n")[0]}`); }
}

start();
setInterval(check, INTERVAL);
for (const sig of ["SIGTERM", "SIGINT"]) process.on(sig, () => { if (child?.pid) try { process.kill(-child.pid, "SIGTERM"); } catch { /* gone */ } process.exit(0); });
