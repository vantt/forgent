//! Transient systemd user scope failure domain for run supervisors.
//!
//! On Linux, every run supervisor starts detached in its own transient systemd user scope
//! (`fgos-run-<attemptId>`) with `OOMPolicy=stop` and an optional `MemoryMax`. Where no user
//! manager is reachable (or on non-Linux systems), the attempt inherits its starter's cgroup and
//! records `failureDomain: {kind: "inherited", reason}`.

use serde::{Deserialize, Serialize};
use std::path::PathBuf;

/// The failure domain of a supervised attempt.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "kind")]
pub enum FailureDomain {
    /// `systemd_run_dir` is the directory holding the `systemd-run` the probe found and `runtime_dir` the user
    /// runtime directory the probe connected through; neither is part of the recorded binding shape `{kind, unit}`.
    #[serde(rename = "systemd-scope")]
    SystemdScope {
        unit: String,
        #[serde(skip)]
        systemd_run_dir: PathBuf,
        #[serde(skip)]
        runtime_dir: PathBuf,
    },
    #[serde(rename = "inherited")]
    Inherited { reason: String },
}

impl FailureDomain {
    pub fn unit(&self) -> Option<&str> {
        match self {
            FailureDomain::SystemdScope { unit, .. } => Some(unit),
            FailureDomain::Inherited { .. } => None,
        }
    }

    pub fn reason(&self) -> Option<&str> {
        match self {
            FailureDomain::Inherited { reason } => Some(reason),
            FailureDomain::SystemdScope { .. } => None,
        }
    }
}

/// Sanitize an attempt id to valid systemd unit name characters (ASCII alphanumeric, '-', '_').
pub fn sanitize_unit_name(attempt_id: &str) -> String {
    let sanitized: String = attempt_id
        .chars()
        .map(|c| {
            if c.is_ascii_alphanumeric() || c == '-' || c == '_' {
                c
            } else {
                '_'
            }
        })
        .collect();
    if sanitized.is_empty() {
        "attempt".to_string()
    } else {
        sanitized
    }
}

/// The unit name for an attempt's transient scope: `fgos-run-<attemptId>`.
pub fn scope_unit_name(attempt_id: &str) -> String {
    format!("fgos-run-{}", sanitize_unit_name(attempt_id))
}

/// Decide the failure domain given explicit probe results: the runtime directory a user manager answered
/// through, and the absolute `systemd-run` path.
pub fn decide_failure_domain_with(
    attempt_id: &str,
    is_linux: bool,
    user_manager_runtime_dir: Option<PathBuf>,
    systemd_run: Option<PathBuf>,
) -> FailureDomain {
    if !is_linux {
        return FailureDomain::Inherited {
            reason: "not-linux".to_string(),
        };
    }
    let Some(runtime_dir) = user_manager_runtime_dir else {
        return FailureDomain::Inherited {
            reason: "no-user-manager".to_string(),
        };
    };
    let Some(systemd_run) = systemd_run else {
        return FailureDomain::Inherited {
            reason: "no-systemd-run".to_string(),
        };
    };
    let systemd_run_dir = systemd_run.parent().map(PathBuf::from).unwrap_or_default();
    FailureDomain::SystemdScope {
        unit: scope_unit_name(attempt_id),
        systemd_run_dir,
        runtime_dir,
    }
}

/// Resolves user runtime directory through controller/runtime_dir.rs, falling back to /run/user/<uid>.
pub fn resolve_runtime_dir() -> Option<PathBuf> {
    crate::controller::runtime_dir::user_runtime_dir(&crate::controller::runtime_dir::process_env)
        .or_else(|| {
            #[cfg(unix)]
            {
                let uid = crate::controller::runtime_dir::current_uid();
                let fallback = PathBuf::from(format!("/run/user/{uid}"));
                if fallback.is_dir() {
                    Some(fallback)
                } else {
                    None
                }
            }
            #[cfg(not(unix))]
            {
                None
            }
        })
}

/// Probe for a reachable user manager by connecting to the Unix domain socket `<runtime dir>/systemd/private`,
/// else `<runtime dir>/bus`; returns the runtime directory it connected through. Any error -> None.
#[cfg(unix)]
pub fn probe_user_manager() -> Option<PathBuf> {
    let runtime_dir = resolve_runtime_dir()?;
    use std::os::unix::net::UnixStream;
    let reachable = UnixStream::connect(runtime_dir.join("systemd/private")).is_ok()
        || UnixStream::connect(runtime_dir.join("bus")).is_ok();
    reachable.then_some(runtime_dir)
}

#[cfg(not(unix))]
pub fn probe_user_manager() -> Option<PathBuf> {
    None
}

/// Check if `systemd-run` is on PATH and resolve its absolute path.
pub fn resolve_systemd_run_path() -> Option<PathBuf> {
    if let Ok(path_var) = std::env::var("PATH") {
        for dir in std::env::split_paths(&path_var) {
            let candidate = dir.join("systemd-run");
            #[cfg(unix)]
            {
                use std::os::unix::fs::PermissionsExt;
                if candidate.is_file() {
                    if let Ok(meta) = candidate.metadata() {
                        if meta.permissions().mode() & 0o111 != 0 {
                            let abs = if candidate.is_absolute() {
                                candidate
                            } else if let Ok(cwd) = std::env::current_dir() {
                                cwd.join(candidate)
                            } else {
                                candidate
                            };
                            return Some(abs);
                        }
                    }
                }
            }
            #[cfg(not(unix))]
            {
                if candidate.is_file() {
                    return Some(candidate);
                }
            }
        }
    }
    None
}

/// Decide the failure domain for one launch.
pub fn decide_failure_domain(attempt_id: &str) -> FailureDomain {
    #[cfg(target_os = "linux")]
    {
        decide_failure_domain_with(
            attempt_id,
            true,
            probe_user_manager(),
            resolve_systemd_run_path(),
        )
    }
    #[cfg(not(target_os = "linux"))]
    {
        decide_failure_domain_with(attempt_id, false, None, None)
    }
}

/// Validate `memoryMax` against systemd size syntax: digits with an optional uppercase K/M/G/T suffix, or "infinity".
/// Empty string means no cap (`None`).
/// An invalid value emits a warning on stderr and returns `None`.
pub fn validate_memory_max(raw: &str) -> Option<&str> {
    let s = raw.trim();
    if s.is_empty() {
        return None;
    }
    if s == "infinity" {
        return Some("infinity");
    }
    let digits = match s.chars().last() {
        Some(c @ ('K' | 'M' | 'G' | 'T')) => &s[..s.len() - c.len_utf8()],
        _ => s,
    };
    if !digits.is_empty() && digits.chars().all(|c| c.is_ascii_digit()) {
        Some(s)
    } else {
        eprintln!("warning: invalid runner.supervisorScope.memoryMax '{s}' (expected digits with an optional uppercase K, M, G or T suffix, or infinity), ignoring");
        None
    }
}

/// Build the wrapped command: unit name `fgos-run-<attemptId>`,
/// `--scope --collect --user -p OOMPolicy=stop`, and `-p MemoryMax=<cap>` only when set.
/// Pure command builder: independent of systemd availability.
pub fn build_scope_command(
    systemd_run_bin: &str,
    unit: &str,
    memory_max: Option<&str>,
    command: &[String],
) -> Vec<String> {
    let mut out = vec![
        systemd_run_bin.to_string(),
        "--user".to_string(),
        "--scope".to_string(),
        "--collect".to_string(),
        format!("--unit={unit}"),
        "-p".to_string(),
        "OOMPolicy=stop".to_string(),
    ];
    if let Some(cap) = memory_max {
        if !cap.is_empty() {
            out.push("-p".to_string());
            out.push(format!("MemoryMax={cap}"));
        }
    }
    out.push("--".to_string());
    out.extend(command.iter().cloned());
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn unit_name_sanitises_special_characters() {
        assert_eq!(sanitize_unit_name("att-1"), "att-1");
        assert_eq!(sanitize_unit_name("att_1"), "att_1");
        assert_eq!(sanitize_unit_name("att/1:test.scope"), "att_1_test_scope");
        assert_eq!(sanitize_unit_name(""), "attempt");
        assert_eq!(scope_unit_name("att-1"), "fgos-run-att-1");
    }

    #[test]
    fn failure_domain_decision_reflects_rules() {
        let dir = || Some(PathBuf::from("/run/user/1000"));
        let run = || Some(PathBuf::from("/usr/bin/systemd-run"));
        assert_eq!(
            decide_failure_domain_with("att-1", false, dir(), run()),
            FailureDomain::Inherited {
                reason: "not-linux".to_string()
            }
        );
        assert_eq!(
            decide_failure_domain_with("att-1", true, None, run()),
            FailureDomain::Inherited {
                reason: "no-user-manager".to_string()
            }
        );
        assert_eq!(
            decide_failure_domain_with("att-1", true, dir(), None),
            FailureDomain::Inherited {
                reason: "no-systemd-run".to_string()
            }
        );
        assert_eq!(
            decide_failure_domain_with("att-1", true, dir(), run()),
            FailureDomain::SystemdScope {
                unit: "fgos-run-att-1".to_string(),
                systemd_run_dir: PathBuf::from("/usr/bin"),
                runtime_dir: PathBuf::from("/run/user/1000"),
            }
        );
        let scoped =
            serde_json::to_value(decide_failure_domain_with("att-1", true, dir(), run())).unwrap();
        assert_eq!(
            scoped,
            serde_json::json!({ "kind": "systemd-scope", "unit": "fgos-run-att-1" })
        );
    }

    #[test]
    fn validate_memory_max_syntax() {
        assert_eq!(validate_memory_max(""), None);
        assert_eq!(validate_memory_max("   "), None);
        assert_eq!(validate_memory_max("8G"), Some("8G"));
        assert_eq!(validate_memory_max("8g"), None);
        assert_eq!(validate_memory_max("8m"), None);
        assert_eq!(validate_memory_max("Infinity"), None);
        assert_eq!(validate_memory_max("G"), None);
        assert_eq!(validate_memory_max("1024M"), Some("1024M"));
        assert_eq!(validate_memory_max("500"), Some("500"));
        assert_eq!(validate_memory_max("infinity"), Some("infinity"));
        assert_eq!(validate_memory_max("8X"), None);
        assert_eq!(validate_memory_max("-8G"), None);
        assert_eq!(validate_memory_max("8.5G"), None);
        assert_eq!(validate_memory_max("invalid"), None);
    }

    #[test]
    fn build_scope_command_shapes() {
        let base_cmd = vec![
            "/bin/fgos".to_string(),
            "internal".to_string(),
            "supervise".to_string(),
        ];
        let plain = build_scope_command("systemd-run", "fgos-run-att-1", None, &base_cmd);
        assert_eq!(
            plain,
            vec![
                "systemd-run",
                "--user",
                "--scope",
                "--collect",
                "--unit=fgos-run-att-1",
                "-p",
                "OOMPolicy=stop",
                "--",
                "/bin/fgos",
                "internal",
                "supervise"
            ]
        );

        let with_cap = build_scope_command("systemd-run", "fgos-run-att-1", Some("8G"), &base_cmd);
        assert_eq!(
            with_cap,
            vec![
                "systemd-run",
                "--user",
                "--scope",
                "--collect",
                "--unit=fgos-run-att-1",
                "-p",
                "OOMPolicy=stop",
                "-p",
                "MemoryMax=8G",
                "--",
                "/bin/fgos",
                "internal",
                "supervise"
            ]
        );

        let with_empty = build_scope_command("systemd-run", "fgos-run-att-1", Some(""), &base_cmd);
        assert_eq!(with_empty, plain);
    }
}
