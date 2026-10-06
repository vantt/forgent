# Phase01 execution evidence — binding and truthful advisory surface

Date: 2026-10-06. Execution worktree: `/home/vantt/projects/worktrees/forgentX-single-door-execution`.
Scope: revised hygiene-only Phase01, not advisory-capability-completion. Reused the copied plan/preservation matrix and prior migration facts; historical reports were not rewritten or rerun.

## Edits

- `core/skills/fgos-architecture-panel/SKILL.md`: removed the active retired executor/model roster, actor overrides, specialist-slot/coordination operations and retired graph budgets. Preserved all nine cognitive role meanings, scout-before-ask, real historical debate/synthesis examples, six dispositions, human decision authority, dialogue categories and continuity goals as doctrine. Uses existing registered Workflow and shared dispatch fallback; explicitly prohibits unsafe/inline impersonation. Corrected source-repo links to existing current doctrine paths and the separate advisory plan.
- `docs/specs/runner.md`: one narrow current-boundary statement beside Workflow ownership. This is an intentional legacy-spec documentation-migration exception, not a broad spec rewrite.
- `CHANGELOG.md`: one Phase01 Unreleased Changed line.
- No config/runtime/Workflow changes, generated projections, permanent wording tests, builds, tests, lint, formatters, commits, worker launches or file deletion.

## Required safety invariant

Every advisory role must resolve `posture: "read-only"`, `requirement.mode: "required"`, `requirement.policyId: "host-write-denied"`, and `requirement.policy.controls.hostWrite: "deny"`. Dispatch-scoped run-output write and private-home read-write grants remain; executor credentials are read-only. Missing safe execution is a prerequisite/refusal, not permission to downgrade confinement or use a mutating/global/inline fallback.

Binding and policy resolution below are NOT proof of actual host write denial, blind read enforcement, end-to-end cognition, or advisor quality. No live confinement probe was run.

## Safe resolution observation

Actual read-only imports: `loadRunnerConfigFromDir` (project config merged with global, project wins), `loadWorkflow`, `bind`, `simulateUnitBindings`, `resolvePosture`. Session intentionally headless with `herdrPresent: false`; no transport probe or worker execution. The script loads the current registered definition and prints direct binding provenance plus the existing pattern simulator's role selections.

Important boundary: `simulateUnitBindings` does not forward `unit.blind` into its internal `bind` call; its reported `pass` is role-pool resolution only. The separate direct binding explicitly passes the shaping template's blind flag, but even that resolver result does not execute blind enforcement or its probes. Likewise template persona forwarding is not exercised by this script; only the CLI/runtime owns that path. No claim of a safe full Workflow start follows from this smoke.

Exact executed command (working directory as above):

```sh
node --input-type=module -e 'import { loadRunnerConfigFromDir } from '"'"'./src/runner/dispatch/config.mjs'"'"';
import { loadWorkflow } from '"'"'./src/workflow/loader.mjs'"'"';
import { bind } from '"'"'./src/runner/execution/bind.mjs'"'"';
import { simulateUnitBindings } from '"'"'./src/runner/execution/dry-bind.mjs'"'"';
import { resolvePosture } from '"'"'./src/runner/dispatch/confinement/policies.mjs'"'"';
const root = process.cwd();
const runnerConfig = loadRunnerConfigFromDir(root);
const workflow = loadWorkflow('"'"'architecture-advisory'"'"', { packageRoot: root, cwd: root });
const session = { headless: true, herdrPresent: false };
const policy = resolvePosture({ posture: '"'"'read-only'"'"' }, { runnerConfig });
const steps = [];
for (const step of workflow.steps) {
  for (const entry of step.units ?? []) {
    const unit = { ...entry.template, id: entry.id, writes: [] };
    const binding = bind({ unit, role: '"'"'producer'"'"', readOnly: true, blind: unit.blind === true }, { runnerConfig, session });
    const pattern = await simulateUnitBindings(unit, runnerConfig, { session });
    steps.push({ step: step.id, capability: unit.capability, declaredBlind: unit.blind === true, binding, pattern });
  }
}
console.log(JSON.stringify({ root, configSource: '"'"'loadRunnerConfigFromDir: project .fgos/config.json merged with global; project wins'"'"', session, policy, steps, scope: '"'"'Resolution only: no worker/model/spawn, state writes, or confinement probe.'"'"' }, null, 2));'
```

Observed output (exit 0):

```text
{
  "root": "/home/vantt/projects/worktrees/forgentX-single-door-execution",
  "configSource": "loadRunnerConfigFromDir: project .fgos/config.json merged with global; project wins",
  "session": {
    "headless": true,
    "herdrPresent": false
  },
  "policy": {
    "posture": "read-only",
    "policyId": "host-write-denied",
    "policy": {
      "contract": "confinement-policy.v1",
      "controls": {
        "hostWrite": "deny",
        "hostRead": "allow",
        "networkEgress": "allow",
        "process": "host",
        "home": "host",
        "session": "shared",
        "workspace": "shared"
      },
      "grants": [
        {
          "resource": "run-output",
          "access": "write",
          "scope": "dispatch"
        },
        {
          "resource": "private-home",
          "access": "read-write",
          "scope": "dispatch"
        },
        {
          "resource": "executor-credentials",
          "access": "read",
          "scope": "dispatch"
        }
      ]
    },
    "requirement": {
      "mode": "required",
      "policyId": "host-write-denied",
      "policy": {
        "contract": "confinement-policy.v1",
        "controls": {
          "hostWrite": "deny",
          "hostRead": "allow",
          "networkEgress": "allow",
          "process": "host",
          "home": "host",
          "session": "shared",
          "workspace": "shared"
        },
        "grants": [
          {
            "resource": "run-output",
            "access": "write",
            "scope": "dispatch"
          },
          {
            "resource": "private-home",
            "access": "read-write",
            "scope": "dispatch"
          },
          {
            "resource": "executor-credentials",
            "access": "read",
            "scope": "dispatch"
          }
        ]
      }
    }
  },
  "steps": [
    {
      "step": "framing",
      "capability": "architecture:frame",
      "declaredBlind": false,
      "binding": {
        "contractVersion": "v1alpha1",
        "executor": "openai",
        "invocation": "codex-cli-bwrap",
        "transport": "cli",
        "candidateIndex": 1,
        "tier": "standard",
        "model": "gpt-5.6-terra",
        "persona": null,
        "mechanism": "out-of-process",
        "posture": "read-only",
        "provenance": {
          "executor": {
            "value": "openai",
            "source": "capability:architecture:frame"
          },
          "invocation": {
            "value": "codex-cli-bwrap",
            "source": "capability:architecture:frame"
          },
          "transport": {
            "value": "cli",
            "source": "default-cli"
          },
          "tier": {
            "value": "standard",
            "source": "rigor:standard"
          },
          "model": {
            "value": "gpt-5.6-terra",
            "source": "resolveTierModel(openai.standard)"
          },
          "persona": {
            "value": null,
            "source": "none"
          },
          "mechanism": {
            "value": "out-of-process",
            "source": "decideExecutorDispatchMechanism"
          },
          "posture": {
            "value": "read-only",
            "source": "read-only-ask-or-writes-empty"
          }
        }
      },
      "pattern": {
        "outcome": "pass",
        "roles": [
          {
            "role": "producer",
            "executor": "openai",
            "invocation": "codex-cli-bwrap"
          }
        ]
      }
    },
    {
      "step": "shaping",
      "capability": "architecture:shape",
      "declaredBlind": true,
      "binding": {
        "contractVersion": "v1alpha1",
        "executor": "openai",
        "invocation": "codex-cli-bwrap",
        "transport": "cli",
        "candidateIndex": 1,
        "tier": "standard",
        "model": "gpt-5.6-terra",
        "persona": null,
        "mechanism": "out-of-process",
        "posture": "read-only",
        "provenance": {
          "executor": {
            "value": "openai",
            "source": "capability:architecture:shape"
          },
          "invocation": {
            "value": "codex-cli-bwrap",
            "source": "capability:architecture:shape"
          },
          "transport": {
            "value": "cli",
            "source": "default-cli"
          },
          "tier": {
            "value": "standard",
            "source": "rigor:standard"
          },
          "model": {
            "value": "gpt-5.6-terra",
            "source": "resolveTierModel(openai.standard)"
          },
          "persona": {
            "value": null,
            "source": "none"
          },
          "mechanism": {
            "value": "out-of-process",
            "source": "decideExecutorDispatchMechanism"
          },
          "posture": {
            "value": "read-only",
            "source": "read-only-ask-or-writes-empty"
          }
        }
      },
      "pattern": {
        "outcome": "pass",
        "roles": [
          {
            "role": "panelist-1",
            "executor": "openai",
            "invocation": "codex-cli-bwrap"
          },
          {
            "role": "panelist-2",
            "executor": "gemini",
            "invocation": "agy-cli-bwrap-mucdong"
          },
          {
            "role": "panelist-3",
            "executor": "xai",
            "invocation": "pi-cli-bwrap-vantt"
          },
          {
            "role": "synthesizer",
            "executor": "glm",
            "invocation": "pi-cli-bwrap-openrouter"
          }
        ]
      }
    },
    {
      "step": "critique",
      "capability": "architecture:critique",
      "declaredBlind": false,
      "binding": {
        "contractVersion": "v1alpha1",
        "executor": "openai",
        "invocation": "codex-cli-bwrap",
        "transport": "cli",
        "candidateIndex": 1,
        "tier": "standard",
        "model": "gpt-5.6-terra",
        "persona": null,
        "mechanism": "out-of-process",
        "posture": "read-only",
        "provenance": {
          "executor": {
            "value": "openai",
            "source": "capability:architecture:critique"
          },
          "invocation": {
            "value": "codex-cli-bwrap",
            "source": "capability:architecture:critique"
          },
          "transport": {
            "value": "cli",
            "source": "default-cli"
          },
          "tier": {
            "value": "standard",
            "source": "rigor:standard"
          },
          "model": {
            "value": "gpt-5.6-terra",
            "source": "resolveTierModel(openai.standard)"
          },
          "persona": {
            "value": null,
            "source": "none"
          },
          "mechanism": {
            "value": "out-of-process",
            "source": "decideExecutorDispatchMechanism"
          },
          "posture": {
            "value": "read-only",
            "source": "read-only-ask-or-writes-empty"
          }
        }
      },
      "pattern": {
        "outcome": "pass",
        "roles": [
          {
            "role": "producer",
            "executor": "openai",
            "invocation": "codex-cli-bwrap"
          },
          {
            "role": "reviewer",
            "executor": "gemini",
            "invocation": "agy-cli-bwrap-mucdong"
          }
        ]
      }
    },
    {
      "step": "synthesis",
      "capability": "architecture:synthesize",
      "declaredBlind": false,
      "binding": {
        "contractVersion": "v1alpha1",
        "executor": "openai",
        "invocation": "codex-cli-bwrap",
        "transport": "cli",
        "candidateIndex": 1,
        "tier": "standard",
        "model": "gpt-5.6-terra",
        "persona": null,
        "mechanism": "out-of-process",
        "posture": "read-only",
        "provenance": {
          "executor": {
            "value": "openai",
            "source": "capability:architecture:synthesize"
          },
          "invocation": {
            "value": "codex-cli-bwrap",
            "source": "capability:architecture:synthesize"
          },
          "transport": {
            "value": "cli",
            "source": "default-cli"
          },
          "tier": {
            "value": "standard",
            "source": "rigor:standard"
          },
          "model": {
            "value": "gpt-5.6-terra",
            "source": "resolveTierModel(openai.standard)"
          },
          "persona": {
            "value": null,
            "source": "none"
          },
          "mechanism": {
            "value": "out-of-process",
            "source": "decideExecutorDispatchMechanism"
          },
          "posture": {
            "value": "read-only",
            "source": "read-only-ask-or-writes-empty"
          }
        }
      },
      "pattern": {
        "outcome": "pass",
        "roles": [
          {
            "role": "producer",
            "executor": "openai",
            "invocation": "codex-cli-bwrap"
          }
        ]
      }
    },
    {
      "step": "explanation",
      "capability": "architecture:explain",
      "declaredBlind": false,
      "binding": {
        "contractVersion": "v1alpha1",
        "executor": "openai",
        "invocation": "codex-cli-bwrap",
        "transport": "cli",
        "candidateIndex": 1,
        "tier": "standard",
        "model": "gpt-5.6-terra",
        "persona": null,
        "mechanism": "out-of-process",
        "posture": "read-only",
        "provenance": {
          "executor": {
            "value": "openai",
            "source": "capability:architecture:explain"
          },
          "invocation": {
            "value": "codex-cli-bwrap",
            "source": "capability:architecture:explain"
          },
          "transport": {
            "value": "cli",
            "source": "default-cli"
          },
          "tier": {
            "value": "standard",
            "source": "rigor:standard"
          },
          "model": {
            "value": "gpt-5.6-terra",
            "source": "resolveTierModel(openai.standard)"
          },
          "persona": {
            "value": null,
            "source": "none"
          },
          "mechanism": {
            "value": "out-of-process",
            "source": "decideExecutorDispatchMechanism"
          },
          "posture": {
            "value": "read-only",
            "source": "read-only-ask-or-writes-empty"
          }
        }
      },
      "pattern": {
        "outcome": "pass",
        "roles": [
          {
            "role": "producer",
            "executor": "openai",
            "invocation": "codex-cli-bwrap"
          }
        ]
      }
    }
  ],
  "scope": "Resolution only: no worker/model/spawn, state writes, or confinement probe."
}


Wall time: 0.11 seconds
```

All five direct bindings resolved `read-only`, out-of-process, and config capability provenance. The current headless pool resolved the solo producer to `openai` / `codex-cli-bwrap`, the shaping panel to openai/gemini/xai with glm synthesizer, and critique to openai producer plus gemini reviewer (no separate red-team seat was observed). These are snapshot observations, not permanent skill pins or diversity/quality claims.

## Supported read-only CLI path / honest refusal

Did not start a Workflow merely to obtain an ID. Used a deliberately absent ID through the real current CLI status door, with explicit worktree state root:

```sh
node bin/fgos.mjs workflow status panel-truth-phase01-no-run --dir /home/vantt/projects/worktrees/forgentX-single-door-execution
```

Observed output:

```text
fgos: Workflow run "panel-truth-phase01-no-run" not found


Wall time: 0.15 seconds

Command exited with code 4
```

No Workflow, Unit or Assignment ID was allocated. The not-found error is the honest result; it is not a fabricated successful panel run. `start`, `answer` and `resume` were inspected as current APIs but not executed because they write state/advance workers.

## Temporary source scan

`grep` on the owned canonical skill for retired executor/model tokens and APIs (`claude-bwrap`, `agy-bwrap`, `codex-bwrap`, `codex-readonly`, `gemini-3.`, `gpt-5.`, opus/sonnet/haiku, `fgos coordination`, `actors[]`, specialist authorization, revise-synthesis/explanation, retired maxInvocations/protocol path) returned **No matches found**. No permanent source-wording/roster test was added.

## Coordinator handoff

Phase01 source/truth cleanup is complete. Phase02 owns projection/header regeneration and restaging. Coordinator owns later consumer/full-suite verification. Real workers, live denial probes, installed advisory quality, late specialist/dialogue/per-seat/final-review/interrupted-Unit completion remain unexercised and belong to the separate advisory plan. Existing historical artifacts and original planning worktree were left intact.

## Independent review disposition

Reviewer found one projection-portability defect in the new workflow hyperlink. Coordinator replaced it with an explicitly source-repository literal path, without render rewriting. Narrow re-review returned `overall_correctness: correct`, zero findings. Phase01 binding/truth acceptance passed for the reviewed scope; generated projection and full consumer verification follow in Phase02.
