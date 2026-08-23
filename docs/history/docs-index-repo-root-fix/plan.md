# tsk-1wn — plan

Decisions: `docs/history/docs-index-repo-root-fix/CONTEXT.md` (D1-D3).

## Mode

Flags counted: auth(no) · authorization(no) · data model(no) ·
audit/security(no) · external systems(no) · public contracts(no — the
registry flags are declarations only, not wired into dispatch/authz, per
`command-registry.mjs:24`) · cross-platform(no) · existing covered
behavior at risk(no — no CLI-level test currently exercises `docs-index`
at all, `command grep -n "'docs-index'" test/cli/fgos.test.mjs` = zero
hits) · **weak proof around the area(yes** — that same absence of
coverage is exactly the gap this item must close) · multi-domain(no).

**1 flag → small.** A few files, decisions already fully locked in
CONTEXT.md, no gray areas left to discover mid-build.

## Approach

Fix `repoRoot` at the source (D1), correct the registry labels to match
(D2), and add the no-lock guard + sort (D3) — all inside the same
`case 'docs-index'` handler and its registry entry, so this is one
cohesive piece, not a split. `fgos graph --json` shows `tsk-1wn` as an
isolated size-1 component — no dependency ordering to reconcile with
other in-flight work.

Rejected alternative: leaving `repoRoot` alone and only adding a
main-checkout-lock (the original bug report's proposal) — rejected per
D3, would add a new failure mode without fixing the actual mistargeted-
write root cause.

### Risk map

| Component | Risk | Proof point (for fgos-coding-validating) |
|---|---|---|
| `repoRoot` resolution | medium — must match `dir`'s own `--dir`-aware resolution exactly, including the no-`--dir`-passed default case | a test that runs the verb from a cwd that is NOT the resolved root and asserts the manifest lands at the resolved root, not cwd |
| Registry label correctness | low — pure metadata, `fgos-manifest.test.mjs` already exists to pin manifest shape and its own `requiresExistingStore ⇒ touchesState` invariant (D4) | extend that test file's existing assertions to cover `docs-index`'s `externalEffect` field; existing invariant test already guards the other two |
| Write-only-if-changed guard | low — pure logic, no I/O ordering risk | a test that runs the verb twice with unchanged doc content and asserts no error /consistent output; a second run with changed content asserts the file DOES update |
| Deterministic sort | low | a test with docs seeded in reverse-alphabetical dir order, asserting manifest order is stable/sorted |
| `fgos-indexing` SKILL.md wording | low — prose only | none needed; covered by the item's own review, not an automated check |

## Files touched

- `bin/fgos.mjs` — `case 'docs-index'`: derive `repoRoot` from the same
  root `dir` resolves from (not raw `process.cwd()`); add sort of
  `docEntries` before building the manifest; add the write-only-if-changed
  guard around the final `fs.writeFileSync`.
- `src/cli/command-registry.mjs` — `docs-index` entry: `externalEffect:
  true` only (D4: `requiresExistingStore` stays `false` — flipping it
  would fail the existing `requiresExistingStore ⇒ touchesState`
  invariant test in `test/cli/fgos-manifest.test.mjs:60-67`).
- `.claude/skills/fgos-indexing/SKILL.md` and every other committed copy
  (`command grep -rl "Run \`fgos docs-index\`"` to find all of them, e.g.
  `.agents/skills/fgos-indexing/SKILL.md` mirrors it today) — instruct
  passing `--dir <mainRoot>`, resolved the same way `fgos-routing`'s own
  guidance already describes.
- `test/cli/fgos-manifest.test.mjs` — extend for D2's corrected flags.
- `test/cli/fgos.test.mjs` — new test(s) for D1 (repoRoot targeting) and
  D3 (guard + sort behavior).

## Cases to prove (fgos-coding-validating)

- Run `docs-index` from a cwd that differs from the resolved main-checkout
  root (simulating a worktree session) → manifest lands at the resolved
  root's `docs/enduser-docs-index.json`, not the cwd's.
- Run twice with no doc changes between runs → second run does not
  rewrite the file (no spurious mtime/git-dirty change).
- Run with an actual doc added between runs → file DOES update, new entry
  present.
- Docs seeded across quadrants in non-alphabetical directory-read order →
  manifest entries come out in a stable, deterministic order run-to-run.
- Manifest fields (`externalEffect`, `requiresExistingStore`,
  `touchesState`) for `docs-index` match D2 exactly via
  `fgos --help --json`.

## Split

None — one honest piece of work, proceeds as itself (`tsk-1wn`).
