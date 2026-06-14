#!/usr/bin/env node
// Fails if any Tailwind CSS *arbitrary value* (e.g. `w-[240px]`, `text-[#abc]`)
// or arbitrary property (e.g. `[mask-type:luminance]`) appears in first-party
// source. Use design-system tokens instead (`w-60`, `text-primary`), or add a
// token to `@theme` in `src/app/globals.css`.
//
//   - Arbitrary *variants* are allowed: `data-[state=open]:…`, `[&_svg]:…`,
//     `supports-[...]:…`, `min-[900px]:…`. Only arbitrary values and
//     properties are blocked.
//   - Vendored shadcn primitives under `src/components/ui/**` are not scanned
//     (generated code).
//   - Escape hatch: put `tailwind-allow-arbitrary` in a comment on the line.
//
// Usage:
//   node scripts/check-tailwind-arbitrary.mjs            # scan src/
//   node scripts/check-tailwind-arbitrary.mjs <files...> # scan given files
//                                                        # (used by lint-staged)

import { readdirSync, readFileSync, statSync } from "node:fs";
import { isAbsolute, join, relative, resolve, sep } from "node:path";

const ROOT = process.cwd();
const SCAN_DIRS = ["src"];
const SOURCE_EXT = /\.(?:[cm]?[jt]sx?|mdx?|css)$/;

// Posix-style path fragments that are exempt from the rule.
const IGNORED = [
  "src/components/ui/", // vendored shadcn output
  "scripts/check-tailwind-arbitrary.mjs", // documents forbidden syntax
  "scripts/check-tailwind-arbitrary.test.mjs", // regression fixtures
  "node_modules/",
  ".next/",
];

const UTILITY_CHAR = /[\w.!@%/.-]/;
const ARBITRARY_PROPERTY = /^(?:--|[a-zA-Z])[a-zA-Z0-9_-]*:[^\s]+$/;
const ALLOW = "tailwind-allow-arbitrary";

const toPosix = (p) => p.split(sep).join("/");
const isIgnored = (posixPath) =>
  IGNORED.some((frag) => posixPath.includes(frag));

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (isIgnored(`${toPosix(relative(ROOT, full))}/`)) continue;
      yield* walk(full);
    } else if (SOURCE_EXT.test(entry.name)) {
      yield full;
    }
  }
}

function collectFiles(args) {
  if (args.length > 0) {
    return args
      .filter(Boolean)
      .map((a) => (isAbsolute(a) ? a : resolve(ROOT, a)))
      .filter((f) => SOURCE_EXT.test(f))
      .filter((f) => !isIgnored(toPosix(relative(ROOT, f))));
  }
  const files = [];
  for (const dir of SCAN_DIRS) {
    const abs = join(ROOT, dir);
    try {
      if (statSync(abs).isDirectory()) files.push(...walk(abs));
    } catch {
      // missing scan dir — skip
    }
  }
  return files;
}

function findClosingBracket(line, start) {
  let depth = 0;

  for (let i = start; i < line.length; i += 1) {
    if (line[i] === "\\") {
      i += 1;
    } else if (line[i] === "[") {
      depth += 1;
    } else if (line[i] === "]") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }

  return -1;
}

function findArbitraryValues(line) {
  const matches = [];

  for (let i = 0; i < line.length; i += 1) {
    if (line[i] !== "[") continue;

    const close = findClosingBracket(line, i);
    if (close === -1) continue;

    const content = line.slice(i + 1, close);
    const isUtilityValue = line[i - 1] === "-";
    const isProperty = ARBITRARY_PROPERTY.test(content);

    if (!isUtilityValue && !isProperty) continue;

    // A balanced bracket group immediately followed by ":" is an arbitrary
    // variant. Skip its nested selector content as one allowed unit.
    if (line[close + 1] === ":") {
      i = close;
      continue;
    }

    let start = i;
    if (isUtilityValue) {
      while (start > 0 && UTILITY_CHAR.test(line[start - 1])) start -= 1;
    }

    matches.push({ index: start, text: line.slice(start, close + 1) });
    i = close;
  }

  return matches;
}

const files = collectFiles(process.argv.slice(2));
const violations = [];

for (const file of files) {
  const posix = toPosix(relative(ROOT, file));
  if (isIgnored(posix)) continue;

  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    continue;
  }

  text.split(/\r?\n/).forEach((line, i) => {
    if (line.includes(ALLOW)) return;
    for (const match of findArbitraryValues(line)) {
      violations.push({
        file: posix,
        line: i + 1,
        col: match.index + 1,
        text: match.text,
      });
    }
  });
}

if (violations.length > 0) {
  console.error(
    `\n✖ Tailwind arbitrary values are not allowed (${violations.length} found).`,
  );
  console.error(
    "  Use a design-system token, or add one to @theme in src/app/globals.css.\n",
  );
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}:${v.col}  ${v.text}`);
  }
  console.error(
    `\n  Allowed: arbitrary *variants* (data-[...]:, [&_svg]:).` +
      `\n  Escape hatch (use sparingly): add "${ALLOW}" in a comment on the line.\n`,
  );
  process.exit(1);
}

console.log(
  `✓ No Tailwind arbitrary values found (${files.length} files scanned).`,
);
