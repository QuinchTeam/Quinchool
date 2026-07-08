---
name: commit-only
description: Group the current changes into relevance-based commits with Conventional Commit messages, then stop. Use when the user asks to commit only, make commits, save work in git, or run a commit workflow without pushing or opening a PR.
---

# commit-only

Turn the working tree's changes into one or more well-scoped commits, then stop.
Never push, force-push, publish a branch, create a PR, edit a PR, or run any `gh pr`
command as part of this skill. If the user asks to push or create a PR in the same
request, do not use this skill; use the appropriate push/PR workflow instead.

## 1. Inspect

Run `git status`, `git diff`, and `git diff --staged` to see every unstaged,
staged, and untracked change. Read enough of the diff to understand what each
changed file is actually for. Do not guess from filenames alone.

Check recent commits with `git log --oneline -n 10` so commit messages match the
repo's existing Conventional Commit style.

## 2. Group by relevance

Cluster files that belong to the same logical change into one commit each. Keep
unrelated changes in separate commits.

Exception: if the overall change is small, roughly a handful of files or one
tight concern touching several files for the same reason, make a single commit.
Do not manufacture multiple commits out of a small diff.

Never stage with `git add -A` or `git add .`. Stage each group's files by name
so unrelated in-progress work never rides along. Never commit secrets (`.env`,
credentials, keys) even if untracked and not gitignored; flag them to the user
instead.

## 3. Commit each group

Message format, chosen per commit:

- `type(scope): message` - when the commit is specific to one area/component.
- `type: message` - when the commit is general or cross-cutting.

`type` is a Conventional Commit type: `feat`, `fix`, `chore`, `refactor`,
`docs`, `style`, `test`, `perf`, `build`, or `ci`. `scope` is the affected
module, directory, or feature, such as `auth`, `sidebar`, or `sentry`.

Write the message in imperative mood, lowercase, with no trailing period. State
what changed and why it matters, not a play-by-play of the diff.

Repeat until every relevant change is committed. If something in the working
tree looks like unrelated WIP, leave it uncommitted and say so rather than
sweeping it in.

## 4. Stop

After the final commit, run `git status --short` and report:

- commit hash and message for each commit made
- any uncommitted or untracked changes intentionally left behind

Do not run `git push`, `git push --force`, `git push --force-with-lease`,
`gh pr create`, `gh pr edit`, or any command that publishes the branch or opens a
pull request. The workflow ends after local commits.
