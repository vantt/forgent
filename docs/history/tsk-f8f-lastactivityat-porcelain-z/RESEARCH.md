# Research: tsk-f8f — lastActivityAt mis-parses git-quoted porcelain paths

## Round 1 — 2026-08-14 (discovery stage)

**Asked:** Does the current code still match Finding 9's description
(`trimmed.split(/\s+/).pop()` mis-parses a git-quoted path with spaces)?
Which of the report's two suggested directions — unquote in place, or
switch to `git status --porcelain -z` — is the better fix, and what does
`-z`'s own record format actually look like (especially for a rename,
which the existing code already special-cases via the `->` arrow)?

**Checked:**
- `src/runner/claim-liveness.mjs:60-74` (`lastActivityAt`'s porcelain scan)
  — read directly. Confirmed: `trimmed.split(/\s+/).pop()` exactly as
  described, no quote-handling anywhere.
- **Empirical check, not assumed:** built a real git repo with an untracked
  file named `"untracked with space.txt"` and a staged rename to `"renamed
  file.txt"`, ran both `git status --porcelain` (default) and `git status
  --porcelain -z` (`xxd`/`cat -A` to see exact byte boundaries). Confirmed:
  - Default mode quotes the untracked path: `?? "untracked with space.txt"`
    — the old code's `.pop()` on whitespace-split yields
    `"space.txt"` (with literal quote characters), never matching a real
    file.
  - `-z` mode never quotes, ANY path, regardless of spaces: `?? untracked
    with space.txt\0` (raw bytes, confirmed via `xxd`).
  - A rename record in `-z` mode is `R  renamed file.txt\0normal.txt\0` —
    the DESTINATION path first (no `->` arrow, unlike default mode), then
    a SEPARATE NUL-terminated token holding the origin path. This is new,
    concrete evidence needed to implement the `-z` fix correctly: a naive
    "one path per record" parse would misread the origin-path token as a
    second, unrelated changed file.

**Decided:** switch to `git status --porcelain -z` (the report's second
suggested option) rather than unquoting the default format's C-style
escapes in place — `-z` never produces a quoting/escaping problem to begin
with, closing the whole class of bug (not just the specific space-in-
filename case the report names), and needs no separate unquote/unescape
helper function. Parse as NUL-delimited records (`status = entry.slice(0,
2)`, `path = entry.slice(3)`), and when `status` names a rename/copy
(`R`/`C` in either position), skip the ONE extra NUL-terminated token that
follows (the origin path) — confirmed necessary and sufficient by the
empirical byte-level check above, not assumed from documentation alone.

**Remaining open:** none.

**Verify (real, runnable):**
```
node --test test/runner/claim-liveness.test.mjs test/runner/claim-port.test.mjs
```
(existing suites covering `lastActivityAt`/`isReclaimEligible` and the
stale-claim reclaim pre-check that consumes them; two new cases added
proving Finding 9's exact scenario is closed — an untracked file with a
space in its name, and a rename into a spaced filename exercising the `-z`
rename record's extra origin-path token.)
