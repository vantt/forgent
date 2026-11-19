//! The attestation of what a launch is observed to enforce: the driver's claims when it prepared the sandbox, else a
//! hand-written bwrap argv, else nothing. A legacy or omitted policy observes as unknown, never as enforced.

use serde_json::{json, Map, Value};

use super::js::{at, get, truthy};
use crate::confinement::policy::{normalize_legacy_confinement, request_is_blind};

/// What a launch is observed to enforce.
#[derive(Default)]
struct Observed {
    host_write_deny: bool,
    process_isolation: bool,
    session_isolation: bool,
    private_home: bool,
    own_workspace: bool,
    /// `(src, dest)` of each writable bind.
    writable_binds: Vec<(Option<String>, String)>,
}

fn is_root_path(p: Option<&str>) -> bool {
    matches!(p, Some("/") | Some(""))
}

/// `--ro-bind`, `--bind` or `--dev-bind`, with an optional `-try`: the flag, and whether it is read-only.
fn bind_flag(flag: &str) -> Option<bool> {
    let base = flag.strip_suffix("-try").unwrap_or(flag);
    match base {
        "--ro-bind" => Some(true),
        "--bind" | "--dev-bind" => Some(false),
        _ => None,
    }
}

/// The controls a hand-written bwrap argv sets up, read from its options before `--`. A bind is either one string
/// (`--bind <src> <dest>`) or the flag followed by its two arguments.
fn observe_bwrap_argv(raw_args: &[Value], repo_root: Option<&str>) -> Observed {
    let end = raw_args
        .iter()
        .position(|a| a.as_str() == Some("--"))
        .unwrap_or(raw_args.len());
    let options = &raw_args[..end];
    let mut seen = Observed::default();
    let (mut ro_root, mut wider_rebind) = (false, false);
    let mut home_target: Option<String> = None;
    let text = |i: usize| options.get(i).and_then(Value::as_str);
    let mut i = 0;
    while i < options.len() {
        let Some(arg) = options[i].as_str() else {
            i += 1;
            continue;
        };
        let (mut flag, mut src, mut dest) = (arg, None::<&str>, None::<&str>);
        let words: Vec<&str> = arg.split_whitespace().collect();
        let spaced = arg
            .split_once(' ')
            .is_some_and(|(head, _)| bind_flag(head).is_some());
        if spaced {
            flag = words.first().copied().unwrap_or(arg);
            src = words.get(1).copied();
            dest = words.get(2).copied();
        } else if bind_flag(arg).is_some() {
            src = text(i + 1);
            dest = text(i + 2);
            i += 2;
        }

        if arg == "--unshare-pid" || arg == "--unshare-all" {
            seen.process_isolation = true;
        } else if let Some(read_only) = bind_flag(flag) {
            if read_only {
                if is_root_path(src) && is_root_path(dest) {
                    ro_root = true;
                }
            } else if is_root_path(dest) {
                wider_rebind = true;
            } else if let Some(dest) = dest.filter(|d| !d.is_empty()) {
                seen.writable_binds
                    .push((src.map(String::from), dest.to_string()));
                if repo_root
                    .is_some_and(|root| !root.is_empty() && src == Some(root) && dest != root)
                {
                    seen.own_workspace = true;
                }
            }
        } else if arg == "--setenv" && text(i + 1) == Some("HOME") && text(i + 2).is_some() {
            home_target = text(i + 2).map(String::from);
            i += 2;
        }

        if arg == "--unshare-ipc" || arg == "--unshare-all" {
            seen.session_isolation = true;
        }
        i += 1;
    }
    seen.private_home = home_target.as_deref().is_some_and(|home| {
        !home.is_empty()
            && seen
                .writable_binds
                .iter()
                .any(|(src, dest)| dest == home && src.as_deref() != Some(home))
    });
    seen.host_write_deny = ro_root && !wider_rebind;
    seen
}

/// What the launch is observed to enforce: the driver's claims when it prepared the sandbox, else a hand-written
/// bwrap argv, else nothing.
fn observed_controls(request: &Value, driver_claims: Option<&Value>) -> Observed {
    if let Some(claims) = driver_claims.filter(|c| c.is_object()) {
        let satisfied = |control: &str| {
            get(claims, &format!("control:{control}")).and_then(Value::as_str) == Some("satisfied")
        };
        return Observed {
            host_write_deny: satisfied("hostWrite"),
            process_isolation: satisfied("process"),
            session_isolation: satisfied("session"),
            private_home: satisfied("home"),
            own_workspace: satisfied("workspace"),
            writable_binds: Vec::new(),
        };
    }
    let invocation = get(request, "invocation");
    if invocation
        .and_then(|i| get(i, "command"))
        .and_then(Value::as_str)
        == Some("bwrap")
    {
        if let Some(args) = invocation
            .and_then(|i| get(i, "args"))
            .and_then(Value::as_array)
        {
            let repo_root = at(request, &["context", "repoRoot"]).and_then(Value::as_str);
            return observe_bwrap_argv(args, repo_root);
        }
    }
    Observed::default()
}

fn object_of(pairs: impl IntoIterator<Item = (&'static str, Value)>) -> Map<String, Value> {
    pairs.into_iter().map(|(k, v)| (k.to_string(), v)).collect()
}

/// Builds a canonical `confinement-attestation.v1`. `phase` is what the launch has reached: `refused` or `prepared`,
/// the only two any caller records.
pub fn build_confinement_attestation(
    request: &Value,
    phase: &str,
    outcome: Option<&str>,
    driver_claims: Option<&Value>,
) -> Value {
    let requirement = get(request, "requirement");
    let req_mode = requirement
        .and_then(|r| get(r, "mode"))
        .cloned()
        .unwrap_or(Value::Null);
    let omitted = truthy(requirement.and_then(|r| get(r, "omitted")));
    let explicit_unconfined = req_mode.as_str() == Some("unconfined") && !omitted;
    // A legacy omitted policy observes as unknown, never as enforced.
    let determined_outcome = outcome.map(String::from).unwrap_or_else(|| {
        if phase == "refused" {
            "refused".into()
        } else if explicit_unconfined {
            "unconfined".into()
        } else {
            "unknown".into()
        }
    });

    let invocation = get(request, "invocation");
    let legacy: Option<Value> = requirement
        .and_then(|r| get(r, "legacy"))
        .filter(|l| truthy(Some(l)))
        .cloned()
        .or_else(|| {
            invocation
                .and_then(|i| get(i, "confinement"))
                .filter(|c| truthy(Some(c)))
                .and_then(normalize_legacy_confinement)
        });
    let legacy_control = |name: &str| {
        legacy
            .as_ref()
            .and_then(|l| at(l, &["controls", name]))
            .and_then(Value::as_str)
            .map(String::from)
    };
    let has_bwrap_cmd = invocation
        .and_then(|i| get(i, "command"))
        .and_then(Value::as_str)
        == Some("bwrap");
    let observed = observed_controls(request, driver_claims);
    let is_verified_bwrap = observed.host_write_deny || observed.process_isolation;
    let executor_id = get(request, "executorId").and_then(Value::as_str);
    let is_heuristic_bwrap = !is_verified_bwrap
        && (has_bwrap_cmd
            || executor_id.is_some_and(|id| id.contains("bwrap"))
            || invocation
                .and_then(|i| get(i, "args"))
                .and_then(Value::as_array)
                .is_some_and(|args| args.iter().any(|a| a.as_str() == Some("bwrap"))));
    let bwrap_named = has_bwrap_cmd || is_heuristic_bwrap;
    let blind = request_is_blind(request);
    let claims = driver_claims.filter(|c| c.is_object());

    let mut effective = legacy
        .as_ref()
        .and_then(|l| get(l, "controls"))
        .and_then(Value::as_object)
        .cloned()
        .unwrap_or_default();
    if observed.host_write_deny {
        effective.insert("hostWrite".into(), json!("deny"));
    }
    if observed.process_isolation {
        effective.insert("process".into(), json!("isolated"));
    }
    // The driver claims it satisfied the request's own hostRead: blind.
    if blind
        && claims
            .and_then(|c| get(c, "control:hostRead"))
            .and_then(Value::as_str)
            == Some("satisfied")
    {
        effective.insert("hostRead".into(), json!("blind"));
    }

    let mut coverage = Map::new();
    if let Some(claims) = claims {
        for (key, value) in claims.as_object().into_iter().flatten() {
            coverage.insert(key.clone(), value.clone());
        }
    } else {
        let verdict = |held: bool| json!(if held { "satisfied" } else { "unverified" });
        if observed.host_write_deny {
            coverage.insert("control:hostWrite".into(), json!("satisfied"));
        } else if bwrap_named {
            coverage.insert("control:hostWrite".into(), json!("unverified"));
        }
        if observed.process_isolation {
            coverage.insert("control:process".into(), json!("satisfied"));
        } else if bwrap_named {
            coverage.insert("control:process".into(), json!("unverified"));
        }
        if legacy_control("session").as_deref() == Some("isolated") {
            coverage.insert(
                "control:session".into(),
                verdict(observed.session_isolation),
            );
        }
        if legacy_control("workspace").as_deref() == Some("own") {
            coverage.insert("control:workspace".into(), verdict(observed.own_workspace));
        }
        if legacy_control("home").as_deref() == Some("private") {
            coverage.insert("control:home".into(), verdict(observed.private_home));
        }
    }

    // A legacy grant names an abstract resource whose path the adapter allocates later: its target is the known
    // home directory, else the resource name itself.
    let home_dir = at(request, &["context", "homeDir"]).filter(|h| !h.is_null());
    let mut grants: Vec<Value> = legacy
        .as_ref()
        .and_then(|l| get(l, "grants"))
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .map(|grant| {
            let mut grant = grant.as_object().cloned().unwrap_or_default();
            let target = home_dir
                .cloned()
                .or_else(|| grant.get("resource").cloned())
                .unwrap_or(Value::Null);
            grant.insert("target".into(), target);
            Value::Object(grant)
        })
        .collect();
    let has_resource = |grants: &[Value], name: &str| {
        grants
            .iter()
            .any(|g| get(g, "resource").and_then(Value::as_str) == Some(name))
    };
    if is_verified_bwrap && !has_resource(&grants, "run-output") {
        let target = at(request, &["context", "runDir"])
            .filter(|d| !d.is_null())
            .cloned()
            .unwrap_or_else(|| json!("run-output"));
        grants.push(json!({ "resource": "run-output", "access": "write", "target": target }));
    }
    if observed.host_write_deny {
        for (_, dest) in &observed.writable_binds {
            let resource = if dest.ends_with(".fgos/assignments") || dest.ends_with("/assignments")
            {
                "assignments".to_string()
            } else {
                let base = dest.rsplit('/').find(|s| !s.is_empty()).unwrap_or_default();
                if base.is_empty() {
                    "writable-exception".into()
                } else {
                    base.to_string()
                }
            };
            let taken = grants.iter().any(|g| {
                get(g, "target").and_then(Value::as_str) == Some(dest.as_str())
                    || get(g, "resource").and_then(Value::as_str) == Some(resource.as_str())
            });
            if !taken {
                grants
                    .push(json!({ "resource": resource, "access": "read-write", "target": dest }));
            }
        }
    }

    let is_herdr = invocation
        .and_then(|i| get(i, "adapter"))
        .and_then(Value::as_str)
        == Some("herdr-spawn");
    let session_isolated = legacy_control("session").as_deref() == Some("isolated");
    let host_ipc_covered = !is_herdr && is_verified_bwrap && session_isolated;
    let policy_id = requirement
        .and_then(|r| get(r, "policyId"))
        .filter(|p| truthy(Some(p)));
    let sandbox_channel = |name: &str, covered: bool| {
        let detail = if covered {
            if claims.is_some() {
                "driver-verified confinement control".to_string()
            } else {
                "observed hand-written bwrap sandbox".to_string()
            }
        } else if bwrap_named {
            "observe-mode: heuristic bwrap name detected but sandbox unverified".to_string()
        } else if let Some(id) = policy_id {
            format!(
                "observe-mode: unverified execution for policy {}",
                super::js::display(Some(id))
            )
        } else {
            "observe-mode: no policy declared".to_string()
        };
        let coverage = if covered {
            "covered"
        } else if bwrap_named {
            "unverified"
        } else {
            "unknown"
        };
        json!({ "name": name, "coverage": coverage, "detail": detail })
    };
    let channels: Vec<Value> = if explicit_unconfined {
        ["filesystem", "inherited-fd", "stdio", "host-ipc", "network"]
            .iter()
            .map(|name| json!({ "name": name, "coverage": "out-of-scope", "detail": "explicitly unconfined" }))
            .collect()
    } else {
        let host_ipc_detail = if host_ipc_covered {
            "observed legacy isolated session with verified bwrap"
        } else if is_herdr && session_isolated {
            "observe-mode: herdr session isolation is lifecycle hygiene, not OS IPC confinement"
        } else {
            "observe-mode: host IPC unmanaged"
        };
        vec![
            sandbox_channel("filesystem", observed.host_write_deny),
            sandbox_channel("inherited-fd", is_verified_bwrap),
            json!({ "name": "stdio", "coverage": "unknown", "detail": "observe-mode: stdio unmanaged" }),
            json!({
                "name": "host-ipc",
                "coverage": if host_ipc_covered { "covered" } else { "out-of-scope" },
                "detail": host_ipc_detail,
            }),
            json!({ "name": "network", "coverage": "out-of-scope", "detail": "observe-mode: network unmanaged" }),
        ]
    };

    let mismatches = if is_herdr {
        json!([{ "code": "herdr-partial-maturity", "detail": "herdr-spawn session/home lifecycle remains in adapter; pre-adapter preparation partially mature." }])
    } else {
        json!([])
    };

    let dispatch_id = get(request, "dispatchId").cloned().unwrap_or(Value::Null);
    let executor_text = super::js::display(get(request, "executorId"));
    let observation = |reference: String| json!({ "kind": "structural-observation", "ref": reference, "freshness": "current" });
    let mut evidence = vec![observation(format!(
        "dispatch:{}",
        super::js::display(Some(&dispatch_id))
    ))];
    if is_herdr {
        evidence.push(observation("herdr-partial-maturity:herdr-round".into()));
    }
    if is_verified_bwrap {
        evidence.push(observation(format!("bwrap-argv:{executor_text}")));
    } else if is_heuristic_bwrap {
        evidence.push(observation(format!("bwrap-heuristic:{executor_text}")));
    }
    if legacy.is_some() {
        evidence.push(observation(format!("legacy-confinement:{executor_text}")));
    }
    if explicit_unconfined {
        evidence.push(json!({
            "kind": "explicit-opt-out",
            "ref": "policy:unconfined",
            "detail": "explicit unconfined policy declared; running unconfined with audited opt-out",
            "freshness": "current",
        }));
    }

    let mut requested = object_of([
        ("mode", req_mode),
        (
            "policyId",
            requirement
                .and_then(|r| get(r, "policyId"))
                .cloned()
                .unwrap_or(Value::Null),
        ),
        (
            "policy",
            requirement
                .and_then(|r| get(r, "policy"))
                .cloned()
                .unwrap_or(Value::Null),
        ),
    ]);
    if let Some(over) = get(request, "override").filter(|o| truthy(Some(o))) {
        requested.insert("override".into(), over.clone());
    }

    json!({
        "contract": "confinement-attestation.v1",
        "dispatchId": dispatch_id,
        "phase": phase,
        "outcome": determined_outcome,
        // The bypass-pairing decision gates dispatch on this value; recorded so an audit need not rebuild it.
        "permissionMode": invocation.and_then(|i| get(i, "permissionMode")).filter(|p| !p.is_null()).cloned().unwrap_or(Value::Null),
        "requested": requested,
        "coverage": coverage,
        "effectiveControls": effective,
        "resources": [],
        "readiness": {},
        "channels": channels,
        "receipt": null,
        "backend": null,
        "grants": grants,
        "mismatches": mismatches,
        "evidence": evidence,
        "cleanup": { "status": "not-needed" },
    })
}
