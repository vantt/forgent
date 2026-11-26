//! The rotation handoff as a start-context contributor (docs/platform/agent-start-context/spec.md, the live door): a
//! rotation successor reads the latest handoff of its lineage once, at the end of its opening, whatever its agent CLI.

use std::collections::BTreeMap;
use std::path::PathBuf;
use std::time::Duration;

use fgos_agent_start_context::{Contributor, ContributorError};

use super::handoff::{read_latest, session_start_context};

/// The contributor's row id in `packages/agent-start-context/contracts/start-contributors.v1.json`.
pub const HANDOFF_CONTRIBUTOR: &str = "rotation-handoff";

/// The handoff of one head lineage (`lineage_dir(fgos_dir, persona, name)`).
pub struct HandoffContributor {
    pub lineage: PathBuf,
    /// The project root, so a handoff too long to show is named by its path relative to it.
    pub project_root: Option<PathBuf>,
}

impl Contributor for HandoffContributor {
    /// The latest handoff, bounded as a session start shows it, for a start whose lifecycle is a rotation; nothing for
    /// any other start or a lineage with no handoff. An unreadable lineage fails, and the start goes on without it.
    fn contribute(
        &self,
        facts: &BTreeMap<String, String>,
        _timeout: Duration,
    ) -> Result<Option<String>, ContributorError> {
        if facts.get("agentLifecycle").map(String::as_str) != Some("rotate") {
            return Ok(None);
        }
        match read_latest(&self.lineage) {
            Ok(Some(latest)) => Ok(Some(session_start_context(
                &latest,
                self.project_root.as_deref(),
            ))),
            Ok(None) => Ok(None),
            Err(e) => Err(ContributorError::Failed(e.to_string())),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn lineage(tag: &str, handoff: Option<&str>) -> PathBuf {
        let d = std::env::temp_dir().join(format!("rot-contributor-{}-{tag}", std::process::id()));
        let _ = std::fs::remove_dir_all(&d);
        std::fs::create_dir_all(&d).unwrap();
        if let Some(text) = handoff {
            std::fs::write(d.join("261127-0500-abcd1234.md"), text).unwrap();
            std::fs::write(d.join("latest.json"), "{\"file\":\"261127-0500-abcd1234.md\",\"session\":\"s\",\"rotate\":\"soft\",\"writtenAt\":\"2026-11-27T00:00:00.000Z\"}\n").unwrap();
        }
        d
    }

    fn facts(lifecycle: &str) -> BTreeMap<String, String> {
        [("sessionType", "head"), ("agentLifecycle", lifecycle)]
            .into_iter()
            .map(|(k, v)| (k.to_owned(), v.to_owned()))
            .collect()
    }

    #[test]
    fn a_rotation_successor_gets_its_lineage_handoff_and_a_fresh_start_or_an_empty_lineage_gets_none(
    ) {
        let with = HandoffContributor {
            lineage: lineage("with", Some("# Handoff\nbody\n")),
            project_root: None,
        };
        let wait = Duration::from_secs(1);
        assert_eq!(
            with.contribute(&facts("rotate"), wait),
            Ok(Some("# Handoff\nbody\n".to_owned()))
        );
        assert_eq!(with.contribute(&facts("start"), wait), Ok(None));
        let without = HandoffContributor {
            lineage: lineage("without", None),
            project_root: None,
        };
        assert_eq!(without.contribute(&facts("rotate"), wait), Ok(None));
    }
}
