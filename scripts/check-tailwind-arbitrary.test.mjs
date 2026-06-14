import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const CHECKER = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "check-tailwind-arbitrary.mjs",
);

function withFixture(files, run) {
  const root = mkdtempSync(join(tmpdir(), "tailwind-arbitrary-"));

  try {
    for (const [path, contents] of Object.entries(files)) {
      const target = join(root, path);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, contents);
    }
    run(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function check(root, args = []) {
  return spawnSync(process.execPath, [CHECKER, ...args], {
    cwd: root,
    encoding: "utf8",
  });
}

test("rejects arbitrary utility values and arbitrary properties", () => {
  withFixture(
    {
      "src/example.tsx":
        'const classes = "hover:w-[240px] [mask-type:luminance] [--gap:7px]";',
    },
    (root) => {
      const result = check(root);

      assert.equal(result.status, 1);
      assert.match(result.stderr, /w-\[240px\]/);
      assert.match(result.stderr, /\[mask-type:luminance\]/);
      assert.match(result.stderr, /\[--gap:7px\]/);
    },
  );
});

test("scans stylesheet and module-script source", () => {
  withFixture(
    {
      "src/example.mjs": 'const classes = "w-60";',
      "src/styles.css": ".example { @apply mt-[7px]; }",
    },
    (root) => {
      const result = check(root);

      assert.equal(result.status, 1);
      assert.match(result.stderr, /src\/styles\.css/);
      assert.match(result.stderr, /mt-\[7px\]/);
    },
  );
});

test("allows arbitrary variants", () => {
  withFixture(
    {
      "src/example.tsx":
        'const classes = "data-[state=open]:block [&_svg]:size-4 supports-[backdrop-filter]:bg-background min-[900px]:grid group-[&[data-state=open]]:block";',
    },
    (root) => {
      const result = check(root);

      assert.equal(result.status, 0, result.stderr);
    },
  );
});

test("allows an explicitly suppressed line", () => {
  withFixture(
    {
      "src/example.tsx":
        'const classes = "w-[240px]"; // tailwind-allow-arbitrary',
    },
    (root) => {
      const result = check(root);

      assert.equal(result.status, 0, result.stderr);
    },
  );
});

test("skips vendored shadcn primitives", () => {
  withFixture(
    {
      "src/components/ui/button.tsx": 'const classes = "w-[240px]";',
      "src/page.tsx": 'const classes = "w-60";',
    },
    (root) => {
      const result = check(root);

      assert.equal(result.status, 0, result.stderr);
      assert.match(result.stdout, /1 files scanned/);
    },
  );
});
