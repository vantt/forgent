# Windows CI Hardening

Status: PROPOSED — Phase 00 open now; Phases 01–04 unblocked, can run in any order
or in parallel (different files/subsystems). Phase 05 depends on 01–04 landing.
Created: 2026-09-24. Source: this session's direct investigation of 4 real
Windows-inclusive CI runs (35966831177, 35970771095, 35975484603 on
`vantt/forgent`) after the user decided fgOS builds and supports Rust binaries
(`fgctl`/`herdr`/`fgos`) on Windows, not just legacy-node.

## Where things stand

`ci.yml`'s `test` job now runs `cargo build --release --workspace` on
`windows-latest` too (previously skipped). Three commits already landed on
`main` fixing verified root causes:

- `8c4a6989` — `ps -o ppid=` (Git-for-Windows rejects the syntax, its stderr
  corrupted the calling `fgos` process's own stderr), the
  `new URL(import.meta.url).pathname` doubled-drive-letter bug (3 files),
  `provisionDependencies`'s missing-shell `npm` `ENOENT`.
- `f169978d` — the same doubled-drive-letter bug in 8 more files, `fgctl.exe`
  missing-suffix in 3 test fixtures, `worktree.test.mjs`'s own missing-shell
  `npm` `ENOENT`, 13 tests depending on a POSIX-shebang `herdr` test double
  skipped on `win32` (production's real herdr spawn deliberately runs
  `shell: false`; faking that on Windows would mean weakening a security
  contract for a test double), and an unrelated (non-Windows) `herdr`-on-PATH
  test bug that was failing on Linux/macOS too.
- `e2fc7754` — the same missing-`.exe`-suffix bug for `fgos` (the Rust host
  binary, distinct from `fgctl`) in 3 more call sites; extracted the rule into
  `src/util/release-binary-path.mjs` instead of re-deriving it a fourth time.

Result: ubuntu-latest is fully green. macos-latest is green except one
apparent timing flake (Phase 01 below). windows-latest dropped from 589 to
524 failing tests — every previously-identified root cause is now at 0
occurrences, but the remaining 524 no longer share one or two dominant
causes; they're a long tail across many subsystems. That's why this is a
plan instead of a fifth commit: each remaining cluster needs its own
diagnosis, and clustering by raw assertion text (`grep -c "✖"`) stopped being
useful once the top bucket splintered into ~15 unrelated test files.

Raw job logs for the last run are not preserved anywhere durable — GitHub
artifact retention on `full-results-windows-latest` is 14 days from
2026-09-24. Re-download via `gh run view <id> --log --job <id>` before that
window closes if this plan sits unstarted; otherwise Phase 00 has to
re-derive the categorization from a fresh CI run.

## Phases

| # | Phase | Cluster | Est. failures | Confidence |
|---|---|---|---|---|
| 00 | [Fresh evidence snapshot](phase-00-evidence-snapshot.md) | re-run + re-categorize | — | — |
| 01 | [Concurrency/timing flake review](phase-01-concurrency-timing-flakes.md) | `Unit 2E` family + sibling-process races | ~15 | medium (same family failed on macOS too) |
| 02 | [Path case-sensitivity / worktree identity](phase-02-worktree-identity-case-sensitivity.md) | `isMainWorktree`, `retargetMember`, agy trust-store | ~10 | medium (has a concrete hypothesis, unverified) |
| 03 | [Rust-side release staging on Windows](phase-03-rust-release-staging-windows.md) | `fgctl-stage.test.mjs` quarantine/symlink/filename-syntax | ~10 | low (may need Rust source changes, possibly Windows Developer Mode gap) |
| 04 | [CLI message-format & JSON-parse failures](phase-04-cli-message-format-json-parse.md) | Iron Law/forbidden regex mismatches, `Unexpected end of JSON input`, `undefined.status` | ~40 | low (not yet root-caused) |
| 05 | [Long-tail sweep](phase-05-long-tail-sweep.md) | whatever remains after 01–04 | ~450 | none yet — this phase's job is to re-cluster what's left |

## Dependencies

```text
P00 (fresh snapshot) ──► confirms/revises the cluster boundaries below
P01, P02, P03, P04 ── independent, any order, can run in parallel worktrees
P05 ──► after P01-04 land (re-triage against a smaller remainder)
```

## Acceptance criteria (per phase)

- The phase's named failure cluster is either fixed (with a real Windows CI
  run — 35966831177 through 35975484603 all prove local-Linux-green is not
  sufficient evidence) or documented as an accepted, scoped gap with a named
  reason (matching the `mockHerdr` skip precedent from `f169978d`).
- No fix trades a real product contract (e.g. `shell: false` on a herdr
  spawn) for a green Windows checkbox — see `e2fc7754`'s commit message and
  `f169978d`'s `mockHerdr` skip for the standard this track already set.
- `npm test` stays green on Linux/macOS after each phase (regression gate).

## Worktree rule

Same discipline as `260920-2217-dispatch-engine-hardening`: `main` is a
shared checkout with other tracks landing on it concurrently. Each phase
works in its own worktree branched from current `main`, merges straight back
to `main` on green, no waiting on sibling phases unless a real file
conflict is named above.
