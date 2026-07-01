---
name: commit-push-create-pr
description: Group the current changes into relevance-based commits with Conventional Commit messages, push the branch, and open a PR with a one-line "This PR ..." description. Use when the user asks to commit, push, and open a PR (e.g. "commit push create pr", "wrap this up into a PR").
---

# commit-push-create-pr

Turn the working tree's changes into one or more well-scoped commits, push the
branch, and open a PR — without dumping everything into a single commit or
writing a bloated PR description.

## 1. Inspect

Run `git status`, `git diff`, and `git diff --staged` to see every unstaged,
staged, and untracked change. Read enough of the diff to understand what each
changed file is actually for — don't guess from filenames alone.

## 2. Group by relevance

Cluster files that belong to the same logical change (same feature, fix, or
concern) into one commit each. Keep unrelated changes in separate commits —
e.g. a Sentry wiring change and an unrelated README cleanup are two commits,
not one.

**Exception:** if the overall change is small (roughly a handful of files, or
one tight concern touching several files for the same reason — e.g. a
component plus its one call site), skip grouping and make a single commit.
Don't manufacture multiple commits out of a small diff just to look thorough.

Never stage with `git add -A` or `git add .`. Stage each group's files by
name so unrelated in-progress work never rides along. Never commit secrets
(`.env`, credentials, keys) even if untracked and not gitignored — flag it to
the user instead.

## 3. Commit each group

Message format, chosen per commit:

- `type(scope): message` — when the commit is specific to one area/component.
- `type: message` — when the commit is general or cross-cutting (no single
  scope fits).

`type` is a Conventional Commit type: `feat`, `fix`, `chore`, `refactor`,
`docs`, `style`, `test`, `perf`, `build`, or `ci`. `scope` is the affected
module/directory/feature (e.g. `sentry`, `sidebar`, `auth`). The message is
imperative, lowercase, no trailing period — state what changed and why it
matters, not a play-by-play of the diff. Match whatever Conventional Commit
style is already used in `git log` for this repo.

Repeat until every relevant change is committed. If something in the working
tree looks like unrelated WIP that doesn't belong in this PR, leave it
uncommitted and say so rather than sweeping it in.

## 4. Push

If the current branch is `main`/`master`, create a new branch first (name it
`type/scope-slug` from the dominant change, e.g. `feat/sentry-wiring`) and
switch to it — a PR can't target the branch it's made from. Then
`git push -u origin <branch>` (or plain `git push` if it already tracks a
remote). Never force-push, never skip hooks (`--no-verify`).

## 5. Open the PR

Use `gh pr create`:

- `--title`: one Conventional-Commit-style line — `type(scope): message` or
  `type: message` — general enough to summarize *every* commit in the PR, not
  just the last one.
- `--body`: **one short paragraph at most, one short sentence at minimum.**
  Must start literally with `This PR `. Straight to the point: state the
  intention and the reason. No headings, no bullet lists, no "Summary" or
  "Test plan" sections — this format intentionally overrides more elaborate
  PR templates.

Report the PR URL back to the user when done.
