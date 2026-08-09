# tsk-1ud — Làm sạch vùng máy (state.decisions): tách ghi-sổ, đếm trích dẫn

Mode: small

## Locked decisions this plan honors

No separate `CONTEXT.md` exists for this item — it never went through
`fgos-exploring` (the direct `clarify -> decompose` edge in
`src/state/workflow-stage-graphs.mjs` was used, since `fgos-clarifying`
judged intent already understood from the item's own text). The item's own
`description` field IS the locked decision record here: D7 (event log seq
10187) plus its correction (seq 10223) — both cited verbatim in the item's
description, which this plan treats as authoritative exactly as a
`CONTEXT.md` D-ID would be.

## Approach

**Chosen path:** add an explicit `kind: 'engine' | 'design'` field to the
decision payload (`addDecision`, `src/state/store.mjs:826-838`), default
`'design'` when omitted (mirrors the existing `source` default-to-`'session'`
precedent right next to it, same function, same D3 "optional, no enum"
posture), and pass `kind: 'engine'` explicitly at every engine-bookkeeping
call site.

**Rejected alternative:** classify by `payload.source === 'resolveDiscovery' |
'resolveDecompose'` instead of adding a new field. Rejected because `source`
is documented as free text with no enum (store.mjs:816-820) and is already
used for unrelated attribution purposes — `test/state/migrate-clarify-split.
test.mjs:58` shows a genuine DESIGN decision recorded with
`source: 'fgos-exploring'`, proving `source` cannot double as the
engine/design discriminator without risking exactly the kind of fragile,
undeclared convention this item exists to eliminate.

**Full call-site inventory** (grepped directly, not assumed from the item's
own text — the item's description names only 5 of the real 8 call sites):

| File | Lines | Source literal |
|---|---|---|
| `src/intake/discovery.mjs` | 151, 166, 274 | `'resolveDiscovery'` |
| `src/intake/decompose.mjs` | 141 (via `logDecomposeVerdict`), 552, 575, 708, 765 | `'resolveDecompose'` |

The item's description cites only `discovery.mjs:151,166,274` and
`decompose.mjs:141,552` — lines 575, 708, and 765 in `decompose.mjs` are the
same `source: 'resolveDecompose'` engine bookkeeping (skip/force-override/
completeness-advisory branches) but were not enumerated. All 8 get
`kind: 'engine'`; missing any of them would leave a real hole in the "no
string-prefix matching needed" goal.

**Impact-analysis posture: degraded.** `fgos tool query --capability
impact-analysis --status present` shows GitNexus registered and present,
but `list_repos` flags this repo's index as `staleness.commitsBehind: 30` —
present is not fresh (per CLAUDE.md's own gate wording). Ran
`impact(addDecision, upstream)` anyway and cross-checked with a direct grep
of every real `addDecision(` call site (excluding `.test.` files) — both
agree on the 8 sites above, so the stale index is not hiding a 9th call
site.

**Risk map:**

| Component | Risk | Proof point |
|---|---|---|
| `addDecision` default `kind` | Low — additive optional field, same shape as the already-shipped `source` default | New unit test asserting default (`'design'`) and explicit override both round-trip |
| 8 call sites in discovery.mjs/decompose.mjs | Low — one literal field added per call, no signature change | Existing `test/intake/discovery.test.mjs` + `test/intake/decompose.test.mjs` (already assert decision-trail shape per decompose.test.mjs's own tsk-6b6 comment) |
| `runner/loop.mjs`'s `runWatch` — flagged HIGH by `impact()` as a depth-2 upstream caller (via `resolveDiscovery`/`resolveDecompose`), **not** in the item's declared footprint | Low, argued not tested: grepped `runner/loop.mjs` for any `decision`/`kind` handling — the only `decision`/`kind` identifiers there belong to an unrelated claim-arbitration concept (`claimRoot`'s `decision.action`), not the decision-log payload. `runWatch` treats `resolveDiscovery`/`resolveDecompose` as black boxes. | No new test needed; existing `test/runner/loop.test.mjs` stays green as a smoke check since the two functions it calls keep their same signature |
| Citation-check regex (file:line / seq / measurement) | Medium — a hand-rolled heuristic can over/under-match | Dry-ran against the real `.fgos/state.json`: 596/665 (90%) post-2026-08-01 design decisions have no detectable citation under this regex — see Decision below for why this is reporting-only, not a blocking gate |

**Decision (made in this planning pass, confirmed with the product owner):**
the "rationale must cite verifiable evidence" requirement is implemented as
a **non-blocking count**, not a second hard gate at the 2026-08-01 cutoff.
The item's description claims rationale is "already clean" since
2026-08-01, but that claim was only ever measured for length (empty/thin) —
never for citation content. A dry run of the citation regex against every
real post-2026-08-01 design decision found 596/665 (90%) lack a detectable
file:line/seq/measurement citation. Making this a blocking gate at the same
2026-08-01 cutoff as the `kind` check would fail this item's own verify
immediately on landing, on legacy records — exactly what "KHÔNG SỬA NGƯỢC"
(the item's own hard rule, matching the append-only log's L3 constraint)
forbids fixing retroactively. The mechanical check therefore **counts and
prints** how many post-2026-08-01 design decisions lack a citation
(satisfies the item's own "đếm được" wording) without throwing on that
count; only the `kind`-field completeness check throws. Real citation
enforcement stays a convention from here, tightened later by a follow-up
item if warranted — never silently dropped, recorded here so it is not lost.

## Shape

**Code changes (small, single piece — no split):**

1. `src/state/store.mjs` — `addDecision`: extend `eventPayload` to also
   default `kind`:
   ```js
   const eventPayload = { ...payload, source: payload.source ?? 'session', kind: payload.kind ?? 'design' };
   ```
   No enum validation added — matches `source`'s own "optional free text, no
   enum" precedent (D3) right next to it; adding one would be scope this
   item's own "KHÔNG nới kích thước" instruction does not ask for.

2. `src/intake/discovery.mjs` — add `kind: 'engine'` to the 3 `addDecision`
   calls at lines 151, 166, 274.

3. `src/intake/decompose.mjs` — add `kind: 'engine'` to the 5 `addDecision`
   calls: the `logDecomposeVerdict` helper (line 141) and the 4 direct calls
   at 552, 575, 708, 765.

4. `test/state/store.test.mjs` — this file currently has **zero** tests
   exercising `addDecision` directly (verified by grep — the item's own
   given `verify` command runs this whole suite, but it proves nothing
   about the very function being changed). Add two focused tests:
   - `addDecision defaults kind to 'design' when the caller omits it`
   - `addDecision keeps an explicit kind (e.g. 'engine') unchanged`

5. Verify command — expand the item's own given command to also run the
   two intake suites that exercise the edited call sites, and add the
   non-blocking citation count from the Decision above:

   ```bash
   node --test test/state/store.test.mjs test/intake/discovery.test.mjs test/intake/decompose.test.mjs && node -e "import(\"./src/state/store.mjs\").then(async()=>{const fs=await import(\"node:fs\");const s=JSON.parse(fs.readFileSync(\".fgos/state.json\",\"utf8\"));const CITATION=/([\\w.\\/-]+\\.(mjs|js|ts|md|json):\\d+)|(\\bseq\\b[^a-zA-Z]{0,3}\\d+)|(\\d+(\\.\\d+)?\\s?%)|(\\b\\d+[\\d,.]*\\s*(files?|records?|b[aả]n|tokens?|d[oò]ng|k[yý]\\s?t[uự]))/i;const d=s.decisions.filter(x=>x.ts>\"2026-08-01\");const noKind=d.filter(x=>!x.kind);const uncited=d.filter(x=>x.kind!==\"engine\"&&!CITATION.test(x.rationale||\"\"));console.log(\"post-2026-08-01: \"+d.length+\" decisions, \"+uncited.length+\" design decision(s) without a detectable citation (reporting only, not blocking)\");if(noKind.length)throw new Error(noKind.length+\" decision sau 2026-08-01 thieu truong kind\")})"
   ```

   Only the `noKind` check throws — byte-identical failure condition and
   error message to the item's own originally-submitted `verify`. The
   citation count is a `console.log`, never a throw.

**No split.** Single cohesive piece: one field, 8 call-site edits, 2 new
unit tests, one expanded verify command. Splitting would just add
coordination overhead for a 3-file, single-flag ("existing covered
behavior") change.

## Outstanding questions

None

## Assumptions

- The citation-check regex (file:line / `seq` / percentage / count-noun) is
  a best-effort heuristic for "reporting only" purposes — it is not
  required to be exhaustive or precise, since nothing blocks on it. If a
  future item tightens this into a blocking gate, the regex itself should
  be revisited then, not assumed correct today.
- `runner/loop.mjs`'s `runWatch` needs no code change and no new dedicated
  test — argued from reading its source (no decision-payload-shape
  assumptions), not from running it end-to-end.
