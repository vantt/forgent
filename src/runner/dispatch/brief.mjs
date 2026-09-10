// The brief: the worker's whole instruction set, as a file.
//
// Two things travel to an interactive agent. The work itself goes in a file
// on disk. Only a one-line pointer goes through the terminal. That split is
// not decoration:
//
//   - it is portable. At least one agent kind is known to swallow a
//     multi-line injected prompt; one shape that works everywhere is cheaper
//     than one shape per provider.
//   - it survives size. A real implementation prompt is long, and a single
//     paste into a TUI is a needless risk when the agent can re-read a file
//     as many times as it likes.
//   - it is round-scoped. `brief-<round>.md` is the freshness anchor that
//     tells a stale `report-<round>.md` from a current one.
//
// The brief teaches the worker exactly one gesture -- write a `.tmp`, then
// rename it -- because a half-written file that a poller happens to catch is
// indistinguishable from a finished one, and rename is the only atomic step
// available to every agent regardless of what it is written in.
//
// The order is a contract, not a preference: the report is prose the worker
// may take its time over, while the appearance of the result file is the
// thing that ends the round. Writing the result first would end the round
// before the report exists.
//
// The brief must never mention a single fgOS command. The worker is not
// expected to know what dispatched it, and a brief that assumes otherwise
// only works for workers that happen to live in this repo.

import path from 'node:path';

/** Where one round's artifacts live, all absolute -- a worker's cwd is its
 * own worktree and has no relationship to the run directory. */
export function briefPaths(runDir, round) {
  const dir = path.resolve(runDir);
  const outbox = path.join(dir, 'outbox');
  return {
    runDir: dir,
    outbox,
    briefPath: path.join(dir, `brief-${round}.md`),
    ackPath: path.join(outbox, `ack-${round}.json`),
    reportPath: path.join(outbox, `report-${round}.md`),
    resultPath: path.join(outbox, `result-${round}.json`),
  };
}

/**
 * Render the brief the worker reads. `prompt` is the real work, verbatim --
 * this function wraps it, it never rewrites it.
 */
export function renderBrief({ prompt, round, runDir, agentName }) {
  const p = briefPaths(runDir, round);
  return `# Brief ${round}

## Acknowledge first

Before you start, write this file:

    ${p.ackPath}

with exactly:

    {"round": ${round}, "agent": ${JSON.stringify(agentName ?? null)}, "receivedAt": "<ISO 8601 timestamp>"}

Write it as \`${p.ackPath}.tmp\` first, then rename it into place. Never write
a file in this directory in any other way -- a reader may look at it at any
moment, and a rename is the only step that is either done or not done.

## Your task

${prompt}

## When you finish

Write these two files, in this order, each one \`.tmp\`-then-rename:

1. \`${p.reportPath}\` -- what you did, in prose. Anything a reader needs to
   understand or check your work belongs here.
2. \`${p.resultPath}\` -- a JSON object:

       {"status": "done" | "blocked" | "failed" | "no-evidence",
        "summary": "<one or two sentences>",
        "findings": [],
        "evidenceRefs": []}

   "settled" is not a valid status here -- that word names the run reaching
   its end, not whether the work succeeded; a worker that writes "settled"
   in this file fails schema validation and the round is scored failed.

The second file is what ends this round, so write it last and only once the
first one is on disk. Nothing you write is treated as proof on its own; it is
your account of the work, and it is read alongside the repository itself.

Write only inside \`${p.outbox}\`. Everything else under
\`${p.runDir}\` belongs to whoever is watching you.
`;
}

/**
 * The single line that actually gets typed at the agent. Everything else is
 * on disk. Kept to one line on purpose: a TUI accepts it as one submission,
 * with nothing to mangle across a newline.
 */
export function renderPointer({ runDir, round }) {
  const p = briefPaths(runDir, round);
  return `Read ${p.briefPath} and do what it says.`;
}
