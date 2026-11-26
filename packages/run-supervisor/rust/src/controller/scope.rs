//! Transient systemd user scope failure domain for run supervisors.
//!
//! On Linux, every run supervisor starts detached in its own transient systemd user scope
//! (`fgos-run-<attemptId>`) with `OOMPolicy=stop` and an optional `MemoryMax`. Where no user
//! manager is reachable (or on non-Linux systems), the attempt inherits its starter's cgroup and
//! records `failureDomain: {kind: "inherited", reason}`.

use serde::{Deserialize, Serialize};
use std::path::Path;

/// The failure domain of a supervised attempt.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "kind")]
pub enum FailureDomain {
    #[serde(rename = "systemd-scope")]
    SystemdScope { unit: String },
    #[serde(rename = "inherited")]
    Inherited { reason: String },
}

impl FailureDomain {
    pub fn unit(&self) -> Option<&str> {
        match self {
            FailureDomain::SystemdScope { unit } => Some(unit),
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

/// Decide the failure domain given explicit environmental probe flags.
pub fn decide_failure_domain_with(
    attempt_id: &str,
    is_linux: bool,
    user_manager_reachable: bool,
    systemd_run_on_path: bool,
) -> FailureDomain {
    if !is_linux {
        return FailureDomain::Inherited {
            reason: "not-linux".to_string(),
        };
    }
    if !user_manager_reachable {
        return FailureDomain::Inherited {
            reason: "no-user-manager".to_string(),
        };
    }
    if !systemd_run_on_path {
        return FailureDomain::Inherited {
            reason: "no-systemd-run".to_string(),
        };
    }
    FailureDomain::SystemdScope {
        unit: scope_unit_name(attempt_id),
    }
}

/// Check if a user manager is reachable on this machine.
/// Linux only: `XDG_RUNTIME_DIR/systemd/private` (or the user bus) exists.
pub fn is_user_manager_reachable() -> bool {
    if let Ok(runtime_dir) = std::env::var("XDG_RUNTIME_DIR") {
        if !runtime_dir.is_empty() {
            let p = Path::new(&runtime_dir);
            if p.join("systemd/private").exists() || p.join("bus").exists() {
                return true;
            }
        }
    }
    false
}

/// Check if `systemd-run` is on PATH.
pub fn is_systemd_run_on_path() -> bool {
    if let Ok(path_var) = std::env::var("PATH") {
        for dir in std::env::split_paths(&path_var) {
            let candidate = dir.join("systemd-run");
            #[cfg(unix)]
            {
                use std::os::unix::fs::PermissionsExt;
                if candidate.is_file() {
                    if let Ok(meta) = candidate.metadata() {
                        if meta.permissions().mode() & 0o111 != 0 {
                            return true;
                        }
                    }
                }
            }
            #[cfg(not(unix))]
            {
                if candidate.is_file() {
                    return true;
                }
            }
        }
    }
    false
}

/// Decide the failure domain for one launch.
pub fn decide_failure_domain(attempt_id: &str) -> FailureDomain {
    #[cfg(target_os = "linux")]
    {
        decide_failure_domain_with(
            attempt_id,
            true,
            is_user_manager_reachable(),
            is_systemd_run_on_path(),
        )
    }
    #[cfg(not(target_os = "linux"))]
    {
        decide_failure_domain_with(attempt_id, false, false, false)
    }
}

/// Build the wrapped command: unit name `fgos-run-<attemptId>`,
/// `--scope --collect --user -p OOMPolicy=stop`, and `-p MemoryMax=<cap>` only when set.
/// Pure command builder: independent of systemd availability.
pub fn build_scope_command(
    unit: &str,
    memory_max: Option<&str>,
    command: &[String],
) -> Vec<String> {
    let mut out = vec![
        "systemd-run".to_string(),
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
        assert_eq!(
            decide_failure_domain_with("att-1", false, true, true),
            FailureDomain::Inherited {
                reason: "not-linux".to_string()
            }
        );
        assert_eq!(
            decide_failure_domain_with("att-1", true, false, true),
            FailureDomain::Inherited {
                reason: "no-user-manager".to_string()
            }
        );
        assert_eq!(
            decide_failure_domain_with("att-1", true, true, false),
            FailureDomain::Inherited {
                reason: "no-systemd-run".to_string()
            }
        );
        assert_eq!(
            decide_failure_domain_with("att-1", true, true, true),
            FailureDomain::SystemdScope {
                unit: "fgos-run-att-1".to_string()
            }
        );
    }

    #[test]
    fn build_scope_command_shapes() {
        let base_cmd = vec![
            "/bin/fgos".to_string(),
            "internal".to_string(),
            "supervise".to_string(),
        ];
        let plain = build_scope_command("fgos-run-att-1", None, &base_cmd);
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

        let with_cap = build_scope_command("fgos-run-att-1", Some("8G"), &base_cmd);
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

        let with_empty = build_scope_command("fgos-run-att-1", Some(""), &base_cmd);
        assert_eq!(with_empty, plain);
    }
}
