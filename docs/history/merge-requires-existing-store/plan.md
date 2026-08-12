# tsk-66x — plan

## Mode gate

Flags counted against the mechanical list (auth, authorization, data
model, audit/security, external systems, public contracts,
cross-platform, existing covered behavior, weak proof around the area,
multi-domain):

- **public contracts** — yes. `src/cli/command-registry.mjs` is the CLI's
  own machine-readable verb manifest ("zero-translation for any
  tool-schema-based agent" per its file header) — flipping
  `requiresExistingStore` changes `merge`'s real failure-mode contract
  (empty-but-valid JSON → exit 4 refusal) for every downstream caller,
  including `/fgOS:merge-list`/`/fgOS:merge-next`/`/fgOS:merge-loop`.
- **existing covered behavior** — yes. `test/cli/fgos.test.mjs` already
  has a `merge list`/`merge next` suite (empty-store, ready/waiting/
  conflicts, Iron Law) and `test/cli/fgos-manifest.test.mjs` asserts a
  structural invariant over every registry entry's
  `requiresExistingStore`/`touchesState` pair — both must keep passing,
  and the new refusal path needs its own new coverage.
- Every other flag: no (no auth/authz/data-model/audit-security/external-
  system/cross-platform/multi-domain surface here; proof is not weak —
  scout evidence is a direct precedent match plus a prior independent
  live-reproduction, `impact-analysis: full` per below).

2 flags → **standard**. A `small` write-up would not honestly cover it:
this is a public-contract-shaped change (CONTEXT.md D1) sitting on top of
an existing test suite that both needs to keep passing and needs new
coverage proving the fix — worth naming explicitly rather than leaving
implicit.

The actual footprint stays small regardless — one field flip plus
additive tests, no new abstractions, no split (see below).

## Impact-analysis posture

`impact-analysis: full` — `fgos tool query --capability impact-analysis
--status present` returns `gitnexus` as `present` (same read already
recorded in CONTEXT.md's scout evidence). The one proof point below that
leans on blast-radius evidence (does anything besides
`fgos-manifest.test.mjs`'s own invariant test assert `merge`'s current
`requiresExistingStore: false`?) is confirmed directly by test-suite
reading already, not GitNexus — no code symbol is being renamed or has
callers to trace, so GitNexus's impact tool has nothing further to add
here beyond the manifest invariant test already read during exploring.

## Approach

Change exactly one field (CONTEXT.md D1): `src/cli/command-registry.mjs`,
`merge`'s registry entry (currently line 439),
`requiresExistingStore: false` → `true`. This is the entire production
change — `bin/fgos.mjs`'s `main()` pre-handler guard (line 3099) already
does the hard refusal (`.fgos/ not found...`, exit 4) for any
`requiresExistingStore: true` verb; no new guard, message, or dispatch
logic is written (CONTEXT.md D3).

Alternatives rejected:
- Adding `merge` to `STORE_MISSING_WARNING_VERBS` instead (soft stderr
  warning, still returns empty `data`) — rejected per CONTEXT.md D1's own
  framing: an unattended `merge-loop` parsing only stdout JSON would
  never see a stderr line, so this would not actually close the false-
  negative the item reports.
- Adding a bespoke guard inside `merge`'s own dispatch case
  (`bin/fgos.mjs:1337-1373`) — rejected: duplicates a mechanism that
  already exists and is already proven correct for `approve`/`rebuild`/
  `repair`.
- Auditing/fixing `evolve`'s similar-looking flag combination in the same
  pass — rejected per CONTEXT.md D2: already a deliberate, previously
  decided exemption (`command-registry.mjs:690-700`), not this item's gap.

## Files touched

- `src/cli/command-registry.mjs` — flip the one field (production fix).
- `test/cli/fgos.test.mjs` — new test coverage for the refusal path (see
  Shape below). No existing test in this file currently asserts the old
  empty-result behavior for a missing store on `merge` specifically (the
  two existing "on an empty store" tests both `run(cwd, ['init'])` first,
  i.e. store exists but has no items — a different case that keeps
  passing unchanged).
- `test/cli/fgos-manifest.test.mjs` — no edit needed; its structural
  invariant (`requiresExistingStore` true ⇒ `touchesState` true, line
  65-67) already holds for `merge` (`touchesState: true` already) so the
  flip does not violate it. Confirmed by reading, not guessed.
- `docs/history/merge-requires-existing-store/plan.md` — this file.

No skill file (`plugins/fgOS/skills/merge-list|merge-next|merge-loop/
SKILL.md`) needs editing — CONTEXT.md D3.

## Ordering

`fgos graph --json` was read (per this skill's own step 3): `tsk-66x`
does not appear in `criticalPath` or `topUnblock` — it has no deps and
nothing else in the current graph names it as a dependency. Single-piece
item, no ordering decision to make.

## Risk map

| Component | Risk | Proof point (→ fgos-coding-validating) |
|---|---|---|
| `command-registry.mjs` field flip | low | `fgos-manifest.test.mjs`'s existing invariant test still passes (already confirmed true/true pairing by reading, per Files touched above); re-confirm by actually running the suite once the flip lands. |
| New refusal-path test(s) | low | The tests themselves are the proof — `node --test test/cli/fgos.test.mjs` green, specifically the new cases below. |
| Downstream skill consumers (`merge-next`/`merge-loop`) | low | No code in these files changes (D3). The claim that `merge-next`'s step 2 already separates "command fails" from "reported blocked outcome" is a prose-reading claim from `fgos-coding-exploring`'s scout, not something `npm test` covers — `fgos-coding-validating` should re-read `plugins/fgOS/skills/merge-next/SKILL.md` lines 39-42 directly as its proof point, not take CONTEXT.md's citation on faith. |

## Shape (standard)

Concrete cases to prove, sized to `standard` (not the fuller sketch a
`high-risk` item would need):

1. **`merge list` on a directory with no `.fgos/` at all** (mirrors the
   existing `submit` test at `fgos.test.mjs:459`, `rawTmpCwd()`, no
   `init`): exit 4, stderr matches `/\.fgos\/ not found/`, no `.fgos/`
   created as a side effect.
2. **`merge next` on the same missing-store setup**: exit 4, same stderr
   match, no event appended anywhere (nothing to append to).
3. **The item's own literal repro** — `merge next` run from inside a
   linked worktree without `--dir` while the main checkout's real store
   has a ready item (mirrors `init`'s own linked-worktree test at
   `fgos.test.mjs:468`, using the same `tmpLinkedWorktree()` helper):
   exit 4, refused — never the old
   `{picked: null, reason: "nothing ready to merge"}`.
4. **Regression check**: the two existing "on an empty store" tests
   (`fgos.test.mjs:6489`, `:6547`, both `init` first) still pass
   unchanged — store exists, genuinely no items, exit 0, empty result is
   still the correct answer for that case.

No boundary/concurrency/partial-failure sketch beyond these — the change
has no concurrent-access surface of its own (it only gates whether
`merge`'s handler runs at all; `approve`'s own concurrency handling,
exercised by the recursive call, is unchanged and out of scope).

## Split

None. One honest piece of work — a single registry field plus its
regression/refusal test coverage, one commit, no child items.

## Verify

`node --test test/cli/fgos.test.mjs test/cli/fgos-manifest.test.mjs` —
covers the new refusal-path tests, the two unchanged empty-store tests,
and the manifest's structural invariant test, all in the two files this
item actually touches. (Supersedes the work record's placeholder "chưa
xác định — P15 bổ sung" — `fgos-coding-validating`/execution should set this as
the item's real `verify` command.)
