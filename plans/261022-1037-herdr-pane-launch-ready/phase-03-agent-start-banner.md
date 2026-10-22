# Phase 3: Agent start-banner step

Capability: `execute`. Depends on: none (independent crate; runs after phase 2 for serial order). Effort 3.5h. Plan: [plan.md](plan.md) (Decision 7).

## Context

`Terminal::await_ready` (`packages/agent-protocol/rust/src/terminal/mod.rs:300-350`) returns early on NoDetector and `blocked`, trusts detector idle, or for unruled CLIs (agy, pi, omp) waits for a screen change then stillness, returning `Unverified` after 15 s (`UNRULED_READY_MS`) and typing anyway. agy shows a start banner ("Meet Gemini 4 Argon ... esc to dismiss" per the backlog item); the brief is typed at it and the CLI exits. `classify_blocked` (`:236`) knows only trust markers and login wording. `Profile` (`mod.rs:~181`) has no banner field.

## Requirements

<!-- Updated: Red Team 2026-10-22 -->
- `Profile.start_banners: &'static [StartBanner]`, `StartBanner { marker: &'static str /* lowercase */, dismiss_key: &'static str }`. All five profiles get the field; only agy is non-empty: `{ marker: "meet gemini", dismiss_key: "esc" }` (`esc` is herdr's canonical key name, `herdr pane send-keys --help`).
- The marker must be specific to the modal start banner. Evidence: `esc to dismiss` is already printed on agy's ready screen (`contracts/fixtures/terminal/agy/ready.txt:14` and `draft-in-composer.txt`), so it must NOT be the marker; `meet gemini` appears in no existing fixture (`rg -il "meet gemini" packages/agent-protocol/contracts/fixtures/terminal` is empty today; re-run before and after).
- Banner step placement in `await_ready`: first action of every loop iteration, before `inspect()`, so it also runs when the detector reports `working`, `blocked`-by-banner-only, or gives no verdict (NoDetector). Order inside the step: (1) `classify_blocked(screen)`; if it names a trust dialog or login, the step does nothing (never send `esc` to a trust dialog) and the existing flow returns `blocked`; (2) marker in `bottom_lines(screen, 20)` (case-insensitive); (3) press at most twice per call and only when the screen has changed since the previous press (a stale frame after a press never triggers a second key); (4) after a press reset `launch_screen`, `last_screen`, `stable_since`, `unruled_since`.
- A ready verdict (ruled, visible idle, settled, `Unverified`) is never returned while a marker is on screen: the post-settle check (`ready_gate`) treats a banner as "keep waiting". Banner still present after the press budget -> wait until `ready_ms` -> `NotReady` (nothing typed, `delivery-unknown`).
- The dismiss key is a key press, not text; the harness's "nothing is typed while waiting" assertion (`sent_texts == 0`) still holds.
- CLIs with an empty list: behaviour identical (existing vectors for all five CLIs unchanged and green).
- Reversal (record in the fixture `source` and spec): a real capture of agy's start screen with different wording replaces the marker data; no code change.

## Files (write paths)

- `packages/agent-protocol/rust/src/terminal/mod.rs`
- `packages/agent-protocol/rust/src/terminal/{claude,codex,agy,pi,omp}.rs`
- `packages/agent-protocol/rust/tests/terminal_vectors.rs` (new harness-only expectation `sentKeys`: the list of non-Enter key presses; removed from the compared `want` like the other harness-only keys; the scripted pane records sends, a frame that repeats the same screen models a stale read)
- `packages/agent-protocol/contracts/fixtures/terminal/agy/` (`start-banner.txt`, `start-banner.insp.json` modeled on `ready.insp.json`, new vectors in `vectors.json`)
- `docs/platform/agent-protocol/spec.md` (§5.1 Ready row and profile list: marker, key, ordering after blocked classification; known limit: only agy has an entry)

## Steps

1. Add the type and field; empty lists; the agy entry.
2. Implement the banner step and the ready re-check.
3. Fixture screen `start-banner.txt`: synthesized from the backlog text (no live capture exists); the vector `source` says so. Best-effort live capture: if a real `agy` binary and herdr are available (`which -a agy`; the shell function wraps `command agy`), start it in a scratch pane with `herdr pane read --source visible`, save the screen as the fixture instead and note the date. Evidence only, not a gate.
4. Vectors (agy, step `await-ready`), plain-words names:
   - a start banner is dismissed with esc and the wait ends ready on the screen under it (`sentKeys: ["esc"]`, readiness `ready`);
   - a banner that never goes away is pressed at most twice and the wait ends not-ready with nothing typed;
   - a stale frame right after a press does not trigger a second press;
   - a banner shown while the detector reports working is still dismissed;
   - a banner shown with no detector verdict is still dismissed;
   - a banner on the same screen as the trust dialog gives blocked and no key;
   - a banner that appears after the first idle verdict still blocks a ready verdict;
   - the normal ready screen with the `esc to dismiss` footer is ready and sends no key.
5. Spec edit.

## Verify

- `cargo test -p fgos-agent-protocol --test terminal_vectors`
- `cargo test -p fgos-agent-protocol`
- `rg -il "meet gemini" packages/agent-protocol/contracts/fixtures/terminal` lists only the new banner fixture/vectors

## Risks and rollback

Marker too loose: specific phrase, evaluated only before any typing. Marker too strict (real wording differs): agy stays as today (no worse), data fix on capture. Revert the commit: additive field only.
