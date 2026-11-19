//! A binding posture mapped onto the one confinement path, and the decision whether a candidate can really apply
//! it on this machine.
//!
//! The registry of confinement backends and the search for a program are facts the caller reads (the backend
//! registry has its own module); this decides from them.

use serde_json::{json, Value};

use super::js::{coalesce, truthy};
use super::legacy::resolve_confinement_policy;

/// What a binding's posture resolves to: the policy id, the policy, and the requirement a confinement request
/// takes.
#[derive(Debug, Clone, PartialEq)]
pub struct ResolvedPosture {
    pub posture: &'static str,
    pub policy_id: &'static str,
    pub policy: Option<Value>,
}

impl ResolvedPosture {
    /// `{ mode: 'required', policyId, policy }`, shaped for building a confinement request.
    pub fn requirement(&self) -> Value {
        json!({ "mode": "required", "policyId": self.policy_id, "policy": self.policy })
    }
}

/// Anything but `workspace-write` resolves read-only; the backend driver builds the argv from the policy's grants,
/// nothing here assembles sandbox arguments.
pub fn resolve_posture(posture: Option<&str>, custom_policies: Option<&Value>) -> ResolvedPosture {
    let (posture, policy_id) = if posture == Some("workspace-write") {
        ("workspace-write", "workspace-write")
    } else {
        ("read-only", "host-write-denied")
    };
    ResolvedPosture {
        posture,
        policy_id,
        policy: resolve_confinement_policy(policy_id, custom_policies),
    }
}

/// The executor and the invocation a candidate names.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct Candidate {
    pub executor: Option<String>,
    pub invocation: Option<String>,
}

/// The facts the decision reads.
pub struct PostureContext<'a> {
    /// The executors by name (`runnerConfig.executors`, or `runner.executors`).
    pub executors: Option<&'a Value>,
    pub herdr_present: bool,
    /// `confinementBackends` of the machine registry; `None` when the registry cannot be read.
    pub backends: Option<&'a Value>,
    /// Whether a program is runnable (a name searched on the path, or a path).
    pub command_available: &'a dyn Fn(&str) -> bool,
}

/// Whether the posture can apply, and which invocation carries it.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PostureInvocation {
    pub ok: bool,
    pub invocation: Option<String>,
}

const NONE: PostureInvocation = PostureInvocation {
    ok: false,
    invocation: None,
};

/// What the pick chose: the invocation (when one was) and the confinement it runs under.
struct Picked<'a> {
    invocation: Option<&'a Value>,
    effective: &'a Value,
}

fn pick_confined_invocation<'a>(
    entry: &'a Value,
    invocation_id: Option<&str>,
    herdr_present: bool,
) -> Option<Picked<'a>> {
    let invocations: &[Value] = entry
        .get("invocations")
        .and_then(Value::as_array)
        .map(Vec::as_slice)
        .unwrap_or(&[]);
    let effective_of = |inv: &'a Value| coalesce(inv.get("confinement"), entry.get("confinement"));
    if let Some(id) = invocation_id.filter(|id| !id.is_empty()) {
        let named = invocations
            .iter()
            .find(|inv| inv.get("id").and_then(Value::as_str) == Some(id))?;
        return Some(Picked {
            invocation: Some(named),
            effective: effective_of(named).unwrap_or(&Value::Null),
        });
    }
    // No invocation named: the first plain cli invocation that declares a backend (a herdr-spawn invocation only runs
    // on the herdr transport, which names it). An invocation without an id cannot be pinned, so it only counts when
    // it is also the one a run would take by default (the first cli invocation).
    let cli: Vec<&'a Value> = invocations
        .iter()
        .filter(|inv| inv.get("via").and_then(Value::as_str) == Some("cli"))
        .collect();
    let with_backend = cli.iter().enumerate().find(|(index, inv)| {
        (herdr_present || inv.get("adapter").and_then(Value::as_str) != Some("herdr-spawn"))
            && effective_of(inv).is_some_and(|c| truthy(c.get("backend")))
            && (truthy(inv.get("id")) || *index == 0)
    });
    if let Some((_, inv)) = with_backend {
        return Some(Picked {
            invocation: Some(inv),
            effective: effective_of(inv).unwrap_or(&Value::Null),
        });
    }
    entry
        .get("confinement")
        .filter(|c| truthy(Some(c)))
        .map(|effective| Picked {
            invocation: None,
            effective,
        })
}

/// Decides whether a candidate can really apply a posture on this machine and WHICH invocation carries it. This is
/// the single decision: the binding records the returned invocation, so the one approved here is the one that runs.
///
/// The candidate must declare a confinement backend that is enabled in the machine registry with a usable
/// executable. An invocation the candidate names is kept as named; otherwise the first cli invocation that can carry
/// the posture is selected.
pub fn resolve_posture_invocation(
    candidate: Option<&Candidate>,
    context: &PostureContext<'_>,
) -> PostureInvocation {
    let Some(candidate) = candidate else {
        return NONE;
    };
    let Some(executor) = candidate.executor.as_deref().filter(|e| !e.is_empty()) else {
        return NONE;
    };
    let Some(entry) = context
        .executors
        .and_then(|all| all.get(executor))
        .filter(|e| truthy(Some(e)))
    else {
        return NONE;
    };

    // A pure native agent (no command, adapter or invocation) runs inside the Lead's own session as an in-process
    // capability: there is no spawned process for an OS backend to wrap.
    if truthy(entry.get("agentType"))
        && !truthy(entry.get("command"))
        && !truthy(entry.get("adapter"))
        && !truthy(entry.get("invocations"))
    {
        return PostureInvocation {
            ok: true,
            invocation: candidate.invocation.clone(),
        };
    }

    let Some(picked) = pick_confined_invocation(
        entry,
        candidate.invocation.as_deref(),
        context.herdr_present,
    ) else {
        return NONE;
    };
    let Some(backend_id) = picked
        .effective
        .get("backend")
        .and_then(Value::as_str)
        .filter(|b| !b.is_empty())
    else {
        return NONE;
    };

    let Some(instance) = context
        .backends
        .and_then(|b| b.get(backend_id))
        .filter(|i| truthy(Some(i)))
    else {
        return NONE;
    };
    if instance.get("enabled") == Some(&Value::Bool(false))
        || instance.get("type").and_then(Value::as_str) != Some("bwrap")
    {
        return NONE;
    }
    let executable = instance
        .get("executable")
        .and_then(Value::as_str)
        .filter(|e| !e.is_empty())
        .unwrap_or("bwrap");
    if !(context.command_available)(executable) {
        return NONE;
    }
    let invocation = candidate.invocation.clone().or_else(|| {
        picked
            .invocation
            .and_then(|inv| inv.get("id"))
            .and_then(Value::as_str)
            .map(str::to_string)
    });
    PostureInvocation {
        ok: true,
        invocation,
    }
}

/// Boolean view of [`resolve_posture_invocation`].
pub fn can_apply_posture(candidate: Option<&Candidate>, context: &PostureContext<'_>) -> bool {
    resolve_posture_invocation(candidate, context).ok
}
