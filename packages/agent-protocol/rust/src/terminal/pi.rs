use super::{ComposerState, ExitCommand, Profile};
use crate::Inspection;

/// Ctrl-D on an empty input leaves. No folder-trust dialog was observed. A
/// 4 KB typed brief takes 7 to 25 s and can lose its final Enter, so the brief
/// goes through the prompt door.
pub const PROFILE: Profile = Profile {
    cli: "pi",
    pinned_version: "1.3.0",
    exit: ExitCommand::Keys(&["C-d"]),
    enter_gap_ms: 300,
    submit_by_prompt_door: true,
    trust_markers: &[],
    start_banners: &[],
    setup_markers: &[],
    composer_state,
};

fn composer_state(_screen: &str, _inspection: &Inspection) -> ComposerState {
    ComposerState::Unknown
}
