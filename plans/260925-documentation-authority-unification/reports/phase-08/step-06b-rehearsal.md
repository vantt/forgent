# Step 6b Rehearsal: Documentation-Cutover Lease on a Disposable Clone

**Date:** 2026-10-22  
**Role:** Doer (Phase 8, Plan 260925-documentation-authority-unification)  
**Status:** Complete — all rehearsal steps passed on disposable clone `/tmp/fgos-work/lease-rehearsal/repo`.

---

## 1. Summary Results Table

| Step | Operation / Door | Command | Expected | Actual | Status |
|---|---|---|---|---|---|
| **1.1** | `docs-lease status` | `node bin/fgos.mjs docs-lease status --json` | `{"state":"free","held":false,"sidecar":null}` | `state: "free"`, `held: false`, `sidecar: null` | **PASS** |
| **1.2** | Doctor row | `doctor` check `documentation-cutover-lease` | `passed: true`, unwired/wired ok | `passed: true`, `"no documentation-cutover lease is held; reference-transaction hook wired"` | **PASS** |
| **2** | `docs-lease acquire` | `node bin/fgos.mjs docs-lease acquire --worktree <holder> --json` | Held sidecar committed on clone's `main`; token private | Exit 0; sidecar committed to `main` (`a8eef9f71`); token hash only; token file written at mode 0600 | **PASS** |
| **3.1** | Non-holder commit in `other` | `git commit -m "..."` touching `docs/` in `other` | Pre-commit hook refuses commit | Exit 1; `commit refused: the documentation-cutover write lease is held; non-holder commits to scoped paths are refused` | **PASS** |
| **3.2** | Non-holder `--no-verify` + `update-ref` | `git commit --no-verify` + `git update-ref refs/heads/main HEAD` | Reference-transaction hook aborts ref update | Exit 128; `reference-transaction refused: reference update touches documentation scope or an unauthorized lease transition; failing closed` | **PASS** |
| **3.3** | Non-holder `fgos run` | `node bin/fgos.mjs run "read docs" --json` in `other` | Dispatch admission refusal before side effects | Exit 4 (policy-refusal); `fgos: documentation cutover lease is held; non-holder operations are refused` | **PASS** |
| **3.4** | Non-holder Land door | `landRunnerItem` targeting `main` with `callerCheckout: other` | MergeError thrown before candidate creation | Throws `MergeError` (`documentation-cutover-lease`); `main` unchanged; `operationId: null` | **PASS** |
| **3.5** | Unrelated repo Land door | `landRunnerItem` with `callerCheckout` from foreign `git init` | Refused as foreign repository | Throws `MergeError` (`documentation-cutover-lease`); `"caller checkout must belong to the gated repository"` | **PASS** |
| **4.1** | Out-of-scope non-holder commit | `git commit -m "..."` touching `src/rehearsal-allowed.txt` in `other` | Pre-commit hook allows out-of-scope commit | Exit 0; commit `250caf632` created on branch `other` | **PASS** |
| **4.2** | Holder commit in `holder` | `git commit -m "..."` touching `docs/guide.md` in `holder` | Pre-commit hook verifies token and allows commit | Exit 0; commit `5cff9477a` created on branch `holder` | **PASS** |
| **4.3** | Holder Land door | `landRunnerItem` targeting `main` with `callerCheckout: holder` | Scoped change landed and published to `main` | Exit 0; outcome: `merged`; merge commit `48b1ee21a` on `main` | **PASS** |
| **5** | `docs-lease release` | `node bin/fgos.mjs docs-lease release --json` from `holder` | Released sidecar committed on `main`; drift reported; token deleted | Exit 0; sidecar `state: "released"`, `drift: ["docs"]`; commit `ac0c0dc58`; token file unlinked | **PASS** |
| **6.1** | Acquire again | `node bin/fgos.mjs docs-lease acquire --worktree <holder> --json` | Re-acquisition succeeds; sidecar committed on `main` | Exit 0; commit `fb4509f2c` (`chore(docs): acquired documentation cutover lease`) | **PASS** |
| **6.2** | Owner abandon | `node bin/fgos.mjs docs-lease abandon --owner-confirmed --reason "rehearsal" --json` | Abandon committed on `main` with reason | Exit 0; commit `8b383aab7` (`chore(docs): abandoned documentation cutover lease`); reason: `"rehearsal"` | **PASS** |
| **6.3** | Acquire after abandon | `node bin/fgos.mjs docs-lease acquire --worktree <holder> --json` | Acquire succeeds after abandon; committed on `main` | Exit 0; commit `0a033952a` (`chore(docs): acquired documentation cutover lease`) | **PASS** |
| **6.4** | Final release | `node bin/fgos.mjs docs-lease release --json` from `holder` | Clean release; committed on `main`; drift empty | Exit 0; commit `900272044` (`chore(docs): released documentation cutover lease`); `drift: []` | **PASS** |
| **7** | Rollback & cleanliness | Verify `main` commit log and check for partial state residue | Only expected commits on `main`; no partial state | All 8 expected commits present; zero candidate/operation residue; scratch dir deleted | **PASS** |

---

## 2. Rehearsal Environment & Setup

- **Disposable repository:** `git clone --no-hardlinks --no-checkout /home/vantt/projects/forgentX-phase00-documentation-authority-unification /tmp/fgos-work/lease-rehearsal/repo`
- **Sparse checkout:** Initialized with `--no-cone` excluding `plans/260925-documentation-authority-unification/reports/**` (preventing tmpfs exhaustion from 6GB+ historical report files).
- **Branch & Hooks:** Branch `main` pointed to cloned HEAD `5dd5feeb41287623dd9d7e208b8922f47ab8d9a6`. Hooks configured via `git config core.hooksPath .githooks`. User: `Rehearsal Doer <rehearsal@example.invalid>`.
- **Linked worktrees:**
  - Holder: `/tmp/fgos-work/lease-rehearsal/holder` on branch `holder`
  - Other (non-holder): `/tmp/fgos-work/lease-rehearsal/other` on branch `other`
- **Activation & dev environment:**
  - Controller activation fence placed at `.fgos/locks/activation.lock/TOMBSTONE`
  - `native-addon.json` descriptor configured in clone linking to staged addon `.fgos/runtime/git-addon/9181583a2b89d38b/fgos.node`
  - `FGOS_STATE_ROOT=/tmp/fgos-work/state` (mode 0700)
  - `FGOS_HOST_BIN=/home/vantt/projects/forgentX-phase00-documentation-authority-unification/.fgos/runtime/git-addon/9181583a2b89d38b/fgos`
  - `FGOS_ACTIVE_MANIFEST_PATH=/home/vantt/projects/forgentX-phase00-documentation-authority-unification/.fgos/runtime/git-addon/9181583a2b89d38b/manifest.json`

---

## 3. Step-by-Step Evidence

### Step 1: Initial Status and Doctor Inspection

**Command:**
```bash
node /home/vantt/projects/forgentX-phase00-documentation-authority-unification/bin/fgos.mjs docs-lease status --json
```
**Exit Code:** `0`  
**Output:**
```json
{
  "contract": "fgos.v1",
  "data": {
    "state": "free",
    "held": false,
    "sidecar": null
  }
}
```
**Doctor Check:**
```json
{
  "id": "documentation-cutover-lease",
  "description": "repository documentation-cutover hooks are wired and no committed lease freezes the documentation scope",
  "passed": true,
  "message": "no documentation-cutover lease is held; reference-transaction hook wired"
}
```

---

### Step 2: Acquire Documentation Cutover Lease

**Command:**
```bash
node /home/vantt/projects/forgentX-phase00-documentation-authority-unification/bin/fgos.mjs docs-lease acquire --worktree /tmp/fgos-work/lease-rehearsal/holder --json
```
**Exit Code:** `0`  
**Output:**
```json
{
  "contract": "fgos.v1",
  "data": {
    "result": "acquired",
    "tokenHash": "9f3bfbb305cc5289b6f3ad657278e9abec9f7b42faecded5c4b134dc46d52b54",
    "tokenPath": "/tmp/fgos-work/lease-rehearsal/holder/.fgos/documentation-cutover.token",
    "sidecar": {
      "contract": { "id": "documentation-cutover-lease", "version": 1 },
      "state": "held",
      "holderTokenHash": "9f3bfbb305cc5289b6f3ad657278e9abec9f7b42faecded5c4b134dc46d52b54",
      "acquiredAt": "2026-10-22T12:02:59.234Z",
      "worktree": "/tmp/fgos-work/lease-rehearsal/holder",
      "branch": "main",
      "baseCommit": "5dd5feeb41287623dd9d7e208b8922f47ab8d9a6",
      "scope": [
        "docs/**",
        "AGENTS.md",
        "CLAUDE.md",
        "plans/260925-documentation-authority-unification/transitional-switchboard.json",
        "core/skills/**",
        ".agents/skills/**",
        "plugins/fgOS/skills/**",
        "plans/documentation-cutover-lease.json"
      ],
      "scopeDigests": { ... }
    }
  }
}
```
**Git commit on main:**
```text
commit a8eef9f71e15919736fa8f02e110794c89984dcc
Author: Rehearsal Doer <rehearsal@example.invalid>
Date:   Thu Oct 22 19:02:59 2026 +0700

    chore(docs): acquired documentation cutover lease
```
**Token privacy proof:**
- Token file exists on disk only at `/tmp/fgos-work/lease-rehearsal/holder/.fgos/documentation-cutover.token` (permissions `-rw-------`, 65 bytes).
- Neither stdout nor `plans/documentation-cutover-lease.json` contains the plaintext token; only its SHA-256 hash (`9f3bfbb3...`) is stored and logged.

---

### Step 3: Refused Operations (Non-Holder and Foreign Callers)

#### 3.1 Non-holder scoped commit in `other` (pre-commit hook)
**Command:**
```bash
cd /tmp/fgos-work/lease-rehearsal/other
echo "non-holder edit" >> docs/refusal-test.md && git add docs/refusal-test.md
git commit -m "unauthorized doc commit"
```
**Exit Code:** `1`  
**Stderr:**
```text
commit refused: the documentation-cutover write lease is held; non-holder commits to scoped paths are refused
See docs/how-to-parallel-lanes.md (workshop root, one level up from repo/) for how to work in an isolated worktree/session.
```

#### 3.2 Non-holder `--no-verify` + `update-ref` of main (reference-transaction hook)
**Command:**
```bash
cd /tmp/fgos-work/lease-rehearsal/other
git commit --no-verify -m "unauthorized doc commit with no-verify"
git update-ref refs/heads/main HEAD
```
**Exit Code:** `128`  
**Stderr:**
```text
[other cc80cc73b] unauthorized doc commit with no-verify
 1 file changed, 1 insertion(+)
 create mode 100644 docs/refusal-test.md
reference-transaction refused: reference update touches documentation scope or an unauthorized lease transition; failing closed
fatal: in 'prepared' phase, update aborted by the reference-transaction hook
```
`refs/heads/main` remained unchanged at `a8eef9f71`.

#### 3.3 Non-holder `fgos run` read-only unit
**Command:**
```bash
cd /tmp/fgos-work/lease-rehearsal/other
node /home/vantt/projects/forgentX-phase00-documentation-authority-unification/bin/fgos.mjs run "read docs" --json
```
**Exit Code:** `4` (canonical `policy-refusal`)  
**Stderr:**
```text
fgos: documentation cutover lease is held; non-holder operations are refused
```

#### 3.4 Non-holder land/merge of scoped branch through runner land door
**Command:**
```javascript
await landRunnerItem(repoRoot, { id: "other", verify: "true" }, { branch: "other", target: "main", callerCheckout: "/tmp/fgos-work/lease-rehearsal/other" });
```
**Result:** Throws `MergeError` with code `documentation-cutover-lease`.  
**Error Message:** `"documentation cutover lease is held; non-holder operations are refused"`  
**State Check:** `main` unaffected, no candidate branch, no operations dir residue.

#### 3.5 Caller from an unrelated `git init` repository
**Command:**
```javascript
await landRunnerItem(repoRoot, { id: "other", verify: "true" }, { branch: "other", target: "main", callerCheckout: "/tmp/fgos-work/unrelated-repo" });
```
**Result:** Throws `MergeError` with code `documentation-cutover-lease`.  
**Error Message:** `"documentation cutover lease is held; caller checkout must belong to the gated repository"`

---

### Step 4: Allowed Operations

#### 4.1 Out-of-scope commit by non-holder in `other`
**Command:**
```bash
cd /tmp/fgos-work/lease-rehearsal/other
echo "code change" > src/rehearsal-allowed.txt && git add src/rehearsal-allowed.txt
git commit -m "out of scope code commit by non-holder"
```
**Exit Code:** `0`  
**Output:**
```text
[other 250caf632] out of scope code commit by non-holder
 1 file changed, 1 insertion(+)
 create mode 100644 src/rehearsal-allowed.txt
```

#### 4.2 Holder commit in `holder`
**Command:**
```bash
cd /tmp/fgos-work/lease-rehearsal/holder
echo "holder edit" >> docs/guide.md && git add docs/guide.md
git commit -m "holder commit in holder"
```
**Exit Code:** `0`  
**Output:**
```text
[holder 5cff9477a] holder commit in holder
 1 file changed, 1 insertion(+)
 create mode 100644 docs/guide.md
```

#### 4.3 Holder land of scoped change through land door
**Command:**
```javascript
await landRunnerItem(repoRoot, { id: "holder", verify: "true" }, { branch: "holder", target: "main", callerCheckout: "/tmp/fgos-work/lease-rehearsal/holder" });
```
**Result:**
```text
LAND SUCCESS! Outcome: merged published commit: undefined
```
**Git commit on main:**
```text
commit 48b1ee21a084c8a514d864147eb68b3c8ef78201
Merge: a8eef9f71 5cff9477a
Author: Rehearsal Doer <rehearsal@example.invalid>
Date:   Thu Oct 22 19:04:45 2026 +0700

    merge holder into main
```

---

### Step 5: Holder Release

**Command:**
```bash
cd /tmp/fgos-work/lease-rehearsal/holder
node /home/vantt/projects/forgentX-phase00-documentation-authority-unification/bin/fgos.mjs docs-lease release --json
```
**Exit Code:** `0`  
**Output:**
```json
{
  "contract": "fgos.v1",
  "data": {
    "result": "released",
    "releasedAt": "2026-10-22T12:05:23.392Z",
    "drift": [
      "docs"
    ],
    "sidecar": {
      "contract": { "id": "documentation-cutover-lease", "version": 1 },
      "state": "released",
      "holderTokenHash": "9f3bfbb305cc5289b6f3ad657278e9abec9f7b42faecded5c4b134dc46d52b54",
      "acquiredAt": "2026-10-22T12:02:59.234Z",
      "worktree": "/tmp/fgos-work/lease-rehearsal/holder",
      "branch": "main",
      "baseCommit": "5dd5feeb41287623dd9d7e208b8922f47ab8d9a6",
      "releasedAt": "2026-10-22T12:05:23.392Z",
      "drift": [ "docs" ]
    },
    "commit": {
      "status": "committed",
      "oid": "ac0c0dc584602ed920225fe29e296cf9472990b6",
      "files": [ "plans/documentation-cutover-lease.json" ]
    }
  }
}
```
**Token cleanup:** `/tmp/fgos-work/lease-rehearsal/holder/.fgos/documentation-cutover.token` removed automatically upon successful release commit.

---

### Step 6: Acquire Again, Owner Abandon, Re-acquire and Release

#### 6.1 Acquire again
**Command:** `node bin/fgos.mjs docs-lease acquire --worktree /tmp/fgos-work/lease-rehearsal/holder --json`  
**Exit Code:** `0`  
**Main Commit:** `fb4509f2c` (`chore(docs): acquired documentation cutover lease`)  
**Token Hash:** `cf967833545fd926e4c51d3bd1ca9c5a74361b4d10f9b46a81bf16b29afb6487`

#### 6.2 Owner abandon
**Command:** `node bin/fgos.mjs docs-lease abandon --owner-confirmed --reason "rehearsal" --json`  
**Exit Code:** `0`  
**Main Commit:** `8b383aab7` (`chore(docs): abandoned documentation cutover lease`)  
**Sidecar Output:**
```json
{
  "state": "abandoned",
  "abandon": {
    "abandonedAt": "2026-10-22T12:05:43.250Z",
    "ownerConfirmed": true,
    "reason": "rehearsal",
    "holderTokenHash": "cf967833545fd926e4c51d3bd1ca9c5a74361b4d10f9b46a81bf16b29afb6487",
    "ageMs": 6341
  }
}
```

#### 6.3 Re-acquire succeeds after abandon
**Command:** `node bin/fgos.mjs docs-lease acquire --worktree /tmp/fgos-work/lease-rehearsal/holder --json`  
**Exit Code:** `0`  
**Main Commit:** `0a033952a` (`chore(docs): acquired documentation cutover lease`)  
**Token Hash:** `cf14fb02f06defa40f236a406dab4710d79ceb624612ddb8bb75b5e5daebca4d`

#### 6.4 Release
**Command:** `node bin/fgos.mjs docs-lease release --json`  
**Exit Code:** `0`  
**Main Commit:** `900272044` (`chore(docs): released documentation cutover lease`)  
**Sidecar Output:** `drift: []` (no changes occurred between 6.3 acquire and 6.4 release).

---

### Step 7: Rollback Proof & Final Main History

**Git commit sequence on `main` across the entire rehearsal:**
```text
900272044 chore(docs): released documentation cutover lease
0a033952a chore(docs): acquired documentation cutover lease
8b383aab7 chore(docs): abandoned documentation cutover lease
fb4509f2c chore(docs): acquired documentation cutover lease
ac0c0dc58 chore(docs): released documentation cutover lease
48b1ee21a merge holder into main
5cff9477a holder commit in holder
a8eef9f71 chore(docs): acquired documentation cutover lease
5dd5feeb4 docs(plan): add the cutover lease rehearsal brief (BASELINE CLONE HEAD)
```
- Exactly the 8 expected commits were recorded on `main`.
- All forced failure paths (refused pre-commit, refused update-ref, refused `fgos run`, refused non-holder land, refused foreign land) left **zero partial state** on `main`, zero lingering lock handles, and zero orphaned candidates.
- Scratch directory `/tmp/fgos-work/lease-rehearsal` and state dir `/tmp/fgos-work/state` deleted at end of rehearsal.
