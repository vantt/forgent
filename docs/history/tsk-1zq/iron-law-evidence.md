# Iron Law evidence: tsk-1zq

`classifyIronLaw` on this item's real diff (`fgw/tsk-1zq` vs its resolved root
branch, computed from the real main checkout via `changedFiles(repoRoot,
item)`):

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": [
    "bin/fgos.mjs",
    "src/runner/claim-port.mjs"
  ]
}
```

## The matched modules are inherited, not this item's own

Both matched paths are worth naming precisely, because neither is a file this
item touched.

`changedFiles` diffs the branch against the trunk, and `fgw/tsk-1zq` is forked
from `fgw/tsk-2sj`, which already carries T1 (`tsk-3dt`) and T3 (`tsk-3ac`)
merged. So the diff it classifies spans all three items. `bin/fgos.mjs` and
`src/runner/claim-port.mjs` are T1's — the `slots`/`report` verbs and the
ceiling gate inside `claimWork` — and T1 wrote its own evidence for exactly
those two paths (`docs/history/tsk-3dt/iron-law-evidence.md`, itself visible
in the same file list).

This item's own six files are all Rust under `herdr-plugin/src/`, which
`MODULE_RULES` does not cover. `matchedFlags` is empty: nothing in this item's
title or description trips a risk keyword, checked directly rather than
assumed.

That does not make the requirement a formality to wave through. It means the
evidence this file owes is evidence for the herdr-plugin change, and the
engine-side proof for the two matched modules lives in T1's record where it
was actually produced.

## Honest gap: this was not failing-test-first development

The implementation was written first and its tests written alongside it in the
same pass. No test was written red, watched fail for the feature's own reason,
and then made green. This file does not claim otherwise.

What the run did produce is a real red-before-green transcript, and one of
those reds is genuinely load-bearing — it is the old mechanism failing because
the new one replaced it, which is precisely the change D3 asked for ("the
label mechanism and the worker-slot concept are one feature; do not patch the
bug in place").

## The load-bearing red

`auto_discover_skips_when_a_pane_is_already_open` was the test that pinned the
old `fgos-auto-discover` label guard. After the label was removed from both
the read and the write side, it failed for the right reason — the launcher no
longer consults a pane label at all, so a registry reporting that label live
no longer suppresses a launch:

```
---- tests::auto_discover_skips_when_a_pane_is_already_open stdout ----

thread 'tests::auto_discover_skips_when_a_pane_is_already_open' (559107) panicked at src/main.rs:1866:9:
assertion `left == right` failed: an already-open auto-discover pane must not be launched again, regardless of which item is ready
  left: 1
 right: 0
```

It was not deleted to make the suite green. It was replaced by
`auto_discover_skips_when_the_engine_reports_a_discovery_worker_running`,
which asserts the same invariant — one unattended discover worker at a time —
through the engine instead, and which is deliberately constructed so the old
guard could not have satisfied it: the registry in that test reports no pane
labels whatsoever, so only the engine's own answer can stop the launch.

The second red in the same run
(`auto_operation_tab_launcher_never_double_launches_merge_across_two_ticks`,
`left: ["wS:pOpMerge"], right: ["wS:pOpL"]`) was a stale fixture id from the
2-pane era, fixed by pointing the assertion at the named merge slot.

## What was actually proven

The item's own verify command, all three parts, run from the implementation
branch with a clean tree immediately before this evidence file was written:

```
$ cargo test --manifest-path herdr-plugin/Cargo.toml && cargo build --release --manifest-path herdr-plugin/Cargo.toml && ! grep -rq 'fg:agents-' herdr-plugin/src
cargo test: 135 passed (4 suites, 0.03s)
cargo build (1 crates compiled)
Finished `release` profile [optimized] target(s) in 2.69s
VERIFY EXIT=0
```

The pre-change baseline on this same branch, captured before any file was
edited, was:

```
$ cargo test --manifest-path herdr-plugin/Cargo.toml
cargo test: 129 passed (4 suites, 0.07s)
```

So the item adds 6 tests net and leaves none failing. `cargo clippy
--all-targets` and a forced full rebuild both report zero warnings.

The negative half of the verify is not decorative: it caught four real
survivals of the superseded term after the code itself was renamed — three doc
comments in `layout.rs` and one simulated-error string in a `main.rs` test
double. All four were rewritten to describe the old term without keeping it
alive, rather than the grep being narrowed.

The new and changed tests cover, specifically:

- **Reuse eligibility (A5/A7/D10).** A finished worker pane is reusable; a
  pane whose item the engine still reports at `doing` is not; a focused pane
  is never taken; a pane outside the worker lane is never taken; a pane with a
  launch still pending is never taken; an unlabeled pane is never taken; the
  choice among several free panes is deterministic; and no free pane at all
  returns `None` so the split path still runs.
- **D2 stated as a test.** `reuse_never_reads_a_label_as_liveness` holds the
  pane label fixed and varies only the engine's answer, and only that flips
  the result — identity from the label, liveness from fgOS, never both from
  the label.
- **The auto-discover guard.** The engine-backed replacement above, plus
  `discovery_worker_alive_reads_stage_and_status_together`, which pins that a
  ready-but-unclaimed item does not count (it is the trigger, not the guard)
  and a claimed item at another stage belongs to a different flow.
- **Fail-open on an unreachable port.** `worker_slot_room` returns true for
  `None`. This is load-bearing rather than defensive: `fgos slots` ships with
  this same feature, so it genuinely does not exist on the trunk the cockpit
  runs from until everything merges — confirmed by running it against the main
  checkout, which answers `fgos: unknown verb "slots"`.
- **The 4-slot operation tab.** Slots assigned in `(y, x)` reading order from
  a fixture whose panes are deliberately listed shuffled, so the assertion
  proves the sort rather than the response's ordering; and a 2- or 3-pane tab
  resolving to `None`, which is the migration signal that replaces tsk-5lr's
  pinned "non-2-pane tab is an error state" assumption.
- **The retired tab cap.** Two full worker tabs now start a third rather than
  refusing, which is the behavior change retiring `MAX_AGENT_TABS` was for.
- **Retro and cleanup launching together**, now that each owns a pane instead
  of competing for one.

## Blast radius, cross-checked

`impact-analysis: degraded`. `fgos tool query --capability impact-analysis
--status present` reports one provider (`gitnexus`, `present`), and unlike the
JS-side false negative RESEARCH F-G recorded on `claimWork`, it did resolve
this item's Rust symbols — `impact({target: 'place_new_agent_pane', direction:
'upstream'})` returned `impactedCount: 7`, `direct: 3`, `risk: HIGH`,
`epistemic: exact`, and `ensure_operation_tab` returned `direct: 1`.

Both were cross-checked against `grep -rn` before being trusted, and both
agreed exactly (`pick.rs:235,254,354`; `main.rs:52`). The posture stays
`degraded` rather than `full` for two real reasons, not procedural ones: the
index points at the main checkout on `main`, not at this item's branch base,
and the tool has a proven false negative on this same feature's engine side.

The HIGH rating was surfaced rather than passed over. `place_new_agent_pane`
(now `acquire_worker_slot_pane`) is the single point all three pane-opening
paths funnel through, so the whole of its decision — which pane, and whether
to reuse or split — is a pure function tested against fixtures without a live
herdr.

## Not yet accepted

This evidence file is written and committed on the item's own branch. The
`--acknowledge-iron-law` decision belongs to a human and has NOT been taken
here: `fgos approve` was deliberately not run by the implementing session.
