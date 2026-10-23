use super::{ExitCommand, Profile, StartBanner};

/// The modal start banner ("Meet Gemini ...") takes the first keystroke and `esc` closes it.
/// The ready screen's footer also says "esc to dismiss", so only the banner's title is the marker.
/// The wording is synthesized from the backlog description; a real capture with other wording
/// replaces the marker here, with no code change.
pub const PROFILE: Profile = Profile {
    cli: "agy",
    exit: ExitCommand::Text("/exit"),
    enter_gap_ms: 300,
    submit_by_prompt_door: false,
    trust_markers: &["do you trust the contents of this project"],
    start_banners: &[StartBanner { marker: "meet gemini", dismiss_key: "esc" }],
};
