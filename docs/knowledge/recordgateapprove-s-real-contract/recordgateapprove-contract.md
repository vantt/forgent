---
framework: diataxis
mode: reference
---
# `recordGateApprove`'s real contract

`recordGateApprove(dir, { id, gate, actor, verify })`
(`src/state/store.mjs`, `tsk-19j-1`, child of `tsk-19j`) logs a
structured gate-approve event — an explicit, durable record that a
skill-embedded Gate was approved.

## Valid `gate` values

```js
// Gate approve record shape (tsk-19j D1/D11): the 3 skill-embedded Gates
// this schema covers — one per stage in the clarify->decompose sequence —
// and the only 2 actors a real approve record can name (a person, or the
// gate-bypass mechanism auto-approving on the person's behalf).
const GATE_APPROVE_GATES = new Set(['contextApprove', 'planApprove', 'validateApprove']);
const GATE_APPROVE_ACTORS = new Set(['human', 'bypass']);
```

One gate field per stage in the clarify→decompose sequence:
`contextApprove` (`fgos-coding-exploring`), `planApprove` (`fgos-coding-planning`),
`validateApprove` (`fgos-coding-validating`).

## Valid `actor` values

Exactly two: `'human'` (a person approved it) or `'bypass'` (the
gate-bypass mechanism auto-approved on the person's behalf). No third
actor value is accepted.

## Required fields, all validated

```js
export function recordGateApprove(dir, { id, gate, actor, verify } = {}) {
  const { logPath } = paths(dir);
  if (typeof id !== 'string' || !id.trim()) {
    throw new StoreError('validation', 'gate-approve requires a non-empty "id".');
  }
  if (typeof gate !== 'string' || !GATE_APPROVE_GATES.has(gate)) {
    throw new StoreError('validation', `gate-approve requires "gate" to be one of: ${[...GATE_APPROVE_GATES].join(', ')}.`);
  }
  if (typeof actor !== 'string' || !GATE_APPROVE_ACTORS.has(actor)) {
    throw new StoreError('validation', `gate-approve requires "actor" to be one of: ${[...GATE_APPROVE_ACTORS].join(', ')}.`);
  }
  if (typeof verify !== 'string' || !verify.trim()) {
    throw new StoreError('validation', 'gate-approve requires a non-empty "verify".');
  }
  const event = appendEvent(logPath, { type: 'work.gate-approve', payload: { id, gate, actor, verify } });
  const view = refreshView(dir);
  return { event, view };
}
```

All four fields are required and validated before anything is written:
a non-empty `id`, `gate` must be one of the three named values, `actor`
must be one of the two named values, and `verify` must be a non-empty
string — the real verify command the approving skill recorded at
approval time (per `tsk-19j` D3: once a gate is approved, the engine
never re-derives verify via an LLM judge — it must already be here).

## Write-door discipline

- **No FSM/work validation beyond requiring `id`** — this call never
  checks the item's current stage or status.
- **Each call is its own occurrence, folded by `gate` into
  `gates[id]`** in `replay.mjs` — a later approve on the *same* gate
  overwrites that gate's own field, never the other two. Approving
  `planApprove` a second time doesn't touch `contextApprove` or
  `validateApprove`.
- **Mirrors `addDiscovery`'s shape exactly**: single write door,
  append-then-refresh tail, no CAS.
- **Never itself moves the item** — recording an approve is purely
  additive bookkeeping; advancing stage/status stays a separate,
  explicit transition elsewhere.

## Event type

Appends `{ type: 'work.gate-approve', payload: { id, gate, actor, verify } }`
to the event log, then refreshes the derived view — the same
append-then-refresh pattern every other write door in `store.mjs`
follows.
