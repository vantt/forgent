# herdr-orchestrator-terminology-boundary — RESEARCH

Item: `tsk-10n`.

## Round 1 (2026-08-26) — real state of orchestrator/PaneOrchestrator/Herdr hits, and where boundary prose already lives

Goal: before discovery can render `clear`/`unclear`, confirm what the
item's own verify command (`rg -n "orchestrator|PaneOrchestrator|Herdr" docs
herdr-plugin src`, "every hit must have a clear/allowlisted meaning") would
actually surface today, and whether the acceptance criteria's content
already exists anywhere.

Checked (all direct repo reads):

1. **Directory existence and hit volume** — `docs`, `herdr-plugin`, `src`
   all exist. `rg -n "orchestrator|PaneOrchestrator|Herdr" docs herdr-plugin
   src` → 993 raw line hits. Breakdown: `Herdr` alone → 223 hits (product
   name, unambiguous everywhere it appears — no work needed on these).
   Case-insensitive `orchestrator` → 884 hits, of which 78 are literally
   `PaneOrchestrator`. The remaining ~774 are overwhelmingly concentrated in
   `herdr-plugin/src/main.rs` (121 hits) and `herdr-plugin/src/settings.rs`
   (23 hits) — local variable/type names (`pane_orchestrator`,
   `OrchestratorSettings`, `HerdrOrchestratorToggles`), not scattered prose
   ambiguity across hundreds of files. This means "every hit has a clear
   meaning" is achievable via a *small number of documented senses*, not a
   per-occurrence audit of 993 lines.

2. **`PaneOrchestrator` is a real Rust trait**, not just a citation —
   `herdr-plugin/src/ports.rs:62`: `pub trait PaneOrchestrator { ... }`.
   Implemented by `HerdrPaneAdapter` (`pick.rs:417`) and used throughout
   `main.rs` as the variable `pane_orchestrator`. Confirmed via `rg` + a
   GitNexus symbol lookup that also surfaced two sibling Rust identifiers in
   the SAME naming family that the item's own acceptance text does not
   name explicitly: `OrchestratorSettings` (`settings.rs:18`, struct) and
   `HerdrOrchestratorToggles` (`main.rs:548`, struct) — both are the
   auto-launch config toggles read from `.fgos/config.json`'s
   `herdrOrchestrator` key (auto-discover/auto-merge/auto-retro/
   auto-cleanup pane launching), a *third* real Rust-side "orchestrator"
   identifier family, distinct from the pane-lifecycle `PaneOrchestrator`
   trait. Any real disambiguation note has to cover this family too, or a
   verify re-run against `herdr-plugin/src/main.rs` still shows unexplained
   hits.

3. **Two of the three acceptance bullets already exist, near-verbatim, in
   the exact file the item's own scope note names** —
   `docs/architect/dispatch-control-plane-redesign.md`:
   - Line 123 (fgOS's own glossary section): `` `orchestrator` - T0
     composition layer that manages N units of work and stays attached. ``
   - §12.1 "Herdr Runtime Role" (lines 515-532): `Herdr is
     runtime/orchestration/visibility:` (list: open/reuse a pane, start an
     agent process, show live output, preserve terminal/session context,
     attention/liveness signals) — `Herdr is not the authority for:` (list:
     whether a work item is done, a blocker resolved, a review passed,
     artifacts accepted) — `Those facts come from runner state, structured
     agent events, artifact refs, and verification.`

   This is acceptance (1) and (2) already stated, word-for-word in spirit.
   No PaneOrchestrator/Rust-identifier disambiguation exists anywhere in
   this file today (confirmed: `rg -i "PaneOrchestrator"
   docs/architect/dispatch-control-plane-redesign.md` → 0 hits) — only
   acceptance (3) is genuinely missing.

4. **What "allowlist" means now that the mechanical guard is gone** —
   `git log --oneline -1 -- test/docs/launcher-vocabulary-guard.test.mjs` →
   `270aa5ad chore: retire the orchestrator word ban after 0029 D17 assigned
   the term a meaning`. Full commit message read: decision 0028 banned the
   bare word while it had no assigned meaning; decision 0029 D17 assigned
   fgOS's own sense (T0 aggregate layer); the guard was retired because "a
   word-level grep cannot separate the retired sense from the assigned
   one." The file `test/docs/launcher-vocabulary-guard.test.mjs` no longer
   exists in the main checkout (confirmed absent; only stray copies remain
   in unrelated old worktrees under `.claude/worktrees/*`). So there is no
   mechanical allowlist mechanism left to register `PaneOrchestrator`
   against — "allowlist" for this item can only mean a **documented
   disambiguation statement** (prose), consistent with exactly why the old
   guard itself was retired (mechanical grep cannot carry sense).

5. **Prior, closed, related work — not a dependency, both already
   `done`/`delivered`:**
   - `tsk-2au` (done) — added a frozen-phrase exemption for the literal
     citation `"herdr-orchestrator"` inside `launcher-vocabulary-guard.
     test.mjs`'s own NEGATIVE test (now moot: that whole test file is
     retired per point 4). Its plan.md separately confirmed, at the time,
     that `docs/history/fgos-terminal-close-autoclose/CONTEXT.md` legitimately
     used `PaneOrchestrator` (Rust trait, industry sense) twice and needed
     no rename.
   - `tsk-4ah` (delivered) — added a disambiguation banner into
     `docs/history/orchestrator-worker-slots/DISCUSSION.md` covering the
     fgOS-*internal* meaning evolution of "orchestrator" (ADR0026 old sense
     → ADR0028 renamed to launcher → ADR0029 D17 new sense → ADR0031 guard
     removed). Its own RESEARCH.md (same directory) also names a reusable
     banner shape: `docs/history/runtime-claim-doing-separation/CONTEXT.md`
     lines 3-19, a bold dated blockquote pointer pattern. Neither of these
     two items covers the Herdr-Rust-vs-fgOS-vocabulary axis this item
     asks for — this item's scope is net new, not a duplicate.

6. **Scope boundary check — "docs only"** — the item's own text restricts
   scope to docs files (`docs/architect/dispatch-control-plane-redesign.md`,
   "Herdr history/docs"). A doc-comment placed directly in
   `herdr-plugin/src/ports.rs` next to `pub trait PaneOrchestrator` would
   arguably prevent "blind renaming" more effectively than a markdown-only
   note, but the item's own scope line explicitly excludes `.rs` files —
   honored as given, not reopened.

## Verdict

`clear: true`. Every real ambiguity resolves to grounded evidence, not
guesswork: the boundary prose already needed for acceptance (1)/(2) exists
in `docs/architect/dispatch-control-plane-redesign.md` today; the only real
gap is a `PaneOrchestrator`-and-sibling-Rust-identifiers disambiguation
note in that same file; "allowlist" now means documented prose, not a
test-level mechanism (the mechanical guard that used to do this was
retired for exactly that reason); and the "docs only" scope line already
resolves whether a `.rs` doc-comment is in bounds (it is not).

Proposed real verify (mechanical, matches this repo's existing docs-kind
verify convention — a targeted `grep -q` pair, not a hand-judged read of
993 lines):

```bash
grep -qi "PaneOrchestrator" docs/architect/dispatch-control-plane-redesign.md && grep -q "T0 composition layer" docs/architect/dispatch-control-plane-redesign.md
```

The second clause guards against the existing fgOS glossary entry being
disturbed while the first proves the net-new Rust-term disambiguation note
was actually added.
