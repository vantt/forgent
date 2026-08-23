# Verify, Commit, and Iron Law evidence — full mechanics

The full detail behind SKILL.md's Step 3 and Step 4.

## Step 3: Verify — proof, not assertion

**Skip this step entirely when mechanism was `out-of-process`** — the
worker already ran verify itself per the Hard rule; re-running it here
would be redundant at best and misleading at worst if the workspace has
since changed. Otherwise (you did the work yourself), run the item's own
`verify` command exactly as recorded on the item (`fgos check <id>` or
`fgos list --json` shows it). A prose description instead of a runnable
command is not this skill's problem to invent a substitute for — that is
a shaping defect from `fgos-coding-planning`; park the item and say so
rather than inventing a check. On failure, fix the root cause and rerun
the exact command — never weaken the command or swap in an easier one to
make it pass. If the failure is a confusing "command not found"/
wrong-output result rather than a clean test failure or a clean shell
syntax error, read `docs/how-to/preserve-shell-escapes-when-transcribing-
a-verify-command.md` — a backslash-escaped backtick lost during an
earlier hand-transcription is a common, quiet cause.

## Step 4: Commit, then check Iron Law evidence

The Iron Law gate's own file-set computation (`changedFiles`,
`src/runner/merge.mjs`) diffs `trunk...branch` — COMMITTED history only,
the exact same committed-ref shape `approve`/`sync-root`'s own gate
diffs at merge time (the trigger must reuse the real classifier against
the real diff, never an early-prediction heuristic). Running this check
before committing the implementation is a false negative, not a skip —
the diff sees only whatever was already committed (typically just the
earlier plan.md/CONTEXT.md commits), so the classification comes back
`{required:false}` even when the real diff would trip the gate, silently
skipping `iron-law-evidence.md` and forcing a retroactive scramble to
reconstruct proof once `approve` correctly catches it later. So:

**If mechanism was `out-of-process`**: the worker already committed its
own change per the Hard rule — do NOT `git add`/`git commit` again here
(the tree is already clean; a second commit attempt on a clean tree
fails or no-ops). Skip straight to the classification step below,
against the worker's own commit.

**Otherwise** (you did the work yourself): `git add` and `git commit`
the real implementation (and its now-passing verify from Step 3) FIRST —

```bash
git add <files this item actually changed>
git commit -m "<conventional-commit message, item id included>"
```

— THEN compute the exact file set the gate itself uses and classify it
the same way (`classifyIronLaw`, `src/evolve/iron-law.mjs`), against that
now-real committed diff:

```bash
node --input-type=module -e "
import { changedFiles } from './src/runner/merge.mjs';
import { classifyIronLaw } from './src/evolve/iron-law.mjs';
import { listWork } from './src/state/store.mjs';
const item = listWork('.fgos').work[process.argv[1]];
const filesChanged = changedFiles('.', item);
console.log(JSON.stringify(classifyIronLaw({ filesChanged, description: item.description })));
" "<id>"
```

When the result's `required` is `true`, write
`docs/history/<id>/iron-law-evidence.md` — the matched flags/modules
from that same result, the test command Step 3 already ran, and its real
failing-before/passing-after transcript excerpts (the failing-test-first
proof) — and commit it as its own follow-up commit (the implementation
already landed in its own commit above; the "one commit per item" rule
is about the implementation itself, not a ban on this small additive
evidence commit that necessarily comes after it). When `required` is
`false`, write nothing; this cost is only paid for the items the gate
will actually apply to.
