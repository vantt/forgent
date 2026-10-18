# Codex brief delivered through the prompt door

## Change
- `Profile.submit_by_prompt_door` (terminal/mod.rs); true only in codex.rs. `deliver_brief` then does one `send` with `submit: true` (herdr `agent prompt`), no typed text, gap or separate Enter; `confirm_submitted` unchanged as the safety net. The refused-send retry logic is shared.
- `has_paste_chip` (common.rs) recognizes `[Pasted Content N chars]`, case-insensitive.
- Codex fixture vector "paste-chip-left-in-composer..." now needs `minEnters: 1` (the confirm loop's Enter; the initial Enter no longer exists).
- Tests (tests/terminal_vectors.rs): codex uses the prompt door (one send, submit true, zero Enter); claude/agy/pi/omp still type then Enter; chip positive and negative cases.
- Docs: docs/platform/agent-protocol/spec.md codex row and Brief row; CHANGELOG Unreleased.

## Prior art
`deliver_brief` and the typed path come from the Node controller port; no earlier prompt-door delivery was removed (the inline-delivery plan wants the brief visible in the pane, which the prompt door keeps).

## Verification
- agent-protocol: 13 tests pass (4 suites); run-supervisor: 123 pass (20 suites); clippy `-D warnings` clean on both. Private CARGO_TARGET_DIR.
- Not run live against a real codex pane.
