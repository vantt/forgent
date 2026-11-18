//! The composition root's side of `fgos metrics record|query`: the declarations the binary embeds, the record
//! sources it can reach, and the config door that resolves a definition's `configKey` parameters. Observe never
//! reads config; it asks this environment.

use super::agents::PayloadRoot;
use super::observe_declarations::embedded_declarations;
use fgos_observe::metrics_cli::RecordEnvironment;
use fgos_observe::record::registry::EmbeddedDeclaration;
use fgos_observe::sources::claude_transcripts::ClaudeTranscriptsSource;
use fgos_observe::RecordSource;
use fgos_run_result::RunProjectionSource;
use serde_json::Value;
use std::path::{Path, PathBuf};

/// The active release's payload tree (`core/**/observe/kinds`, `domains/**/observe/kinds`) is found through the
/// one payload resolver the composition root hands in, never PATH or cwd.
pub struct HostRecordEnvironment {
    pub payload_root: PayloadRoot,
}

impl RecordEnvironment for HostRecordEnvironment {
    fn embedded_declarations(&self) -> Vec<EmbeddedDeclaration> {
        embedded_declarations()
    }

    /// No payload (a host run outside any release, such as a test binary) reads only the embedded and project
    /// declarations; a kind declared only in the payload then answers `kind-undeclared`, which names it.
    fn payload_root(&self) -> Option<PathBuf> {
        (self.payload_root)().ok()
    }

    fn record_sources(&self) -> Vec<Box<dyn RecordSource>> {
        vec![
            Box::new(ClaudeTranscriptsSource::new()),
            Box::new(RunProjectionSource::new()),
        ]
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

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn no_payload() -> Result<PathBuf, String> {
        Err("no release".to_owned())
    }

    fn a_payload() -> Result<PathBuf, String> {
        Ok(PathBuf::from("/payload"))
    }

    #[test]
    fn the_payload_tree_is_the_resolved_release_root_and_absent_when_none_resolves() {
        let found = HostRecordEnvironment {
            payload_root: a_payload,
        };
        assert_eq!(found.payload_root(), Some(PathBuf::from("/payload")));
        let missing = HostRecordEnvironment {
            payload_root: no_payload,
        };
        assert_eq!(missing.payload_root(), None);
    }

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
        let names: Vec<&str> = HostRecordEnvironment {
            payload_root: no_payload,
        }
        .embedded_declarations()
        .iter()
        .map(|d| d.label)
        .collect();
        assert_eq!(
            names,
            [
                "fgos-observe-health",
                "fgos-observe-friction",
                "fgos-observe-transcripts",
                "fgos-run-result"
            ]
        );
    }

    #[test]
    fn every_kind_a_host_record_source_states_is_declared_by_the_embedded_list() {
        let registry = crate::wiring::observe_declarations::build_registry(None, None).unwrap();
        let env = HostRecordEnvironment {
            payload_root: no_payload,
        };
        let sources = env.record_sources();
        assert!(!sources.is_empty());
        for source in &sources {
            registry.check_source_kinds(source.as_ref()).unwrap();
        }
    }

    #[test]
    fn a_source_stating_an_undeclared_kind_is_refused_by_name() {
        struct Stray;
        impl RecordSource for Stray {
            fn source_id(&self) -> &'static str {
                "stray"
            }
            fn kinds(&self) -> &[&str] {
                &["fgos.stray.kind"]
            }
            fn records(
                &self,
                _: &Path,
                _: &fgos_observe::Window,
            ) -> Result<Vec<fgos_observe::record::types::Record>, fgos_observe::SourceError>
            {
                Ok(Vec::new())
            }
        }
        let registry = crate::wiring::observe_declarations::build_registry(None, None).unwrap();
        let refusal = registry.check_source_kinds(&Stray).unwrap_err();
        assert!(refusal.contains("stray") && refusal.contains("fgos.stray.kind"));
    }
}
