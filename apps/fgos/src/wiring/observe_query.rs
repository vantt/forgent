//! The composition root's side of `fgos metrics record|query`: the declarations the binary embeds, the record
//! sources it can reach, and the config door that resolves a definition's `configKey` parameters. Observe never
//! reads config; it asks this environment.

use super::observe_declarations::embedded_declarations;
use fgos_observe::metrics_cli::RecordEnvironment;
use fgos_observe::record::registry::EmbeddedDeclaration;
use fgos_observe::sources::claude_transcripts::ClaudeTranscriptsSource;
use fgos_observe::RecordSource;
use serde_json::Value;
use std::path::{Path, PathBuf};

pub struct HostRecordEnvironment;

impl RecordEnvironment for HostRecordEnvironment {
    fn embedded_declarations(&self) -> Vec<EmbeddedDeclaration> {
        embedded_declarations()
    }

    fn payload_root(&self) -> Option<PathBuf> {
        None
    }

    fn record_sources(&self) -> Vec<Box<dyn RecordSource>> {
        vec![Box::new(ClaudeTranscriptsSource::new())]
    }

    fn config_number(&self, root: &Path, key: &str) -> Result<Option<f64>, String> {
        let value = fgos_config::provider::effective_value(root, key)
            .map_err(|refusal| format!("{}: {}", refusal.reason, refusal.detail))?;
        value.as_ref().map(number).transpose()
    }
}

fn number(value: &Value) -> Result<f64, String> {
    value
        .as_f64()
        .ok_or_else(|| format!("expected a number, found {value}"))
}

/// Hands the environment to the verbs. The first install wins; a second is ignored.
#[allow(dead_code)] // `main` calls it where it builds the Observe wiring.
pub fn install() -> bool {
    fgos_observe::metrics_cli::install_environment(Box::new(HostRecordEnvironment))
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn a_config_value_is_read_as_a_number_and_anything_else_is_named() {
        assert_eq!(number(&json!(60)).unwrap(), 60.0);
        assert_eq!(number(&json!(0.5)).unwrap(), 0.5);
        assert!(number(&json!("sixty"))
            .unwrap_err()
            .contains("expected a number"));
    }

    #[test]
    fn the_host_environment_embeds_the_same_declarations_the_registry_merges() {
        let names: Vec<&str> = HostRecordEnvironment
            .embedded_declarations()
            .iter()
            .map(|d| d.label)
            .collect();
        assert_eq!(names, ["fgos-observe-health", "fgos-observe-transcripts"]);
    }
}
