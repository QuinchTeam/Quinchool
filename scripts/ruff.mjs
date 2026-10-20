import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const [command, ...files] = process.argv.slice(2);
if (!files.length) process.exit(0);

const executable = fileURLToPath(
  new URL(
    process.platform === "win32"
      ? "../apps/ai/.venv/Scripts/ruff.exe"
      : "../apps/ai/.venv/bin/ruff",
    import.meta.url,
  ),
);
const result = spawnSync(executable, [command, ...files], { stdio: "inherit" });
if (result.error) {
  console.error(
    "Install apps/ai/requirements-dev.txt into apps/ai/.venv to run Ruff.",
  );
}
process.exit(result.status ?? 1);
