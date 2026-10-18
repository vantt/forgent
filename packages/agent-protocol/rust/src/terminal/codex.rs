use super::{ExitCommand, Profile};

/// `/quit` leaves (the thread stays in codex's daemon). Text then Enter sent
/// back to back reads as a paste, so the gap before Enter is longer here.
pub const PROFILE: Profile = Profile {
    cli: "codex",
    exit: ExitCommand::Text("/quit"),
    enter_gap_ms: 600,
    trust_markers: &[
        "do you trust the contents of this directory",
        "trust this folder?",
    ],
};
