# CONTEXT — tsk-2t6: hai lớp dispatch cho fgOS

Distilled from `docs/history/two-layer-dispatch/DISCUSSION.md` (the
`fgos-coding-shaping` transcript this design was actually worked out in,
across vòng 1–8c) — this file is `fgos-coding-exploring`'s own terminal artifact
for `tsk-2t6`; DISCUSSION.md stays the full evidence/rationale record,
this is the locked-decisions summary `fgos-coding-planning` reads from.

## Feature boundary

fgOS has only one way to split work today: every piece becomes a full
work item (stage FSM, pull door, status pool, retro, cleanup). A second,
lighter shape is needed: a note that carries a clear, self-contained
command, pushed down to an agent/process, reporting back to the parent —
never becoming an administrative task itself.

Two candidate shapes were compared: **(B1) gather packet** — read/
synthesize only, no file writes, no id, no state, returns a digest (fits
`discover`'s scout work and `validating`'s reality-check). **(B2) exec
packet** — the child WRITES code, so it still needs an id to
reserve/attest/commit/merge back to the parent branch, but that id is
ephemeral and scoped to the parent (no stage FSM, no pull door, no status
pool, no retro/cleanup, dies when the parent is done).

## Locked decisions

| D-ID | Decision |
|---|---|
| D1 | `tsk-3xd` runs before `tsk-535`, ordered via `mergeAfter` (not a hard dep) |
| D2 | Add "runs in parallel / shortens wall-clock time" as the fourth valid reason to dispatch a step out of the session instead of inline |
| D3 | Open an ad-hoc capacity layer: a runtime-composed prompt packet, not just a pre-registered fixed `<PROMPT_TEMPLATE>` |
| D4 | **B2 (exec packet, file-writing, ephemeral id) stays gated** — no third category between a rootTask and a `capacity`; revisit only when D9's two conditions both hold |
| D5 | Dispatch described as two layers L1/L2, L1 along two orthogonal axes (lifecycle-bearing? / registered-ahead-of-time or composed-at-dispatch?) instead of three discrete kinds; L1 decides what+who, L2 infers how; L2 is never called "launcher" |
| D6/D6b | A dynamic packet needs six required fields (id, goal, inputs, boundary, expected shape, return contract); id shape `<scope>#p<n>`, structurally invalid as a work-item id (`#` breaks `ID_PATTERN`) — reference id, never a lifecycle id, D4 stays gated |
| D7 | The three follow-on tasks (parallelism-reason, ad-hoc-capacity, tier-judged-at-dispatch) live as three separate items chained by `mergeAfter`, since all three touch `_shared/capacity-dispatch-fallback.md` |
| D8 | No `selfSufficient` field — derive dispatch-readiness from existing mechanical signals (prose + runnable verify + footprint), never a self-declared flag |
| D9 | D4's gate reopens only when BOTH: `tsk-3xd` merged (satisfied 2026-08-06) AND ≥2 real captured cases of a parent needing a child to write a file too small to be its own work item |
| D10 | Provider/smart-tier selection is real future work (deferred, not dropped); the packet reserves empty `provider`/`tier` slots now, and `dispatch.mjs resolve` accepts caller overrides now — cheap to reserve, expensive to retrofit |
| D11 | Packet `<scope>` = the currently claimed work item id, or `s<first 8 chars of writerId>` (via `resolveWriterIdentity`'s existing 4-tier fallback) when none; counter `n` lives in the composing session's own memory, never a counter file (would reopen D4 by the back door) |
| D12 | Provider/tier judgment is a shared PROSE fragment a consuming skill includes — never a subprocess judge; returns only `provider`/`tier`, never a mechanism; fail-safe is the INVERSE of D6 (a missing packet field blocks dispatch; a failed tier judgment dispatches anyway with the default); the choice actually used must be recorded |

## Delegated implementation (all delivered)

- **`tsk-2sl`** — D2 (parallelism reason) + D7 (DRY the reason list into
  `_shared/capacity-dispatch-fallback.md`). Delivered.
- **`tsk-2k1`** — D3/D6/D6b/D10 (ad-hoc packet shape + `--model`/`--tier`
  override plumbing on `dispatch.mjs resolve`). Delivered.
- **`tsk-503`** — D5/D7/D10/D12 (per-dispatch provider/tier judgment
  fragment + `appendWorkerLog`-based recording). Path B chosen over a
  `work.tier` field split (locked with the person mid-session, not in
  DISCUSSION.md's own earlier rounds — `gate-bypass.mjs` stays untouched,
  `work.tier` keeps both its existing meanings). Delivered.

## This item's own remaining deliverable — already done

Item description's own scope (separate from the three children above):
update `docs/distillery/deep-dives/parallel-decomposition-and-merge.md`
with the two-layer-dispatch finding (the missing
write-needs-id-vs-read-only axis, and cell ≠ backlog item), plus a
`docs/distillery/porting-log.md` row. **Done** (DISCUSSION.md's own
`#task-distillery-delta` section, vòng 5) — both already committed on
`fgw/tsk-2t6` before this clarify pass, verified:

```
grep -q "Lớp 1 — cell (ghi file)" docs/distillery/deep-dives/parallel-decomposition-and-merge.md && grep -q "Lớp 2 — I/O worker" docs/distillery/deep-dives/parallel-decomposition-and-merge.md && grep -q "GHI file/mutate git thì phải có danh tính" docs/distillery/deep-dives/parallel-decomposition-and-merge.md && grep -q "cell KHÔNG phải backlog item" docs/distillery/deep-dives/parallel-decomposition-and-merge.md && grep -q "bee:fan-out-cost-tiering-rubric" docs/distillery/porting-log.md && grep -q "R3 E2 F2" docs/distillery/porting-log.md
```

(Strengthened from an earlier heading-only grep, per `judgeDiscovery`'s
own second-pass dispute during this item's `fgos discover` call: a
shallow keyword check would pass even if the actual gather/exec boundary
explanation were missing. This version checks for the real substance —
the write-needs-identity rule, the cell≠backlog-item distinction, and the
porting-log row's real citations/score tags — not just a heading string.)

## Pinned terms

- **Gather packet (B1)** — read/synthesize-only dispatch, no id, no state.
- **Exec packet (B2)** — file-writing dispatch needing an ephemeral,
  parent-scoped id; stays gated per D4/D9.
- **Ad-hoc capacity** — a registered capacity whose prompt is composed at
  dispatch time from a six-field packet instead of a fixed
  `<PROMPT_TEMPLATE>`.

## Canonical references

- `docs/history/two-layer-dispatch/DISCUSSION.md` — full transcript,
  D1-D12 evidence/rationale, session-close notes (vòng 8c).
- `docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-cli-spawn.md`
  — Native-First Dispatch Doctrine, the binary this design layers on top
  of without superseding.
- `.claude/skills/_shared/capacity-dispatch-fallback.md` — the fragment
  D2/D3/D6/D6b/D10/D12 all land in.
- `docs/distillery/deep-dives/parallel-decomposition-and-merge.md` +
  `docs/distillery/porting-log.md` — this item's own doc deliverable.

## Outstanding questions

None open for `tsk-2t6` itself. All three children delivered; this
item's own doc deliverable is done and verified. Nothing left to design
or build — `fgos-coding-planning` should find this item ready to close, not
needing a further split.
