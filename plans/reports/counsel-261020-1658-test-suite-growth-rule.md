# Counsel: a rule for test-suite growth

Date: 2026-10-20 17:10 (Asia/Saigon). Advisory only; nothing in the checkout was modified. Evidence was sampled from `main` at `fcd317df`, branch `origin/git/p07-switch`, and archived plans; every number below has the command or file it came from.

## TL;DR

The suite is not mostly redundant; it is ungoverned. Byte-identical or name-identical duplication is small (about 3% of `test()` calls by direct evidence), but every rule in force pushes one way — add, keep, never weaken — and no rule says what a test is *for*, so nothing ever leaves and new tests land in new files instead of extending the owning one. Replace "new or changed behavior gets a matching test" with **one owning proof per behaviour, at the lowest layer that can observe it, with at most one wiring proof per boundary above it**; define *weakening* so that retiring and merging stop counting as weakening; make deletion of a mechanism retire its tests in the same change; and surface a one-line suite-size/time signal in `npm test` so the number is seen every time. The one-time cleanup that is safe today is narrow (clones, Node mirrors of Rust cases, the top-50 runtime files); the large Cartesian clusters should not be hand-pruned — that was already proven in September and the finding still holds.

## 1. Diagnosis

### 1.1 Growth, measured

`git grep -c '^\s*(test|it)\(' <sha> -- '*.test.mjs'` and `git ls-tree` on `main`:

| Date | `*.test.mjs` files | `test()` calls | Note |
|---|---:|---:|---|
| 2026-08-01 | 94 | 1,987 | |
| 2026-09-01 | 244 | 4,551 | |
| 2026-10-01 | 424 | 7,542 | |
| 2026-10-10 | 386 | 6,679 | after `2180b4e72` (L4 coordination engine retired, 79 test files deleted) — proof that retirement works when a mechanism is deleted whole |
| 2026-10-15 | 443 | 7,412 | |
| 2026-10-20 | 581 | 8,066 | plus 1,295 Rust `#[test]` across `packages/*/rust` and `apps/` |

Last five days: +138 files, +654 tests. The 152 files added since 10-15 average **6.2 tests per file** (suite average 13.8); **52 of them hold three tests or fewer**. That is the shape of sprawl (RUL11): each lane opens a new file rather than extending the owning one.

Volume: 178,557 lines of `*.test.mjs` against 104,818 lines of Node source (`src/`, `bin/`), 1.7:1; `test/runner` 69.7k vs `src/runner` 47.2k; `test/state` 19.4k vs `src/state` 12.6k. 27,087 `assert.` calls. Last seven days on `main`: 563 commits touched tests (merges included), 143 of them touched no source; test lines +43.7k/−21.8k while Node+Rust source moved +88k/−26k — so the week's growth is roughly proportional to the Rust-port programme, not detached from it. The problem is judgement, not volume.

Nobody tracks the number: `docs/specs/reading-map.md:61` still says "`npm test`, 2970 test".

### 1.2 What drives the growth (rules and their literal reading)

1. **AGENTS.md L5 q5** — "new or changed behavior gets a matching test". Read by an AI lead as "add a test", never as "find the owning test and extend it". There is no sentence anywhere that says a behaviour has *one* proof.
2. **Git spec §15 E6** (`docs/platform/git/spec.md:627`) — three labels, but *retired* is restricted to "the event-file families of D-ADR0055". Everything else can only be *kept* or *retargeted*. Leads obey literally: the u13 inventory (`scout-261020-1616-git-p07-u13-census.e6.json`) has `retired: 0, retargeted: 0`; the u5 report states "All 989 original assertion lines are present … New worktree-ports tests cover …" as its success claim. The phase-07 brief (`phase-07-caller-migration-and-one-door.md:78`) adds "no assertion weakened" and "every retained G-id in §16 points to a test" — §16 has **271 G-ids**, so the lesson map alone is a floor of 271 tests with no ceiling.
3. **"Never weaken"** (development rules, review rules, briefs) has no definition, so a lead treats deleting a line as weakening. Retiring a test whose mechanism is gone is not weakening; the rules never say so.
4. **Frozen inventories T/T2/T3** (`plans/reports/git-lessons-sweep-261017/`, 2,384 + 133 tests catalogued with ids) read as "do not touch these". `sweep2-tests-missing.md` turns 18 NONE / 52 partial lesson rows into demand for new tests even where an existing test already covers the lesson.
5. **Per-file runtime pressure** created literal clones. `test/setup/checks-doctor-config.test.mjs` was created by `c6f40b05b` (2026-08-23, "split checks.test.mjs again as main regrew it past ~30s"); today it shares **61 titles with `checks.test.mjs`, 55 of them byte-identical bodies** (verified by normalised body comparison). Both files run in every `npm test`. The split happened without deleting the originals, and nothing noticed for two months.
6. **Spec-mandated two-route conformance.** §15 requires proofs "through Rust and the relevant Node route". Since 10-15 the ported areas gained Node tests: `test/git` 92, `test/holder-lock` 109, `test/event-store` 70, `test/run-supervisor` 143, `test/terminal-control` 19 — **433 Node tests** beside 1,295 Rust tests. Some are route proofs (legitimate); some re-prove Rust cases from Node; 22 Node files read `packages/*/contracts/*.json` and assert the *prose* of the contract (`test/holder-lock/hot-lock-contract.test.mjs:33-40` does `assert.match(rules, /judge .* answers dead/)`) — documentation tests with no behaviour behind them.
7. **Fixture boilerplate, not shared.** 312 of 581 files spawn a child process; 339 call `mkdtemp`; 149 run their own `git init`; 85 define a private `make/setup/initRepo|Fixture|Worktree` helper; only 62 import a shared fixture helper and only 98 import anything from `test/helpers` or `test/util`. This is lines and seconds, not test count, but it is why "the suite feels heavy".

### 1.3 What share looks redundant (honest ranges)

| Class | Evidence | Share of 8,066 `test()` | Confidence |
|---|---|---:|---|
| Byte-identical clones across files | 55 in `test/setup`; whole-suite title duplication 8,024 titles vs 7,828 distinct | ~1% proven, up to ~2.5% if the other cross-file title clashes are clones too | high |
| Node re-proofs of Rust cases / contract-prose tests | 433 Node tests in ported areas, 22 contract-shape files | 2-3% (170-260 tests) | medium — needs the per-port inventory in §4 |
| Cartesian enumerations (`fgos-merge*`, `fgos-approve-1..6`, `fgos-intake-1..6`, `fgos-read-1..4`, `operation-choice`) | `investigation-260922-duplication-and-combinatorial-audit-batch2.md`: **no 1-1 duplication** (each test caught a distinct mutation), but 70-90% compressible by pairwise with pinned regression witnesses (`merge` 324 → ~12 + witnesses) | 10-15% *compressible*, **0% deletable by hand** | high on both halves |
| Tests of deleted code | import scan: no test imports a missing module | ~0% today (the 10-02 retirement did its job) | high |
| Runtime concentration | Sept profile (`p06-final-profile/junit.xml`, 356 files, 3,581 s summed case time): top 20 files = 39%, top 50 = 65%; `fgctl-init` 233 s, `fgos-merge` 130 s, `fgos-return` 103 s, `fgctl-upgrade` 93 s, `fgos-merge-2` 75 s, `loop` 70 s | — | medium (profile is a month old; re-profile in §4 phase 0) |

Net: roughly **3-4% of tests are redundant on today's evidence**, a further **10-15% is structurally compressible only with a generator or use-case extraction**, and **two-thirds of wall time sits in 50 files** whose cost is process boundaries, not test count. The owner's suspicion is correct about the *process* (nothing judges necessity, nothing ever retires) and overstated about the *mass*.

### 1.4 Prior art that already exists and was forgotten (RUL11)

- `scripts/test-proof-inventory.mjs` — P00A inventory plus a warning-only `--check` admission ratchet (new `init` call without `// boundary:`; new network call without `// provider-boundary:`). Not wired into any hook, script or CI.
- `scripts/test-timing.mjs profile` — JUnit per-test timing. Artifacts exist only under `archive/`.
- `scripts/test-select-mutate.mjs`, `scripts/test-select-coverage-map.mjs` — mutation and per-file coverage mapping, built for the related-selector; usable as cleanup evidence.
- `scripts/check-decision-codes.mjs` + baseline — ratchet against task ids in titles; 287 titles still carry `tsk-`/`G-`/phase labels, all in the baseline.
- `scripts/test-ownership-lint.mjs` + `test/test-ownership.mjs` (104 lines, pilot area only).
- Plans `archive/plans/260915-0455-test-suite-feedback-cost`, `260920-immediate-test-feedback-reduction`, `260922-test-suite-optimization` — all `status: completed`; Pillar 1 (pairwise) never built, Pillar 2 (direct use-case) produced four files in `test/direct/`, Pillar 3 (selector) landed. Rule 5 of the 2026-09-15 plan is still right: "No optimization may delete a boundary proof merely because a lower-level test …".

The mechanism in §3 reuses these; it does not add a new tool.

## 2. Proposed rule set

Design principle behind every text below: **a behaviour, not a line, is the unit of preservation.** One owning proof at the lowest layer that can observe the behaviour; at most one wiring proof per boundary the behaviour crosses (Node route over Rust port; CLI over use-case; e2e over CLI); weakening is asserting less about a behaviour that still exists; retiring a proof whose behaviour is gone, or whose cases another named proof owns, is not weakening.

### 2.1 AGENTS.md — L5 question 5 (replacement text)

> 5. **What proof means done?** `npm test` (state + cli + runner + e2e suite) and `cargo test --workspace` green. Every behaviour has **one owning proof**: the test at the lowest layer that can observe it. A new or changed behaviour gets its owning proof there; a boundary above it (Node route over a Rust port, CLI over a use-case, e2e over CLI) gets at most one wiring proof, never a second copy of the cases. Before adding a test, name the behaviour in the title in plain words, search the suite for its owning proof (`rg` the behaviour's words and the symbol), and extend that proof when it exists; open a new test file only for a new module or a new boundary. Deleting or replacing a mechanism retires its tests in the same change; a test outlives its mechanism only when it proves a behaviour that still exists and nothing else proves, and the change names where that behaviour is now owned. *Weakening* is asserting less about a behaviour that still exists and stays forbidden; moving, merging or retiring a proof is not weakening. Green must come from real behavior: never add an env switch, flag, or test-only code branch that skips checks to make tests pass; fix production code or the fixture instead.

(≈170 words, against ≈60 today. If L8 doctrine-placement pressure says this is too long for the always-loaded layer, keep the first four sentences in AGENTS.md and move the "weakening" definition into `core/instructions/design-principles.md` as principle 8 **One proof** — that file is the projected source already rendered into AGENTS.md, so it is one door, not a second copy.)

### 2.2 `docs/platform/git/spec.md` §15 — E6 test-preservation rule (replacement for the sentence starting "The test-preservation rule is:")

> The test-preservation rule is: every assertion that reaches a Git write site gets exactly one label, and the label is about the **behaviour** the assertion proves, never about the line. **Kept**: the behaviour still exists and this assertion is its owning proof; it runs through the new port unchanged. **Retargeted**: the behaviour still exists; only the import, fixture or port under the assertion moves; the asserted outcome is not weakened. **Retired**: either the behaviour no longer exists under this spec (the mechanism is deleted or superseded — the event-file families of D-ADR0055 are one such case, not the only one), or the behaviour still exists and another named test owns it — a Rust conformance test for the port's cases, or the single Node route test of that port. A retired assertion appears in the E6 inventory with its reason and, in the second case, the `file:test` that now owns the behaviour. Retiring is not weakening; weakening is asserting less about a behaviour that still exists and is forbidden. Lines, counts, files and the frozen T/T2/T3 inventories are not a classification — they are the population to classify. Each retained G-id in §16 points to exactly one owning test; a G-id with two tests names the owner and retires or retargets the other. The inventory is regenerated from the current suite at implementation.

### 2.3 Lead-brief rule (replaces item 6 of `phase-07-caller-migration-and-one-door.md` and is the template for every lane that touches tests)

> **Tests (E6).** Classify every assertion that reaches a Git write site as kept / retargeted / retired per spec §15, by behaviour. Retire the tests of every mechanism you delete in the same change. Where a Rust conformance test already proves a port's cases, keep one Node route test per port and retire the Node copies of the cases, naming the Rust test that owns each. A new test needs three things: the behaviour in its title in plain words (no task ids), a one-line reason why no existing test proves it (you searched first), and a home in the existing file for that module unless the module or boundary is new. Report, in this order: tests retired with the owning proof for each; tests added with their reason; counts kept / retargeted / retired / added; suite totals before and after (`npm test` prints them). "All N original assertion lines retained" is not a success criterion and a report that says it without the retired list is incomplete.

### 2.4 Coordinator's interim rule — keep it, but put it in the spec

The interim rule ("when a mechanism is deleted, its tests are retired unless they prove a behaviour nothing else proves; the E6 report lists retired tests with the test that now covers the behaviour") is correct and is already the third label of 2.2. Move it out of the brief and into §15 so the next plan inherits it; a rule that lives only in a brief is the sprawl RUL11 names.

## 3. Mechanism — keep it enforced without humans (minimum)

Three things, no new tool, in order of value per hour:

1. **A number everyone sees.** `scripts/run-tests.mjs` already discovers every test file; have it print one line at the end — `suite: 581 files, 8066 tests, 412 s wall (baseline 581 / 8066 / 410 s at <sha>)` — and read the baseline from a tiny committed JSON (`test/suite-baseline.json`, three fields plus the sha). Warning only; a lead's report quotes the line (the brief in 2.3 requires it). This is the whole "budget signal": no cap, no gate, just a visible delta that a reviewer can ask about. Cost: ~30 lines in `run-tests.mjs`, one JSON. Update the baseline in the same commit that lands a deliberate change.
2. **Two mechanical checks inside `npm test` start-up, reusing the ratchet pattern that `check-decision-codes.mjs` already uses:**
   - *duplicate test bodies*: normalise each `test('…', …)` body (strip whitespace) and fail on a byte-identical body in two files; warn on an identical title in two files. This alone would have caught the 55 `checks` clones on 2026-08-23. ~40 lines; best home is `scripts/test-proof-inventory.mjs --check`, which already has the admission-rule shape, or a sibling of `check-decision-codes.mjs`.
   - *the existing admission rules* (`new-fixture-only-init-without-reason`, `new-real-provider-network-without-marker`) actually wired, warning only, against the committed baseline. They already exist; nobody runs them.
3. **A reviewer/lead checklist that mirrors 2.3** (goes in the review skill and the lead-brief template, four lines): (a) every new test file — why not the existing file for this module; (b) every new test — behaviour named, owning proof searched, reason given; (c) every deleted mechanism — its tests retired and listed; (d) every Node test in a Rust-ported area — route proof or Rust-owned case. The coordinator refuses a report that adds tests without reasons or deletes a mechanism without a retired list. This is the only human-free part that is actually about *judgement*, and it works because the brief asks for the list — AI leads produce what the brief names.

Do not build: a proof registry, per-test behaviour ids, mutation testing in CI, a hard count cap. The 2026-09 plans considered the first three and set them aside for cost; the fourth is Goodhart bait (leads will fold cases into fewer `test()` calls at the same runtime).

## 4. One-time cleanup — safe sequence

Rule for every batch: `npm test` and `cargo test --workspace` green before and after; `node scripts/test-select-coverage-map.mjs` before and after, and no source file may lose its last covering test; one area or ≤60 tests per PR; before retiring a test, `git log -S'<title words>'` — if the test was born in a bug-fix commit it is a regression witness and its case moves into the owning proof instead of disappearing.

| Phase | Scope | Evidence used | Effort | Risk | Expected effect |
|---|---|---|---|---|---|
| 0 | Fresh profile on current `main` with `node scripts/test-timing.mjs profile`; commit `test/suite-baseline.json`; land the §3 checks warning-only | existing scripts | 0.5 day | none | numbers stop being guesses |
| 1 | Byte-identical clones: the 55 in `test/setup`, plus whatever the body-hash scan finds across the other ~190 cross-file title clashes | the §3 duplicate check | 0.5-1 day | none (identical bodies) | −60..150 tests, −seconds, one fewer file |
| 2 | Per-port behaviour inventory for the five Rust-ported areas (433 Node tests): label each *owns* / *route* / *mirrors-Rust (name the Rust test)* / *contract-prose*. Retire mirrors and contract-prose tests; keep one route test per port and every Node-only behaviour (facade errors, Node lifecycle). Spot-check with 3-4 seeded mutations per port via the `test-select-mutate.mjs` approach: a mutation only Rust catches proves the Node copy redundant; a mutation only Node catches proves it is a route proof — keep | `cargo test -- --list`, Node titles, mutation spot-check | 2-3 days | low | −150..250 tests; this is also where the E6 "retired" column gets its first real rows |
| 3 | Top-50 runtime files (65% of wall time; all CLI-spawn or rust-host). Where `src/verbs/*` already exposes a use-case function, extract direct tests per the proven `test/direct/` pattern and keep **one** CLI parity test per verb; retire the CLI permutation of the business cases. Do **not** `skip` them (the 2026-09-22 plan proposed skip-not-delete; reject that — 399 skip markers already exist, and git history is the archive) | profile from phase 0, `test/direct/` pattern | 3-5 days, can be split per verb | medium (CLI-level regression witnesses) — mitigated by the `git log -S` rule | −30..40% wall time; test count roughly flat or slightly down |
| 4 | Cartesian clusters (`fgos-merge*`, `approve-1..6`, `intake-1..6`, `read-1..4`, `operation-choice` 154) | 2026-09-22 audit | decision question below | — | — |
| 5 | Retire tests of mechanisms deleted by git/p07 (lock-free Land writer, Workflow integrate, spawn helpers) — this is the lead's job under rule 2.3, not a separate cleanup | E6 inventory | inside p07 | low | −? (the u5/u13 inventories will say) |

Total for phases 0-3: about 1.5-2 agent-weeks, in small reviewed PRs. Net expectation: −5..8% tests from phases 1-2, −30..40% wall time from phase 3, zero behaviours lost, and — more important than either — the first "retired" rows that teach leads the label is real.

## 5. What not to do

- **Do not hand-prune Cartesian clusters.** Three clusters were mutation-audited on 2026-09-22; every test caught a distinct mutation. Deleting by name, count, coverage or "looks similar" there loses real boundaries.
- **Do not set a test-count cap or a test:code ratio target.** Both are gamed by folding cases into one `test()` with the same runtime, and a ratio penalises exactly the foundations (holder-lock, git) that should be over-proven.
- **Do not retire a Node route test because a Rust test exists.** The boundary proof is the point of the two-route rule in §15; retire the *cases* mirrored from Rust, keep the *wiring*.
- **Do not split a slow file to dodge a per-file time** — that is how the 55 clones were born. Fix the fixture or extract the use-case.
- **Do not use `skip`/`todo` as retirement.** Delete; `git log -S` is the archive.
- **Do not loosen "never weaken".** Define it (2.1) so that moving and retiring stop being mistaken for it; the prohibition itself stays.
- **Do not build a proof registry or annotate 8,000 tests with behaviour ids.** Titles in plain words plus `rg` is the registry; the 2026-09 plans already rejected the heavy form.
- **Do not let a frozen inventory (T/T2/T3) become a do-not-touch list.** Spec text 2.2 says what it is: the population to classify.

## 6. Decision questions for the owner

**DQ1 — Cartesian clusters (phase 4).**
*What is happening:* ~1,200-1,500 tests across `fgos-merge*`, `approve-1..6`, `intake-1..6`, `read-1..4`, `operation-choice` enumerate full combinations; the 2026-09-22 audit found no 1-1 duplication but 70-90% pairwise compressibility.
*Cause:* tests were written one combination at a time; no generator, so each new variable multiplied the file.
*Options:* (a) leave them — cost: ~10-15% of test count and a share of runtime stays; (b) build the pairwise generator with pinned regression witnesses (Pillar 1) — cost: 2-3 days build plus a migration per cluster, and the audit's open question about readable failure names is unanswered; (c) only extract direct use-case tests for the slow ones (phase 3) and leave the enumeration — cost: count stays, time drops.
*Recommendation:* (c) now, (a) for the rest; revisit (b) only if phase 3 leaves `npm test` above ~5 minutes on the reference machine.
*Scope of answer:* cleanup only; does not change the rules in §2.

**DQ2 — Node tests in Rust-ported areas (phase 2 policy).**
*What is happening:* 433 Node tests sit beside 1,295 Rust tests for the same ports; some re-prove Rust cases, 22 files assert contract prose.
*Cause:* §15 says "through Rust and the relevant Node route" and gives no stopping rule.
*Options:* (a) one Node route test per port plus Node-only behaviours; cases live in Rust — cost: a lead must read the Rust test to label a Node one; (b) full Node conformance kept as a second independent proof — cost: every Rust behaviour change edits two suites forever.
*Recommendation:* (a), written into 2.2 as proposed. Evidence that flips it: the E3 reversal trigger (if the combined addon route is abandoned, Node becomes the only route and its cases must come back).
*Scope of answer:* git, holder-lock, event-store, run-supervisor, terminal-control.

**DQ3 — Where the rule lives.**
*What is happening:* the proposed L5 q5 text is three times longer than today's.
*Cause:* the always-loaded layer (L8) is the only place every agent reads.
*Options:* (a) full text in AGENTS.md L5 q5; (b) four sentences in L5 q5 plus a principle 8 **One proof** in `core/instructions/design-principles.md` (projected into AGENTS.md anyway); (c) a new `docs/specs/testing.md` with L5 pointing to it — cost: one more file that leads will not open.
*Recommendation:* (b).
*Scope of answer:* doctrine placement only.

## 7. Work checklist (for whoever executes)

1. Land §2.1 (AGENTS.md), §2.2 (git spec §15), §2.3 (lead-brief template + review skill checklist) in one docs commit; supersede the interim brief rule by pointing at §15.
2. Add the one-line suite summary and `test/suite-baseline.json` to `scripts/run-tests.mjs`; wire the duplicate-body check and the two existing admission rules, warning only except for byte-identical bodies.
3. Phase 0 profile; phase 1 clones; phase 2 per-port inventory with mutation spot-checks; phase 3 per verb, slowest first.
4. Fix `docs/specs/reading-map.md:61` to point at the printed summary instead of a number.
5. Owner answers DQ1-DQ3; defaults apply if unanswered.

## 8. Success metrics

- Every lead report that touches tests has a non-empty "retired" or an explicit "nothing retired because no mechanism was deleted" line within two weeks of landing §2.3.
- E6 inventories stop reading `retired: 0` when a mechanism was deleted.
- New files added per week fall below new tests added per week divided by ~10 (new tests land in existing files).
- The duplicate-body check reports zero after phase 1 and stays zero.
- `npm test` wall time on the reference machine drops by a third after phase 3; test count moves by single-digit percent — the point is judgement, not a smaller number.
- The suite summary line is quoted in reports without being asked.

## 9. Assumptions

- The September JUnit profile still ranks the same files at the top (medium confidence; phase 0 re-measures before anything is deleted).
- Leads are AI agents that follow brief text literally (high — the u5/u13 reports show it). The rules are therefore written as instructions with a required report shape, not as values.
- The owner does not want a hard cap (high — "không muốn suy yếu hệ thống" and RUL104 both point at better-not-smaller).
- `cargo test --workspace` is part of DoD in practice (CI runs it; L5 q5 text today names only `npm test`) — included in 2.1; drop it if the owner disagrees.
- The 433 Node tests in ported areas contain at least ~40% Rust-mirrored cases (medium; the phase 2 inventory is the proof, and if it finds fewer the rule still holds and only the saving shrinks).
- No one depends on the T/T2/T3 inventories as a frozen contract outside the Git programme (medium).

## Unresolved questions

- DQ1-DQ3 above.
- Whether `test/architecture.test.mjs`'s manifest (`docs/architecture-manifest.json`) should also list which `test/` directory owns which `src/` area, so the "existing file for this module" in 2.3 is mechanical rather than searched — useful, but it is new structure and therefore a decision question, not a recommendation here.
