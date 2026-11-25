use super::{ComposerState, ExitCommand, Profile};
use crate::Inspection;

/// Ctrl-D on an empty input leaves. A long paste folds into a `📄 #N`
/// attachment chip that Enter submits. No folder-trust dialog was observed.
/// A profile whose setup is older than the CLI opens a first-run setup wizard
/// (footer `Ctrl+C exit setup`) that only a person can finish.
/// The brief goes through the prompt door: a typed one is slow and a stop can
/// land mid-typing, leaving the rest in the pane shell.
pub const PROFILE: Profile = Profile {
    cli: "omp",
    pinned_version: "18.12.1",
    version_marker: None,
    exit: ExitCommand::Keys(&["C-d"]),
    enter_gap_ms: 300,
    submit_by_prompt_door: true,
    trust_markers: &[],
    start_banners: &[],
    setup_markers: &["ctrl+c exit setup"],
    composer_state,
};

fn composer_state(_screen: &str, _inspection: &Inspection) -> ComposerState {
    ComposerState::Unknown
}
