# Plan — tsk-1uj: bật `docRegistry.enforce: true`

Mode: tiny

Lane derived directly (no `fgos-routing` Orient session precedes this one
in-conversation, no prior `plan.md`/hand-back exists yet) via the Mode
gate (`.agents/skills/fgos-routing/SKILL.md` "Mode gate" subsection).
Flags counted: only **existing covered behavior** applies (the item
toggles between two already-implemented, already-tested branches of
`knowledge attest`'s own gate) — 1 flag → tiny/small; picked **tiny**
over small because the honest scope really is "a couple of files, one
direct task" (see Shape below), not "a few files."

## Approach

**Chosen path**, citing `docs/history/tsk-1uj/RESEARCH.md` round 1:

1. On the branch, touch up `test/cli/knowledge-attest-gate.test.mjs:105`'s
   test title — it currently reads "with docRegistry.enforce off (the
   real default)"; once this repo's own live config flips, "the real
   default" is a stale claim about *this repo's own current value* (the
   test itself stays functionally correct — a fresh `fgos setup` install
   still defaults to `enforce: false`, RESEARCH.md finding 4 — so this is
   a wording fix, not a behavior fix). New title: "with docRegistry.enforce
   off (fgos setup's own fresh-install default)".
2. No other branch-side code change. RESEARCH.md finding 2 already
   confirms zero real consumers depend on the soft-fail branch, and
   findings 1/3 already confirm the enforce=true gate itself is
   fully-built and fully-tested (`test/cli/knowledge-attest-gate.test.mjs:23`
   already exercises `enforce: true` in its own sandbox) — there is
   nothing left to *build*, only to *activate*.
3. **The actual `docRegistry.enforce: true` flip on `.fgos/config.json`
   cannot ride this item's own branch commit at all.** ADR0020
   (`docs/how-to/fix-fgos-write-rejected-merge-block.md`) fail-closes any
   `fgw/<id>` branch that stages a change under `.fgos/` — confirmed
   live, repeatedly, on `tsk-3uc` earlier this session (same guard, same
   message shape). The precedent this doc already documents for exactly
   this shape (`tsk-4eu`→`tsk-5ge`) is unambiguous: the config content
   change "has to be re-applied as a separate operator action directly
   against the main checkout... applied directly against the main
   checkout as an operator action, with the full original verify... run
   and passed there." This item stays ONE piece (see "Split?" below for
   why) rather than mirroring `tsk-4eu`/`tsk-5ge`'s two-item split: unlike
   that case, this item's own branch has essentially no code of its own
   to justify a separate tracked item, and the operator-action step below
   is small enough to fold into this same item's own execution as a
   documented post-merge step, not a second `fgos submit`.

**Alternatives rejected:**
- *Bundle the config edit into this branch's own commit* — rejected:
  guaranteed `fgos-write-rejected` block on approve (RESEARCH.md + this
  session's own live `tsk-3uc` repro).
- *Split into two tracked items (branch chore + config-land), mirroring
  `tsk-4eu`/`tsk-5ge`* — rejected as overhead here: `tsk-4eu` needed a
  split because it had *real code* to fix on its own branch, separate
  in time and reviewability from the config land. This item's branch
  side is a one-line test-title touch-up; forcing a second `fgos submit`
  for the config land would be exactly the "tùm lum" this repo's own
  RUL11 warns against for a change this small — better to do the
  operator-action step directly as part of this same item's own
  execution, documented plainly (see Shape), than to fragment two
  trivially-small pieces across two tracked items.

**Risk map:**

| Component | How risky | What would prove it |
|---|---|---|
| Test-title touch-up | none (wording only) | `npm test` stays green |
| Config flip (operator action, post-merge) | light (RESEARCH.md: no real consumer relies on soft-fail) | rerun `scripts/knowledge-canary.mjs` against the live registry with `enforce: true` set, plus one live smoke `fgos knowledge attest` call against a genuinely unregistered path confirming it now throws instead of soft-failing |

Impact-analysis posture: **degraded** — `fgos tool query --capability
impact-analysis --status present` reports GitNexus registered and
`present`, but a PostToolUse hook earlier this session flagged its index
as stale (`last indexed: 7bb3231`, behind current HEAD). Per `CLAUDE.md`'s
gate, that means: keep the proof requirement, mark the evidence weak,
name the gap. Named here rather than relied on — this plan's own blast-
radius evidence instead comes from the direct `rg`-based consumer search
in RESEARCH.md round 1 (finding 2), which is the more reliable tool for
"who reads this specific config key" than a code-graph index anyway; the
degraded GitNexus posture changes nothing about this plan's confidence.

`fgos graph --json`'s `criticalPath`/`topUnblock` were checked; `tsk-1uj`
appears in neither (only 1 dependent, `tsk-5mh`, not part of the graph's
current global critical path) — no ordering signal from this, consistent
with a genuinely small, mostly-self-contained item.

**Files touched:** `test/cli/knowledge-attest-gate.test.mjs` (title
string only, branch-side). `.fgos/config.json` (operator action, direct
main-checkout commit, never the branch — see Approach point 3).

**Order:** (1) branch: title touch-up + `npm test`; (2) `fgos return` +
`fgos approve` (this branch's own diff carries zero `.fgos/` change, so
the ADR0020 guard that blocked `tsk-3uc` repeatedly does not apply here);
(3) once merged, as a direct operator action on the main checkout (never
through any branch): edit `.fgos/config.json`'s `docRegistry.enforce` to
`true`, commit it directly to `main` (single-parent, matching every other
`.fgos/config.json` change in this repo's history per the `tsk-5ge`
precedent), then run the canary + smoke check named in the risk map
above as this step's own proof, and record the result via `fgos decision`
on this item before considering it done.

## Split?

No. See "Alternatives rejected" above — the branch-side piece is too
small to justify materializing a second tracked item, and the
operator-action step is a documented, bounded, single command sequence
this same item's own execution can carry to completion.

## Shape

A tiny item's direct note, scaled to mode:

- **Empty/boundary case already covered:** `test/cli/knowledge-attest-gate.test.mjs`
  already tests both the `enforce: true` throw paths and the `enforce:
  false` soft-fail path in isolated sandboxes (RESEARCH.md finding 3) —
  no new test needed for the mechanism itself, only the stale title.
- **Existing behavior that must not regress:** the real writer flow
  (`fgos-coding-knowledge` skill) and `scripts/knowledge-canary.mjs`'s own
  gate — both already proven, per RESEARCH.md finding 2, to only ever
  attest a properly-registered `currentPath`, so neither should observe
  any behavior change when enforce flips on. Proven at the operator-action
  step by literally rerunning the canary against the live, now-enforced
  registry.
- **Concurrent access / partial failure:** not applicable — a boolean
  config flip has no partial-apply state, and the read is fresh on every
  `fgos` invocation (RESEARCH.md finding 1: `sharedConfig?.docRegistry?.enforce`
  is read fresh each call, never cached).

Action: this `plan.md`. Footprint:
`test/cli/knowledge-attest-gate.test.mjs`, `.fgos/config.json` (operator
action, not part of this branch's own diff/footprint for merge purposes).

Verify (pass-through, unchanged from discovery's own verdict, already
synced onto the item): `npm test`.

## Outstanding questions

None
