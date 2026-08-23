# tsk-5tm plan review — second opinion (Fable), 2026-08-14

## Verdict: READY WITH CHANGES

All D1-D12 citations re-verified against the real repo and hold. The 6-way split
is the right granularity and the deps-chain mechanism is correctly understood
(`footprintOverlapAmong`'s exemption is DIRECT-edge-only — confirmed at
`src/intake/plan.mjs:907-909`, comment at 888-898). But three footprint/scope
gaps should be fixed in plan.md's JSON BEFORE re-firing `fgos plan --verdict
decompose`, because the children's declared footprints become stored state the
conflict engine uses later — materializing them wrong bakes the error in.

## Findings (most important first)

1. **Child 5 (D9) footprint is missing `.fgos/config.json` — real gap, fix before
   re-fire.** The committed config has a top-level `runner.models` map
   (`{light: haiku, standard: sonnet, heavy: opus}`, verified live). D9's action is
   "đổi `cfg.models` sang `cfg.modelPolicies`" — that is a config-file edit, yet
   child 5 declares only `["src/runner/dispatch.mjs", "test/runner/dispatch.test.mjs"]`.
   Tests at `dispatch.test.mjs:308/633/786/2065` assert `cfg.models`' exact shape
   from the COMMITTED config, so the config edit is unavoidable, not optional.
   Add `.fgos/config.json` to child 5's footprint. (This doesn't change the
   conflict picture — children 0, 1, 4 already share that file and the pairwise
   chain already links 5 to all of them.) Also note `src/runner/loop.mjs:1324` is
   the one external `modelForTier` call site (passes `work.tier` 3-vocab values);
   if D9 keeps `modelForTier`'s signature working for 3-vocab input via an
   internal mapping (the plan's pinned reading), loop.mjs stays untouched and its
   omission from the footprint is defensible — but that constraint should be
   stated in child 5's action, since breaking the signature would silently orphan
   that call site.

2. **D12(iii) — `decide --work <id>` + exporting `capacityIdForWork` — is owned by
   NO child.** plan.md's own assumption admits it ("`--work` flag... chưa tự có
   `#task-*` riêng ở §7") but never assigns it. Two consequences: (a) child 3
   (D4, fanout consult) has no specified mechanism to consult — work-item-shaped
   lookup IS the missing piece D4's own text names ("đây là mảnh còn thiếu để
   fgos-fanout hết là ngoại lệ"); (b) D7 gates the AGENTS.md paragraph on
   "D5 + `--work` shipped", so if no child ships `--work`, D7's precondition is
   never met by this split. Cheapest fix: fold "export `capacityIdForWork`
   (dispatch.mjs:1090) + add `decide --work <id>` CLI flag" explicitly into
   child 3's action text — its footprint already covers `dispatch.mjs` and the
   deps chain already puts it after D5. No 7th child needed.

3. **Child 2 (D5) footprint is missing the shared fragment.** plan.md's third
   assumption says the `_shared/capacity-dispatch-fallback.md` shortening
   (D12(i)) is "gộp vào footprint của piece đó khi thực thi" — but the declared
   footprint is only `dispatch.mjs` + test. A child editing files outside its
   declared footprint undermines exactly the footprint-hazard mechanism this
   whole gate exists for. Add `.agents/skills/_shared/capacity-dispatch-fallback.md`
   (file verified to exist) to child 2's footprint.

4. **Chain order: consider moving child 3 (D4, heavy) to LAST.** Current chain
   D1→D6→D5→D4→D11→D9 puts the riskiest piece (D4: live parallel producer,
   wall-clock proof only possible post-implementation) in the middle, so a stall
   there blocks D11 and D9 — two pieces DISCUSSION.md §7 explicitly declared
   "độc lập, có thể build song song bất kỳ lúc nào". Reordering to
   D1→D6→D5→D11→D9→D4 preserves the ONE real dependency (D5 before D4), reverses
   no locked decision (the published order for D11/D9 was "any time"), and keeps
   the full pairwise property. Not blocking — the current chain is correct, just
   worse under failure. Note if finding 2's fix lands in child 3, `--work` ships
   last under this reorder, which only delays D7's (already-deferred) AGENTS.md
   paragraph — acceptable.

5. **Cross-checkout execution hazard the plan doesn't name: `.fgos/config.json`
   edits happen on MAIN, not in the child's worktree.** Worktrees have `.fgos/`
   stripped (ADR0020), and `committedRunnerConfig()` in the test suite resolves
   the MAIN checkout's config explicitly (verified, `dispatch.test.mjs:621-629`).
   So children 0, 1, 4 (and 5 after finding 1) must coordinate an in-worktree
   test edit with an ADR0020 hand-commit-to-main config edit — the same path
   tsk-49u used (the test file's own comment cites it). Mid-flight main-config
   mutation is visible to every other live session immediately, and a rolled-back
   child leaves main already mutated. Not a design flaw — it's the repo's
   established pattern — but plan.md should state it in Assumptions so each
   executing child sequences test-edit + hand-commit deliberately instead of
   discovering the coupling at red-verify time.

6. **Child 3's verify is weaker than its own proof points and isn't flagged the
   way D9's is.** `node --test test/runner/dispatch.test.mjs` can cover the
   `--work`/decide surface (if finding 2 lands) but cannot verify SKILL.md prose
   wiring, cannot confirm "decide called once per candidate before Agent fire",
   and cannot measure the wall-clock number the risk map demands. plan.md gives
   D9 an explicit "verify là điểm khởi đầu, validating phải bổ sung" caveat —
   D4 deserves the same sentence. (The D4 feasibility row itself is sound: I
   re-read `fgos-fanout/SKILL.md` — batch capped at 5, an existing serial
   per-candidate announce loop before a single batched parallel fire, and zero
   `decide` consultation today. "PROVEN bounded" structurally is a fair verdict;
   5 sequential CLI round-trips is bounded seconds.)

7. **D9 feasibility row independently reproduced and agreed — with two residual
   soft spots.** My grep matches the matrix exactly: outside `dispatch.mjs` only
   `loop.mjs:1324` (real call), `plan.mjs:974` (verbatim carry-through),
   `work.mjs:381-383` (validates against `TIERS`, still `['light','standard','heavy']`
   at `work.mjs:156`), `graph-harness.mjs:95` (doc comment). The
   `workflow-stage-graphs.mjs:328-336` comment confirms `risk`/`TIERS` share the
   3-value vocabulary with two live consumers (`HEAVY_RISK` gate at
   `plan.mjs:115/753`, priority discounts) — so the pinned "5-tier vocab stays
   internal to `cfg.modelPolicies`" boundary is the right and necessary reading.
   Soft spots for the implementer, not blockers: (a) only `standard` overlaps
   between the two vocabs, and the 3→5 mapping for `heavy` (→`critical`? →
   `analytical`?) genuinely changes model selection for every heavy item — it's
   a semantic choice, not a mechanical detail; (b) `rigorOverrides` has zero
   specified semantics anywhere in DISCUSSION/CONTEXT/plan beyond "khớp
   marketing-cockpit" — child 5's implementer has no spec to test against.

8. **Verified-correct claims (no action needed).** `needs` gate at
   `dispatch.mjs:693-707` runs only when `kind !== 'task'`; 2/3 config entries
   are `kind:"task"` → D1's dead-data claim holds (and after D6 removes `gather`,
   the whole gate including the name-lookup else-branch is dead, consistent with
   retiring it wholesale). `CAPACITY_PURPOSES = ['gather','judge']` at :406.
   `EXECUTOR_ADAPTERS` validated at :382-384/:895, defined :1075, invoked only
   via :1144 (Flow B `spawnWorker` path) — D5's "validated but never invoked in
   Flow A" holds. `cfg.executors` tier-key validation at :521-533 → D11's
   collision rationale holds. `modelForTier` at :577. `capacityIdForWork` at
   :1090, module-private (not exported) — D12(iii)'s premise holds. Exactly 11
   `for: 'gather'` fixtures + the hard assert at test :651-663. 15 = C(6,2)
   pairs all sharing `dispatch.mjs` — the engine's park was correct, and full
   pairwise (not transitive) is genuinely required by the checker's filter.

9. **DISCUSSION.md's "Outstanding questions" section is stale — but harmlessly.**
   Its open items #1/#2/#3 were all closed by D10/D12/D7 in later rounds
   (vòng 6), and its §7 intro sentence ("Chỉ tạo task cho D1/D4/D5/D6") predates
   the D9/D11 task additions listed right below it. CONTEXT.md correctly reflects
   the closures and plan.md acts on the closed state, so nothing was quietly
   mis-resolved. Minor: round numbering is internally inconsistent (§1 says
   "Vòng 6", §3 cites "vòng 7/vòng 8", CONTEXT says "7 vòng") — cosmetic only.

## Bottom line

Submit after three JSON-level edits (add `.fgos/config.json` to child 5's
footprint, add the shared fragment to child 2's footprint, name the
`--work`/`capacityIdForWork` work in child 3's action) and optionally reorder
the chain to put D4 last; the deps-chain approach itself is correct and the
split should then go to `fgos plan --verdict decompose` unchanged in shape.
