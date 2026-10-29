// tsk-2m5: the herdr-orchestrator's own auto-launch toggles, read from the
// effective config (`fgos_config`: project file over the machine's global file over the
// bundled standard).
// This module only reads and stores the toggles — it never acts on them;
// launching a pane for an enabled toggle is the sibling launcher items'
// own footprint (tsk-2ja/tsk-57q), not this one's.

use serde::de::DeserializeOwned;
use serde::Deserialize;
use std::path::Path;

/// Fails closed by construction: every field defaults to `false`, and
/// `#[serde(default)]` means a missing individual toggle, the whole
/// section being absent, or a refused config all resolve to this same
/// all-off value — never an error surfaced to the caller.
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
        WebDashboardSettings {
            static_serving: true,
        }
    }
}

/// The `key` section of the effective config of the project at `root` (the main fgOS checkout the
/// caller already resolved, never re-resolved here). A refusal of the config, a section that does
/// not fit `T`, or an unreadable environment all resolve to `T::default()`: the documented outcome
/// of each settings type (every orchestrator toggle off, static serving on).
fn read<T: DeserializeOwned + Default>(
    root: &Path,
    key: &str,
    lookup: impl Fn(&str) -> Option<String>,
) -> T {
    fgos_config::machine::project_snapshot(root, lookup)
        .ok()
        .and_then(|snapshot| serde_json::from_value(snapshot.value[key].clone()).ok())
        .unwrap_or_default()
}

fn environment(name: &str) -> Option<String> {
    std::env::var(name).ok()
}

/// The `herdrOrchestrator` toggles, fail-closed (see `read`).
pub fn read_settings(root: &Path) -> OrchestratorSettings {
    read(root, "herdrOrchestrator", environment)
}

/// The `herdrWebDashboard` toggle; fails open (see `WebDashboardSettings`).
pub fn read_web_dashboard_settings(root: &Path) -> WebDashboardSettings {
    read(root, "herdrWebDashboard", environment)
}

#[cfg(test)]
mod tests {
    use super::*;

    /// A project at `root` and a home beside it: `files` are `(path under the temp dir, text)`.
    fn lay(
        tag: &str,
        files: &[(&str, &str)],
    ) -> (std::path::PathBuf, impl Fn(&str) -> Option<String>) {
        let dir = std::env::temp_dir().join(format!("herdr-settings-{tag}-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&dir);
        for (rel, text) in files {
            let path = dir.join(rel);
            std::fs::create_dir_all(path.parent().unwrap()).unwrap();
            std::fs::write(path, text).unwrap();
        }
        std::fs::create_dir_all(dir.join("home")).unwrap();
        let home = dir.join("home").to_string_lossy().into_owned();
        (dir.join("project"), move |name: &str| {
            (name == fgos_config::machine::HOME_VAR).then(|| home.clone())
        })
    }

    fn orchestrator(tag: &str, config: Option<&str>) -> OrchestratorSettings {
        let files: Vec<_> = config
            .map(|c| ("project/.fgos/config.yaml", c))
            .into_iter()
            .collect();
        let (root, lookup) = lay(tag, &files);
        read(&root, "herdrOrchestrator", lookup)
    }

    fn web(tag: &str, config: Option<&str>) -> WebDashboardSettings {
        let files: Vec<_> = config
            .map(|c| ("project/.fgos/config.yaml", c))
            .into_iter()
            .collect();
        let (root, lookup) = lay(tag, &files);
        read(&root, "herdrWebDashboard", lookup)
    }

    const BROKEN: &str = "herdrOrchestrator: [unclosed\n";

    #[test]
    fn settings_missing_file_defaults_every_toggle_off() {
        assert_eq!(
            orchestrator("o-missing", None),
            OrchestratorSettings::default()
        );
    }

    #[test]
    fn settings_absent_section_defaults_every_toggle_off() {
        let got = orchestrator("o-absent", Some("gateBypass:\n  level: standard\n"));
        assert_eq!(got, OrchestratorSettings::default());
    }

    #[test]
    fn settings_refused_config_defaults_every_toggle_off() {
        assert_eq!(
            orchestrator("o-broken", Some(BROKEN)),
            OrchestratorSettings::default()
        );
    }

    #[test]
    fn settings_without_home_defaults_every_toggle_off() {
        let (root, _) = lay(
            "o-nohome",
            &[(
                "project/.fgos/config.yaml",
                "herdrOrchestrator:\n  autoMerge: true\n",
            )],
        );
        let got: OrchestratorSettings = read(&root, "herdrOrchestrator", |_| None);
        assert_eq!(got, OrchestratorSettings::default());
    }

    #[test]
    fn settings_partial_section_leaves_unset_toggles_off() {
        let got = orchestrator(
            "o-partial",
            Some("herdrOrchestrator:\n  autoDiscover: true\n"),
        );
        assert!(got.auto_discover);
        assert!(!got.auto_merge && !got.auto_retro && !got.auto_cleanup);
    }

    #[test]
    fn settings_full_section_reads_every_toggle() {
        let got = orchestrator(
            "o-full",
            Some("herdrOrchestrator:\n  autoDiscover: true\n  autoMerge: true\n  autoRetro: false\n  autoCleanup: true\n"),
        );
        assert!(got.auto_discover && got.auto_merge && got.auto_cleanup);
        assert!(!got.auto_retro);
    }

    // `WebDashboardSettings` fails OPEN (static_serving defaults true), the opposite direction from
    // every `OrchestratorSettings` test above.

    #[test]
    fn web_dashboard_settings_missing_file_defaults_static_serving_on() {
        assert!(web("w-missing", None).static_serving);
    }

    #[test]
    fn web_dashboard_settings_refused_config_defaults_static_serving_on() {
        assert!(web("w-broken", Some(BROKEN)).static_serving);
    }

    #[test]
    fn web_dashboard_settings_explicit_false_is_honored() {
        let got = web(
            "w-false",
            Some("herdrWebDashboard:\n  staticServing: false\n"),
        );
        assert!(!got.static_serving);
    }

    // Reading both sections of the SAME file must not cross-wire either section's own default.
    #[test]
    fn web_dashboard_settings_and_orchestrator_settings_read_independently() {
        let config = "herdrOrchestrator:\n  autoDiscover: true\nherdrWebDashboard:\n  staticServing: false\n";
        assert!(orchestrator("both-o", Some(config)).auto_discover);
        assert!(!web("both-w", Some(config)).static_serving);
    }
}
