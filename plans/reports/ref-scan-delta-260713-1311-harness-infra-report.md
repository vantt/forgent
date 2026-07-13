# Repository Harness Infra Delta Scan
## Commit Range 14e6f10..HEAD (HEAD=9cc306d)

Date: 2026-07-13  
Scope: E11 repository separation / US-100 cutover  
Theme: 94 upstream commits; 77k+ deleted lines (product separation)

---

## 1. `.agents/` Directory

### Delta Summary
- **Operation**: Deletion only
- **Files Changed**: 99
- **Lines Deleted**: ~50,700
- **Status**: Directory completely removed (no longer exists at HEAD)

### Removed Content
The entire `.agents/skills/impeccable/` directory tree was deleted, including:

- **SKILL.md** (175 lines) — main skill definition
- **agents/** (3 files) — impeccable asset producer and manual edit applier TOML configs, OpenAI config
- **reference/** (31 files) — comprehensive reference docs covering adapt, animate, audit, bolder, brand, clarify, codex, colorize, craft, critique, delight, distill, document, extract, harden, hooks, init, interaction-design, layout, live, onboard, optimize, overdrive, polish, product, quieter, shape, typeset
- **scripts/** (65 files) — detector engines (browser, regex, static-html, visual), CLI tools, live session management, browser injection, hooks, context management, design parser, manual edit handling

### Deletion Commit
**commit b4c3c89** — "refactor: remove Symphony product from Harness tree" (2026-07-12 15:49:53)

This single commit removed all Symphony-owned tool infrastructure from the Harness template repository as part of the product separation (E11 epic, decision 0009).

### Current State
`.agents/` directory no longer exists in the repository; it has been completely removed from the Harness core.

---

## 2. `.codex/` Directory

### Delta Summary
- **Operation**: Deletion only
- **Files Changed**: 3
- **Lines Deleted**: 233
- **Status**: Directory completely removed (no longer exists at HEAD)

### Removed Content
- **hooks.json** (17 lines) — Harness hook configuration
- **skills/harness-intake-griller/SKILL.md** (212 lines) — intake griller skill definition
- **skills/harness-intake-griller/agents/openai.yaml** (4 lines) — OpenAI config for intake griller

### Deletion Commit
Same as `.agents/`: **commit b4c3c89** — "refactor: remove Symphony product from Harness tree"

### Current State
`.codex/` directory no longer exists in the repository; the entire directory has been removed.

### Context
The `.codex/` directory previously contained Symphony-specific hooks (`.codex/hooks.json`) and the `harness-intake-griller` skill, both removed as part of the repository separation. According to AGENTS.md in the removed commit context, this skill was project-scoped and used for "discussion, feature intake, docs, or story shaping before Symphony execution."

---

## 3. `.harness/` Directory

### Delta Summary
- **Operation**: 16 deletions + 1 addition = 17 files changed
- **Deletions**: 16 changeset files (legacy/stale/Symphony-owned runs)
- **Additions**: 1 new changeset file
- **Status**: Directory still exists with single current changeset

### Deleted Changesets
All 16 deleted files are in `.harness/changesets/`:

```
run_0000000000_seed_symphony_index.changeset.jsonl          (Symphony seed)
run_0000000002_retire_stale_symphony_docs.changeset.jsonl   (Symphony retirement)
run_1782473523_99206.changeset.jsonl                        (legacy)
run_1782536604_52965.changeset.jsonl                        (legacy)
run_1782543459_701.changeset.jsonl                          (legacy)
run_1782550121_26667.changeset.jsonl                        (legacy)
run_1783163412740491000_6614_1.changeset.jsonl              (legacy)
run_1783164291664744000_6614_2.changeset.jsonl              (legacy)
run_1783178537862657000_95182_0.changeset.jsonl             (legacy)
run_1783179886029971000_7111_0.changeset.jsonl              (legacy)
run_1783224245101133000_18033_0.changeset.jsonl             (legacy)
run_1783399293702861000_us069.changeset.jsonl               (legacy)
run_1783405248236036000_24617_0.changeset.jsonl             (legacy)
run_1783523200000000000_us071.changeset.jsonl               (legacy)
run_1783530000000000000_impeccable_tool.changeset.jsonl     (Symphony-owned impeccable)
run_1783610000000000000_us072.changeset.jsonl               (legacy)
```

### New Changeset
- **run_1783916400_us102.changeset.jsonl** — added at HEAD
  - **Story**: US-102 "Post-Merge Release Recovery And Proof-Before-Promotion" (high_risk lane)
  - **Purpose**: Recover failed post-merge CLI release run 29222332569; freeze v0.1.14 baseline, test old-to-candidate transitions pre-merge, promote v0.1.17 only after platform proof
  - **Operations**: Includes intake, story, decision (0010), trace, intervention, backlog entries
  - **Key Evidence**: Local pre-merge contract and real macOS v0.1.14 upgrade passed; hosted run 29223964557 passed Ubuntu repository/Linux transition and Windows frozen-smoke/upgrade/current-smoke jobs
  - **Status**: Verified (story.verify result=pass)

### Current State
```
.harness/
  changesets/
    run_1783916400_us102.changeset.jsonl   (single current file)
```

---

## 4. `.gitignore` Diff

### Changes
**Deleted (7 lines removed)**:

```
# JavaScript dependencies for local web UI packages.
node_modules/
*.tsbuildinfo

# Local web UI build and test output.
desktop-dist/
test-results/
tsconfig.tsbuildinfo

# Local Symphony runtime state.
.symphony/
```

**Retained (unchanged)**:

```
# Downloaded Harness CLI binary for installed project instances.
scripts/bin/harness-cli
scripts/bin/harness-cli.exe

.harness/*
!.harness/changesets/
!.harness/changesets/*.changeset.jsonl
```

### Context
Removed patterns are for Symphony product artifacts (node_modules, desktop build output, .symphony runtime directory) and TypeScript build artifacts. These are no longer needed after Symphony separation. The Harness changesets pattern remains as the live operational log mechanism.

---

## 5. Root Files: `AGENTS.md` and `CLAUDE.md`

### AGENTS.md Changes
**Before** (29 lines):
- Section: "Project Skills" with reference to `.codex/skills/harness-intake-griller/SKILL.md`
- Extensive Harness setup instructions (references to 7 doc files, CLI query command, tool registry capability checks)

**After** (11 lines):
- Section removed: "Project Skills"
- New decision gate structure:
  - Read-only path: answer/explain/review/diagnose/plan/status (no bootstrap/database/intake/trace)
  - Write path: run bootstrap script, use FEATURE_INTAKE.md, query matrix --active --summary, retrieve context from CONTEXT_RULES.md
- Removed detailed doc references and tool capability checks
- Removed Rust CLI details and tool registry workflow

**Pattern**: Simplified to two explicit request classes instead of pre-loaded context.

### CLAUDE.md Changes
**Before** (18 lines):
- Explanation that Claude Code does not auto-load `AGENTS.md`
- Imported: `@AGENTS.md`, `@docs/FEATURE_INTAKE.md` (bare @ imports)
- Note about lane-dependent context being intentionally not imported

**After** (8 lines):
- Retained: Claude Code does not auto-load `AGENTS.md`
- Retained only: `@AGENTS.md` import
- Removed: `@docs/FEATURE_INTAKE.md` import
- Removed: lane-dependent context explanation
- Simplified to bare minimum: import single canonical project instruction source

**Pattern**: Eliminated automatic FEATURE_INTAKE import; now read per request class. Single import source is AGENTS.md.

---

## 6. New/Added Top-Level Content

### Files/Directories Added
No new top-level files or directories at the root level were added. All additions are within existing directory structures:

- `.github/workflows/premerge.yml` — new CI workflow
- `.harness/changesets/run_1783916400_us102.changeset.jsonl` — new operational changeset
- **docs/** — new decision docs, provenance files, story epics, reviews
  - `docs/decisions/0008-self-improving-harness-lifecycle.md`
  - `docs/decisions/0009-separate-symphony-product-repository.md`
  - `docs/decisions/0010-proof-before-cli-release-promotion.md`
  - `docs/provenance/e11-us097-*` — disposition policy and epoch summary files
  - `docs/stories/epics/E09-*`, `E12-*` — new epic stories and reviews
- **crates/** — additions to existing Rust crates (epoch_fence.rs in harness-cli)
- **tests/** — new release test suite

---

## 7. Separation Context: What Moved Out, Destinations, Proof Concepts

### What Was Separated OUT

**Separated Artifact**: Symphony product code  
**Destination Repository**: `git@github.com:hoangnb24/symphony.git`  
**Separation Decision**: `docs/decisions/0009-separate-symphony-product-repository.md`

### Removed/Transferred Content

| Item | Reason | Removed From Harness | Destination |
|------|--------|---------------------|-------------|
| `.agents/skills/impeccable/` (99 files, 50.7k lines) | Design validation skill (Symphony-dependent) | Yes, commit b4c3c89 | Symphony repo (not in Harness core) |
| `.codex/hooks.json` | Harness hook configuration | Yes, commit b4c3c89 | Archived in provenance |
| `.codex/skills/harness-intake-griller/` | Intake griller skill (Symphony-specific workflow) | Yes, commit b4c3c89 | Not ported; docs only in archived records |
| `.symphony/` (runtime dir, .gitignore) | Symphony runtime state | Yes, .gitignore updated | Symphony local instance only |
| Node modules, desktop build, TypeScript builds | Web UI and Electron shell artifacts | Yes, .gitignore updated | Symphony repo (not Harness) |
| `run_1783530000000000000_impeccable_tool.changeset.jsonl` | Impeccable tool registration | Yes, deleted | Archived in provenance/legacy records |
| Symphony changeset history (15 legacy changesets) | Operational history owned by Symphony product | Yes, deleted or archived | External artifact root (see below) |

### Separation Architecture: Key Principle
From decision 0009:

> "Make hoangnb24/symphony the canonical product repository for Symphony and restore hoangnb24/repository-harness as the canonical reusable Harness template."

**Dependency Direction (Post-Separation)**:
```
Symphony release
  → versioned Harness CLI protocol (published via docs/contracts/harness-orchestration-v1.md)
  → Harness-enabled target repository

repository-harness
  -/-> Symphony source, UI, release, tools, or durable work queue
```

### "Hosted Platform Proof" and "Hosted Transition Proof"

#### Hosted Platform Proof
**Reference**: `docs/harness/attach-hosted-platform-proof` (commit f91caa5, 2026-07-12)  
**Refers To**: Multi-platform validation run on hosted CI infrastructure  
**From E12/US-102 overview.md**:
- Pre-merge: current debug binary only (fast local validation)
- Post-merge: five separate build jobs across Linux, macOS, Windows + upgrade-transition proof
- All five platforms must pass before tag promotion
- Commit 6868747 ("fix(release): prove candidates before tag promotion") operationalizes this

**Details**:
- v0.1.14 runs a frozen, version-specific upgrade-source baseline
- Built candidate and installed candidate run current strict smoke
- Pull requests execute old-to-candidate transition on Linux and Windows
- Post-merge maintenance prepares a versioned commit but does NOT tag it; tag created only after all matrix jobs pass

#### Hosted Transition Proof
**Reference**: `docs/release/attach-hosted-transition-proof` (commit deeaf42, 2026-07-13)  
**Refers To**: Upgrade compatibility validation from old released version to new candidate  
**From decision 0010 "Proof Before Harness CLI Release Promotion"**:
- Old-to-current upgrade must not break existing consumers
- Failed tag `harness-cli-v0.1.16` remains immutable at original commit with no assets
- Recovery advances monotonically to new patch version (v0.1.17)
- Frozen baseline for v0.1.14 contains only behavior promised by that version
- Current full protocol smoke runs on built and installed candidate

**Validation Evidence** (from run 29223964557, captured in US-102 trace):
- Local pre-merge contract passed
- Real macOS v0.1.14 upgrade passed
- Ubuntu repository/Linux transition passed
- Windows frozen-smoke/upgrade/current-smoke jobs passed
- Five-platform v0.1.17 promotion remains merge-gated pending final merge

### Supporting Artifacts

#### Provenance Files
- **`docs/provenance/e11-us097-disposition-policy.json`**
  - Baseline ownership map, post-baseline core intake/trace retention policy
  - Allowed target overlap for stories US-093 through US-096
  - Overrides for legacy backlog items (move-target, archive-only actions)

- **`docs/provenance/e11-us097-epoch-summary.json`**
  - Source epoch snapshot hashes (file, logical, journal database, journal log)
  - Fresh core epoch: 55 stories, 149 traces, 11 backlog items, schema v13
  - Dispositions: 380 retain_core, 255 archive_only, 43 derive, 1 move_target, 0 discard
  - Transition state: complete, 10 crash cases with forward/compensate recovery strategies
  - Validation: 81 harness CLI tests, 4 generic fixture changesets, entropy 5→0 after completion

- **`docs/provenance/e11-us097-epoch-summary.json.sha256`** — checksummed proof

#### New Contract Documentation
- **`docs/contracts/harness-orchestration-v1.md`** — Symphony↔Harness protocol (versioned, JSON-based)

#### Post-Merge Release & Trust Boundary Documentation
- **`docs/decisions/0010-proof-before-cli-release-promotion.md`** — Separates frozen historical proof (v0.1.14 baseline) from current candidate proof; immutable failed tags; monotonic recovery
- **`docs/decisions/0008-self-improving-harness-lifecycle.md`** — Harness improvement patterns
- **E12 Epic: Harness Trust Boundaries** (`US-102`, reviews)

---

## Execution Timeline (from commits)

| Commit | Date | Message | Scope |
|--------|------|---------|-------|
| 8876b39 | ~2026-07-11 | feat(cutover): complete E11 repository separation | E11 completion |
| 28074d3 | ~2026-07-11 | docs(harness): define trust-boundary hardening plan | E12 planning |
| 725a9ea | ~2026-07-11 | fix(stories): require proof-backed completion | Trust boundary fix |
| 153a76f | ~2026-07-11 | fix(runtime): gate task state on coherent bootstrap | Bootstrap fix |
| acba26e | ~2026-07-11 | fix(instructions): make request authority explicit | AGENTS.md simplification |
| 6bd7bb0 | ~2026-07-11 | ci: enforce repository contract before merge | CI gate |
| 9679276 | ~2026-07-12 | docs(harness): record trust-boundary proof | E12 evidence |
| 15e1d2e | ~2026-07-12 | Merge pull request #46 | E12 trust-boundary (merged) |
| 0db1de0 | ~2026-07-12 | test(windows): check PowerShell script success | Windows validation |
| f91caa5 | ~2026-07-12 | docs(harness): attach hosted platform proof | Hosted validation docs |
| 5a84037 | ~2026-07-12 | chore(release): prepare harness-cli-v0.1.16 | Release prep |
| 6868747 | ~2026-07-12 | fix(release): prove candidates before tag promotion | Release fix (post-merge recovery) |
| dd22cd5 | ~2026-07-12 | docs(release): record immutable recovery contract | Recovery decision (0010) |
| deeaf42 | ~2026-07-12 | docs(release): attach hosted transition proof | Transition validation |
| 48d8172 | ~2026-07-12 | Merge pull request #47 | Post-merge recovery (merged) |
| 9cc306d | ~2026-07-13 | chore(release): prepare harness-cli-v0.1.17 | New release candidate |

---

## Summary

### Infrastructure Changes
- **Removed**: 50,950 lines across 102 files (`.agents/` impeccable skill, `.codex/` hooks & griller, legacy changesets)
- **Added**: 1 new operational changeset (US-102 post-merge recovery)
- **Simplified**: AGENTS.md and CLAUDE.md to dual request classes (read-only vs. write with bootstrap)
- **Cleaned**: .gitignore to remove Symphony and Web UI artifact patterns

### Product Separation (E11 Complete)
- Symphony separated to `hoangnb24/symphony.git` repository
- Harness CLI restored as reusable template
- Versioned orchestration protocol (harness-orchestration-v1.md)
- Provenance preserved through checksummed disposition and epoch summary files
- Dependency direction: Symphony → Harness CLI protocol → Harness-enabled repos (no circular coupling)

### Trust Boundary Hardening (E12 / US-102)
- Post-merge release recovery from failed run 29222332569 (immutable v0.1.16 tag)
- Proof-before-promotion decision (decision 0010): frozen baseline for old versions, full protocol for candidates
- Hosted platform proof: five-platform validation required before tag creation
- Hosted transition proof: old-to-candidate upgrade compatibility validated
- Recovery monotonic: v0.1.17 published after passing hosted multi-platform gates

### Changesets
- Legacy Symphony and operational changesets cleared from tracked history
- Single current changeset (US-102) captures post-merge recovery intake, story, decision, trace, and intervention

---

## Gaps / Not Covered
- Detailed content of removed reference docs (e.g., impeccable critique.md, harden.md) — only name/line counts provided
- Specific CI changes in `.github/workflows/premerge.yml` — file added but not analyzed in detail
- Specific Rust crate changes (`epoch_fence.rs`, other harness-cli updates) — file additions noted but not detailed
- Full content of new story epics and reviews under docs/stories/ — only paths noted
- Detailed validation test suite changes under tests/ — only noted as additions

