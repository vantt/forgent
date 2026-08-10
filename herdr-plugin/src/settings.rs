// tsk-2m5: the herdr-orchestrator's own auto-launch toggles, read from the
// shared `.fgos/config.json` (mirrors gate-bypass.mjs's own
// `config.gateBypass.level` precedent, `src/config/shared-config-file.mjs`).
// This module only reads and stores the toggles — it never acts on them;
// launching a pane for an enabled toggle is the sibling launcher items'
// own footprint (tsk-2ja/tsk-57q), not this one's.

use serde::Deserialize;
use std::path::Path;

/// Fails closed by construction: every field defaults to `false`, and
/// `#[serde(default)]` on `SharedConfig` below means a missing
/// `herdrOrchestrator` key, a missing individual toggle, or the whole
/// section being absent all resolve to this same all-off value — never a
/// deserialize error surfaced to the caller.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct OrchestratorSettings {
    pub auto_discover: bool,
    pub auto_merge: bool,
    pub auto_retro: bool,
    pub auto_cleanup: bool,
}

#[derive(Deserialize, Default)]
struct SharedConfig {
    #[serde(default, rename = "herdrOrchestrator")]
    herdr_orchestrator: OrchestratorSettings,
}

/// Parse the `herdrOrchestrator` section out of the shared config file's
/// raw contents. `None` (file did not exist / could not be read) and
/// malformed JSON both fail closed to `OrchestratorSettings::default()`
/// (every toggle off) rather than erroring — a bad or missing config file
/// must never crash the dashboard. Split out from `read_settings` below so
/// this parsing logic is unit-testable without touching the filesystem.
pub fn parse_settings(raw: Option<&str>) -> OrchestratorSettings {
    let Some(raw) = raw else {
        return OrchestratorSettings::default();
    };
    serde_json::from_str::<SharedConfig>(raw)
        .map(|config| config.herdr_orchestrator)
        .unwrap_or_default()
}

/// Read `<root>/.fgos/config.json` and return its `herdrOrchestrator`
/// toggles, fail-closed (see `parse_settings`). `root` is the main fgOS
/// checkout root the caller already resolved (`fgos::repo_root()`) — never
/// re-resolved here.
pub fn read_settings(root: &Path) -> OrchestratorSettings {
    let path = root.join(".fgos").join("config.json");
    parse_settings(std::fs::read_to_string(path).ok().as_deref())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn settings_missing_file_defaults_every_toggle_off() {
        assert_eq!(parse_settings(None), OrchestratorSettings::default());
        assert!(!parse_settings(None).auto_discover);
        assert!(!parse_settings(None).auto_merge);
        assert!(!parse_settings(None).auto_retro);
        assert!(!parse_settings(None).auto_cleanup);
    }

    #[test]
    fn settings_absent_section_defaults_every_toggle_off() {
        let got = parse_settings(Some(r#"{"gateBypass":{"level":"standard"}}"#));
        assert_eq!(got, OrchestratorSettings::default());
    }

    #[test]
    fn settings_malformed_json_does_not_panic_and_defaults_off() {
        let got = parse_settings(Some("not valid json {"));
        assert_eq!(got, OrchestratorSettings::default());
    }

    #[test]
    fn settings_partial_section_leaves_unset_toggles_off() {
        let got = parse_settings(Some(r#"{"herdrOrchestrator":{"autoDiscover":true}}"#));
        assert!(got.auto_discover);
        assert!(!got.auto_merge);
        assert!(!got.auto_retro);
        assert!(!got.auto_cleanup);
    }

    #[test]
    fn settings_full_section_reads_every_toggle() {
        let got = parse_settings(Some(
            r#"{"herdrOrchestrator":{"autoDiscover":true,"autoMerge":true,"autoRetro":false,"autoCleanup":true}}"#,
        ));
        assert!(got.auto_discover);
        assert!(got.auto_merge);
        assert!(!got.auto_retro);
        assert!(got.auto_cleanup);
    }
}
