---
name: commit-push-main
description: Group current changes into relevance-based commits with Conventional Commit messages and push directly to main without opening a PR. Use when the user asks to commit and push to main, push changes directly, or run "commit push main".
---

# commit-push-main

Turn the working tree's changes into one or more well-scoped commits and push
them directly to `main` without dumping everything into a single commit.

## 1. Inspect

Run `git status`, `git diff`, and `git diff --staged` to see every unstaged,
staged, and untracked change. Read enough of the diff to understand what each
changed file is actually for; do not guess from filenames alone.

Confirm the current branch is `main`. If it is not, stop and tell the user.
Do not create, switch, merge, or push another branch.

## 2. Group by relevance

Cluster files that belong to the same logical change into one commit each.
Keep unrelated changes in separate commits.

If the overall change is small or one tight concern, make a single commit.
Do not manufacture multiple commits just to look thorough.

Never stage with `git add -A` or `git add .`. Stage each group by filename so
unrelated work never rides along. Never commit secrets such as `.env`,
credentials, or keys; flag them to the user instead.

## 3. Commit each group

Use one of these Conventional Commit formats:

- `type(scope): message` when one area or component owns the change.
- `type: message` when the change is general or cross-cutting.

Use `feat`, `fix`, `chore`, `refactor`, `docs`, `style`, `test`, `perf`,
`build`, or `ci`. Keep the message imperative, lowercase, and without a
trailing period. Match the repository's existing commit style.

Repeat until every relevant change is committed. Leave unrelated work
uncommitted and report it.

## 4. Push main

Fetch `origin/main` before pushing. If the remote moved, rebase the new local
commits onto `origin/main`. If conflicts occur, stop and report them.

Push `main` to `origin`. Never force-push and never skip hooks with
`--no-verify`. Do not open a pull request.

Report the created commits and confirmed push result.
