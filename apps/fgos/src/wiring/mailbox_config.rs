//! The mailbox section of a project's config, for the hook kind and the
//! verbs alike: the limits contract's defaults under the project's
//! `config.json` overrides, or why they could not be read. The reason is a
//! fixed word, `config:<code>`, which the hook leaves in its outcome file and
//! `status` reports, so a config the mailbox cannot read is never silent.
//! A `config.json` that `fgos config migrate` replaced by its tombstone is
//! named `config:migrated`, recognised by the Config crate's own rule; the
//! mailbox reads `config.yaml` only once it moves to the Config reader.
use fgos_mailbox::limits::{load, read_project_config, LimitsError, Loaded};
use std::path::Path;

/// A mailbox config that could not be read: the reason word and a sentence for a person.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ConfigFailure {
    pub reason: String,
    pub detail: String,
}

/// Whether `reason` is one [`project_limits`] gives.
pub fn is_config_reason(reason: &str) -> bool {
    reason.starts_with("config:")
}

/// The mailbox limits of the project whose `.fgos` is `fgos_dir`.
pub fn project_limits(fgos_dir: &Path) -> Result<Loaded, ConfigFailure> {
    let failure = |e: LimitsError| ConfigFailure {
        reason: format!("config:{}", e.code()),
        detail: e.to_string(),
    };
    let defaults = load(None).map_err(failure)?;
    let config = match read_project_config(fgos_dir, defaults.hook.hook.max_read_bytes) {
        Ok(config) => config,
        Err(_) if migrated(fgos_dir, defaults.hook.hook.max_read_bytes) => {
            return Err(ConfigFailure {
                reason: "config:migrated".to_string(),
                detail: "the project's config.json was migrated to config.yaml, which the mailbox does not read yet; its settings are not applied".to_string(),
            })
        }
        Err(e) => return Err(failure(e)),
    };
    load(config.as_ref()).map_err(failure)
}

/// Whether the project's `config.json` is the migration tombstone.
fn migrated(fgos_dir: &Path, max_bytes: u64) -> bool {
    fgos_mailbox::record::read_regular_capped(&fgos_dir.join("config.json"), max_bytes)
        .is_ok_and(|bytes| fgos_config::files::is_tombstone(&bytes))
}
