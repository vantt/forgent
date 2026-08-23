# Plan: backfill 68 stale-vocabulary risk items + 9 stale-vocabulary kind items, add a doctor check that catches recurrence

Item: tsk-6ax.
Mode: high-risk

## Lane

No `Mode:` hand-off existed when this session opened `fgos-coding-planning` (this
item went `clarify -> decompose` directly — its intent was already clear,
no `fgos-coding-exploring` pass ever ran, so no lane was ever decided upstream).
Applying `fgos-routing`'s Mode-gate directly (direct-entry fallback):

- auth/authorization: no.
- data model: no — this is a value backfill of an existing enum-typed
  field (`work.risk`/`work.kind`), not a schema shape change.
- **audit/security: yes** — the whole reason this item exists is that
  `decompose.mjs`'s human-confirmation gate for risky root items
  (`keywordRiskGate = work.risk === 'heavy'`) has been silently NOT firing
  for 17 items carrying the stale `risk: 'high'` value. Restoring that gate
  is an audit-control fix. This is one of the Mode-gate's own listed
  hard-gate flags.
- external systems / public contracts / cross-platform: no.
- **existing covered behavior: yes** — must not touch
  `backward-compat.test.mjs`/`workflow-stage-graphs.test.mjs`, which
  intentionally keep legacy `low`/`medium`/`high` fixture values to prove
  `validateWorkShape`'s grandfathering still works (item's own "PHẠM VI -
  KHÔNG GỒM").
- **weak proof: yes** — item's own text flags the 68-count as a
  2026-08-09 snapshot that "could already be stale."

Any hard-gate flag forces **high-risk** regardless of total count (Mode-gate
rule), so this plan is written at that depth even though the flag count
alone (2 soft + 1 hard) would otherwise land on `standard`.

## Decisions this plan is built on

No `CONTEXT.md` exists for this item (no `fgos-coding-exploring` pass ever ran —
clarify's own lightweight judge found the description already fully scoped:
concrete remap table, explicit in/out-of-scope sections, explicit run
procedure, explicit pre-flight check). This plan is built directly on the
item's own description, cross-checked against the live repo below.

**Verified against the current repo (not just trusted from the
description):**

- `decompose.mjs`'s `keywordRiskGate = work.risk === HEAVY_RISK` — confirmed
  live, only `'heavy'` ever fires it (`src/intake/plan.mjs`, the
  `resolveDecompose` risk-gate block).
- `priority-formula.mjs`: `discountForRisk` does
  `RISK_DISCOUNTS[risk] ?? RISK_DISCOUNTS.standard` — confirmed live
  (`src/state/priority-formula.mjs:15,36`), unrecognized risk silently
  falls to the `0.85` standard discount.
- `DOMAINS.coding.classification` = `{ kind: [bug, chore, design, docs,
  feature, task], risk: [light, standard, heavy] }`
  (`src/state/workflow-stage-graphs.mjs:263-266`) — the one vocabulary
  source both the backfill and the new doctor check must read from, never
  a second hardcoded copy.
- Fresh census re-run today (2026-08-09), via `fgos list --all --json`
  grouped by `risk`: **still exactly 68** (`low`: 19, `medium`: 32,
  `high`: 17) out of 511 total items — the item's own "CẦN KIỂM TRA TRƯỚC
  KHI CHẠY" pre-flight note is satisfied, the count has not drifted.
  16 of the 68 are still `status` NOT IN
  `{delivered,retrospective,cleanup,done,wontfix}` (i.e. still "open" by
  the same definition `frontier.mjs`'s `isResolvedStatus` uses); the other
  52 are already terminal. `fgos edit` (`bin/fgos.mjs`'s `edit` case,
  `store.mjs`'s `editWork`) carries no status restriction, so editing a
  terminal item is safe and idempotent — confirmed by reading `editWork`
  directly, not assumed.
- `work.kind`/`work.risk` are read by `verdict.kind` nowhere — grepped
  every `.kind` reference in `decompose.mjs`/`priority-formula.mjs`; every
  hit is the discovery/decompose *verdict's* own `kind` field
  (`'decompose'`/`'pass-through'`/`'invalid'`/`'need-human'`), a completely
  different object. `work.kind` itself is pure descriptive metadata with
  zero live gating/formula consumer today — so a `kind` backfill changes no
  runtime behavior, only data hygiene + doctor visibility.

**New finding, not in the item's own text (raised to the user before
writing this plan, since it touches the item's declared scope and the
doctor check's own literal wording):** the item's title says the doctor
check should catch "no OPEN item may carry risk/kind outside its domain's
vocabulary" — both fields, not just risk. A fresh census of `kind` found
**9 pre-existing violations** with no clean 1:1 remap the way risk has
(`low->light`/`medium->standard`/`high->heavy` is a bijection; `kind`'s bad
values — `test`, `feat`, `decision`, `discovery`, `documentation` — are not
one). Asked the user how to handle this; **decision: enforce both fields in
the new check, and backfill the 9 kind items too** (not deferred). Per-item
mapping decided by reading each item's own title (see Approach step 2
below) — none of these 9 are covered by the item's original "PHẠM VI - GỒM"
backfill table, this is the scope expansion the user approved.

One correction to my own reasoning while investigating this: I initially
worried a failing `kind` check would break this item's own
`verify` (`npm test && node bin/fgos.mjs doctor`). Verified this is FALSE —
`fgos doctor`'s CLI handler (`bin/fgos.mjs`'s `case 'doctor'`) never reads
`checks[].passed` to set `process.exitCode`; `doctor` is a pure read-only
report, confirmed by `test/setup/checks.test.mjs`'s own
`doctor --fix` assertions (`assert.equal(result.status, 0, ...)`) run
against a store that still has OTHER checks failing. So a `passed:false`
entry never fails this item's own verify — the decision to also backfill
`kind` is purely for data hygiene / doctor-signal quality, not a verify
requirement. Noting this so a future reader doesn't re-derive the same
false alarm.

## Impact-analysis posture (CLAUDE.md gate)

`fgos tool query --capability impact-analysis --status present` → GitNexus
`present`. Its index is 100 commits behind current HEAD
(`gitnexus list_repos`, `staleness.commitsBehind: 100` for the
`/home/vantt/projects/forgentX` entry) → **degraded**: ran it anyway, proof
below is marked weak and cross-checked by direct code reading rather than
trusted alone.

`impact({target: "registerCheck", direction: "upstream", file_path:
"src/setup/registrations.mjs"})` → `risk: LOW`, 2 impacted (the file's own
existing call sites, and `checks.mjs`'s re-export import) — matches direct
reading: `registerCheck` only ever pushes onto `DOCTOR_CHECKS`, called
today by 12 existing `registerCheck({...})` call sites in the same file;
adding a 13th is additive, no existing caller's behavior changes.

## Approach

Two independent tracks — a data backfill on the MAIN CHECKOUT (never this
item's own `fgw/tsk-6ax` branch, per the item's own "CÁCH CHẠY" section and
the `tsk-28o`/`tsk-3fj` precedent for `.fgos`-state-only changes), and a
code change on the branch. Order: backfill first, then land the code — so
the moment the new check exists, it already reports clean instead of
transiently red.

### 1. Backfill risk (68 items, main checkout, `fgos edit --risk`)

Re-run `fgos list --all --json` immediately before backfilling (the item's
own pre-flight requirement — today's census may not be tomorrow's), then
apply this fixed remap per item, one `fgos edit <id> --risk <value> --dir
<main-checkout-root>` call per id:

- `low -> light` (19 today): doc-fgos-rollup-howto, str89-case-study-executing,
  tsk-11f, tsk-15d, tsk-173, tsk-18t, tsk-1lg, tsk-1yt, tsk-2dq, tsk-33w,
  tsk-38h, tsk-38t-5, tsk-38t-8, tsk-3iq, tsk-3w3x, tsk-4hkd, tsk-55h,
  tsk-5ma, tsk-5wf
- `medium -> standard` (32 today): tsk-19y-3, tsk-1an-3, tsk-2ie, tsk-2xt,
  tsk-38t-1, tsk-38t-6, tsk-3fj, tsk-3gx-1, tsk-3hk, tsk-3m6, tsk-3o3,
  tsk-3v2, tsk-3wr-1, tsk-3yh, tsk-4eu, tsk-4m4, tsk-4ns, tsk-53n, tsk-592,
  tsk-5e97, tsk-5ge, tsk-5hv, tsk-5l2-1, tsk-5lr, tsk-5m7, tsk-5ov, tsk-5wr,
  tsk-5wz, tsk-6ch, tsk-dvc, tsk-f38, tsk-n4i-2
- `high -> heavy` (17 today): tsk-1o7, tsk-1tm, tsk-2c1, tsk-2ie5, tsk-2rp,
  tsk-38t, tsk-38t-2, tsk-38t-3, tsk-38t-4, tsk-38t-7, tsk-3gx, tsk-3gx-2,
  tsk-3gx-3, tsk-3w3, tsk-4l8, tsk-n4i, tsk-n4i-1

If the fresh re-census at execution time differs from this list (an item
moved, a new bad-vocabulary item appeared, one of these got deleted), the
fresh list wins — this is a snapshot, not a lock.

### 2. Backfill kind (9 items, main checkout, `fgos edit --kind`)

Per-item mapping, decided by reading each title (no clean mechanical
bijection exists for `kind` the way it does for `risk`):

| id | current kind | title (truncated) | -> new kind | why |
|---|---|---|---|---|
| tsk-1an-1 | test | Reproduce worktree .fgos/ staleness bug and write test | task | test-authoring work, not itself a bug report |
| tsk-1an-2 | decision | Decide worktree-isolation-axis: symlink-share vs copy-isolate | design | an architecture decision record |
| tsk-1an-4 | test | Verify worktree isolation in pick/take flow end-to-end | task | verification/test work |
| tsk-1ab-1 | discovery | Discover and verify fgOS choke-point candidates across CLI/runner/skill flows | task | investigative work, no dedicated "research" bucket in the enum |
| tsk-1ab-2 | documentation | Finalize fgOS choke-point survey report with no-fix decision | docs | direct synonym |
| tsk-62x-1 | feat | tạo skill /fgOS:terminal với verb rename... | feature | mechanical typo fix |
| tsk-62x-2 | feat | nâng cấp /fgOS:pick để gọi /fgOS:terminal rename... | feature | mechanical typo fix |
| tsk-1ni-3 | test | Update test fixture in test/intake/plan.test.mjs | task | test-fixture maintenance |
| tsk-1ni-4 | test | Update test fixture in test/intake/discovery.test.mjs | task | test-fixture maintenance |

All 9 are already `status: done` — zero live behavior change (confirmed
`work.kind` has no gating consumer, see Decisions above); this is pure
historical-record correctness plus doctor-signal completeness.

### 3. New doctor check (branch `fgw/tsk-6ax`, `src/setup/registrations.mjs`)

```js
// near the other listWork-based checks (checkRootDrift, checkToolRegistryConfigured)
import { isResolvedStatus } from '../state/frontier.mjs';   // new import
import { getDomain } from '../state/workflow-stage-graphs.mjs'; // new import

function checkWorkClassificationVocabulary(cwd) {
  const mainCheckout = resolveMainCheckout(cwd);
  if (mainCheckout === null) {
    return { passed: true, message: 'not inside a git checkout — nothing to check' };
  }
  const view = listWork(path.join(mainCheckout, '.fgos'));
  const violations = [];
  for (const item of Object.values(view.work)) {
    if (isResolvedStatus(item)) continue; // only OPEN items — matches the item's own "no open item" wording
    const classification = getDomain(item.domain).classification;
    if (!classification) continue; // domain declares no vocabulary (e.g. synthetic) — nothing to check
    if (classification.kind && !classification.kind.includes(item.kind)) {
      violations.push(`${item.id} (kind: "${item.kind}")`);
    }
    if (classification.risk && !classification.risk.includes(item.risk)) {
      violations.push(`${item.id} (risk: "${item.risk}")`);
    }
  }
  if (violations.length === 0) {
    return { passed: true, message: 'every open item\'s risk/kind matches its domain\'s classification vocabulary' };
  }
  return {
    passed: false,
    message: `${violations.length} open item(s) outside their domain's classification vocabulary: ${violations.join(', ')} — run fgos edit <id> --risk/--kind <value>`,
  };
}

registerCheck({
  id: 'work-classification-vocabulary',
  description: "every open item's risk/kind matches its domain's declared classification vocabulary (tsk-6ax)",
  check: (cwd) => checkWorkClassificationVocabulary(cwd),
});
```

Reuses `isResolvedStatus` (`src/state/frontier.mjs`, already exported,
already the ONE shared open/closed definition per that file's own header —
never re-derives the status set) and `getDomain(...).classification`
(`workflow-stage-graphs.mjs`, already the one vocabulary source) — no new
vocabulary, no new status logic, purely wiring.

Import-direction check (`docs/architecture-manifest.json`): `registrations.mjs`
is layer `use-case` (rank 1); `frontier.mjs` and `workflow-stage-graphs.mjs`
are `domain`/`kernel` (deeper). One-way-down import rule is satisfied — the
file already imports from `state/store.mjs` (`infra`, also deeper) today,
same direction, not a new import shape.

### 4. Test (branch `fgw/tsk-6ax`, `test/setup/checks.test.mjs`)

- Update the existing enumeration test (line 51,
  `'DOCTOR_CHECKS has exactly the three v1 checks...'`) to add
  `'work-classification-vocabulary'` to the expected id list — this test
  will fail loudly if the new check isn't wired in, which is the point.
- New cases, mirroring the existing `root-drift`/`dependencies-installed`
  pass/fail pattern (`initStore`/`addWork` into a temp `.fgos`, call
  `checkById('work-classification-vocabulary').check(tmpDir)` directly):
  - passes on an empty store (no items at all).
  - passes when every item's risk/kind is in-vocabulary.
  - fails and names the id when an OPEN item carries `risk: 'low'`
    (boundary: this is the exact legacy value the backfill removes).
  - fails and names the id when an OPEN item carries an out-of-vocabulary
    `kind`.
  - **passes despite a bad risk/kind value on a `status: 'done'` item** —
    this is the one case that proves the "open only" scoping actually
    works, not just the happy path; without it, a regression that silently
    widened the check to all-statuses would go undetected.
  - fails and lists ALL violating ids when more than one exists (not just
    the first found).
- No concurrency/partial-failure case needed: the check is a pure read
  (`listWork` only), no locking, no side effects — same reasoning
  `checkRootDrift`/`checkToolRegistryConfigured` already rely on without
  their own concurrency tests.
- Existing-behavior regression proof point: `backward-compat.test.mjs` and
  `workflow-stage-graphs.test.mjs` construct their own in-memory/fixture
  views and never invoke `fgos doctor` or this check — confirmed by reading
  both files' imports (neither imports `registrations.mjs`/`checks.mjs`).
  So the new check cannot observe or break their frozen legacy fixtures;
  this is a proof point (read, not run yet — `fgos-coding-validating` re-confirms
  before executing).

## Proof surface (for `fgos gate-approve --verify`)

Item's own real verify, unchanged: `npm test && node bin/fgos.mjs doctor`.

## Outstanding questions

None
