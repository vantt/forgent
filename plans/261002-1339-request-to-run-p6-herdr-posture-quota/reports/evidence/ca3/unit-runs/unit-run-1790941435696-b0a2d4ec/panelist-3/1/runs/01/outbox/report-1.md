# Panelist 3 Advisory Report: Confined Herdr Pane Recipe — Per-Invocation Config vs Provider Adapter

- **Assignment:** `unit-run-1790941435696-b0a2d4ec/panelist-3/1`
- **Role:** Panelist 3 (Constraint-Focused Analysis)
- **Scope:** Read-only advisory analysis on the confined herdr pane recipe for Codex, Agy, and Pi.

---

## 1. Executive Summary & Recommendation

**Recommendation:** **Move the agent home layout and credential declaration into a declarative Provider Adapter (or Provider Normalizer metadata table), rather than keeping it as manual per-invocation configuration.**

While keeping the recipe in per-invocation configuration appears lightweight in the short term (avoiding immediate code changes), a strict constraint-focused analysis reveals that **it models an immutable tool invariant as an optional user configuration choice**. This architectural mismatch was the exact root cause of the regression in commit `cfd670c43` (where herdr invocations for Codex, Pi, and Agy crashed on launch with read-only state errors because an operator applied the bwrap posture without copy-pasting the `resourceBindings`). Furthermore, doctor checks cannot reliably guard this pattern because omitting an optional binding is indistinguishable from intentionally running unconfined.

Moving home layout and credential file declarations into provider adapters directly aligns with `docs/specs/confinement-authority.md` §6.5, cleans up hardcoded provider branching inside `bwrap.mjs` (`provisionSelectedCodexCredential`), and makes the confinement system **safe by construction** rather than fragile by convention.

---

## 2. Review of Grounded Code & Specifications

### 2.1 Spec Section 13.1 Precedent & Failure Mode
In `docs/specs/confinement-authority.md` §13.1 ("Pane herdr bị confine cho agent không phải claude: công thức, lịch sử, vì sao từng bị quên"):
- **The Recipe:** A confined `herdr-spawn` invocation with `confinement.backend: bwrap` requires:
  1. `resourceBindings: [{ resource: 'private-home', target: { kind: 'env', name: <CODEX_HOME | HOME | PI_CODING_AGENT_DIR> } }]` on the invocation.
  2. Account login from machine-global inventory `runner.providers.<provider>.accounts.<id>.credentialSource` in `~/.fgos/config.json`.
  3. Workspace trust written into private home store (`herdr-round.mjs` `trustStorePaths`).
- **The Historical Vulnerability:** Commit `cfd670c43` (2026-10-01) applied the bwrap posture across herdr invocations without providing these bindings. Codex, Pi, and Agy crashed instantly on startup because their state directories were mounted read-only under bwrap.
- **Why It Was Forgotten:** Fragmented knowledge scattered across git history, CLI-spawn vs herdr-spawn divergences, and a lack of declarative invariants.

### 2.2 The Three Herdr Invocations in `.fgos/config.json`
Inspecting `.fgos/config.json` reveals the three current non-claude herdr invocations:
1. **OpenAI / Codex (`openai` -> `codex-herdr-fgovn`, lines 606–640):**
   ```json
   "adapter": "herdr-spawn",
   "confinement": { "backend": "bwrap" },
   "resourceBindings": [
     { "resource": "private-home", "target": { "kind": "env", "name": "CODEX_HOME" } }
   ],
   "env": { "CODEX_HOME": "${HOME}/.codex-fgovn" }
   ```
2. **Gemini / Agy (`gemini` -> `agy-herdr-mucdong`, lines 814–847):**
   ```json
   "adapter": "herdr-spawn",
   "confinement": { "backend": "bwrap" },
   "resourceBindings": [
     { "resource": "private-home", "target": { "kind": "env", "name": "HOME" } }
   ],
   "env": { "HOME": "${HOME}/.agy-homes/mucdong" }
   ```
3. **xAI / Pi (`xai` -> `pi-herdr-vantt`, lines 942–974):**
   ```json
   "adapter": "herdr-spawn",
   "confinement": { "backend": "bwrap" },
   "resourceBindings": [
     { "resource": "private-home", "target": { "kind": "env", "name": "PI_CODING_AGENT_DIR" } }
   ],
   "env": { "PI_CODING_AGENT_DIR": "${HOME}/.pi/accounts/grok-vantt" }
   ```
Notice the divergence in target environment variables: Codex expects `CODEX_HOME`, Agy expects `HOME`, and Pi expects `PI_CODING_AGENT_DIR`.

### 2.3 Confinement Driver Implementation in `bwrap.mjs`
Inspecting `src/runner/dispatch/confinement/drivers/bwrap.mjs`:
- Lines 428–443: `prepareBwrap` processes generic `resourceBindings` strictly without provider branching, binding resolved paths into `resolvedEnv[binding.target.name]`.
- **However, lines 72–96 and 415–417 expose an architectural crack**:
  ```javascript
  if (res.resource === 'private-home') {
    credentialProvisioned = provisionSelectedCodexCredential(res.hostTarget, request) || credentialProvisioned;
  }
  ```
  `provisionSelectedCodexCredential` explicitly hardcodes `auth.json` and checks `source.kind !== 'codex-home'`. As acknowledged in `bwrap.mjs` lines 386–390, this is an explicit exception to the provider-agnostic rule.

---

## 3. Constraint-Focused Evaluation of Options

### Option A: Stay Per-Invocation Config (Status Quo + Guardrails)
- **Concept:** Continue declaring `resourceBindings` manually on each invocation in `.fgos/config.json`. Rely on `fgos doctor` or schema validators to catch missing bindings.
- **Constraints & Invariants Analysis:**
  1. *Violation of Separation of Invariants vs Preferences:* Whether Codex needs `CODEX_HOME` or Pi needs `PI_CODING_AGENT_DIR` is an immutable characteristic of those CLI binaries, not an end-user operational choice. Exposing this as per-invocation boilerplate forces the configuration layer to carry internal implementation mechanics.
  2. *Fragility of Doctor Detection:* In `src/setup/registrations.mjs` line 4137, `checkConfinedPaneAccounts` currently skips invocations that do not declare `private-home`:
     ```javascript
     if (inv?.adapter !== 'herdr-spawn' || !(inv.resourceBindings ?? []).some((b) => b?.resource === 'private-home')) continue;
     ```
     Because `resourceBindings` is optional per invocation, a doctor check cannot distinguish between an intentional omission and an accidental omission (the exact loophole that allowed `cfd670c43` to land). To patch this, doctor must maintain a hardcoded list of which agent types require private homes—essentially creating an out-of-band provider adapter in doctor checks anyway!
  3. *Breeds "Tùm Lum" (Platform Law RUL11 / D-ADR0036):* The recipe remains fragmented across `.fgos/config.json` (invocation args/env), `~/.fgos/config.json` (account credential inventory), `herdr-round.mjs` (trust store paths), `bwrap.mjs` (hardcoded `auth.json` copying), and `registrations.mjs` (doctor checks).

### Option B: Move into a Provider Adapter / Declarative Normalizer (Recommended)
- **Concept:** Define a declarative descriptor within the provider adapter layer (e.g. keyed by agent kind: `codex`, `agy`, `pi`, `claude`) that declares:
  - Canonical home environment variable (`CODEX_HOME`, `HOME`, `PI_CODING_AGENT_DIR`)
  - Default credential file manifest (`auth.json` for codex, relative credential paths for others)
  - Trust store kind (`codex-toml`, `agy`, `claude-json`, `pi`)
  The dispatch / confinement normalizer automatically synthesizes the required `private-home` resource binding whenever an invocation requests confinement under that provider/agent.
- **Constraints & Invariants Analysis:**
  1. *Direct Compliance with Spec §6.5:* Spec §6.5 explicitly specifies this exact architecture:
     > *"Backend driver không được branch theo executorId, providerModel, Codex, Claude hay agent type khác. Nó chỉ nhận invocation, resolved semantic grants và control chuẩn. Provider adapter/normalizer chịu trách nhiệm diễn tả nhu cầu đặc thù thành binding chuẩn trước cửa, ví dụ bind resource private-home vào env CODEX_HOME; Authority resolve resource, còn backend chỉ áp dụng binding đã được duyệt."*
  2. *Safe by Construction (Eliminates Omission Regressions):* When adding or duplicating an invocation in `.fgos/config.json`, the operator only specifies `confinement: { backend: "bwrap" }` and the executor/interactive kind. The required private-home environment variable is bound deterministically by the normalizer. A regression like `cfd670c43` becomes structurally impossible.
  3. *Cleanses the Driver Layer:* `bwrap.mjs` can retire `provisionSelectedCodexCredential` and replace it with a purely generic file-copy loop driven by the adapter’s declared credential files, restoring full provider-agnostic purity to the backend driver.
  4. *Scalability for 4th+ Agents:* Introducing a new CLI agent (e.g. Qwen, Cursor CLI, Aider) requires declaring its home layout once in its adapter descriptor, automatically enabling both CLI-spawn and Herdr-spawn confinement across all worktrees.

---

## 4. Trade-Offs Matrix

| Criterion | Option A: Per-Invocation Config | Option B: Provider Adapter / Normalizer |
| :--- | :--- | :--- |
| **Safety against Omission** | **Poor**: Relies on human memory or secondary doctor checks; vulnerable to `cfd670c43`-style crashes. | **High**: Safe by construction; normalizer automatically attaches canonical bindings. |
| **Driver Purity (Spec §6.5)** | **Compromised**: `bwrap.mjs` must retain hardcoded `auth.json` / `codex-home` branches. | **Pure**: Driver operates strictly on generic resolved resources and declared file lists. |
| **Architecture Law (RUL11)** | **Violated**: Knowledge remains fragmented ("tùm lum") across 5 files. | **Satisfied**: Agent CLI quirks are centralized in one coherent adapter declaration. |
| **Config Ergonomics** | **Verbose**: Boilerplate `resourceBindings` duplicated on every invocation. | **Concise**: Invocations in `.fgos/config.json` remain clean and high-level. |
| **Implementation Cost** | **Zero code changes now** (only doctor patch needed). | **Moderate**: Requires wiring provider normalizer into dispatch preparation. |
| **Override Flexibility** | **Explicit**: Can override on a per-invocation basis easily. | **Supported**: Normalizer provides defaults; explicit invocation bindings can still override. |

---

## 5. Concrete Action Plan & Transition Boundary

If the project is currently in a feature-freeze or rapid-shipping milestone, the transition can be executed in two disciplined steps:

1. **Immediate Hardening (Pre-migration gate):**
   - Update `src/setup/registrations.mjs` (`checkConfinedPaneAccounts`) so it fails closed: if an invocation declares `herdr-spawn` and `confinement.backend: "bwrap"` with a non-claude agent kind, it **must** fail doctor checks unless `private-home` is bound.
2. **Definitive Implementation (Moving to Provider Adapter):**
   - Create a declarative agent layout dictionary (e.g., in `src/runner/dispatch/providers/descriptors.mjs` or within the executor normalizer):
     ```javascript
     export const AGENT_CONFINED_HOME_LAYOUTS = {
       codex: { homeEnv: 'CODEX_HOME', credentialFiles: ['auth.json'], trustStore: 'codex-toml' },
       agy: { homeEnv: 'HOME', credentialFiles: [], trustStore: 'agy' },
       pi: { homeEnv: 'PI_CODING_AGENT_DIR', credentialFiles: [], trustStore: 'pi' },
     };
     ```
   - In `src/runner/dispatch/resolve.mjs` or `authority.mjs`, when preparing an invocation with `confinement.backend` where `resourceBindings` does not already specify `private-home`, consult `AGENT_CONFINED_HOME_LAYOUTS` and synthesize the binding.
   - Refactor `bwrap.mjs` lines 72–96 to consume the declared credential file list generically via `copyHomeFiles`, removing the specialized `provisionSelectedCodexCredential` function.

## 6. Conclusion
Per-invocation configuration was an acceptable provisional step during early prototyping, but keeping it permanently preserves an unfixable structural flaw that already caused one major regression. In accordance with platform foundations (L5 DoD, Spec §6.5, and RUL11), **moving home layout and credential file declarations into the provider adapter layer is the sound, robust, and permanent architectural choice.**
