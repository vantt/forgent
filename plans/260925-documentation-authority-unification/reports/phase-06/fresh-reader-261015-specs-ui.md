# Specs and ui-spec batch (Step 8) fresh-reader review

Scorer: reviewer:claude-session:a4954387@2026-10-15 (scorer, not key author, not a reader)
Key: `plans/260925-documentation-authority-unification/reports/phase-06/fresh-reader-key-261015-specs-ui.md`, committed before any reader started (key header HEAD 1276467f3).
Content commit: 1276467f3 (docs equal); readers and anchor checks ran in the read-only worktree `/home/vantt/projects/forgentX-s8-review` detached at 2107c4761.
Scoring rule: key section 1 and `reports/phase-05/pilot-b-fresh-reader-key.md`, with the Step 7 convention (a reader may name a binding legacy owner through a switchboard row or the carrier's own header pointer; citing a legacy path as an `#anchor`, treating a carrier or carried status word as binding, or opening out-of-scope files fails). The key says a missed distinction is "partial, not correct", so both readings are reported: lenient (correct plus partial counts toward the 5 of 6) and strict (correct only). Wrong counts in neither.

Seven Sonnet readers (one per area), fresh context, no conversation history; briefs at `fresh-reader-brief-s8-<area>.md`, answers at `fresh-reader-s8-<area>.md` (same directory). Isolation is UNPROVEN (read-only was an instruction, not a sandbox); the only evidence about what was opened is each reader's own list. The scorer is not the key author's reader but shares the key author's session, so this is not a fully independent chain. No carried sentence is shown true by this review.

Legend per cell: C correct, P partial, W wrong. Scenario "Yes/P/W" is the count.

## 1. Anchor checks

Every `docs/platform/...#anchor` in every answer file was extracted and run with `env -u CLAUDE_CODE_SESSION_ID node scripts/list-doc-anchors.mjs --check <path#anchor>` from the worktree root (a deliberately bogus anchor was confirmed to exit 1).

| Area | Distinct anchors | Missing or fabricated | Notes |
|---|---|---|---|
| agent-confinement | 24 | 0 | |
| claude-plugin | 17 | 0 | |
| decision-citation-drift | 20 | 0 | |
| distillery | 19 | 0 | includes `governance#unheaded-block-52` (exists, fragile) |
| herdr-web-dashboard | 18 | 0 | yaml `unheaded-block-N` anchors 1, 2, 5, 11, 33 exist and support the claims (block-5 is the `servers` block) |
| observe | 17 | 0 | |
| ui-spec | 17 | 0 | |
| Total | 132 | 0 | |

## 2. Per-area scoring

### 2.1 agent-confinement (7 files opened; limit 8)

| Scenario | Q1 | Q2 | Q3 | Q4 | Q5 | Q6 | Yes/P/W |
|---|---|---|---|---|---|---|---|
| A (container backend) | C | C | C | C | C | C | 6/0/0 |
| B (strict default, backend refs) | C | C | C (surfaces the header vs section 14 conflict) | C | C | P: says to "resolve the status-block vs section 14 contradiction" and to replace the S4 claim with "what actually landed"; never says a new Decision supersedes the old or that the staged rollout stays visible | 5/1/0 |
| C (agent CLI release) | C | C | P: cites `spec#91` and `spec#85-adapter-mới` (not the invocation pointers, resource-binding recipe or runner-owned login renewal); content on the invocation entry is right but not supported by the cited anchors | P: rates "low to moderate" against the key's medium-high; omits that with the provider sandbox off bwrap is the only confinement (it does carry the "not proven" line) | C | C | 4/2/0 |

Binding owner `docs/specs/confinement-authority.md` named through the switchboard row in the standing note and not opened; "IMPLEMENTED" never used as proof; no legacy anchors. Out-of-scope opens: none reported.
Result: lenient PASS (6, 6, 6 of 6 with partial counted); strict FAIL on scenario C (4 of 6).

### 2.2 claude-plugin (6 files; limit 8)

| Scenario | Q1 | Q2 | Q3 | Q4 | Q5 | Q6 | Yes/P/W |
|---|---|---|---|---|---|---|---|
| A (`triage` wrapper) | C | C | C | C | C | C | 6/0/0 |
| B (`move` legality in plugin) | C | C | C | C | C | C | 6/0/0 |
| C (role gate and confirmation) | C | C | C | C | C | C | 6/0/0 |

Credited points: R1 "exactly 12" and R4 unwrapped list marked unverifiable; `Open Gaps: none` vs "not certified" surfaced as a disagreement and not resolved; Work-State named as binding owner of lifecycle; confirmation prompt distinguished from a role gate (new authorization capability). No out-of-scope opens reported.
Result: PASS (lenient and strict).

### 2.3 decision-citation-drift (6 files; limit 8)

| Scenario | Q1 | Q2 | Q3 | Q4 | Q5 | Q6 | Yes/P/W |
|---|---|---|---|---|---|---|---|
| A (npm script and CI gate) | C | C | C | C (flags that `docs/decisions` may hold no records) | P: uses "the 9 tests named in the spec still passing" as a baseline instead of marking the carried count unverified | C | 5/1/0 |
| B (extend scope to `docs/platform/**`) | C | C | C | C | C | C | 6/0/0 |
| C (auto-fix) | C | C | C | C | C | C | 6/0/0 |

Both key conflicts surfaced: the switchboard "baseline ratchet rules" vs a carried spec with no baseline (disagreements section), and the retired decision corpus (Q4, hedged). Switchboard, portal registry and phase-status contradictions also reported.
Result: PASS (lenient and strict).

### 2.4 distillery (6 files; limit 8)

| Scenario | Q1 | Q2 | Q3 | Q4 | Q5 | Q6 | Yes/P/W |
|---|---|---|---|---|---|---|---|
| A (status `deferred`) | C | C | C (flags that no transition table is carried) | C | C | C | 6/0/0 |
| B (hand-edited log status) | C | C | C | C | C | C | 6/0/0 |
| C (cross-source ranking) | C | C | C | P: rates risk "higher than A or B" against the key's low-moderate (reasoned from the placement conflict, not from scope creep or Score semantics) | C | C | 5/1/0 |

The switchboard step 4 vs authoring-rules tension on a `legacy-current` area was surfaced (C Q4), which the key credits.
Result: PASS (lenient and strict).

### 2.5 herdr-web-dashboard (7 files; limit 8; the switchboard was grepped plus anchor listing only)

| Scenario | Q1 | Q2 | Q3 | Q4 | Q5 | Q6 | Yes/P/W |
|---|---|---|---|---|---|---|---|
| A (edit in web client) | C | C | C | C (edit-route conflict and 18 vs 19 paths surfaced, not resolved) | C | P: tells the owner to "fix the stale 'no edit route' and '18 paths' statements", which resolves the conflict by assumption after Q4 refused to; does not name the gateway contract's own owner | 5/1/0 |
| B (off by default, loopback) | C | C | C (also surfaces a spec vs contract `servers` disagreement) | C | C | C | 6/0/0 |
| C (push notification) | C | C | C (runbook notification distinguished as cockpit TUI, not web push) | C | C | C | 6/0/0 |

Contract anchors are only `unheaded-block-N`; the reader said so. The extra `servers` disagreement is real: spec says on by default, binds 0.0.0.0, port 8788 (spec lines 80-81, 240-241); contract `servers` says `localhost:{port}`, default 4170, "not always-on by default" (yaml lines 57-62).
Result: PASS (lenient and strict).

### 2.6 observe (7 files; limit 8)

| Scenario | Q1 | Q2 | Q3 | Q4 | Q5 | Q6 | Yes/P/W |
|---|---|---|---|---|---|---|---|
| A (`friction reopen`) | C | C | C | C | C | C | 6/0/0 |
| B (Work shows friction) | C | C | C | C | C | C | 6/0/0 |
| C (untracked shards, lock TTL) | C | C | C | C | C | C | 6/0/0 |

Spot checks against the carried spec: subcommands `ping, record, resolve, list, show, rank`, `nativeOnly`, 30 s lock TTL and doctor check names match the reader's statements. The Rust-migration-complete claim was left unproven (no certified commands stated).
Result: PASS (lenient and strict).

### 2.7 ui-spec (8 files; limit 8; the switchboard was not opened, routing taken from the portal registry and the area README)

| Scenario | Q1 | Q2 | Q3 | Q4 | Q5 | Q6 | Yes/P/W |
|---|---|---|---|---|---|---|---|
| A (screen S05) | C | C | C | P: risk reasoning is about R4/R5 and the compiler; omits that a screen written in the candidate tree is not compiled and that this is dual-authoring | C | P: records the decision in the area spec and updates the index and mapping, but not "once at the legacy entry", not regenerate-not-hand-edit, and ends "cannot be confirmed" | 4/2/0 |
| B (notification bell) | C | C | C | C | C | P: decision at the area spec owner but no Decision type, no migration-tracking record, mirrored-once rule not stated | 5/1/0 |
| C (refresh wireframe) | C | P: frames it as a spec-layer edit plus a tooling run; the legacy compiler root only appears in Q4 and Q5 | P: lists screen-file and rules mapping, not the five generated outputs or the gitignore vs stay-in-place conflict | C | C | W: "nothing durable beyond the edited screen file"; misses that the tool-root obligation belongs to the owner queue | 3/2/1 |

Conflicts: (a) gitignored `generated/` vs the README's five outputs "stay in place": the reader quotes both in C Q5 but does not flag the conflict (not surfaced, partial credit only); (b) ratchet exception for `docs/ui-spec`: never discussed (the key credits "not stated"); (c) `status: active` vs header `Candidate`: surfaced and resolved to the header correctly. The reader also surfaced `validate.mjs` (spec) vs `npm run check` (rules file): unresolved gate naming. No legacy anchors; carried status not used as proof.
Result: lenient PASS (6, 6, 5 of 6 with partial counted; scenario C has one wrong); strict FAIL on A (4) and C (3).

## 3. Pass summary

| Area | Anchors missing | Files opened (max 8) | Out-of-scope opens | Lenient 5/6 per scenario | Strict 5/6 per scenario | Result |
|---|---|---|---|---|---|---|
| agent-confinement | 0 of 24 | 7 | none reported | yes (6, 6, 6) | no (6, 5, 4) | PASS lenient, FAIL strict |
| claude-plugin | 0 of 17 | 6 | none reported | yes | yes (6, 6, 6) | PASS |
| decision-citation-drift | 0 of 20 | 6 | none reported | yes | yes (5, 6, 6) | PASS |
| distillery | 0 of 19 | 6 | none reported | yes | yes (6, 6, 5) | PASS |
| herdr-web-dashboard | 0 of 18 | 7 | none reported | yes | yes (5, 6, 6) | PASS |
| observe | 0 of 17 | 7 | none reported | yes | yes (6, 6, 6) | PASS |
| ui-spec | 0 of 17 | 8 | none reported | yes (6, 6, 5; C has one W) | no (4, 5, 3) | PASS lenient, FAIL strict |

Overall: on the Step 7 lenient reading all seven areas pass (0 non-existent anchors out of 132; no legacy-as-authority answer; at most 8 files; no reported out-of-scope opens). On the key's literal "partial, not correct" reading five areas pass and two fail: agent-confinement (scenario C) and ui-spec (scenarios A and C). The shortfalls are reader-quality differences, not fabrications; each traces to a place where the area gives the answer in a section the portal and switchboard do not route to (ui-spec Q6 obligation, confinement invocation pointers). Out-of-scope opens are self-reported and UNPROVEN. Nothing here proves a carried statement true.

## 4. Area gaps the readers surfaced (owed items)

1. Platform portal area registry (`docs/platform/README.md#2-area-registry`) lists only `ui-spec`; `agent-confinement`, `claude-plugin`, `decision-citation-drift`, `distillery`, `herdr-web-dashboard` and `observe` have switchboard rows but no registry row (noted by the claude-plugin, decision-citation-drift, distillery, herdr-web-dashboard and observe readers). Owed: registry row or a stated rule that legacy-current areas are not registered.
2. Portal `#3-decision-surface` says phases 00-04 are completed and 05 is in progress; the switchboard says only 00 and 01 are completed and 02-09 are unauthorized (distillery and decision-citation-drift readers). Owed: one phase-status statement.
3. The switchboard (step 4: do not author candidate files for a `legacy-current` area) and `migration-authoring-rules.md#3-authoring-new-platform-documentation` (speaks only of promoted, candidate and uncreated areas) leave new-capability placement open (distillery C reader; the key lists this as known). Owed: an explicit rule for new capability in a legacy-current area.
4. Switchboard, governance and portal point to `docs/transitional-switchboard.md` and `docs/doc-governance.md` as binding while the candidate copies call themselves operative (claude-plugin, decision-citation-drift, observe readers). Owed: one sentence on which copy binds until promotion.
5. agent-confinement carried text contradicts itself: the spec header block says the live `.fgos/config.json` has no `confinement` key and live migration is deferred, section 14 and history section 13.1 say invocations declare `confinement.backend`. Owed: truth pass decides, with evidence.
6. claude-plugin: R1 "exactly 12 verbs" and the R4 unwrapped list are unproven against `plugins/fgOS/**`; "Open Gaps: none" and "evidenced against shipped files" conflict with the README's "not certified". Owed: truth pass.
7. decision-citation-drift: the switchboard row's "baseline ratchet rules" has no counterpart in the carried spec; the default `docs/decisions` directory is described as a retired corpus format; "9 tests" is a carried count. Owed: reconcile the row or the spec; decide whether the check still has anything to scan.
8. distillery: the carried spec refers to "the enum's legal order above" but carries no transition table. Owed: add the table at the legacy owner.
9. herdr-web-dashboard: spec `Open Gaps` says `/work/{id}` is `get` only while the carried contract has `patch` `editWork` (blocks 11 and 33); spec says 18 paths and the contract lists 19; spec says on by default, 0.0.0.0, port 8788 while the contract `servers` says default 4170 and "not always-on by default". Owed: truth pass for all three; the contract's anchors are only `unheaded-block-N` and fragile.
10. ui-spec: `spec#how-to-work-on-this-spec` says `generated/` is gitignored while the README says the five outputs stay in place; `validate.mjs` (spec) vs `npm run check` (rules) gate naming; the ratchet text names `docs/specs` and `docs/architect` only, so a `docs/ui-spec` exception is not stated; the area README does not carry the Q6 obligation where a reader would look (three readers' Q6 shortfalls trace here). Owed: decide each once, at the legacy owner.
11. Every area README points to `plans/260925-.../phase-06/step-08-report.md` and `component-boundary.md`, both out of scope; readers named them without opening. Owed: portal-level pointer or accept the dead end.
12. Brief hygiene for reruns: the ui-spec reader used all 8 allowed opens and never opened the switchboard; list the switchboard and the migration rules as required support files or raise the limit.

Status: DONE
Summary: 132 anchors checked, 0 missing. Lenient reading: all seven areas pass. Strict reading: agent-confinement and ui-spec fail (confinement C 4 of 6; ui-spec A 4 and C 3 of 6); claude-plugin, decision-citation-drift, distillery, herdr-web-dashboard and observe pass. Report: `/tmp/claude-1000/-home-vantt-projects-forgentX/a4954387-fafa-46d2-911f-4ea15b20d08d/scratchpad/review-5/fresh-reader-261015-specs-ui.md`
