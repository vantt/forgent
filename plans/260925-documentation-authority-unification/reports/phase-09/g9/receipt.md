# Interim source-context receipt

Source pin: `cd4f80eccbb5c44893daec58af416395d139494b` (HEAD for this turn), **not final pin F**. The interim sweep passes; this is author evidence, not independent approval or G9 closure.

## Records and dispositions

The three cohorts contain 684 memberships: 518 (10/30/478), L12-130 overlaps 144 (10/9/125), and W0 deferred 22 (11/4/7). Their union is **574 physical records**; revision rows remain distinct.

- Record classification: **55 unchanged, 68 moved, 373 changed, 78 absent**.
- Passage classification: 3,576 unchanged, 12,522 moved, 4,101 changed, 995 absent. Git-detected file renames and same-file movement are both covered.
- Dispositions: **214 still valid as recorded, 7 need recomposition, 353 owned parks**.

`judgments.json` contains one disposition per physical record, current line ranges and hashes, and evidence joins into `passages.json`. Every row has direct source evidence. Large passages use exact line intervals, complete digests and Git retrieval commands, not truncated-text hashes. Missing sources have tree/deletion evidence; a nonexistent line is never invented. `source-context.json` preserves cohort membership.

The 353 parks are real remaining work, owned by **Documentation source-binding reviewer / Lead (G9)**. Each names its unresolved slots and a concrete source/root, retirement or successor-binding action before F. They are judged parks, not ready consumers. Exact passages retain only their original bounded decision; changed non-document operations retain it only where their exact operand and prior non-document category survive. No runtime parity or absence of new consumers is inferred.

## Specs and replay

`recomposed.json` consolidates **545 effective file bodies** onto current bytes and retains their predecessor/replacement chains. There are 536 existing-file hash guards and nine declared creations with a verified absence guard and empty virtual preimage; these are not claimed to be hashes of nonexistent files. Forty-six bodies intentionally change no bytes. Seventy-nine generated-output bodies remain evidence only: source plus regeneration is still the application door. Fourteen bodies retain their final-pin application condition.

The all-spec sweep also reports all 545 historical bodies (423 Step 7 plus 122 composition entries), including superseded/staged preimages: 32 Step 7 and 52 composition preimages differ from current source bytes. Their effective replacements, not their historical approvals, are the execution candidates. The action-linked no-op for `src/setup/git-hooks.mjs`, omitted from `effectiveSpecIds`, is included. Four old-path parks remain explicit actions rather than invented patches: generated end-user index, renamed Session Identity, retiring legacy reading map, and legacy Workflow's successor holder. See `sweep-check.json` and `composition/actions.json`.

Fifteen selected chain inputs needed current-byte rebinding; all were recomposed and replayed:

- `.githooks/pre-commit`
- `docs/io-contract.md`
- `docs/platform/agent-confinement/contracts/confinement-authority-v1.md`
- `docs/platform/agent-confinement/decisions/confinement-authority-decisions.md`
- `docs/platform/agent-confinement/history/rollout-and-settled-facts.md`
- `docs/platform/agent-coordination/decisions/README.md`
- `docs/platform/runner/architecture/h-69197b459754.md`
- `docs/platform/runner/architecture/h-7af1f0242611.md`
- `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md`
- `docs/reading-map.md`
- `plugins/fgOS/skills/terminal/SKILL.md`
- `src/runner/dispatch/assignment-runner.mjs`
- `src/runner/dispatch/confinement/policies.mjs`
- `src/runner/dispatch/herdr-round.mjs`
- `test/runner/dispatch-worker-session.test.mjs`

The existing Step 7 authored-hunk parser and exact locator were reused. The reading-map resolution preserves current hot-lock, Workflow case/guide and kernel session-lock prose; only the historical path substitutions are carried forward (`reading-map-resolution.json`, 12 current entries). Every nonempty consolidated patch passed **`patch --batch --fuzz=0 --reject-file=- -p1` forward and rollback**, with a whole-file hash guard before each invocation and byte-exact restoration. No patch was applied to the checkout.

## SHA provenance and exact re-pinned files

`sha-map.json` proves stable patch-id equality for `92260972c → 5965143b4`, `a27d85d0a → e70742232`, and retained-branch twin `3bbfa5a80 → e5af4c501`. Full SHAs and patch-ids are recorded there. The first pair also has byte-equal docs/ledger/frozen-checker input trees. Twelve equivalences were replayed in verification; nine others are historical Work-export discoveries, deliberately not re-pinned. The broad discovery's unresolved historical/measurement pins and non-commit candidates remain listed, not silently declared equivalent.

**Only these nine existing record files changed** (12 pin-valued leaves, including two composite Git locators; no other JSON values changed):

- `plans/260925-documentation-authority-unification/reports/phase-09/import2/binding-refresh.json`
- `plans/260925-documentation-authority-unification/reports/phase-09/import2/checks.json`
- `plans/260925-documentation-authority-unification/reports/phase-09/import2/deferred-rebinds.json`
- `plans/260925-documentation-authority-unification/reports/phase-09/import2/merge-accounting.json`
- `plans/260925-documentation-authority-unification/reports/phase-09/import2/receipt.json`
- `plans/260925-documentation-authority-unification/reports/phase-09/late-areas/legacy-drift.json`
- `plans/260925-documentation-authority-unification/ledger/decisions/s16-import2-resync.json`
- `plans/260925-documentation-authority-unification/reports/phase-09/g0fix/needs-writes.json`
- `plans/260925-documentation-authority-unification/reports/phase-09/g0fix/receipt.json`

`record-repins.json` authenticates every changed leaf against the patch-id map. Historical stdout and prose stay verbatim. **The frozen checker's `scripts/check-legacy-docs-ratchet.exceptions.json#/previousMainMergeAccounting/inputCommit` remains outside this exact write scope**; Lead owns its retirement/accounting disposition. Thus this turn does not claim the entire w4 source-pin-provenance REWORK closed or authorize deletion of any retained ref. No extra write permission is requested for this interim slice.

## Commands and limits

Let `G=plans/260925-documentation-authority-unification/reports/phase-09/g9`:

- `python3 -B "$G/recompose.py" --pin HEAD` — **0**, twice; 1,515 logged patch invocations per author replay.
- `python3 -B "$G/judge.py" --pin HEAD` — **0**, twice.
- `python3 -B "$G/verify.py" --pin HEAD` — **0**; all effective bodies replayed and all evidence joins checked; altered passage, missing row and altered record controls reject.
- `python3 -B "$G/sweep.py" --check` — **0**: zero unjudged rows, zero effective drift, zero unresolved recomposition errors.
- `python3 -B "$G/sweep.py" --pin HEAD^ --check` — **0**: another commit with identical source bytes does not reopen judgments merely because the retrieval commit differs.
- `python3 -B "$G/sweep.py" --pin 5e03159334df726e43ffe9505ad4ed43f72ba94d --check` — **1, expected**: actual source deltas reject current judgments/guards.
- `python3 -B "$G/provenance.py"` — **0** for the discovery run; its patch-id commands/exits are retained in `sha-map.json`, with applied decisions added afterwards.
- Read-only `git diff --check`, `git diff --cached --name-only`, and scope/status audits — **0**; index empty, writes confined to this directory and the nine files above.

`commands.json`, `patch-commands.json`, `source-read-commands.json`, `verification-commands.json`, `sweep-check.json.commands`, and `record-repins.json.commands` retain proof command arguments and exits. Missing-source Git reads may exit 128 as explicit absence evidence, never as successful reads. `determinism.json` proves both complete author replays produced byte-identical patch, judgment and evidence artifacts.

Early development attempts were not proof: one sweep exited 1 on the two provenance shapes, two incomplete composers exited 1 before exact/creation and reading-map handling was corrected, exploratory missing-path reads exited 1, and a broad first provenance scan timed out at 300 seconds before its key filter was bounded. Read-only history/exploration queries also timed out; none is reported as a pass.

No docs/product code/test edits, fgOS CLI, product tests, full suite, pair accounting, Git writes, `.fgos` reads, secret reads or ref deletion. Outbox publication is the required assignment exception. Independent source/parity review, the owned parks and final-pin delta work remain open.
