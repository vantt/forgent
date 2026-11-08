# HARDEN T6 P07: conductor entry (lead report)

Landed on main `a7b70d50f..bb388da2e` (red proofs, the change, suite baseline).

## What changed
- `propose` continues a case through `inheritCandidates` (in `case-inherit.mjs`): only ledgers whose raw bytes carry both `case.opened` and `case.closed` are candidates; `inheritFrom` reads the ledger once, checks closed / guide / request / base commit on events, and builds the digesting projection only for a case that passes. The discarded guard read is gone. Directories that are no case (`.bindings`, stray) are never read.
- One glob engine in `write-scope.mjs` (`walkGlobs`, entry points `globsMeet` and the scope matcher). Escape set is the scope matcher's. Real defect found: the proposal's copy left `?` unescaped (`a?*` met `a.txt`).
- `normalizeWrite` is a view over `canonicalizeWriteEntry`; the validator calls one.
- Slice shape checked once, by `checkManifest` (now also checks a read-only slice's `capability` and `pattern` are text; without it a numeric pattern crashed the frame). Frame and validator trust input; `slice-duplicate`, both re-checks and the read-pass shape check are gone.
- Dead exports dropped: `inheritableMilestones`, `CASE_PLACEHOLDER`, `FORBIDDEN_WRITE_ROOTS`, `defaultTable`. Kept as owning proofs: `planCaseSlug`, `readPassRigor`, `createProposePorts`, `loadSliceTable`, `TEST_SCAN_LIMITS`.

## Measurement (propose on the 55-ledger checkout, in-process, native door warmed)
| build | load (1 min) | p50 | note |
|---|---|---|---|
| before | ~4.5 | 2.29 s | first measure, door cold, 7 runs |
| before | ~33 | 3.89 s | same-load pair, 5 runs |
| after | ~33 | 0.35 s | same-load pair, 5 runs |
| after | 13-22 | 0.88 s | door cold (debug addon hash dominates; not propose logic) |
findInherit alone: 2.06 s -> 0.09 s at load ~25. Quiet-load number is not taken; target 0.35 s is met only at the same-load pair, and the activated-release number belongs to the measure phase.

## Retired tests and owners
Approved by the HARDEN lead before landing.
1. frame test "two slices with one id, ... unknown rigor and unknown pattern": owner `propose.test.mjs` refusal table (duplicate id, writes not a list, read-only unknown rigor, wrong-typed capability/pattern); unknown pattern kept in the frame test.
2. frame test "sparse writes list, sparse slice list, symbol rigor": behaviour gone; the only caller of the entry is `runPropose` in `bin/fgos.mjs` (workflow propose arm), which builds the list with JSON.parse (grep of bin, src, scripts, core, domains: no other caller).
3. frame test read-pass rigor assertion: passes are generated inside `propose.mjs`; removed.
4. validate test malformed-slice rows: owner as in 1.
5. validate test `FORBIDDEN_WRITE_ROOTS` self-compare: removed.
New: `write-scope-globs.test.mjs` (owner of the engine; not in `write-scope.test.mjs` because that file also runs against the native leaf), one W-1 test in `propose.test.mjs` (parses only closed-case ledgers; finds a matching closed case).

## Contract notes
- Paths the scope reader refuses (backslash, leading `:`, `**` in a name) are refused at classification as `slice-write-invalid` (was `write-path-invalid`); `.` reads as `**` and is refused as reaching `.git` (was `write-path-invalid`). Skill refusal table updated; CHANGELOG line added.
- Raw-byte prefilter depends on compact `"type":"case.closed"` JSON; the positive-find test would fail if serialization changed.

## Size
src -8 net (+119/-127), tests +68 (+96/-28; new glob file, new inherit/refusal rows). Phase estimate Node -70 / tests -50 not reached: the retired groups were small and the new engine file and rows were added. `propose.mjs` 639 lines (budget 640), no function over 120.

## Gate
Focused 431 pass (propose*, write-scope, parity, case-verbs, conductor-case, case-admission, CLI propose and doors, architecture, doc-health, citation drift); one-door scan 0 undeclared. Full suite: 8565 pass, 2 fail: V7n addendum (known red) and `claim-port` (killed at the per-file limit under load ~38; passes alone, 21/21).

## Process slip
A rebase stopped on a conflict while I pushed `HEAD`, so main carried the red-proof commit alone for a few minutes (`a7b70d50f`, two failing tests) until the fix landed. No other lane was affected as far as seen.

## Smoke
Propose run on this checkout (55 ledgers) returns the same refusal set as before (`gate-command-missing` only, config declares no gate). Scratch JS project smoke: not run (no change to project-local behaviour beyond the above).
