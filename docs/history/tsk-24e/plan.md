# tsk-24e — events.jsonl concurrent data-loss evidence — plan

Mode: **tiny**

Flags counted against `fgos-routing`'s Mode gate: none apply to this
item's OWN remaining scope. This item's evidence-gathering/diagnosis work
is already done (`CONTEXT.md` D1-D3, `RESEARCH.md` Rounds 1-2); its
implementation scope was going to hit the hard-gate `data loss`/
`audit/security` flags (it touches `.fgos/events.jsonl`, the platform's
own audit trail) — but D3 (locked, user-approved) narrows this item to a
thin pass-through: no source code changes of its own, no split. The
actual fix rides on `tsk-1ji` (already open, `deps: [tsk-24e, tsk-cgg]`,
being planned by a different concurrent session — see D3), which now
carries whatever mode/risk classification its own implementation earns.
Zero flags on THIS item's own remaining work → tiny.

## Approach

**Chosen path:** confirm the hand-off is complete and correctly recorded,
touch nothing else. `docs/history/tsk-24e/CONTEXT.md` (D1-D3) and
`RESEARCH.md` (Rounds 1-2) already carry the full diagnosis, the
guard-behavior/cadence preferences (D1/D2), and the correction that a
detector already exists (tsk-cgg) with tsk-1ji already carrying the fix
forward. A `fgos decision --id tsk-1ji` entry (2026-08-20, `relation:
touches:tsk-24e`) already handed D1/D2's reasoning, the confirmed
structural fact that `main-checkout-lock` is not wired into
`discover`/`return`/`edit`, and the tsk-1el coincidental-correlation
finding to tsk-1ji's own planning session, per the user's explicit
request to give tsk-1ji more context to work accurately.

**Rejected alternative:** writing tsk-24e's own independent implementation
of D1/D2 (a guard module + auto-commit cadence). Rejected per D3 — this
would duplicate tsk-1ji's own already-in-flight, more accurately-scoped
plan (tsk-1ji's root cause is more precise: a detector already exists,
the gap is cadence/wiring, not absence) and risks the two items
diverging or conflicting on the same files (`src/state/events-jsonl-
truncation-guard.mjs`, `src/setup/registrations.mjs`, whatever
`return`/`pick`/`approve` call sites tsk-1ji ends up touching).

`fgos graph tsk-24e --json` — no `criticalPath`/`topUnblock` entry names
tsk-24e (its own 4-item component: `tsk-cgg`/`tsk-64o`/`tsk-24e`/`tsk-1ji`
sits outside the platform's current top blocking path) — confirms nothing
else in the backlog is waiting on this item's own ordering beyond its
existing `deps: [tsk-64o]` (already `done`).

Impact-analysis posture: **full** — `fgos tool query --capability
impact-analysis --status present` → GitNexus registered, `present`,
freshly checked this session (2026-08-20). Not load-bearing for this
plan: no proof point below leans on blast-radius data, since this item
makes no code change.

## Shape

Single piece, no split (see below). This item's own remaining "execute"
step is: verify the hand-off documented above is real and complete, then
return. No new files, no code changes.

Risk map:

| Component | Risk | Proof point |
|---|---|---|
| Hand-off completeness | Light | `fgos list --id tsk-1ji --json`'s `data.decisions` includes the `touches:tsk-24e` entry logged 2026-08-20; `docs/history/tsk-24e/CONTEXT.md` D3 and `RESEARCH.md` Round 2 exist and cite `tsk-cgg`/`tsk-1ji` correctly |
| No regression | Light | full `npm test` stays green — this item touches only markdown under `docs/history/tsk-24e/`, no source file |

No medium/high-risk component — this item makes no code change; the
actual code-risk (data loss / audit-security class) lives entirely in
tsk-1ji's own scope now, not this item's.

## Split decision

**No split.** A single honest piece: confirm the hand-off, touch nothing
else. Splitting "confirm CONTEXT.md is correct" from "confirm the
handoff decision landed" would fragment a check that only makes sense
verified together.

## Verify (the one command that proves this piece done)

```
npm test
```

Full suite, not scoped — this item touches no source file, so the only
thing to prove is "nothing broke" (the docs-only changes cannot regress
any test) plus the two facts in the risk map above, which are read
checks, not part of the automated suite. `verify` on the item currently
reads the discovery-stage placeholder (`chưa xác định — bổ sung thủ
công`); sync `npm test` onto it before validating.

## Assumptions

- tsk-1ji's own planning session will read the `touches:tsk-24e` decision
  handed to it and factor D1/D2's reasoning into its own plan — this
  item cannot force that, only make the context available. Not material
  to THIS item's own acceptance criteria (tsk-24e's job was surfacing the
  evidence and the reasoning, not guaranteeing tsk-1ji acts on it).

## Outstanding questions

None
