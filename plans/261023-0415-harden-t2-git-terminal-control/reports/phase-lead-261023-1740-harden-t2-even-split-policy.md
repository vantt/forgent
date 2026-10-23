# even-split placement policy (default) - phase lead report

2026-10-23, Asia/Saigon. Branch `harden/t2-p14-even-split` (from `a486166cf`). Owner decision 24 ("Q4a Q6b").

## What was built

- `packages/terminal-control/rust/src/policy/even_split.rs` (127 lines incl. docs): the `even-split` policy. Registered in `policy/mod.rs`, which now makes it `DEFAULT_POLICY`; `measured-split` stays registered and selectable.
- Additive optional `groupSize` on `PlaceRequest` (policy input) and on `AllocateRequest` (port), plumbed `core.rs` -> policy. Both contracts stay at version 1.
- Node: `herdr-round.mjs` `prepareTerminalAttempt` takes `dispatchBatchSize` and sends `groupSize` when it is an integer above 1. `config.mjs` default policy name is `even-split`.
- Contract JSON (`placement-policy.v1.json`: registry, `evenSplit` rule block, fixture format; `terminal-control.port.v1.json`: allocate input), spec section 8 + config table + decision history, CHANGELOG line.
- No new herdr call: the policy is a pure function of the same `PlaceInput`; the allocate invocation-count test is unchanged and green.

## Rule as built

1. `n` = panes the tab holds after this one. `wanted` = `n` plus what is left of the batch (`groupSize` minus live group panes, at least 1), capped at `maxPanesPerTab`.
2. `shape(count)`: `c` = most columns `<= count` with `width / c >= minCols`; `rows = ceil(count / c)`; refused when `height / rows < minRows`; columns rebalanced to `ceil(count / rows)`. The largest `count` in `n..=wanted` that has a shape sets the columns; `n` itself having none -> next tab of the group, then `NewTab`.
3. Fewer columns than the shape: split the rightmost group pane `right`. Otherwise split the largest pane of the column holding the fewest panes `down`. A split whose children could fall under the minimum (whichever way herdr rounds) is skipped; nothing fits -> `NewTab`.
4. Ratio: no `groupSize` -> 0.5. With it -> `1/q`, `q` = panes the anchor's space must still hold (columns missing + 1 for right; the column's final count - current + 1 for down; at least 2).

The report formula says "4 panes at 240 wide = 2x2" but the bare formula gives `c=3`, `rows=2`, which is a 3+1 grid; the columns are rebalanced to `ceil(n / rows)` to reach 2x2 (352 wide stays 4 columns, 5 panes at 240 = 3+2).

## Shapes (limits 80x20, max 8)

"batch" = `groupSize` known; "seq" = no `groupSize` (halving, panes added one by one).

```
240x60  batch 3 (80|80|80)    batch 4 (2x2)         seq 3 (halving)       seq 4
+----+----+----+              +------+------+       +------+------+       +------+------+
| P1 | P2 | P3 |              | P1   | P2   |       | P1   |      |       | P1   | P2   |
| 80 | 80 | 80 |              +------+------+       +------+  P2  |       +------+------+
+----+----+----+              | P3   | P4   |       | P3   | 120  |       | P3   | P4   |
                              +------+------+       +------+------+       +------+------+
                              120x30 each           P1,P3 120x30; P2 120x60   120x30 each; 5th -> new tab

160x45  3 or 4 panes (seq = batch)                  110x80  3 panes (batch)     seq 3 / seq 4
+--------+--------+                                 +---------+                 40/20/20 then 20/20/20/20
| P1 80  | P2 80  |   3: P1 80x23, P3 80x22,        | P1 27   |                 5th -> new tab
+--------+        |      P2 80x45                   +---------+
| P3 80  |        |   4: 2x2 (80x23 / 80x22)        | P2 27   |
+--------+--------+   5th -> new tab (3 rows = 15   +---------+
                      < 20)                         | P3 26   |
                                                    +---------+

352x69  batch 4: four columns 88 | 88 | 88 | 88      seq 4: P1 176x35 + P4 176x34 | P2 88 | P3 88
        a full tab holds 8: 4 columns x 2 rows of 88x34
```

Seq 3 at 240x60 cannot be three columns: 2 columns of 120 exist and a right split would leave 60 < 80, so it stacks. Three equal columns need the batch size (owner Q6 (b): no rebalance for panes that join later).

## Proof

- Fixtures (`contracts/policy-fixtures`, 22 new, all 16 old ones now name `"policy": "measured-split"`): 240x60 / 160x45 / 110x80 with 1..4 existing panes (12), 352x69 with 3 existing, groupSize cases: 3 at 240x60 (two steps), 4 at 240x60 (two columns, stack), 4 at 352x69 (two steps), 3 at 110x80 (two steps), 20 at 240x60 (capped to what fits).
- `tests/policy_fixtures.rs`: fixture test runs each file against the policy it names; registry test pins default `even-split`; three new tests: no pane under the minimum when filling random tabs with/without batch size (property), equal final sizes for batch sizes (240x60/3, 352x69/4, 240x60/4, 110x80/3), halving without batch size ends 2x2 of 120x30 at 240x60. Sim now rounds a cut to the nearest cell (same results for 0.5); the policy's size check holds either way herdr rounds.
- Owning test for the wiring across Node -> route: `test/run-supervisor/terminal-groups.test.mjs` one new test (batch size reaches the policy: ratio 1/3 vs 0.5). Why no existing test proves it: none sent `groupSize`. It names the policy in `terminalConfig` so a machine config cannot change it.
- Pinned default name updated in `test/setup/terminal-control-checks.test.mjs` (1 line).

Results:
```
cargo test --no-fail-fast -p fgos-terminal-control -p fgos-run-supervisor: 30 binaries, passed 250, failed 0
cargo clippy -p fgos-terminal-control -p fgos-run-supervisor --all-targets -- -D warnings: Finished, no warnings
node one-file command (test/terminal-control/*.test.mjs, test/setup/terminal-control-checks.test.mjs, test/run-supervisor/terminal-groups.test.mjs): tests 51, pass 51, fail 0, skipped 0; no `run-tests: ERROR` lines
node scripts/git-one-door-scan.mjs: 5 undeclared site(s), unchanged -> census not regenerated
```
Not run: `cargo check --target aarch64-apple-darwin` (policy is platform-free; no platform code touched).

## Δ lines

Rust production +~145 (even_split.rs 127, mod/core/port ~18; the rule alone is ~95 lines, the rest is docs and the shape/size helpers). Rust tests +~75 (+22 fixture files). Node production +3. Node tests +17. Contract/spec/changelog text.
Test-cost: tests added 4 Rust + 1 Node, retired 0, new CLI/host spawns 0 (the Node test reuses the existing harness).

## Concerns for the owner

1. **The default does not reach machines that already ran setup.** `fgos setup` writes `terminal.layout.policy` into config and never overwrites, so `~/.fgos/config.json:482` and this repo's tracked `.fgos/config.json:1548` hold `measured-split` and keep winning (found because my first wiring test ran with 0.5). Options: (a) leave: those machines opt in by editing one value; (b) a setup migration that rewrites the value only when it equals the old default (cannot tell "materialised default" from "chosen"); (c) stop materialising `layout.policy` at all so the core's default governs. I did not touch config files; recommend (c) plus (b) for the two known files, owner's call.
2. The dispatch path only carries a batch key string; nothing in `src` knows a batch size, so no real round sends `groupSize` yet and rounds halve (no regression versus `measured-split`, panes just stay uneven at 3). `prepareTerminalAttempt` accepts `dispatchBatchSize`; threading it from the fanout wave through `cli.mjs`, `assignment-runner.mjs`, `confinement/request.mjs`, `authority.mjs` was left out (6 sites, no producer).
3. Fractional ratios on a live herdr are unmeasured: 1/3 of 240 is exactly 80 only if herdr rounds (or ceils) the cut; the size guard in the policy is rounding-agnostic, and the post-split `keep_if_roomy` still closes a pane that lands under the minimum. Worth one real-herdr check of a 3-pane batch.
4. The spec links the layout review report, which exists in the main checkout but not on this branch until it merges.

Status: DONE_WITH_CONCERNS

## Follow-up: the batch size travels with the batch key

`dispatchBatchSize` now follows `dispatchBatchKey` through every place that carries the key: `assignment-runner.mjs` (3 sites: the confinement-request context, the `prepareTerminalAttempt` call, the adapter call), `confinement/request.mjs`, `confinement/authority.mjs`, `cli.mjs` (2 sites), `herdr-round.mjs` -> allocate `groupSize`. A path with no size sends none.

Finding: no production code creates `dispatchBatchKey`. It is an optional caller input of `executeAssignment`; when absent the group is the unit run id (`assignment-runner.mjs`). Fan-out (`fanout-batch.mjs`) and the loop (`loop.mjs`) start each unit as its own `fgos run`, so a three-unit wave opens three groups, not one tab, and has no key to attach a size to. A real three-column batch therefore also needs a producer: a shared batch key plus size handed from the wave to each unit run across the process boundary. That is a new mechanism, not plumbing; left to the owner.
Proof: `terminal-groups.test.mjs` now runs a batch of three through `prepareTerminalAttempt` (cuts are thirds; a batch with no size halves). The middle hops (`assignment-runner`, `request`, `authority`, `cli`) have no test of the key either, and the python fake herdr has no `pane layout`, so a controller-level proof cannot see `groupSize`.
