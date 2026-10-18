use super::{ExitCommand, Profile};

/// Ctrl-D on an empty input leaves. No folder-trust dialog was observed.
pub const PROFILE: Profile = Profile {
    cli: "pi",
    exit: ExitCommand::Keys(&["C-d"]),
    enter_gap_ms: 300,
    trust_markers: &[],
};
