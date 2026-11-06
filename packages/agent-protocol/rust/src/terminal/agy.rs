use super::{ExitCommand, Profile, StartBanner};

/// A modal start banner takes the first keystroke and `esc` closes it: 1.4.2 announces a model
/// ("Meet Gemini ..."), 1.5.2 a plan change ("Changes to third-party model access", seen in a real
/// pane, where it swallowed the brief's Enter). The ready screen's other notices also say
/// "esc to dismiss" without holding focus, so only a banner's title is a marker.
pub const PROFILE: Profile = Profile {
    cli: "agy",
    exit: ExitCommand::Text("/exit"),
    enter_gap_ms: 300,
    submit_by_prompt_door: false,
    trust_markers: &["do you trust the contents of this project"],
    start_banners: &[
        StartBanner {
            marker: "meet gemini",
            dismiss_key: "esc",
        },
        StartBanner {
            marker: "changes to third-party model access",
            dismiss_key: "esc",
        },
    ],
    setup_markers: &[],
};
