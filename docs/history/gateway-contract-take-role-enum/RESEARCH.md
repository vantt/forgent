# Research — takeWork role enum mismatch (tsk-67gr)

## Round 1 — 2026-08-14

**Asked:** which side is the outlier — the contract's `enum: [human,
runner, session]` (`docs/contracts/fgos-gateway-api-v1.yaml:284`) or the
CLI's own `take --role` validation (`bin/fgos.mjs:2707-2710`, `if (role
!== 'human' && role !== 'session') throw ...`)?

**Checked:**
- `bin/fgos.mjs:2695-2699` (`case 'take':`'s own doc comment, directly
  above the validation) — a real, deliberate design statement, not an
  accidental omission: "Cửa pull — take (stage-decompose S2-pull D1): a
  tác nhân ngoài runner (human by default, session for a live agent) claims
  exactly one item" — "an actor OTHER THAN the runner claims exactly one
  item." Cites its own decision id (S2-pull D1).
- This matches the audit finding's own framing exactly: "the pull door
  deliberately excludes the runner role today."
- No evidence anywhere in this file or the contract that `runner` was ever
  meant to be a real, currently-supported `take --role` value — the
  contract enum appears to have been written aspirationally/by analogy to
  the OTHER `role` enum in this same file (`WriterRole`'s
  `[human, runner, session, system]`, a different field entirely) rather
  than checked against `take`'s own real, documented scope.

**Found:** the contract is the outlier here, not the CLI — `take`'s own
`runner`-exclusion is a real, cited, deliberate design decision (S2-pull
D1), not a gap to fill. The correct fix narrows the contract enum to match
reality, the reverse direction from Finding 1 (there the contract was
right and the code was the outlier) but the same principle: match spec to
whichever side is the real, deliberate source of truth.

**Still open:** none.
