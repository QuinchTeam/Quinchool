// Idempotent local Garage setup: one-node layout, the uploads bucket, and a fixed key
// matching apps/api/.env.example. Safe to rerun; "already exists" errors are ignored.
import { execFileSync } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const CONTAINER = "quinchool-garage";
const BUCKET = "quinchool-uploads";
// Local-only credentials (Garage key IDs are GK + 24 hex, secrets 64 hex).
const KEY_ID = "GK6c6f63616c2d757000000000";
const KEY_SECRET =
  "6c6f63616c2d6f6e6c792d75706c6f6164732d7365637265742d303030303031";

function garage(...args) {
  return execFileSync("docker", ["exec", CONTAINER, "/garage", ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function tryGarage(...args) {
  try {
    return garage(...args);
  } catch (error) {
    return String(error.stderr ?? error);
  }
}

let nodeId = "";
for (let attempt = 0; attempt < 20 && !nodeId; attempt++) {
  try {
    nodeId = garage("node", "id", "-q").trim().split("@")[0];
  } catch {
    await sleep(500);
  }
}
if (!nodeId) throw new Error(`${CONTAINER} did not start. Run \`pnpm infra\`.`);

if (!garage("layout", "show").includes(nodeId.slice(0, 16))) {
  garage("layout", "assign", "-z", "local", "-c", "1G", nodeId);
  garage("layout", "apply", "--version", "1");
}
tryGarage("bucket", "create", BUCKET);
tryGarage("key", "import", "--yes", "-n", "local", KEY_ID, KEY_SECRET);
garage(
  "bucket",
  "allow",
  "--read",
  "--write",
  "--owner",
  BUCKET,
  "--key",
  KEY_ID,
);

console.log(`Garage ready: bucket ${BUCKET}, key ${KEY_ID}.`);
