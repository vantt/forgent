---
item: tsk-4voj
timestamp: 2026-08-02T04:40:00.000Z
---

# plan.md: Iron Law leaf-vs-root diff scope

Locked decisions: `docs/history/tsk-4voj-iron-law-leaf-scope/CONTEXT.md`
(D1-D3). This plan does not reopen them — only D1's "how" belongs here.

## Mode

**high-risk**, by the hard-gate flag rule (§2 of `fgos-coding-planning`), not by
size:

- **audit/security** (hard-gate flag) — the touched code IS fgOS's own
  self-modifying-capability safety gate (`classifyIronLaw`, D5/D10/D13/D14
  in `src/evolve/iron-law.mjs`). Narrowing its file-scope input, even
  correctly, is exactly the kind of change that flag exists to catch.
- **existing covered behavior** — `changedFiles` and the Iron Law approve
  path already have real test coverage (`test/runner/merge.test.mjs:151-
  193`, `test/cli/fgos.test.mjs:4726-4826` and `:6330-6360`) that must keep
  passing unmodified.

A smaller mode (`small`/`standard`) would not honestly cover this: the
code delta is genuinely tiny (one caller-side line, mirroring 4 existing
call sites — see CONTEXT.md D1's scout evidence), but the proof burden is
not tiny, because a wrong scoping either re-opens the false-positive this
item exists to close, or silently narrows the gate past what's safe. The
"2-3 flags → standard" count would undercount that risk on its own; the
hard-gate flag overrides it per the mode-gate rule.

## Approach

**Chosen path**: apply the existing D3 leaf-vs-root split (already live
at 4 call sites in `bin/fgos.mjs` — `review` local diff, `review --github`
PR base, `approve`'s merge target, `catchup`'s target) to the 5th and
last remaining call site: the Iron Law gate's `changedFiles(repoRoot,
item)` call. `resolveRoot(view, id)` and `branchNameFor` are both already
imported in `bin/fgos.mjs`; `changedFiles` already accepts `opts.trunk`
(`src/runner/merge.mjs:316-317`, tested at `test/runner/merge.test.mjs:
176-183`). No new function, no new module, no signature change anywhere.

**Alternatives rejected**:
- *Walk the evidence-file lookup to check ancestor ids too* (rejected —
  CONTEXT.md D2: treats the symptom, not the cause; the false-positive
  would still fire and just get auto-explained instead of not firing).
- *Add a new "scope" option to `classifyIronLaw` itself* (rejected — the
  file-set input is already the right seam; `classifyIronLaw` stays a
  pure function of `filesChanged`, unchanged, per its own module doc).
- *Fix only in `bin/fgos.mjs`'s comment, leave behavior as-is and file a
  separate "known limitation" note* (rejected — the whole point of this
  item is that the limitation isn't cosmetic; it live-blocked `tsk-52g-2`
  and, per the design report, is a load-bearing prerequisite for the
  Conductor's own escalation policy, `tsk-3bn`).

**`fgos graph --what-if tsk-4voj --json`**: `unblocksTransitive: 4`,
`newlyReady: ["tsk-3bn"]`. Confirms this is a single, self-contained
piece — no split needed (§5 below), and finishing it has real downstream
leverage (unblocks the live drift incident's own fix).

**Impact-analysis posture**: `full` per capability query (GitNexus
present) — but `list_repos` shows this repo's index is **168 commits
behind HEAD** as of this planning pass, so any `impact()` blast-radius
read taken right now would be unreliable evidence, not a real proof
point. Recorded here as `impact-analysis: full-but-stale`; execution
(`fgos-coding-implement`) must run `gitnexus analyze` before calling `impact()`
on `changedFiles`/the Iron Law block, per `AGENTS.md`'s own "Index stale?"
guidance — this plan does not claim a blast-radius proof point it doesn't
actually have yet.

### Files touched

| File | Change |
|---|---|
| `bin/fgos.mjs` (Iron Law block, ~2074-2089) | Resolve `rootId = resolveRoot(view, id)` (already computed a few lines later at 2152 for the merge-target split — reuse one computation, don't duplicate) and pass `changedFiles(repoRoot, item, rootId !== id ? { trunk: branchNameFor(rootId) } : {})`. |
| `bin/fgos.mjs:2064-2069` (stale comment) | Update — it currently claims trunk-diff over-reporting is "the fail-safe direction, accepted as-is"; CONTEXT.md D1 supersedes that. Leaving it unedited would contradict the code next to it. |
| `test/cli/fgos.test.mjs` | New test(s), see risk map below — no existing test covers a leaf's Iron Law scope. |
| `test/runner/merge.test.mjs` | No change expected — `changedFiles`'s own `opts.trunk` behavior is already covered (lines 176-183); this item only changes a caller. |

### Risk map

| Component | Risk | Proof point (for `fgos-coding-validating` / execution) |
|---|---|---|
| Root-item Iron Law path (`rootId === id`) | Regression — accidentally changing root behavior while fixing leaf behavior | Existing tests at `test/cli/fgos.test.mjs:4756-4826` (self-modifying root item still refuses without ack) must keep passing unmodified — no new fixture needed, just confirm green. |
| Leaf-item false-positive (this item's own bug) | Fix doesn't actually close the gap, or closes it only for the exact `tsk-52g-2` shape | New test: root item with one child already merged into `fgw/<root>` (a real gated-module touch, e.g. `src/runner/x.mjs`), a second child forked AFTER that merge whose OWN commits touch only ungated files. Assert `approve` on the second child does NOT trip Iron Law (no `--acknowledge-iron-law` needed) — this is the direct regression test for the bug as filed. |
| Leaf's own genuine hit | Narrowing scope accidentally UNDER-reports — a leaf whose own commits genuinely touch a gated module must still trip Iron Law | New test: same root/child setup as above, but the leaf's own commit touches a gated module (`src/runner/`) itself. Assert `approve` still refuses without `--acknowledge-iron-law` — proves D1 didn't over-correct into a bypass. |
| Missing root branch (CONTEXT.md D3) | Fail-closed shape not actually exercised, first time this edge is hit for THIS call site | No new test mandated (CONTEXT.md D3 pins the accepted behavior: same `MergeError` shape as the 4 existing call sites, which already carry this same unverified-in-practice edge). If `fgos-coding-validating` finds this cheap to add as a fixture, add it; otherwise it's an accepted, documented gap shared with the 4 precedent call sites, not a new one. |

### Order

Single phase — one file's caller-side change plus its regression tests.
No dependency ordering needed within the item itself.

## Shape (high-risk, full map)

1. In `bin/fgos.mjs`'s Iron Law block, compute `rootId` once
   (hoist the existing `resolveRoot(view, id)` call at line 2152 up to
   before the Iron Law check, or compute it fresh at the Iron Law site
   and let the later line reuse the same value — implementer's call,
   not a product decision) and thread `{ trunk: branchNameFor(rootId) }`
   into `changedFiles` only when `rootId !== id`.
2. Update the stale comment at 2064-2069 to describe the corrected
   behavior and cite this item.
3. Add the two new tests from the risk map (false-positive-closed,
   genuine-hit-still-fires) to `test/cli/fgos.test.mjs`, placed next to
   the existing Iron Law block (~4726-4826) for discoverability.
4. Run the full existing Iron Law test range (both files) plus the two
   new tests; confirm no other test in the suite constructs a leaf/root
   fixture that silently depended on the old blind-trunk behavior.

### Concrete cases to prove against

- Root item, self-modifying diff → refuses (existing, unchanged).
- Root item, ordinary diff → proceeds (existing, unchanged).
- Leaf item, root already absorbed a gated-module sibling merge, leaf's
  own diff is ordinary → **now proceeds** (this item's fix; was the bug).
- Leaf item, leaf's own diff genuinely touches a gated module → still
  refuses (guards against over-correction).
- `approve --github` path — same Iron Law block, hoisted before the
  transport branch (per `bin/fgos.mjs:2057-2069`'s own comment) — the fix
  applies identically to both transports since it's the same call site;
  no separate GitHub-specific test needed, but worth a one-line note in
  the PR description that this was checked, not assumed.

## Assumptions

- `resolveRoot(view, id)` for `tsk-4voj`-shaped items returns the correct
  lineage root even when called before the item's own `view` snapshot
  reflects a just-landed sibling merge — this is already relied on by the
  4 existing call sites and not a new exposure this item introduces.
- No other caller of `changedFiles` outside `bin/fgos.mjs`'s approve
  handler exists that would need the same fix — confirmed by grep during
  `fgos-coding-exploring` (single call site).

## Split decision

No split. One honest piece of work: a single caller-side scope fix plus
its regression tests, in one file plus one test file. `fgos graph
--what-if` above confirms real, non-trivial downstream unblock value
(`tsk-3bn`) without needing to fan this out into child items.

## Verify

**Superseded during execution** (discovered 2026-08-02, running the full
suite for real): the repo's own `npm test` (`node --test
'test/**/*.test.mjs'`) is NOT green on `main` itself, independent of this
item — confirmed by stashing this item's own changes out and re-running,
and again directly on `main` with zero changes applied:

- `test/architecture.test.mjs` — a file-list invariant mismatch
  (`src/state/discover-pool.mjs` present on disk, missing from the test's
  expected list) — filed as `tsk-11t`.
- `test/skills/fgos-mirror.test.mjs` — `fgos-submit-assist/SKILL.md`
  drifted between `.claude/skills` and `.agents/skills` — filed as
  `tsk-4jk`.

Neither touches this item's own files or area; fixing them here would be
scope creep into an item whose own diff is deliberately minimal and
Iron-Law-gated. Verify is rescoped to the DoD's own named suites
(`AGENTS.md` question 5: "state + cli + runner + e2e"), plus `test/evolve`
since `iron-law.mjs` lives there and this fix's own regression tests sit
in `test/cli`:

```
node --test 'test/state/**/*.test.mjs' 'test/cli/**/*.test.mjs' 'test/runner/**/*.test.mjs' 'test/e2e/**/*.test.mjs' 'test/evolve/**/*.test.mjs'
```

Run for real: 1729 tests, 1724 pass, 0 fail, 5 skipped (pre-existing,
unrelated skips) — includes both new regression tests from the risk map
above. Recorded on the item itself
(`fgos edit tsk-4voj --verify "..."`), replacing the earlier `"npm test"`
choice, which itself replaced the intake placeholder
`"chưa xác định — P15 bổ sung"`.
