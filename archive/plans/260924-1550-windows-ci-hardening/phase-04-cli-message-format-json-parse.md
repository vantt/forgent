# Phase 04 — CLI message-format & JSON-parse failures

## Context

`plan.md` § Where things stand; `phase-00-evidence-snapshot.md`'s buckets:
`Cannot read properties of undefined (reading 'status')` (11),
`/Iron Law/` regex mismatch (8), `Unexpected end of JSON input` (7),
`/explicitly forbidden/` regex mismatch (7), `/not committed at the main
checkout's HEAD/` (3), `/runner-sourced item/` (2), `/not clean/` (2),
`stderr must report lock-held` (2), `the refusal tells the caller how to
proceed` (2), `Command failed: node bin/fgos.mjs topic register ...` (2).

None of these were investigated this session — they're grouped here on
**shape alone** (regex-against-CLI-output mismatches, and JSON.parse
failures on CLI output), not on a confirmed shared root cause. Two live
hypotheses, both unverified:

1. **Embedded absolute paths break regex assertions.** A refusal message
   that includes a repo-relative or absolute path (`.../main checkout's
   HEAD`, `not clean`, etc.) may embed a Windows backslash path where the
   test's regex expects a forward-slash path (or vice versa), failing the
   `assert.match` even though the refusal itself fired correctly. If true,
   the fix is almost always in the TEST's regex (normalize the expected
   pattern to tolerate both separators), not in the CLI's own message
   formatting — verify which side actually needs to change per case;
   don't assume the product message is wrong.
2. **`Cannot read properties of undefined (reading 'status')` /
   `Unexpected end of JSON input`** suggest a spawned `fgos`/`fgctl`
   subprocess produced EMPTY stdout where a test expected a JSON envelope,
   most likely because the process crashed or exited before writing output
   — which points back at whatever underlying bug crashed it, not at the
   JSON-parsing test code itself. These may not be a single cluster at all;
   each occurrence could have its own crash cause. Do NOT batch-fix by
   wrapping `JSON.parse` in a try/catch or similar — that hides the real
   crash instead of finding it.

## Requirements

1. Pull the full stack trace + preceding CLI invocation for each of the 11
   `undefined.status` and 7 `Unexpected end of JSON input` failures from a
   fresh Windows CI log (Phase 00's rerun). Group by which CLI subcommand
   was being invoked — if they cluster around one or two commands, that's
   the real lead, not "JSON parsing in general."
2. For each regex-mismatch bucket (`/Iron Law/`, `/explicitly forbidden/`,
   `/not committed.../`, `/runner-sourced item/`, `/not clean/`), pull the
   ACTUAL vs EXPECTED strings from the CI log (the assertion failure prints
   both) and diff them character-by-character to confirm or refute
   hypothesis 1 before touching anything.
3. Fix each confirmed cause. Expect this phase to split into several
   independent, unrelated small fixes rather than one unifying change —
   don't force a shared abstraction where the evidence doesn't support one
   (contrast with Phase 02/03, which do have single named hypotheses).

## Files

Unknown until Requirement 1–2 above identify them. Do not guess file names
here — this phase starts from raw CI log evidence, same discipline this
session used for every confirmed fix (`grep`/log-first, edit second).

## Validation

Each confirmed-and-fixed sub-cluster passes on a real Windows CI run.
Regex-pattern fixes are verified to still correctly REJECT a genuinely wrong
message (i.e. don't loosen a regex so much it stops proving anything) —
add or check a negative-case test alongside any regex change.

## Risks

This is the least-scoped phase in the plan (176 "strictly equal" failures
haven't even been attributed to test files yet, only 61 of the ~524 total
failures have a named home here). It may need to split into 3-5 smaller
phases once Phase 00's fresh categorization lands — treat the counts and
scope here as a starting hypothesis, not a commitment.

## Resolution & Findings

- **Status**: COMPLETED & VERIFIED.
- **Root Causes Confirmed**:
  1. **Empty JSON Output / Process Premature Exit**: Subprocesses exited before emitting expected JSON payloads due to:
     - Verbatim UNC paths (`\\?\...`) passed through `apps/fgos/src/legacy_exec.rs` to Node.js scripts.
     - Windows user home resolution: Windows sets `USERPROFILE` rather than `HOME`, causing setup directory resolution (`src/setup/dir-resolution.mjs`) to return undefined in isolated environments.
     - Process liveness checks in `packages/distribution/rust/src/lock.rs` using Unix-only signals (`kill(pid, 0)`).
  2. **Regex Mismatches (`/Iron Law/`, `/explicitly forbidden/`)**:
     - Path formatting differences: Refusal messages embedded Windows backslashes (`\`) and drive letters (`D:\...`) while regexes expected POSIX forward slashes (`/...`).
     - Line ending differences: Windows subprocess stdout emitted CRLF (`\r\n`), tripping multiline regex anchors (`^` and `$`).
  3. **Test Fixtures & Script Harnesses**:
     - Shell scripts with POSIX-specific constructs run via `exec` instead of cross-platform Node / batch runners.
- **Fixes Applied**:
  - `apps/fgos/src/legacy_exec.rs` & `packages/distribution/rust/src/verify.rs`:
    - Normalized UNC paths to standard Win32 paths before spawning Node.js.
  - `packages/distribution/rust/src/lock.rs`:
    - Implemented Win32 `OpenProcess` / `GetExitCodeProcess` for accurate process liveness checks on Windows.
  - `src/runner/github-adapter.mjs`, `src/util/session-identity.mjs`:
    - Handled `USERPROFILE` fallback and Windows process identity.
  - Test suites (`test/setup/*`, `test/runner/*`, `test/cli/*`):
    - Normalized path separators in test assertions (`pathsEqual` / `path.normalize`).
    - Handled CRLF in regex matchers and string comparisons.
    - Updated test harness helpers (`test/setup/helpers/setup-checks-harness.mjs`, `test/rust-host/harness.mjs`).
- **CI Verification**:
  - Commits: `f0b9a3466`, `06b4ad197`, `a59e00eeb`.
  - Confirmed regex and JSON parse failures dropped to 0 on Windows CI.

