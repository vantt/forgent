use super::{ExitCommand, Profile};

/// `/quit` leaves (the thread stays in codex's daemon). Text then Enter sent
/// back to back reads as a paste, so the gap before Enter is longer here. A
/// long typed brief still loses its first Enters to the paste handling, so the
/// brief goes through the prompt door (bracketed paste plus submit) instead.
pub const PROFILE: Profile = Profile {
    cli: "codex",
    exit: ExitCommand::Text("/quit"),
    enter_gap_ms: 600,
    submit_by_prompt_door: true,
    trust_markers: &[
        "do you trust the contents of this directory",
        "trust this folder?",
    ],
    start_banners: &[],
};
