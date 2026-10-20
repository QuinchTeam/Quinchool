import { readFileSync } from "node:fs";

const messageFile = process.argv[2];
if (!messageFile) {
  console.error("Pass the commit message file path.");
  process.exit(1);
}

const header = readFileSync(messageFile, "utf8").split(/\r?\n/, 1)[0];
const match = header.match(
  /^(build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test)(?:\([^()\s]+\))?: (\S(?:.*\S)?)$/,
);

if (!match || [...header].length > 72) {
  console.error(
    "Use type(scope): message or type: message, with a subject of at most 72 characters.",
  );
  console.error(
    "Types: build, chore, ci, docs, feat, fix, perf, refactor, revert, style, test.",
  );
  process.exit(1);
}
