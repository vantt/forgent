# Lead wake report: component authority (2026-11-23 00:32 to 04:00)

Lead: head:lead-forgent-261121-2109-compon-8ee21.

## Outcome

Phases 1, 2, 3, 4 and 6 are done and landed on main. Two parts are parked:

- **Phase 5:** landed, except the governance holder-table swap, which waits for DOCOS (owner question q-4lmw3q6la7).
- **Phase 7:** waits until plan `261122-0118-heads-stable-and-able` is done.

| Phase | Land commit | Units |
|---|---|---|
| 1 Spec, schema, self row | 07971a3e5 | c-1441, c-3520, c-5775 |
| 2 Manifest copied into the model | 07493b986 | c-7239, c-15048 |
| 3 Components and decision kinds | b7744e074 | c-16989, c-25759, c-27737 |
| 4 Contract index | fc277aa8e | c-32984, c-42575 |
| 5 Ownership views (holder table parked) | 9486a7d80 | c-34650, c-43812, c-47932, c-48998 |
| 6 Architecture-map views, proposal map retired | 507318599, 815708ca4 | c-49933, c-51310, c-54322, c-57066 |

The table lists the units whose work landed. Every phase was reviewed by a subagent, and every blocking finding was fixed through another unit before landing.

## What I checked

- **Phase 2:** the architecture test keeps the same 87 test names as before the move. The manifest-to-model comparison exits 0, with 83 doors and 325 files.
- **Phase 3:** I derived each file's layer and tier from the components. They match the phase 2 values for all 325 `.mjs` files and every old tier prefix (0 differences). I re-ran this check after phase 6.
- **Phase 4:** there are 157 contract rows, 13 of them CTR. Every live and designed row names a file that exists, and a temp-root test fails when a row lacks its provider or its file.
- **Phases 5 and 6:** `node scripts/component-authority-render.mjs --check` exits 0. The views hold only what the model holds; hand-written content the model does not hold stays outside the generated markers.
- **Sandbox limit:** inside my sandbox, the A4 architecture test fails only because the native addon is missing (`git-addon-not-shipped`). The land gate runs it with the addon.

## What went wrong, and what it means for later runs

1. **The runner never commits a path that was already dirty when a round started** (`preExistingInScope` in `packages/execution/engine/src/unit_run/git_port.rs`).
   - So a unit that times out, or whose commit is refused, leaves work that no later unit in that worktree can commit.
   - Recovery each time: a fresh worktree from the trunk tip, and a unit that copies the work in.
   - Four worktrees were superseded this way and handed to the supervisor: p03, p05, p05b, p06b.
2. **The gemini account hit its quota** (429) at about 02:51 +07; the error said it resets in about 1h21m. The deepseek fallback also failed. Wave 4 moved to `xai`, which finished every unit in 2 to 9 minutes.
3. **The `claude` provider cannot run `node`** in its sandbox, so it cannot verify anything, and it stopped without changes.
4. **Model text lands in docs, so the pre-commit and land doc checks apply to the model.**
   - A bare `RUL1` or a `CA-D1` token without a gloss is refused.
   - A backticked path that does not exist is refused, unless the line pins a commit.
5. **Footprint gaps.** Four live docs that still name the manifest, and seven that linked the proposal map, sat outside the footprint. The supervisor widened it (`e707cba72` and an earlier change).

## Small leftovers

- Two runner-written commit messages name a phase: be9611b83 and 96fd659d1. They cannot be reworded after landing.
- **Governance holder table:** stays hand-written until DOCOS answers on `reports/holder-view-preview.md`.

## Next

- **When DOCOS answers:** one unit replaces the governance table with the generated block, and phase 5 is done.
- **When heads-stable is done, phase 7 runs:**
  1. Port manifest changes since blob 1f294728e.
  2. Delete the manifest.
  3. Fix `setup-doctor-registry.md:164`.
  4. Sweep the four knowledge and domainization docs.
  5. Run `npm test` and `cargo test --workspace` on the host.

## Unresolved questions

- q-4lmw3q6la7: the DOCOS relay of the holder-table preview, which is with the owner.
- A misrouted message about another plan's host full-suite run reached this lead. I did not act on it and raised it to the supervisor (event 276a2132504a13e6).
