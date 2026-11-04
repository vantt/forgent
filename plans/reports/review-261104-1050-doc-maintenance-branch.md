# Review: branch doc/260925-maintenance (Phase 10 documentation maintenance)

## Scope

- Worktree `/home/vantt/projects/forgentX-p10`, 7 commits on main `b37aea82c`
  (`46310f968` .. `2d9850892`); 123 files, +780 / -15226.
- Plan: `plans/260925-documentation-authority-unification/phase-10-post-cutover-maintenance-mvp.md`;
  facts: `plans/reports/scout-261104-1016-doc-maintenance-facts.md`.
- Commands run (read-only): `node --test` on `test/scripts/doc-health.test.mjs`,
  `test/scripts/list-doc-anchors.test.mjs`, `test/githooks/census-drift.test.mjs`,
  `test/setup/git-mutation-census.test.mjs` (all green); `scripts/doc-health.mjs`
  with the worktree host (0 findings, 628 docs, 2618 links, 302 exempt) and
  without a host (exits 1: "Rust host binary unavailable"); scratch scanners
  (scratchpad only) for the dead-path rule, the sweep notes, the headers and anchors.

## Verdict: REWORK

The code is sound and the tests pass. But two documentation commits put
false statements into canonical docs, and the docs are what this phase
delivers:

- 16 of the 26 new Provenance fields say a document was "moved/carried to
  docs/platform by 97dd62aa7", which is false.
- The sweep added a false lifecycle claim about the lease sidecar.

The fixes are small text edits plus one schema line.

## Findings, by severity

### Medium

**M1. False "moved to docs/platform by 97dd62aa7" in 16 Provenance headers (`df300488c`).**
For every header that starts with "First committed in X", X added the file at
its current `docs/platform/...` path. For all 16, `git log --diff-filter=A`
finds that same commit as the first one. `97dd62aa7` only modified these files
(`git show 97dd62aa7 --name-status -M` gives `M`, not `R`). The shas and dates
in "First committed in" are correct in all 16. The move clause is wrong in all 16:
- `docs/platform/agent-mailbox/spec.md`
- `docs/platform/agent-protocol/spec.md`
- `docs/platform/config/spec.md`
- `docs/platform/event-store/spec.md`
- `docs/platform/git/spec.md`
- `docs/platform/holder-lock/spec.md`
- `docs/platform/process/spec.md`
- `docs/platform/run-supervisor/spec.md`
- `docs/platform/terminal-control/spec.md`
- `docs/platform/yaml-document/spec.md`: "moved to docs/platform by 97dd62aa7"
- `docs/platform/secrets/spec.md`
- `docs/platform/host-invocation-routing/{history/host-invocation-baseline,history/source-inventory,r2-external-process-rollout-plan,r3-remote-peer-rollout-plan,roadmap}.md`:
  "carried to docs/platform by 97dd62aa7"

Provenance is exactly the field that the governance header exists to keep true.
Fix: replace the clause with what happened, for example "edited at the
documentation cutover (97dd62aa7)", or drop it. The 6 rows marked "Conserved at
the documentation cutover (97dd62aa7) from <source> at 947dc310…" check out:
the files were added (`A`) in 97dd62aa7, 947dc310 is a commit, and every cited
source path exists in it.

**M2. The sweep added a false lease-sidecar claim (`693effa1d`).**
- `docs/platform/holder-lock/spec.md:362` says "(the file exists only while a lease is held)".
- `docs/platform/holder-lock/spec.md:379` says "present only while held".

`releaseDocumentationCutoverLease` (`src/runner/documentation-cutover-lease.mjs:207-218`)
returns a sidecar with `state: 'released'`. Abandon returns one with `state: 'abandoned'`.
`transition` (`:148-150`) writes and commits that sidecar. After a release, the
file therefore stays committed on main. It is absent today only because no
lease was ever committed on any ref (`git log --all -- plans/documentation-cutover-lease.json`
is empty). The edit also removed the backticks to get past the new rule. Fix:
"absent until the first acquire; afterwards it stays committed with its state
(`held`, `released`, `abandoned`)", and keep it backticked with a sha pin, or
leave it unbackticked with that true wording.

**M3. The published classify outcome schema is now stale (`46310f968`).**
`packages/convention/contracts/convention.query.v1.json:66-75` is the classify
branch of `convention.query.outcome`. It has `additionalProperties: false` and
only `kind/cardinality/scope`. The host now emits `canonical`,
`metadataExempt` and `generated`, so any consumer that validates against the
contract rejects every classify result. The change is additive in the Rust
struct, the golden case and the spec (`docs/platform/convention/spec.md:171`),
but not in the schema. No test catches this, because `golden.rs:161-167` reads
only the schema `$id`s. Fix: add the three boolean properties to that branch
(required, since the host always emits them). Callers checked: the only
consumers are `apps/fgos/src/cli_projector.rs` (pass-through),
`packages/convention/rust/tests/golden.rs` (exact match, updated) and
`scripts/doc-health.mjs:174`. No other Node caller exists.

### Low

**L1. The sha-pin exemption accepts any hex-looking token (`scripts/doc-health.mjs:121,150`).**
`COMMIT_SHA` matches any 7-40 character hex word that has both a digit and a
letter. It never checks that the token is a commit. Doc ids (`h-36d872fbb0e5`),
blob shas, digests and the 8-hex ids in old work notes all exempt their whole
line. A measured case is a live false negative:
`docs/platform/work-state/architecture/implementation-pointers.md:35` points at
`src/state/fsm.mjs`, which was renamed to `status-fsm.mjs` in `7e01c80e6`. The
line escapes the rule only because of `(per pr-lifecycle / 1359ab5e)` and
`2e92b7a5`, and neither of those resolves in git. Across canonical
current-state docs, 178 dead paths sit on lines with a real commit and 3 sit on
lines with only a fake token. Of those 3, one is the line above, one is a blob
sha (`packaging-distribution/spec.md:473`, legitimate) and one is a historical
pointer (`work-state/spec.md:85`). Fix: resolve the candidate tokens with one
`git cat-file --batch-check` (`<tok>^{commit}`) per run, or accept only tokens
that resolve. That costs one git process and removes the false negatives that
come from ids.

**L2. The dead-path rule fails open when classify returns no flags (`scripts/doc-health.mjs:156-157`).**
When a host predates `46310f968` but has the Phase 9 rules, `canonical` is
`undefined`, so `!canonical` skips every document without saying anything.
Today the metadata rule would flood (`metadataExempt` is also undefined), so the
run still fails, but only by accident. The activated design-lap release
(`e02ee83d…`) fails closed (classify errors with `unknown-kind`), and so does a
plain run with no host. Fix: throw when `typeof canonical !== 'boolean'`.

**L3. The plan's decision 5 is contradicted and nothing records why (`159971615`).**
Decision 5 (phase-10 file, line 26) says `scripts/generate-shipped-path-inventory.mjs`
stays "because the census suite uses it". Scout Q1 (the CONV2 input) is also
still open. The branch deletes the script and its test. Verified: on main the
only "census" use was the census JSON listing the script as a git writer, and
the CONV2 plan does not cite it. So the retirement is defensible, but the plan
decision and Q1 must be amended or closed in the same landing.

**L4. The plan data was edited partway (`8b38f576c`).**
`plans/260925-…/minimum-constitution.json` changed two `enforcedBy` rows from
`check-doc-retirement.mjs` to `kind: "planned"`. That label is wrong, because
the check was retired, not planned. Rows still point at the deleted
`scripts/check-doc-constitution.mjs` and `scripts/check-doc-inventory-gates.mjs`.
Either freeze the plan data (the stated policy: "plan-dir data stays") and
revert these edits, or update every row consistently with a `retired` kind.

**L5. Header blocks are invisible to the dead-path rule.**
`proseOf` masks every fence, and that includes the governance ```txt header, so
`Implementation:` and `Related:` paths are never checked. There are 80 dead
header paths today. All of them are Provenance or historical-source pointers,
plus one accurate "are deleted" statement (`config/spec.md:8`), so no live
false claim was found. Still, `Implementation` is the field most likely to drift.
Consider checking the `Implementation` line only.

**L6. Documentation gaps.**
- Plan step 10.4 promised one sentence in governance §11, and it is absent.
  The rule is described only in `convention/spec.md:382`.
- That paragraph says the synthetic cases own "the link grammar and the
  metadata rule", but it leaves out the dead-reference case.
- `src/setup/registrations.mjs` confinement comment: `docs/platform/agent-confinement/spec.md`
  would be more exact than the portal README. This is a nit.

### Informational

- The repo roots are scoped to `src|scripts|bin|apps|packages|core|test|docs|plans`.
  Dead paths outside them (`examples/mailbox-test-hook.rs`, `.agents/skills/fgos-code-change`,
  `.claude/hooks/...`) were found only in historical or negative statements.
  No live gap.
- The rule pushes authors to reformat. One example table became a ```text block
  (`convention/spec.md` §contract cases), and "There is no `docs/platform/system/`"
  became plain prose. The meaning was kept in every case I checked, but fences
  are now a way to bypass the rule.

## Checks requested

1. **Rule correctness.** Metadata: `governanceBaselineFields` reads exactly the
   12 §5 fields (`governance.md:169-182`). `headerBlock` requires the block to
   sit directly under the H1, and no baseline field has an empty value anywhere.
   Exempt kinds follow decision 2 (`decision`, `history` and `verification` are
   past-state; non-canonical kinds such as proposal, portal, roadmap and
   evidence-payload are skipped through `canonical`). Host: the test uses
   `FGOS_HOST_BIN || target/debug/fgos`, the same harness as
   `convention-client.test.mjs`. A plain run resolves the activated release,
   which on design-lap is pre-flag and fails closed. False negatives: see L1, L2, L5.
2. **Sweep accuracy.** All 94 "(deleted in sha)" notes in `693effa1d` were
   checked automatically. Each sha is a commit with `D`/`R` for that path, it is
   the last commit to touch the path, and the path is absent at HEAD. The only
   exception is the glob `docs/specs/*.md`, which is correct. All 17 retargets
   to `archive/plans/...` and the mailbox `packages/.../tests/*.rs` paths exist.
   About 30 rewordings were read by hand. Meaning was kept, except M2. The
   "not in git / outside this repo" notes were confirmed with `git log --all`
   (f4-benchmark, p50-workflow-induct-6, how-to-parallel-lanes, events-merge-driver,
   check-verify). All 9 code-comment retargets exist, with the cited §14.6, §13.4,
   §7.2, §7.3 and §9.2 headings. Headers: all 26 were checked. The first-commit
   shas and dates are right, the move clause is wrong in 16 (M1), and the
   conserved sources are right.
3. **Retirements.** `rg` over package.json, .githooks, src, bin, scripts, test,
   core, docs, packages, apps, domains, .agents and plugins finds no import,
   spawn or name of a retired script. The only hits are the sealed history JSON
   and old CHANGELOG lines, which are records. Test ownership: both commit
   messages name an owner or say the behaviour was removed. I verified that the
   rewritten `listAnchors` accepts no anchor the old extractor rejected (0
   gained, over 628 docs). The 17.7k anchors it lost are the removed block
   anchors, and the live link case shows no link used them.
4. **Contract.** The Rust struct, the golden cases (3 updated, 3 new) and the
   spec line 171 are consistent. The schema is stale (M3).
5. **Census.** Both census test files pass (6/6, with `CLAUDE_CODE_SESSION_ID` unset).
   `verifyCensus` passes (1242 files) and the payload digest matches. A full
   in-memory regeneration could not run here because the git addon is not
   shipped on this channel, so the census was not proven byte-equal to a fresh scan.

## Recommended actions

1. Fix the 16 Provenance clauses (M1) and the two holder-lock lines (M2).
2. Add `canonical`, `metadataExempt` and `generated` to the classify branch of `convention.query.v1.json` (M3).
3. Resolve sha-pin tokens against git and fix `implementation-pointers.md:35` (L1). Throw on missing flags (L2).
4. Amend plan decision 5 and Q1 (L3). Make `minimum-constitution.json` consistent or revert it (L4).

## Status

Status: DONE_WITH_CONCERNS
Summary: Verdict REWORK. The rules, the retirements, the census and the classify code are sound. Two documentation commits added false statements: 16 Provenance headers claim a move that never happened, and the lease sidecar lifecycle is described wrongly. The query schema was also not updated for the new classify fields.
Concerns: Census byte-equality was not proven, because the full scan needs the git addon. Activating a release with the new classify (plan Q1/G1) is still needed before a plain `doc-health` run works on design-lap.

## Addendum: re-check of the fix-up commits (2026-11-04)

Commits checked: `097cf6f7f`, `568f442f8`, `b7873f150`, `0c41170da` and `1bdcb0e49`, on top of `2d9850892`. Commands run:
- `node --test` on `test/scripts/doc-health.test.mjs` and `test/scripts/list-doc-anchors.test.mjs`: 7/7 pass. The live case takes about 15 s.
- `node --test` on `test/githooks/census-drift.test.mjs` and `test/setup/git-mutation-census.test.mjs`: 6/6 pass.
- The prebuilt `target/debug/deps/golden-d9933db798c64d3f`: 11/11 pass, including the new schema test. I did not run cargo.
- A full in-memory census regeneration after `ensureScriptAddon`. It is byte-equal to the committed `mutation-census.v1.json`, so the concern I left open in the first round is now closed.

### Status of each finding

| Finding | Status | Evidence |
|---|---|---|
| M1: false move clause in Provenance | Fixed | None of the 16 headers keeps "moved/carried to docs/platform by"; `rg` finds no such clause outside history and verification. The "First committed in" shas and dates are unchanged and were already verified in the first round. |
| M2: false lease-file claim | Fixed | `holder-lock/spec.md:362,379` now say the file is absent until the first acquire is committed, then stays committed with `state` set to `held`, `released` or `abandoned`. This matches `transition`, which writes and commits the sidecar on every state change (`documentation-cutover-lease.mjs:148-150`, `:207-218`). |
| M3: stale classify schema | Fixed | The classify branch of `convention.query.v1.json` now declares the three booleans and requires them. The new `classify_golden_outputs_match_the_published_outcome_schema` checks that every declared field is required, and that every classify golden output has exactly the declared fields. That covers drift in either direction. |
| L1: any hex token counted as a pin | Fixed | See "The new L1 code" below. |
| L2: dead-path rule fails open | Fixed | `scripts/doc-health.mjs:161` throws when `canonical` is not a boolean. The synthetic case asserts the error. |
| L3: plan decision 5 contradicted | Fixed | Decision 5 in the phase file is amended with the reason. Decision 2 now lists `verification` among the exempt kinds. |
| L4: plan data edited partway | Mostly fixed, one new defect | Every row that pointed at a retired script now reads `kind: "retired"` with `was` and `note`. New defect: at `minimum-constitution.json:815-820` the `checkedBy` object has two `note` keys. A JSON parser keeps the last one, which is the old "--promotion reports …" note, so the new retirement note is silently lost. Merge the two notes into one key. This is Low: the file is plan data that no code reads. |
| L5: header blocks unchecked | Unchanged | It was recorded as a design note with no live instance, and no fix was asked for. |
| L6: documentation gaps | Fixed | Governance §11 states the rule, and `convention/spec.md:382` names the dead-reference synthetic case. I accept the confinement-comment nit as is. |

### The new L1 code (`scripts/doc-health.mjs:124,148,171-182`)

- **Correctness.** The token regex now has the `g` flag and is used only through `String.prototype.match`, so `lastIndex` state cannot leak between lines. A line is exempt only if one of its tokens resolves. `resolveCommit({ name })` reaches `resolve_commit_ref` (`packages/git/rust/src/inspect.rs:989`). That runs `rev-parse -q --verify --end-of-options <tok>^{commit}`, so a blob sha, a digest or an ambiguous short sha comes back `None` and the line is still checked. The `--end-of-options` and NUL guard handle unusual input. The call shape `{ name }` matches the existing callers, for example `src/setup/registrations.mjs:5227`.
- **Caching.** There is one `Map` per run, keyed by token, with a cached boolean. Each distinct token is resolved once, and it is resolved lazily: only lines that hold a candidate token, in files being scanned, trigger a call. That is correct.
- **Git door.** The resolver goes through `scripts/lib/git-ports.mjs` `inspectRepo`, the documented door for outer scripts (Git spec §13). No raw `git` child remains, and the census regeneration confirms the scan accepts it.
- **Low: errors are swallowed.** `try { … } catch { sha = null; }` treats any driver failure the same as "not a commit", including `ref-resolution-failed` and a timeout. The result fails closed (extra findings, never fewer), but a driver fault would show up as dozens of misleading dead-reference findings. A better version maps only the `None` case to `false` and rethrows other errors. Opening the port fails loudly, because that error is not caught.
- **Informational: host changes mid-run.** When the addon is not loadable from a host payload, `ensureScriptAddon` → `ensureGitAddon` sets `process.env.FGOS_HOST_BIN` to the checkout's staged dev host. In `runCli`, the metadata pass's classify calls run before the resolver is created, and the dead-reference pass runs after. So one plain run can classify through two hosts. With no host set, a plain run still exits 1 at the metadata pass ("Rust host binary unavailable"), before the staged host is set. Both hosts come from this checkout, so the verdict is the same; the only visible effect is that ordering changes whether a plain run works. Under the test launcher and with `FGOS_HOST_BIN` set, behaviour is stable. If the staged addon digest is stale, the first plain run may also trigger an addon build, which is the existing behaviour of every script that uses the Git door.

### The three paths the stricter check exposed

1. `work-state/architecture/implementation-pointers.md:35-36`: `src/state/fsm.mjs` → `src/state/status-fsm.mjs`. The file exists, holds `TRANSITIONS`, and was the rename target in `7e01c80e6`. The `step-fsm.mjs` line's "mẫu hệt `status-fsm.mjs`" was updated to match. The meaning is unchanged. The unrelated ids `1359ab5e` and `2e92b7a5` stay as prose and no longer exempt the line.
2. `packaging-distribution/spec.md:473`: `docs/specs/distribution.md (deleted in 97dd62aa7)`. This is true: the file is `D` in `97dd62aa7` and that is its last touch. The blob sha stays as the content coordinate.
3. `work-state/spec.md:85`: the example value `docs/history/p50-workflow-induct/` became `docs/history/<tên-thư-mục>/`. That directory was never in git, and this column holds an example value, so a placeholder is truthful. The "per p50-workflow-induct / 28e6184b" attribution is kept.

### Regressions

None found. The live doc-health case passes over 628 docs with 0 findings. The anchor and census suites are green, the census is byte-equal to a fresh scan, and the golden suite is green. No retired-script reference came back.

### Verdict: ACCEPT

All Medium findings are fixed and proven. Two Low items remain, and neither blocks: the duplicate `note` key in `minimum-constitution.json:818-819` (fix before landing; one line), and the resolver catching every error.

Status: DONE
Summary: All three Medium findings and L1-L4 and L6 are fixed. The new commit check resolves through the Git door with a per-token cache, and the three exposed paths were repaired truthfully. The census is proven byte-equal to a fresh scan. ACCEPT.
Concerns: a duplicate `note` key in the plan data hides the new retirement note. The resolver's catch-all turns driver faults into dead-reference findings.
