# plan.md — herdr-plugin auto-merge/retro/cleanup pane lifecycle (tsk-5d4)

Mode: high-risk

4 flags apply (threshold for high-risk is 4+): **existing covered
behavior** (`decide_auto_operation_tab_launches`/`choose_right_pane_loop`/
`ensure_operation_tab`/`left_right_panes` all carry passing unit tests
today that assert the fixed-2-pane design `CONTEXT.md` D2 retires —
`main.rs:1600-1665`), **weak proof around the area** (`RESEARCH.md` found
the existing double-launch-guard test fakes its own precondition rather
than exercising a real write path — the area was already under-proven
before this item), **external systems** (herdr's own CLI contract —
`pane split`/`pane rename`/`pane close`/`pane list` — is the mechanism
every locked decision routes through), **public contracts** (`--autoClose`
extends `plugins/fgOS/skills/merge-loop/retro-loop/cleanup-loop/SKILL.md`'s
own invocation surface, the same class of change `docs/history/
fgos-terminal-close-autoclose/CONTEXT.md` already treated as consequential
enough to lock its own D1/D2). No hard-gate flag (no auth/data-loss/
audit-security/removed-validation) applies on top of the 4.

`fgos graph --what-if tsk-5d4 --json` → `unblocksTransitive: 0`,
`newlyReady: []` — nothing else in the backlog depends on this item, so the
graph gives no signal on internal step order; the split/ordering below
comes from a real technical dependency traced in `CONTEXT.md`'s scout
evidence (see Approach).

`fgos tool query --capability impact-analysis --status present` →
GitNexus `present` → **impact-analysis: full** per `CLAUDE.md`. Same
caveat `CONTEXT.md` already recorded: GitNexus's indexed-symbol coverage
of the `herdr-plugin` Rust crate specifically was not verified this round —
whichever piece below edits `loop_run_argv`/`left_right_panes`/
`choose_right_pane_loop` should run `impact` on those symbols first and
treat an empty/no-hit result as worth a manual `rg` cross-check, not as
proof of zero callers.

## Approach

CONTEXT.md's 5 locked decisions (D1-D5) split cleanly along a real
technical dependency, not an arbitrary file boundary: D2/D4/D5 change how
`fg:operation`'s panes are resolved and capped (Rust-only, herdr-plugin
crate); D3 changes how the 3 loop skills ask to be closed (skill-prose
only, `plugins/fgOS/skills/**`). D3's own close call (`herdr pane close`)
is only safe once D2 has removed the fixed-2-pane invariant — closing a
pane against the OLD fixed-slot design would strand `ensure_operation_tab`
in its own documented "tab exists, <2 panes" unsupported state
(`layout.rs`'s own comment, cited in `CONTEXT.md`'s scout evidence). So the
Rust piece must land, and its `--autoClose` argv-threading must exist,
before the skill-prose piece can safely rely on it. This is an ordering
dependency, not just a file-boundary one — `fgos add --parent` below
records it via `--deps` on top of `--parent`.

**Risk map:**

| Component | Risk | Proof point (for `fgos-validating`) |
|---|---|---|
| Retiring `left_right_panes`/`ensure_operation_tab`'s fixed-2-pane resolution (D2) | High — existing unit tests assert the old shape (`main.rs:1600-1665`); this piece must rewrite them, not just add new ones, or the suite silently keeps proving the retired design | New/rewritten unit tests must exercise: (a) launch when 0 panes exist for the requested loop label — splits+labels+launches; (b) launch attempt when a pane already carries the label — no second launch; (c) `fg:operation` tab missing entirely — created fresh, same as today |
| New cap `MAX_OPERATION_TAB_PANES = 4` (D5) | Medium — a wrong constant either blocks legitimate concurrent merge+retro+cleanup or never actually triggers in tests | A unit test that drives the cap (4 panes already live, 5th launch attempt) and asserts the launch is swallowed/skipped, not errored |
| Retiring `choose_right_pane_loop`/`RightPaneLoop` mutual exclusion (D4) | Medium — dead code left half-retired (e.g. still gating one call site) reintroduces the old exclusivity silently | `rg 'choose_right_pane_loop|RightPaneLoop|pick_right_pane_loop' herdr-plugin/src/*.rs` returns nothing outside the removed functions' own now-deleted definitions; a test asserting `autoRetro` and `autoCleanup` both `true` launches both in the same tick |
| `--autoClose` threaded into 3 loop skills, closing only on genuine natural-finish (D3) | High — the exact bug this item exists to fix reappears if a skill closes on a `blocked`/Iron-Law/no-progress stop instead of only `frontier empty` | Read back each of the 3 SKILL.md's own stop taxonomy (merge-loop's is already cited in `CONTEXT.md`; retro-loop/cleanup-loop's own stop bullets were NOT read this round — the piece that edits them must read their SKILL.md first and confirm the taxonomy names an equivalent "genuinely done" state before wiring the close call to it) |
| GitNexus Rust coverage unverified (impact-analysis posture) | Low-medium | Run `impact` on `loop_run_argv`/`left_right_panes`/`choose_right_pane_loop` before editing; if it returns nothing, cross-check with `rg` per the capability-gate guidance already cited above |

## Shape — split into 2 pieces

**Piece 1 — herdr-plugin dynamic-pane infra (D2, D4, D5).** Rust-only.
Files: `herdr-plugin/src/pick.rs` (add label-before-spawn split+rename
sequence for merge/retro/cleanup, mirroring `auto_discover_launch_argv_
sequence`; thread `--autoClose` into `loop_run_argv`'s built command,
mirroring `discover_run_argv`), `herdr-plugin/src/layout.rs` (retire
`left_right_panes`'s fixed-2-pane resolution; `ensure_operation_tab`
becomes tab-only find-or-create, no longer resolves/returns 2 panes),
`herdr-plugin/src/main.rs` (retire `choose_right_pane_loop`/
`pick_right_pane_loop`/`RightPaneLoop`; `decide_auto_operation_tab_
launches` and `auto_launch_operation_panes` become independent per-loop
decisions, each gated only by its own toggle + its own label-guard, capped
by `MAX_OPERATION_TAB_PANES = 4`; rewrite the existing tests at
`main.rs:1600-1665` for the new shape instead of leaving them asserting
the retired one), `herdr-plugin/src/app.rs` (`operation_left_pane_id`/
`operation_right_pane_id` fields — retire or repurpose once panes are no
longer fixed-slot), `herdr-plugin/src/ports.rs` (trait method signatures
if the launch calls change shape, e.g. no longer taking a pre-resolved
`pane_id` but resolving/splitting one internally).

Verify: `cargo test --manifest-path herdr-plugin/Cargo.toml && cargo build --release --manifest-path herdr-plugin/Cargo.toml`

**Piece 2 — `--autoClose` wiring in the 3 loop skills (D3).** Skill-prose
only. Files: `plugins/fgOS/skills/merge-loop/SKILL.md`,
`plugins/fgOS/skills/retro-loop/SKILL.md`,
`plugins/fgOS/skills/cleanup-loop/SKILL.md`. Depends on Piece 1 (the
`--autoClose` flag must already be threaded into the launch command Piece 1
builds, and closing a pane must already be architecturally safe under
Piece 1's dynamic-pane design). Per
`docs/how-to/write-verify-for-a-skill-prose-change.md`, verify is
`npm test && POSITIVE && NEGATIVE`:

Verify:
```
npm test && grep -q -- '--autoClose' plugins/fgOS/skills/merge-loop/SKILL.md && grep -q -- '--autoClose' plugins/fgOS/skills/retro-loop/SKILL.md && grep -q -- '--autoClose' plugins/fgOS/skills/cleanup-loop/SKILL.md && grep -q 'terminal-close' plugins/fgOS/skills/merge-loop/SKILL.md && ! grep -q 'Never carries `--autoClose`' herdr-plugin/src/pick.rs
```

(POSITIVE: all 3 skills reference `--autoClose`, and merge-loop's own stop
step references `terminal-close`. NEGATIVE: `pick.rs`'s old "discover-only"
stance comment, cited in `RESEARCH.md`/`CONTEXT.md`, is gone once
`loop_run_argv` actually carries the flag — Piece 1's own footprint, so
this line only turns green once both pieces have landed, which is honest:
Piece 2 is not really "done" independent of Piece 1's flag-threading
existing.)

## Concrete cases to prove against

- Two consecutive poll ticks (5s apart) with `autoMerge: true` and no
  merge pane yet running — first tick launches, second tick does NOT
  double-launch (the exact bug this item exists to fix).
- `autoMerge`, `autoRetro`, `autoCleanup` all `true` simultaneously — all
  three launch independently, not gated against each other (D4).
- Merge-loop stops on `frontier empty` with `--autoClose` — pane closes;
  guard label clears (pane no longer in `pane list`); a later poll tick
  with new mergeable items launches a fresh pane cleanly.
- Merge-loop stops `blocked`/Iron-Law/no-progress with `--autoClose` —
  pane stays open (D3's own "never close on error" branch); a person can
  still inspect it.
- 4 panes already live in `fg:operation`, a 5th launch attempt (any type)
  — swallowed/skipped this tick, not an error, per D5's cap.
- `fg:operation` tab does not exist yet at all — created fresh (unchanged
  behavior, `ensure_operation_tab`'s tab-level logic untouched by D2).

## Outstanding questions

None
