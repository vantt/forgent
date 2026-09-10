---
type: how-to
title: How to Configure and Operate Agent Confinement
tags: [confinement, security, bwrap, doctor, attestation]
timestamp: 2026-09-11T00:00:00.000Z
source_capture_ids: []
---
# How to Configure and Operate Agent Confinement

The Agent Confinement Authority provides a single runtime execution door (`executeThroughConfinement`) for every external agent dispatch in fgOS. It translates declarative policies into operating-system sandboxing and session boundaries before any agent can execute, guarantees fail-closed enforcement for required policies, and produces durable, audited attestation records.

---

## 1. Architecture Overview

Every external dispatch (whether invoked via automated `spawnWorker` in the runner loop, interactive `herdr-spawn`, CLI `fgos-runner`, or `fgos coordination run`) must pass through the Confinement Authority before an executor adapter is called.

The Authority operates across five phases:
1. **Resolve Policy:** Maps the dispatch request's capability and invocation overrides against declared policies (`confinement-policy.v1`).
2. **Assess & Match:** Compares required controls and grants against the backend driver's verified capabilities.
3. **Compile Plan:** Builds an immutable `ConfinementPlan` defining write grants, environment bindings, and channel restrictions.
4. **Prepare Backend:** Directs the machine backend driver (e.g. `bwrap`) to construct the sandbox command or environment.
5. **Execute & Attest:** Spawns the agent through the single adapter port and records a durable attestation (`confinement-attestation.v1`).

---

## 2. Configuring the Machine Backend Registry

Backend drivers represent machine-level execution platforms (such as Bubblewrap on Linux or container runtimes). They are declared in a machine-local registry file:

- **Default path:** `~/.fgos/confinement-backends.json`
- **Environment override:** `FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH`
- **Schema:** `confinement-backend-registry.v1`

> [!NOTE]
> Project-local configurations are explicitly forbidden from defining or overriding machine backend instances. Backend drivers are host-level assets managed per machine.

### Automatic Bootstrap with `fgos doctor --fix`

If the registry does not exist, running `fgos doctor --fix` automatically creates the default registry pointing to the host's `bwrap` binary:

```sh
fgos doctor --fix
```

### Manual Registry Configuration

To inspect or configure `~/.fgos/confinement-backends.json` manually:

```json
{
  "$schema": "https://forgent.dev/schemas/confinement-backend-registry.v1.json",
  "version": 1,
  "confinementBackends": {
    "bwrap": {
      "type": "bwrap",
      "executable": "/usr/bin/bwrap",
      "enabled": true,
      "config": {
        "maxScratchBytes": 1073741824
      }
    }
  }
}
```

Fields:
- `type`: Driver implementation (`bwrap` is the built-in local Linux driver).
- `executable`: Path to the Bubblewrap binary.
- `enabled`: `true` to allow dispatch through this backend; `false` causes required dispatches to fail closed with `confinement-backend-disabled`.
- `config`: Driver-specific options (e.g., maximum scratch disk space).

---

## 3. Declaring Confinement Policies

Confinement policies are declared in `.fgos/config.json` under `runner.capabilities` and `runner.confinementPolicies`.

### Built-in Policies

fgOS ships two immutable built-in policies:
- `host-write-denied`: Host filesystem write denied; writable access restricted to the run directory (`run-output`) and temporary scratch space. Read access and network egress remain permitted.
- `workspace-write`: Host filesystem write denied except for explicit workspace write grants (e.g., the assigned worktree) and dispatch run output.

### Capability Confinement Declarations

In `.fgos/config.json`, each capability can declare its confinement posture:

```json
{
  "runner": {
    "confinement": {
      "strict": false
    },
    "capabilities": {
      "advise": {
        "confinement": { "mode": "unconfined" }
      },
      "code:review": {
        "confinement": { "mode": "unconfined" }
      },
      "code:implement": {
        "confinement": {
          "mode": "required",
          "policy": "workspace-write",
          "allowInvocationOverride": false
        }
      }
    }
  }
}
```

- `mode`:
  - `required`: Fails closed before spawn if confinement cannot be fully established and verified.
  - `preferred`: Requests confinement if available; currently disabled in fgOS (fails closed with `confinement-mode-unsupported` to prevent silent downgrades).
  - `unconfined`: Explicit audited opt-out. Produces an attestation record with `backend: null` and evidence kind `explicit-opt-out`.
- `policy`: ID of a built-in policy (`host-write-denied`, `workspace-write`) or a custom policy defined in `runner.confinementPolicies`.
- `allowInvocationOverride`: Boolean indicating whether a specific caller invocation can request tighter controls (overrides may never relax controls, add grants, or switch policy IDs).

### Custom Confinement Policies

You can define custom policies in `runner.confinementPolicies`:

```json
{
  "runner": {
    "confinementPolicies": {
      "strict-read-only": {
        "controls": {
          "hostWrite": "deny",
          "home": "private",
          "session": "isolated"
        },
        "resources": {
          "runOutput": { "mode": "writable" }
        }
      }
    }
  }
}
```

---

## 4. Running `fgos doctor` for Confinement Readiness

`fgos doctor` evaluates host platform status, probe freshness, policy declarations, and strict-mode readiness.

Run doctor:
```sh
fgos doctor
```

Output includes six dedicated confinement checks:

| Check ID | Description | Healthy Outcome | Remediation |
|---|---|---|---|
| `confinement-backend-registry-readable` | Machine backend registry exists and validates | `machine backend registry valid at ~/.fgos/confinement-backends.json` | Run `fgos doctor --fix` |
| `confinement-bwrap-platform` | Linux host has a functional `bwrap` executable | `bwrap backend status: ready (Linux, binary "/usr/bin/bwrap" working, enabled)` | Install `bubblewrap` package (`apt install bubblewrap`) |
| `confinement-probe-freshness` | 8 falsification probes confirm allowed vs denied behaviors | `confinement probe freshness: all 8 local-bwrap-v1 probes passed (fresh)` | Run probes to refresh cached fingerprint |
| `confinement-policies-declared` | All referenced capability policies exist | `all capability confinement policies are declared` | Declare missing policy in `runner.confinementPolicies` |
| `confinement-strict-readiness` | Strict mode readiness across all capabilities | `strict confinement readiness satisfied` (or warning if strict disabled) | Ensure every canonical capability has an explicit policy |
| `confinement-herdr-maturity` | Evaluates Herdr executor convergence maturity | `herdr confinement maturity: partial` | Verify bypass-mode executors declare full confinement |

---

## 5. Reading Attestation Records

Every dispatch executed through the Confinement Authority produces a `confinement-attestation.v1` record. This record is:
- Attached to the in-memory `ExecutorResult.confinement`.
- Saved in the dispatch run directory (`runs/<runId>/run.json` or companion files).
- Retained in the machine-level attestation store.

### Sample Attestation (`enforced`)

```json
{
  "schemaVersion": "confinement-attestation.v1",
  "dispatchId": "disp_01J8F...",
  "timestamp": "2026-09-11T05:30:00.000Z",
  "policyId": "workspace-write",
  "mode": "required",
  "outcome": "enforced",
  "backend": {
    "instance": "bwrap",
    "driver": "local-bwrap-v1",
    "executable": "/usr/bin/bwrap"
  },
  "fingerprint": "a3f8c9...",
  "channels": {
    "hostWrite": { "coverage": "satisfied", "control": "deny" },
    "hostRead": { "coverage": "satisfied", "control": "allow" },
    "networkEgress": { "coverage": "satisfied", "control": "allow" },
    "process": { "coverage": "satisfied", "control": "host" },
    "home": { "coverage": "satisfied", "control": "host" },
    "session": { "coverage": "satisfied", "control": "shared" },
    "workspace": { "coverage": "satisfied", "control": "own" }
  },
  "grants": [
    { "type": "workspace", "path": "/path/to/worktree", "access": "read-write" },
    { "type": "run-output", "path": "/path/to/runDir", "access": "read-write" }
  ]
}
```

### Key Fields to Check:
- `outcome`: The final verdict (`enforced`, `unconfined`, `degraded`, `refused`, `unknown`).
- `channels`: Reports the exact enforcement status per security axis. `satisfied` means the driver verified and applied the restriction.
- `grants`: Explicit paths permitted for filesystem write. Any write outside these paths was blocked by the kernel namespace.
- `fingerprint`: Cryptographic hash of the probe run verifying driver correctness on the current host.

---

## 6. Interpreting Dispatch Outcomes & Errors

| Outcome | Meaning | Action Needed |
|---|---|---|
| `enforced` | Full protection verified. The agent ran inside the isolated sandbox with proven write restrictions. | None. Audit evidence is valid. |
| `unconfined` | Explicit audited opt-out. The capability declared `mode: "unconfined"`. | Review whether this capability should be migrated to `required` with `workspace-write`. |
| `unknown` | The capability omitted confinement configuration, running in legacy observe mode. | Add explicit `confinement: { mode: "required", policy: "..." }` or `confinement: { mode: "unconfined" }`. |
| `degraded` | Confinement was requested but only partial isolation could be achieved. | (Disabled by default in fgOS to prevent false sense of security). |
| `refused` | Dispatch was blocked before the agent started. Adapter was never spawned. | Inspect the refusal error code below. |

### Refusal Error Codes and Remediation

When a dispatch refuses, the Authority throws an actionable error code:

- `confinement-backend-missing`: The executor references a backend instance (e.g. `bwrap`) that is not present in `~/.fgos/confinement-backends.json`.
  - *Fix:* Run `fgos doctor --fix` or configure the backend in `~/.fgos/confinement-backends.json`.
- `confinement-backend-disabled`: The configured backend instance has `"enabled": false`.
  - *Fix:* Enable the backend in `~/.fgos/confinement-backends.json`.
- `confinement-unsupported`: The policy demands a control (e.g., `networkEgress: "deny"`) not supported by the driver.
  - *Fix:* Adjust policy controls to match driver support matrix.
- `confinement-probe-failed`: Backend probes failed or probe fingerprint is stale.
  - *Fix:* Check `fgos doctor` output and verify Bubblewrap permissions (`/usr/bin/bwrap`).
- `confinement-grant-invalid`: A write grant path is invalid, traverses outside root, or collides with another dispatch.
  - *Fix:* Verify worktree and run directory permissions and path resolution.
- `confinement-need-unsatisfied`: A required resource binding could not be materialized.
  - *Fix:* Check disk space and temporary directory availability.
- `confinement-plan-mismatch`: The prepared backend command claims differed from the compiled plan.
  - *Fix:* Internal driver failure; inspect runner dispatch logs.
- `confinement-mode-unsupported`: Attempted to dispatch with `preferred` mode.
  - *Fix:* Change mode to `required` or `unconfined`.

---

## 7. Operational Guide: Enabling Strict Mode

By default, `runner.confinement.strict` is `false`. In default mode, unconfigured capabilities run in observe mode with `unknown` attestation.

In **strict mode** (`runner.confinement.strict: true`), fgOS refuses execution unless:
1. Every capability declared in `runner.capabilities` has an explicit `confinement` block with a valid `mode`.
2. Every referenced policy exists in built-ins or `runner.confinementPolicies`.
3. The `bwrap` backend is enabled and passes all platform readiness checks.

### Checklist Before Enabling Strict Mode

1. Run `fgos doctor` and verify `confinement-strict-readiness` reports no missing policies.
2. In `.fgos/config.json`, verify all canonical capabilities (`advise`, `execute`, `code:implement`, `code:review`, `code:test`, `code:debug`, `code:refactor`) are explicitly declared with valid `mode` settings.
3. Verify `bwrap` is ready (`fgos doctor` check `confinement-bwrap-platform` is passing).
4. Set strict mode in `.fgos/config.json`:
   ```json
   {
     "runner": {
       "confinement": {
         "strict": true
       }
     }
   }
   ```
5. Re-run `fgos doctor` to confirm `strict confinement readiness satisfied`.
