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

/// tsk-48w (D14 of docs/history/herdr-web-dashboard-plan-realignment/
/// CONTEXT.md, carrying forward D10 of the original cluster's own
/// `CONTEXT.md`): unlike `OrchestratorSettings` above, this toggle
/// deliberately fails **open** -- `static_serving` defaults `true`, not
/// `false`. The four orchestrator toggles are launchers with no
/// demonstrated-safe default; this one is "does the machine already
/// running the gateway also serve the web bundle it already carries",
/// which the cluster's own product decision wants ON out of the box so
/// the dashboard needs no setup step. Do not copy this file's neighbor
/// pattern here without re-reading D10 -- the two toggles have opposite
/// safe defaults on purpose.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct WebDashboardSettings {
    pub static_serving: bool,
}

impl Default for WebDashboardSettings {
    fn default() -> Self {
        WebDashboardSettings { static_serving: true }
    }
}

#[derive(Deserialize, Default)]
struct SharedConfig {
    #[serde(default, rename = "herdrOrchestrator")]
    herdr_orchestrator: OrchestratorSettings,
    #[serde(default, rename = "herdrWebDashboard")]
    herdr_web_dashboard: WebDashboardSettings,
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

/// Parse the `herdrWebDashboard` section out of the shared config file's
/// raw contents. `None` and malformed JSON both resolve to
/// `WebDashboardSettings::default()` -- `static_serving: true` (see the
/// struct's own doc comment for why this is the opposite failure mode
/// from `parse_settings` above).
pub fn parse_web_dashboard_settings(raw: Option<&str>) -> WebDashboardSettings {
    let Some(raw) = raw else {
        return WebDashboardSettings::default();
    };
    serde_json::from_str::<SharedConfig>(raw)
        .map(|config| config.herdr_web_dashboard)
        .unwrap_or_default()
}

/// Read `<root>/.fgos/config.json` and return its `herdrWebDashboard`
/// toggle. `root` is the main fgOS checkout root the caller already
/// resolved -- never re-resolved here.
pub fn read_web_dashboard_settings(root: &Path) -> WebDashboardSettings {
    let path = root.join(".fgos").join("config.json");
    parse_web_dashboard_settings(std::fs::read_to_string(path).ok().as_deref())
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

    // tsk-48w: WebDashboardSettings fails OPEN (static_serving defaults
    // true) -- the opposite direction from every OrchestratorSettings test
    // above, so each of these asserts `true`/`!false` where the sibling
    // tests above assert the opposite.

    #[test]
    fn web_dashboard_settings_missing_file_defaults_static_serving_on() {
        assert!(parse_web_dashboard_settings(None).static_serving);
    }

    #[test]
    fn web_dashboard_settings_absent_section_defaults_static_serving_on() {
        let got = parse_web_dashboard_settings(Some(r#"{"gateBypass":{"level":"standard"}}"#));
        assert!(got.static_serving);
    }

    #[test]
    fn web_dashboard_settings_malformed_json_does_not_panic_and_defaults_on() {
        let got = parse_web_dashboard_settings(Some("not valid json {"));
        assert!(got.static_serving);
    }

    #[test]
    fn web_dashboard_settings_explicit_false_is_honored() {
        let got = parse_web_dashboard_settings(Some(r#"{"herdrWebDashboard":{"staticServing":false}}"#));
        assert!(!got.static_serving);
    }

    #[test]
    fn web_dashboard_settings_explicit_true_round_trips() {
        let got = parse_web_dashboard_settings(Some(r#"{"herdrWebDashboard":{"staticServing":true}}"#));
        assert!(got.static_serving);
    }

    // Cross-check: reading `herdrOrchestrator`/`herdrWebDashboard` from the
    // SAME config file must not cross-wire either section's own default.
    #[test]
    fn web_dashboard_settings_and_orchestrator_settings_read_independently() {
        let raw = r#"{"herdrOrchestrator":{"autoDiscover":true},"herdrWebDashboard":{"staticServing":false}}"#;
        assert!(parse_settings(Some(raw)).auto_discover);
        assert!(!parse_web_dashboard_settings(Some(raw)).static_serving);
    }
}
