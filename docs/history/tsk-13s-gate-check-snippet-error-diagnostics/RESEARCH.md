# RESEARCH.md — tsk-13s

## Round 1 — 2026-08-13 (fgos-researching, stage discovery)

**Goal:** confirm the item's own proposed fix (log to stderr before
printing 'false') is correct and doesn't change the stdout contract.

Read `.claude/skills/fgos-coding-validating/SKILL.md:277` — confirmed
`tsk-blk`'s own `.catch(() => console.log('false'))` swallows every
error, not just `JSON.parse` failures. Manually reproduced both shapes
live: malformed JSON (`SyntaxError`) and a bad `plan.md` path (`ENOENT`
from `fs.readFileSync`) both currently produce empty stderr, stdout
`'false'` — indistinguishable from each other, and from a genuine gate
refusal.

Applied the fix (`.catch((err) => { console.error(String((err &&
err.message) || err)); console.log('false'); })`) and manually confirmed
live: stdout still exactly `'false'`, stderr now carries the real
message (`ENOENT: no such file or directory, open '...'` for the bad-path
case). Stdout contract unchanged — the skill's own prose ("anything other
than exactly `true` on stdout ... treat as `false`") still holds
byte-for-byte; only stderr gained real diagnostic content.

**Item note found to be non-issue:** the item description guessed
"item không tồn tại" (unknown item id) as an example non-JSON error case.
Checked directly: `mergedGateHaystack`/`isTierCovered` both use optional
chaining (`item?.title`, `item?.tier`) — an unknown item resolves to
`undefined` and flows through the NORMAL return path (no throw), so it
would never reach the `.catch()` at all. Used a bad `plan.md` path
instead for the "non-JSON error" test case, which does throw
(`fs.readFileSync` ENOENT) — a real, reproducible non-JSON error shape.

## Verify / classification

`node --test test/state/gate-bypass.test.mjs test/skills/fgos-mirror.test.mjs`
— 49/49 + 7/7 pass. Item's own auto-classification (`risk: standard,
tier: standard, kind: bug`) matches the real change weight — one-line
prose fix across 3 mirrors, 2 updated tests + 2 new ones, zero storage/
schema logic touched.

**Clear.**
