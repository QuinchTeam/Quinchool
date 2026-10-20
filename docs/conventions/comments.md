# Comments

These rules apply across `apps/ai`, `apps/api`, and `apps/web`, including line comments, block comments, JSX and HTML comments, and explanatory docstrings.

## Before adding a comment

Prefer no comment. First consider whether the code can explain itself:

1. Use clear names for functions, parameters, variables, constants, and results.
2. Simplify the logic and use easier syntax.
3. Split large functions and give each piece one responsibility.
4. Add a comment only when necessary context is still missing.

Do not add extra abstractions just to avoid a comment. Some features remain complex even with clear names and sensible boundaries.

## What to write

Explain the context the code cannot show: why a rule exists, a surprising constraint, an edge case, or a workaround. Remove comments that repeat names, types, syntax, or obvious behavior.

Keep the wording short, casual, and direct. A comment should give context without becoming a lecture or discussion. Prefer one line or none.

Remove stale comments, commented-out code, decorative banners, and unnecessary section labels.

## Line limits

Limits count physical comment lines, including block delimiters. Adjacent comments explaining the same thing count as one comment; do not split a paragraph to bypass the limit.

| What the comment describes                                          | Maximum | When it is allowed                                                                                                |
| ------------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------- |
| Parameter, variable, constant, or return value                      | 1 line  | Good naming still leaves unavoidable, non-obvious context. This limit is strict.                                  |
| Shared function, child function, utility, helper, or local function | 2 lines | The function is medium in size and genuinely hard to read. Prefer 1 line; a small or obvious function needs none. |
| Unavoidably complex function                                        | 3 lines | Clear naming, simpler logic, and sensible modularity still leave essential context to explain.                    |

A complex function can involve calculations, long data transformations, multiple business rules, long method chains, or a parent function with substantial nested children. Mapping, sorting, filtering, or concatenation alone does not justify a comment; the combined behavior must actually be hard to follow.

Three-line comments are reserved for this unavoidable complexity. They provide a high-level view, not a walkthrough of every step.

## Comment syntax

Use single-line comment syntax for one or two lines when the language supports it:

```ts
// The provider reports usage only after the final stream chunk.
```

```ts
// Resume after the confirmed write using the original user request.
// Drop the old confirmation so the model does not ask for approval again.
```

Use a block comment for a three-line explanation. Put text on the opening and closing lines so the entire block stays within three physical lines:

```text
/* Summarize the complex operation here.
   Explain the key constraint or business rule here.
   See docs/features/<feature>.md:<line>. */
```

The documentation path above is a template. Replace it with an existing feature document and its specific, accurate line number.

For languages without single-line comments, such as CSS and HTML, use their native comment syntax on one physical line for a one-line comment. Python has no block-comment syntax; use at most three consecutive `#` lines, or a docstring only when it actually documents the callable.

## Longer explanations

If three lines cannot explain the necessary context, put the full explanation in the relevant `docs/features/<feature>.md` file. Keep the code comment to a high-level summary and use its third line to point to that document with a specific line number.

Keep documentation references accurate when editing or moving the referenced explanation.

## Directives and runtime text

Preserve required legal notices and functional directives such as shebangs, encoding declarations, lint and type suppressions, formatter directives, coverage markers, and bundler annotations. These are not ordinary explanatory comments.

Do not treat strings containing comment markers as comments. Preserve docstrings or descriptions used as runtime metadata, API documentation, prompts, or other application behavior; shortening explanatory prose must not change behavior.
