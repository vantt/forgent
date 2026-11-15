//! The doctor rows over the config files: one row per row of the config crate's contract and one fix per fix of
//! it. The crate's findings engine decides what is wrong and how severe it is; this adapter maps a finding to
//! the report's `{ passed, message }` and a repair to `{ changed, message }`, and never copies a value of a file
//! (a finding carries none).

#[cfg(unix)]
use super::CONFIG_ROWS_JSON;
#[cfg(unix)]
use fgos_config::doctor::{Consumer, Finding, Severity};
use fgos_distribution::doctor::{FixResult, RowOutcome, RowResult};
#[cfg(unix)]
use serde_json::Value;
use std::path::Path;

/// The row the contract calls `config-machine-files` keeps the id the gateway token row has always had.
#[cfg(unix)]
const MACHINE_FILES_ROW: &str = "config-machine-files";
const MACHINE_FILES_FIX: &str = "create-machine-files";
const TOKEN_ID: &str = "gateway-token-configured";

pub const ROW_IDS: &[&str] = &[
    "config-parse",
    "config-schema",
    "config-legacy-shadowed",
    "config-format-legacy-json",
    "config-doc-drift",
    "config-comment-missing-doc",
    "config-comment-missing-why",
    "config-comment-migrated-why",
    "config-unknown-key",
    "config-redundant-value",
    "config-key-in-wrong-file",
    "config-global-permissions",
    "config-secret-outside-private",
    "config-migrate-backup-stale",
    TOKEN_ID,
];

pub const FIX_IDS: &[&str] = &[
    "config-refresh-docs",
    "config-remove-redundant",
    "config-chmod",
    "config-move-under-private",
    "config-copy-to-destination",
    TOKEN_ID,
];

/// The adapter the doctor registers for the config rows and fixes.
pub const GROUP: super::Rows = super::Rows {
    rows: ROW_IDS,
    fixes: FIX_IDS,
    judge: judge_rows,
    fix: run_fixes,
};

/// The contract's own row id and description for a doctor row id.
#[cfg(unix)]
fn contract_row(id: &str) -> Option<(String, String)> {
    let contract: Value = serde_json::from_str(CONFIG_ROWS_JSON).ok()?;
    let wanted = if id == TOKEN_ID {
        MACHINE_FILES_ROW
    } else {
        id
    };
    contract["rows"]
        .as_array()?
        .iter()
        .find(|row| row["id"] == wanted)
        .map(|row| {
            (
                wanted.to_owned(),
                row["description"].as_str().unwrap_or_default().to_owned(),
            )
        })
}

/// `file:line:column row path (detail)`, each part only when it exists; never a value.
#[cfg(unix)]
fn describe(finding: &Finding) -> String {
    let file = finding
        .file
        .as_deref()
        .map(|file| match (finding.line, finding.column) {
            (Some(line), Some(column)) => format!("{file}:{line}:{column}"),
            _ => file.to_owned(),
        });
    let detail = (!finding.detail.is_empty()).then(|| format!("({})", finding.detail));
    [
        file,
        Some(finding.row.to_owned()),
        finding.path.clone(),
        detail,
    ]
    .into_iter()
    .flatten()
    .filter(|part| !part.is_empty())
    .collect::<Vec<_>>()
    .join(" ")
}

/// What the findings of one row say: a failing one fails the row with the contract's description in front, a
/// warning only warns, no finding passes.
#[cfg(unix)]
fn map_findings(findings: &[&Finding], description: &str) -> RowResult {
    let verdict = |passed: bool, message: String| RowResult {
        passed,
        status: None,
        message: Some(message),
        fix_command: None,
        detail: None,
    };
    if findings.is_empty() {
        return verdict(true, "no finding".into());
    }
    let failing: Vec<&&Finding> = findings
        .iter()
        .filter(|finding| finding.severity(Consumer::Doctor) == Severity::Fail)
        .collect();
    let shown: Vec<String> = if failing.is_empty() {
        findings.iter().map(|finding| describe(finding)).collect()
    } else {
        failing.iter().map(|finding| describe(finding)).collect()
    };
    let lines = shown.join("; ");
    let repair = if findings.iter().any(|finding| finding.fix.is_some()) {
        " -- fgos doctor --fix repairs it"
    } else {
        ""
    };
    if failing.is_empty() {
        verdict(true, format!("warning: {lines}{repair}"))
    } else {
        verdict(false, format!("{description} {lines}{repair}"))
    }
}

/// The rows `ids` over one read of the findings, or over the reason there are none (every row then fails with it,
/// as each asked the same refused read).
#[cfg(unix)]
fn rows_from(findings: &Result<Vec<Finding>, String>, ids: &[&str]) -> Vec<RowOutcome> {
    ids.iter()
        .map(|id| {
            let result = match (findings, contract_row(id)) {
                (Err(why), _) => RowResult {
                    passed: false,
                    status: None,
                    message: Some(why.clone()),
                    fix_command: None,
                    detail: None,
                },
                (Ok(findings), Some((row, description))) => {
                    let own: Vec<&Finding> = findings.iter().filter(|f| f.row == row).collect();
                    map_findings(&own, &description)
                }
                (Ok(_), None) => {
                    return RowOutcome::Unavailable {
                        message: format!("the config contract has no row {id}"),
                        next: "run fgos doctor again".to_owned(),
                    }
                }
            };
            RowOutcome::Judged(result)
        })
        .collect()
}

#[cfg(unix)]
mod door {
    use fgos_config::detect::PathDetectors;
    use fgos_config::doctor::{check, Finding};
    use fgos_config::repair::fix_with_roots;
    use fgos_config::snapshot::{Context, SnapshotError, SnapshotRequest};
    use fgos_config::{machine, provider};
    use std::path::Path;
    use std::time::SystemTime;

    /// The roots of `root` and the shared context, handed to `use_them`.
    pub fn with_roots<T>(
        root: &Path,
        use_them: impl FnOnce(&Context, &SnapshotRequest) -> T,
    ) -> Result<T, String> {
        let detectors = PathDetectors {
            path: std::env::var_os("PATH"),
        };
        let ctx = machine::context(&detectors).map_err(|refusal| refusal.to_string())?;
        if let Some(refusal) = super::super::project_root_refusal(root) {
            return Err(refusal.to_owned());
        }
        let roots = provider::roots(root).map_err(|refusal| match refusal.reason {
            // The words the Node door gave the same refusal.
            "git-read-failed" => format!("config-trusted-root-unresolved ({})", refusal.detail),
            _ => refusal.detail,
        })?;
        Ok(use_them(&ctx, &roots))
    }

    pub fn findings(ctx: &Context, roots: &SnapshotRequest) -> Vec<Finding> {
        check(ctx, roots, SystemTime::now())
    }

    /// One repair; how many changes it made, or why it could not run.
    pub fn repair(ctx: &Context, roots: &SnapshotRequest, fix: &str) -> Result<usize, String> {
        let writer = fgos_identity::resolve_current(None);
        fix_with_roots(ctx, roots, &writer, &[fix], false)
            .map(|report| report.applied.len())
            .map_err(|error| match error {
                SnapshotError::Refused(all) => all
                    .iter()
                    .map(ToString::to_string)
                    .collect::<Vec<_>>()
                    .join("; "),
                SnapshotError::Io(io) => format!("config-io ({:?})", io.kind()),
            })
    }
}

/// The findings and the repairs need the write door, which is Unix only.
#[cfg(not(unix))]
const UNSUPPORTED: &str = "config-platform-unsupported (write)";

/// Judges the config rows `ids` of the project at `root`: one read of the config files serves them all.
pub fn judge_rows(root: &Path, ids: &[&str]) -> Vec<RowOutcome> {
    #[cfg(unix)]
    let findings = door::with_roots(root, door::findings);
    #[cfg(unix)]
    return rows_from(&findings, ids);
    #[cfg(not(unix))]
    {
        let _ = root;
        ids.iter()
            .map(|_| {
                RowOutcome::Judged(RowResult {
                    passed: false,
                    status: None,
                    message: Some(UNSUPPORTED.to_owned()),
                    fix_command: None,
                    detail: None,
                })
            })
            .collect()
    }
}

/// Runs the config fixes `ids` in the order given; a fix that cannot run (a confined session, a refused file)
/// repairs nothing and says why.
pub fn run_fixes(root: &Path, ids: &[&str]) -> Vec<FixResult> {
    ids.iter()
        .map(|id| {
            let fix = if *id == TOKEN_ID {
                MACHINE_FILES_FIX
            } else {
                id.strip_prefix("config-").unwrap_or(id)
            };
            #[cfg(unix)]
            let outcome = door::with_roots(root, |ctx, roots| door::repair(ctx, roots, fix))
                .and_then(|done| done);
            #[cfg(not(unix))]
            let outcome: Result<usize, String> = {
                let _ = (root, fix);
                Err(UNSUPPORTED.to_owned())
            };
            match outcome {
                Ok(changed) => FixResult::done(id, changed > 0, format!("{changed} repaired")),
                Err(why) => FixResult::done(id, false, why),
            }
        })
        .collect()
}

#[cfg(all(test, unix))]
mod tests {
    use super::*;
    use fgos_config::snapshot::{SessionClass, SnapshotRequest};
    use std::fs;
    use std::path::PathBuf;

    fn world(tag: &str) -> (PathBuf, SnapshotRequest) {
        let base =
            std::env::temp_dir().join(format!("fgos-doctor-config-{tag}-{}", std::process::id()));
        let _ = fs::remove_dir_all(&base);
        let project = base.join("project");
        let home = base.join("home").join(".fgos");
        fs::create_dir_all(project.join(".fgos")).unwrap();
        fs::create_dir_all(&home).unwrap();
        let roots = SnapshotRequest {
            project_root: project.clone(),
            trusted_root: project,
            global_dir: home,
            class: SessionClass::Unconfined,
        };
        (base, roots)
    }

    fn judged(roots: &SnapshotRequest) -> Vec<(String, RowResult)> {
        let detectors = fgos_config::detect::NoDetectors;
        let ctx = fgos_config::machine::context(&detectors).unwrap();
        let findings = Ok(door::findings(&ctx, roots));
        rows_from(&findings, ROW_IDS)
            .into_iter()
            .zip(ROW_IDS)
            .map(|(outcome, id)| match outcome {
                RowOutcome::Judged(result) => ((*id).to_owned(), result),
                RowOutcome::Unavailable { message, .. } => panic!("{id}: {message}"),
            })
            .collect()
    }

    fn row<'a>(rows: &'a [(String, RowResult)], id: &str) -> &'a RowResult {
        &rows.iter().find(|(row, _)| row == id).unwrap().1
    }

    #[test]
    fn the_adapter_has_exactly_the_rows_and_fixes_of_the_contract_under_the_ids_the_registry_gives()
    {
        let contract: Value = serde_json::from_str(CONFIG_ROWS_JSON).unwrap();
        let rows: Vec<String> = contract["rows"]
            .as_array()
            .unwrap()
            .iter()
            .map(|row| match row["id"].as_str().unwrap() {
                MACHINE_FILES_ROW => TOKEN_ID.to_owned(),
                other => other.to_owned(),
            })
            .collect();
        assert_eq!(rows, ROW_IDS);
        let fixes: Vec<String> = contract["fixes"]
            .as_array()
            .unwrap()
            .iter()
            .map(|fix| match fix.as_str().unwrap() {
                MACHINE_FILES_FIX => TOKEN_ID.to_owned(),
                other => format!("config-{other}"),
            })
            .collect();
        assert_eq!(fixes, FIX_IDS);
        for id in ROW_IDS {
            assert!(contract_row(id).is_some(), "{id}");
        }
    }

    #[test]
    fn a_warning_finding_passes_with_a_warning_prefix_and_a_failing_one_fails_naming_file_position_and_row(
    ) {
        let (base, roots) = world("map");
        fs::write(
            roots.project_root.join(".fgos/config.yaml"),
            "# @fgos:v1\nunknownKey: 1\n",
        )
        .unwrap();
        let rows = judged(&roots);
        let unknown = row(&rows, "config-unknown-key");
        assert!(unknown.passed);
        let message = unknown.message.as_deref().unwrap();
        assert!(
            message.starts_with("warning: ") && message.contains("config-unknown-key"),
            "{message}"
        );
        assert!(
            message.contains("config.yaml:2:1") || message.contains("config.yaml:"),
            "{message}"
        );

        fs::write(
            roots.project_root.join(".fgos/config.yaml"),
            "# @fgos:v1\nrunner: [\n",
        )
        .unwrap();
        let rows = judged(&roots);
        let broken = row(&rows, "config-parse");
        assert!(!broken.passed);
        assert!(broken.message.as_deref().unwrap().contains("config-parse"));
        let _ = fs::remove_dir_all(base);
    }

    #[test]
    fn every_runner_key_a_past_release_retired_is_an_unknown_key_whichever_file_carries_it() {
        let retired = serde_json::json!({
            "runner": {
                "models": { "light": "haiku" },
                "DEFAULT_TIER_TO_POLICY": {},
                "QUALITY_TIER_BRIDGE": {},
                "QUALITY_MODE_VALUES": [],
                "minTier": "standard",
                "minRigor": "standard",
                "rigorOverrides": { "low": "standard" },
                "PLACEMENT_POLICY_SHADOW": true,
                "rigorToTier": { "low": "nano" },
                "executors": { "agent": { "rigorOverrides": {}, "models": {} } },
                "capabilities": { "code:review": { "overrides": { "tier": "standard" }, "rigorOverrides": {}, "minTier": "standard", "minRigor": "standard" } }
            }
        });
        let paths = [
            "runner.models",
            "runner.DEFAULT_TIER_TO_POLICY",
            "runner.QUALITY_TIER_BRIDGE",
            "runner.QUALITY_MODE_VALUES",
            "runner.minTier",
            "runner.minRigor",
            "runner.rigorOverrides",
            "runner.PLACEMENT_POLICY_SHADOW",
            "runner.rigorToTier",
            "runner.executors.agent.rigorOverrides",
            "runner.executors.agent.models",
            "runner.capabilities.code:review.overrides",
            "runner.capabilities.code:review.rigorOverrides",
            "runner.capabilities.code:review.minTier",
            "runner.capabilities.code:review.minRigor",
        ];
        let text = format!("# @fgos:v1\n\n{retired}\n");
        for (tag, file) in [("retired-project", false), ("retired-global", true)] {
            let (base, roots) = world(tag);
            let target = if file {
                roots.global_dir.clone()
            } else {
                roots.project_root.join(".fgos")
            };
            fs::write(target.join("config.yaml"), &text).unwrap();
            let rows = judged(&roots);
            let message = row(&rows, "config-unknown-key").message.clone().unwrap();
            for key in paths {
                assert!(
                    message.contains(&format!("config-unknown-key {key} ")),
                    "{tag}: {key} is not reported as unknown: {message}"
                );
            }
            let _ = fs::remove_dir_all(base);
        }
    }

    #[test]
    fn no_row_message_carries_a_value_of_a_config_file() {
        let (base, roots) = world("secret");
        fs::write(
            roots.project_root.join(".fgos/config.yaml"),
            "# @fgos:v1\ngateway:\n  token: SENTINEL-9931\nunknownKey: SENTINEL-9931\n",
        )
        .unwrap();
        let rows = judged(&roots);
        assert!(
            rows.iter().any(|(_, result)| !result.passed),
            "the fixture must trip a failing row"
        );
        let all: String = rows
            .iter()
            .map(|(_, result)| result.message.clone().unwrap_or_default())
            .collect();
        assert!(!all.contains("SENTINEL-9931"));
        let _ = fs::remove_dir_all(base);
    }

    #[test]
    fn a_refused_read_fails_every_row_with_its_reason() {
        let outcomes = rows_from(&Err("config-io (HomeUnset)".into()), ROW_IDS);
        assert_eq!(outcomes.len(), ROW_IDS.len());
        for outcome in outcomes {
            match outcome {
                RowOutcome::Judged(result) => {
                    assert!(!result.passed);
                    assert_eq!(result.message.as_deref(), Some("config-io (HomeUnset)"));
                }
                RowOutcome::Unavailable { .. } => panic!("a refused read is a failed row"),
            }
        }
    }

    #[test]
    fn the_permission_fix_repairs_a_loose_global_directory_once_and_a_second_run_changes_nothing() {
        use std::os::unix::fs::PermissionsExt;
        let (base, roots) = world("chmod");
        fs::write(roots.global_dir.join("config.yaml"), "# @fgos:v1\n").unwrap();
        fs::set_permissions(
            roots.global_dir.join("config.yaml"),
            fs::Permissions::from_mode(0o666),
        )
        .unwrap();
        let detectors = fgos_config::detect::NoDetectors;
        let ctx = fgos_config::machine::context(&detectors).unwrap();
        let first = door::repair(&ctx, &roots, "chmod").unwrap();
        assert!(first > 0);
        assert_eq!(door::repair(&ctx, &roots, "chmod").unwrap(), 0);
        let _ = fs::remove_dir_all(base);
    }

    #[test]
    fn a_confined_session_repairs_nothing_and_says_why() {
        let (base, mut roots) = world("confined");
        roots.class = SessionClass::Confined;
        let detectors = fgos_config::detect::NoDetectors;
        let ctx = fgos_config::machine::context(&detectors).unwrap();
        let why = door::repair(&ctx, &roots, "chmod").unwrap_err();
        assert!(why.contains("config-write-confined"), "{why}");
        let _ = fs::remove_dir_all(base);
    }
}
