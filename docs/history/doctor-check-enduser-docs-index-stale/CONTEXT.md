# doctor check + fix for enduser-docs-index.json drift (tsk-1m0)

## Feature boundary

Add a `fgos doctor` check (`enduser-docs-index-stale`) that reports how many
on-disk end-user docs are missing from `docs/enduser-docs-index.json`, plus a
`fgos doctor --fix` fix for the same id that regenerates the index. Both are
new registrations in `src/setup/registrations.mjs`, following the
`changelog-unreleased-stale` check (tsk-3ip, same file) as the direct
precedent. No CLI surface changes, no new verbs — only new entries in the
existing `registerCheck`/`registerFix` registry.

This item is the observe/remind half of a larger, still-undecided
storytelling-pipeline question (`docs/history/compound-learn-artifact-
registry/DISCUSSION.md` §6.4) — per that discussion's R6/vòng-4 finding, the
observe/remind class survives every candidate pipeline design and is safe to
build now, independent of which §6.4 option is eventually chosen. Nothing in
this item depends on that open question.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Check id is `enduser-docs-index-stale`. Message reports a **count**, not a list of missing paths (e.g. `"85/236 tài liệu end-user chưa có trong index — chạy fgos docs-index"`) — same DEM-not-mảng discipline `changelog-unreleased-stale` already uses. |
| D2 | Scope is one-directional: on-disk docs missing from the index only. The check does **not** flag orphan index entries (an index row whose `docPath` no longer exists on disk) — real measured drift (2026-08-08, 2026-08-09) shows 0 such orphans on either measurement, and the item's own acceptance-criteria test list (drift / no-drift / missing-index-file / alias case) names no orphan-entry test. Out of scope for this item; a future item can add it if orphans are ever observed. |
| D3 | The check computes drift **read-only**: it enumerates `docs/<quadrant>/` (+ `QUADRANT_DIR_ALIASES`) itself, the same enumeration `bin/fgos.mjs`'s `docs-index` case already does, then calls the pure `buildEnduserIndex` (`src/report/enduser-index.mjs`, zero I/O) to get the current in-memory manifest, and diffs its `docPath` set against what `docs/enduser-docs-index.json` holds on disk. It never calls the `docs-index` verb itself (that verb has `externalEffect` — it writes) and never writes anything. |
| D4 | The fix reuses the exact generation path the `docs-index` verb already runs (enumeration + `buildEnduserIndex` + the same write-only-if-changed guard) rather than re-implementing index generation — fix output stays byte-identical to running `fgos docs-index` directly. Implementation is free to extract a small shared helper the CLI case and the fix both call, or have the fix invoke the verb in-process; either way the generation logic itself is not duplicated. This is an implementation-shape call for `fgos-coding-planning`, not re-litigated here. |
| D5 | A missing `docs/enduser-docs-index.json` or a missing quadrant directory is normal, not a failure — same "absent capability = clean skip" contract `checkChangelogUnreleasedStale`/`checkDependenciesInstalled` already give their own missing-prerequisite cases (a fresh fgOS consumer project has neither yet). `passed: true` with an explanatory message in that case. |
| D6 | `QUADRANT_DIR_ALIASES` (`docs/decisions` → `explanation`) is honored exactly as the `docs-index` verb already honors it — no new aliases invented, none dropped. |
| D7 | `resolveMainCheckout(cwd) ?? cwd` is the root the check/fix operate against — same resolution `checkChangelogUnreleasedStale`/`checkDependenciesInstalled`/`checkRootDrift` already use, so a worktree session's doctor run reads/writes the shared main-checkout `docs/` tree, not a worktree-local copy. |

## Pinned terms

- **Drift** — the count of on-disk end-user docs (under the four Diataxis
  quadrant dirs + their aliases) whose `docPath` is absent from
  `docs/enduser-docs-index.json`.
- **End-user doc** — any `.md` file directly under `docs/<quadrant>/` or one
  of its aliased dirs (today: `docs/decisions/` aliasing `explanation`), per
  `enduser-index.mjs`'s existing `QUADRANTS`/`QUADRANT_DIR_ALIASES`.

## Scout evidence

- `src/setup/registrations.mjs:735-787` — `changelog-unreleased-stale`
  (tsk-3ip): the direct precedent for shape (`registerCheck`, count-only
  message, missing-file-is-normal handling via `resolveMainCheckout(cwd) ??
  cwd`).
- `src/setup/registrations.mjs:65-136` — `registerCheck`/`registerFix`
  registry functions themselves; both independent, no forced pairing (D2 of
  the registry's own CONTEXT.md).
- `src/report/enduser-index.mjs:120-139` — `buildEnduserIndex`, pure
  transform (zero imports, no I/O), takes `docEntries` + `outcomesView`,
  returns the manifest array with `docPath` per row.
- `bin/fgos.mjs:2114-2199` — the `docs-index` verb's real implementation:
  enumerates `docs/<quadrant>/` + alias dirs via `fs.readdirSync`, sorts for
  determinism, calls `buildEnduserIndex`, writes
  `docs/enduser-docs-index.json` only when content actually changed. This is
  the one path D4's fix must reuse rather than reimplement.
- `test/setup/checks.test.mjs:14,51-171` — `DOCTOR_CHECKS`/`FIX_REGISTRATIONS`
  import shape, the full-registry-list assertion this item's test must
  extend, and the three-branch test pattern (`changelog-unreleased-stale`)
  this item's own tests mirror (missing file / no drift / drift), plus a
  fourth branch this item's own acceptance criteria adds: the
  `docs/decisions` alias case.
- `fgos tool query --capability impact-analysis --status present` →
  GitNexus present (`impact-analysis: full` per `CLAUDE.md`'s gate).
  Informational only — this skill made no code changes, so no impact-analysis
  run was needed for this stop.
- `docs/history/compound-learn-artifact-registry/DISCUSSION.md` §3 dòng K,
  §6.4 R6, vòng 4/5 — confirms the observe/remind class (this item) is
  already-settled scope, independent of the still-open storytelling-pipeline
  question.

## Canonical references

- `src/setup/registrations.mjs` (registry + `changelog-unreleased-stale`
  precedent)
- `src/report/enduser-index.mjs` (`buildEnduserIndex`, `QUADRANTS`,
  `QUADRANT_DIR_ALIASES`)
- `bin/fgos.mjs` (`docs-index` case, the generation path to reuse)
- `test/setup/checks.test.mjs` (test pattern to extend)
- `docs/history/compound-learn-artifact-registry/DISCUSSION.md` (broader
  context, R6/§6.4)

## Outstanding questions

None
