// context-render.mjs — renders CONTEXT.md's "## Locked decisions" table
// from `state.decisions` instead of a skill hand-typing it (tsk-1lv-3,
// CONTEXT.md D3). Mirrors bee-context-locking's own stance, quoted in
// docs/history/canonical-decision-projection/DISCUSSION.md round 6: "it
// renders; it does not decide … every locked-decision row comes from the
// caller's resolved input verbatim, never originated." `fgos decision --id
// <item-id>` (tsk-63c) is already the real write door for a locked D-ID;
// this module is the read-side wiring that closes the gap tsk-1ud left --
// CONTEXT.md's table becomes a VIEW over that same log, never a second,
// hand-typed copy.

const D_ID_TEXT_PATTERN = /^(D\d+):\s*([\s\S]*)$/;

function escapeCell(text) {
  return String(text ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

/**
 * Pure: split a decision's own `text` into its D-ID prefix and the rest,
 * per the `"D<n>: <summary>"` convention every locking skill already
 * follows (fgos-coding-exploring/-planning/-shaping). A record whose text
 * does not follow that convention renders with a `—` D-ID column rather
 * than being dropped — a defensive fallback, never a validation gate (this
 * module renders what the log actually holds, it never refuses).
 */
export function decisionDIdAndText(text) {
  const m = D_ID_TEXT_PATTERN.exec(typeof text === 'string' ? text : '');
  return m ? { dId: m[1], rest: m[2] } : { dId: null, rest: typeof text === 'string' ? text : '' };
}

/**
 * Pure: render the "## Locked decisions" table markdown from an item's own
 * `state.decisions` records (already scoped to one item id by the caller
 * -- this function does no id filtering of its own). `kind: 'engine'`
 * bookkeeping sharing the same item id (e.g. `resolvePlan`'s own
 * `decompose verdict: ...` records) is excluded -- it is never a real
 * locked design decision, same "engine bookkeeping is a distinct channel"
 * posture `state.decisions`' own `kind` field already establishes
 * (tsk-1ud D7). Deterministic (log order preserved, the same order
 * `state.decisions` already folds them in), so a repeat render over an
 * unchanged log is byte-identical.
 */
export function renderLockedDecisionsTable(decisions) {
  const rows = (decisions ?? [])
    .filter((d) => d.kind !== 'engine')
    .map((d) => {
      const { dId, rest } = decisionDIdAndText(d.text);
      return `| ${dId ?? '—'} | ${escapeCell(rest)} |`;
    });
  const header = ['| D-ID | Quyết định |', '|---|---|'];
  return rows.length === 0 ? `${header.join('\n')}\n` : `${[...header, ...rows].join('\n')}\n`;
}
