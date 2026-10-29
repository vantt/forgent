//! The mailbox section of a project's config, for the hook kind and the
//! verbs alike: the effective `mailbox` section of one Config snapshot
//! (project over global over the bundled standard), checked by the mailbox's
//! own loader, or why it could not be had. The reason is a fixed word,
//! `config:<code>`, which the hook leaves in its outcome file and `status`
//! reports, so a config the mailbox cannot read is never silent. A snapshot
//! Config refuses keeps Config's own code (`config:config-schema` and the
//! like), and no value of the section is used past it: the mailbox never
//! reads a config file itself.
//!
//! The snapshot is taken with the main checkout the mailbox already resolved
//! as both the project and the trusted root (the mailbox reads only the main
//! checkout's `.fgos`), so a hook call does not ask the Git driver for it
//! again: that question costs a sandboxed Git process per step, paid on every
//! tool call.
use fgos_config::detect::NoDetectors;
use fgos_config::schema::Schemas;
use fgos_config::session::session_class;
use fgos_config::snapshot::{snapshot, Context, SnapshotError, SnapshotRequest};
use fgos_config::standard::Standard;
use fgos_mailbox::limits::{load, LimitsError, Loaded};
use serde_json::{json, Value};
use std::path::Path;

/// The config path of the section the mailbox reads.
const SECTION: &str = "mailbox";

/// A mailbox config that could not be read.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ConfigFailure {
    /// The Config door refused the read as a whole; `code` is its own
    /// refusal code and `detail` its lines.
    Refused { code: &'static str, detail: String },
    /// The door gave a section the mailbox's loader refused.
    Invalid(LimitsError),
}

impl ConfigFailure {
    /// The fixed word the hook outcome and `status` name this failure by.
    pub fn reason(&self) -> String {
        match self {
            Self::Refused { code, .. } => format!("config:{code}"),
            Self::Invalid(error) => format!("config:{}", error.code()),
        }
    }

    /// A sentence for a person.
    pub fn detail(&self) -> String {
        match self {
            Self::Refused { detail, .. } => detail.clone(),
            Self::Invalid(error) => error.to_string(),
        }
    }
}

/// Whether `reason` is one [`project_limits`] gives.
pub fn is_config_reason(reason: &str) -> bool {
    reason.starts_with("config:")
}

/// What the host wiring reads past the mailbox crates' limits (the contract's
/// `host` readers): whether mail crosses machines at all, the trust it takes
/// from another machine, and the Event Store's sync schedule the detached
/// child follows.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CrossMachine {
    pub enabled: bool,
    pub require_confirmed: bool,
    /// `eventStore.remote`; the Event Store's own default when unset.
    pub remote: String,
    /// `eventStore.sync.intervalSec`; 0 turns the scheduled sync off.
    pub sync_interval_sec: u64,
}

impl CrossMachine {
    /// Every value comes from the snapshot, whose bundled standard layer holds
    /// each key: a missing or mistyped one is a refusal, never a default here.
    fn read(snapshot: &Value) -> Result<Self, ConfigFailure> {
        let refused = |path: &[&str], what: &str| ConfigFailure::Refused {
            code: "config-schema",
            detail: format!("{} is not {what}", path.join(".")),
        };
        let at = |path: &[&str]| path.iter().try_fold(snapshot, |value, name| value.get(*name));
        let flag = |path: &[&str]| at(path).and_then(Value::as_bool).ok_or_else(|| refused(path, "a boolean"));
        let remote = ["eventStore", "remote"];
        let interval = ["eventStore", "sync", "intervalSec"];
        Ok(Self {
            enabled: flag(&["mailbox", "crossMachine", "enabled"])?,
            require_confirmed: flag(&["mailbox", "remote", "requireConfirmed"])?,
            remote: at(&remote).and_then(Value::as_str).ok_or_else(|| refused(&remote, "text"))?.to_owned(),
            sync_interval_sec: at(&interval).and_then(Value::as_u64).ok_or_else(|| refused(&interval, "a whole number"))?,
        })
    }
}

/// The mailbox limits of the project whose main checkout's `.fgos` is `fgos_dir`.
pub fn project_limits(fgos_dir: &Path) -> Result<Loaded, ConfigFailure> {
    project_mailbox(fgos_dir).map(|(loaded, _)| loaded)
}

/// The limits and the cross-machine settings of one snapshot of the project.
pub fn project_mailbox(fgos_dir: &Path) -> Result<(Loaded, CrossMachine), ConfigFailure> {
    let snapshot = effective_snapshot(fgos_dir)?;
    let cross = CrossMachine::read(&snapshot)?;
    let config = snapshot.get(SECTION).cloned().map(|section| json!({ SECTION: section }));
    let loaded = load(config.as_ref()).map_err(ConfigFailure::Invalid)?;
    Ok((loaded, cross))
}

/// The effective config of one snapshot of the project whose main checkout's
/// `.fgos` is `fgos_dir` (project over global over the bundled standard).
fn effective_snapshot(fgos_dir: &Path) -> Result<Value, ConfigFailure> {
    let refused = |code: &'static str, detail: String| ConfigFailure::Refused { code, detail };
    let home = std::env::var_os("HOME")
        .filter(|home| !home.is_empty())
        .ok_or_else(|| {
            refused(
                "home-unset",
                "HOME is not set; the global directory is ~/.fgos".into(),
            )
        })?;
    let main = fgos_dir.parent().unwrap_or(fgos_dir);
    let root = std::fs::canonicalize(main).map_err(|e| {
        refused(
            "project-root-unreadable",
            format!("{}: {e}", main.display()),
        )
    })?;
    let (schemas, digest) = Schemas::bundled().map_err(|e| from_snapshot(e.into()))?;
    let standard = Standard::bundled(&schemas).map_err(|e| from_snapshot(e.into()))?;
    let ctx = Context {
        schemas: &schemas,
        standard: &standard,
        digest: &digest,
        detectors: &NoDetectors,
    };
    let request = SnapshotRequest {
        project_root: root.clone(),
        trusted_root: root,
        global_dir: Path::new(&home).join(".fgos"),
        class: session_class(|key| std::env::var(key).ok()),
    };
    let snap = snapshot(&ctx, &request).map_err(from_snapshot)?;
    Ok(snap.value)
}

/// A refused snapshot as the mailbox names it: the first refusal's code, every
/// refusal one line (id, file, path, position; never a value).
fn from_snapshot(error: SnapshotError) -> ConfigFailure {
    match error {
        SnapshotError::Refused(list) => ConfigFailure::Refused {
            code: list.first().map_or("config-refused", |r| r.code),
            detail: list
                .iter()
                .map(ToString::to_string)
                .collect::<Vec<_>>()
                .join("\n"),
        },
        SnapshotError::Io(error) => ConfigFailure::Refused {
            code: "config-io",
            detail: error.to_string(),
        },
    }
}

#[cfg(test)]
mod tests {
    use super::CrossMachine;
    use fgos_config::schema::Schemas;
    use fgos_config::standard::Standard;
    use serde_json::Value;

    /// The limits contract keeps each key's reader, unit and meaning, and
    /// the values the mailbox crates' own tests start from; the bundled
    /// standard is the layer every project reads. They must hold the same
    /// value for every key a reader takes.
    #[test]
    fn the_bundled_standard_holds_the_limits_contract_value_of_every_key_a_reader_takes() {
        let (schemas, _) = Schemas::bundled().unwrap();
        let standard = Standard::bundled(&schemas).unwrap();
        let contract: Value = serde_json::from_str(include_str!(
            "../../../../packages/mailbox/contracts/limits.v1.json"
        ))
        .unwrap();
        let mut checked = 0;
        for entry in contract["keys"].as_array().unwrap() {
            let key = entry["key"].as_str().unwrap();
            let pointer = format!("/{}", key.replace('.', "/"));
            let held = standard.value().pointer(&pointer);
            if entry["reader"] == "harness" {
                assert_eq!(held, None, "{key}: no runtime reads a harness key");
                continue;
            }
            assert_eq!(held, Some(&entry["default"]), "{key}");
            checked += 1;
        }
        assert!(checked > 20, "only {checked} keys checked");
    }

    /// What the snapshot says is read as it is; a key it lacks or holds in
    /// the wrong type is refused instead of guessed.
    #[test]
    fn the_cross_machine_settings_are_read_from_the_snapshot_and_a_missing_or_mistyped_key_is_refused() {
        let snapshot = |enabled: Value, interval: Value| {
            serde_json::json!({
                "mailbox": { "crossMachine": { "enabled": enabled }, "remote": { "requireConfirmed": true } },
                "eventStore": { "remote": "upstream", "sync": { "intervalSec": interval } },
            })
        };
        assert_eq!(
            CrossMachine::read(&snapshot(true.into(), 0.into())),
            Ok(CrossMachine { enabled: true, require_confirmed: true, remote: "upstream".into(), sync_interval_sec: 0 })
        );
        for bad in [snapshot("yes".into(), 300.into()), snapshot(true.into(), "soon".into()), serde_json::json!({})] {
            assert!(CrossMachine::read(&bad).is_err(), "{bad}");
        }
    }
}
