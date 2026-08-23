# plan.md: tsk-2tmk — /fgOS:submit's dependency-candidate scan gains a direction

Mode: small

Flag count: 1 (multi-domain — `/fgOS:submit` is shared by every domain,
not just `coding`; a change to its step 2/3 prompt affects every future
submission regardless of domain). No hard-gate flag applies (no auth, no
data loss, no audit/security, no external provider, no validation
removed) and no gray area remains — every open question from discovery
was locked in CONTEXT.md D1-D4.

`fgos graph --json`: this item sits in its own size-1 connected
component (no `deps`, nothing else declares `deps`/`parent` on it) — no
ordering constraint from the graph; the single file this touches is not
shared with any other in-flight item.

## Approach

Single-file, additive change to `plugins/fgOS/skills/submit/SKILL.md`
only (CONTEXT.md D4) — no engine/verb change.

**Step 2 (scan) — add a second, parallel heuristic (D3).** Alongside
today's existing textual-match deps heuristic, add a lightweight
consolidation-signal keyword check on the new submission's own text
(redesign/consolidate/gop/gom/thay-the) against the SAME candidate step 2
already found. Produces a direction hint — `blocked-by` when the deps
heuristic alone matched, `superseded-by` when the consolidation heuristic
also/only matched, absent when neither gives a confident read. This is
prose guidance for the session running the skill, not a new algorithm
module — the skill has never been code, it is Claude-Code-interpreted
prose the same way every other `plugins/fgOS/skills/**/SKILL.md` is.

**Step 3 (present candidate) — one unified 3-way prompt (D1).** Replace
today's confirm/edit/reject with: confirm-as-blocked-by (today's
behavior, unchanged wire format) / mark-as-superseded-by (new) / reject.
Pre-select the hint from Step 2 as the shown default when one exists;
when absent, ask directly with no default. Still a single question, one
round, matching today's UX cost.

**Step 5 (call submit) — sequencing (D2).**
- `blocked-by` confirmed: unchanged, `--deps <ids>` on the `submit` call,
  exactly as today.
- `superseded-by` confirmed: `submit` runs WITHOUT `--deps` for those
  ids, exactly as today's reject path does. Once `submit` returns the new
  item's real id, loop `fgos edit <candidate-id> --superseded-by
  <new-id>` once per candidate confirmed for this branch, using
  `../_shared/fgos-cli-fallback.md`'s existing pattern this file already
  uses for every other call.
- Both directions can occur in the same submit call when multiple
  candidates were found and confirmed differently — no scope limits this
  to one candidate.

**Step 6 (report) — merge into one message.** The item's new id, which
candidates were attached as `deps`, and which candidates received a
`supersededBy` edit, reported together as this step already reports the
new id today — no separate round-trip per edit call.

## Risk map

| Component | Risk | Proof |
|---|---|---|
| Skill prose only, no schema/engine touch | Low | `npm test` unaffected (no `src/` file changes) — proven by a verify clause asserting no `src/` diff, see below |
| New 3-way prompt wording read correctly by a live session | Low, inherent to all skill-prose (unverifiable by shell per `docs/how-to/write-verify-for-a-skill-prose-change.md`) | Not a verify-field concern — belongs to merge-time review, per that doc's own boundary section |

Impact-analysis posture: `degraded` (GitNexus present, index stale — see
CONTEXT.md's Scout evidence). Not a blocking gap: no code path exists for
GitNexus to trace here, so no proof point in this risk map depends on
blast-radius evidence.

## Shape

One piece, no split (Step 4: this is small enough to stay one item — a
single skill file, three cohesive changes to one flow, no independently
shippable sub-piece).

Files touched: `plugins/fgOS/skills/submit/SKILL.md` (steps 2, 3, 5, 6).

Verify (per `docs/how-to/write-verify-for-a-skill-prose-change.md`,
POSITIVE proves the new deliverable exists, NEGATIVE proves scope stayed
skill-prose-only):

```
npm test && grep -q 'mark-as-superseded-by' plugins/fgOS/skills/submit/SKILL.md && grep -q 'superseded-by <new-id>' plugins/fgOS/skills/submit/SKILL.md && ! git diff --name-only main...HEAD | grep -q '^src/'
```

## Outstanding questions

None
