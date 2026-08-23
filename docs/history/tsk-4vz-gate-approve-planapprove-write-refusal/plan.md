# plan.md — tsk-4vz

Mode: small

No `CONTEXT.md` — discovery returned `clear` directly. Scope was revised
from the item's own original proposal during discovery — see
`RESEARCH.md`'s "Material finding that changes scope" section for the
full reasoning; summarized here.

## Approach

Original proposal (remove `'planApprove'` from `GATE_APPROVE_GATES` at
the storage layer) would break 6+ real test fixture call sites that use
`recordGateApprove` to simulate pre-`tsk-224` items. Revised: refuse
`--gate planApprove` at `bin/fgos.mjs`'s `gate-approve` CLI verb instead
— the actual user-facing surface, leaves the storage layer's generic
write capability (needed by tests and, in principle, any future replay
tooling) untouched.

| Site | Risk | Proof point |
|---|---|---|
| `bin/fgos.mjs` `case 'gate-approve':` | low | new CLI test (3 cases) + full `npm test` |

No proof point leans on blast-radius/impact-analysis evidence beyond
what's already recorded above (degraded posture, cross-checked with grep
per the `CLAUDE.md` gate).

## Shape

One piece, no split — a single guard clause plus its test.

Files touched:
- `bin/fgos.mjs` — refuse `gate: 'planApprove'` before calling
  `recordGateApprove`
- `test/cli/fgos-gate-approve.test.mjs` (new) — 3 cases: rejects
  `planApprove`, accepts `validateApprove`, accepts `contextApprove`

## Outstanding questions

None
