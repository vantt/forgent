# Plan — discovered-work risk vocabulary drop (tsk-2ck)

Mode: small

Flags counted per `fgos-routing`'s Mode gate: only "existing covered
behavior" applies (`captureDiscoveredWork` is exercised by
`test/e2e/domain-aware-stage-literals.test.mjs`) — no auth/data-model/
audit/external/cross-platform/multi-domain flag applies, and no yes/no
question decides feasibility (both fixes are confirmed buildable — see
`RESEARCH.md` Round 1). A few files, no gray areas → `small`, not `tiny`.

No CONTEXT.md exists for this item — discovery verdict was `clear`
(RESEARCH.md Round 1), which skips `exploring` and never produces one.
This plan grounds every claim in RESEARCH.md's own citations instead.

## Approach

Chosen path: implement **both** suggested fixes from the bug report
(RESEARCH.md Round 1 confirmed both are independently buildable and
they are complementary, not alternatives):

- **(a) Documentation fix** — point every `fgos-discovered` schema
  description at the domain's real vocabulary, the same way tsk-2yo
  already fixed the sibling `fgos-verdict` schema in the same file
  (`src/runner/prompt-templates/worker-prompt-discovery.txt:29-37`).
- **(b) Defensive-coercion fix** — in `captureDiscoveredWork`
  (`src/runner/loop.mjs`), validate `block.risk`/`block.kind` against
  the domain's real vocabulary before they reach `addWork`, falling
  back to `derived.risk`/`derived.kind` (already computed at line 721,
  two lines above the current unsafe pass-through at line 735) instead
  of the item being silently dropped.

**Alternative rejected:** (a) alone. Rejected because it only reduces
the odds a worker produces an out-of-vocabulary value — it does not
close the failure mode for any other future caller of the same schema
(a different worker template, a manual `fgos-discovered` emission) that
still gets it wrong. (b) alone was also rejected as the sole fix: without
(a), the schema documentation stays actively misleading (it still reads
as if any English string is fine), so a worker would keep generating a
value that would silently get overridden — confusing "why did my
risk:medium not show up" behavior with no diagnostic, even once nothing
is lost. Doing both closes the loop: prevention at the schema, safety
net at the write path — the same "fail-safe by construction" spirit the
surrounding code already claims but doesn't yet deliver for this field
(quoted directly in tsk-2ck's own description, confirmed accurate by
RESEARCH.md Round 1).

**No split** — see "Split decision" below.

### Risk map

| Component | How risky | Proof point |
|---|---|---|
| Prompt-template doc edits (3 files) | light — text-only, no code path change | `npm test -- test/e2e/domain-aware-stage-literals.test.mjs` still passes (worker prompt is still valid, nothing consumes the removed english-only phrasing programmatically) |
| `captureDiscoveredWork` coercion | light — `derived` already computed and in scope 2 lines above the edit site (RESEARCH.md Round 1); the coercion only *adds* a valid-value guarantee, never removes the existing `?? derived.risk`/`?? derived.kind` absent-value fallback already there | New unit-style test in `test/runner/loop.test.mjs` (imports `runOnce` directly, same import surface already used by that file) driving a fake worker executor that emits an out-of-vocabulary `risk`/`kind` in a `fgos-discovered` block, asserting the discovered item IS created (not silently dropped) with the coerced value |

### Impact-analysis posture

`fgos tool query --capability impact-analysis --status present` →
GitNexus registered and `status: present`. `mcp__gitnexus__list_repos`
shows the entry matching this project's own scan-root
(`/home/vantt/projects/forgentX`) is **1250 commits behind HEAD** —
**degraded**, per `CLAUDE.md`'s impact-analysis capability gate. Blast
radius here is instead grounded directly: `captureDiscoveredWork` has
exactly two callers, both inside `src/runner/loop.mjs` itself
(`dispatchClaimedItem`, `runOnce` — confirmed by a direct `grep -n
"captureDiscoveredWork"` cross-check, RESEARCH.md Round 1's own citation
method), so the change surface is fully contained to one function plus
the 3 prompt-template files it documents. No further blast-radius
evidence needed given `risk: light` and this contained a surface.

### Files touched, in order

1. `src/runner/prompt-templates/worker-prompt-discovery.txt:61-68`
   (`fgos-discovered` schema section) — add the same vocabulary
   guidance the sibling `fgos-verdict` schema already carries at
   `:29-37` (point at `classificationVocabulary(domain, field)`,
   `src/state/workflow-stage-graphs.mjs`; never invent a value outside
   it).
2. `src/runner/prompt-templates/worker-prompt-default.txt:36-39` — same
   addition to its own `fgos-discovered` schema section.
3. `src/runner/prompt-templates/worker-prompt-skill-pointer.txt:42-45`
   — same addition to its own `fgos-discovered` schema section.
4. `src/runner/loop.mjs` — inside `captureDiscoveredWork`
   (`:690-761`), before the `addWork` call (`:722-754`): validate
   `block.risk` against `classificationVocabulary(item.domain,
   'risk')` and `block.kind` against
   `classificationVocabulary(item.domain, 'kind')`; use the block's
   value only when it is in the vocabulary, otherwise fall back to
   `derived.risk`/`derived.kind` (already computed at `:721`) — same
   fallback value the existing `??` already reaches for on an *absent*
   value, now also reached for an *invalid* one. Do not change the
   `try/catch` at `:704-759`; it stays as the real fail-safe for any
   other unexpected `addWork` failure.
5. `test/runner/loop.test.mjs` — add the coercion-path test described
   in the risk map above.

Order rationale: prompt-template edits (1-3) are independent
documentation changes with no code dependency; the `loop.mjs` fix (4) is
the one that actually stops data loss and is independent of 1-3 too. No
`fgos graph --what-if` ordering call was needed — this item has no
`deps` and sits in its own size-1 connected component (`fgos graph
--json`, `componentCount: 551`, confirmed tsk-2ck's own component is
size 1) — nothing else in the backlog depends on the order these five
files land in. Test (5) lands last since it proves (4).

## Shape

This is a **bug fix**, not new behavior: current schema/write-path
already "means" to guarantee a discovered item is never lost
(`captureDiscoveredWork`'s own doc comment, quoted in the bug report,
already claims "FAIL-SAFE by construction"); this plan makes the code
match that already-stated intent for exactly the one field
(`risk`, and the same gap applies identically to `kind`) that doesn't
yet deliver on it.

Concrete cases to prove (per the risk map's proof points):
- A `fgos-discovered` block with a valid `risk`/`kind` still behaves
  exactly as today (regression guard — the e2e test already covers
  this).
- A block with an out-of-vocabulary `risk` (e.g. `"medium"`, the exact
  value that triggered tsk-5dnt) is coerced to `derived.risk` and the
  item IS created, not dropped.
- A block with an out-of-vocabulary `kind` behaves the same way,
  coerced to `derived.kind` (same gap, same fix, RESEARCH.md Round 1
  did not scope this to `risk` alone once the shared `??
  derived.<field>` pattern was found identical for `kind` at
  `loop.mjs:732`).
- A block with a *missing* `risk`/`kind` (today's already-working
  `??` path) is unaffected — the new validation only changes behavior
  for a *present-but-invalid* value, never for an absent one.

## Split decision

No split. This is one honest piece: five files, all serving the same
single fix (prevention + safety net for the same silently-dropped-item
failure mode), with a single shared verify surface (the new
`loop.test.mjs` case is the one command that proves the write-path half
done; the e2e test guards the read/documentation half is still
consistent). Splitting documentation (a) from code (b) would produce
two work items that are only individually half a fix — (a) ships with
no proof the write path is actually safe, (b) ships with no proof
workers are ever told the real vocabulary — and neither closes tsk-2ck's
own reported failure mode alone.

## Verify

Pass-through item — syncing the designed proof-surface command onto
`work.verify` next (current value is a discovery-stage placeholder,
`hasRealVerify` returns false for it):

```
npm test -- test/runner/loop.test.mjs test/e2e/domain-aware-stage-literals.test.mjs
```

## Outstanding questions

None
