# tsk-2uo — allowlist 4 files in launcher-vocabulary-guard

Mode: **tiny** (1 flag: existing covered behavior — this touches an
existing test's own allowlist data. No auth/data-model/public-contract/
cross-platform/multi-domain flags apply; a single-file text addition).

No local `CONTEXT.md` — direct-entry item, discovered mid-tsk-592, not
shaped via `fgos-coding-shaping`/`fgos-coding-exploring`. The item's own
description (written with full context of the discovery) is the whole
spec.

## Approach

`test/docs/launcher-vocabulary-guard.test.mjs`'s `ALLOWED_FILES` map
(lines 71-90) already lists 18 entries, each a specific, checked reason a
file legitimately still contains the pinned pre-launcher-rename term
(decision record 0028) post-tsk-2cw rename. Add 4 more, following the
exact same `[path, reason]` shape:

| File | Real reason (confirmed by reading each file) |
|---|---|
| `docs/history/backlog-execution-reconciliation/RECONCILIATION.md` | Its one hit (line 166, `### STR27`) reconciles against `docs/backlog.md`'s own STR27 row — already allowlisted there for the same "continuous fleet/mechanical-picker loop, reserved future meaning" reason. This file just cites that same row. |
| `docs/history/tsk-33w-capacity-dispatch-command-audit-field/iron-law-evidence.md` | Meta-citation of the guard's own pre-existing-failure report (describes `test/docs/launcher-vocabulary-guard.test.mjs` itself failing, quoting its error text) — same shape as `docs/decisions/0028-...md`'s existing "the decision record ABOUT the rename" allowlist entry, one layer removed. |
| `docs/history/tsk-4eu-executors-key-tier-validation/iron-law-evidence.md` | Same meta-citation shape as tsk-33w's entry above. |
| `docs/how-to/produce-failing-test-first-proof-for-an-iron-law-gated-diff.md` | Documents a real historical incident in the guard test itself (a false-pass caused by `git ls-files` skipping uncommitted files during tsk-2cw's own original rename) — a genuine "war story," same reasoning as `docs/decisions/0028-...md`'s own allowlist entry. |
| `plans/260808-2210-dispatch-vocabulary-rearrange/next-session-prompt.md` | **Scope revised during implementation** (originally left out, see below). Discusses the pinned pre-launcher-rename term as tsk-5td's own subject matter (citing 0026/0028/tsk-2cw history while analyzing the dispatch-layer vocabulary) — same reasoning as `docs/history/gate-question-quality-and-routing/DISCUSSION.md`'s existing allowlist entry, not prose this item has authority to rewrite. |

**Scope note (implementation-time correction):** the plan originally left
this 5th file out, reasoning it was "a live artifact of tsk-5td's own
in-progress session" that shouldn't be permanently allowlisted. That left
the item's own `verify` (the guard test as a whole) still red — a real
tension surfaced only once the other 4 files were actually fixed and
`node --test` was run. Presented to the user: allowlist the 5th file too
(matching an already-precedented allowlist reason), vs. narrow `verify` to
a check scoped to just the 4 planned files. User chose to allowlist it —
the guard test itself is a text-content NEGATIVE check, not a "session
still in progress" tracker, so a citation-shaped use of the pinned term is
exactly what the allowlist already exists for elsewhere in this same file.

Impact-analysis posture: not applicable — no code symbol is touched, only
test-file allowlist data (a `Map` literal); nothing here leans on
blast-radius evidence.

## Risk map

| Component | Risk | Proof point |
|---|---|---|
| `ALLOWED_FILES` map edit | low — pure additive data, no logic change | `node --test test/docs/launcher-vocabulary-guard.test.mjs` goes green (the item's own recorded `verify`) |

## No split

One file, one map literal, four entries. Proceeds as itself.

## Outstanding questions

None
